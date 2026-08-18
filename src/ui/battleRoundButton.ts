import Phaser from 'phaser';

const ROUND_FILLS: Record<'fight' | 'bag' | 'surrender', number> = {
  fight: 0xc0392b,
  bag: 0x1a508b,
  surrender: 0xf5e6ca,
};

const ROUND_BORDERS: Record<'fight' | 'bag' | 'surrender', number> = {
  fight: 0xfca311,
  bag: 0xfca311,
  surrender: 0xd4af37,
};

/** Nút tròn chiến đấu — viền màu + icon PNG trắng (ADD). */
export function createBattleRoundButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
  kind: 'fight' | 'bag' | 'surrender',
  iconKey: string,
  onClick: () => void,
  iconTint = 0xffffff,
  iconBlendMode: Phaser.BlendModes = Phaser.BlendModes.ADD,
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const circle = scene.add
    .circle(0, 0, size / 2, ROUND_FILLS[kind], 1)
    .setStrokeStyle(3, ROUND_BORDERS[kind]);
  circle.setInteractive({ useHandCursor: true });
  circle.on('pointerdown', onClick);
  container.add(circle);

  if (scene.textures.exists(iconKey)) {
    const icon = scene.add
      .image(0, 0, iconKey)
      .setDisplaySize(size * 0.52, size * 0.52)
      .setBlendMode(iconBlendMode)
      .setTint(iconTint);
    container.add(icon);
  }

  return container;
}
