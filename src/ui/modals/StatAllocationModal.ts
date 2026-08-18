import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/gameDimensions.ts';
import { GameState } from '../../state/gameState.ts';
import type { BaseStats, CharacterData, RealmLevel } from '../../types/game.ts';
import { DEFAULT_BASE_STATS } from '../../constants/gameRules.ts';
import { UI_THEME, REALM_LABELS, clampFontSizePx, uiLabelTextStyle } from '../theme.ts';
import { StatAllocationPanel } from '../StatAllocationPanel.ts';
import { UIButton } from '../UIButton.ts';
import { resolveAvatarKey } from '../../utils/AssetGenerator.ts';
import { resolvePlayerDisplayKey } from '../../utils/characterSpriteAssets.ts';
import { AVATAR_H, AVATAR_W } from '../../utils/assetDrawCharacters.ts';

export interface StatAllocationModalConfig {
  characterId: string;
  pointBudget: number;
  title: string;
  /** Cảnh giới mới sau đột phá — ưu tiên hiển thị trên dòng thăng cấp. */
  newRealm?: RealmLevel;
  onDone?: () => void;
}

const PANEL_W = 780;
const PANEL_H = 500;
const PORTRAIT_H = 220;
const NAME_COLOR = '#9ae66e';

function getCharacterCurrentStats(characterId: string): BaseStats {
  const char = GameState.getInstance().characterManager.getCharacter(characterId);
  if (!char) return { ...DEFAULT_BASE_STATS };
  return { ...char.baseStats };
}

/** Bảng phân bổ điểm tu luyện sau đột phá cảnh giới. */
export class StatAllocationModal {
  readonly container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, config: StatAllocationModalConfig) {
    this.container = scene.add.container(0, 0).setDepth(UI_THEME.depth.overlay + 2);

    const gs = GameState.getInstance();
    const character = gs.characterManager.getCharacter(config.characterId);
    const panelCx = GAME_WIDTH / 2;
    const panelCy = GAME_HEIGHT / 2;
    const panelLeft = panelCx - PANEL_W / 2;

    const bg = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0a14, 0.82);
    this.container.add(bg);

    const panel = scene.add
      .rectangle(panelCx, panelCy, PANEL_W, PANEL_H, 0x16213e, 0.98)
      .setStrokeStyle(2, 0xeab308);
    this.container.add(panel);

    let headerY = panelCy - PANEL_H / 2 + 42;

    this.container.add(
      scene.add.text(panelCx, headerY, config.title, {
        ...uiLabelTextStyle(24, { titleFont: true, bold: true }),
        color: UI_THEME.colors.accentAlt,
        wordWrap: { width: PANEL_W - 40 },
        align: 'center',
      }).setOrigin(0.5),
    );

    headerY += 44;

    if (character) {
      const realm = config.newRealm ?? character.realm;
      const realmLabel = REALM_LABELS[realm] ?? realm;
      this.container.add(
        scene.add.text(panelCx, headerY, `Thăng cấp lên ${realmLabel}`, {
          ...uiLabelTextStyle(18, { bold: true }),
          color: NAME_COLOR,
          wordWrap: { width: PANEL_W - 48 },
          align: 'center',
        }).setOrigin(0.5),
      );
    }

    let allocationValid = false;
    let allocated = { hp: 0, atk: 0, def: 0, qi: 0 };
    const currentStats = getCharacterCurrentStats(config.characterId);
    const panelTop = panelCy - PANEL_H / 2;

    const statPanel = new StatAllocationPanel(
      scene,
      panelLeft + 36,
      panelTop + 108,
      420,
      config.pointBudget,
      currentStats,
    );
    statPanel.setDepth(UI_THEME.depth.overlay + 3);
    statPanel.onAllocationChange((next, valid) => {
      allocated = next;
      allocationValid = valid;
      confirmBtn.setAlpha(valid ? 1 : 0.55);
    });

    if (character) {
      this.addCharacterPortrait(scene, character, panelLeft + PANEL_W - 150, panelTop + 168);
    }

    const confirmBtn = new UIButton(scene, {
      x: panelCx,
      y: panelCy + PANEL_H / 2 - 44,
      width: 260,
      height: 46,
      label: 'Xác nhận',
      onClick: () => {
        if (!allocationValid) return;
        const ok = gs.characterManager.applyPendingStatAllocation(config.characterId, allocated);
        if (!ok) return;
        statPanel.destroy();
        this.container.destroy(true);
        config.onDone?.();
      },
      enabled: true,
    });
    confirmBtn.setDepth(UI_THEME.depth.overlay + 3);
    confirmBtn.setAlpha(0.55);
    this.container.add(confirmBtn);
  }

  private addCharacterPortrait(
    scene: Phaser.Scene,
    character: CharacterData,
    x: number,
    y: number,
  ): void {
    const avatarKey =
      resolvePlayerDisplayKey(scene, character.appearanceId, character.gender, character.weaponType)
      ?? resolveAvatarKey(character.id, character.gender, character.weaponType, character.appearanceId);

    if (scene.textures.exists(avatarKey)) {
      const img = scene.add.image(x, y - 24, avatarKey);
      const tex = scene.textures.get(avatarKey);
      const src = tex.getSourceImage() as { width?: number; height?: number };
      const aspect = (src.width ?? AVATAR_W) / (src.height ?? AVATAR_H);
      const h = avatarKey.startsWith('char_') ? PORTRAIT_H : AVATAR_H * 2.4;
      img.setDisplaySize(h * aspect, h);
      img.setDepth(UI_THEME.depth.overlay + 3);
      this.container.add(img);
    } else {
      this.container.add(
        scene.add.rectangle(x, y - 24, AVATAR_W * 1.6, PORTRAIT_H, 0x2980b9, 0.45)
          .setStrokeStyle(2, 0xffffff, 0.35)
          .setDepth(UI_THEME.depth.overlay + 3),
      );
    }

    this.container.add(
      scene.add.text(x, y + PORTRAIT_H / 2 - 8, character.name, {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('16px'),
        color: NAME_COLOR,
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 200 },
        stroke: '#0a0a14',
        strokeThickness: 2,
      }).setOrigin(0.5, 0).setDepth(UI_THEME.depth.overlay + 3),
    );
  }
}
