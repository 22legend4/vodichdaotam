import Phaser from 'phaser';
import { UI_THEME } from './theme.ts';
import { ASSET_KEYS } from '../utils/AssetGenerator.ts';
import { soundManager } from '../utils/SoundManager.ts';

/** Mở rộng vùng bấm để dễ chạm (px mỗi cạnh). */
const HIT_PAD = 8;
const SELECTED_TAB_FILL = parseInt(UI_THEME.colors.buttonHover.replace('#', ''), 16);
const SELECTED_TAB_FILL_HOVER = 0x2160a3;
const SELECTED_TAB_BORDER = 0xfca311;

export interface UIButtonConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  onClick: () => void;
  enabled?: boolean;
  color?: number;
  /** Tab/nút đang được chọn — nền xanh hover, chữ trắng, viền vàng. */
  selected?: boolean;
  /** Khoảng cách chữ tới mép trái/phải nút (px). */
  textPaddingX?: number;
  /** Luôn dùng hình chữ nhật (không dùng texture nút). */
  flatBackground?: boolean;
  /** Không xuống dòng label. */
  singleLine?: boolean;
  /** false khi nút sẽ được add vào Container cha (Modal, Panel…). */
  addToScene?: boolean;
}

export class UIButton extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
  private labelText: Phaser.GameObjects.Text;
  private hitZone: Phaser.GameObjects.Zone;
  private _enabled = true;
  private _selected = false;
  private clickHandler: () => void;
  private readonly fillColor: number;
  private readonly textPaddingX: number;
  private readonly useTexture: boolean;

  constructor(scene: Phaser.Scene, config: UIButtonConfig) {
    super(scene, config.x, config.y);
    this.clickHandler = config.onClick;
    this.fillColor = config.color ?? parseInt(UI_THEME.colors.button.replace('#', ''), 16);
    this.textPaddingX = config.textPaddingX ?? 14;
    this._selected = config.selected ?? false;
    this.useTexture =
      !config.flatBackground && scene.textures.exists(ASSET_KEYS.uiButton);
    const hitW = config.width + HIT_PAD * 2;
    const hitH = config.height + HIT_PAD * 2;

    this.hitZone = new Phaser.GameObjects.Zone(scene, 0, 0, hitW, hitH);
    this.hitZone.setOrigin(0.5, 0.5);

    if (this.useTexture) {
      this.bg = new Phaser.GameObjects.Image(scene, 0, 0, ASSET_KEYS.uiButton);
      this.bg.setDisplaySize(config.width, config.height);
    } else {
      this.bg = new Phaser.GameObjects.Rectangle(scene, 0, 0, config.width, config.height, this.fillColor, 1);
      this.bg.setStrokeStyle(2, parseInt(UI_THEME.colors.accent.replace('#', ''), 16));
    }
    this.bg.setOrigin(0.5, 0.5);

    this.labelText = new Phaser.GameObjects.Text(scene, 0, 0, config.label, {
      fontFamily: UI_THEME.fontFamily,
      fontSize: '22px',
      color: UI_THEME.colors.text,
      align: 'center',
      ...(config.singleLine
        ? {}
        : { wordWrap: { width: config.width - this.textPaddingX * 2, useAdvancedWrap: true } }),
    });
    this.labelText.setOrigin(0.5);

    this.add([this.hitZone, this.bg, this.labelText]);
    this.bindInteraction();
    this.setEnabled(config.enabled ?? true);
    this.refreshAppearance();

    if (config.addToScene !== false) {
      scene.add.existing(this);
    }
  }

  /** Hit area mặc định của Phaser (không custom) — khớp origin 0.5 của Zone. */
  private enableHitZone(): void {
    this.hitZone.setInteractive({ useHandCursor: true });
  }

  private bindInteraction(): void {
    this.enableHitZone();

    this.hitZone.on('pointerover', () => {
      if (!this._enabled) return;
      if (this._selected) {
        if (this.bg instanceof Phaser.GameObjects.Rectangle) {
          this.bg.setFillStyle(SELECTED_TAB_FILL_HOVER);
        }
        return;
      }
      if (this.useTexture && this.scene.textures.exists(ASSET_KEYS.uiButtonHover)) {
        (this.bg as Phaser.GameObjects.Image).setTexture(ASSET_KEYS.uiButtonHover);
      } else if (this.bg instanceof Phaser.GameObjects.Rectangle) {
        this.bg.setFillStyle(parseInt(UI_THEME.colors.buttonHover.replace('#', ''), 16));
      }
    });
    this.hitZone.on('pointerout', () => {
      if (!this._enabled) return;
      this.refreshAppearance();
    });
    this.hitZone.on('pointerdown', () => {
      if (!this._enabled) return;
      try {
        soundManager.playUiClick();
      } catch {
        /* âm thanh không chặn click */
      }
      this.clickHandler();
    });
  }

  private refreshAppearance(): void {
    const defaultBorder = parseInt(UI_THEME.colors.accent.replace('#', ''), 16);
    if (this._selected) {
      if (this.bg instanceof Phaser.GameObjects.Rectangle) {
        this.bg.setFillStyle(SELECTED_TAB_FILL);
        this.bg.setStrokeStyle(3, SELECTED_TAB_BORDER);
      }
      this.labelText.setColor(UI_THEME.colors.text);
    } else if (this._enabled) {
      if (this.useTexture && this.scene.textures.exists(ASSET_KEYS.uiButton)) {
        (this.bg as Phaser.GameObjects.Image).setTexture(ASSET_KEYS.uiButton);
      } else if (this.bg instanceof Phaser.GameObjects.Rectangle) {
        this.bg.setFillStyle(this.fillColor);
        this.bg.setStrokeStyle(2, defaultBorder);
      }
      this.labelText.setColor(UI_THEME.colors.text);
    }
  }

  setLabel(label: string): void {
    this.labelText.setText(label);
  }

  setSelected(selected: boolean): void {
    this._selected = selected;
    this.refreshAppearance();
  }

  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
    this.setAlpha(enabled ? 1 : 0.45);
    this.labelText.setAlpha(enabled ? 1 : 0.5);
    if (enabled) {
      this.enableHitZone();
      this.refreshAppearance();
    } else {
      this.hitZone.disableInteractive();
    }
  }

  isEnabled(): boolean {
    return this._enabled;
  }
}
