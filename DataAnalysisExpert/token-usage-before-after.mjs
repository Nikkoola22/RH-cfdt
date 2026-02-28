import { chapitres } from '../src/data/temps.ts';
import { formation } from '../src/data/formation.ts';
import { teletravailData } from '../src/data/teletravail.ts';
import { sommaireUnifie } from '../src/data/sommaireUnifie.ts';
import { searchFichesByKeywordsAsync } from '../src/utils/ficheSearch.ts';

const QUESTIONS = [
  'Combien de jours de congés annuels ?',
  'Rémunération pendant un arrêt maladie ?',
  'Sanction disciplinaire agent contractuel ?',
  'Conditions du télétravail ?',
  'Promotion interne fonction publique territoriale ?'
];

const mockHistory = [
  { type: 'user', content: 'Bonjour, je suis agent territorial.', timestamp: new Date() },
  { type: 'assistant', content: 'Bonjour, je peux vous aider sur vos droits, congés et carrière.', timestamp: new Date() },
  { type: 'user', content: 'Je veux comprendre mes droits en cas de maladie longue.', timestamp: new Date() },
  { type: 'assistant', content: 'Je peux préciser selon fonctionnaire ou contractuel.', timestamp: new Date() },
  { type: 'user', content: 'Je suis fonctionnaire.', timestamp: new Date() },
  { type: 'assistant', content: 'Parfait, je prends ce cadre.', timestamp: new Date() },
];

function normalizeText(value) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function truncateText(text, maxChars) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, maxChars)}…`;
}

function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

function extractRelevantSnippet(rawContent, keywords, maxChars) {
  const cleaned = (rawContent || '')
    .replace(/Télécharger\s+Imprimer\s+Ajouter\s+S'abonner/gi, '')
    .replace(/No content available/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  const normalizedKeywords = keywords.map((k) => normalizeText(k)).filter((k) => k.length > 2);

  const scored = sentences.map((sentence) => {
    const lower = normalizeText(sentence);
    const score = normalizedKeywords.reduce((sum, keyword) => (
      lower.includes(keyword) ? sum + 1 : sum
    ), 0);
    return { sentence, score };
  });

  const best = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(({ sentence }) => sentence)
    .join(' ');

  return truncateText(best || cleaned, maxChars);
}

function extractRelevantPassages(rawText, keywords, maxPassages, maxPassageChars) {
  const cleaned = (rawText || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';

  const chunks = cleaned
    .split(/\n{2,}|(?<=[.!?])\s+/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 30);

  const normalizedKeywords = keywords.map((k) => normalizeText(k)).filter((k) => k.length > 2);

  const scored = chunks.map((chunk) => {
    const lower = normalizeText(chunk);
    const score = normalizedKeywords.reduce((sum, keyword) => (
      lower.includes(keyword) ? sum + 1 : sum
    ), 0);
    return { chunk, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPassages)
    .map(({ chunk }) => truncateText(chunk, maxPassageChars))
    .join(' | ');
}

function selectSectionsHeuristic(question) {
  const q = normalizeText(question);
  const words = q.split(/\s+/).filter((w) => w.length > 2);

  const scored = sommaireUnifie.map((section) => {
    const text = normalizeText(`${section.titre} ${section.resume || ''} ${(section.motsCles || []).join(' ')}`);
    const score = words.reduce((sum, word) => (text.includes(word) ? sum + 1 : sum), 0);
    return { id: section.id, source: section.source, chapitre: section.chapitre, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.id);
}

function buildSommaireContentBefore(sectionIds) {
  const chapters = new Set();
  let addFormation = false;
  let addTeletravail = false;

  sectionIds.forEach((id) => {
    const sec = sommaireUnifie.find((s) => s.id === id);
    if (!sec) return;
    if (sec.source === 'temps' && sec.chapitre) chapters.add(sec.chapitre);
    if (sec.source === 'formation') addFormation = true;
    if (sec.source === 'teletravail') addTeletravail = true;
  });

  let content = '';
  chapters.forEach((ch) => {
    content += `\n\n=== CHAPITRE ${ch} ===\n${(chapitres[ch] || '')}`;
  });
  if (addFormation) content += `\n\n=== RÈGLEMENT FORMATION ===\n${formation || ''}`;
  if (addTeletravail) content += `\n\n=== PROTOCOLE TÉLÉTRAVAIL ===\n${typeof teletravailData === 'string' ? teletravailData : JSON.stringify(teletravailData)}`;

  return truncateText(content, 5000);
}

function buildSommaireContentAfter(sectionIds, questionKeywords) {
  const chapters = new Set();
  let addFormation = false;
  let addTeletravail = false;

  sectionIds.forEach((id) => {
    const sec = sommaireUnifie.find((s) => s.id === id);
    if (!sec) return;
    if (sec.source === 'temps' && sec.chapitre) chapters.add(sec.chapitre);
    if (sec.source === 'formation') addFormation = true;
    if (sec.source === 'teletravail') addTeletravail = true;
  });

  let content = '';
  chapters.forEach((ch) => {
    const passage = extractRelevantPassages(chapitres[ch] || '', questionKeywords, 2, 260);
    if (passage) content += `\n\n=== CHAPITRE ${ch} ===\n${passage}`;
  });
  if (addFormation) {
    const passage = extractRelevantPassages(formation || '', questionKeywords, 2, 260);
    if (passage) content += `\n\n=== RÈGLEMENT FORMATION ===\n${passage}`;
  }
  if (addTeletravail) {
    const rawTele = typeof teletravailData === 'string' ? teletravailData : JSON.stringify(teletravailData);
    const passage = extractRelevantPassages(rawTele, questionKeywords, 2, 260);
    if (passage) content += `\n\n=== PROTOCOLE TÉLÉTRAVAIL ===\n${passage}`;
  }

  return truncateText(content, 2800);
}

async function buildBipContent(question, mode) {
  const keywords = normalizeText(question).split(/\s+/).filter((w) => w.length > 2);
  const { results } = await searchFichesByKeywordsAsync(keywords);
  const maxSources = mode === 'before' ? 5 : 3;
  const maxSnippetChars = mode === 'before' ? 600 : 280;
  const maxTotal = mode === 'before' ? 3000 : 1500;

  if (!results || results.length === 0) return '';

  let out = 'ÉLÉMENTS PERTINENTS TROUVÉS DANS LES DOCUMENTS:\n';
  results.slice(0, maxSources).forEach((fiche, index) => {
    const title = ('title' in fiche ? fiche.title : fiche.titre) || '';
    const category = ('section' in fiche ? fiche.section : fiche.categorie) || '';
    const content = 'content' in fiche ? fiche.content : '';
    const snippet = extractRelevantSnippet(content, keywords, maxSnippetChars);
    const kw = Array.isArray(fiche.motsCles) ? fiche.motsCles.slice(0, mode === 'before' ? 12 : 8).join(', ') : '';

    out += `\n[Source ${index + 1}] ${title}\n`;
    out += `Section/Catégorie: ${category}\n`;
    if (snippet) out += `${mode === 'before' ? 'Contenu' : 'Extrait'}: ${snippet}\n`;
    if (kw) out += `Mots-clés: ${kw}\n`;
    out += '---\n';
  });

  return truncateText(out, maxTotal);
}

function buildSystemPrompt(mode, contenuFinal) {
  const longPrompt = `
👤 RÔLE : Tu es un Représentant CFDT pour la Mairie de Gennevilliers.
RÈGLES STRICTES :
1. Réponds UNIQUEMENT avec les documents fournis
2. N'utilise pas de connaissances externes
3. Sois précis sur chiffres/délais
4. Ton syndical professionnel et clair
Si information absente, réponds exactement:
"Je ne trouve pas cette information dans nos documents internes. Contactez la CFDT au 01 40 85 64 64."
DOCUMENTATION:
${contenuFinal}
`;

  const shortPrompt = `
Tu es conseiller CFDT Gennevilliers.
Réponds uniquement avec la documentation fournie.
Sois précis (chiffres, délais, conditions), en français clair.
Si information absente, réponds exactement:
"Je ne trouve pas cette information dans nos documents internes. Contactez la CFDT au 01 40 85 64 64."
DOCUMENTATION:
${contenuFinal}
`;

  return mode === 'before' ? longPrompt : shortPrompt;
}

function buildHistory(mode) {
  if (mode === 'before') {
    return mockHistory.slice(-6).map((m) => ({ role: m.type, content: truncateText(m.content, 500) }));
  }

  const user = mockHistory
    .filter((m) => m.type === 'user')
    .slice(-4)
    .map((m) => ({ role: m.type, content: truncateText(m.content, 280) }));
  const assistant = mockHistory
    .filter((m) => m.type === 'assistant')
    .slice(-1)
    .map((m) => ({ role: m.type, content: truncateText(m.content, 180) }));

  return [...assistant, ...user];
}

async function estimateForQuestion(question) {
  const sectionIds = selectSectionsHeuristic(question);
  const keywords = normalizeText(question).split(/\s+/).filter((w) => w.length > 2);

  const bipBefore = await buildBipContent(question, 'before');
  const bipAfter = await buildBipContent(question, 'after');

  const sommaireBefore = buildSommaireContentBefore(sectionIds);
  const sommaireAfter = buildSommaireContentAfter(sectionIds, keywords);

  const finalBefore = truncateText(`${bipBefore}\n\n${sommaireBefore}`, 8000);
  const finalAfter = truncateText(`${bipAfter}\n\n${sommaireAfter}`, 5500);

  const payloadBefore = JSON.stringify({
    system: buildSystemPrompt('before', finalBefore),
    history: buildHistory('before'),
    question,
  });

  const payloadAfter = JSON.stringify({
    system: buildSystemPrompt('after', finalAfter),
    history: buildHistory('after'),
    question,
  });

  const tokensBefore = estimateTokens(payloadBefore);
  const tokensAfter = estimateTokens(payloadAfter);

  return {
    question,
    tokensBefore,
    tokensAfter,
    saved: tokensBefore - tokensAfter,
    savedPct: Number((((tokensBefore - tokensAfter) / tokensBefore) * 100).toFixed(1)),
  };
}

const results = [];
for (const question of QUESTIONS) {
  results.push(await estimateForQuestion(question));
}

const totalBefore = results.reduce((sum, r) => sum + r.tokensBefore, 0);
const totalAfter = results.reduce((sum, r) => sum + r.tokensAfter, 0);
const totalSaved = totalBefore - totalAfter;
const totalSavedPct = Number(((totalSaved / totalBefore) * 100).toFixed(1));

console.log('\n=== Estimation tokens avant/après (5 questions) ===\n');
results.forEach((r) => {
  console.log(`- ${r.question}`);
  console.log(`  Avant: ${r.tokensBefore} | Après: ${r.tokensAfter} | Gain: ${r.saved} (${r.savedPct}%)`);
});

console.log('\n--- Global ---');
console.log(`Avant total: ${totalBefore}`);
console.log(`Après total: ${totalAfter}`);
console.log(`Gain total: ${totalSaved} (${totalSavedPct}%)`);

const report = {
  timestamp: new Date().toISOString(),
  method: 'estimation chars/4, simulation pipeline before/after',
  totals: { before: totalBefore, after: totalAfter, saved: totalSaved, savedPct: totalSavedPct },
  results,
};

fs.writeFileSync('DataAnalysisExpert/token-usage-before-after-report.json', JSON.stringify(report, null, 2));
console.log('\nRapport: DataAnalysisExpert/token-usage-before-after-report.json\n');
