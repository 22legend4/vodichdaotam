import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameDimensions.ts';
import { UI_THEME, clampFontSizePx } from './theme.ts';
import { UIButton } from './UIButton.ts';
import { AVATAR_W, AVATAR_H } from '../utils/assetDrawCharacters.ts';

export interface BattleVictoryOverlayConfig {
  outcome: 'victory' | 'defeat';
  unitEntries: { id: string; avatarKey: string; name: string }[];
  subtitle?: string;
  onDone: () => void;
}

const OVERLAY_DEPTH = UI_THEME.depth.overlay + 50;
const VICTORY_CHAR_HEIGHT = 200;

function avatarDisplaySize(scene: Phaser.Scene, key: string): { w: number; h: number } {
  const tex = scene.textures.get(key);
  const src = tex.getSourceImage() as { width?: number; height?: number };
  const natW = src.width ?? AVATAR_W;
  const natH = src.height ?? AVATAR_H;
  const h = key.startsWith('char_') ? VICTORY_CHAR_HEIGHT : AVATAR_H;
  return { w: (natW / natH) * h, h };
}

/** Màn hình kết quả: nhân vật phe thắng + chữ Chiến Thắng / Thất Bại. */
export class BattleVictoryOverlay {
  private dismissed = false;
  private readonly container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, config: BattleVictoryOverlayConfig) {
    this.container = scene.add.container(0, 0).setDepth(OVERLAY_DEPTH).setScrollFactor(0);

    const isVictory = config.outcome === 'victory';
    const title = isVictory ? 'Chiến Thắng' : 'Thất Bại';
    const titleColor = isVictory ? '#fca311' : '#e94560';

    const dim = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050508, 0.82);

    const banner = scene.add
      .text(GAME_WIDTH / 2, 96, title, {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: '56px',
        color: titleColor,
        fontStyle: 'bold',
        stroke: '#0a0a14',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setScale(0.85);

    const children: Phaser.GameObjects.GameObject[] = [dim, banner];

    if (config.subtitle) {
      children.push(
        scene.add
          .text(GAME_WIDTH / 2, 168, config.subtitle, {
            fontFamily: UI_THEME.fontFamily,
            fontSize: clampFontSizePx(isVictory ? '17px' : '37px'),
            color: UI_THEME.colors.text,
            align: 'center',
            wordWrap: { width: GAME_WIDTH - 100 },
            lineSpacing: isVictory ? 0 : 8,
          })
          .setOrigin(0.5),
      );
    }

    const entries = config.unitEntries.length > 0
      ? config.unitEntries.slice(0, 5)
      : [{ id: 'placeholder', avatarKey: '', name: isVictory ? 'Đồng minh' : 'Kẻ địch' }];

    const spacing = Math.min(118, (GAME_WIDTH - 100) / Math.max(entries.length, 1));
    const totalW = (entries.length - 1) * spacing;
    const startX = GAME_WIDTH / 2 - totalW / 2;
    const rowY = GAME_HEIGHT / 2 + 12;

    entries.forEach((entry, i) => {
      const x = startX + i * spacing;
      const slot = scene.add.container(x, rowY);

      if (entry.avatarKey && scene.textures.exists(entry.avatarKey)) {
        const { w, h } = avatarDisplaySize(scene, entry.avatarKey);
        slot.add(
          scene.add
            .image(0, -6, entry.avatarKey)
            .setDisplaySize(w, h),
        );
        slot.add(
          scene.add.text(0, -6 + h / 2 + 12, entry.name, {
            fontFamily: UI_THEME.fontFamilyTitle,
            fontSize: clampFontSizePx('14px'),
            color: UI_THEME.colors.text,
            stroke: '#0a0a14',
            strokeThickness: 2,
          }).setOrigin(0.5, 0),
        );
      } else {
        slot.add(
          scene.add
            .rectangle(0, -6, AVATAR_W, AVATAR_H, isVictory ? 0x2980b9 : 0xc0392b, 0.85)
            .setStrokeStyle(2, isVictory ? 0xfca311 : 0xe94560),
        );
        slot.add(
          scene.add.text(0, 64, entry.name, {
            fontFamily: UI_THEME.fontFamilyTitle,
            fontSize: clampFontSizePx('14px'),
            color: UI_THEME.colors.text,
            stroke: '#0a0a14',
            strokeThickness: 2,
          }).setOrigin(0.5, 0),
        );
      }

      children.push(slot);
      scene.tweens.add({
        targets: slot,
        y: rowY - 6,
        duration: 700,
        yoyo: true,
        repeat: -1,
        delay: i * 120,
        ease: 'Sine.easeInOut',
      });
    });

    const dismiss = (): void => {
      if (this.dismissed) return;
      this.dismissed = true;
      scene.tweens.add({
        targets: this.container,
        alpha: 0,
        duration: 320,
        onComplete: () => {
          this.container.destroy(true);
          config.onDone();
        },
      });
    };

    const continueBtn = new UIButton(scene, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 64,
      width: 220,
      height: 50,
      label: 'Tiếp tục ▶',
      onClick: dismiss,
      addToScene: false,
    });
    children.push(continueBtn);

    this.container.add(children);

    this.container.setAlpha(0);
    scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 280,
      ease: 'Cubic.easeOut',
    });

    scene.tweens.add({
      targets: banner,
      scaleX: 1,
      scaleY: 1,
      duration: 420,
      ease: 'Back.easeOut',
    });

    // Tránh click "Chiến Luôn" vô tình đóng overlay ngay lập tức.
    scene.time.delayedCall(700, () => {
      dim.setInteractive({ useHandCursor: true });
      dim.on('pointerdown', dismiss);
    });

    scene.time.delayedCall(12000, dismiss);
  }

  destroy(): void {
    if (!this.dismissed) {
      this.dismissed = true;
      this.container.destroy(true);
    }
  }
}
