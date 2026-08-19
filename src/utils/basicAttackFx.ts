import Phaser from 'phaser';

/** Quả cầu đánh thường — lõi trắng, hào quang xanh dương tỏa ra ngoài. */
export function createBasicAttackOrb(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0);

  const glowOuter = scene.add.circle(0, 0, 48, 0x1a6fd4, 0.12);
  const glowMid = scene.add.circle(0, 0, 34, 0x3498db, 0.28);
  const glowInner = scene.add.circle(0, 0, 22, 0x5dade2, 0.45);
  const core = scene.add.circle(0, 0, 12, 0xffffff, 1);

  container.add([glowOuter, glowMid, glowInner, core]);
  return container;
}

/** Pha nổ khi quả cầu chạm địch — bung sáng rồi mờ dần. */
export function showBasicAttackImpactFx(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  impactMs: number,
): void {
  const fx = createBasicAttackOrb(scene);
  fx.setPosition(0, -12);
  fx.setAlpha(0.95);
  parent.add(fx);
  parent.bringToTop(fx);

  scene.tweens.add({
    targets: fx,
    alpha: 0,
    scale: 1.12,
    duration: impactMs,
    ease: 'Cubic.easeOut',
    onComplete: () => fx.destroy(),
  });
}
