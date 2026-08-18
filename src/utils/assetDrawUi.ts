import Phaser from 'phaser';
import type { Gfx } from './assetCore.ts';

/** #FFD700 / #DAA520 — viền kim loại sáng / tối. */
export const UI_GOLD_LIGHT = 0xffd700;
export const UI_GOLD_DARK = 0xdaa520;
export const UI_GOLD_SHADOW = 0x8b6914;

export type HubButtonKind = 'settings' | 'character' | 'inventory' | 'shop' | 'map';

const ICON_WHITE = 0xfff8e7;
const ICON_HIGHLIGHT = 0xffffff;

/** Vẽ viền đôi + vát góc kim loại (mô phỏng anti-alias bằng lớp mờ). */
export function drawMetallicBeveledDisc(
  gfx: Gfx,
  cx: number,
  cy: number,
  r: number,
  fillInner: number,
): void {
  const pad = Math.max(1, r * 0.04);

  gfx.fillStyle(0x000000, 0.22);
  gfx.fillCircle(cx, cy + pad * 1.4, r * 0.97);

  gfx.fillStyle(fillInner, 1);
  gfx.fillCircle(cx, cy, r - pad);

  gfx.fillStyle(0xffffff, 0.07);
  gfx.fillCircle(cx - r * 0.12, cy - r * 0.14, r * 0.72);

  gfx.fillStyle(0x000000, 0.12);
  gfx.fillCircle(cx + r * 0.1, cy + r * 0.12, r * 0.68);

  gfx.lineStyle(Math.max(2, r * 0.09), UI_GOLD_SHADOW, 0.85);
  gfx.strokeCircle(cx, cy, r - pad * 0.3);

  gfx.lineStyle(Math.max(2, r * 0.07), UI_GOLD_DARK, 1);
  gfx.strokeCircle(cx, cy, r - pad * 0.8);

  gfx.lineStyle(Math.max(1.5, r * 0.055), UI_GOLD_LIGHT, 1);
  gfx.strokeCircle(cx, cy, r - pad * 1.2);

  gfx.lineStyle(Math.max(1, r * 0.035), UI_GOLD_DARK, 0.92);
  gfx.strokeCircle(cx, cy, r * 0.78);

  gfx.lineStyle(Math.max(1, r * 0.03), UI_GOLD_LIGHT, 0.55);
  gfx.beginPath();
  gfx.arc(cx, cy, r * 0.74, Phaser.Math.DegToRad(215), Phaser.Math.DegToRad(325), false);
  gfx.strokePath();

  gfx.lineStyle(Math.max(1, r * 0.025), UI_GOLD_SHADOW, 0.65);
  gfx.beginPath();
  gfx.arc(cx, cy, r * 0.72, Phaser.Math.DegToRad(35), Phaser.Math.DegToRad(145), false);
  gfx.strokePath();

  gfx.fillStyle(UI_GOLD_LIGHT, 0.28);
  gfx.fillEllipse(cx - r * 0.26, cy - r * 0.3, r * 0.32, r * 0.16);
}

/** Icon bánh răng vector mượt — nét sáng + viền tối. */
export function drawGearIconGfx(gfx: Gfx, cx: number, cy: number, radius: number): void {
  const teeth = 10;
  const outerR = radius * 0.92;
  const rootR = radius * 0.68;
  const holeR = radius * 0.22;

  gfx.fillStyle(ICON_WHITE, 1);
  gfx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? outerR : rootR;
    const px = cx + Math.cos(a) * rr;
    const py = cy + Math.sin(a) * rr;
    if (i === 0) gfx.moveTo(px, py);
    else gfx.lineTo(px, py);
  }
  gfx.closePath();
  gfx.fillPath();

  gfx.lineStyle(Math.max(1, radius * 0.06), UI_GOLD_DARK, 0.75);
  gfx.strokeCircle(cx, cy, rootR * 0.95);

  gfx.fillStyle(UI_GOLD_LIGHT, 0.35);
  gfx.fillCircle(cx - radius * 0.12, cy - radius * 0.15, radius * 0.2);

  gfx.fillStyle(0x2a1810, 1);
  gfx.fillCircle(cx, cy, holeR);
  gfx.lineStyle(Math.max(1, radius * 0.05), UI_GOLD_LIGHT, 0.8);
  gfx.strokeCircle(cx, cy, holeR);
}

function drawCharacterGlyph(gfx: Gfx, cx: number, cy: number, s: number): void {
  gfx.fillStyle(ICON_WHITE, 1);
  gfx.fillCircle(cx, cy - s * 0.42, s * 0.28);
  gfx.fillRoundedRect(cx - s * 0.38, cy - s * 0.08, s * 0.76, s * 0.72, s * 0.12);
  gfx.fillStyle(ICON_HIGHLIGHT, 0.35);
  gfx.fillCircle(cx - s * 0.08, cy - s * 0.45, s * 0.08);
}

function drawInventoryGlyph(gfx: Gfx, cx: number, cy: number, s: number): void {
  gfx.fillStyle(ICON_WHITE, 1);
  gfx.fillRoundedRect(cx - s * 0.42, cy - s * 0.18, s * 0.84, s * 0.62, s * 0.1);
  gfx.fillStyle(UI_GOLD_LIGHT, 1);
  gfx.fillRoundedRect(cx - s * 0.3, cy - s * 0.38, s * 0.6, s * 0.22, s * 0.08);
  gfx.lineStyle(Math.max(1, s * 0.06), UI_GOLD_DARK, 0.8);
  gfx.strokeRoundedRect(cx - s * 0.42, cy - s * 0.18, s * 0.84, s * 0.62, s * 0.1);
  gfx.lineStyle(Math.max(1, s * 0.05), ICON_HIGHLIGHT, 0.5);
  gfx.beginPath();
  gfx.moveTo(cx - s * 0.15, cy - s * 0.38);
  gfx.lineTo(cx - s * 0.15, cy - s * 0.5);
  gfx.moveTo(cx + s * 0.15, cy - s * 0.38);
  gfx.lineTo(cx + s * 0.15, cy - s * 0.5);
  gfx.strokePath();
}

function drawShopGlyph(gfx: Gfx, cx: number, cy: number, s: number): void {
  gfx.fillStyle(UI_GOLD_LIGHT, 1);
  gfx.fillTriangle(cx - s * 0.5, cy - s * 0.05, cx, cy - s * 0.48, cx + s * 0.5, cy - s * 0.05);
  gfx.fillStyle(ICON_WHITE, 1);
  gfx.fillRect(cx - s * 0.42, cy - s * 0.05, s * 0.84, s * 0.52);
  gfx.fillStyle(0x4a2c14, 0.35);
  gfx.fillRect(cx - s * 0.12, cy + s * 0.05, s * 0.24, s * 0.32);
  gfx.lineStyle(Math.max(1, s * 0.05), UI_GOLD_DARK, 0.85);
  gfx.strokeTriangle(cx - s * 0.5, cy - s * 0.05, cx, cy - s * 0.48, cx + s * 0.5, cy - s * 0.05);
}

function drawMapGlyph(gfx: Gfx, cx: number, cy: number, s: number): void {
  gfx.fillStyle(ICON_WHITE, 1);
  gfx.fillRoundedRect(cx - s * 0.38, cy - s * 0.48, s * 0.76, s * 0.96, s * 0.08);
  gfx.fillStyle(0xc9a86c, 1);
  gfx.fillEllipse(cx - s * 0.08, cy - s * 0.08, s * 0.28, s * 0.2);
  gfx.fillStyle(0x7cb342, 0.85);
  gfx.fillEllipse(cx + s * 0.12, cy + s * 0.12, s * 0.22, s * 0.16);
  gfx.lineStyle(Math.max(1, s * 0.05), UI_GOLD_DARK, 0.75);
  gfx.strokeRoundedRect(cx - s * 0.38, cy - s * 0.48, s * 0.76, s * 0.96, s * 0.08);
  gfx.lineStyle(Math.max(1, s * 0.04), UI_GOLD_LIGHT, 0.6);
  gfx.beginPath();
  gfx.moveTo(cx - s * 0.2, cy - s * 0.28);
  gfx.lineTo(cx + s * 0.15, cy + s * 0.22);
  gfx.strokePath();
}

function drawHubIconGlyph(gfx: Gfx, cx: number, cy: number, iconR: number, kind: HubButtonKind): void {
  switch (kind) {
    case 'settings':
      drawGearIconGfx(gfx, cx, cy, iconR);
      break;
    case 'character':
      drawCharacterGlyph(gfx, cx, cy, iconR);
      break;
    case 'inventory':
      drawInventoryGlyph(gfx, cx, cy, iconR);
      break;
    case 'shop':
      drawShopGlyph(gfx, cx, cy, iconR);
      break;
    case 'map':
      drawMapGlyph(gfx, cx, cy, iconR);
      break;
  }
}

/** Nút tròn sảnh chính — khung kim loại + icon. */
export function drawHubMetallicButtonGfx(
  gfx: Gfx,
  size: number,
  kind: HubButtonKind,
  large = false,
): void {
  drawHubMetallicFrameOnlyGfx(gfx, size, kind, large);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - size * 0.03;
  drawHubIconGlyph(gfx, cx, cy - size * 0.02, r * 0.52, kind);
}

/** Khung kim loại trống — dùng khi overlay PNG Game-icons. */
export function drawHubMetallicFrameOnlyGfx(
  gfx: Gfx,
  size: number,
  kind: HubButtonKind,
  large = false,
): void {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - size * 0.03;
  const fill =
    kind === 'map' && large ? 0x6b1a1a
      : kind === 'shop' ? 0x3d2817
        : 0x4a3020;

  drawMetallicBeveledDisc(gfx, cx, cy, r, fill);
}

/** Khung avatar nhân vật (Nhân vật) — vòng kim loại vát góc. */
export function drawHubProfileRingGfx(gfx: Gfx, size: number): void {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;
  drawMetallicBeveledDisc(gfx, cx, cy, r, 0x16213e);
  gfx.fillStyle(0x0d1526, 1);
  gfx.fillCircle(cx, cy, r * 0.78);
}

/** MẪU 3 — Ngọc Bích Linh Khí (bán kính đĩa 38px). */
export const JADE_DISC_RADIUS = 38;
export const JADE_GOLD_OUTER = 0xd4af37;
export const JADE_GOLD_THREAD = 0xf3e5ab;
export const JADE_DARK = 0x071c19;
export const JADE_CORE = 0x103a34;

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function lerpColor(c1: number, c2: number, t: number): number {
  const r1 = (c1 >> 16) & 0xff;
  const g1 = (c1 >> 8) & 0xff;
  const b1 = c1 & 0xff;
  const r2 = (c2 >> 16) & 0xff;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = c2 & 0xff;
  return (lerpChannel(r1, r2, t) << 16) | (lerpChannel(g1, g2, t) << 8) | lerpChannel(b1, b2, t);
}

/** Đĩa Ngọc Bích 3D — viền vàng kim + lõi gradient ngọc. */
export function drawJadeSpiritDiscGfx(
  gfx: Gfx,
  cx: number,
  cy: number,
  outerR = JADE_DISC_RADIUS,
): void {
  gfx.fillStyle(JADE_GOLD_OUTER, 1);
  gfx.fillCircle(cx, cy, outerR);

  gfx.fillStyle(JADE_DARK, 1);
  gfx.fillCircle(cx, cy, 35);

  gfx.lineStyle(Math.max(1.5, outerR * 0.04), JADE_GOLD_THREAD, 1);
  gfx.strokeCircle(cx, cy, 33);

  const coreR = 32;
  const steps = 14;
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const r = coreR * t;
    const color = lerpColor(JADE_CORE, JADE_DARK, 1 - t * 0.92);
    gfx.fillStyle(color, 1);
    gfx.fillCircle(cx, cy, Math.max(0.5, r));
  }

  gfx.fillStyle(JADE_CORE, 0.35);
  gfx.fillEllipse(cx - outerR * 0.18, cy - outerR * 0.2, outerR * 0.28, outerR * 0.14);
}

/** Màu đĩa linh khí chiến đấu — phe ta / mục tiêu địch. */
export const BATTLE_DISC_ALLY = 0xffd700;
export const BATTLE_DISC_ENEMY = 0xff3333;
export const BATTLE_DISC_GLOW_ALLY = 0xfff4a3;
export const BATTLE_DISC_GLOW_ENEMY = 0xff8888;

/** Đĩa Bát Quái tròn phát sáng dưới chân nhân vật (Tiên Hiệp). */
export function drawBattleBaguaDiscGfx(
  gfx: Gfx,
  cx: number,
  cy: number,
  radius: number,
  primaryColor: number,
  glowColor: number,
): void {
  gfx.lineStyle(3, glowColor, 0.55);
  gfx.strokeCircle(cx, cy, radius * 1.18);

  gfx.fillStyle(primaryColor, 0.22);
  gfx.fillCircle(cx, cy, radius);

  gfx.lineStyle(2.5, primaryColor, 0.9);
  gfx.strokeCircle(cx, cy, radius * 0.94);

  gfx.lineStyle(1.5, glowColor, 0.75);
  gfx.strokeCircle(cx, cy, radius * 0.62);

  const segments = 8;
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x1 = cx + cos * radius * 0.68;
    const y1 = cy + sin * radius * 0.68;
    const x2 = cx + cos * radius * 0.98;
    const y2 = cy + sin * radius * 0.98;
    gfx.lineStyle(2, glowColor, 0.85);
    gfx.lineBetween(x1, y1, x2, y2);

    const barAngle = angle + Math.PI / segments;
    const barCos = Math.cos(barAngle);
    const barSin = Math.sin(barAngle);
    for (let b = 0; b < 3; b++) {
      const t = 0.48 + b * 0.07;
      const bx = cx + barCos * radius * t;
      const by = cy + barSin * radius * t;
      const len = radius * 0.09;
      const perpX = -Math.sin(barAngle) * len;
      const perpY = Math.cos(barAngle) * len;
      gfx.lineStyle(1.5, primaryColor, 0.7 - b * 0.12);
      gfx.lineBetween(bx - perpX, by - perpY, bx + perpX, by + perpY);
    }
  }

  gfx.lineStyle(1, primaryColor, 0.35);
  gfx.lineBetween(cx - radius * 0.55, cy, cx + radius * 0.55, cy);
  gfx.lineBetween(cx, cy - radius * 0.55, cx, cy + radius * 0.55);

  gfx.lineStyle(1.5, glowColor, 0.5);
  gfx.strokeCircle(cx, cy, radius * 0.28);
}

/** Thanh phi kiếm vàng kim nhỏ lơ lửng trên đầu mục tiêu. */
export function drawFloatingSwordGfx(gfx: Gfx, bladeColor = BATTLE_DISC_ALLY): void {
  gfx.fillStyle(bladeColor, 1);
  gfx.fillTriangle(0, -16, -3.5, 5, 3.5, 5);
  gfx.fillStyle(0xf3e5ab, 1);
  gfx.fillRect(-7, 5, 14, 2.5);
  gfx.fillStyle(0x6b4423, 1);
  gfx.fillRect(-1.8, 7.5, 3.6, 9);
  gfx.fillStyle(bladeColor, 1);
  gfx.fillCircle(0, 18, 2.5);
  gfx.lineStyle(1, 0xfff8dc, 0.6);
  gfx.lineBetween(0, -14, 0, 3);
}

/** Vòng sáng vàng bao quanh thân — mục tiêu tấn công đã chọn. */
export const BATTLE_TARGET_BODY_GLOW = 0xffd700;
export const BATTLE_TARGET_BODY_GLOW_OUTER = 0xfff4a3;
export const BATTLE_CONTROL_BOUND_GLOW = 0x9775fa;
export const BATTLE_CONTROL_BOUND_GLOW_OUTER = 0xd0bfff;

export function drawTargetBodyGlowGfx(gfx: Gfx, bodyW: number, bodyH: number): void {
  const rx = bodyW * 0.52;
  const ry = bodyH * 0.48;

  gfx.lineStyle(5, BATTLE_TARGET_BODY_GLOW_OUTER, 0.35);
  gfx.strokeEllipse(0, 0, rx * 2.35, ry * 2.35);

  gfx.lineStyle(3.5, BATTLE_TARGET_BODY_GLOW, 0.55);
  gfx.strokeEllipse(0, 0, rx * 2.05, ry * 2.05);

  gfx.lineStyle(2.5, BATTLE_TARGET_BODY_GLOW_OUTER, 0.9);
  gfx.strokeEllipse(0, 0, rx * 1.75, ry * 1.72);

  gfx.fillStyle(BATTLE_TARGET_BODY_GLOW, 0.12);
  gfx.fillEllipse(0, 0, rx * 1.6, ry * 1.55);
}

export function drawControlBoundGlowGfx(gfx: Gfx, bodyW: number, bodyH: number): void {
  const rx = bodyW * 0.52;
  const ry = bodyH * 0.48;

  gfx.lineStyle(5, BATTLE_CONTROL_BOUND_GLOW_OUTER, 0.4);
  gfx.strokeEllipse(0, 0, rx * 2.35, ry * 2.35);

  gfx.lineStyle(3.5, BATTLE_CONTROL_BOUND_GLOW, 0.65);
  gfx.strokeEllipse(0, 0, rx * 2.05, ry * 2.05);

  gfx.lineStyle(2.5, BATTLE_CONTROL_BOUND_GLOW_OUTER, 0.95);
  gfx.strokeEllipse(0, 0, rx * 1.75, ry * 1.72);

  gfx.fillStyle(BATTLE_CONTROL_BOUND_GLOW, 0.18);
  gfx.fillEllipse(0, 0, rx * 1.6, ry * 1.55);
}
