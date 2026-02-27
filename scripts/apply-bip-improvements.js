#!/usr/bin/env node

/**
 * Script d'application des enrichissements aux fiches BIP
 * Améliore le fichier bip-index.ts avec les nouveaux mots-clés
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const bipIndexPath = path.join(__dirname, '../src/data/bip-index.ts');
const improvePathDict = path.join(__dirname, '../bip-improvements-dict.json');

// Dictionnaire complet de synonymes pour enrichissement intelligent
const advancedSynonymMap = {
  // Congés
  'congés': ['absence', 'repos', 'permission', 'vacances', 'temps libre'],
  'longue maladie': ['CLM', 'COLOMA', 'arrêt prolongé', 'congé maladie long terme'],
  'maladie': ['pathologie', 'affection', 'problème santé', 'arrêt', 'absence'],
  'ordinaire': ['normal', 'standard', 'habituel'],
  
  // RIFSEEP - TRÈS IMPORTANT
  'prime': ['indemnité', 'bonus', 'allocation', 'supplément', 'rémunération additionnelle'],
  'IFSE': ['indemnité fonctions', 'prime indemnité', 'RIFSEEP', 'grille salaire'],
  'grade': ['échelon', 'niveau', 'classification', 'catégorie', 'rang'],
  'rémunération': ['salaire', 'traitement', 'indemnité', 'paie', 'allocation'],
  
  // Accidents
  'accident': ['sinistre', 'incident', 'dommage', 'blessure', 'traumatisme'],
  'trajet': ['chemin', 'parcours', 'itinéraire', 'trajet domicile-travail'],
  'service': ['fonçtion', 'travail', 'emploi', 'poste'],
  
  // Télétravail
  'télétravail': ['travail distance', 'travail domicile', 'remote', 'home office'],
  'domicile': ['maison', 'résidence', 'logement', 'espace privé'],
  'matériel': ['équipement', 'outils', 'fournitures', 'hardware'],
  
  // Catégories de personnels
  'contractuels': ['contrat', 'non titulaire', 'agent contrat', 'CDD'],
  'titulaires': ['fonctionnaire', 'agent titulaire', 'permanent'],
  'agents': ['personnel', 'employés', 'salariés', 'collaborateurs'],
  
  // Procédures et documents
  'déclaration': ['signalement', 'notification', 'avis', 'rapport'],
  'demande': ['requête', 'candidature', 'postulation', 'demande écrite'],
  'certificat': ['attestation', 'document', 'justificatif', 'preuve'],
  
  // Santé
  'médical': ['médecine', 'santé', 'diagnostic', 'clinique'],
  'conseil médical': ['examen médical', 'visite santé', 'expertise'],
  'traitement': ['soin', 'cure', 'thérapie', 'médication'],
  
  // Temporalité
  'année': ['12 mois', 'an', 'exercice annuel'],
  'mois': ['30 jours', 'période mensuelle'],
  'durée': ['longueur', 'lapse', 'délai', 'période'],
  
  // Divers
  'fonction publique': ['FP', 'service public', 'secteur public', 'collectivité'],
  'territorial': ['collectivité', 'commune', 'mairie', 'administration locale'],
};

// Enrichir les mots-clés d'une fiche
function enrichFicheKeywords(motsArray) {
  const enriched = new Set(motsArray);
  
  motsArray.forEach(mot => {
    const motLower = mot.toLowerCase();
    
    // Chercher les synonymes directs
    Object.entries(advancedSynonymMap).forEach(([key, synonyms]) => {
      if (motLower.includes(key.toLowerCase()) || key.toLowerCase().includes(motLower)) {
        synonyms.forEach(syn => {
          if (syn.length > 2) enriched.add(syn);
        });
      }
    });
  });
  
  return Array.from(enriched).sort();
}

// Analyser et améliorer le fichier BIP index
function improveBipIndex(content) {
  let improvedCount = 0;
  let totalKeywordsAdded = 0;
  let updatedContent = content;
  
  // Parser chaque fiche
  const ficheRegex = /(\{[\s\S]*?motsCles:\s*\[)([\s\S]*?)(\][\s\S]*?})/g;
  const replacements = [];
  
  let match;
  while ((match = ficheRegex.exec(content)) !== null) {
    const before = match[1];
    const motsString = match[2];
    const after = match[3];
    
    // Extraire les mots actuels
    const currentMots = motsString.match(/"([^"]+)"/g)?.map(m => m.replace(/"/g, '')) || [];
    
    // Enrichir
    const enrichedMots = enrichFicheKeywords(currentMots);
    
    // Si amélioration détectée
    if (enrichedMots.length > currentMots.length) {
      const newMotsString = enrichedMots.map(m => `"${m}"`).join(', ');
      const replacement = before + newMotsString + after;
      
      replacements.push({
        original: match[0],
        improved: replacement,
        added: enrichedMots.length - currentMots.length
      });
      
      improvedCount++;
      totalKeywordsAdded += enrichedMots.length - currentMots.length;
    }
  }
  
  // Appliquer les remplacements
  replacements.forEach(rep => {
    updatedContent = updatedContent.replace(rep.original, rep.improved);
  });
  
  return {
    updatedContent,
    improvedCount,
    totalKeywordsAdded,
    replacements: replacements.slice(0, 5)
  };
}

// Fonction principale
async function main() {
  console.log('🚀 Script d\'application des enrichissements BIP\n');
  console.log('='.repeat(70));
  
  // Lire le fichier BIP index
  const bipContent = fs.readFileSync(bipIndexPath, 'utf-8');
  
  // Améliorer
  const result = improveBipIndex(bipContent);
  
  console.log(`✓ Fichier BIP index analysé`);
  console.log(`✓ Fiches améliorées: ${result.improvedCount}`);
  console.log(`✓ Mots-clés ajoutés au total: ${result.totalKeywordsAdded}\n`);
  
  // Sauvegarder la version améliorée
  const backupPath = bipIndexPath.replace('.ts', '.backup.ts');
  fs.writeFileSync(backupPath, bipContent);
  console.log(`✓ Backup créé: ${backupPath}`);
  
  // Appliquer les améliorations
  fs.writeFileSync(bipIndexPath, result.updatedContent);
  console.log(`✓ Fichier BIP index mis à jour: ${bipIndexPath}\n`);
  
  // Créer un rapport de mise à jour
  const updateReport = {
    timestamp: new Date().toISOString(),
    filesUpdated: {
      bipIndex: {
        path: bipIndexPath,
        backup: backupPath,
        status: 'updated'
      }
    },
    statistics: {
      totalFichesImproved: result.improvedCount,
      totalKeywordsAdded: result.totalKeywordsAdded,
      averageKeywordsPerFiche: (result.totalKeywordsAdded / result.improvedCount).toFixed(2)
    },
    topImprovements: result.replacements.map((r, idx) => ({
      index: idx + 1,
      keywordsAdded: r.added
    })),
    nextSteps: [
      '1. Exécuter: npm run build',
      '2. Tester le chat avec des questions spécifiques',
      '3. Analyser les résultats avec: node scripts/evaluate-search.js',
      '4. Continuer les itérations d\'amélioration'
    ]
  };
  
  const reportPath = path.join(__dirname, '../bip-improvement-applied.json');
  fs.writeFileSync(reportPath, JSON.stringify(updateReport, null, 2));
  
  console.log('='.repeat(70));
  console.log('\n📊 RÉSULTATS D\'AMÉLIORATION:\n');
  console.log(`Total fiches améliorées: ${result.improvedCount}`);
  console.log(`Total mots-clés ajoutés: ${result.totalKeywordsAdded}`);
  console.log(`Moyenne par fiche: ${(result.totalKeywordsAdded / result.improvedCount).toFixed(2)}\n`);
  
  console.log('📝 PROCHAINES ÉTAPES:\n');
  updateReport.nextSteps.forEach(step => {
    console.log(step);
  });
  
  console.log(`\n📄 Rapport: ${reportPath}`);
  console.log('\n✅ Enrichissement appliqué!\n');
}

main().catch(console.error);
