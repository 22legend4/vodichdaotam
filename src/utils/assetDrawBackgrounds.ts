import type { Gfx } from './assetCore.ts';
import { drawVerticalGradient } from './assetCore.ts';

const W = 1280;
const H = 720;

/** Tiều Thôn – con đường làng trải ngang hoàng hôn tiên cảnh. */
export function drawVillageBackground(gfx: Gfx): void {
  drawVerticalGradient(gfx, W, H, 0x1a1a4e, 0xff6b35, 28);
  gfx.fillStyle(0xff8fab, 0.12);
  gfx.fillEllipse(W * 0.82, H * 0.14, 160, 50);
  gfx.fillStyle(0xffd166, 0.25);
  gfx.fillCircle(W * 0.88, H * 0.12, 42);

  // Núi xa dọc chân trời
  const mountainColors = [0x2d1b4e, 0x3d2b5e, 0x4a3470];
  mountainColors.forEach((col, i) => {
    const baseY = H * 0.22 + i * 12;
    gfx.fillStyle(col, 0.85 - i * 0.1);
    gfx.fillTriangle(0, baseY + 60, W * 0.25, baseY - 30, W * 0.5, baseY + 60);
    gfx.fillTriangle(W * 0.35, baseY + 70, W * 0.6, baseY - 15, W, baseY + 70);
  });

  // Mây ngang
  [0.12, 0.35, 0.55, 0.78].forEach((xRatio, i) => {
    gfx.fillStyle(0xffffff, 0.1 + i * 0.03);
    gfx.fillEllipse(W * xRatio, H * 0.1 + i * 8, 110 + i * 15, 26);
    gfx.fillEllipse(W * xRatio + 40, H * 0.09 + i * 8, 70, 18);
  });

  // Cỏ hai bên
  gfx.fillStyle(0x1a472a, 1);
  gfx.fillRect(0, H * 0.42, W, H * 0.58);

  // Con đường ngang phối cảnh (vanishing point giữa màn)
  gfx.fillStyle(0x5c4033, 1);
  gfx.fillTriangle(0, H * 0.52, W * 0.15, H * 0.48, W * 0.15, H);
  gfx.fillTriangle(W * 0.85, H * 0.48, W, H * 0.52, W * 0.85, H);
  gfx.fillRect(W * 0.15, H * 0.48, W * 0.7, H * 0.52);

  gfx.fillStyle(0x7a5230, 0.55);
  for (let col = 0; col < 14; col++) {
    const x = W * 0.15 + col * (W * 0.7 / 14);
    gfx.fillRect(x, H * 0.48, W * 0.7 / 14 - 4, H * 0.52);
  }

  // Hàng rào & cây hai bên
  [0.04, 0.96].forEach((xRatio) => {
    for (let i = 0; i < 5; i++) {
      const fy = H * (0.44 + i * 0.11);
      gfx.fillStyle(0x6b4423, 1);
      gfx.fillRect(W * xRatio - 4, fy, 8, 36);
      if (i < 4) {
        gfx.fillStyle(0x8b5a2b, 1);
        gfx.fillRect(W * xRatio - 18, fy + 18, 36, 4);
      }
    }
    drawTree(gfx, W * xRatio, H * 0.58, xRatio < 0.5 ? 0.85 : 1.0);
  });

  // Lồng đèn dọc đường
  [0.22, 0.38, 0.62, 0.78].forEach((xr) => {
    drawLantern(gfx, W * xr, H * 0.46);
  });

  // Nhà làng hai đầu
  gfx.fillStyle(0x3d2817, 0.75);
  gfx.fillRect(W * 0.06, H * 0.38, 60, 42);
  gfx.fillTriangle(W * 0.06, H * 0.38, W * 0.09, H * 0.33, W * 0.12, H * 0.38);
  gfx.fillStyle(0x4a3020, 0.75);
  gfx.fillRect(W * 0.88, H * 0.36, 65, 45);
  gfx.fillTriangle(W * 0.88, H * 0.36, W * 0.915, H * 0.31, W * 0.95, H * 0.36);
}

/** Võ Đài Minh Thành – sàn rộng ngang. */
export function drawArenaBackground(gfx: Gfx): void {
  drawVerticalGradient(gfx, W, H, 0x0d1b2a, 0x1b263b, 20);
  gfx.fillStyle(0x415a77, 0.35);
  gfx.fillRect(0, 0, W, H * 0.28);

  // Khán đài ngang
  gfx.fillStyle(0x2b2d42, 1);
  gfx.fillRect(0, H * 0.06, W, H * 0.14);
  gfx.fillStyle(0x8d99ae, 0.3);
  for (let i = 0; i < 22; i++) {
    gfx.fillRect(i * 60, H * 0.06, 4, H * 0.14);
  }
  gfx.fillStyle(0x4a4e69, 1);
  gfx.fillRect(0, H * 0.19, W, 12);

  // Sàn đá
  gfx.fillStyle(0x6c757d, 1);
  gfx.fillRect(0, H * 0.22, W, H * 0.78);
  const tile = 48;
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 28; col++) {
      const shade = (row + col) % 2 === 0 ? 0x7a8288 : 0x5c636a;
      gfx.fillStyle(shade, 1);
      gfx.fillRect(col * tile + (row % 2) * (tile / 2), H * 0.22 + row * tile, tile - 2, tile - 2);
    }
  }
  gfx.lineStyle(4, 0xffd700, 0.9);
  gfx.strokeRect(24, H * 0.24, W - 48, H * 0.74);

  // Cột & cờ hai bên
  [0.08, 0.92].forEach((xr) => {
    gfx.fillStyle(0x8b7355, 1);
    gfx.fillRect(W * xr - 8, H * 0.22, 16, H * 0.5);
    gfx.fillStyle(0xc0392b, 1);
    const dir = xr < 0.5 ? 1 : -1;
    gfx.fillTriangle(
      W * xr + 8 * dir, H * 0.26,
      W * xr + 48 * dir, H * 0.29,
      W * xr + 8 * dir, H * 0.32,
    );
    gfx.fillStyle(0xfca311, 0.8);
    gfx.fillCircle(W * xr, H * 0.22, 10);
  });

  // Huy hiệu giữa sàn
  gfx.lineStyle(3, 0xffd700, 0.7);
  gfx.strokeCircle(W / 2, H * 0.52, 55);
  gfx.fillStyle(0xe94560, 0.45);
  gfx.fillCircle(W / 2, H * 0.52, 32);
  gfx.lineStyle(2, 0xfca311, 1);
  gfx.beginPath();
  gfx.moveTo(W / 2, H * 0.52 - 24);
  gfx.lineTo(W / 2 + 20, H * 0.52 + 16);
  gfx.lineTo(W / 2 - 20, H * 0.52 + 16);
  gfx.closePath();
  gfx.strokePath();
}

/** Động tu luyện ngang. */
export function drawMeditationGrottoBackground(gfx: Gfx): void {
  drawVerticalGradient(gfx, W, H, 0x0a1628, 0x1a3a4a, 24);
  gfx.fillStyle(0x0d2137, 1);
  gfx.fillRect(0, 0, W, H);

  gfx.fillStyle(0x1e3a5f, 1);
  gfx.fillEllipse(W / 2, H * 0.12, W * 0.85, H * 0.22);
  gfx.fillStyle(0x152238, 1);
  gfx.fillRect(0, 0, W, H * 0.18);

  const stalactites = [0.15, 0.3, 0.45, 0.55, 0.7, 0.85];
  stalactites.forEach((xr, i) => {
    const len = 30 + (i % 3) * 18;
    gfx.fillStyle(0x4a6fa5, 0.8);
    gfx.fillTriangle(W * xr - 6, H * 0.17, W * xr + 6, H * 0.17, W * xr, H * 0.17 + len);
    gfx.fillStyle(0x7fdbff, 0.3);
    gfx.fillCircle(W * xr, H * 0.17 + len - 3, 3);
  });

  gfx.fillStyle(0x2c3e50, 1);
  gfx.fillRect(0, H * 0.78, W, H * 0.22);
  gfx.fillStyle(0x34495e, 0.8);
  gfx.fillEllipse(W / 2, H * 0.8, W * 0.55, 45);

  gfx.fillStyle(0x1abc9c, 0.3);
  gfx.fillCircle(W / 2, H * 0.74, 90);
  gfx.fillStyle(0x48c9b0, 0.5);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    gfx.fillEllipse(
      W / 2 + Math.cos(angle) * 40,
      H * 0.74 + Math.sin(angle) * 14,
      32,
      12,
    );
  }
  gfx.fillStyle(0x2ecc71, 0.6);
  gfx.fillCircle(W / 2, H * 0.74, 22);
  gfx.fillStyle(0xa9dfbf, 0.8);
  gfx.fillCircle(W / 2, H * 0.74, 11);

  for (let i = 0; i < 16; i++) {
    const x = (i * 83 + 50) % W;
    const y = H * (0.28 + (i % 6) * 0.08);
    gfx.fillStyle(0x7fdbff, 0.12 + (i % 3) * 0.06);
    gfx.fillCircle(x, y, 5 + (i % 4) * 2);
  }

  gfx.fillStyle(0x1a252f, 0.9);
  gfx.fillRect(0, H * 0.18, W * 0.1, H * 0.62);
  gfx.fillRect(W * 0.9, H * 0.18, W * 0.1, H * 0.62);
}

function drawTree(gfx: Gfx, x: number, y: number, scale: number): void {
  gfx.fillStyle(0x4a3728, 1);
  gfx.fillRect(x - 6 * scale, y, 12 * scale, 32 * scale);
  gfx.fillStyle(0x2d6a4f, 1);
  gfx.fillCircle(x, y - 8 * scale, 20 * scale);
  gfx.fillStyle(0x40916c, 0.8);
  gfx.fillCircle(x - 10 * scale, y - 2 * scale, 14 * scale);
  gfx.fillCircle(x + 10 * scale, y - 2 * scale, 14 * scale);
}

function drawLantern(gfx: Gfx, x: number, y: number): void {
  gfx.lineStyle(2, 0x8b4513, 1);
  gfx.beginPath();
  gfx.moveTo(x, y - 18);
  gfx.lineTo(x, y);
  gfx.strokePath();
  gfx.fillStyle(0xc0392b, 1);
  gfx.fillRoundedRect(x - 9, y, 18, 22, 4);
  gfx.fillStyle(0xff6b6b, 0.6);
  gfx.fillRoundedRect(x - 6, y + 3, 12, 14, 3);
  gfx.fillStyle(0xffd700, 1);
  gfx.fillRect(x - 11, y - 2, 22, 3);
  gfx.fillRect(x - 11, y + 21, 22, 3);
}

export const BG_SIZE = { w: W, h: H };
