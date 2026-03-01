import { rechercherDansSommaire } from "../src/data/sommaireUnifie.ts";

const TESTS = [
  { question: "Sanction et révocation pour un contractuel ?", expected_id: "bip_ccpdis" },
  { question: "Comment gerer une inaptitude de la categorie technique ?", expected_id: "bip_cadcaa" },
  { question: "Un fonctionnaire peut il faire une cessation progressive d activite ?", expected_id: "bip_cesspr" },
  { question: "Quelle procédure pour une reconnaissance de maladie professionnelle ?", expected_id: "bip_malpro" },
  { question: "Le recrutement de travailleurs handicapés", expected_id: "bip_rechan" }
];

function runTests() {
  let passed = 0;
  let totalBip = 0;
  console.log("🚀 Lancement des tests...");
  TESTS.forEach((test, index) => {
    const results = rechercherDansSommaire(test.question, 3);
    const top = results[0];
    
    console.log(`\nTest ${index + 1}: "${test.question}"`);
    if(top) {
        if(top.source === 'bip') totalBip++;
        if(top.id === test.expected_id) {
            console.log(`✅ EXACT: ${top.titre}`);
            passed++;
        } else {
            console.log(`❌ OBTENU: ${top.titre} (${top.id}) au lieu de ${test.expected_id}`);
            console.log("Suite: ", results.map(r=>r.id).join(", "));
        }
    }
  });
  console.log(`\nBilan: ${passed}/${TESTS.length} exacts. ${totalBip} resultats BIP en 1ere place.`);
}
runTests();
