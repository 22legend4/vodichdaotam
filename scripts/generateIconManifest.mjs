import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'public', 'assets', 'icons');
const OUT = path.resolve(process.cwd(), 'src', 'data', 'iconManifest.ts');

/** Quét đệ quy mọi PNG trong public/assets/icons/. */
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

const icons = scanIcons(ROOT);
const body = `/** Tự sinh bởi scripts/generateIconManifest.mjs — không sửa tay. */
export const ICON_MANIFEST: string[] = ${JSON.stringify(icons, null, 2)};
export const ICON_MANIFEST_GENERATED_AT = ${JSON.stringify(new Date().toISOString())};
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, body, 'utf8');
console.log(`[icon-manifest] ${icons.length} PNG → ${path.relative(process.cwd(), OUT)}`);
