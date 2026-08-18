import Phaser from 'phaser';
import { UI_THEME, clampFontSizePx } from './theme.ts';

export class FloatingCombatText {
  static spawn(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    kind: 'damage' | 'heal' | 'qi' | 'info' = 'damage',
  ): void {
    const colorMap = {
      damage: UI_THEME.colors.damage,
      heal: UI_THEME.colors.heal,
      qi: UI_THEME.colors.qi,
      info: UI_THEME.colors.buff,
    };

    const floater = scene.add
      .text(x, y, text, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx(kind === 'damage' ? 24 : 20),
        color: colorMap[kind],
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(UI_THEME.depth.overlay);

    scene.tweens.add({
      targets: floater,
      y: y - 60,
      alpha: 0,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => floater.destroy(),
    });
  }
}
