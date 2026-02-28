import fs from 'fs';

const QUESTIONS = [
  'Combien de jours de congés annuels ?',
  'Rémunération pendant un arrêt maladie ?',
  'Sanction disciplinaire agent contractuel ?',
  'Conditions du télétravail ?',
  'Promotion interne fonction publique territoriale ?'
];

const APP_TEXT = fs.readFileSync('src/App.tsx', 'utf8');
const BIP_INDEX_TEXT = fs.readFileSync('src/data/bip-index.ts', 'utf8');
const SOMMAIRE_TEXT = fs.readFileSync('src/data/sommaireUnifie.ts', 'utf8');
const TEMPS_TEXT = fs.readFileSync('src/data/temps.ts', 'utf8');
const FORMATION_TEXT = fs.readFileSync('src/data/formation.ts', 'utf8');
const TELETRAVAIL_TEXT = fs.readFileSync('src/data/teletravail.ts', 'utf8');

function normalizeText(value) {
  return (value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function truncateText(text, maxChars) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, maxChars)}…`;
}

function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

function extractEntriesFromBipIndex() {
  const entries = [];
  const entryRegex = /\{\s*code:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"[\s\S]*?section:\s*"([^"]+)"[\s\S]*?content:\s*"([\s\S]*?)"[\s\S]*?motsCles:\s*\[([\s\S]*?)\]\s*\}/g;
  let match;
  while ((match = entryRegex.exec(BIP_INDEX_TEXT)) !== null) {
    const mots = (match[5].match(/"([^"]+)"/g) || []).map((m) => m.slice(1, -1));
    entries.push({ title: match[2], section: match[3], content: match[4], motsCles: mots });
  }
  return entries;
}

function extractSommaireItems() {
  const items = [];
  const itemRegex = /id:\s*'([^']+)'[\s\S]*?titre:\s*'([^']+)'[\s\S]*?resume:\s*'([^']*)'[\s\S]*?motsCles:\s*\[([\s\S]*?)\]/g;
  let match;
  while ((match = itemRegex.exec(SOMMAIRE_TEXT)) !== null) {
    const mots = (match[4].match(/'([^']+)'/g) || []).map((m) => m.slice(1, -1));
    items.push({ id: match[1], titre: match[2], resume: match[3], motsCles: mots });
  }
  return items;
}

function countMatchScore(text, keywords) {
  const normalized = normalizeText(text);
  return keywords.reduce((sum, keyword) => (normalized.includes(keyword) ? sum + 1 : sum), 0);
}

function extractRelevantSnippet(rawContent, keywords, maxChars) {
  const cleaned = (rawContent || '')
    .replace(/Télécharger\s+Imprimer\s+Ajouter\s+S'abonner/gi, '')
    .replace(/No content available/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  const chunks = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  const scored = chunks.map((chunk) => ({ chunk, score: countMatchScore(chunk, keywords) }));
  const top = scored.sort((a, b) => b.score - a.score).slice(0, 2).map((x) => x.chunk).join(' ');
  return truncateText(top || cleaned, maxChars);
}

function buildBipContext(question, mode, entries) {
  const keywords = normalizeText(question).split(/\s+/).filter((w) => w.length > 2);
  const scored = entries
    .map((entry) => ({
      ...entry,
      score:
        countMatchScore(entry.title, keywords) * 6 +
        countMatchScore(entry.section, keywords) * 3 +
        countMatchScore(entry.content, keywords) * 2 +
        (entry.motsCles || []).filter((k) => keywords.some((w) => normalizeText(k).includes(w))).length * 2,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const maxSources = mode === 'before' ? 5 : 3;
  const maxSnippetChars = mode === 'before' ? 600 : 280;
  const maxTotalChars = mode === 'before' ? 3000 : 1500;

  let context = 'ÉLÉMENTS PERTINENTS TROUVÉS DANS LES DOCUMENTS:\n';
  scored.slice(0, maxSources).forEach((entry, index) => {
    context += `\n[Source ${index + 1}] ${entry.title}\n`;
    context += `Section/Catégorie: ${entry.section}\n`;
    context += `${mode === 'before' ? 'Contenu' : 'Extrait'}: ${extractRelevantSnippet(entry.content, keywords, maxSnippetChars)}\n`;
    context += `Mots-clés: ${(entry.motsCles || []).slice(0, mode === 'before' ? 12 : 8).join(', ')}\n---\n`;
  });

  return truncateText(context, maxTotalChars);
}

function buildSommaireContext(question, mode, sommaireItems) {
  const keywords = normalizeText(question).split(/\s+/).filter((w) => w.length > 2);
  const compactItems = sommaireItems
    .map((item) => ({
      ...item,
      score: countMatchScore(`${item.titre} ${item.resume} ${(item.motsCles || []).join(' ')}`, keywords),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  if (mode === 'before') {
    const heavy = `${TEMPS_TEXT}\n\n${FORMATION_TEXT}\n\n${TELETRAVAIL_TEXT}`;
    return truncateText(heavy, 5000);
  }

  const compact = compactItems
    .map((item) => `[${item.id}] ${item.titre} - ${truncateText(item.resume || (item.motsCles || []).slice(0, 6).join(', '), 120)}`)
    .join('\n');

  return truncateText(compact, 2800);
}

function getPromptSize(mode) {
  const before = `👤 RÔLE : Tu es un Représentant CFDT pour la Mairie de Gennevilliers.\nRÈGLES STRICTES détaillées...`;
  const after = `Tu es conseiller CFDT Gennevilliers. Réponds uniquement avec la documentation fournie.`;
  return mode === 'before' ? before : after;
}

function getHistorySize(mode) {
  const beforeHistory = [
    'Bonjour, je suis agent territorial.',
    'Bonjour, je peux vous aider sur vos droits, congés et carrière.',
    'Je veux comprendre mes droits en cas de maladie longue.',
    'Je peux préciser selon fonctionnaire ou contractuel.',
    'Je suis fonctionnaire.',
    'Parfait, je prends ce cadre.',
  ].map((x) => truncateText(x, 500)).join('\n');

  const afterHistory = [
    truncateText('Je peux préciser selon fonctionnaire ou contractuel.', 180),
    truncateText('Bonjour, je suis agent territorial.', 280),
    truncateText('Je veux comprendre mes droits en cas de maladie longue.', 280),
    truncateText('Je suis fonctionnaire.', 280),
  ].join('\n');

  return mode === 'before' ? beforeHistory : afterHistory;
}

async function main() {
  const entries = extractEntriesFromBipIndex();
  const sommaireItems = extractSommaireItems();

  const results = [];

  for (const question of QUESTIONS) {
    const beforePayload = JSON.stringify({
      prompt: getPromptSize('before'),
      bip: buildBipContext(question, 'before', entries),
      sommaire: buildSommaireContext(question, 'before', sommaireItems),
      history: getHistorySize('before'),
      question,
    });

    const afterPayload = JSON.stringify({
      prompt: getPromptSize('after'),
      bip: buildBipContext(question, 'after', entries),
      sommaire: buildSommaireContext(question, 'after', sommaireItems),
      history: getHistorySize('after'),
      question,
    });

    const beforeTokens = estimateTokens(beforePayload);
    const afterTokens = estimateTokens(afterPayload);

    results.push({
      question,
      beforeTokens,
      afterTokens,
      gain: beforeTokens - afterTokens,
      gainPct: Number((((beforeTokens - afterTokens) / beforeTokens) * 100).toFixed(1)),
    });
  }

  const totalBefore = results.reduce((sum, item) => sum + item.beforeTokens, 0);
  const totalAfter = results.reduce((sum, item) => sum + item.afterTokens, 0);
  const totalGain = totalBefore - totalAfter;
  const totalGainPct = Number(((totalGain / totalBefore) * 100).toFixed(1));

  console.log('\n=== Estimation tokens avant/après (5 questions) ===\n');
  results.forEach((item) => {
    console.log(`- ${item.question}`);
    console.log(`  Avant: ${item.beforeTokens} | Après: ${item.afterTokens} | Gain: ${item.gain} (${item.gainPct}%)`);
  });
  console.log('\n--- Global ---');
  console.log(`Avant total: ${totalBefore}`);
  console.log(`Après total: ${totalAfter}`);
  console.log(`Gain total: ${totalGain} (${totalGainPct}%)`);

  const report = {
    timestamp: new Date().toISOString(),
    method: 'estimation chars/4, simulation avant/après sans import TS runtime',
    totals: {
      before: totalBefore,
      after: totalAfter,
      gain: totalGain,
      gainPct: totalGainPct,
    },
    results,
  };

  fs.writeFileSync('DataAnalysisExpert/token-usage-before-after-report.json', JSON.stringify(report, null, 2));
  console.log('\nRapport: DataAnalysisExpert/token-usage-before-after-report.json\n');
}

main();
