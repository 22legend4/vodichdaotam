import Phaser from 'phaser';

export type Gfx = Phaser.GameObjects.Graphics;

export function isRendererReady(scene: Phaser.Scene): boolean {
  return Boolean(scene.sys?.game?.renderer);
}

/** Texture nền dùng được — tránh hiển thị trang HTML lỗi full màn (trắng). */
export function isUsableBgTexture(scene: Phaser.Scene, key: string): boolean {
  if (!scene.textures.exists(key)) return false;
  const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | null;
  if (!src || src.naturalWidth < 64 || src.naturalHeight < 64) return false;
  const aspect = src.naturalWidth / src.naturalHeight;
  return aspect > 0.4 && aspect < 2.5;
}

export function makeGfx(scene: Phaser.Scene): Gfx | null {
  if (!isRendererReady(scene)) {
    console.warn('[AssetGenerator] Renderer not ready');
    return null;
  }
  try {
    return new Phaser.GameObjects.Graphics(scene, { x: 0, y: 0 });
  } catch {
    try {
      const gfx = scene.add.graphics({ x: -10_000, y: -10_000 });
      gfx.setVisible(false);
      return gfx;
    } catch (err) {
      console.warn('[AssetGenerator] Cannot create Graphics:', err);
      return null;
    }
  }
}

export function commitTexture(
  scene: Phaser.Scene,
  gfx: Gfx,
  key: string,
  w: number,
  h: number,
): boolean {
  const width = Math.max(1, Math.ceil(w));
  const height = Math.max(1, Math.ceil(h));

  try {
    if (scene.textures.exists(key)) {
      scene.textures.remove(key);
    }
    gfx.generateTexture(key, width, height);
    return scene.textures.exists(key);
  } catch (err) {
    console.warn(`[AssetGenerator] generateTexture failed (${key}):`, err);
    return false;
  } finally {
    try {
      gfx.destroy();
    } catch {
      /* ignore */
    }
  }
}

export function safeGenerate(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (gfx: Gfx) => void,
): boolean {
  if (!isRendererReady(scene)) return false;
  const gfx = makeGfx(scene);
  if (!gfx) return false;
  try {
    gfx.clear();
    draw(gfx);
    return commitTexture(scene, gfx, key, w, h);
  } catch (err) {
    console.warn(`[AssetGenerator] Draw failed (${key}):`, err);
    try {
      gfx.destroy();
    } catch {
      /* ignore */
    }
    return false;
  }
}

/** Gradient dọc bằng các dải màu. */
export function drawVerticalGradient(
  gfx: Gfx,
  w: number,
  h: number,
  top: number,
  bottom: number,
  steps = 24,
): void {
  for (let i = 0; i < steps; i++) {
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.IntegerToColor(top),
      Phaser.Display.Color.IntegerToColor(bottom),
      steps - 1,
      i,
    );
    const c = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
    const y0 = Math.floor((h / steps) * i);
    const y1 = Math.floor((h / steps) * (i + 1));
    gfx.fillStyle(c, 1);
    gfx.fillRect(0, y0, w, y1 - y0 + 1);
  }
}

export function drawXianxiaFrame(gfx: Gfx, size: number, borderColor: number, innerColor: number): void {
  const pad = 4;
  gfx.lineStyle(3, borderColor, 1);
  gfx.strokeRoundedRect(pad, pad, size - pad * 2, size - pad * 2, 10);
  gfx.fillStyle(innerColor, 0.25);
  gfx.fillRoundedRect(pad + 2, pad + 2, size - pad * 2 - 4, size - pad * 2 - 4, 8);
  const corner = 8;
  gfx.lineStyle(2, borderColor, 0.9);
  [[pad, pad], [size - pad - corner, pad], [pad, size - pad - corner], [size - pad - corner, size - pad - corner]].forEach(([x, y]) => {
    gfx.strokeRect(x, y, corner, corner);
  });
}
