import type { ItemRarity, WeaponType } from '../types/game.ts';
import type { Gfx } from './assetCore.ts';
import { RARITY_COLORS } from './assetDrawCharacters.ts';

const ICON = 48;

export function drawEquipmentIconGfx(
  gfx: Gfx,
  slot: 'weapon' | 'head' | 'body' | 'feet',
  weaponType: WeaponType | null,
  rarity: ItemRarity,
): void {
  const cfg = RARITY_COLORS[rarity];
  gfx.fillStyle(0x0f0f1a, 0.95);
  gfx.fillRoundedRect(0, 0, ICON, ICON, 6);
  gfx.lineStyle(3, cfg.glow, 1);
  gfx.strokeRoundedRect(2, 2, ICON - 4, ICON - 4, 5);
  gfx.fillStyle(cfg.primary, 0.3);
  gfx.fillRoundedRect(6, 6, ICON - 12, ICON - 12, 4);

  switch (slot) {
    case 'weapon':
      drawWeaponIcon(gfx, ICON / 2, ICON / 2, weaponType ?? 'quyen', cfg.glow);
      break;
    case 'head':
      gfx.fillStyle(cfg.primary, 1);
      gfx.fillRoundedRect(ICON / 2 - 12, ICON / 2 - 10, 24, 16, 4);
      break;
    case 'body':
      gfx.fillStyle(cfg.primary, 1);
      gfx.fillRoundedRect(ICON / 2 - 14, ICON / 2 - 8, 28, 22, 4);
      break;
    case 'feet':
      gfx.fillStyle(cfg.primary, 1);
      gfx.fillRoundedRect(ICON / 2 - 12, ICON / 2 + 2, 10, 12, 2);
      gfx.fillRoundedRect(ICON / 2 + 2, ICON / 2 + 2, 10, 12, 2);
      break;
  }
}

function drawWeaponIcon(gfx: Gfx, cx: number, cy: number, type: WeaponType, glow: number): void {
  switch (type) {
    case 'kiem':
      gfx.fillStyle(0xc0c0c0, 1);
      gfx.fillRect(cx - 2, cy - 14, 4, 24);
      gfx.fillStyle(glow, 0.5);
      gfx.fillRect(cx - 1, cy - 14, 2, 24);
      break;
    case 'dao':
      gfx.fillStyle(0xc0392b, 1);
      gfx.fillTriangle(cx - 12, cy + 4, cx + 4, cy - 6, cx + 4, cy + 8);
      break;
    case 'thuong':
      gfx.fillStyle(0x95a5a6, 1);
      gfx.fillRect(cx - 1, cy - 16, 3, 28);
      gfx.fillTriangle(cx - 6, cy - 12, cx + 5, cy - 12, cx, cy - 20);
      break;
    default:
      gfx.fillStyle(glow, 0.6);
      gfx.fillCircle(cx - 5, cy, 5);
      gfx.fillCircle(cx + 5, cy, 5);
  }
}

export function drawMedicineIconGfx(gfx: Gfx, kind: 'chuChi' | 'cuongSinh' | 'hoiHuyet' | 'generic'): void {
  gfx.fillStyle(0x0f0f1a, 0.95);
  gfx.fillRoundedRect(0, 0, ICON, ICON, 6);
  gfx.lineStyle(2, 0x2ecc71, 1);
  gfx.strokeRoundedRect(2, 2, ICON - 4, ICON - 4, 5);

  if (kind === 'chuChi') {
    gfx.fillStyle(0x27ae60, 1);
    gfx.fillRoundedRect(ICON / 2 - 8, ICON / 2 - 14, 16, 22, 3);
    gfx.fillStyle(0x2ecc71, 0.6);
    gfx.fillRect(ICON / 2 - 6, ICON / 2 - 10, 12, 8);
  } else if (kind === 'cuongSinh') {
    gfx.fillStyle(0xe74c3c, 1);
    gfx.fillCircle(ICON / 2, ICON / 2, 12);
  } else if (kind === 'hoiHuyet') {
    gfx.fillStyle(0xc0392b, 1);
    gfx.fillCircle(ICON / 2, ICON / 2, 10);
  } else {
    gfx.fillStyle(0x3498db, 1);
    gfx.fillRoundedRect(ICON / 2 - 8, ICON / 2 - 10, 16, 18, 4);
  }
}

export function drawCurrencyIconGfx(gfx: Gfx, kind: 'gioiThuy' | 'tinhThach'): void {
  if (kind === 'gioiThuy') {
    gfx.fillStyle(0x3498db, 0.3);
    gfx.fillCircle(ICON / 2, ICON / 2, 16);
    gfx.fillStyle(0x74b9ff, 1);
    gfx.fillCircle(ICON / 2, ICON / 2 + 4, 8);
  } else {
    // Tinh Thạch — đá quý tím hình trụ
    const cx = ICON / 2;
    const cy = ICON / 2;
    const w = 11;
    const h = 24;
    const top = cy - h / 2;
    const bot = cy + h / 2;

    gfx.fillStyle(0x4c1d95, 0.45);
    gfx.fillEllipse(cx, bot + 3, w * 1.35, 4);

    gfx.fillStyle(0x6d28d9, 1);
    gfx.beginPath();
    gfx.moveTo(cx - w, top + 5);
    gfx.lineTo(cx, top + 5);
    gfx.lineTo(cx, bot);
    gfx.lineTo(cx - w, bot);
    gfx.closePath();
    gfx.fillPath();

    gfx.fillStyle(0x9333ea, 1);
    gfx.beginPath();
    gfx.moveTo(cx, top + 5);
    gfx.lineTo(cx + w, top + 5);
    gfx.lineTo(cx + w, bot);
    gfx.lineTo(cx, bot);
    gfx.closePath();
    gfx.fillPath();

    gfx.fillStyle(0xa855f7, 1);
    gfx.fillEllipse(cx, top + 4, w * 2, 9);

    gfx.fillStyle(0xd8b4fe, 0.9);
    gfx.fillEllipse(cx - 2, top + 2, w * 1.05, 5);

    gfx.fillStyle(0xe9d5ff, 0.5);
    gfx.fillTriangle(cx + 3, top + 9, cx + 7, top + 12, cx + 5, bot - 3);

    gfx.lineStyle(1, 0xc084fc, 0.65);
    gfx.strokeEllipse(cx, top + 4, w * 2, 9);
    gfx.lineStyle(1, 0x5b21b6, 0.75);
    gfx.beginPath();
    gfx.moveTo(cx - w, top + 5);
    gfx.lineTo(cx - w, bot);
    gfx.moveTo(cx + w, top + 5);
    gfx.lineTo(cx + w, bot);
    gfx.moveTo(cx - w, top + 5);
    gfx.lineTo(cx + w, top + 5);
    gfx.strokePath();
  }
}

export function drawSpecialItemIconGfx(gfx: Gfx, kind: 'tichLich' | 'nhanKhongGian'): void {
  gfx.fillStyle(0x0f0f1a, 0.95);
  gfx.fillRoundedRect(0, 0, ICON, ICON, 6);
  if (kind === 'nhanKhongGian') {
    gfx.lineStyle(3, 0x9b59b6, 1);
    gfx.strokeCircle(ICON / 2, ICON / 2, 14);
    gfx.lineStyle(2, 0xe056fd, 1);
    gfx.strokeCircle(ICON / 2, ICON / 2, 9);
    gfx.fillStyle(0x8e44ad, 0.6);
    gfx.fillCircle(ICON / 2, ICON / 2 - 14, 5);
    gfx.fillStyle(0xd7bde2, 1);
    gfx.fillCircle(ICON / 2, ICON / 2 - 14, 3);
  } else {
    gfx.lineStyle(2, 0xf1c40f, 1);
    gfx.strokeRoundedRect(2, 2, ICON - 4, ICON - 4, 5);
    gfx.fillStyle(0xf39c12, 0.8);
    gfx.fillCircle(ICON / 2, ICON / 2, 14);
    gfx.lineStyle(2, 0xffffff, 0.8);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      gfx.beginPath();
      gfx.moveTo(ICON / 2, ICON / 2);
      gfx.lineTo(ICON / 2 + Math.cos(a) * 16, ICON / 2 + Math.sin(a) * 16);
      gfx.strokePath();
    }
  }
}

export function drawPetIconGfx(gfx: Gfx, kind: 'longNgu' | 'haoThien' | 'bachHau' | 'kimLong' | 'cuuViHo'): void {
  gfx.fillStyle(0x0f0f1a, 0.95);
  gfx.fillRoundedRect(0, 0, ICON, ICON, 6);
  gfx.lineStyle(2, 0xfca311, 1);
  gfx.strokeRoundedRect(2, 2, ICON - 4, ICON - 4, 5);
  const cx = ICON / 2;
  const cy = ICON / 2;

  switch (kind) {
    case 'longNgu':
      gfx.fillStyle(0x3498db, 1);
      gfx.fillEllipse(cx, cy, 22, 10);
      break;
    case 'haoThien':
      gfx.fillStyle(0xe67e22, 1);
      gfx.fillEllipse(cx, cy + 4, 18, 10);
      gfx.fillCircle(cx + 8, cy - 4, 8);
      break;
    case 'bachHau':
      gfx.fillStyle(0xecf0f1, 1);
      gfx.fillEllipse(cx, cy, 20, 14);
      break;
    case 'kimLong':
      gfx.fillStyle(0xffd700, 1);
      gfx.fillEllipse(cx, cy, 24, 12);
      break;
    case 'cuuViHo':
      gfx.fillStyle(0xe84393, 1);
      gfx.fillEllipse(cx, cy + 2, 16, 12);
      gfx.fillCircle(cx + 10, cy - 6, 9);
      break;
  }
}

export const ITEM_ICON_SIZE = ICON;
