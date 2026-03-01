import { rechercherDansSommaire } from "../src/data/sommaireUnifie.ts";

const TESTS = [
  {
    question: "Combien de jours pour un congé maternité avec des jumeaux ?",
    expected_id: "temps_ch2_maternite"
  },
  {
    question: "Quelles sont les règles pour le temps partiel après une naissance ?",
    expected_id: "temps_ch1_art6"
  },
  {
    question: "Je veux donner des jours de congés pour un collègue enfant malade.",
    expected_id: "temps_ch2_art4"
  },
  {
    question: "Sanction et révocation pour un contractuel ?",
    expected_id: "bip_ccpdis" // Expected from bip_fiches with bip_ prefix
  },
  {
    question: "Comment gérer une inaptitude d'un agent de la catégorie technique ?",
    expected_match_source: "bip" 
  },
  {
    question: "Peut-on être en télétravail quand on est enceinte ?",
    expected_id: "teletravail_situations_particulieres"
  },
  {
    question: "Quelles formations obligatoires pour la titularisation ?",
    expected_id: "formation_integration" 
  },
  {
    question: "Comment faire pour prendre des congés liés aux naissances ?",
    expected_id: "temps_ch2_art6" 
  }
];

function runTests() {
  let passed = 0;
  let failed = 0;

  console.log("🚀 Lancement des tests de recherche dans sommaireUnifie...\n");

  TESTS.forEach((test, index) => {
    const results = rechercherDansSommaire(test.question, 3);
    const topResult = results[0];

    console.log(`Test ${index + 1}: "${test.question}"`);
    if (!topResult) {
      console.log("❌ ÉCHEC : Aucun résultat trouvé.\n");
      failed++;
      return;
    }

    let isSuccess = false;
    if (test.expected_id && topResult.id === test.expected_id) {
       isSuccess = true;
    } else if (test.expected_match_source && results.some(r => r.source === test.expected_match_source)) {
       isSuccess = true;
    }

    if (isSuccess) {
      console.log(`✅ SUCCÈS : Trouvé -> ${topResult.titre} (ID: ${topResult.id})`);
      passed++;
    } else {
      console.log(`❌ ÉCHEC : Attendu ${test.expected_id || `Source: ${test.expected_match_source}`} | Obtenu -> ${topResult.titre} (ID: ${topResult.id})`);
      console.log("  Top 3 complet :");
      results.forEach((r, i) => console.log(`    ${i+1}. ${r.titre} (${r.id})`));
      failed++;
    }
    console.log("---");
  });

  console.log(`\n📊 Bilan : ${passed} succès / ${passed + failed} tests au total.`);
}

runTests();
