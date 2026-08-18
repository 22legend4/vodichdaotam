import Phaser from 'phaser';
import type { ItemRarity, WeaponType } from '../types/game.ts';
import type { Gfx } from './assetCore.ts';

export const AVATAR_W = 96;
export const AVATAR_H = 128;

export const RARITY_COLORS: Record<ItemRarity, { primary: number; glow: number; label: string }> = {
  dong: { primary: 0xb87333, glow: 0xcd7f32, label: 'Luyện Thể' },
  bac: { primary: 0xa8a9ad, glow: 0xe8e8e8, label: 'Nhất Tinh' },
  vang: { primary: 0xffd700, glow: 0xfff4a3, label: 'Tam Tinh' },
  kimcuong: { primary: 0x7fdbff, glow: 0xe0ffff, label: 'Huyền' },
  than: { primary: 0x4a0e6b, glow: 0x9b59b6, label: 'Thiên' },
};

export function npcBorderRarity(index: number): ItemRarity {
  if (index <= 3) return 'dong';
  if (index <= 7) return 'bac';
  if (index <= 14) return 'vang';
  if (index <= 19) return 'kimcuong';
  return 'than';
}

type SkillIcon = 'quyen' | 'kiem' | 'dao' | 'thuong' | 'dodon' | 'special';

const NPC_SKILL_ICON: SkillIcon[] = [
  'quyen', 'quyen', 'quyen',
  'quyen', 'kiem', 'dao', 'thuong',
  'dodon', 'kiem', 'dao', 'thuong', 'quyen', 'kiem', 'dao',
  'special', 'dao', 'kiem', 'quyen', 'thuong',
  'special', 'kiem', 'dao', 'thuong', 'quyen', 'special', 'dodon', 'special', 'special',
];

const SKIN = 0xf5cba7;
const SKIN_SHADOW = 0xd4a574;

function drawGroundShadow(gfx: Gfx, cx: number, footY: number, w: number): void {
  gfx.fillStyle(0x000000, 0.28);
  gfx.fillEllipse(cx, footY + 2, w, 10);
}

function drawAura(gfx: Gfx, cx: number, cy: number, r: number, color: number, alpha: number): void {
  gfx.fillStyle(color, alpha * 0.35);
  gfx.fillCircle(cx, cy, r);
  gfx.fillStyle(color, alpha * 0.2);
  gfx.fillCircle(cx, cy, r * 0.65);
  gfx.lineStyle(1, color, alpha * 0.5);
  gfx.strokeCircle(cx, cy, r * 0.85);
}

function drawFace(gfx: Gfx, cx: number, cy: number, size: number): void {
  gfx.fillStyle(SKIN, 1);
  gfx.fillCircle(cx, cy, size);
  gfx.fillStyle(SKIN_SHADOW, 0.4);
  gfx.fillEllipse(cx, cy + size * 0.35, size * 0.7, size * 0.25);
  gfx.fillStyle(0x2c1810, 1);
  gfx.fillCircle(cx - size * 0.32, cy - size * 0.12, size * 0.14);
  gfx.fillCircle(cx + size * 0.32, cy - size * 0.12, size * 0.14);
  gfx.fillStyle(0xc0392b, 0.7);
  gfx.fillEllipse(cx, cy + size * 0.25, size * 0.22, size * 0.1);
}

function drawHairBun(gfx: Gfx, cx: number, cy: number, color: number, gender: 'nam' | 'nu'): void {
  gfx.fillStyle(color, 1);
  if (gender === 'nam') {
    gfx.fillRect(cx - 14, cy - 18, 28, 10);
    gfx.fillRect(cx - 16, cy - 16, 8, 18);
    gfx.fillRect(cx + 8, cy - 16, 8, 18);
    gfx.fillStyle(0xfca311, 1);
    gfx.fillCircle(cx, cy - 20, 6);
    gfx.fillStyle(color, 1);
    gfx.fillRect(cx - 3, cy - 26, 6, 10);
  } else {
    gfx.fillEllipse(cx, cy - 16, 26, 14);
    gfx.fillRect(cx - 18, cy - 14, 10, 32);
    gfx.fillRect(cx + 8, cy - 14, 10, 32);
    gfx.fillStyle(0xe84393, 0.8);
    gfx.fillCircle(cx, cy - 22, 7);
    gfx.lineStyle(2, 0xfca311, 0.7);
    gfx.strokeCircle(cx, cy - 22, 8);
  }
}

function drawRobeBody(
  gfx: Gfx,
  cx: number,
  shoulderY: number,
  robe: number,
  robeLight: number,
  gender: 'nam' | 'nu',
  footY: number,
): void {
  const hemY = footY - 4;
  gfx.fillStyle(robe, 1);
  if (gender === 'nam') {
    gfx.fillTriangle(cx - 22, shoulderY + 8, cx + 22, shoulderY + 8, cx, hemY);
    gfx.fillRect(cx - 8, shoulderY - 4, 16, hemY - shoulderY);
  } else {
    gfx.fillTriangle(cx - 26, shoulderY + 6, cx + 26, shoulderY + 6, cx, hemY);
    gfx.lineStyle(2, robeLight, 0.6);
    gfx.beginPath();
    gfx.moveTo(cx - 20, shoulderY + 20);
    gfx.lineTo(cx - 28, hemY - 8);
    gfx.moveTo(cx + 20, shoulderY + 20);
    gfx.lineTo(cx + 28, hemY - 8);
    gfx.strokePath();
  }
  gfx.fillStyle(robeLight, 0.85);
  gfx.fillRect(cx - 5, shoulderY, 10, hemY - shoulderY - 10);
  gfx.lineStyle(2, 0xfca311, 0.55);
  gfx.strokeRect(cx - 5, shoulderY, 10, hemY - shoulderY - 10);

  // Tay áo
  gfx.fillStyle(robe, 1);
  gfx.fillRoundedRect(cx - 28, shoulderY + 2, 12, 28, 4);
  gfx.fillRoundedRect(cx + 16, shoulderY + 2, 12, 28, 4);
  gfx.fillStyle(SKIN, 1);
  gfx.fillCircle(cx - 22, shoulderY + 32, 5);
  gfx.fillCircle(cx + 22, shoulderY + 32, 5);
}

function drawWeaponInHand(
  gfx: Gfx,
  cx: number,
  handY: number,
  weapon: WeaponType,
  facingRight: boolean,
): void {
  const dir = facingRight ? 1 : -1;
  const hx = cx + 22 * dir;
  const glow = weapon === 'dao' ? 0xff6b6b : weapon === 'kiem' ? 0x74b9ff : 0xfca311;

  gfx.fillStyle(glow, 0.2);
  gfx.fillCircle(hx, handY, 16);

  switch (weapon) {
    case 'kiem':
      gfx.fillStyle(0xbdc3c7, 1);
      gfx.fillRect(hx - 2, handY - 28, 4, 38);
      gfx.fillStyle(0xd4af37, 1);
      gfx.fillRect(hx - 5, handY + 8, 10, 4);
      gfx.lineStyle(1, glow, 0.95);
      gfx.strokeRect(hx - 2, handY - 28, 4, 38);
      break;
    case 'dao':
      gfx.fillStyle(0xc0392b, 1);
      gfx.fillTriangle(hx - 16 * dir, handY + 6, hx + 4 * dir, handY - 12, hx + 4 * dir, handY + 10);
      gfx.fillStyle(0x8b4513, 1);
      gfx.fillRect(hx, handY, 4 * dir, 14);
      gfx.lineStyle(1, glow, 0.9);
      gfx.strokeTriangle(hx - 16 * dir, handY + 6, hx + 4 * dir, handY - 12, hx + 4 * dir, handY + 10);
      break;
    case 'thuong':
      gfx.fillStyle(0x95a5a6, 1);
      gfx.fillRect(hx - 1, handY - 36, 3, 44);
      gfx.fillStyle(0xc0392b, 1);
      gfx.fillTriangle(hx - 10, handY - 30, hx + 9, handY - 30, hx, handY - 42);
      gfx.fillStyle(0xd4af37, 1);
      gfx.fillRect(hx - 4, handY + 6, 8, 5);
      break;
    default:
      gfx.fillStyle(SKIN, 1);
      gfx.fillCircle(hx - 8 * dir, handY - 6, 6);
      gfx.fillCircle(hx + 8 * dir, handY - 6, 6);
      gfx.lineStyle(2, glow, 0.75);
      gfx.strokeCircle(hx - 8 * dir, handY - 6, 8);
      gfx.strokeCircle(hx + 8 * dir, handY - 6, 8);
      gfx.fillStyle(glow, 0.4);
      gfx.fillCircle((hx - 8 * dir + hx + 8 * dir) / 2, handY - 8, 4);
  }
}

/** Mô hình người Nam/Nữ tiên hiệp đầy đủ. */
export function drawPlayerAvatarGfx(
  gfx: Gfx,
  w: number,
  h: number,
  gender: 'nam' | 'nu',
  weapon: WeaponType = 'quyen',
): void {
  const cx = w / 2;
  const footY = h - 10;
  const auraColor = gender === 'nam' ? 0x3498db : 0xe84393;
  const robe = gender === 'nam' ? 0x1a508b : 0xf8b4d9;
  const robeLight = gender === 'nam' ? 0x2980b9 : 0xffffff;
  const hair = gender === 'nam' ? 0x2c1810 : 0x1a1a2e;

  drawGroundShadow(gfx, cx, footY, 38);
  drawAura(gfx, cx, h * 0.52, 44, auraColor, 0.18);

  const shoulderY = h * 0.38;
  drawRobeBody(gfx, cx, shoulderY, robe, robeLight, gender, footY);
  drawFace(gfx, cx, shoulderY - 14, 12);
  drawHairBun(gfx, cx, shoulderY - 14, hair, gender);
  drawWeaponInHand(gfx, cx, shoulderY + 28, weapon, true);
}

/** Tên Cướp – võ phục nâu xám, khăn mặt, đao hung tợn. */
export function drawBanditAvatarGfx(gfx: Gfx, w: number, h: number): void {
  const cx = w / 2;
  const footY = h - 10;

  drawGroundShadow(gfx, cx, footY, 36);
  drawAura(gfx, cx, h * 0.52, 40, 0x8b0000, 0.12);

  const shoulderY = h * 0.38;
  gfx.fillStyle(0x5c4033, 1);
  gfx.fillTriangle(cx - 20, shoulderY + 8, cx + 20, shoulderY + 8, cx, footY - 4);
  gfx.fillStyle(0x6b3a2a, 1);
  gfx.fillRoundedRect(cx - 24, shoulderY + 2, 48, 34, 4);
  gfx.fillStyle(0x4a3728, 1);
  gfx.fillRoundedRect(cx - 26, shoulderY, 14, 30, 3);
  gfx.fillRoundedRect(cx + 12, shoulderY, 14, 30, 3);

  drawFace(gfx, cx, shoulderY - 12, 11);
  gfx.fillStyle(0x3d2817, 1);
  gfx.fillRect(cx - 12, shoulderY - 20, 24, 8);
  gfx.fillStyle(0x2c1810, 0.9);
  gfx.fillRect(cx - 11, shoulderY - 16, 22, 5);

  drawWeaponInHand(gfx, cx, shoulderY + 26, 'dao', true);
  gfx.fillStyle(0xff0000, 0.35);
  gfx.fillCircle(cx + 18, shoulderY + 20, 5);
}

/** Sư Phụ – lão gia tóc trắng râu dài, áo đạo gia uy nghi. */
export function drawMasterAvatarGfx(gfx: Gfx, w: number, h: number, gender: 'nam' | 'nu'): void {
  const cx = w / 2;
  const footY = h - 10;
  const robe = gender === 'nam' ? 0x2c3e50 : 0x5b2c6f;
  const robeLight = 0xecf0f1;

  drawGroundShadow(gfx, cx, footY, 40);
  drawAura(gfx, cx, h * 0.5, 48, 0xfca311, 0.22);

  const shoulderY = h * 0.36;
  drawRobeBody(gfx, cx, shoulderY, robe, robeLight, gender, footY);

  drawFace(gfx, cx, shoulderY - 14, 12);
  gfx.fillStyle(0xecf0f1, 1);
  if (gender === 'nam') {
    gfx.fillRect(cx - 16, shoulderY - 24, 32, 14);
    gfx.fillRect(cx - 20, shoulderY - 22, 10, 24);
    gfx.fillRect(cx + 10, shoulderY - 22, 10, 24);
    gfx.fillStyle(0xd5d8dc, 1);
    gfx.fillTriangle(cx - 8, shoulderY + 4, cx + 8, shoulderY + 4, cx, shoulderY + 36);
  } else {
    gfx.fillEllipse(cx, shoulderY - 20, 28, 16);
    gfx.fillRect(cx - 22, shoulderY - 18, 12, 34);
    gfx.fillRect(cx + 10, shoulderY - 18, 12, 34);
  }

  gfx.lineStyle(2, 0xffd700, 0.7);
  gfx.strokeCircle(cx, h * 0.5, 42);
}

/** 28 NPC – mô hình người theo cảnh giới (màu trang phục + aura). */
export function drawNpcAvatarGfx(gfx: Gfx, w: number, h: number, index: number): void {
  if (index === 1) {
    drawBanditAvatarGfx(gfx, w, h);
    return;
  }

  const rarity = npcBorderRarity(index);
  const cfg = RARITY_COLORS[rarity];
  const skillIcon = NPC_SKILL_ICON[index - 1] ?? 'quyen';
  const hue = (index * 37) % 360;
  const body = Phaser.Display.Color.HSLToColor(hue / 360, 0.42, 0.32).color;
  const bodyLight = Phaser.Display.Color.HSLToColor(hue / 360, 0.35, 0.48).color;
  const isBoss = index >= 20;
  const cx = w / 2;
  const footY = h - 10;
  const shoulderY = h * 0.38;

  drawGroundShadow(gfx, cx, footY, isBoss ? 44 : 36);
  drawAura(gfx, cx, h * 0.52, isBoss ? 50 : 40, cfg.glow, isBoss ? 0.28 : 0.15);

  drawRobeBody(gfx, cx, shoulderY, body, bodyLight, index % 2 === 0 ? 'nu' : 'nam', footY);
  drawFace(gfx, cx, shoulderY - 12, isBoss ? 13 : 11);

  const hairCol = Phaser.Display.Color.HSLToColor((hue + 180) / 360, 0.3, 0.2).color;
  drawHairBun(gfx, cx, shoulderY - 12, hairCol, index % 2 === 0 ? 'nu' : 'nam');

  const weaponTypes: WeaponType[] = ['quyen', 'kiem', 'dao', 'thuong'];
  const weapon = weaponTypes[index % 4]!;
  drawWeaponInHand(gfx, cx, shoulderY + 28, weapon, index % 3 !== 0);

  if (isBoss) {
    gfx.lineStyle(2, cfg.glow, 0.9);
    gfx.strokeCircle(cx, h * 0.52, 46);
  }

  drawSkillTypeBadge(gfx, w - 14, 14, skillIcon, cfg.glow);
}

function drawSkillTypeBadge(gfx: Gfx, x: number, y: number, type: SkillIcon, color: number): void {
  gfx.fillStyle(0x0f0f1a, 0.85);
  gfx.fillCircle(x, y, 10);
  gfx.lineStyle(2, color, 1);
  gfx.strokeCircle(x, y, 10);
  gfx.fillStyle(color, 1);
  switch (type) {
    case 'kiem':
      gfx.fillRect(x - 1, y - 6, 2, 10);
      break;
    case 'dao':
      gfx.fillTriangle(x - 5, y + 2, x + 3, y - 4, x + 3, y + 3);
      break;
    case 'thuong':
      gfx.fillRect(x - 1, y - 7, 2, 12);
      break;
    case 'dodon':
      gfx.fillCircle(x, y, 4);
      break;
    case 'special':
      gfx.fillStyle(0xfca311, 1);
      gfx.fillRect(x - 3, y - 3, 6, 6);
      break;
    default:
      gfx.fillCircle(x - 3, y, 3);
      gfx.fillCircle(x + 3, y, 3);
  }
}

export function drawRarityIconGfx(gfx: Gfx, size: number, rarity: ItemRarity): void {
  const cfg = RARITY_COLORS[rarity];
  gfx.fillStyle(0x0f0f1a, 0.9);
  gfx.fillRoundedRect(0, 0, size, size, 6);
  gfx.lineStyle(3, cfg.glow, 1);
  gfx.strokeRoundedRect(2, 2, size - 4, size - 4, 5);
  gfx.fillStyle(cfg.primary, 1);
  gfx.fillCircle(size / 2, size / 2, 14);
}

export function drawDialogPanelGfx(gfx: Gfx, w: number, h: number): void {
  gfx.fillStyle(0x16213e, 0.95);
  gfx.fillRoundedRect(0, 0, w, h, 12);
  gfx.lineStyle(4, 0xfca311, 1);
  gfx.strokeRoundedRect(2, 2, w - 4, h - 4, 10);
  gfx.lineStyle(2, 0xe94560, 0.7);
  gfx.strokeRoundedRect(10, 10, w - 20, h - 20, 8);
}

export function drawUiButtonGfx(gfx: Gfx, w: number, h: number, hover: boolean): void {
  const fill = hover ? 0x1a508b : 0x0f3460;
  const border = hover ? 0xfca311 : 0xe94560;
  gfx.fillStyle(fill, 1);
  gfx.fillRoundedRect(2, 2, w - 4, h - 4, 10);
  gfx.lineStyle(2, border, 1);
  gfx.strokeRoundedRect(2, 2, w - 4, h - 4, 10);
}

export function drawStatBarBgGfx(gfx: Gfx, w: number, h: number, bgColor: number): void {
  gfx.fillStyle(bgColor, 1);
  gfx.fillRoundedRect(0, 0, w, h, 4);
}

export function drawStatBarFillGfx(gfx: Gfx, w: number, h: number, fillColor: number): void {
  gfx.fillStyle(fillColor, 1);
  gfx.fillRoundedRect(0, 0, w - 2, h - 2, 3);
}

/** Nút tròn Chiến Luôn / Túi đồ / Nhận Thua. */
export function drawRoundButtonGfx(
  gfx: Gfx,
  size: number,
  kind: 'fight' | 'bag' | 'surrender',
): void {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 3;
  const fill = kind === 'surrender' ? 0xf5e6ca : kind === 'fight' ? 0xc0392b : 0x1a508b;
  const border = kind === 'surrender' ? 0xd4af37 : 0xfca311;

  gfx.fillStyle(0x0a0a14, 0.35);
  gfx.fillCircle(cx, cy + 3, r);
  gfx.fillStyle(fill, 1);
  gfx.fillCircle(cx, cy, r);
  gfx.lineStyle(3, border, 1);
  gfx.strokeCircle(cx, cy, r);

  gfx.fillStyle(kind === 'surrender' ? 0x5c4033 : 0xffffff, kind === 'surrender' ? 0.9 : 1);
  if (kind === 'fight') {
    gfx.fillTriangle(cx - 10, cy - 8, cx + 12, cy, cx - 10, cy + 8);
    gfx.fillRect(cx - 14, cy - 3, 6, 6);
  } else if (kind === 'bag') {
    gfx.fillRoundedRect(cx - 12, cy - 6, 24, 18, 4);
    gfx.fillStyle(0xd4af37, 1);
    gfx.fillRect(cx - 8, cy - 10, 16, 5);
  } else {
    gfx.fillStyle(0x8b4513, 1);
    gfx.fillRect(cx - 10, cy - 2, 20, 3);
    gfx.fillRect(cx - 6, cy + 2, 12, 8);
  }
}

/** Khung ô võ kỹ góc dưới-phải. */
export function drawSkillSlotFrameGfx(gfx: Gfx, size: number): void {
  gfx.fillStyle(0x0f3460, 0.95);
  gfx.fillRoundedRect(0, 0, size, size, 10);
  gfx.lineStyle(3, 0xfca311, 1);
  gfx.strokeRoundedRect(2, 2, size - 4, size - 4, 8);
  gfx.lineStyle(1, 0xe94560, 0.6);
  gfx.strokeRoundedRect(8, 8, size - 16, size - 16, 6);
}
