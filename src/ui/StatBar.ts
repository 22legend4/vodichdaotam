import Phaser from 'phaser';
import { UI_THEME, clampFontSizePx } from './theme.ts';
import { ASSET_KEYS } from '../utils/AssetGenerator.ts';

export class StatBar extends Phaser.GameObjects.Container {
  private bgBar: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
  private fillBar: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
  private label: Phaser.GameObjects.Text;
  private barWidth: number;
  private barHeight: number;
  private useTextures: boolean;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    fillColorHex: string,
    bgColorHex: string,
  ) {
    super(scene, x, y);
    this.barWidth = width - 4;
    this.barHeight = height;
    this.useTextures = scene.textures.exists(ASSET_KEYS.uiBarHpFill);

    this.label = scene.add.text(0, -height / 2 - 14, title, {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('14px'),
      color: UI_THEME.colors.textMuted,
    });

    const isHp = fillColorHex === UI_THEME.colors.hp;
    const fillKey = isHp ? ASSET_KEYS.uiBarHpFill : ASSET_KEYS.uiBarQiFill;
    const bgKey = isHp ? ASSET_KEYS.uiBarHpBg : ASSET_KEYS.uiBarQiBg;

    if (this.useTextures && scene.textures.exists(bgKey) && scene.textures.exists(fillKey)) {
      this.bgBar = scene.add.image(0, 0, bgKey).setOrigin(0, 0.5).setDisplaySize(width, height);
      this.fillBar = scene.add.image(2, 0, fillKey).setOrigin(0, 0.5).setDisplaySize(this.barWidth, height - 4);
    } else {
      this.bgBar = scene.add
        .rectangle(0, 0, width, height, parseInt(bgColorHex.replace('#', ''), 16))
        .setOrigin(0, 0.5);
      this.fillBar = scene.add
        .rectangle(2, 0, this.barWidth, height - 4, parseInt(fillColorHex.replace('#', ''), 16))
        .setOrigin(0, 0.5);
    }

    this.add([this.label, this.bgBar, this.fillBar]);
    scene.add.existing(this);
  }

  setRatio(current: number, max: number): void {
    const ratio = max > 0 ? Phaser.Math.Clamp(current / max, 0, 1) : 0;
    const w = Math.max(0, this.barWidth * ratio);
    if (this.fillBar instanceof Phaser.GameObjects.Image) {
      this.fillBar.setDisplaySize(w, this.barHeight - 4);
    } else {
      this.fillBar.width = w;
    }
  }

  setTitle(title: string): void {
    this.label.setText(title);
  }
}
