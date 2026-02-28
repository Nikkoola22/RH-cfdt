import fs from 'fs';

const raw = fs.readFileSync('src/data/bip-index.ts', 'utf8');
const entryRegex = /\{\s*code:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"[\s\S]*?url:\s*"([^"]+)"[\s\S]*?section:\s*"([^"]+)"[\s\S]*?content:\s*"([\s\S]*?)"[\s\S]*?motsCles:\s*\[([\s\S]*?)\]\s*\}/g;

function normalizeText(value) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function countUniqueMatches(text, keywords) {
  const normalized = normalizeText(text);
  let count = 0;
  keywords.forEach((keyword) => {
    if (normalized.includes(keyword)) count += 1;
  });
  return count;
}

const INTENT_RULES = [
  { triggerKeywords: ['conge', 'absence', 'rtt', 'ferie', 'vacance'], targetSections: ['conges-et-absences', 'conges-absences'] },
  { triggerKeywords: ['maladie', 'arret', 'indemnite', 'inaptitude', 'medical', 'sante'], targetSections: ['indisponibilite-physique-et-securite-sociale', 'conges-et-absences'] },
  { triggerKeywords: ['accident', 'trajet', 'service', 'professionnelle'], targetSections: ['indisponibilite-physique-et-securite-sociale'] },
  { triggerKeywords: ['discipline', 'sanction', 'blame', 'licenciement', 'faute'], targetSections: ['discipline2', 'agents-contractuels'] },
  { triggerKeywords: ['teletravail', 'horaire', 'temps', 'travail'], targetSections: ['conditions-d-exercice-des-fonctions-et-duree-du-travail'] },
  { triggerKeywords: ['carriere', 'avancement', 'promotion', 'titularisation', 'mobilite'], targetSections: ['carriere'] },
];

function computeIntentBoost(queryKeywords, sectionText, titleText) {
  let boost = 0;
  const normalizedSection = normalizeText(sectionText);
  const normalizedTitle = normalizeText(titleText);

  INTENT_RULES.forEach((rule) => {
    const active = rule.triggerKeywords.some((trigger) =>
      queryKeywords.some((keyword) => keyword.includes(trigger) || trigger.includes(keyword))
    );

    if (!active) return;

    const sectionMatch = rule.targetSections.some((target) =>
      normalizedSection.includes(normalizeText(target))
    );

    if (sectionMatch) {
      boost += 5;
      return;
    }

    const titleMatch = rule.triggerKeywords.some((trigger) => normalizedTitle.includes(trigger));
    if (titleMatch) boost += 2;
  });

  return boost;
}

const entries = [];
let match;
while ((match = entryRegex.exec(raw)) !== null) {
  const mots = (match[6].match(/"([^"]+)"/g) || []).map((m) => m.slice(1, -1));
  entries.push({
    code: match[1],
    title: match[2],
    url: match[3],
    section: match[4],
    content: match[5],
    motsCles: mots,
  });
}

function scoreEntry(entry, queryKeywords, withIntent) {
  const titleMatches = countUniqueMatches(entry.title, queryKeywords);
  const sectionMatches = countUniqueMatches(entry.section, queryKeywords);
  const contentMatches = countUniqueMatches(entry.content, queryKeywords);
  const keywordMatches = entry.motsCles
    .map((value) => normalizeText(value))
    .filter((value) => queryKeywords.some((keyword) => value.includes(keyword) || keyword.includes(value))).length;

  let score = titleMatches * 6 + sectionMatches * 3 + contentMatches * 2 + keywordMatches * 2;
  if (withIntent) score += computeIntentBoost(queryKeywords, entry.section, entry.title);
  if (normalizeText(entry.content).includes('no content available')) score -= 5;

  const minSignal = titleMatches > 0 || sectionMatches > 0 || contentMatches >= 2 || keywordMatches > 0;
  return { score, minSignal };
}

function dedupe(items) {
  const seen = new Set();
  const output = [];

  items.forEach((item) => {
    const key = normalizeText(item.url) || normalizeText(item.code) || normalizeText(item.title);
    if (!key || seen.has(key)) return;
    seen.add(key);
    output.push(item);
  });

  return output;
}

function search(question, withIntent) {
  const queryKeywords = normalizeText(question).split(/\s+/).filter((word) => word.length > 2);

  const scored = entries
    .map((entry) => {
      const { score, minSignal } = scoreEntry(entry, queryKeywords, withIntent);
      return { ...entry, score, minSignal };
    })
    .filter((entry) => entry.minSignal && entry.score >= 2)
    .sort((a, b) => b.score - a.score);

  return dedupe(scored).slice(0, 3).map((entry) => ({
    title: entry.title,
    section: entry.section,
    score: entry.score,
  }));
}

const questions = [
  'Combien de jours de congés annuels ?',
  'Rémunération pendant un arrêt maladie ?',
  'Accident de trajet domicile travail ?',
  'Sanction disciplinaire agent contractuel ?',
  'Conditions du télétravail ?',
  'Avancement de grade comment ça marche ?',
  'Droits en congé longue maladie ?',
  'Procédure de licenciement pour faute ?',
  'Temps partiel thérapeutique conditions ?',
  'Promotion interne fonction publique territoriale ?',
];

const report = [];
for (const question of questions) {
  const before = search(question, false);
  const after = search(question, true);
  const changed = JSON.stringify(before) !== JSON.stringify(after);
  report.push({ question, changed, before, after });
}

const changedCount = report.filter((item) => item.changed).length;

console.log('=== Benchmark précision top-3 (avant/après boost intention) ===\n');
report.forEach((item) => {
  const beforeTop = item.before[0];
  const afterTop = item.after[0];
  console.log(`Q: ${item.question}`);
  console.log(`  Avant #1: ${beforeTop ? `${beforeTop.title} [${beforeTop.section}] (${beforeTop.score})` : '—'}`);
  console.log(`  Après #1: ${afterTop ? `${afterTop.title} [${afterTop.section}] (${afterTop.score})` : '—'} ${item.changed ? '⬆︎' : '='}`);
  if (item.changed) {
    console.log(`  Après top3: ${item.after.map((entry) => `${entry.title} (${entry.section})`).join(' | ')}`);
  }
  console.log('');
});

console.log(`Questions avec changement de classement: ${changedCount}/${report.length}`);

fs.writeFileSync(
  'DataAnalysisExpert/benchmark-intent-precision-report.json',
  JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      changedCount,
      total: report.length,
      results: report,
    },
    null,
    2
  )
);

console.log('\nRapport JSON: DataAnalysisExpert/benchmark-intent-precision-report.json');
