import fs from 'node:fs';

const raw = fs.readFileSync('src/data/iconManifest.ts', 'utf8');
const manifest = raw.match(/export const ICON_MANIFEST: string\[\] = (\[[\s\S]*?\]);/)?.[1];
if (!manifest) throw new Error('manifest not found');
const files = JSON.parse(manifest);

const SLOT_KEYWORDS = {
  hub_meditate: ['yin-yang', 'meditation', 'lotus', 'zen'],
  hub_forge: ['sword', 'blade', 'spear', 'slashing', 'fist', 'shield'],
  skill_martial: ['sword', 'blade', 'spear', 'fist', 'shield', 'slashing'],
  item_medicine: ['flask', 'vial', 'potion', 'pill', 'herb'],
  hub_inventory: ['knapsack', 'crate', 'bag'],
  hub_settings: ['gear', 'cog'],
  equip_gear: ['armor', 'boots', 'hood'],
  beast_pet: ['dragon', 'wolf', 'fox'],
  hub_event: ['gift', 'trophy'],
  hub_map: ['scroll', 'map'],
  hub_shop: ['gift', 'crate', 'bag'],
  hub_character: ['hood', 'armor', 'wolf'],
};

function scoreFileName(filePath, keywords) {
  const stem = filePath.split('/').pop().replace(/\.png$/i, '').toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (stem.includes(kw)) score += kw.length * 10;
  }
  return score;
}

const candidates = [];
for (const [slot, keywords] of Object.entries(SLOT_KEYWORDS)) {
  for (const file of files) {
    const score = scoreFileName(file, keywords);
    if (score > 0) candidates.push({ slot, file, score });
  }
}
candidates.sort((a, b) => b.score - a.score);

const usedFiles = new Set();
const result = {};
for (const c of candidates) {
  if (result[c.slot] || usedFiles.has(c.file)) continue;
  usedFiles.add(c.file);
  result[c.slot] = c;
}

console.log(`Matched ${Object.keys(result).length} / ${Object.keys(SLOT_KEYWORDS).length} slots:\n`);
for (const [slot, c] of Object.entries(result)) {
  console.log(`  ${slot.padEnd(16)} → ${c.file}`);
}
