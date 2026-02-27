import { ficheIndex } from './src/data/bip-index'
import { searchFichesByKeywords } from './src/utils/ficheSearch'

console.log('Test BIP Search Functionality')
console.log('==============================')
console.log(`Total fiches in index: ${ficheIndex.length}`)

// Test 1: Search for "sanction"
console.log('\n1. Search for "sanction":')
const results1 = searchFichesByKeywords(['sanction'])
console.log(`   Found ${results1.totalMatches} results`)
results1.results.slice(0, 3).forEach((f, i) => {
  console.log(`   ${i+1}. ${f.titre} (${f.categorie})`)
})

// Test 2: Search for "congé"
console.log('\n2. Search for "congé":')
const results2 = searchFichesByKeywords(['congé'])
console.log(`   Found ${results2.totalMatches} results`)
results2.results.slice(0, 3).forEach((f, i) => {
  console.log(`   ${i+1}. ${f.titre} (${f.categorie})`)
})

// Test 3: Search for "cadres"
console.log('\n3. Search for "cadres":')
const results3 = searchFichesByKeywords(['cadres'])
console.log(`   Found ${results3.totalMatches} results`)
results3.results.slice(0, 3).forEach((f, i) => {
  console.log(`   ${i+1}. ${f.titre} (${f.categorie})`)
})

// Test 4: Multiple keywords
console.log('\n4. Search for "discipline contractuels":')
const results4 = searchFichesByKeywords(['discipline', 'contractuels'])
console.log(`   Found ${results4.totalMatches} results`)
results4.results.slice(0, 2).forEach((f, i) => {
  console.log(`   ${i+1}. ${f.titre} (${f.categorie})`)
})

console.log('\n✅ All tests completed!')
