import type { SkillData } from '../types/game.ts';
import { SKILLS_DATA } from '../data/skillsData.ts';

const ICON_PUBLIC_PREFIX = '/assets/icons/';

export function skillIconTextureKey(iconPath: string): string {
  return `skill_icon_${iconPath.replace(/[^a-zA-Z0-9]+/g, '_')}`;
}

/** BootScene.preload — nạp icon võ kỹ. */
export function queueSkillIconLoads(scene: Phaser.Scene): void {
  const queued = new Set<string>();
  for (const skill of SKILLS_DATA) {
    if (!skill.iconPath || queued.has(skill.iconPath)) continue;
    queued.add(skill.iconPath);
    scene.load.image(skillIconTextureKey(skill.iconPath), `${ICON_PUBLIC_PREFIX}${skill.iconPath}`);
  }
}

export function createSkillIcon(
  scene: Phaser.Scene,
  x: number,
  y: number,
  skill: SkillData,
  displaySize: number,
  tint?: number,
): Phaser.GameObjects.Image | null {
  const key = skillIconTextureKey(skill.iconPath);
  if (!scene.textures.exists(key)) return null;
  const img = scene.add.image(x, y, key).setDisplaySize(displaySize, displaySize);
  if (tint !== undefined) img.setTint(tint);
  return img;
}
