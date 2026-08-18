import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/gameDimensions.ts';
import { UI_THEME, UI_FONT_MIN, clampFontSizePx } from '../theme.ts';
import { UIButton } from '../UIButton.ts';

export interface ModalBaseConfig {
  title: string;
  height?: number;
  /** Không vẽ khung modal mặc định — nội dung tự phủ full màn hình. */
  fullscreen?: boolean;
  /** Ẩn nút Đóng mặc định ở chân modal. */
  hideCloseButton?: boolean;
  onClose?: () => void;
}

export class ModalBase {
  readonly container: Phaser.GameObjects.Container;
  protected readonly scene: Phaser.Scene;
  private onClose?: () => void;

  constructor(scene: Phaser.Scene, config: ModalBaseConfig) {
    this.scene = scene;
    this.onClose = config.onClose;
    this.container = scene.add.container(0, 0).setDepth(UI_THEME.depth.overlay);

    if (config.fullscreen) {
      this.prependFullscreenInputBlocker();
      return;
    }

    const panelH = config.height ?? GAME_HEIGHT - 160;

    const bg = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 20, panelH, 0x16213e, 0.97)
      .setStrokeStyle(2, 0xe94560);

    const title = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - panelH / 2 + 36, config.title, {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: '22px',
        color: UI_THEME.colors.accentAlt,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const closeBtn = new UIButton(scene, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2 + panelH / 2 - 36,
      width: 140,
      height: 44,
      label: 'Đóng',
      onClick: () => this.close(),
      addToScene: false,
    });

    const panelChildren: Phaser.GameObjects.GameObject[] = [bg, title];
    if (!config.hideCloseButton) panelChildren.push(closeBtn);
    this.container.add(panelChildren);
  }

  /** Chặn click xuyên xuống HUD/nút sảnh chính phía dưới modal full màn hình. */
  protected prependFullscreenInputBlocker(): void {
    const blocker = this.scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.001)
      .setInteractive({ useHandCursor: false });
    this.container.addAt(blocker, 0);
  }

  add(...objects: Phaser.GameObjects.GameObject[]): void {
    this.container.add(objects);
  }

  close(): void {
    this.container.destroy(true);
    this.onClose?.();
  }

  showToast(message: string): void {
    const toast = this.scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 100, message, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('16px'),
        color: UI_THEME.colors.text,
        backgroundColor: '#0f3460',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(UI_THEME.depth.overlay + 1);

    this.scene.time.delayedCall(2000, () => toast.destroy());
  }

  protected addText(
    x: number,
    y: number,
    content: string,
    fontSize = UI_FONT_MIN,
    color: string = UI_THEME.colors.text,
  ): Phaser.GameObjects.Text {
    const t = this.scene.add.text(x, y, content, {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx(fontSize),
      color,
      align: 'center',
      wordWrap: { width: GAME_WIDTH - 80 },
    }).setOrigin(0.5);
    this.container.add(t);
    return t;
  }

  protected addButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void,
  ): UIButton {
    const btn = new UIButton(this.scene, { x, y, width, height, label, onClick, addToScene: false });
    this.container.add(btn);
    return btn;
  }
}
