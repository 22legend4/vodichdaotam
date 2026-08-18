import Phaser from 'phaser';
import { UI_THEME } from './theme.ts';
import { UIButton } from './UIButton.ts';
import { ASSET_KEYS } from '../utils/AssetGenerator.ts';
import { getItemById } from '../data/itemsData.ts';
import { createItemIcon } from '../utils/iconAssets.ts';

const DIALOG_TEXT_X_OFFSET = 130;

export class DialogBox extends Phaser.GameObjects.Container {
  private panel: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
  private speakerText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private portrait: Phaser.GameObjects.Image | null = null;
  private itemIcon: Phaser.GameObjects.Image | null = null;
  private continueBtn: UIButton;
  private tapZone: Phaser.GameObjects.Zone;
  private onContinue?: () => void;
  private advancing = false;
  private readonly panelW: number;

  constructor(scene: Phaser.Scene, width: number, height: number) {
    super(scene, width / 2, height - 110);
    this.setDepth(UI_THEME.depth.dialog);

    this.panelW = width - 40;
    const panelH = 180;

    if (scene.textures.exists(ASSET_KEYS.uiDialogPanel)) {
      this.panel = scene.add
        .image(0, 0, ASSET_KEYS.uiDialogPanel)
        .setDisplaySize(this.panelW, panelH);
    } else {
      this.panel = scene.add
        .rectangle(0, 0, this.panelW, panelH, parseInt(UI_THEME.colors.bgPanel.replace('#', ''), 16), 0.95)
        .setStrokeStyle(2, parseInt(UI_THEME.colors.accentAlt.replace('#', ''), 16));
    }

    this.tapZone = new Phaser.GameObjects.Zone(scene, 0, 0, this.panelW, panelH);
    this.tapZone.setOrigin(0.5, 0.5);
    this.tapZone.setInteractive({ useHandCursor: true });
    this.tapZone.on('pointerdown', () => this.advance());

    this.speakerText = scene.add.text(-this.panelW / 2 + DIALOG_TEXT_X_OFFSET, -62, '', {
      fontFamily: UI_THEME.fontFamilyTitle,
      fontSize: '20px',
      color: UI_THEME.colors.accentAlt,
      fontStyle: 'bold',
    });

    this.bodyText = scene.add.text(-this.panelW / 2 + DIALOG_TEXT_X_OFFSET, -34, '', {
      fontFamily: UI_THEME.fontFamily,
      fontSize: '19px',
      color: UI_THEME.colors.text,
      wordWrap: { width: this.panelW - DIALOG_TEXT_X_OFFSET - 30 },
      lineSpacing: 6,
    });

    this.continueBtn = new UIButton(scene, {
      x: this.panelW / 2 - 72,
      y: 58,
      width: 120,
      height: 44,
      label: 'Tiếp ▶',
      onClick: () => this.advance(),
      addToScene: false,
    });

    this.add([this.tapZone, this.panel, this.speakerText, this.bodyText, this.continueBtn]);
    scene.add.existing(this);
    this.setVisible(false);
  }

  show(
    speaker: string,
    message: string,
    onContinue: () => void,
    portraitKey?: string | null,
    itemId?: string | null,
  ): void {
    this.advancing = false;
    this.speakerText.setText(speaker);
    this.bodyText.setText(message);
    this.onContinue = onContinue;
    this.setPortrait(portraitKey ?? null);
    this.setItemIcon(itemId ?? null);
    this.setVisible(true);
    this.bringToTop(this.continueBtn);
  }

  private advance(): void {
    if (!this.visible || this.advancing || !this.onContinue) return;
    this.advancing = true;
    const cb = this.onContinue;
    this.onContinue = undefined;
    cb();
  }

  private setPortrait(key: string | null): void {
    this.portrait?.destroy();
    this.portrait = null;
    if (!key || !this.scene.textures.exists(key)) return;

    this.portrait = new Phaser.GameObjects.Image(this.scene, -this.panelW / 2 + 58, -8, key);
    const tex = this.scene.textures.get(key);
    const src = tex.getSourceImage() as { width?: number; height?: number };
    const aspect = (src.width ?? 96) / (src.height ?? 128);
    const h = 128;
    this.portrait.setDisplaySize(h * aspect, h);
    this.add(this.portrait);
    this.bringToTop(this.portrait);
    this.bringToTop(this.speakerText);
    this.bringToTop(this.bodyText);
    this.bringToTop(this.continueBtn);
  }

  private setItemIcon(itemId: string | null): void {
    this.itemIcon?.destroy();
    this.itemIcon = null;
    if (!itemId) return;

    const item = getItemById(itemId);
    if (!item) return;

    const textX = -this.panelW / 2 + DIALOG_TEXT_X_OFFSET;
    const iconY = this.bodyText.y + this.bodyText.height + 28;
    const icon = createItemIcon(this.scene, textX + 24, iconY, item, 44);
    if (!icon) return;

    this.itemIcon = icon;
    this.add(icon);
    this.bringToTop(icon);
    this.bringToTop(this.continueBtn);
  }

  hide(): void {
    this.setVisible(false);
    this.onContinue = undefined;
    this.advancing = false;
    this.portrait?.destroy();
    this.portrait = null;
    this.itemIcon?.destroy();
    this.itemIcon = null;
  }
}
