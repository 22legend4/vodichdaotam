import Phaser from 'phaser';
import type { Gfx } from './assetCore.ts';

export const SKILL_FX_IDS = [
  'khongPhaQuyen',
  'kiemNhuLai',
  'hoanhKhongDao',
  'thuongVoHoi',
  'hoPhongKinh',
  'thaiDuTruongHa',
  'bachQuyTeGia',
  'cuNhatKinh',
  'hongHaiKinh',
  'kimCuongBatHoai',
  'cuuLongThangThien',
  'nhatKiemDinhGiangSon',
  'voAnhDao',
  'cuuThienLePhach',
  'vanQuangThienPhu',
] as const;

export function drawSkillEffectGfx(gfx: Gfx, w: number, h: number, skillId: string): void {
  gfx.fillStyle(0x000000, 0);
  gfx.fillRect(0, 0, w, h);

  switch (skillId) {
    case 'khongPhaQuyen':
      drawFistImpact(gfx, w, h);
      break;
    case 'kiemNhuLai':
    case 'nhatKiemDinhGiangSon':
      drawSwordGlow(gfx, w, h);
      break;
    case 'hoanhKhongDao':
    case 'voAnhDao':
      drawDaoSlash(gfx, w, h);
      break;
    case 'thuongVoHoi':
      drawSpearThrust(gfx, w, h);
      break;
    case 'hoPhongKinh':
      drawWindSwirl(gfx, w, h);
      break;
    case 'thaiDuTruongHa':
      drawStoneWall(gfx);
      break;
    case 'bachQuyTeGia':
      drawGlassWall(gfx);
      break;
    case 'cuNhatKinh':
      drawShieldAura(gfx, w, h);
      break;
    case 'hongHaiKinh':
      drawCarpKoi(gfx, w, h);
      break;
    case 'kimCuongBatHoai':
    case 'vanQuangThienPhu':
      drawGoldenBell(gfx, w, h);
      break;
    case 'cuuLongThangThien':
      drawDragonFx(gfx, w, h);
      break;
    case 'cuuThienLePhach':
      drawThunderOrb(gfx, w, h);
      break;
    default:
      gfx.fillStyle(0xffffff, 0.35);
      gfx.fillCircle(w / 2, h / 2, 22);
  }
}

export function drawWeaponSwingFx(gfx: Gfx, w: number, h: number, weapon: string): void {
  switch (weapon) {
    case 'kiem':
      drawSwordGlow(gfx, w, h);
      break;
    case 'dao':
      drawDaoSlash(gfx, w, h);
      break;
    case 'thuong':
      drawSpearThrust(gfx, w, h);
      break;
    default:
      drawFistImpact(gfx, w, h);
  }
}

function drawFistImpact(gfx: Gfx, w: number, h: number): void {
  gfx.fillStyle(0xff922b, 0.4);
  gfx.fillCircle(w / 2, h / 2, 28);
  gfx.lineStyle(3, 0xffd43b, 0.9);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    gfx.beginPath();
    gfx.moveTo(w / 2 + Math.cos(a) * 12, h / 2 + Math.sin(a) * 12);
    gfx.lineTo(w / 2 + Math.cos(a) * 32, h / 2 + Math.sin(a) * 32);
    gfx.strokePath();
  }
}

function drawSwordGlow(gfx: Gfx, w: number, h: number): void {
  gfx.lineStyle(4, 0x74b9ff, 0.95);
  gfx.beginPath();
  gfx.moveTo(w / 2 - 30, h / 2 + 20);
  gfx.lineTo(w / 2 + 30, h / 2 - 20);
  gfx.strokePath();
  gfx.fillStyle(0x74b9ff, 0.25);
  gfx.fillCircle(w / 2, h / 2, 20);
}

function drawDaoSlash(gfx: Gfx, w: number, h: number): void {
  gfx.fillStyle(0xe74c3c, 0.5);
  gfx.fillTriangle(w / 2 - 36, h / 2 + 10, w / 2 + 10, h / 2 - 30, w / 2 + 20, h / 2 + 20);
  gfx.lineStyle(3, 0xff6b6b, 0.9);
  gfx.beginPath();
  gfx.moveTo(w / 2 - 32, h / 2 + 6);
  gfx.lineTo(w / 2 - 8, h / 2 - 14);
  gfx.lineTo(w / 2 + 16, h / 2 + 8);
  gfx.strokePath();
}

function drawSpearThrust(gfx: Gfx, w: number, h: number): void {
  gfx.fillStyle(0x95a5a6, 1);
  gfx.fillRect(w / 2 - 2, h / 2 - 36, 4, 48);
  gfx.fillStyle(0xc0392b, 1);
  gfx.fillTriangle(w / 2 - 10, h / 2 - 28, w / 2 + 10, h / 2 - 28, w / 2, h / 2 - 42);
}

function drawWindSwirl(gfx: Gfx, w: number, h: number): void {
  gfx.lineStyle(3, 0x74b9ff, 0.9);
  for (let i = 0; i < 3; i++) {
    gfx.beginPath();
    gfx.arc(w / 2, h / 2, 12 + i * 8, Phaser.Math.DegToRad(i * 40), Phaser.Math.DegToRad(220 + i * 40), false);
    gfx.strokePath();
  }
}

function drawStoneWall(gfx: Gfx): void {
  gfx.fillStyle(0x636e72, 1);
  gfx.fillRoundedRect(16, 20, 64, 56, 4);
}

function drawGlassWall(gfx: Gfx): void {
  gfx.fillStyle(0x81ecec, 0.35);
  gfx.fillRoundedRect(20, 18, 56, 60, 6);
  gfx.lineStyle(2, 0x00cec9, 0.9);
  gfx.strokeRoundedRect(20, 18, 56, 60, 6);
}

function drawShieldAura(gfx: Gfx, w: number, h: number): void {
  gfx.fillStyle(0xf39c12, 0.25);
  gfx.fillCircle(w / 2, h / 2, 34);
  gfx.lineStyle(3, 0xf1c40f, 0.9);
  gfx.strokeCircle(w / 2, h / 2, 28);
}

function drawCarpKoi(gfx: Gfx, w: number, h: number): void {
  gfx.fillStyle(0xe74c3c, 1);
  gfx.fillEllipse(w / 2, h / 2, 28, 14);
  gfx.fillTriangle(w / 2 - 28, h / 2, w / 2 - 18, h / 2 - 8, w / 2 - 18, h / 2 + 8);
}

function drawGoldenBell(gfx: Gfx, w: number, h: number): void {
  gfx.fillStyle(0xffd700, 1);
  gfx.fillRoundedRect(w / 2 - 18, h / 2 - 10, 36, 32, 8);
  gfx.lineStyle(2, 0xfff4a3, 0.8);
  gfx.strokeRoundedRect(w / 2 - 18, h / 2 - 10, 36, 32, 8);
}

function drawDragonFx(gfx: Gfx, w: number, h: number): void {
  gfx.fillStyle(0xffd700, 0.8);
  gfx.fillEllipse(w / 2, h / 2, 40, 16);
  gfx.fillStyle(0xf39c12, 1);
  gfx.fillCircle(w / 2 + 18, h / 2 - 6, 10);
}

function drawThunderOrb(gfx: Gfx, w: number, h: number): void {
  gfx.fillStyle(0xf1c40f, 0.5);
  gfx.fillCircle(w / 2, h / 2, 26);
  gfx.lineStyle(3, 0xffffff, 0.9);
  gfx.beginPath();
  gfx.moveTo(w / 2, h / 2 - 16);
  gfx.lineTo(w / 2 - 8, h / 2);
  gfx.lineTo(w / 2 + 4, h / 2);
  gfx.lineTo(w / 2 - 4, h / 2 + 16);
  gfx.strokePath();
}
