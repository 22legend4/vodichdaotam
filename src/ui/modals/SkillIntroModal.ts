import { GAME_WIDTH, GAME_HEIGHT } from '../../config/gameDimensions.ts';
import { SKILL_POINTS_PER_REALM } from '../../managers/CharacterManager.ts';
import { UI_THEME, clampFontSizePx } from '../theme.ts';
import { ModalBase } from './ModalBase.ts';

const PANEL_W = 480;
const PANEL_H = 320;

/** Thông báo võ kỹ — hiển thị sau bảng phân bổ chỉ số (tối đa 5 lần). */
export class SkillIntroModal extends ModalBase {
  constructor(scene: Phaser.Scene, onClose?: () => void) {
    super(scene, { title: '', fullscreen: true, hideCloseButton: true, onClose });
    this.build();
  }

  private build(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.container.add(
      this.scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55),
    );
    this.container.add(
      this.scene.add.rectangle(cx, cy, PANEL_W, PANEL_H, 0x16213e, 0.97).setStrokeStyle(2, 0xe94560),
    );

    this.container.add(
      this.scene.add.text(cx, cy - PANEL_H / 2 + 40, '⚔ Võ Kỹ', {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('22px'),
        color: UI_THEME.colors.accentAlt,
        fontStyle: 'bold',
      }).setOrigin(0.5),
    );

    const body =
      `Mỗi lần thăng cấp, bạn nhận được ${SKILL_POINTS_PER_REALM} điểm võ kỹ.\n`
      + 'Điểm võ kỹ dùng để mua Võ kỹ.\n'
      + 'Hãy vào mục "Võ Kỹ" để xem điểm và danh sách võ kỹ.';

    this.container.add(
      this.scene.add.text(cx, cy - 12, body, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('17px'),
        color: UI_THEME.colors.text,
        align: 'center',
        wordWrap: { width: PANEL_W - 48 },
        lineSpacing: 6,
      }).setOrigin(0.5),
    );

    this.addButton(cx, cy + PANEL_H / 2 - 44, 200, 44, 'Đã hiểu', () => {
      this.close();
    });
  }
}
