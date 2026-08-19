import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameDimensions.ts';
import { UI_THEME, clampFontSizePx } from './theme.ts';
import { UIButton } from './UIButton.ts';

export interface ThapTamChauAnnouncementOverlayConfig {
  onDone: () => void;
}

const OVERLAY_DEPTH = UI_THEME.depth.overlay + 60;

const ANNOUNCEMENT_BODY =
  'Bạn đã vượt qua Cửu Giới, tiến vào Thập Tam Châu. Chiến đấu tại Thập Tam Châu sẽ có thêm chỉ số mới, các Thần Kỹ mới. '
  + 'Rất mong bạn sẽ nhận được thêm nhiều niềm vui tại Thập Tam Châu.\n\n'
  + 'Map Thập Tam Châu là 1 app riêng, bạn liên hệ Zalo 0879 805 525 để nhận link tải nhé.';

/** Thông báo sau khi vượt ải Giới Tâm — giới thiệu Thập Tam Châu. */
export class ThapTamChauAnnouncementOverlay {
  private dismissed = false;
  private readonly container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, config: ThapTamChauAnnouncementOverlayConfig) {
    this.container = scene.add.container(0, 0).setDepth(OVERLAY_DEPTH).setScrollFactor(0);

    const dim = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050508, 0.88);

    const panelW = Math.min(580, GAME_WIDTH - 40);
    const panelH = Math.min(460, GAME_HEIGHT - 100);
    const panel = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, panelW, panelH, 0x16213e, 0.98)
      .setStrokeStyle(2, 0xfca311, 0.9);

    const title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - panelH / 2 + 40, 'Tiến vào Thập Tam Châu', {
      fontFamily: UI_THEME.fontFamilyTitle,
      fontSize: clampFontSizePx('26px'),
      color: UI_THEME.colors.accentAlt,
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5);

    const body = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - panelH / 2 + 88, ANNOUNCEMENT_BODY, {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('16px'),
      color: UI_THEME.colors.text,
      align: 'center',
      wordWrap: { width: panelW - 48, useAdvancedWrap: true },
      lineSpacing: 8,
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
      y: GAME_HEIGHT / 2 + panelH / 2 - 40,
      width: 220,
      height: 48,
      label: 'Tiếp tục ▶',
      onClick: dismiss,
      addToScene: false,
    });

    this.container.add([dim, panel, title, body, continueBtn]);

    this.container.setAlpha(0);
    scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 280,
      ease: 'Cubic.easeOut',
    });

    scene.time.delayedCall(700, () => {
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
