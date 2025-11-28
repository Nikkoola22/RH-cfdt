/**
 * Script de test pour comprendre pourquoi Perplexity ne respecte pas le prompt FPT
 * 
 * Usage: PERPLEXITY_API_KEY=votre_clé node test-perplexity.js
 */

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

if (!PERPLEXITY_API_KEY) {
  console.error("❌ PERPLEXITY_API_KEY non définie");
  console.log("Usage: PERPLEXITY_API_KEY=pplx-xxx node test-perplexity.js");
  process.exit(1);
}

const question = "Pendant mon congé de longue maladie, je suis payé comment ?";

// Prompt actuel utilisé dans l'app
const systemPromptActuel = `
🚨 INSTRUCTION CRITIQUE : Tu réponds UNIQUEMENT sur la FONCTION PUBLIQUE TERRITORIALE (FPT).
Si ta réponse contient "Code du travail" ou "L1226" ou "salarié" ou "employeur privé" = ERREUR GRAVE.

👤 CONTEXTE : Agent territorial (fonctionnaire ou contractuel) d'une MAIRIE française.

📚 SOURCES LÉGALES OBLIGATOIRES - RECHERCHE UNIQUEMENT DANS :

▶ FONCTIONNAIRES TERRITORIAUX :
• Code général de la fonction publique (CGFP) Articles L822-1 à L822-12 pour les congés maladie
  URL: https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000044416551
• Décret n°87-602 du 30 juillet 1987 (congés maladie fonctionnaires territoriaux)
  URL: https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000520911

▶ AGENTS CONTRACTUELS TERRITORIAUX :
• Décret n°88-145 du 15 février 1988 (agents non titulaires territoriaux)
  URL: https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000871608

📋 RÉPONSE STRUCTURÉE OBLIGATOIRE :

## Pour les FONCTIONNAIRES titulaires :
[Citer CGFP + Décret 87-602 avec articles précis]

## Pour les CONTRACTUELS :
[Citer Décret 88-145 avec articles précis]

💡 EXEMPLE - Congé Longue Maladie (CLM) fonctionnaire territorial :
- Durée : 3 ans maximum (Article 57 ancien statut → CGFP L822-4)
- Rémunération : 1 an plein traitement + 2 ans demi-traitement
- Conditions : Maladie rendant nécessaire un traitement et repos prolongés

Question : ${question}
`;

const userMessageActuel = `FONCTION PUBLIQUE TERRITORIALE UNIQUEMENT.
Question d'un agent territorial : ${question}

⚠️ INTERDIT : Code du travail, droit privé, convention collective.
✅ OBLIGATOIRE : CGFP, Décret 87-602, Décret 88-145.`;

// Test avec différentes configurations
async function testPerplexity(testName, model, systemPrompt, userMessage) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🧪 TEST: ${testName}`);
  console.log(`📦 Modèle: ${model}`);
  console.log(`${"=".repeat(80)}`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Erreur HTTP ${response.status}:`, error);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const duration = Date.now() - startTime;

    console.log(`\n⏱️ Temps de réponse: ${duration}ms`);
    console.log(`\n📄 RÉPONSE:\n${"-".repeat(40)}`);
    console.log(content);
    console.log(`${"-".repeat(40)}`);

    // Analyse de la réponse
    console.log(`\n🔍 ANALYSE:`);
    
    const problemes = [];
    if (content.includes("Code du travail")) problemes.push("❌ Contient 'Code du travail'");
    if (content.includes("L1226")) problemes.push("❌ Contient 'L1226' (article Code travail)");
    if (content.includes("salarié")) problemes.push("⚠️ Contient 'salarié' (terme privé)");
    if (content.includes("employeur")) problemes.push("⚠️ Contient 'employeur' (terme privé)");
    if (content.includes("convention collective")) problemes.push("❌ Contient 'convention collective'");
    
    const bonnesRefs = [];
    if (content.includes("CGFP") || content.includes("Code général de la fonction publique")) bonnesRefs.push("✅ Cite CGFP");
    if (content.includes("87-602")) bonnesRefs.push("✅ Cite Décret 87-602");
    if (content.includes("88-145")) bonnesRefs.push("✅ Cite Décret 88-145");
    if (content.includes("L822")) bonnesRefs.push("✅ Cite articles L822");
    if (content.includes("fonction publique territoriale") || content.includes("FPT")) bonnesRefs.push("✅ Mentionne FPT");

    if (problemes.length > 0) {
      console.log("PROBLÈMES DÉTECTÉS:");
      problemes.forEach(p => console.log(`  ${p}`));
    }
    
    if (bonnesRefs.length > 0) {
      console.log("BONNES RÉFÉRENCES:");
      bonnesRefs.forEach(r => console.log(`  ${r}`));
    }

    const score = bonnesRefs.length - problemes.length;
    console.log(`\n📊 SCORE: ${score} (${bonnesRefs.length} bonnes refs - ${problemes.length} problèmes)`);
    
    return { content, problemes, bonnesRefs, score, duration };

  } catch (error) {
    console.error(`❌ Erreur:`, error.message);
    return null;
  }
}

// Prompt alternatif plus simple et direct
const systemPromptSimple = `Tu es un expert juridique de la FONCTION PUBLIQUE TERRITORIALE française.
IMPORTANT: L'utilisateur est un AGENT TERRITORIAL (pas un salarié du privé).
Utilise UNIQUEMENT ces sources:
- Code général de la fonction publique (CGFP)
- Décret 87-602 du 30/07/1987 (congés maladie fonctionnaires territoriaux)
- Décret 88-145 du 15/02/1988 (agents contractuels territoriaux)
NE JAMAIS citer le Code du travail.`;

const userMessageSimple = `Je suis agent territorial dans une mairie.
Question: ${question}
Réponds avec les articles du CGFP et décrets FPT applicables.`;

// Prompt avec contexte intégré dans la question
const systemPromptMinimal = `Réponds en français. Utilise uniquement le droit de la fonction publique territoriale.`;

const userMessageContextuel = `En tant qu'AGENT TERRITORIAL (fonctionnaire de mairie, pas salarié du privé), 
je veux savoir: ${question}

Cherche dans:
- Code général de la fonction publique (CGFP) articles L822-1 à L822-12
- Décret 87-602 du 30 juillet 1987
- Décret 88-145 du 15 février 1988 pour les contractuels

NE PAS utiliser le Code du travail (secteur privé).
Donne les durées et taux de rémunération précis.`;

async function runAllTests() {
  console.log("🚀 DÉMARRAGE DES TESTS PERPLEXITY");
  console.log(`📝 Question: "${question}"`);
  console.log(`🔑 API Key: ${PERPLEXITY_API_KEY.substring(0, 10)}...`);

  const results = [];

  // Test 1: Configuration actuelle avec sonar-pro
  results.push(await testPerplexity(
    "Config actuelle (sonar-pro)",
    "sonar-pro",
    systemPromptActuel,
    userMessageActuel
  ));

  // Test 2: Avec sonar (modèle de base)
  results.push(await testPerplexity(
    "Modèle sonar (base)",
    "sonar",
    systemPromptActuel,
    userMessageActuel
  ));

  // Test 3: Prompt simplifié avec sonar-pro
  results.push(await testPerplexity(
    "Prompt simplifié (sonar-pro)",
    "sonar-pro",
    systemPromptSimple,
    userMessageSimple
  ));

  // Test 4: Contexte dans la question utilisateur
  results.push(await testPerplexity(
    "Contexte dans question (sonar-pro)",
    "sonar-pro",
    systemPromptMinimal,
    userMessageContextuel
  ));

  // Résumé
  console.log(`\n${"=".repeat(80)}`);
  console.log("📊 RÉSUMÉ DES TESTS");
  console.log(`${"=".repeat(80)}`);
  
  results.forEach((r, i) => {
    if (r) {
      const testNames = [
        "Config actuelle (sonar-pro)",
        "Modèle sonar (base)",
        "Prompt simplifié (sonar-pro)",
        "Contexte dans question (sonar-pro)"
      ];
      console.log(`\nTest ${i+1}: ${testNames[i]}`);
      console.log(`  Score: ${r.score} | Durée: ${r.duration}ms`);
      console.log(`  Problèmes: ${r.problemes.length} | Bonnes refs: ${r.bonnesRefs.length}`);
    }
  });

  console.log(`\n${"=".repeat(80)}`);
  console.log("💡 CONCLUSIONS");
  console.log(`${"=".repeat(80)}`);
  console.log(`
Perplexity utilise son propre moteur de recherche web.
Le problème est que les résultats de recherche web pour "congé longue maladie"
retournent majoritairement du contenu sur le Code du travail (plus populaire).

SOLUTIONS POSSIBLES:
1. Ajouter "site:legifrance.gouv.fr" ou "site:service-public.fr" dans la requête
2. Filtrer la réponse côté client et afficher des liens directs si mauvaise réponse
3. Utiliser une API qui permet de restreindre les sources (ex: OpenAI avec function calling)
4. Pré-traiter la question pour ajouter "fonction publique territoriale" automatiquement
`);
}

runAllTests();
