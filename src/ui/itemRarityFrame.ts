import Phaser from 'phaser';
import type { ItemRarity } from '../types/game.ts';

export interface RarityFrameStyle {
  border: number;
  highlight: number;
  shadow: number;
  glow?: number;
  glowAlpha?: number;
  pulse?: boolean;
}

/** Khung phẩm chất 4 cấp — màu theo GDD. */
export const RARITY_FRAME_STYLES: Record<ItemRarity, RarityFrameStyle> = {
  dong: {
    border: 0xcd7f32,
    highlight: 0xe8a865,
    shadow: 0x8b5a2b,
  },
  bac: {
    border: 0xc0c0c0,
    highlight: 0xf0f0f0,
    shadow: 0x808080,
  },
  vang: {
    border: 0xffd700,
    highlight: 0xffee88,
    shadow: 0xb8860b,
    glow: 0xffd700,
    glowAlpha: 0.38,
    pulse: true,
  },
  kimcuong: {
    border: 0x00ffff,
    highlight: 0x88ffff,
    shadow: 0x008888,
    glow: 0x00ffff,
    glowAlpha: 0.42,
    pulse: true,
  },
  than: {
    border: 0x9933ff,
    highlight: 0xcc88ff,
    shadow: 0x0a0014,
    glow: 0x7700cc,
    glowAlpha: 0.5,
    pulse: true,
  },
};

/** Vẽ khung vuông 3D Tiên hiệp bọc icon vật phẩm. */
export function createItemRarityFrame(
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
  rarity: ItemRarity,
): Phaser.GameObjects.Container {
  const style = RARITY_FRAME_STYLES[rarity];
  const container = scene.add.container(x, y);
  const half = size / 2;
  const pad = 2;
  const radius = 7;

  if (style.glow !== undefined) {
    if (rarity === 'than') {
      const blackGlow = scene.add.circle(0, 0, half + 7, 0x000000, 0.5);
      container.add(blackGlow);
    }
    const glow = scene.add.circle(0, 0, half + 5, style.glow, style.glowAlpha ?? 0.35);
    container.add(glow);
    if (style.pulse) {
      scene.tweens.add({
        targets: glow,
        alpha: { from: (style.glowAlpha ?? 0.35) * 0.55, to: style.glowAlpha ?? 0.35 },
        scale: { from: 0.92, to: 1.06 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  const frame = scene.add.graphics();
  // Viền ngoài tối (3D đáy)
  frame.lineStyle(3, style.shadow, 1);
  frame.strokeRoundedRect(-half + 1, -half + 1, size - pad, size - pad, radius);
  // Viền chính
  frame.lineStyle(2, style.border, 1);
  frame.strokeRoundedRect(-half, -half, size - pad, size - pad, radius);
  // Highlight trên (3D sáng)
  frame.lineStyle(1, style.highlight, 0.85);
  frame.strokeRoundedRect(-half + 2, -half + 2, size - pad - 4, (size - pad) * 0.45, radius - 2);
  container.add(frame);

  return container;
}

/** Gắn khung phẩm chất quanh icon trang bị / yêu thú có rarity. */
export function addRarityFrameIfNeeded(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  x: number,
  y: number,
  size: number,
  rarity?: ItemRarity,
): void {
  if (!rarity) return;
  const frame = createItemRarityFrame(scene, x, y, size, rarity);
  parent.addAt(frame, 0);
}
