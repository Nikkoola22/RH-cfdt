#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const sommairePath = path.join(repoRoot, 'src/data/sommaireUnifie.ts');
const bipIndexPath = path.join(repoRoot, 'src/data/bip-index.ts');
const outputDir = path.join(repoRoot, 'DataAnalysisExpert');
const outputJsonPath = path.join(outputDir, 'search-regression-report.json');
const outputMdPath = path.join(outputDir, 'search-regression-report.md');

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

const TEST_QUESTIONS = [
  'Combien de jours de congés annuels ?',
  'Quelle est la durée du congé maladie ordinaire ?',
  'En congés de maladie ordinaire je suis payé combien ?',
  'Que faire en cas de maladie ?',
  'Accident de service : procédure de déclaration ?',
  'Accident de trajet : suis-je couvert ?',
  'Comment demander un temps partiel ?',
  'Quelles sont les conditions du télétravail ?',
  'Matériel télétravail : qui fournit ?',
  'Comment demander une formation CNFPT ?',
  'Quels sont les droits en CLM ?',
  'Quelle rémunération en CLD ?',
  'Comment fonctionne la prime IFSE ?',
  'Comment est calculé le CIA ?',
  'Déménagement : ai-je droit à une autorisation d’absence ?',
  'Rentrée scolaire : quelle absence possible ?',
  'Quelles règles pour le jour de carence ?',
  'Comment fonctionne la contre-visite en arrêt maladie ?',
  'Congé de proche aidant : conditions ?',
  'Puis-je cumuler télétravail et arrêt maladie ?'
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

function parseBipEntries(limit = 600) {
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

function scoreSommaire(question, keywords, sommaireEntries) {
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
      score,
    };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

function scoreBip(question, keywords, bipEntries) {
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
      score,
    };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function buildQuestionReport(question, sommaireEntries, bipEntries) {
  const baseKeywords = tokenizeForSearch(question);
  const expandedKeywords = expandKeywords(baseKeywords);

  const topSommaire = scoreSommaire(question, expandedKeywords, sommaireEntries);
  const topBip = scoreBip(question, expandedKeywords, bipEntries);

  return {
    question,
    keywords: expandedKeywords,
    sommaireMatches: topSommaire,
    bipMatches: topBip,
    hasSommaireContext: topSommaire.length > 0,
    hasBipContext: topBip.length > 0,
    hasAnyContext: topSommaire.length > 0 || topBip.length > 0,
  };
}

function buildSummary(perQuestion) {
  const total = perQuestion.length;
  const withSommaire = perQuestion.filter((q) => q.hasSommaireContext).length;
  const withBip = perQuestion.filter((q) => q.hasBipContext).length;
  const withAny = perQuestion.filter((q) => q.hasAnyContext).length;

  return {
    totalQuestions: total,
    withSommaireContext: withSommaire,
    withBipContext: withBip,
    withAnyContext: withAny,
    noContext: total - withAny,
    coverageAnyPct: Number(((withAny / total) * 100).toFixed(2)),
    coverageSommairePct: Number(((withSommaire / total) * 100).toFixed(2)),
    coverageBipPct: Number(((withBip / total) * 100).toFixed(2)),
  };
}

function toMarkdownReport(summary, perQuestion) {
  const lines = [];
  lines.push('# Search Regression Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Total questions: ${summary.totalQuestions}`);
  lines.push(`- Any context found: ${summary.withAnyContext}/${summary.totalQuestions} (${summary.coverageAnyPct}%)`);
  lines.push(`- Sommaire context: ${summary.withSommaireContext}/${summary.totalQuestions} (${summary.coverageSommairePct}%)`);
  lines.push(`- BIP context: ${summary.withBipContext}/${summary.totalQuestions} (${summary.coverageBipPct}%)`);
  lines.push(`- No context: ${summary.noContext}`);
  lines.push('');
  lines.push('## Per question');
  lines.push('');

  perQuestion.forEach((item, idx) => {
    lines.push(`### ${idx + 1}. ${item.question}`);
    lines.push(`- Keywords: ${item.keywords.join(', ') || '(none)'}`);
    lines.push(`- Sommaire matches: ${item.sommaireMatches.length}`);
    lines.push(`- BIP matches: ${item.bipMatches.length}`);

    if (item.sommaireMatches.length > 0) {
      const topSommaire = item.sommaireMatches[0];
      lines.push(`- Top sommaire: [${topSommaire.id}] ${topSommaire.titre} (score ${topSommaire.score})`);
    }

    if (item.bipMatches.length > 0) {
      const topBip = item.bipMatches[0];
      lines.push(`- Top BIP: ${topBip.code} - ${topBip.title} (score ${topBip.score})`);
    }

    if (!item.hasAnyContext) {
      lines.push('- Status: NO CONTEXT');
    }

    lines.push('');
  });

  return lines.join('\n');
}

function main() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const sommaireEntries = parseSommaireEntries();
  const bipEntries = parseBipEntries();

  const perQuestion = TEST_QUESTIONS.map((question) => (
    buildQuestionReport(question, sommaireEntries, bipEntries)
  ));

  const summary = buildSummary(perQuestion);

  const jsonReport = {
    generatedAt: new Date().toISOString(),
    sources: {
      sommairePath,
      bipIndexPath,
    },
    parsed: {
      sommaireEntries: sommaireEntries.length,
      bipEntries: bipEntries.length,
    },
    summary,
    perQuestion,
  };

  fs.writeFileSync(outputJsonPath, JSON.stringify(jsonReport, null, 2), 'utf-8');
  fs.writeFileSync(outputMdPath, toMarkdownReport(summary, perQuestion), 'utf-8');

  console.log('✅ Search regression report generated');
  console.log(`- JSON: ${outputJsonPath}`);
  console.log(`- MD:   ${outputMdPath}`);
  console.log('');
  console.log(`Coverage (any context): ${summary.withAnyContext}/${summary.totalQuestions} (${summary.coverageAnyPct}%)`);
  console.log(`No context questions: ${summary.noContext}`);
}

main();
