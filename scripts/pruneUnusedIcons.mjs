import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'public', 'assets', 'icons');
const SRC = path.resolve(process.cwd(), 'src');

/** Icon cố định — khớp iconAssets / characterSpriteAssets / teleportGateAssets. */
const HARDCODED_ICON_PATHS = [
  'lorc/burning-passion.png',
  'delapouite/pencil.png',
  'lorc/fist.png',
  'delapouite/present.png',
  'lorc/sword-clash.png',
  'lorc/world.png',
  'delapouite/chest.png',
  'lorc/palm.png',
  'hoa-tinh-linh.png',
  'huyet-long-tri.png',
  'chuyen-sinh-dan.png',
];

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
  hub_daily: ['present', 'gift', 'wrapped'],
  hub_map: ['scroll', 'map'],
  hub_shop: ['gift', 'crate', 'bag'],
  hub_character: ['hood', 'armor', 'wolf'],
};

const SLOT_ICON_OVERRIDES = {
  skill_martial: 'lorc/fist.png',
  hub_daily: 'delapouite/present.png',
};

function scanIcons(dir, prefix = '') {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanIcons(full, rel.replace(/\\/g, '/')));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
      files.push(rel.replace(/\\/g, '/'));
    }
  }
  return files.sort();
}

function extractIconPathsFromFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const matches = text.match(/['"]([a-z0-9-]+\/[^'"]+\.png)['"]/gi) ?? [];
  const paths = new Set();
  for (const m of matches) {
    paths.add(m.slice(1, -1).replace(/\\/g, '/'));
  }
  return paths;
}

function scoreFileName(filePath, keywords) {
  const base = filePath.replace(/\\/g, '/').split('/').pop()?.toLowerCase() ?? '';
  const stem = base.replace(/\.png$/i, '');
  let score = 0;
  for (const kw of keywords) {
    if (stem.includes(kw)) score += kw.length * 10;
  }
  return score;
}

function resolveIconMatches(manifest) {
  const slots = Object.keys(SLOT_KEYWORDS);
  const candidates = [];
  const usedFiles = new Set();
  const slotFilled = new Set();
  const result = new Set();

  for (const slot of slots) {
    const overridePath = SLOT_ICON_OVERRIDES[slot];
    if (overridePath && manifest.includes(overridePath)) {
      usedFiles.add(overridePath);
      slotFilled.add(slot);
      result.add(overridePath);
    }
  }

  for (const slot of slots) {
    for (const file of manifest) {
      const score = scoreFileName(file, SLOT_KEYWORDS[slot]);
      if (score > 0) candidates.push({ slot, file, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  for (const c of candidates) {
    if (slotFilled.has(c.slot) || usedFiles.has(c.file)) continue;
    usedFiles.add(c.file);
    slotFilled.add(c.slot);
    result.add(c.file);
  }

  return result;
}

function removeEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const child = path.join(dir, entry.name);
      removeEmptyDirs(child);
      if (fs.readdirSync(child).length === 0) {
        fs.rmdirSync(child);
      }
    }
  }
}

const manifest = scanIcons(ROOT);
const used = new Set(HARDCODED_ICON_PATHS);

for (const rel of extractIconPathsFromFile(path.join(SRC, 'data', 'itemIconPaths.ts'))) {
  used.add(rel);
}
for (const rel of extractIconPathsFromFile(path.join(SRC, 'data', 'skillsData.ts'))) {
  used.add(rel);
}
for (const rel of resolveIconMatches(manifest)) {
  used.add(rel);
}

let deleted = 0;
let deletedBytes = 0;
const missing = [];

for (const rel of used) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) missing.push(rel);
}

for (const rel of manifest) {
  if (used.has(rel)) continue;
  const full = path.join(ROOT, rel);
  const stat = fs.statSync(full);
  deletedBytes += stat.size;
  fs.unlinkSync(full);
  deleted += 1;
}

removeEmptyDirs(ROOT);

console.log(`[icons:prune] manifest: ${manifest.length} PNG`);
console.log(`[icons:prune] keep:   ${used.size} unique path(s)`);
console.log(`[icons:prune] delete: ${deleted} PNG (${(deletedBytes / 1024 / 1024).toFixed(2)} MB)`);
if (missing.length > 0) {
  console.warn(`[icons:prune] missing ${missing.length} referenced PNG:`);
  for (const m of missing) console.warn(`  - ${m}`);
}
