#!/usr/bin/env node

/**
 * Script d'amélioration de la recherche BIP
 * - Crée des questions basées sur les fiches BIP
 * - Teste la recherche via sommaireUnifie
 * - Améliore les mots clés pour les prochaines recherches
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Importer les index
const bipIndexPath = path.join(__dirname, '../src/data/bip-index.ts');
const sommaireUnifieFile = fs.readFileSync(path.join(__dirname, '../src/data/sommaireUnifie.ts'), 'utf-8');

// Parser les fiches BIP du fichier TypeScript
function parseBipIndex() {
  const content = fs.readFileSync(bipIndexPath, 'utf-8');
  
  // Extraire les fiches BIP du fichier TypeScript
  const fiches = [];
  const ficheRegex = /{\s*code:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"[\s\S]*?content:\s*"([^"]*)"[\s\S]*?motsCles:\s*\[([\s\S]*?)\]/g;
  
  let match;
  let count = 0;
  while ((match = ficheRegex.exec(content)) && count < 50) {
    const code = match[1];
    const title = match[2];
    const contentPreview = match[3].substring(0, 200);
    const mots = match[4].match(/"([^"]+)"/g)?.map(m => m.replace(/"/g, '')) || [];
    
    fiches.push({ code, title, contentPreview, mots });
    count++;
  }
  
  return fiches;
}

// Fonction de recherche simple dans le sommaire
function searchInSommaire(question) {
  const words = question.toLowerCase().split(/\s+/);
  const scores = new Map();
  
  // Analyser le fichier sommaireUnifie pour trouver les sections pertinentes
  const titleMatches = sommaireUnifieFile.match(/titre:\s*'([^']+)'/g) || [];
  const resumeMatches = sommaireUnifieFile.match(/resume:\s*'([^']+)'/g) || [];
  const motsClesMatches = sommaireUnifieFile.match(/motsCles:\s*\[([\s\S]*?)\]/g) || [];
  
  // Chercher les mots de la question dans les sections
  const matchedSections = [];
  
  titleMatches.forEach((titleMatch, idx) => {
    const title = titleMatch.replace(/titre:\s*'/, '').replace(/'$/, '');
    let score = 0;
    
    words.forEach(word => {
      if (title.toLowerCase().includes(word)) score += 3;
    });
    
    if (score > 0) {
      matchedSections.push({
        title,
        score,
        source: 'title'
      });
    }
  });
  
  resumeMatches.forEach((resumeMatch, idx) => {
    const resume = resumeMatch.replace(/resume:\s*'/, '').replace(/'$/, '');
    let score = 0;
    
    words.forEach(word => {
      if (resume.toLowerCase().includes(word)) score += 2;
    });
    
    if (score > 0) {
      matchedSections.push({
        resume,
        score,
        source: 'resume'
      });
    }
  });
  
  return matchedSections.sort((a, b) => b.score - a.score).slice(0, 3);
}

// Créer des questions basées sur les fiches BIP
function generateQuestions(fiches) {
  const questions = [];
  const topicQuestions = {
    'congé': [
      'Combien de jours de congés annuels?',
      'Qu\'est-ce que le congé de longue maladie?',
      'Durée du congé de longue maladie?',
      'Comment demander un congé?',
      'RTT c\'est quoi?',
      'Congé rapproché durée?',
      'Congé sans solde comment ça marche?',
      'Jours fériés et congés?'
    ],
    'maladie': [
      'Congé de longue maladie durée?',
      'Que faire en cas de maladie?',
      'Rémunération pendant un arrêt maladie?',
      'Comment signaler une maladie?',
      'Droits en cas de longue maladie?',
      'Congé ordinaire maladie?',
      'Contrôle médical absence?',
      'Indemnités coordonnées maladie?'
    ],
    'accident': [
      'Accident de travail procédure?',
      'Accident de trajet couvert?',
      'Déclaration accident comment faire?',
      'Rémunération accident du travail?',
      'Accident de service définition?',
      'Maladie imputable au service?',
      'Accident trajet domicile travail?',
      'Certificat accident qui demander?'
    ],
    'teletravail': [
      'Qu\'est-ce que le télétravail?',
      'Télétravail conditions?',
      'Matériel télétravail qui fournit?',
      'Télétravail obligatoire?',
      'Lieu télétravail accepté?',
      'Télétravail jours par semaine?'
    ],
    'formation': [
      'Formation professionnelle accès?',
      'Congé formation durée?',
      'Formation continue disponible?',
      'Comment demander une formation?',
      'Bilan de compétences comment faire?'
    ],
    'RIFSEEP': [
      'RIFSEEP qu\'est-ce que c\'est?',
      'RIFSEEP comment ça fonctionne?',
      'Prime RIFSEEP montant?',
      'Grille RIFSEEP?',
      'RIFSEEP agents contractuels?'
    ],
    'temps': [
      'Durée légale du travail?',
      'Horaires de travail flexibles?',
      'Pause déjeuner durée?',
      'Temps partiel comment demander?',
      'Réduction du temps de travail?'
    ]
  };
  
  // Ajouter des questions génériques
  Object.values(topicQuestions).forEach(topicQuest => {
    questions.push(...topicQuest);
  });
  
  return questions.slice(0, 30);
}

// Analyser les résultats et proposer des améliorations
function analyzeResults(testResults) {
  const improvements = [];
  let successCount = 0;
  let totalCount = 0;
  
  testResults.forEach((result, idx) => {
    totalCount++;
    const { question, found, matches } = result;
    
    if (!found || matches.length === 0) {
      const words = question.toLowerCase().match(/\b\w+\b/g) || [];
      improvements.push({
        question,
        issue: 'Aucun résultat trouvé',
        suggestedKeywords: words.filter(w => w.length > 3),
        index: idx
      });
    } else {
      successCount++;
    }
  });
  
  return {
    successRate: (successCount / totalCount * 100).toFixed(2),
    totalTests: totalCount,
    successCount,
    improvements
  };
}

// Fonction principale
async function main() {
  console.log('🔍 Script d\'amélioration de la recherche BIP\n');
  console.log('='.repeat(60));
  
  // Charger les fiches BIP
  const fiches = parseBipIndex();
  console.log(`✓ Chargé ${fiches.length} fiches BIP`);
  console.log(`✓ Sommaire unifié disponible`);
  
  // Générer les questions
  const questions = generateQuestions(fiches);
  console.log(`✓ Généré ${questions.length} questions de test\n`);
  
  console.log('📋 QUESTIONS DE TEST:\n');
  
  const testResults = [];
  
  // Tester chaque question
  questions.forEach((question, idx) => {
    const matches = searchInSommaire(question);
    const found = matches.length > 0;
    
    console.log(`${idx + 1}. "${question}"`);
    
    if (found) {
      console.log(`   ✓ Trouvé dans: ${matches[0].title || matches[0].resume}`);
      console.log(`   Score: ${matches[0].score}`);
    } else {
      console.log(`   ✗ AUCUN RÉSULTAT`);
    }
    console.log();
    
    testResults.push({ 
      question, 
      found,
      matches 
    });
  });
  
  // Analyser les résultats
  const analysis = analyzeResults(testResults);
  
  console.log('='.repeat(60));
  console.log('\n📊 RÉSULTATS DE L\'ANALYSE:\n');
  console.log(`Taux de succès: ${analysis.successRate}%`);
  console.log(`Réussis: ${analysis.successCount}/${analysis.totalTests}`);
  console.log(`Échoués: ${analysis.totalTests - analysis.successCount}/${analysis.totalTests}\n`);
  
  if (analysis.improvements.length > 0) {
    console.log('💡 PROPOSITIONS D\'AMÉLIORATION:\n');
    
    analysis.improvements.slice(0, 10).forEach((improvement) => {
      console.log(`Q${improvement.index + 1}: "${improvement.question}"`);
      console.log(`   Mots-clés suggérés: ${improvement.suggestedKeywords.join(', ')}`);
      console.log();
    });
  }
  
  // Créer un rapport détaillé
  const reportPath = path.join(__dirname, '../bip-search-analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: analysis.totalTests,
      successCount: analysis.successCount,
      failureCount: analysis.totalTests - analysis.successCount,
      successRate: `${analysis.successRate}%`
    },
    testResults: testResults.map((r, idx) => ({
      questionNumber: idx + 1,
      question: r.question,
      found: r.found,
      matchedResult: r.matches[0]?.title || r.matches[0]?.resume || null,
      score: r.matches[0]?.score || 0
    })),
    recommendations: analysis.improvements.slice(0, 10).map(imp => ({
      question: imp.question,
      suggestedKeywords: imp.suggestedKeywords,
      priority: 'high'
    }))
  }, null, 2));
  
  console.log(`\n📄 Rapport détaillé sauvegardé: ${reportPath}`);
  
  // Suggestions finales
  console.log('\n' + '='.repeat(60));
  console.log('\n🎯 RECOMMANDATIONS POUR AMÉLIORATIONS:\n');
  console.log('1. Enrichir les mots-clés des fiches BIP avec des variantes');
  console.log('2. Ajouter des synonymes (ex: "CLM", "congé longue maladie")');
  console.log('3. Créer des correspondances entre domaines (ex: "prime" ↔ "RIFSEEP")');
  console.log('4. Améliorer l\'algorithme de recherche avec fuzzy matching');
  console.log('5. Ajouter des métadonnées de catégories aux sections\n');
}

main().catch(console.error);
