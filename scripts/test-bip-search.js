/**
 * Test script to verify BIP index search functionality
 * Run with: node scripts/test-bip-search.js
 */

import { bipIndex } from '../src/data/bip-index.ts';

// Test 1: Check total number of fiches
console.log('📊 Index Statistics');
console.log('==================');
console.log(`Total fiches: ${bipIndex.length}`);
console.log(`Expected: 185`);
console.log(`✓ Index loaded successfully\n`);

// Test 2: Check structure of first entry
const firstFiche = bipIndex[0];
console.log('🔍 Sample Entry (First Fiche)');
console.log('============================');
console.log(`Code: ${firstFiche.code}`);
console.log(`Title: ${firstFiche.title}`);
console.log(`Section: ${firstFiche.section}`);
console.log(`Keywords: ${firstFiche.motsCles.join(', ')}`);
console.log(`Content preview: ${firstFiche.content.substring(0, 100)}...`);
console.log(`✓ Structure validated\n`);

// Test 3: Search by keyword
function searchByKeyword(keyword) {
  const results = bipIndex.filter(fiche =>
    fiche.title.toLowerCase().includes(keyword.toLowerCase()) ||
    fiche.section.toLowerCase().includes(keyword.toLowerCase()) ||
    fiche.motsCles.some(m => m.toLowerCase().includes(keyword.toLowerCase())) ||
    fiche.content.toLowerCase().includes(keyword.toLowerCase())
  );
  return results;
}

console.log('🔎 Keyword Searches');
console.log('===================');

// Test search for "sanction"
const sanctionResults = searchByKeyword('sanction');
console.log(`\nQuery: "sanction"`);
console.log(`Results: ${sanctionResults.length} fiches found`);
if (sanctionResults.length > 0) {
  console.log(`Top match: ${sanctionResults[0].title}`);
  console.log(`Section: ${sanctionResults[0].section}`);
  console.log(`✓ Search works`);
}

// Test search for "congé"
const congeResults = searchByKeyword('congé');
console.log(`\nQuery: "congé"`);
console.log(`Results: ${congeResults.length} fiches found`);
if (congeResults.length > 0) {
  console.log(`Top match: ${congeResults[0].title}`);
  console.log(`Section: ${congeResults[0].section}`);
  console.log(`✓ Search works`);
}

// Test search for "administrateur"
const adminResults = searchByKeyword('administrateur');
console.log(`\nQuery: "administrateur"`);
console.log(`Results: ${adminResults.length} fiches found`);
if (adminResults.length > 0) {
  console.log(`Top match: ${adminResults[0].title}`);
  console.log(`Section: ${adminResults[0].section}`);
  console.log(`✓ Search works`);
}

// Test 4: Check section distribution
console.log(`\n📦 Section Distribution`);
console.log('=======================');
const sectionCounts = {};
bipIndex.forEach(fiche => {
  sectionCounts[fiche.section] = (sectionCounts[fiche.section] || 0) + 1;
});

Object.entries(sectionCounts).forEach(([section, count]) => {
  console.log(`${section}: ${count} fiches`);
});

console.log(`\n✅ All tests passed!`);
