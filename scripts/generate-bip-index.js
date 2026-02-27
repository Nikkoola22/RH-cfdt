/**
 * Generate BIP Index from Markdown Files
 * 
 * Reads all markdown files from src/data/bip/output/ and generates
 * a TypeScript index file with BipFiche objects containing actual content excerpts.
 * 
 * Usage: node scripts/generate-bip-index.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BIP_OUTPUT_DIR = path.join(__dirname, '../src/data/bip/output');
const OUTPUT_FILE = path.join(__dirname, '../src/data/bip-index.ts');

/**
 * Recursively find all markdown files in a directory
 */
function findMarkdownFiles(dir) {
  let files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        files = files.concat(findMarkdownFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err.message);
  }
  return files;
}

/**
 * Extract code from markdown filename
 * Example: "cadres-d-emplois_cadres-d-emplois-generalites_cadcaa.md" -> "cadcaa"
 */
function extractCodeFromFilename(filePath) {
  const filename = path.basename(filePath, '.md');
  const parts = filename.split('_');
  return parts[parts.length - 1] || 'unknown';
}

/**
 * Parse markdown metadata block
 * Returns { url, section, date }
 */
function parseMetadata(content) {
  const lines = content.split('\n').slice(0, 10);
  const metadata = {
    url: '',
    section: '',
    date: ''
  };

  for (const line of lines) {
    if (line.includes('**URL:**')) {
      metadata.url = line.replace('**URL:**', '').trim();
    } else if (line.includes('**Section:**')) {
      metadata.section = line.replace('**Section:**', '').trim();
    } else if (line.includes('**Date:**')) {
      metadata.date = line.replace('**Date:**', '').trim();
    }
  }

  return metadata;
}

/**
 * Extract title from first # heading
 */
function extractTitle(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('# ')) {
      return line.replace(/^#+\s+/, '').trim();
    }
  }
  return 'Untitled';
}

/**
 * Extract content excerpt (first 500 chars after ## Contenu)
 */
function extractContentExcerpt(content) {
  const contentMatch = content.match(/## Contenu\s*\n([\s\S]*?)(?:Fiches en référence|Textes en référence)/);
  if (contentMatch) {
    let excerpt = contentMatch[1]
      .split('\n')
      .filter(line => line.trim().length > 0)
      .join(' ')
      .trim()
      .substring(0, 500)
      .trim();
    return excerpt + '...';
  }
  return 'No content available';
}

/**
 * Generate intelligent keywords from content
 * Extracts section titles, key terms, abbreviations, and concepts
 */
function generateKeywords(title, section, content) {
  const stopWords = new Set([
    'le', 'la', 'les', 'des', 'de', 'et', 'ou', 'un', 'une', 'à', 'au', 'en', 'est', 'du', 'par', 'pour',
    'que', 'qui', 'ce', 'cette', 'ces', 'avec', 'dans', 'sur', 'dans', 'il', 'elle', 'se', 'son', 'sa',
    'son', 'ses', 'ainsi', 'donc', 'toutefois', 'cependant', 'ailleurs', 'notamment', 'sauf', 'cas',
    'titre', 'article', 'section', 'fiche', 'référence', 'texte', 'voir', 'code', 'arrêté', 'décret',
    'circulaire', 'instruction', 'réponse', 'ministérielle', 'ministériel', 'ministère', 'questions',
    'écrite', 'pénale', 'procédure', 'civil', 'civil', 'applicable', 'prévoit', 'concerne', 'permet',
    'accord', 'autorité', 'agent', 'agents', 'public', 'publique', 'collectivité', 'collectivités',
    'territorial', 'territoriales', 'fonctionnaire', 'fonctionnaires', 'service', 'services', 'emploi',
    'emplois', 'travail', 'travaux', 'activité', 'activités', 'durée', 'période', 'temps', 'jour',
    'jours', 'ans', 'an', 'mois', 'semaine', 'jours', 'date', 'dates', 'exercice', 'exercer'
  ]);

  const keywords = new Map(); // keyword -> frequency

  // 1. Extract from title (high weight)
  const titleTerms = title
    .toLowerCase()
    .replace(/[()\/\-_:]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
  
  titleTerms.forEach(w => {
    keywords.set(w, (keywords.get(w) || 0) + 3); // Higher weight for title terms
  });

  // 2. Extract from section (medium weight)
  const sectionTerms = section
    .toLowerCase()
    .replace(/[()\/\-_:]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
  
  sectionTerms.forEach(w => {
    keywords.set(w, (keywords.get(w) || 0) + 2);
  });

  // 3. Extract section headers (I., II., III., etc.)
  const sectionHeaders = content.match(/^[IVX]+\.\s+([^\n]+)/gm) || [];
  sectionHeaders.forEach(header => {
    const headerText = header.replace(/^[IVX]+\.\s+/, '').toLowerCase();
    const headerTerms = headerText
      .split(/[\s\-_():,]/g)
      .filter(w => w.length > 2 && !stopWords.has(w) && !/^\d+$/.test(w));
    
    headerTerms.forEach(w => {
      keywords.set(w, (keywords.get(w) || 0) + 2);
    });
  });

  // 4. Extract codes in uppercase (COLOMA, COLODU, etc.)
  const codes = content.match(/\b([A-Z]{3,})\b/g) || [];
  codes.forEach(code => {
    if (code.length <= 8 && code !== 'VOIR' && code !== 'FICHES') {
      keywords.set(code.toLowerCase(), (keywords.get(code.toLowerCase()) || 0) + 2);
    }
  });

  // 5. Extract important multi-word terms
  const multiTerms = [
    'longue maladie', 'longue durée', 'congé', 'congés', 'absence', 'absences',
    'rémunération', 'salaire', 'traitement', 'indemnité', 'prime', 'primes',
    'maladie', 'maladies', 'santé', 'médical', 'médicale', 'arrêt', 'arrêts',
    'discipline', 'disciplinaire', 'sanction', 'sanctions', 'licenciement',
    'recrutement', 'recrutements', 'candidat', 'candidats', 'concours',
    'carrière', 'promotion', 'avancement', 'mutation', 'mutations',
    'formation', 'formations', 'apprentissage', 'contrat', 'contrats',
    'grève', 'grèves', 'syndical', 'syndicale', 'représentant', 'représentants',
    'élection', 'élections', 'vote', 'votes', 'comité', 'comités',
    'congé maternité', 'congé paternité', 'congé parental', 'congé sabbatique',
    'télétravail', 'télétravail', 'temps partiel', 'temps plein',
    'prime ancienneté', 'treizième mois', 'gratification', 'indemnité maladie',
    'responsabilité', 'faute', 'fautes', 'négligence', 'privation', 'inaptitude',
    'obligation', 'obligation de réserve', 'neutralité', 'confidentialité',
    'accident travail', 'accident du travail', 'maladie professionnelle',
    'handicap', 'handicapé', 'accessibilité', 'aménagement'
  ];

  multiTerms.forEach(term => {
    if (content.toLowerCase().includes(term)) {
      const termKey = term.replace(/\s+/g, ' ');
      keywords.set(termKey, (keywords.get(termKey) || 0) + 3);
    }
  });

  // 6. Extract frequent words from content (excluding common words)
  const contentWords = content
    .toLowerCase()
    .replace(/[()\/\-_:.,;!?]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w) && !/^\d+$/.test(w) && !w.includes("'"));

  // Count word frequency
  const wordFreq = {};
  contentWords.forEach(w => {
    wordFreq[w] = (wordFreq[w] || 0) + 1;
  });

  // Add frequent words with weight
  Object.entries(wordFreq)
    .filter(([w, freq]) => freq >= 3) // Only words appearing 3+ times
    .forEach(([w, freq]) => {
      keywords.set(w, (keywords.get(w) || 0) + Math.min(freq, 3)); // Cap at 3
    });

  // Sort by frequency and take top 25
  const sorted = Array.from(keywords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([word]) => word);

  // Deduplicate and filter out very short/generic terms
  const unique = [...new Set(sorted)].filter(w => w.length > 2 && !stopWords.has(w));

  return unique.slice(0, 20); // Return top 20 keywords
}

/**
 * Parse a single markdown file and return BipFiche object
 */
function parseMarkdownFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const code = extractCodeFromFilename(filePath);
    const title = extractTitle(content);
    const metadata = parseMetadata(content);
    const excerpt = extractContentExcerpt(content);
    const keywords = generateKeywords(title, metadata.section, content);
    const relativeFromOutput = path.relative(BIP_OUTPUT_DIR, filePath).replace(/\\/g, '/');
    const localPath = `/bip/output/${relativeFromOutput}`;

    return {
      code,
      title,
      url: metadata.url,
      localPath,
      section: metadata.section,
      timestamp: metadata.date,
      source: 'bip',
      type: metadata.section || 'general',
      content: excerpt,
      motsCles: keywords
    };
  } catch (err) {
    console.error(`Error parsing ${filePath}:`, err.message);
    return null;
  }
}

/**
 * Generate TypeScript file content
 */
function generateTypeScriptFile(fiches) {
  const header = `/**
 * BIP Index - Generated from markdown files
 * 
 * This file contains the index of BIP fiches with content excerpts.
 * Generated on: ${new Date().toISOString()}
 * Total fiches: ${fiches.length}
 * 
 * DO NOT EDIT MANUALLY - Regenerate with: node scripts/generate-bip-index.js
 */

export interface BipFicheIndex {
  code: string;
  title: string;
  url: string;
  localPath: string;
  section: string;
  timestamp: string;
  source: string;
  type: string;
  content: string;
  motsCles: string[];
}

// Backwards compatibility alias
export type FicheIndexEntry = BipFicheIndex & {
  titre?: string;
  categorie?: string;
};

export const bipIndex: BipFicheIndex[] = [`;

  const entries = fiches.map(fiche => {
    const motsClesStr = JSON.stringify(fiche.motsCles);
    return `  {
    code: "${fiche.code}",
    title: ${JSON.stringify(fiche.title)},
    url: "${fiche.url}",
    localPath: "${fiche.localPath}",
    section: "${fiche.section}",
    timestamp: "${fiche.timestamp}",
    source: "bip",
    type: "${fiche.type}",
    content: ${JSON.stringify(fiche.content)},
    motsCles: ${motsClesStr}
  }`;
  }).join(',\n');

  const footer = `
  ];

  // Backwards compatibility: export as ficheIndex
  export const ficheIndex = bipIndex as unknown as FicheIndexEntry[];

  export default bipIndex;
  `;

  return header + '\n' + entries + footer;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Scanning for markdown files in:', BIP_OUTPUT_DIR);
  
  const markdownFiles = findMarkdownFiles(BIP_OUTPUT_DIR);
  console.log(`✓ Found ${markdownFiles.length} markdown files`);

  if (markdownFiles.length === 0) {
    console.error('❌ No markdown files found!');
    process.exit(1);
  }

  console.log('\n📄 Parsing markdown files...');
  const fiches = [];
  let parsed = 0;
  let failed = 0;

  for (const filePath of markdownFiles) {
    const fiche = parseMarkdownFile(filePath);
    if (fiche) {
      fiches.push(fiche);
      parsed++;
      if (parsed % 30 === 0) {
        console.log(`  ... parsed ${parsed}/${markdownFiles.length}`);
      }
    } else {
      failed++;
    }
  }

  console.log(`✓ Successfully parsed ${parsed} fiches (${failed} failed)`);

  console.log('\n📝 Generating TypeScript file...');
  const typeScriptContent = generateTypeScriptFile(fiches);

  console.log(`\n✍️  Writing to ${OUTPUT_FILE}`);
  fs.writeFileSync(OUTPUT_FILE, typeScriptContent, 'utf-8');

  console.log(`\n✅ SUCCESS!`);
  console.log(`   Generated ${fiches.length} BIP fiche entries`);
  console.log(`   File size: ${(typeScriptContent.length / 1024).toFixed(2)} KB`);
  console.log(`\n📌 Next steps:`);
  console.log(`   1. Run: npm run build`);
  console.log(`   2. Run: npm run dev`);
  console.log(`   3. Test search with queries like "sanction" or "congé"`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
