#!/usr/bin/env node

/**
 * Script d'enrichissement des mots-clés BIP
 * Améliore les mots-clés existants avec des synonymes et variantes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const bipIndexPath = path.join(__dirname, '../src/data/bip-index.ts');

// Dictionnaire de synonymes et variantes pour améliorer la recherche
const synonymMap = {
  // Congés
  'congé': ['absence', 'repos', 'permission', 'break'],
  'congé maladie': ['arrêt maladie', 'CLM', 'COMAOR', 'arrêt', 'absence maladie'],
  'congé de longue maladie': ['CLM', 'longue maladie', 'COLOMA', 'congé maladie prolongé'],
  'congé maternité': ['maternité', 'congé parental', 'naissance', 'adoption'],
  'congé formation': ['formation professionnelle', 'bilan compétences', 'reconversion'],
  'RTT': ['réduction repos', 'jour de repos', 'repos compensateur', 'ARTT', 'repos supplémentaire'],
  
  // Rémunération
  'rémunération': ['salaire', 'traitement', 'indemnité', 'allocation', 'paie'],
  'demi-traitement': ['50% traitement', 'moitié salaire', 'rémunération réduite'],
  'plein traitement': ['100% salaire', 'traitement complet', 'salaire intégral'],
  'prime': ['indemnité', 'bonus', 'allocation', 'IFSE', 'RIFSEEP', 'supplément'],
  
  // Sécurité sociale
  'sécurité sociale': ['régime général', 'couverture sociale', 'CNRACL', 'IRCANTEC'],
  'accident': ['sinistre', 'incident', 'dommage', 'blessure'],
  'accident de travail': ['accident au travail', 'accident professionnel', 'accident service'],
  'accident de trajet': ['accident trajet', 'accident trajet domicile-travail'],
  
  // Télétravail
  'télétravail': ['travail à distance', 'travail domicile', 'remote work', 'home office'],
  'matériel': ['équipement', 'outils', 'ordinateur', 'logiciel', 'matériel informatique'],
  
  // Catégories
  'agents contractuels': ['contrat', 'contractuel', 'CDI', 'CDD', 'non titulaire'],
  'fonctionnaires': ['titulaire', 'fonctionnaire titulaire', 'agent public'],
  'temps partiel': ['temps réduit', 'quotité réduite', '50%', '70%', '80%', '90%'],
  'travail à temps partiel': ['temps réduit', 'quotité partielle'],
  
  // Procédures
  'déclaration': ['signalement', 'notification', 'avis', 'communication'],
  'demande': ['demande', 'requête', 'candidature', 'postulation'],
  'dossier': ['dossier', 'documentation', 'pièces justificatives'],
  
  // Durées
  'an': ['année', '12 mois', '365 jours'],
  'mois': ['mois', '30-31 jours'],
  'jour': ['journée', 'jour ouvrable', 'jour calendaire'],
  'période': ['durée', 'lapse', 'étape', 'phase'],
  
  // Santé
  'maladie': ['pathologie', 'affection', 'état de santé', 'problème de santé'],
  'diagnostic': ['diagnostic médical', 'constat médical', 'avis médical'],
  'médecin': ['médecin', 'conseil médical', 'expert médical', 'praticien'],
  'traitement': ['soin', 'cure', 'thérapie', 'traitement médical'],
  
  // RIFSEEP (important!)
  'RIFSEEP': ['grille RIFSEEP', 'prime RIFSEEP', 'rémunération', 'grille indiciaire', 'classification'],
  'grade': ['échelon', 'classification', 'niveau', 'catégorie'],
  'rémunération': ['salaire', 'traitement indiciaire', 'prime'],
};

// Analyser le fichier BIP index et enrichir les mots-clés
function enrichKeywords(bipContent) {
  let enrichedCount = 0;
  let updatedContent = bipContent;
  
  // Pour chaque entrée BIP, analyser le titre et le contenu
  const ficheRegex = /{\s*code:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"[\s\S]*?motsCles:\s*\[([\s\S]*?)\]/g;
  
  let match;
  const replacements = [];
  
  while ((match = ficheRegex.exec(bipContent)) !== null) {
    const code = match[1];
    const title = match[2];
    const mots = match[3];
    
    // Extraire les mots-clés existants
    const existingKeywords = mots.match(/"([^"]+)"/g)?.map(m => m.replace(/"/g, '')) || [];
    const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    // Enrichir avec des synonymes
    let enrichedKeywords = [...new Set(existingKeywords)];
    
    // Ajouter les mots du titre s'ils ne sont pas déjà présents
    titleWords.forEach(word => {
      if (!enrichedKeywords.includes(word) && word.length > 2) {
        enrichedKeywords.push(word);
      }
    });
    
    // Chercher les mots existants dans le dictionnaire de synonymes
    enrichedKeywords.forEach(keyword => {
      Object.entries(synonymMap).forEach(([key, synonyms]) => {
        if (keyword.toLowerCase().includes(key) || key.includes(keyword.toLowerCase())) {
          synonyms.forEach(syn => {
            if (!enrichedKeywords.includes(syn) && syn.length > 2) {
              enrichedKeywords.push(syn);
            }
          });
        }
      });
    });
    
    // Si les mots-clés ont augmenté, créer le remplacement
    if (enrichedKeywords.length > existingKeywords.length) {
      const oldMots = '[' + existingKeywords.map(m => `"${m}"`).join(', ') + ']';
      const newMots = '[' + enrichedKeywords.map(m => `"${m}"`).join(', ') + ']';
      
      replacements.push({
        code,
        oldCount: existingKeywords.length,
        newCount: enrichedKeywords.length,
        oldMots,
        newMots,
        position: match.index
      });
      
      enrichedCount++;
    }
  }
  
  return {
    replacements,
    enrichedCount,
    totalMatches: [...bipContent.matchAll(ficheRegex)].length
  };
}

// Générer un rapport d'enrichissement
function generateEnrichReport(analysis) {
  const report = {
    date: new Date().toISOString(),
    totalFiches: analysis.totalMatches,
    enrichedCount: analysis.enrichedCount,
    enrichmentRate: ((analysis.enrichedCount / analysis.totalMatches) * 100).toFixed(2),
    topImprovements: analysis.replacements.slice(0, 20).map(r => ({
      code: r.code,
      keywordsAdded: r.newCount - r.oldCount,
      oldCount: r.oldCount,
      newCount: r.newCount
    })),
    suggestions: [
      '✓ Ajouter des variantes de termes techniques (ex: CLM, COLOMA)',
      '✓ Créer des liens entre domaines connexes',
      '✓ Enrichir avec des abréviations courantes',
      '✓ Ajouter des termes synonymes en français',
      '✓ Inclure les codes officiels (ex: RIFSEEP, IFSE)'
    ]
  };
  
  return report;
}

// Fonction principale
async function main() {
  console.log('🔧 Script d\'enrichissement des mots-clés BIP\n');
  console.log('='.repeat(70));
  
  // Lire le fichier BIP index
  const bipContent = fs.readFileSync(bipIndexPath, 'utf-8');
  console.log('✓ Fichier BIP index chargé');
  
  // Analyser les mots-clés
  const analysis = enrichKeywords(bipContent);
  
  console.log(`✓ Analyse complète: ${analysis.enrichedCount}/${analysis.totalMatches} fiches peuvent être enrichies`);
  console.log(`Taux d'enrichissement possible: ${((analysis.enrichedCount / analysis.totalMatches) * 100).toFixed(2)}%\n`);
  
  // Afficher les top améliorations
  console.log('📊 TOP 10 FICHES À ENRICHIR:\n');
  
  analysis.replacements.slice(0, 10).forEach((replacement, idx) => {
    console.log(`${idx + 1}. Code: ${replacement.code}`);
    console.log(`   Mots-clés actuels: ${replacement.oldCount}`);
    console.log(`   Mots-clés enrichis: ${replacement.newCount}`);
    console.log(`   Ajout: ${replacement.newCount - replacement.oldCount} mots-clés\n`);
  });
  
  // Générer le rapport
  const report = generateEnrichReport(analysis);
  const reportPath = path.join(__dirname, '../bip-keywords-enrichment-report.json');
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('='.repeat(70));
  console.log('\n📈 RAPPORT D\'ENRICHISSEMENT GÉNÉRÉ:\n');
  console.log(`Total fiches analysées: ${report.totalFiches}`);
  console.log(`Fiches enrichissables: ${report.enrichedCount}`);
  console.log(`Taux d'enrichissement: ${report.enrichmentRate}%\n`);
  
  console.log('💡 RECOMMANDATIONS:\n');
  report.suggestions.forEach(sugg => {
    console.log(sugg);
  });
  
  console.log(`\n📄 Rapport sauvegardé: ${reportPath}`);
  
  // Créer un dictionnaire d'améliorations à appliquer
  const improveDict = {
    timestamp: new Date().toISOString(),
    synonymMap,
    applicableFiches: analysis.replacements.map(r => ({
      code: r.code,
      improvement: `${r.oldCount} → ${r.newCount} mots-clés`
    })),
    stats: {
      totalFiches: analysis.totalMatches,
      enrichedFiches: analysis.enrichedCount,
      totalNewKeywords: analysis.replacements.reduce((sum, r) => sum + (r.newCount - r.oldCount), 0)
    }
  };
  
  const improvePathDict = path.join(__dirname, '../bip-improvements-dict.json');
  fs.writeFileSync(improvePathDict, JSON.stringify(improveDict, null, 2));
  
  console.log(`✓ Dictionnaire d'améliorations: ${improvePathDict}`);
  
  console.log('\n✅ Analyse d\'enrichissement terminée!\n');
}

main().catch(console.error);
