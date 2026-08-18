import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/gameDimensions.ts';
import { WORLD_LORE_TEXT } from '../../data/worldLore.ts';
import { UI_THEME, clampFontSizePx } from '../theme.ts';
import { ModalBase } from './ModalBase.ts';

/** Câu chuyện về thế giới — mở từ dấu ? dưới khung chat. */
export class WorldLoreModal extends ModalBase {
  constructor(scene: Phaser.Scene, onClose?: () => void) {
    super(scene, { title: 'Câu chuyện về thế giới', height: GAME_HEIGHT - 88, onClose });
    this.build();
  }

  private build(): void {
    this.container.add(
      this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 24, WORLD_LORE_TEXT, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('16px'),
        color: UI_THEME.colors.text,
        align: 'left',
        wordWrap: { width: GAME_WIDTH - 72 },
        lineSpacing: 8,
      }).setOrigin(0.5),
    );
  }
}
