import type Phaser from 'phaser';
import {
  CHARACTER_APPEARANCES,
  isAppearanceAvailable,
  type CharacterAppearanceDef,
} from '../data/characterAppearances.ts';
import { ASSET_KEYS } from './AssetGenerator.ts';
import { WALLET_BANK_CONFIG, WALLET_BANK_QR_TEXTURE_KEY } from '../data/walletConfig.ts';

/** Icon cửa ải trên bản đồ — lorc/sword-clash.png */
export const MAP_STAGE_SWORD_ICON = 'icon_map_sword_clash';

/** Icon nút Bản Đồ sảnh chính — lorc/world.png */
export const HUB_MAP_WORLD_ICON = 'icon_hub_world';

/** Icon nút trận đấu */
export const BATTLE_FIGHT_ICON = 'icon_battle_fight';
export const BATTLE_BAG_ICON = 'icon_battle_bag';
export const BATTLE_SURRENDER_ICON = 'icon_battle_surrender';
export const BATTLE_SURRENDER_ICON_RED = 'icon_battle_surrender_red';

/** Chuyển icon trắng trên nền đen → silhouette màu + alpha (không còn nền đen). */
export function bakeTintedSilhouetteTexture(
  scene: Phaser.Scene,
  sourceKey: string,
  destKey: string,
  color: number,
): void {
  if (scene.textures.exists(destKey) || !scene.textures.exists(sourceKey)) return;

  const source = scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const w = source.width;
  const h = source.height;
  if (w < 1 || h < 1) return;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.drawImage(source, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;

  for (let i = 0; i < imageData.data.length; i += 4) {
    const lum = Math.max(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]);
    const alpha = imageData.data[i + 3];
    if (lum > 40 && alpha > 8) {
      const strength = lum / 255;
      imageData.data[i] = r;
      imageData.data[i + 1] = g;
      imageData.data[i + 2] = b;
      imageData.data[i + 3] = Math.round(255 * strength * (alpha / 255));
    } else {
      imageData.data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  scene.textures.addCanvas(destKey, canvas);
}

export function bakeBattleSurrenderIcon(scene: Phaser.Scene): void {
  bakeTintedSilhouetteTexture(scene, BATTLE_SURRENDER_ICON, BATTLE_SURRENDER_ICON_RED, 0xe74c3c);
}

export function characterIdleKey(appearanceId: string): string {
  return `char_${appearanceId}_idle`;
}

export function characterAttackKey(appearanceId: string): string {
  return `char_${appearanceId}_attack`;
}

/** Load PNG nhân vật (idle + attack) + nền sảnh + UI. NPC địch: queueNpcSpriteLoads — chỉ 1 ảnh. */
export function queueCharacterSpriteLoads(scene: Phaser.Scene): void {
  scene.load.image(ASSET_KEYS.bgMeditation, '/assets/bg/hub-main.jpg');
  scene.load.image(ASSET_KEYS.bgCharacterCreation, '/assets/bg/character-creation.jpg');
  scene.load.image(ASSET_KEYS.bgPlayerRoster, '/assets/bg/bg-player.jpg');
  scene.load.image(ASSET_KEYS.bgTeleportGate, '/assets/bg/cong-dich-chuyen.jpg');
  scene.load.image(ASSET_KEYS.bgVillage, '/assets/bg/village-bandit.jpg');
  scene.load.image(ASSET_KEYS.bgChapter1Arena, '/assets/bg/vo-dai-chuong-1.jpg');
  scene.load.image(ASSET_KEYS.bgChapter2Map, '/assets/bg/bg-chuong-2.jpg');
  scene.load.image(ASSET_KEYS.bgChapter2Arena, '/assets/bg/vo-dai-chuong-2.jpg');
  scene.load.image(ASSET_KEYS.bgChapter3Map, '/assets/bg/bg-chuong-3.jpg');
  scene.load.image(ASSET_KEYS.bgChapter3Arena, '/assets/bg/vo-dai-chuong-3.jpg');
  scene.load.image(ASSET_KEYS.bgChapter4Map, '/assets/bg/bg-chuong-4.jpg');
  scene.load.image(ASSET_KEYS.bgChapter4Arena, '/assets/bg/vo-dai-chuong-4.jpg');
  scene.load.image(ASSET_KEYS.bgChapter5Map, '/assets/bg/bg-chuong-6-7-8.jpg');
  scene.load.image(ASSET_KEYS.bgChapter5Arena, '/assets/bg/bg-chuong-6-7-8.jpg');
  scene.load.image(ASSET_KEYS.bgChapter6Map, '/assets/bg/bg-chuong-6.jpg');
  scene.load.image(ASSET_KEYS.bgChapter6Arena, '/assets/bg/bg-chuong-6.jpg');
  scene.load.image(ASSET_KEYS.bgChapter78Map, '/assets/bg/bg-chuong-6-7-8.jpg');
  scene.load.image(ASSET_KEYS.bgChapter78Arena, '/assets/bg/bg-chuong-6-7-8.jpg');
  scene.load.image(ASSET_KEYS.bgChapter9Map, '/assets/bg/bg-chuong-9.jpg');
  scene.load.image(ASSET_KEYS.bgChapter9Arena, '/assets/bg/bg-chuong-9.jpg');
  scene.load.image(MAP_STAGE_SWORD_ICON, '/assets/icons/lorc/sword-clash.png');
  scene.load.image(HUB_MAP_WORLD_ICON, '/assets/icons/lorc/world.png');
  scene.load.image(BATTLE_FIGHT_ICON, '/assets/icons/lorc/sword-clash.png');
  scene.load.image(BATTLE_BAG_ICON, '/assets/icons/delapouite/chest.png');
  scene.load.image(BATTLE_SURRENDER_ICON, '/assets/icons/lorc/palm.png');
  scene.load.image(ASSET_KEYS.hubPlayerProfile, '/assets/ui/player-avatar.png');
  scene.load.image(ASSET_KEYS.uiIconTinhThach, '/assets/ui/icon-tinh-thach.png');
  scene.load.image(ASSET_KEYS.uiIconGioiThuy, '/assets/ui/icon-gioi-thuy.png');
  scene.load.image(WALLET_BANK_QR_TEXTURE_KEY, WALLET_BANK_CONFIG.qrImagePath);
  scene.load.image(ASSET_KEYS.uiIconFriends, '/assets/ui/icon-friends.png');
  scene.load.image(ASSET_KEYS.uiIconShop, '/assets/ui/shop.png');

  for (const app of CHARACTER_APPEARANCES) {
    if (!app.idleFile) continue;
    scene.load.image(characterIdleKey(app.id), app.idleFile);
    if (app.attackFile) {
      scene.load.image(characterAttackKey(app.id), app.attackFile);
    }
  }
}

/** Gỡ texture lỗi (vd. Vite trả HTML thay vì ảnh khi sai đuôi file). */
export function purgeBrokenTexture(scene: Phaser.Scene, key: string): void {
  if (!scene.textures.exists(key)) return;
  const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | null;
  if (!src || src.naturalWidth < 4 || src.naturalHeight < 4) {
    scene.textures.remove(key);
  }
}

export { isUsableBgTexture } from './assetCore.ts';

export function resolveCharacterIdleKey(appearanceId: string | undefined): string | null {
  if (!appearanceId) return null;
  const key = characterIdleKey(appearanceId);
  return key;
}

export function resolveCharacterAttackKey(appearanceId: string | undefined): string | null {
  if (!appearanceId) return null;
  return characterAttackKey(appearanceId);
}

/** Texture key idle — ưu tiên PNG ngoại hình, fallback procedural. */
export function resolvePlayerDisplayKey(
  scene: Phaser.Scene,
  appearanceId: string | undefined,
  gender: 'nam' | 'nu',
  weapon: import('../types/game.ts').WeaponType,
): string {
  if (appearanceId) {
    const pngKey = characterIdleKey(appearanceId);
    if (scene.textures.exists(pngKey)) {
      return pngKey;
    }
  }
  return ASSET_KEYS.avatarPlayer(gender, weapon);
}

export function resolvePlayerAttackKey(
  scene: Phaser.Scene,
  appearanceId: string | undefined,
): string | null {
  if (!appearanceId) return null;
  const key = characterAttackKey(appearanceId);
  return scene.textures.exists(key) ? key : null;
}

export function listAvailableAppearances(): CharacterAppearanceDef[] {
  return CHARACTER_APPEARANCES.filter(isAppearanceAvailable);
}
