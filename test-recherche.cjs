/**
 * Script de test - Vérification de la pertinence de la recherche en 2 étapes
 * 
 * Simule le comportement de traiterQuestion() dans App.tsx :
 * 1. Envoie le sommaire pour identifier les sections pertinentes
 * 2. Charge le contenu ciblé
 * 3. Pose la question avec ce contenu
 * 
 * Usage: node test-recherche.js
 */

const fs = require('fs');
const path = require('path');

const API_URL = "http://localhost:3001/api/completions";

// Charger les données sources (simulation des imports)
function chargerContenuBrut() {
  const tempsPath = path.join(__dirname, 'src/data/temps.ts');
  const formationPath = path.join(__dirname, 'src/data/formation.ts');
  const teletravailPath = path.join(__dirname, 'src/data/teletravail.ts');
  
  const tempsContent = fs.readFileSync(tempsPath, 'utf-8');
  const formationContent = fs.readFileSync(formationPath, 'utf-8');
  const teletravailContent = fs.readFileSync(teletravailPath, 'utf-8');
  
  // Extraire les chapitres de temps.ts (entre les backticks)
  const chapitreRegex = /(\d):\s*`([^`]+)`/gs;
  const chapitres = {};
  let match;
  while ((match = chapitreRegex.exec(tempsContent)) !== null) {
    chapitres[parseInt(match[1])] = match[2];
  }
  
  // Extraire formation
  const formationMatch = formationContent.match(/export const formation\s*=\s*`([^`]+)`/s);
  const formation = formationMatch ? formationMatch[1] : '';
  
  // Extraire teletravail
  const teletravailMatch = teletravailContent.match(/export const teletravailData\s*=\s*`([^`]+)`/s);
  const teletravail = teletravailMatch ? teletravailMatch[1] : '';
  
  return { chapitres, formation, teletravail };
}

// Sommaire unifié simplifié
const sommaireUnifie = [
  { id: 'temps_ch1_definition', titre: 'Définition du temps de travail', source: 'temps', chapitre: 1, resume: '1607h annuelles, journée de solidarité' },
  { id: 'temps_ch1_durees', titre: 'Durées et cycles de travail', source: 'temps', chapitre: 1, resume: 'Cycles 37h, 37.5h, 38h, 39h, JNT' },
  { id: 'temps_ch1_plages', titre: 'Plages fixes et souplesse', source: 'temps', chapitre: 1, resume: 'Horaires 9h30-12h, 14h-16h30' },
  { id: 'temps_ch1_temps_partiel', titre: 'Temps partiel', source: 'temps', chapitre: 1, resume: 'Quotités 50-90%' },
  { id: 'temps_ch2_conges_annuels', titre: 'Congés annuels', source: 'temps', chapitre: 2, resume: '25 jours ouvrés/an' },
  { id: 'temps_ch2_rtt', titre: 'Jours RTT / ARTT', source: 'temps', chapitre: 2, resume: '12j à 37h, 15j à 37.5h, 18j à 38h, 23j à 39h' },
  { id: 'temps_ch2_naissance', titre: 'Congés maternité et paternité', source: 'temps', chapitre: 2, resume: 'Maternité 16 semaines, paternité 25 jours' },
  { id: 'temps_ch3_garde_enfant', titre: 'Garde enfant malade', source: 'temps', chapitre: 3, resume: '6 jours/an' },
  { id: 'temps_ch3_deces', titre: 'Décès famille', source: 'temps', chapitre: 3, resume: '5j conjoint/parents, 14j enfant' },
  { id: 'temps_ch3_mariage', titre: 'Mariage ou PACS', source: 'temps', chapitre: 3, resume: '7 jours pour l\'agent' },
  { id: 'temps_ch4_maladie', titre: 'Congé maladie', source: 'temps', chapitre: 4, resume: 'Transmission 48h, 1 jour carence' },
  { id: 'temps_ch4_remuneration', titre: 'Rémunération maladie', source: 'temps', chapitre: 4, resume: '3 mois plein + 9 mois demi' },
  { id: 'formation_cpf', titre: 'CPF', source: 'formation', resume: '25h/an, plafond 150h' },
  { id: 'formation_conge_pro', titre: 'Congé formation', source: 'formation', resume: 'Max 3 ans, 85% rémunéré' },
  { id: 'teletravail_jours', titre: 'Jours de télétravail', source: 'teletravail', resume: '2 jours max par semaine' },
];

// Générer le texte du sommaire
function genererSommaireTexte() {
  return sommaireUnifie.map(s => `[${s.id}] ${s.titre} - ${s.resume}`).join('\n');
}

// 6 Questions de test avec réponses attendues
const testsQuestions = [
  {
    id: 1,
    question: "Combien de jours de congés annuels ai-je droit ?",
    reponseAttendue: ["25", "jours"],
    categorie: "Congés annuels"
  },
  {
    id: 2,
    question: "Combien de RTT avec un cycle de 38h ?",
    reponseAttendue: ["18", "jours"],
    categorie: "RTT"
  },
  {
    id: 3,
    question: "Combien de jours pour le décès de mon père ?",
    reponseAttendue: ["5", "jours"],
    categorie: "Décès"
  },
  {
    id: 4,
    question: "Quelles sont les plages fixes de présence obligatoire ?",
    reponseAttendue: ["9h30", "16h30"],
    categorie: "Horaires"
  },
  {
    id: 5,
    question: "Combien de jours de télétravail par semaine maximum ?",
    reponseAttendue: ["2", "jours"],
    categorie: "Télétravail"
  },
  {
    id: 6,
    question: "Combien d'heures CPF acquises par an ?",
    reponseAttendue: ["25", "heures"],
    categorie: "Formation CPF"
  }
];

// Appeler l'API Perplexity
async function appelAPI(messages, model = "sonar-pro") {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages })
  });
  
  if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

// Étape 1: Identifier les sections pertinentes
async function identifierSections(question) {
  const sommaire = genererSommaireTexte();
  const prompt = `Identifie les sections pertinentes pour répondre à cette question.

SOMMAIRE :
${sommaire}

QUESTION : ${question}

RÈGLES :
- Réponds UNIQUEMENT avec les IDs séparés par des virgules
- Maximum 3 sections
- Si aucune: "AUCUNE"

IDs :`;

  const reponse = await appelAPI([{ role: "user", content: prompt }]);
  return reponse.toLowerCase()
    .replace(/[[\]"']/g, '')
    .split(/[,\s]+/)
    .filter(id => sommaireUnifie.some(s => s.id === id.trim()));
}

// Charger le contenu ciblé
function chargerContenuCible(sectionIds, donnees) {
  const chapitresACharger = new Set();
  let chargerFormation = false;
  let chargerTeletravail = false;
  
  sectionIds.forEach(id => {
    const section = sommaireUnifie.find(s => s.id === id);
    if (section) {
      if (section.source === 'temps' && section.chapitre) {
        chapitresACharger.add(section.chapitre);
      } else if (section.source === 'formation') chargerFormation = true;
      else if (section.source === 'teletravail') chargerTeletravail = true;
    }
  });
  
  let contenu = '';
  const titres = ['', 'TEMPS DE TRAVAIL', 'CONGÉS', "ABSENCES", 'MALADIES'];
  
  chapitresACharger.forEach(ch => {
    if (donnees.chapitres[ch]) contenu += `\n\n=== ${titres[ch]} ===\n${donnees.chapitres[ch]}`;
  });
  if (chargerFormation && donnees.formation) contenu += `\n\n=== FORMATION ===\n${donnees.formation}`;
  if (chargerTeletravail && donnees.teletravail) contenu += `\n\n=== TÉLÉTRAVAIL ===\n${donnees.teletravail}`;
  
  return contenu.trim();
}

// Poser la question avec le contenu ciblé
async function poserQuestion(question, contenu) {
  const systemPrompt = `Tu es un assistant CFDT pour la Mairie de Gennevilliers.
Réponds UNIQUEMENT avec les documents ci-dessous. Sois précis sur les chiffres.
Si tu ne trouves pas, dis "Je ne trouve pas cette information".

DOCUMENTATION :
${contenu}`;

  return await appelAPI([
    { role: "system", content: systemPrompt },
    { role: "user", content: question }
  ]);
}

// Vérifier la réponse
function verifierReponse(reponse, elementsAttendus) {
  const reponseLower = reponse.toLowerCase();
  const details = elementsAttendus.map(el => ({
    element: el,
    trouve: reponseLower.includes(el.toLowerCase())
  }));
  const score = details.filter(r => r.trouve).length;
  return {
    score,
    total: elementsAttendus.length,
    pourcentage: Math.round((score / elementsAttendus.length) * 100),
    details
  };
}

// Fonction principale
async function lancerTests() {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 TEST RECHERCHE EN 2 ÉTAPES - 6 QUESTIONS");
  console.log("=".repeat(70));
  console.log(`📅 ${new Date().toLocaleString('fr-FR')}\n`);
  
  console.log("📂 Chargement des données...");
  const donnees = chargerContenuBrut();
  console.log(`   ✓ ${Object.keys(donnees.chapitres).length} chapitres, ${donnees.formation.length + donnees.teletravail.length} chars\n`);
  
  const resultats = [];
  let scoreTotal = 0, maxScore = 0;
  
  for (const test of testsQuestions) {
    console.log("-".repeat(70));
    console.log(`\n📋 TEST ${test.id}: ${test.categorie}`);
    console.log(`❓ "${test.question}"`);
    
    const startTime = Date.now();
    
    try {
      // ÉTAPE 1
      console.log("\n🔍 Étape 1: Identification...");
      const sections = await identifierSections(test.question);
      console.log(`   → ${sections.length > 0 ? sections.join(', ') : 'AUCUNE'}`);
      
      // ÉTAPE 2
      let contenu = sections.length === 0
        ? Object.values(donnees.chapitres).join('\n\n') + donnees.formation + donnees.teletravail
        : chargerContenuCible(sections, donnees);
      console.log(`   → ${contenu.length} caractères chargés`);
      
      // ÉTAPE 3
      console.log("💬 Étape 2: Question...");
      const reponse = await poserQuestion(test.question, contenu);
      const tempsTotal = Date.now() - startTime;
      
      console.log(`\n📝 Réponse (${tempsTotal}ms):`);
      console.log(`   ${reponse.substring(0, 200)}...`);
      
      const verif = verifierReponse(reponse, test.reponseAttendue);
      console.log(`\n✅ Score: ${verif.score}/${verif.total} (${verif.pourcentage}%)`);
      verif.details.forEach(d => console.log(`   ${d.trouve ? '✓' : '✗'} "${d.element}"`));
      
      const reussi = verif.pourcentage >= 50;
      console.log(`\n${reussi ? '🟢 RÉUSSI' : '🔴 ÉCHOUÉ'}`);
      
      resultats.push({ ...test, sections, reponse: reponse.substring(0, 400), tempsMs: tempsTotal, ...verif, reussi });
      scoreTotal += verif.score;
      maxScore += verif.total;
      
    } catch (error) {
      console.log(`\n❌ ERREUR: ${error.message}`);
      resultats.push({ ...test, erreur: error.message, reussi: false, score: 0, total: test.reponseAttendue.length, pourcentage: 0 });
      maxScore += test.reponseAttendue.length;
    }
    
    await new Promise(r => setTimeout(r, 1500));
  }
  
  // RÉSUMÉ
  console.log("\n" + "=".repeat(70));
  console.log("📊 RÉSUMÉ FINAL");
  console.log("=".repeat(70));
  
  const testsReussis = resultats.filter(r => r.reussi).length;
  const scoreFinal = Math.round((scoreTotal / maxScore) * 100);
  
  console.log(`\n🎯 Tests réussis: ${testsReussis}/6`);
  console.log(`📈 Score global: ${scoreTotal}/${maxScore} (${scoreFinal}%)`);
  
  console.log("\n📋 Détail:");
  resultats.forEach(r => {
    const icon = r.reussi ? '✅' : '❌';
    console.log(`   ${icon} Test ${r.id} (${r.categorie}): ${r.pourcentage}%`);
  });
  
  console.log("\n" + "-".repeat(70));
  if (scoreFinal >= 80) console.log("🏆 EXCELLENT!");
  else if (scoreFinal >= 60) console.log("👍 BON");
  else if (scoreFinal >= 40) console.log("⚠️  MOYEN");
  else console.log("🚨 PROBLÈME");
  
  fs.writeFileSync('test-recherche-resultats.json', JSON.stringify({ date: new Date().toISOString(), scoreFinal: `${scoreFinal}%`, testsReussis: `${testsReussis}/6`, resultats }, null, 2));
  console.log("\n📁 → test-recherche-resultats.json\n");
}

lancerTests().catch(console.error);
