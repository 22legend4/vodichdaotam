/**
 * Build bản itch.io (base tương đối) và nén dist-itch → release/vodichdaotam-itch.zip
 * Cấu trúc zip: index.html ở gốc (đúng yêu cầu itch HTML).
 * itch chạy trên Linux — entry trong zip phải dùng `/`, không phải `\`.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist-itch');
const releaseDir = join(root, 'release');
const zipPath = join(releaseDir, 'vodichdaotam-itch.zip');

console.log('[itch] Building (mode=itch, outDir=dist-itch)...');
execSync('npm run build:itch', { cwd: root, stdio: 'inherit' });

if (!existsSync(join(distDir, 'index.html'))) {
  console.error('[itch] Missing dist-itch/index.html — build failed.');
  process.exit(1);
}

mkdirSync(releaseDir, { recursive: true });
if (existsSync(zipPath)) unlinkSync(zipPath);

const ps1 = join(root, 'scripts', 'packItchZip.ps1');
execSync(
  `powershell -NoProfile -ExecutionPolicy Bypass -File "${ps1}" -DistDir "${distDir}" -ZipPath "${zipPath}"`,
  { cwd: root, stdio: 'inherit' },
);

function readZipEntryNames(data) {
  const entries = [];
  let offset = 0;
  while (offset < data.length) {
    const sig = data.readUInt32LE(offset);
    if (sig === 0x06054b50) break;
    if (sig !== 0x04034b50) break;
    const compSize = data.readUInt32LE(offset + 18);
    const nameLen = data.readUInt16LE(offset + 26);
    const extraLen = data.readUInt16LE(offset + 28);
    const name = data.slice(offset + 30, offset + 30 + nameLen).toString('utf8');
    entries.push(name);
    offset = offset + 30 + nameLen + extraLen + compSize;
  }
  return entries;
}

const entries = readZipEntryNames(readFileSync(zipPath));
const badPaths = entries.filter((name) => name.includes('\\'));
if (badPaths.length > 0) {
  console.error('[itch] Zip contains backslash paths (itch will 404 assets):', badPaths.slice(0, 5));
  process.exit(1);
}
if (!entries.includes('index.html')) {
  console.error('[itch] Zip missing index.html at root.');
  process.exit(1);
}
const jsEntry = entries.find((name) => /^assets\/index-.*\.js$/.test(name));
if (!jsEntry) {
  console.error('[itch] Zip missing bundled JS under assets/.');
  process.exit(1);
}

console.log(`[itch] Done → ${zipPath}`);
console.log(`[itch] Verified ${entries.length} entries, js=${jsEntry}`);
console.log('[itch] Upload file zip lên itch.io, Kind: HTML, viewport 1280×720.');
