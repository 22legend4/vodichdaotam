import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/gameDimensions.ts';
import { UI_THEME, clampFontSizePx } from '../theme.ts';
import { GameState } from '../../state/gameState.ts';
import { ModalBase } from './ModalBase.ts';
import { getItemById } from '../../data/itemsData.ts';
import type { RewardGrant } from '../../managers/DailyRewardManager.ts';
import { ASSET_KEYS, resolveItemIconKey } from '../../utils/AssetGenerator.ts';
import { createItemIcon, createCurrencyUiIcon } from '../../utils/iconAssets.ts';
import { soundManager } from '../../utils/SoundManager.ts';

const GRID_COLS = 5;
const CELL_W = 118;
const CELL_H = 72;
const GRID_START_Y = 148;
const MAX_CELL_ICONS = 6;

function grantDisplayName(grant: RewardGrant): string {
  if (grant.kind === 'tinhThach') return `${grant.amount} Tinh thạch`;
  if (grant.kind === 'gioiThuy') return `${grant.amount} Giọt Giới Thủy`;
  if (grant.kind === 'item') {
    const item = getItemById(grant.itemId);
    const name = item?.name ?? grant.itemId;
    return grant.quantity > 1 ? `${name} x${grant.quantity}` : name;
  }
  return 'Nhẫn không gian';
}

function grantDescription(grant: RewardGrant): string {
  if (grant.kind === 'tinhThach') return getItemById('cur_tinhThach')?.description ?? 'Tiền trong game.';
  if (grant.kind === 'gioiThuy') return getItemById('cur_gioiThuy')?.description ?? 'Tiền tệ cao cấp.';
  if (grant.kind === 'item') return getItemById(grant.itemId)?.description ?? '';
  return getItemById('item_nhanKhongGian')?.description ?? '';
}

function grantIconKey(scene: Phaser.Scene, grant: RewardGrant): string | null {
  if (grant.kind === 'tinhThach') {
    return scene.textures.exists(ASSET_KEYS.uiIconTinhThach) ? ASSET_KEYS.uiIconTinhThach : null;
  }
  if (grant.kind === 'gioiThuy') {
    return scene.textures.exists(ASSET_KEYS.uiIconGioiThuy) ? ASSET_KEYS.uiIconGioiThuy : null;
  }
  if (grant.kind === 'item') return resolveItemIconKey(grant.itemId);
  return resolveItemIconKey('item_nhanKhongGian');
}

function grantStackAmount(grant: RewardGrant): number | null {
  if (grant.kind === 'tinhThach' || grant.kind === 'gioiThuy') return grant.amount;
  if (grant.kind === 'item' && grant.quantity > 1) return grant.quantity;
  return null;
}

function addGrantIcon(
  scene: Phaser.Scene,
  grant: RewardGrant,
  x: number,
  y: number,
  size: number,
): Phaser.GameObjects.GameObject[] {
  const parts: Phaser.GameObjects.GameObject[] = [];
  if (grant.kind === 'item') {
    const item = getItemById(grant.itemId);
    if (item) {
      const icon = createItemIcon(scene, x, y, item, size);
      if (icon) {
        parts.push(icon);
      } else {
        const key = grantIconKey(scene, grant);
        if (key && scene.textures.exists(key)) {
          parts.push(scene.add.image(x, y, key).setDisplaySize(size, size));
        } else {
          parts.push(scene.add.rectangle(x, y, size, size, 0x2980b9, 0.5));
        }
      }
    }
  } else if (grant.kind === 'tinhThach') {
    const icon = createCurrencyUiIcon(scene, x, y, 'tinhThach', size, size);
    if (icon) parts.push(icon);
  } else if (grant.kind === 'gioiThuy') {
    const icon = createCurrencyUiIcon(scene, x, y, 'gioiThuy', size, size);
    if (icon) parts.push(icon);
  } else {
    const key = grantIconKey(scene, grant);
    if (key && scene.textures.exists(key)) {
      parts.push(scene.add.image(x, y, key).setDisplaySize(size, size));
    } else {
      parts.push(scene.add.rectangle(x, y, size, size, 0x2980b9, 0.5));
    }
  }

  const amount = grantStackAmount(grant);
  if (amount != null) {
    parts.push(
      scene.add.text(x + size * 0.34, y + size * 0.34, String(amount), {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('10px'),
        color: '#fff8dc',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5),
    );
  }

  return parts;
}

function layoutCellIcons(
  scene: Phaser.Scene,
  grants: RewardGrant[],
  cx: number,
  cy: number,
): Phaser.GameObjects.GameObject[] {
  const visible = grants.slice(0, MAX_CELL_ICONS);
  const iconSize = visible.length <= 2 ? 34 : visible.length <= 4 ? 26 : 22;
  const cols = visible.length <= 2 ? visible.length : visible.length <= 4 ? 2 : 3;
  const rows = Math.ceil(visible.length / cols);
  const gap = 4;
  const gridW = cols * iconSize + Math.max(0, cols - 1) * gap;
  const gridH = rows * iconSize + Math.max(0, rows - 1) * gap;
  const startX = cx - gridW / 2 + iconSize / 2;
  const startY = cy - gridH / 2 + iconSize / 2;
  const parts: Phaser.GameObjects.GameObject[] = [];

  visible.forEach((grant, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (iconSize + gap);
    const y = startY + row * (iconSize + gap);
    parts.push(...addGrantIcon(scene, grant, x, y, iconSize));
  });

  if (grants.length > MAX_CELL_ICONS) {
    parts.push(
      scene.add.text(cx + CELL_W / 2 - 22, cy + CELL_H / 2 - 16, `+${grants.length - MAX_CELL_ICONS}`, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('10px'),
        color: UI_THEME.colors.textMuted,
        fontStyle: 'bold',
      }).setOrigin(0.5),
    );
  }

  return parts;
}

export class DailyRewardModal extends ModalBase {
  private claimOverlay?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, onClose?: () => void) {
    super(scene, { title: '🎁 Quà Tặng Hàng Ngày', height: GAME_HEIGHT - 48, onClose });
    this.build();
  }

  close(): void {
    this.claimOverlay?.destroy(true);
    super.close();
  }

  private build(): void {
    const gs = GameState.getInstance();
    const mgr = gs.dailyRewardManager;
    const state = mgr.getState();
    const canClaim = mgr.canClaimToday();
    const panelTop = GAME_HEIGHT / 2 - (GAME_HEIGHT - 48) / 2;

    if (canClaim) {
      this.addText(
        GAME_WIDTH / 2,
        panelTop + 66,
        `Ấn vào ô quà hôm nay để nhận thưởng`,
        '14px',
        UI_THEME.colors.accentAlt,
      );
    } else {
      this.addText(GAME_WIDTH / 2, panelTop + 66, '✓ Hôm nay đã nhận quà', '14px', UI_THEME.colors.success);
    }

    const gridW = GRID_COLS * CELL_W;
    const startX = (GAME_WIDTH - gridW) / 2 + CELL_W / 2;

    mgr.getAllRewards().forEach((entry, i) => {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const x = startX + col * CELL_W;
      const y = panelTop + GRID_START_Y + row * (CELL_H + 6);

      const claimed = mgr.isDayClaimed(entry.day);
      const isNext = mgr.canClaimDay(entry.day);
      const bgColor = isNext ? 0x1a508b : claimed ? 0x1a3a2a : 0x0f3460;
      const strokeColor = isNext ? 0xfca311 : claimed ? 0x2ecc71 : 0x333355;

      const rect = this.scene.add.rectangle(x, y, CELL_W - 6, CELL_H, bgColor, 0.95)
        .setStrokeStyle(isNext ? 3 : 1, strokeColor);

      const iconParts = layoutCellIcons(this.scene, entry.rewards, x, y);

      if (claimed) {
        const tick = this.scene.add.text(x + CELL_W / 2 - 18, y - CELL_H / 2 + 10, '✓', {
          fontSize: clampFontSizePx('14px'),
          color: UI_THEME.colors.success,
        }).setOrigin(0.5);
        this.container.add(tick);
      }

      if (isNext) {
        rect.setInteractive({ useHandCursor: true });
        rect.on('pointerover', () => rect.setFillStyle(0x2563a8, 1));
        rect.on('pointerout', () => rect.setFillStyle(bgColor, 0.95));
        rect.on('pointerdown', () => this.onDayClick(entry.day));
      } else if (!claimed) {
        rect.setInteractive({ useHandCursor: false });
        rect.on('pointerdown', () => {
          if (entry.day > state.nextDay) {
            this.showToast('Chưa tới ngày nhận quà này.');
          } else if (entry.day === state.nextDay) {
            this.showToast('Quay lại vào ngày mai để nhận quà tiếp theo.');
          }
        });
      }

      this.container.add([rect, ...iconParts]);
    });
  }

  private onDayClick(day: number): void {
    const gs = GameState.getInstance();
    const mgr = gs.dailyRewardManager;
    const result = mgr.claimDay(day, gs.inventoryManager);

    if (!result.success) {
      this.showToast(result.message);
      return;
    }

    soundManager.playItemPickup();
    gs.persist();
    this.showClaimPopup(result.day, result.grants);
  }

  private showClaimPopup(day: number, grants: RewardGrant[]): void {
    this.claimOverlay?.destroy(true);
    const overlay = this.scene.add.container(0, 0).setDepth(UI_THEME.depth.overlay + 30);

    const dim = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65);
    const panelH = Math.min(GAME_HEIGHT - 80, 120 + grants.length * 72);
    const panel = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 440, panelH, 0x16213e, 0.98)
      .setStrokeStyle(2, 0xfca311);

    const title = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - panelH / 2 + 36, `Quà ngày ${day}`, {
      fontFamily: UI_THEME.fontFamilyTitle,
      fontSize: clampFontSizePx('22px'),
      color: UI_THEME.colors.accentAlt,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    overlay.add([dim, panel, title]);

    grants.forEach((grant, i) => {
      const y = GAME_HEIGHT / 2 - panelH / 2 + 88 + i * 72;
      const iconKey = grantIconKey(this.scene, grant);
      if (iconKey && this.scene.textures.exists(iconKey)) {
        overlay.add(
          this.scene.add.image(GAME_WIDTH / 2 - 170, y, iconKey).setDisplaySize(44, 44),
        );
      } else {
        overlay.add(
          this.scene.add.rectangle(GAME_WIDTH / 2 - 170, y, 44, 44, 0x2980b9, 0.6),
        );
      }

      overlay.add(
        this.scene.add.text(GAME_WIDTH / 2 - 130, y - 14, grantDisplayName(grant), {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('16px'),
          color: UI_THEME.colors.text,
          fontStyle: 'bold',
        }).setOrigin(0, 0.5),
      );

      overlay.add(
        this.scene.add.text(GAME_WIDTH / 2 - 130, y + 12, grantDescription(grant), {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('12px'),
          color: UI_THEME.colors.textMuted,
          wordWrap: { width: 300 },
        }).setOrigin(0, 0.5),
      );
    });

    const closeBtn = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + panelH / 2 - 28, 'Đóng', {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('16px'),
      color: UI_THEME.colors.accentAlt,
      backgroundColor: '#0f3460',
      padding: { x: 24, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      overlay.destroy(true);
      this.claimOverlay = undefined;
      this.close();
      new DailyRewardModal(this.scene);
    });

    overlay.add(closeBtn);
    dim.setInteractive();
    this.claimOverlay = overlay;
  }
}
