#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const sommairePath = path.join(repoRoot, 'src/data/sommaireUnifie.ts');
const bipIndexPath = path.join(repoRoot, 'src/data/bip-index.ts');
const outputDir = path.join(repoRoot, 'DataAnalysisExpert');
const outputJsonPath = path.join(outputDir, 'search-e2e-report.json');
const outputMdPath = path.join(outputDir, 'search-e2e-report.md');

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_MODEL = process.env.PERPLEXITY_MODEL || 'sonar';
const NOT_FOUND_PATTERNS = [
  'je ne trouve pas',
  'pas cette information',
  'pas trouvé',
  'aucune information',
  'documents internes',
  'contactez la cfdt',
];

const SEARCH_STOPWORDS = new Set([
  'de', 'du', 'des', 'le', 'la', 'les', 'un', 'une', 'et', 'ou', 'en', 'au', 'aux', 'a', 'à',
  'd', 'l', 'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles', 'mon', 'ma', 'mes',
  'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'ce', 'cet', 'cette', 'ces', 'dans', 'sur', 'pour',
  'par', 'avec', 'sans', 'que', 'qui', 'quoi', 'combien', 'est', 'suis', 'etre', 'être', 'avoir',
  'puis', 'donc', 'car', 'mais', 'si', 'quand', 'comme', 'plus', 'moins', 'tres', 'très', 'cela',
  'ca', 'ça', 'dois', 'doit', 'peux', 'peut', 'comment', 'quel', 'quelle', 'quels', 'quelles',
]);

const SEARCH_SYNONYMS = {
  maladie: ['cmo', 'arret', 'arrêt', 'conge', 'congé'],
  cmo: ['maladie', 'arret', 'arrêt', 'ordinaire'],
  remuneration: ['rémunération', 'salaire', 'traitement', 'paie', 'payer', 'paye', 'payee'],
  salaire: ['rémunération', 'traitement', 'paie', 'payer'],
  payer: ['rémunération', 'traitement', 'salaire', 'paie'],
  conge: ['congé', 'absence', 'arret', 'arrêt'],
  absence: ['conge', 'congé', 'arret', 'arrêt'],
  formation: ['cnfpt', 'stage', 'concours', 'examen'],
  teletravail: ['télétravail', 'distance', 'remote'],
  prime: ['ifse', 'cia', 'indemnite', 'indemnité'],
  accident: ['service', 'trajet', 'maladie', 'professionnelle'],
};

const E2E_QUESTIONS = [
  {
    question: 'En congés de maladie ordinaire je suis payé combien ?',
    expectedKeywords: ['90', 'demi-traitement', '3 mois', '9 mois', 'rémunération'],
  },
  {
    question: 'Combien de jours pour un déménagement ?',
    expectedKeywords: ['1 jour', 'déménagement', 'semaine'],
  },
  {
    question: 'Quelle est la durée du congé de longue maladie ?',
    expectedKeywords: ['3 ans', 'longue maladie', 'plein traitement', 'demi-traitement'],
  },
  {
    question: 'Accident de service : quelle procédure de déclaration ?',
    expectedKeywords: ['48h', '15 jours', 'déclaration', 'certificat'],
  },
  {
    question: 'Quels sont les jours de congés annuels ?',
    expectedKeywords: ['congés annuels', 'jours', 'acquisition'],
  },
  {
    question: 'Télétravail : qui fournit le matériel ?',
    expectedKeywords: ['matériel', 'équipement', 'collectivité', 'télétravail'],
  },
  {
    question: 'Comment demander une formation CNFPT ?',
    expectedKeywords: ['formation', 'cnfpt', 'demande', 'validation'],
  },
  {
    question: 'Comment fonctionne le CIA ?',
    expectedKeywords: ['cia', 'prime', 'montant', 'critères'],
  },
  {
    question: 'Quelles sont les règles du jour de carence en CMO ?',
    expectedKeywords: ['carence', 'cmo', 'jour', 'maladie'],
  },
  {
    question: 'Puis-je cumuler télétravail et arrêt maladie ?',
    expectedKeywords: ['arrêt maladie', 'télétravail', 'conditions'],
  },
];

function normalizeForSearch(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeForSearch(value, minLength = 3) {
  return normalizeForSearch(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= minLength && !SEARCH_STOPWORDS.has(token));
}

function expandKeywords(keywords) {
  const expanded = new Set();

  keywords.forEach((keyword) => {
    const normalizedKeyword = normalizeForSearch(keyword);
    if (!normalizedKeyword) return;

    expanded.add(normalizedKeyword);

    Object.entries(SEARCH_SYNONYMS).forEach(([base, synonyms]) => {
      const normalizedBase = normalizeForSearch(base);
      if (normalizedKeyword.includes(normalizedBase) || normalizedBase.includes(normalizedKeyword)) {
        expanded.add(normalizedBase);
        synonyms.forEach((syn) => expanded.add(normalizeForSearch(syn)));
      }
    });
  });

  return Array.from(expanded).filter(Boolean);
}

function scoreTextByKeywords(text, keywords) {
  if (!text || keywords.length === 0) return 0;
  const normalizedText = normalizeForSearch(text);
  return keywords.reduce((score, keyword) => (
    normalizedText.includes(keyword) ? score + 1 : score
  ), 0);
}

function safeExtractArray(content, exportName) {
  const exportRegex = new RegExp(`export\\s+const\\s+${exportName}(?:\\s*:[^=]+)?\\s*=\\s*\\[`, 'm');
  const match = exportRegex.exec(content);
  if (!match || typeof match.index !== 'number') return '';

  const start = match.index;
  const bracketOffset = match[0].lastIndexOf('[');
  const bracketStart = bracketOffset >= 0 ? start + bracketOffset : -1;
  if (bracketStart === -1) return '';

  let idx = bracketStart + 1;
  let depth = 1;
  while (idx < content.length && depth > 0) {
    const char = content[idx];
    if (char === '[') depth += 1;
    if (char === ']') depth -= 1;
    idx += 1;
  }

  if (depth !== 0) return '';
  return content.slice(bracketStart + 1, idx - 1);
}

function parseStringField(block, fieldName) {
  const regex = new RegExp(`${fieldName}:\\s*'([^']*)'|${fieldName}:\\s*"([^"]*)"`);
  const match = block.match(regex);
  return (match && (match[1] || match[2])) || '';
}

function parseNumberField(block, fieldName) {
  const regex = new RegExp(`${fieldName}:\\s*(\\d+)`);
  const match = block.match(regex);
  return match ? Number(match[1]) : null;
}

function parseArrayField(block, fieldName) {
  const regex = new RegExp(`${fieldName}:\\s*\\[([\\s\\S]*?)\\]`);
  const match = block.match(regex);
  if (!match) return [];
  const inner = match[1];
  const items = inner.match(/'([^']*)'|"([^"]*)"/g) || [];
  return items
    .map((entry) => entry.replace(/^['"]|['"]$/g, '').trim())
    .filter(Boolean);
}

function splitObjectBlocks(arraySource) {
  const blocks = [];
  let depth = 0;
  let current = '';
  let inObject = false;

  for (let i = 0; i < arraySource.length; i += 1) {
    const char = arraySource[i];

    if (char === '{') {
      depth += 1;
      inObject = true;
    }

    if (inObject) current += char;

    if (char === '}') {
      depth -= 1;
      if (depth === 0 && inObject) {
        blocks.push(current);
        current = '';
        inObject = false;
      }
    }
  }

  return blocks;
}

function parseSommaireEntries() {
  const raw = fs.readFileSync(sommairePath, 'utf-8');
  const arraySource = safeExtractArray(raw, 'sommaireUnifie');
  const blocks = splitObjectBlocks(arraySource);

  return blocks.map((block) => ({
    id: parseStringField(block, 'id'),
    titre: parseStringField(block, 'titre'),
    resume: parseStringField(block, 'resume'),
    source: parseStringField(block, 'source'),
    chapitre: parseNumberField(block, 'chapitre'),
    motsCles: parseArrayField(block, 'motsCles'),
  })).filter((entry) => entry.id && entry.titre);
}

function parseBipEntries(limit = 220) {
  const raw = fs.readFileSync(bipIndexPath, 'utf-8');
  const arraySource = safeExtractArray(raw, 'bipIndex');
  const blocks = splitObjectBlocks(arraySource).slice(0, limit);

  return blocks.map((block) => ({
    code: parseStringField(block, 'code'),
    title: parseStringField(block, 'title'),
    section: parseStringField(block, 'section'),
    content: parseStringField(block, 'content'),
    motsCles: parseArrayField(block, 'motsCles'),
  })).filter((entry) => entry.code && entry.title);
}

function scoreSommaire(keywords, sommaireEntries) {
  const scored = sommaireEntries.map((entry) => {
    const titleScore = scoreTextByKeywords(entry.titre, keywords);
    const resumeScore = scoreTextByKeywords(entry.resume || '', keywords);
    const kwScore = scoreTextByKeywords(entry.motsCles.join(' '), keywords);

    const score = (titleScore * 5) + (resumeScore * 3) + (kwScore * 2);
    return {
      id: entry.id,
      titre: entry.titre,
      source: entry.source,
      chapitre: entry.chapitre,
      resume: entry.resume,
      score,
    };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

function scoreBip(keywords, bipEntries) {
  const scored = bipEntries.map((entry) => {
    const titleScore = scoreTextByKeywords(entry.title, keywords);
    const sectionScore = scoreTextByKeywords(entry.section || '', keywords);
    const kwScore = scoreTextByKeywords((entry.motsCles || []).join(' '), keywords);
    const contentScore = scoreTextByKeywords(entry.content || '', keywords);

    const score = (titleScore * 6) + (sectionScore * 3) + (kwScore * 2) + contentScore;

    return {
      code: entry.code,
      title: entry.title,
      section: entry.section,
      content: entry.content,
      score,
    };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function buildContext(topSommaire, topBip) {
  const sommairePart = topSommaire
    .map((entry, idx) => (`[Sommaire ${idx + 1}] ${entry.id} - ${entry.titre}\nRésumé: ${entry.resume || 'N/A'}`))
    .join('\n\n');

  const bipPart = topBip
    .map((entry, idx) => (`[BIP ${idx + 1}] ${entry.code} - ${entry.title}\nSection: ${entry.section}\nExtrait: ${(entry.content || '').slice(0, 400)}`))
    .join('\n\n');

  return `${sommairePart}\n\n${bipPart}`.trim();
}

async function generateAnswer(question, contextText) {
  if (!PERPLEXITY_API_KEY) {
    return {
      skipped: true,
      reason: 'PERPLEXITY_API_KEY missing',
      answer: '',
    };
  }

  const systemPrompt = `
Tu es conseiller CFDT Gennevilliers.
Réponds uniquement avec la documentation fournie.
Sois précis (chiffres, délais, conditions), en français clair.
Si l'information est absente, réponds exactement:
"Je ne trouve pas cette information dans nos documents internes. Contactez la CFDT au 01 40 85 64 64."

DOCUMENTATION:
${contextText}
`.trim();

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: PERPLEXITY_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      temperature: 0.1,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const raw = await response.text();
    return {
      skipped: true,
      reason: `Perplexity API error ${response.status}: ${raw.slice(0, 200)}`,
      answer: '',
    };
  }

  const json = await response.json();
  const answer = json?.choices?.[0]?.message?.content || '';

  return {
    skipped: false,
    reason: null,
    answer,
  };
}

function evaluateAnswer(answer, expectedKeywords) {
  const normalizedAnswer = normalizeForSearch(answer);
  const expected = expectedKeywords.map(normalizeForSearch).filter(Boolean);
  const matchedExpected = expected.filter((keyword) => normalizedAnswer.includes(keyword));

  const isNotFound = NOT_FOUND_PATTERNS.some((pattern) => normalizedAnswer.includes(normalizeForSearch(pattern)));

  const keywordRecall = expected.length > 0
    ? Number((matchedExpected.length / expected.length).toFixed(2))
    : 0;

  return {
    isNotFound,
    expectedKeywords,
    matchedExpected,
    keywordRecall,
  };
}

function summarize(results) {
  const total = results.length;
  const retrievalCoverage = results.filter(r => r.hasAnyContext).length;

  const generationAttempted = results.filter(r => !r.generation.skipped).length;
  const generationNotFound = results.filter(r => !r.generation.skipped && r.generationEval.isNotFound).length;
  const generationNotFoundRate = generationAttempted > 0
    ? Number(((generationNotFound / generationAttempted) * 100).toFixed(2))
    : null;

  const avgKeywordRecall = generationAttempted > 0
    ? Number((results
      .filter(r => !r.generation.skipped)
      .reduce((sum, item) => sum + item.generationEval.keywordRecall, 0) / generationAttempted).toFixed(2))
    : null;

  return {
    totalQuestions: total,
    retrievalCoverage,
    retrievalCoveragePct: Number(((retrievalCoverage / total) * 100).toFixed(2)),
    generationAttempted,
    generationNotFound,
    generationNotFoundRate,
    avgKeywordRecall,
  };
}

function toMarkdown(report) {
  const lines = [];
  lines.push('# Search E2E Report');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Model: ${report.model}`);
  lines.push(`Generation enabled: ${report.generationEnabled ? 'yes' : 'no'}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Questions: ${report.summary.totalQuestions}`);
  lines.push(`- Retrieval coverage: ${report.summary.retrievalCoverage}/${report.summary.totalQuestions} (${report.summary.retrievalCoveragePct}%)`);
  if (report.summary.generationAttempted > 0) {
    lines.push(`- Generation attempted: ${report.summary.generationAttempted}`);
    lines.push(`- Not-found responses: ${report.summary.generationNotFound} (${report.summary.generationNotFoundRate}%)`);
    lines.push(`- Average expected-keyword recall: ${report.summary.avgKeywordRecall}`);
  } else {
    lines.push('- Generation attempted: 0 (missing key or API error)');
  }

  lines.push('');
  lines.push('## Per question');
  lines.push('');

  report.results.forEach((result, idx) => {
    lines.push(`### ${idx + 1}. ${result.question}`);
    lines.push(`- Context found: ${result.hasAnyContext ? 'yes' : 'no'}`);
    lines.push(`- Top sommaire: ${result.topSommaire[0] ? `[${result.topSommaire[0].id}] ${result.topSommaire[0].titre}` : 'none'}`);
    lines.push(`- Top BIP: ${result.topBip[0] ? `${result.topBip[0].code} - ${result.topBip[0].title}` : 'none'}`);

    if (result.generation.skipped) {
      lines.push(`- Generation: skipped (${result.generation.reason})`);
    } else {
      lines.push(`- Not-found pattern: ${result.generationEval.isNotFound ? 'yes' : 'no'}`);
      lines.push(`- Expected keyword recall: ${result.generationEval.keywordRecall}`);
      lines.push(`- Matched expected: ${result.generationEval.matchedExpected.join(', ') || 'none'}`);
    }

    lines.push('');
  });

  return lines.join('\n');
}

async function main() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const sommaireEntries = parseSommaireEntries();
  const bipEntries = parseBipEntries();

  const results = [];

  for (const item of E2E_QUESTIONS) {
    const baseKeywords = tokenizeForSearch(item.question);
    const expandedKeywords = expandKeywords(baseKeywords);

    const topSommaire = scoreSommaire(expandedKeywords, sommaireEntries);
    const topBip = scoreBip(expandedKeywords, bipEntries);
    const hasAnyContext = topSommaire.length > 0 || topBip.length > 0;

    const contextText = buildContext(topSommaire, topBip);
    const generation = await generateAnswer(item.question, contextText);

    const generationEval = generation.skipped
      ? { isNotFound: false, expectedKeywords: item.expectedKeywords, matchedExpected: [], keywordRecall: 0 }
      : evaluateAnswer(generation.answer, item.expectedKeywords);

    results.push({
      question: item.question,
      expandedKeywords,
      hasAnyContext,
      topSommaire,
      topBip,
      generation,
      generationEval,
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    model: PERPLEXITY_MODEL,
    generationEnabled: Boolean(PERPLEXITY_API_KEY),
    sources: {
      sommairePath,
      bipIndexPath,
    },
    parsed: {
      sommaireEntries: sommaireEntries.length,
      bipEntries: bipEntries.length,
    },
    summary: summarize(results),
    results,
  };

  fs.writeFileSync(outputJsonPath, JSON.stringify(report, null, 2), 'utf-8');
  fs.writeFileSync(outputMdPath, toMarkdown(report), 'utf-8');

  console.log('✅ E2E report generated');
  console.log(`- JSON: ${outputJsonPath}`);
  console.log(`- MD:   ${outputMdPath}`);
  console.log('');
  console.log(`Retrieval coverage: ${report.summary.retrievalCoverage}/${report.summary.totalQuestions} (${report.summary.retrievalCoveragePct}%)`);

  if (report.summary.generationAttempted > 0) {
    console.log(`Not-found rate: ${report.summary.generationNotFoundRate}%`);
    console.log(`Avg expected keyword recall: ${report.summary.avgKeywordRecall}`);
  } else {
    console.log('Generation skipped (PERPLEXITY_API_KEY missing or API unreachable).');
  }
}

main().catch((error) => {
  console.error('❌ E2E evaluation failed:', error);
  process.exitCode = 1;
});
