import { pipeline } from '@xenova/transformers';
import { sommaireUnifie } from '../src/data/sommaireUnifie.ts';

const TESTS = [
  { question: "Sanction et révocation pour un contractuel ?", expected_id: "bip_ccpdis" },
  { question: "Comment gerer une inaptitude de la categorie technique ?", expected_id: "bip_cadcaa" },
  { question: "Un fonctionnaire peut il faire une cessation progressive d activite ?", expected_id: "bip_cesspr" },
  { question: "Quelle procédure pour une reconnaissance de maladie professionnelle ?", expected_id: "bip_malpro" },
  { question: "Le recrutement de travailleurs handicapés", expected_id: "bip_rechan" }
];

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function run() {
  console.log("📦 Chargement Transformers.js (Xenova/paraphrase-multilingual-MiniLM-L12-v2)...");
  
  // Wait to load pipeline
  const extractor = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2', {
    quantized: true,
  });
  
  console.log(`🧠 Generation des embeddings pour ${sommaireUnifie.length} documents...`);
  const docs: {id: string, titre: string, embedding: number[]}[] = [];
  let done = 0;

  for (const s of sommaireUnifie) {
      if(!s.titre) continue;
      const text = `${s.titre}. ${s.resume || ''}. Mots-clés: ${(s.motsCles || []).join(', ')}`;
      const out = await extractor(text, { pooling: 'mean', normalize: true });
      docs.push({ id: s.id, titre: s.titre, embedding: out.data });
      
      done++;
      if (done % 50 === 0) {
          console.log(`... ${done}/${sommaireUnifie.length} traités`);
      }
  }
  console.log(`... ${done}/${sommaireUnifie.length} traités, C'est parti!`);

  console.log("\n🚀 Lancement de l'évaluation sur les questions types...\n");
  let passed = 0;
  for (let i = 0; i < TESTS.length; i++) {
     const t = TESTS[i];
     const outQuery = await extractor(t.question, { pooling: 'mean', normalize: true });
     
     const scored = docs.map(d => ({
         id: d.id, 
         titre: d.titre, 
         score: cosineSimilarity(outQuery.data, d.embedding)
     })).sort((a,b) => b.score - a.score);

     const top = scored[0];
     console.log(`Question ${i + 1}: "${t.question}"`);
     
     if (top.id === t.expected_id) {
         console.log(`✅ EXACT! -> ${top.titre} (Score: ${(top.score * 100).toFixed(1)}%)`); 
         passed++;
     } else {
         console.log(`❌ NON -> OBTENU: "${top.titre}" (Score: ${(top.score * 100).toFixed(1)}%, id: ${top.id})`);
         if (scored[1]?.id === t.expected_id) console.log(`         ATTENDU ÉTAIT #2 (${(scored[1].score*100).toFixed(1)}%)`);
         else if (scored[2]?.id === t.expected_id) console.log(`         ATTENDU ÉTAIT  #3 (${(scored[2].score*100).toFixed(1)}%)`);
         else console.log(`         ATTENDU ETAIT: ${t.expected_id} (Hors Top 3)`);
     }
     console.log("---");
  }
  console.log(`\n📊 Bilan VectorSearch final: ${passed}/${TESTS.length}`);
}
run().catch(console.error);
