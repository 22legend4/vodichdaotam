import type Phaser from 'phaser';
import { ASSET_KEYS } from './AssetGenerator.ts';
import { NPC_APPEARANCES } from '../data/npcAppearances.ts';
import { NPC_MAX_INDEX } from '../data/npcsData.ts';

/** Ảnh sư phụ — nửa người, dùng chung cho Nam/Nữ. */
export const MASTER_PORTRAIT_FILE = '/assets/npcs/su-phu-nua-nguoi.png';

/** Texture key chung với avatar procedural — ưu tiên PNG nếu đã load. */
export function npcPortraitKey(npcId: string): string | null {
  const num = parseInt(npcId.replace('npc', ''), 10);
  if (Number.isNaN(num) || num < 1 || num > NPC_MAX_INDEX) return null;
  return ASSET_KEYS.npcAvatar(num);
}

/** NPC địch trong trận — không phải người chơi hay đồng đội. */
export function isNpcEnemyId(unitId: string): boolean {
  return /^npc\d+$/.test(unitId);
}

/** Load PNG NPC địch + ảnh sư phụ (BootScene.preload) — mỗi NPC tối đa một ảnh. */
export function queueNpcSpriteLoads(scene: Phaser.Scene): void {
  for (const def of NPC_APPEARANCES) {
    if (!def.portraitFile) continue;
    const key = npcPortraitKey(def.npcId);
    if (!key) continue;
    scene.load.image(key, def.portraitFile);
  }

  for (const gender of ['nam', 'nu'] as const) {
    scene.load.image(ASSET_KEYS.avatarMaster(gender), MASTER_PORTRAIT_FILE);
  }
}

export function purgeBrokenNpcPortraits(scene: Phaser.Scene): void {
  for (const def of NPC_APPEARANCES) {
    if (!def.portraitFile) continue;
    const key = npcPortraitKey(def.npcId);
    if (!key || !scene.textures.exists(key)) continue;
    const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | null;
    if (!src || src.naturalWidth < 4 || src.naturalHeight < 4) {
      scene.textures.remove(key);
    }
  }

  for (const gender of ['nam', 'nu'] as const) {
    const key = ASSET_KEYS.avatarMaster(gender);
    if (!scene.textures.exists(key)) continue;
    const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | null;
    if (!src || src.naturalWidth < 4 || src.naturalHeight < 4) {
      scene.textures.remove(key);
    }
  }
}
