import type { SkillType, WeaponType } from '../types/game.ts';
import { getSkillById } from '../data/skillsData.ts';
import { skillIconTextureKey } from './skillIconAssets.ts';

/** Chiều cao icon võ kỹ khi tung chiêu (px). */
export const SKILL_CAST_ICON_HEIGHT = 50;

const CAST_BORDER_WIDTH = 3;
const CAST_BORDER_RADIUS = 8;
const CAST_ICON_PADDING = 3;
const BLACK_THRESHOLD = 28;

/** Viền theo loại vũ khí — GDD combat cast. */
export const SKILL_WEAPON_BORDER_COLORS: Record<WeaponType, number> = {
  kiem: 0x3498db,
  quyen: 0xf1c40f,
  thuong: 0x9b59b6,
  dao: 0xe74c3c,
};

export type SkillCastVisual = {
  iconKey: string;
  borderColor: number;
};

export function resolveSkillCastBorderColor(
  skillType: SkillType,
  actorWeapon?: WeaponType,
): number {
  if (skillType in SKILL_WEAPON_BORDER_COLORS) {
    return SKILL_WEAPON_BORDER_COLORS[skillType as WeaponType];
  }
  if (actorWeapon) return SKILL_WEAPON_BORDER_COLORS[actorWeapon];
  return 0xbdc3c7;
}

export function resolveSkillCastVisual(
  scene: Phaser.Scene,
  skillId: string,
  actorWeapon?: WeaponType,
): SkillCastVisual | null {
  const skill = getSkillById(skillId);
  if (!skill) return null;
  const iconKey = skillIconTextureKey(skill.iconPath);
  if (!scene.textures.exists(iconKey)) return null;
  return {
    iconKey,
    borderColor: resolveSkillCastBorderColor(skill.type, actorWeapon),
  };
}

/** Loại bỏ nền đen gần #000 — cache texture `_castnobg`. */
export function ensureTransparentSkillIcon(scene: Phaser.Scene, iconKey: string): string {
  const outKey = `${iconKey}_castnobg`;
  if (scene.textures.exists(outKey)) return outKey;
  if (!scene.textures.exists(iconKey)) return iconKey;

  const texture = scene.textures.get(iconKey);
  const source = texture.getSourceImage() as HTMLCanvasElement | HTMLImageElement;
  const w = source.width;
  const h = source.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return iconKey;

  ctx.drawImage(source as CanvasImageSource, 0, 0);
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i]!;
    const g = d[i + 1]!;
    const b = d[i + 2]!;
    if (r <= BLACK_THRESHOLD && g <= BLACK_THRESHOLD && b <= BLACK_THRESHOLD) {
      d[i + 3] = 0;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  scene.textures.addCanvas(outKey, canvas);
  return outKey;
}

/** Icon PNG có viền màu — dùng cho 3 pha tung chiêu. */
export function createSkillCastIcon(
  scene: Phaser.Scene,
  iconKey: string,
  borderColor: number,
): Phaser.GameObjects.Container {
  const transparentKey = ensureTransparentSkillIcon(scene, iconKey);
  const frame = scene.textures.get(transparentKey).get();
  const aspect = frame.width / frame.height;
  const innerH = SKILL_CAST_ICON_HEIGHT - CAST_BORDER_WIDTH * 2 - CAST_ICON_PADDING * 2;
  const innerW = innerH * aspect;
  const frameW = innerW + CAST_ICON_PADDING * 2 + CAST_BORDER_WIDTH * 2;
  const frameH = SKILL_CAST_ICON_HEIGHT;

  const border = scene.add.graphics();
  border.lineStyle(CAST_BORDER_WIDTH, borderColor, 1);
  border.strokeRoundedRect(-frameW / 2, -frameH / 2, frameW, frameH, CAST_BORDER_RADIUS);

  const icon = scene.add.image(0, 0, transparentKey).setDisplaySize(innerW, innerH);

  return scene.add.container(0, 0, [border, icon]);
}
