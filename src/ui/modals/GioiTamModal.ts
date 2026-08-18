import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/gameDimensions.ts';
import { ModalBase } from './ModalBase.ts';
import { UI_THEME, clampFontSizePx } from '../theme.ts';
import { UIButton } from '../UIButton.ts';

/** Giới Tâm — mở từ Cổng dịch chuyển (Chương 9). */
export class GioiTamModal extends ModalBase {
  constructor(scene: Phaser.Scene, onClose?: () => void) {
    super(scene, { title: '☯ Giới Tâm', fullscreen: true, onClose });
    this.build();
  }

  private build(): void {
    this.prependFullscreenInputBlocker();

    this.container.add(
      this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0f1628, 0.98),
    );

    this.container.add(
      this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'Cửa hàng thần khí', {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('22px'),
        color: UI_THEME.colors.accentAlt,
        fontStyle: 'bold',
      }).setOrigin(0.5),
    );

    this.container.add(
      this.scene.add.text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 8,
        'Đổi Giọt Giới Thủy lấy trang bị thần khí.\n(Tính năng đang hoàn thiện)',
        {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('16px'),
          color: '#ffffff',
          align: 'center',
          lineSpacing: 8,
        },
      ).setOrigin(0.5),
    );

    const closeBtn = new UIButton(this.scene, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 56,
      width: 140,
      height: 44,
      label: 'Quay lại',
      onClick: () => this.close(),
      addToScene: false,
    });
    this.container.add(closeBtn);
  }
}
