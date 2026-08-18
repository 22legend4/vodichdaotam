import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameDimensions.ts';
import { UI_THEME, clampFontSizePx } from './theme.ts';
import { UIButton } from './UIButton.ts';
import type { TrialRunRewards } from '../utils/trialRunRewards.ts';
import { formatTrialSpoilsBody } from '../utils/trialRunRewards.ts';

export interface TrialSpoilsOverlayConfig {
  rewards: TrialRunRewards;
  onDone: () => void;
}

const OVERLAY_DEPTH = UI_THEME.depth.overlay + 55;

/** Bảng chiến lợi phẩm thu được khi thua ở cửa ải thử thách đặc biệt. */
export class TrialSpoilsOverlay {
  private dismissed = false;
  private readonly container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, config: TrialSpoilsOverlayConfig) {
    this.container = scene.add.container(0, 0).setDepth(OVERLAY_DEPTH).setScrollFactor(0);

    const dim = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050508, 0.88);

    const panelW = Math.min(560, GAME_WIDTH - 48);
    const panelH = Math.min(420, GAME_HEIGHT - 120);
    const panel = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, panelW, panelH, 0x16213e, 0.98)
      .setStrokeStyle(2, 0xfca311, 0.85);

    const title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - panelH / 2 + 36, 'Chiến lợi phẩm', {
      fontFamily: UI_THEME.fontFamilyTitle,
      fontSize: clampFontSizePx('26px'),
      color: UI_THEME.colors.accentAlt,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const body = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - panelH / 2 + 72, formatTrialSpoilsBody(config.rewards), {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('16px'),
      color: UI_THEME.colors.text,
      align: 'left',
      wordWrap: { width: panelW - 40, useAdvancedWrap: true },
      lineSpacing: 6,
    }).setOrigin(0.5, 0);

    const dismiss = (): void => {
      if (this.dismissed) return;
      this.dismissed = true;
      scene.tweens.add({
        targets: this.container,
        alpha: 0,
        duration: 280,
        onComplete: () => {
          this.container.destroy(true);
          config.onDone();
        },
      });
    };

    const continueBtn = new UIButton(scene, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2 + panelH / 2 - 36,
      width: 200,
      height: 44,
      label: 'Tiếp tục ▶',
      onClick: dismiss,
      addToScene: false,
    });

    this.container.add([dim, panel, title, body, continueBtn]);
    this.container.setAlpha(0);
    scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 260,
      ease: 'Cubic.easeOut',
    });

    scene.time.delayedCall(500, () => {
      dim.setInteractive({ useHandCursor: true });
      dim.on('pointerdown', dismiss);
    });
  }

  destroy(): void {
    if (!this.dismissed) {
      this.dismissed = true;
      this.container.destroy(true);
    }
  }
}
