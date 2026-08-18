import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

const manifestRaw = fs.readFileSync(path.join(root, 'src/data/iconManifest.ts'), 'utf8');
const manifestPaths = new Set([...manifestRaw.matchAll(/"([^"]+\.png)"/g)].map((m) => m[1]));

const iconPathsRaw = fs.readFileSync(path.join(root, 'src/data/itemIconPaths.ts'), 'utf8');
const mapped = Object.fromEntries(
  [...iconPathsRaw.matchAll(/^\s+(\w+):\s+'([^']+)'/gm)].map((m) => [m[1], m[2]]),
);

const EQUIP_VARIANTS = {
  dao: [
    'lorc/saber-slash.png',
    'lorc/crescent-blade.png',
    'lorc/thunder-blade.png',
    'lorc/relic-blade.png',
    'lorc/dripping-blade.png',
    'lorc/bat-blade.png',
  ],
  thuong: ['lorc/spear-hook.png', 'lorc/spears.png'],
  kiem: [
    'lorc/broadsword.png',
    'lorc/sword-hilt.png',
    'lorc/sparkling-sabre.png',
    'lorc/crossed-sabres.png',
    'lorc/lightning-saber.png',
    'delapouite/ancient-sword.png',
  ],
  quyen: ['delapouite/gauntlet.png', 'lorc/fist.png', 'lorc/mailed-fist.png', 'lorc/thor-fist.png'],
  head: [
    'lorc/hood.png',
    'delapouite/samurai-helmet.png',
    'delapouite/centurion-helmet.png',
    'delapouite/robin-hood-hat.png',
  ],
  body: [
    'delapouite/abdominal-armor.png',
    'delapouite/chest-armor.png',
    'delapouite/leather-armor.png',
    'delapouite/belt-armor.png',
  ],
  feet: ['lorc/boots.png', 'lorc/steeltoe-boots.png'],
};

function extractIds(filePath, pattern) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return [...raw.matchAll(pattern)].map((m) => m[1]);
}

const itemIds = [
  ...extractIds(path.join(root, 'src/data/itemsData.ts'), /(?:med|misc|shard|beast)\(\s*\n?\s*'([^']+)'/g),
  ...extractIds(path.join(root, 'src/data/eventItems.ts'), /id:\s*'([^']+)'/g),
  ...extractIds(path.join(root, 'src/data/equipmentCatalog.ts'), /id:\s*'([^']+)'/g),
];

/** med_gioiThuy / cur_gioiThuy dùng PNG riêng trong public/assets/ui/. */
const HUB_UI_ITEMS = new Set(['med_gioiThuy', 'cur_gioiThuy']);

const missingFiles = Object.entries(mapped).filter(([, p]) => !manifestPaths.has(p));
const noMapping = [...new Set(itemIds)].filter((id) => !mapped[id] && !HUB_UI_ITEMS.has(id)).sort();

console.log('=== Mapped paths but PNG not in manifest ===');
for (const [id, p] of missingFiles) console.log(`${id}\t${p}`);

console.log('\n=== Item IDs without ITEM_ICON_PATHS (excl. hub UI icons) ===');
for (const id of noMapping) console.log(id);

console.log('\n=== Equipment variant PNGs missing from manifest ===');
for (const p of new Set(Object.values(EQUIP_VARIANTS).flat())) {
  if (!manifestPaths.has(p)) console.log(p);
}

console.log('\n=== Summary ===');
console.log(`Broken mappings: ${missingFiles.length}`);
console.log(`No mapping: ${noMapping.length}`);
