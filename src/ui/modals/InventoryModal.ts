import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/gameDimensions.ts';
import { STAMINA_CONSTANTS, REALM_EXP_REQUIREMENTS } from '../../constants/gameRules.ts';
import { GameState } from '../../state/gameState.ts';
import { getItemById } from '../../data/itemsData.ts';
import type { CharacterData, EquipmentSlot, ItemData, RealmLevel } from '../../types/game.ts';
import { REALM_ORDER } from '../../managers/CharacterManager.ts';
import {
  SPATIAL_RING_ITEM_ID,
  EXPANDED_INVENTORY_CAPACITY,
  CHUYEN_SINH_DAN_ITEM_ID,
  resolveChuyenSinhDanItemId,
} from '../../managers/InventoryManager.ts';
import { matchesInventoryTab, type InventoryFilter } from '../../data/inventoryTabCategories.ts';
import { UI_THEME, clampFontSizePx, REALM_LABELS, WEAPON_LABELS } from '../theme.ts';
import { UIButton } from '../UIButton.ts';
import { resolveAvatarKey, resolveItemIconKey } from '../../utils/AssetGenerator.ts';
import { createItemIcon, applyIconCircleMask, usesHubUiItemIcon } from '../../utils/iconAssets.ts';
import { createItemRarityFrame } from '../itemRarityFrame.ts';
import { AVATAR_W, AVATAR_H } from '../../utils/assetDrawCharacters.ts';
import { soundManager } from '../../utils/SoundManager.ts';

const LEFT_PANEL_W = Math.floor(GAME_WIDTH * 0.38);
const RIGHT_PANEL_X = LEFT_PANEL_W;
const RIGHT_PANEL_W = GAME_WIDTH - LEFT_PANEL_W;

const INV_LEFT_PANEL = 0x0d1228;
const INV_RIGHT_PANEL = 0x141c38;
const INV_SLOT_BG = 0x43518a;
const INV_SLOT_BORDER = 0x6b7cad;
const INV_SLOT_SELECTED = 0xeab308;
const INV_FILTER_ACTIVE = 0x3d4f8a;
const INV_FILTER_IDLE = 0x252d52;
const INV_FILTER_BORDER = 0xeab308;
const INV_EQUIP_IDLE = 0x43518a;
const INV_EQUIP_ACTIVE = 0x5a6ea8;

const TEXT_LIGHT = '#ffffff';
const TEXT_GOLD = '#eab308';
const TEXT_DESC = '#cccccc';
const TEXT_DESC_MUTED = '#9aa8c4';

const STATUS_TOAST_Y = () => GAME_HEIGHT - 148;
const STATUS_TOAST_MS = 6000;

const HUB_BTN = 0x1a508b;
const MOVE_HIGHLIGHT = 0xeab308;

const GRID_COLS = 9;
const SLOT_SIZE = 64;
const SLOT_GAP = 4;
const FILTER_GRID_GAP = 8;
const FILTER_TAB_W = 88;
const FILTER_TAB_H = 44;
const FILTER_TAB_GAP = 8;
const PARTY_TAB_W = 136;
const PARTY_TAB_H = 40;
const PARTY_TAB_GAP = 6;
const PARTY_TAB_ROW_GAP = 6;

const DRAG_THRESHOLD = 10;

function inventoryGridWidth(): number {
  return GRID_COLS * SLOT_SIZE + (GRID_COLS - 1) * SLOT_GAP;
}

/** Chiều rộng mô tả vật phẩm — không tràn mép phải màn hình. */
function inventoryDescMaxWidth(): number {
  return GAME_WIDTH - inventoryGridLeft() - 24;
}

function leftPanelCenterX(): number {
  return LEFT_PANEL_W / 2;
}

function rightPanelCenterX(): number {
  return RIGHT_PANEL_X + RIGHT_PANEL_W / 2;
}

function inventoryFilterCenterX(): number {
  const gridLeft = inventoryGridLeft();
  return gridLeft - FILTER_GRID_GAP - FILTER_TAB_W / 2;
}

function inventoryGridLeft(): number {
  const gridW = inventoryGridWidth();
  return RIGHT_PANEL_X + RIGHT_PANEL_W - 24 - gridW;
}

function formatInventoryName(name: string, maxLen = 10): string {
  const trimmed = name.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen);
}

const EQUIP_LAYOUT: { slot: EquipmentSlot; label: string; dx: number; dy: number }[] = [
  { slot: 'head', label: 'Đầu', dx: 0, dy: -168 },
  { slot: 'body', label: 'Thân', dx: -118, dy: -28 },
  { slot: 'weapon', label: 'Vũ khí', dx: 118, dy: -28 },
  { slot: 'feet', label: 'Chân', dx: -82, dy: 128 },
  { slot: 'pet', label: 'Yêu thú', dx: 82, dy: 128 },
];

const EQUIP_BTN_R = 38;
const CHAR_DISPLAY_H = 228;

type InvFilter = InventoryFilter;

const FILTER_TABS: { id: InvFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'weapon', label: 'Trang bị' },
  { id: 'shard', label: 'Mảnh' },
  { id: 'medicine', label: 'Dược' },
  { id: 'beast', label: 'Yêu thú' },
  { id: 'other', label: 'Khác' },
];

const EQUIP_SLOTS: { slot: EquipmentSlot; label: string }[] = EQUIP_LAYOUT.map(({ slot, label }) => ({
  slot,
  label,
}));

function isItemVisibleInFilter(item: ItemData | null, filter: InvFilter): boolean {
  if (!item) return true;
  return matchesInventoryTab(item, filter);
}

function gridRowsForCapacity(capacity: number): number {
  return capacity >= EXPANDED_INVENTORY_CAPACITY ? 6 : 3;
}

function formatExpNumber(n: number): string {
  return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatExpCap(n: number): string {
  if (n >= 1_000_000) return `${Math.round(n / 100_000) / 10}M`;
  if (n >= 1_000) return `${Math.round(n / 100) / 10}k`;
  return formatExpNumber(n);
}

function nextRealmExpRequirement(realm: RealmLevel): number {
  const idx = REALM_ORDER.indexOf(realm);
  if (idx < 0 || idx >= REALM_ORDER.length - 1) {
    return REALM_EXP_REQUIREMENTS.Thien;
  }
  return REALM_EXP_REQUIREMENTS[REALM_ORDER[idx + 1]!];
}

import { formatItemDisplayDescription, formatEquipmentTypeLabel } from '../../utils/equipmentDisplay.ts';

/** Giao diện túi đồ: trang bị trái, lưới vật phẩm phải (27/54 ngăn). */
export class InventoryModal {
  readonly container: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;
  private readonly onClose?: () => void;
  private readonly initFilter: InvFilter;
  private readonly initCharIndex: number;
  private selectedCharIndex = 0;
  private filter: InvFilter = 'all';
  private selectedGridIndex: number | null = null;
  private selectedItemId: string | null = null;
  private statusText!: Phaser.GameObjects.Text;
  private itemDescText!: Phaser.GameObjects.Text;
  private statsContainer!: Phaser.GameObjects.Container;
  private partyTabsContainer!: Phaser.GameObjects.Container;
  private gridContainer!: Phaser.GameObjects.Container;
  private equipContainer!: Phaser.GameObjects.Container;
  private avatarContainer!: Phaser.GameObjects.Container;
  private readonly equipSlots = new Map<
    EquipmentSlot,
    {
      circle: Phaser.GameObjects.Arc;
      label: Phaser.GameObjects.Text;
      iconWrap: Phaser.GameObjects.Container;
    }
  >();
  private dragSourceIndex: number | null = null;
  private dragItemId: string | null = null;
  private dragActive = false;
  private dragStart = { x: 0, y: 0 };
  private dragGhost: Phaser.GameObjects.Container | null = null;
  private dragTeardown: (() => void)[] = [];
  private confirmContainer: Phaser.GameObjects.Container | null = null;
  private bulkMode: 'delete' | 'use' | null = null;
  private bulkSelectedSlots = new Set<number>();
  private bulkDoneBtn: UIButton | null = null;
  private toastTimer: Phaser.Time.TimerEvent | null = null;

  constructor(
    scene: Phaser.Scene,
    onClose?: () => void,
    init?: { filter?: InvFilter; charIndex?: number },
  ) {
    this.scene = scene;
    this.onClose = onClose;
    this.initFilter = init?.filter ?? 'all';
    this.initCharIndex = init?.charIndex ?? 0;
    this.filter = this.initFilter;
    this.selectedCharIndex = this.initCharIndex;
    this.container = scene.add.container(0, 0).setDepth(UI_THEME.depth.overlay + 1);
    this.build();
  }

  close(): void {
    this.toastTimer?.remove(false);
    this.toastTimer = null;
    this.teardownDrag();
    this.confirmContainer?.destroy(true);
    this.confirmContainer = null;
    this.container.destroy(true);
    this.onClose?.();
  }

  private refresh(): void {
    this.close();
    new InventoryModal(this.scene, this.onClose, {
      filter: this.filter,
      charIndex: this.selectedCharIndex,
    });
  }

  private showToast(message: string): void {
    this.toastTimer?.remove(false);
    this.statusText.setY(STATUS_TOAST_Y());
    this.statusText.setColor(TEXT_LIGHT);
    this.statusText.setText(message);
    this.toastTimer = this.scene.time.delayedCall(STATUS_TOAST_MS, () => {
      if (this.statusText?.active) {
        this.statusText.setText('');
      }
      this.toastTimer = null;
    });
  }

  private build(): void {
    const leftBg = this.scene.add.rectangle(
      leftPanelCenterX(),
      GAME_HEIGHT / 2,
      LEFT_PANEL_W,
      GAME_HEIGHT,
      INV_LEFT_PANEL,
      1,
    );
    const rightBg = this.scene.add.rectangle(
      RIGHT_PANEL_X + RIGHT_PANEL_W / 2,
      GAME_HEIGHT / 2,
      RIGHT_PANEL_W,
      GAME_HEIGHT,
      INV_RIGHT_PANEL,
      1,
    );
    this.container.add([leftBg, rightBg]);

    const title = this.scene.add.text(rightPanelCenterX(), 36, 'Túi đồ', {
      fontFamily: UI_THEME.fontFamilyTitle,
      fontSize: '24px',
      color: TEXT_GOLD,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(title);

    const BTN_ROW2_Y = GAME_HEIGHT - 40;
    const BTN_ROW1_Y = BTN_ROW2_Y - 48;
    const CLOSE_W = 120;
    const DELETE_W = 120;
    const USE_ITEM_BTN_W = 260;
    const BULK_DELETE_W = 172;
    const BULK_USE_W = 172;
    const BULK_DONE_W = 150;
    const BTN_GAP = 16;
    const bottomRowW = CLOSE_W + BTN_GAP + DELETE_W + BTN_GAP + USE_ITEM_BTN_W;
    const bottomRowLeft = rightPanelCenterX() - bottomRowW / 2;
    const deleteCenterX = bottomRowLeft + CLOSE_W + BTN_GAP + DELETE_W / 2;
    const useCenterX = bottomRowLeft + CLOSE_W + BTN_GAP + DELETE_W + BTN_GAP + USE_ITEM_BTN_W / 2 + 50;

    const closeBtn = new UIButton(this.scene, {
      x: bottomRowLeft + CLOSE_W / 2 - 50,
      y: BTN_ROW2_Y,
      width: CLOSE_W,
      height: 40,
      label: 'Đóng',
      color: HUB_BTN,
      onClick: () => this.close(),
      addToScene: false,
    });

    const bulkDeleteBtn = new UIButton(this.scene, {
      x: deleteCenterX,
      y: BTN_ROW1_Y,
      width: BULK_DELETE_W,
      height: 40,
      label: 'Xóa hàng loạt',
      color: 0x6b1f2a,
      singleLine: true,
      onClick: () => this.toggleBulkMode('delete'),
      addToScene: false,
    });

    const deleteBtn = new UIButton(this.scene, {
      x: deleteCenterX,
      y: BTN_ROW2_Y,
      width: DELETE_W,
      height: 40,
      label: 'Xóa',
      color: 0x8b2635,
      onClick: () => this.requestDeleteSelectedItem(),
      addToScene: false,
    });

    const bulkUseBtn = new UIButton(this.scene, {
      x: useCenterX,
      y: BTN_ROW1_Y,
      width: BULK_USE_W,
      height: 40,
      label: 'Dùng hàng loạt',
      color: 0x143d6b,
      singleLine: true,
      onClick: () => this.toggleBulkMode('use'),
      addToScene: false,
    });

    const useItemBtn = new UIButton(this.scene, {
      x: useCenterX,
      y: BTN_ROW2_Y,
      width: USE_ITEM_BTN_W,
      height: 40,
      label: 'Sử dụng vật phẩm',
      color: HUB_BTN,
      singleLine: true,
      onClick: () => this.useSelectedItem(),
      addToScene: false,
    });

    this.bulkDoneBtn = new UIButton(this.scene, {
      x: bottomRowLeft + CLOSE_W / 2 - 50,
      y: BTN_ROW1_Y,
      width: BULK_DONE_W,
      height: 40,
      label: 'Đã chọn xong',
      color: 0x2e7d32,
      singleLine: true,
      onClick: () => this.onBulkDone(),
      addToScene: false,
    });
    this.bulkDoneBtn.setVisible(false);

    this.container.add([closeBtn, bulkDeleteBtn, deleteBtn, bulkUseBtn, useItemBtn, this.bulkDoneBtn]);

    this.statusText = this.scene.add.text(rightPanelCenterX(), STATUS_TOAST_Y(), '', {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('13px'),
      color: TEXT_LIGHT,
      align: 'center',
      wordWrap: { width: RIGHT_PANEL_W - 48 },
    }).setOrigin(0.5);
    this.container.add(this.statusText);

    this.statsContainer = this.scene.add.container(0, 0);
    this.partyTabsContainer = this.scene.add.container(0, 0);
    this.container.add([this.statsContainer, this.partyTabsContainer]);

    this.buildLeftPanel();
    this.buildRightPanel();
  }

  private buildLeftPanel(): void {
    const avatarCenterX = leftPanelCenterX();
    const avatarCenterY = GAME_HEIGHT * 0.52;

    this.equipContainer = this.scene.add.container(avatarCenterX, avatarCenterY);
    this.avatarContainer = this.scene.add.container(avatarCenterX, avatarCenterY);
    this.container.add([this.avatarContainer, this.equipContainer]);

    this.equipSlots.clear();
    EQUIP_LAYOUT.forEach((entry) => {
      this.addEquipButton(entry.slot, entry.dx, entry.dy, entry.label, () => {
        this.onEquipSlotClick(entry.slot);
      });
    });

    this.renderCharacterStats();
    this.renderCharacterAvatar();
    this.renderEquipHighlights();
    this.renderPartyTabs();
  }

  private renderPartyTabs(): void {
    this.partyTabsContainer.removeAll(true);

    const party = GameState.getInstance().characterManager.getParty();
    const tabCenterX = leftPanelCenterX();
    const row2Y = GAME_HEIGHT - 108;
    const row1Y = row2Y - PARTY_TAB_H - PARTY_TAB_ROW_GAP;

    const placePartyRow = (indices: number[], rowY: number) => {
      const totalW = indices.length * PARTY_TAB_W + (indices.length - 1) * PARTY_TAB_GAP;
      let tabX = tabCenterX - totalW / 2 + PARTY_TAB_W / 2;
      for (const i of indices) {
        const char = party[i];
        const label = char ? formatInventoryName(char.name) : '—';
        this.addTabButton(tabX, rowY, PARTY_TAB_W, PARTY_TAB_H, label, () => {
          if (!char) return;
          this.selectedCharIndex = i;
          this.renderCharacterStats();
          this.renderCharacterAvatar();
          this.renderEquipHighlights();
          this.renderPartyTabs();
        }, i === this.selectedCharIndex && !!char, true, this.partyTabsContainer);
        tabX += PARTY_TAB_W + PARTY_TAB_GAP;
      }
    };

    placePartyRow([0, 1, 2], row1Y);
    placePartyRow([3, 4], row2Y);
  }

  private renderCharacterStats(): void {
    this.statsContainer.removeAll(true);
    const char = this.getSelectedCharacter();
    const statsY = 52;
    const colW = LEFT_PANEL_W / 4;

    const labels = ['Công', 'Thủ', 'Máu', 'Nguyên khí'];
    const values = char
      ? (() => {
        const s = GameState.getInstance().characterManager.getComputedStats(char.id, getItemById);
        if (!s) return ['—', '—', '—', '—'];
        return [
          String(s.totalAtk),
          String(s.totalDef),
          String(s.maxHp),
          String(s.maxQi),
        ];
      })()
      : ['—', '—', '—', '—'];

    labels.forEach((label, i) => {
      const x = colW * (i + 0.5);
      this.statsContainer.add(
        this.scene.add.text(x, statsY, label, {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('14px'),
          color: TEXT_GOLD,
          fontStyle: 'bold',
        }).setOrigin(0.5),
      );
      this.statsContainer.add(
        this.scene.add.text(x, statsY + 24, values[i] ?? '—', {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('16px'),
          color: TEXT_LIGHT,
          fontStyle: 'bold',
        }).setOrigin(0.5),
      );
    });

    const expY = statsY + 52;
    const metaX = colW * 0.5 - 22;
    const metaStyle = {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('12px'),
      color: TEXT_LIGHT,
      wordWrap: { width: LEFT_PANEL_W - metaX - 8 },
    } as const;

    if (char) {
      const cap = nextRealmExpRequirement(char.realm);
      const realmLabel = REALM_LABELS[char.realm] ?? char.realm;
      const expLine = `Kinh nghiệm: ${formatExpNumber(char.exp)} / ${formatExpCap(cap)} - ${realmLabel}`;
      this.statsContainer.add(
        this.scene.add.text(metaX, expY, expLine, metaStyle).setOrigin(0, 0),
      );
      const weaponLabel = WEAPON_LABELS[char.weaponType] ?? char.weaponType;
      this.statsContainer.add(
        this.scene.add.text(metaX, expY + 30, `Vũ khí: ${weaponLabel}`, metaStyle).setOrigin(0, 0),
      );
    } else {
      this.statsContainer.add(
        this.scene.add.text(metaX, expY, 'Kinh nghiệm: —', metaStyle).setOrigin(0, 0),
      );
      this.statsContainer.add(
        this.scene.add.text(metaX, expY + 30, 'Vũ khí: —', metaStyle).setOrigin(0, 0),
      );
    }
  }

  private addEquipButton(
    slot: EquipmentSlot,
    dx: number,
    dy: number,
    label: string,
    onClick: () => void,
  ): void {
    const circle = this.scene.add.circle(0, 0, EQUIP_BTN_R, INV_EQUIP_IDLE, 1)
      .setStrokeStyle(2, INV_SLOT_BORDER, 0.65)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add.text(0, 0, label, {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('13px'),
      color: TEXT_LIGHT,
      align: 'center',
      wordWrap: { width: EQUIP_BTN_R * 2 - 8 },
    }).setOrigin(0.5);
    const iconWrap = this.scene.add.container(0, 0);

    const slotContainer = this.scene.add.container(dx, dy);
    slotContainer.add([circle, iconWrap, text]);
    circle.on('pointerdown', onClick);
    this.equipContainer.add(slotContainer);

    this.equipSlots.set(slot, { circle, label: text, iconWrap });
  }

  private refreshEquipSlotDisplay(slot: EquipmentSlot, fallbackLabel: string): void {
    const view = this.equipSlots.get(slot);
    if (!view) return;

    view.iconWrap.removeAll(true);
    const char = this.getSelectedCharacter();
    const itemId = char?.equipment[slot];
    const item = itemId ? getItemById(itemId) : undefined;

    if (item) {
      view.label.setVisible(false);
      const iconSize = Math.floor(EQUIP_BTN_R * 1.45);
      if (item.rarity && (item.type === 'equipment' || item.type === 'beast')) {
        view.iconWrap.add(createItemRarityFrame(this.scene, 0, 0, iconSize + 6, item.rarity));
      }
      const itemIcon = createItemIcon(this.scene, 0, 0, item, iconSize);
      if (itemIcon) {
        if (usesHubUiItemIcon(item.id)) {
          view.iconWrap.add(itemIcon);
        } else {
          const maskGfx = applyIconCircleMask(this.scene, itemIcon, 0, 0, iconSize * 0.45);
          maskGfx.setVisible(false);
          view.iconWrap.add([itemIcon, maskGfx]);
        }
      } else {
        const iconKey = resolveItemIconKey(item.id);
        if (iconKey && this.scene.textures.exists(iconKey)) {
          view.iconWrap.add(
            this.scene.add.image(0, 0, iconKey).setDisplaySize(iconSize, iconSize),
          );
        } else {
          view.label.setText(formatInventoryName(item.name, 6));
          view.label.setVisible(true);
        }
      }
    } else {
      view.label.setText(fallbackLabel);
      view.label.setVisible(true);
    }
  }

  private buildRightPanel(): void {
    const filterX = inventoryFilterCenterX();
    const filterStartY = 80 + FILTER_TAB_H / 2;
    FILTER_TABS.forEach((tab, i) => {
      const y = filterStartY + i * (FILTER_TAB_H + FILTER_TAB_GAP);
      this.addTabButton(filterX, y, FILTER_TAB_W, FILTER_TAB_H, tab.label, () => {
        if (this.filter === tab.id) return;
        this.filter = tab.id;
        this.teardownDrag();
        if (this.selectedItemId) {
          const selected = getItemById(this.selectedItemId);
          if (selected && !matchesInventoryTab(selected, this.filter)) {
            this.clearGridSelection();
          }
        }
        this.refresh();
      }, this.filter === tab.id, true);
    });

    this.gridContainer = this.scene.add.container(0, 0);
    this.container.add(this.gridContainer);

    const capacity = GameState.getInstance().inventoryManager.getCapacity();
    const rows = gridRowsForCapacity(capacity);
    const gridTop = 72;
    const descY = gridTop + rows * (SLOT_SIZE + SLOT_GAP) + 20;

    this.itemDescText = this.scene.add.text(
      inventoryGridLeft(),
      descY,
      'Chọn vật phẩm để xem thông tin.',
      {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('15px'),
        color: TEXT_DESC_MUTED,
        wordWrap: { width: inventoryDescMaxWidth() },
        lineSpacing: 4,
      },
    ).setOrigin(0, 0);
    this.container.add(this.itemDescText);

    this.renderGrid();
  }

  private addTabButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    onClick: () => void,
    active = false,
    darkTheme = false,
    parent: Phaser.GameObjects.Container = this.container,
  ): void {
    const idle = darkTheme ? INV_FILTER_IDLE : 0xe2e6f0;
    const activeFill = darkTheme ? INV_FILTER_ACTIVE : 0xffffff;
    const textColor = darkTheme ? (active ? TEXT_GOLD : TEXT_LIGHT) : (active ? TEXT_GOLD : TEXT_DESC);
    const bg = this.scene.add.rectangle(x, y, w, h, active ? activeFill : idle, 1)
      .setInteractive({ useHandCursor: true });
    if (active) {
      bg.setStrokeStyle(2, INV_FILTER_BORDER, 0.95);
    } else {
      bg.setStrokeStyle(1, darkTheme ? INV_SLOT_BORDER : 0xc5cad8, 0.55);
    }
    const text = this.scene.add.text(x, y, label, {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('14px'),
      color: textColor,
      align: 'center',
      wordWrap: { width: w - 8 },
    }).setOrigin(0.5);
    bg.on('pointerdown', onClick);
    parent.add([bg, text]);
  }

  private getSelectedCharacter(): CharacterData | null {
    const party = GameState.getInstance().characterManager.getParty();
    return party[this.selectedCharIndex] ?? null;
  }

  private renderCharacterAvatar(): void {
    this.avatarContainer.removeAll(true);
    const char = this.getSelectedCharacter();
    if (!char) {
      this.avatarContainer.add(
        this.scene.add.text(0, 0, 'Chưa có\nnhân vật', {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('14px'),
          color: TEXT_LIGHT,
          align: 'center',
        }).setOrigin(0.5),
      );
      return;
    }

    const glow = this.scene.add.ellipse(0, CHAR_DISPLAY_H / 2 - 8, 160, 36, INV_EQUIP_IDLE, 0.25);
    this.avatarContainer.add(glow);

    const avatarKey = resolveAvatarKey(char.id, char.gender, char.weaponType, char.appearanceId);
    if (this.scene.textures.exists(avatarKey)) {
      const img = this.scene.add.image(0, -8, avatarKey);
      const tex = this.scene.textures.get(avatarKey);
      const src = tex.getSourceImage() as { width?: number; height?: number };
      const aspect = (src.width ?? AVATAR_W) / (src.height ?? AVATAR_H);
      const h = avatarKey.startsWith('char_') ? CHAR_DISPLAY_H : AVATAR_H * 2;
      img.setDisplaySize(h * aspect, h);
      this.avatarContainer.add(img);
    } else {
      this.avatarContainer.add(
        this.scene.add.rectangle(0, 0, AVATAR_W * 1.6, AVATAR_H * 2, 0x2980b9, 0.5),
      );
    }
  }

  private renderEquipHighlights(): void {
    const char = this.getSelectedCharacter();
    for (const entry of EQUIP_LAYOUT) {
      const view = this.equipSlots.get(entry.slot);
      if (!view) continue;
      const equipped = Boolean(char?.equipment[entry.slot]);
      view.circle.setFillStyle(equipped ? INV_EQUIP_ACTIVE : INV_EQUIP_IDLE, 1);
      view.circle.setStrokeStyle(
        2,
        equipped ? INV_FILTER_BORDER : INV_SLOT_BORDER,
        equipped ? 0.85 : 0.55,
      );
      this.refreshEquipSlotDisplay(entry.slot, entry.label);
    }
  }

  private updateItemDescription(item: ItemData | null): void {
    if (!item) {
      this.itemDescText.setText('Chọn vật phẩm để xem thông tin.');
      this.itemDescText.setColor(TEXT_DESC_MUTED);
      return;
    }

    const effect = formatItemDisplayDescription(item);
    if (item.type === 'equipment' && item.slot === 'weapon') {
      const typeLabel = formatEquipmentTypeLabel(item);
      this.itemDescText.setText(`${item.name}: Loại vũ khí: ${typeLabel}. ${effect}`);
    } else {
      this.itemDescText.setText(`${item.name}: ${effect}`);
    }
    this.itemDescText.setColor(TEXT_DESC);
  }

  private selectGridItem(slotIndex: number, itemId: string): void {
    this.selectedGridIndex = slotIndex;
    this.selectedItemId = itemId;
    this.updateItemDescription(getItemById(itemId) ?? null);
    this.renderGrid();
  }

  private clearGridSelection(): void {
    this.selectedGridIndex = null;
    this.selectedItemId = null;
    this.updateItemDescription(null);
  }

  private renderGrid(): void {
    this.gridContainer.removeAll(true);

    const gs = GameState.getInstance();
    const capacity = gs.inventoryManager.getCapacity();
    const rows = gridRowsForCapacity(capacity);
    const gridX = inventoryGridLeft();
    const gridY = 72;
    const gridSlots = gs.inventoryManager.getGridSlots();

    for (let i = 0; i < capacity; i++) {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      if (row >= rows) break;

      const x = gridX + col * (SLOT_SIZE + SLOT_GAP) + SLOT_SIZE / 2;
      const y = gridY + row * (SLOT_SIZE + SLOT_GAP) + SLOT_SIZE / 2;

      const slot = gridSlots[i] ?? null;
      const rawItem = slot ? (getItemById(slot.itemId) ?? null) : null;
      const visible = isItemVisibleInFilter(rawItem, this.filter);
      const item = visible ? rawItem : null;
      const isDragSource = this.dragActive && this.dragSourceIndex === i;
      const isBulkSelected = this.bulkSelectedSlots.has(i);
      const isSelected = this.selectedGridIndex === i || isBulkSelected;

      const slotFill = isDragSource ? MOVE_HIGHLIGHT : INV_SLOT_BG;
      const slotAlpha = 1;

      const cell = this.scene.add.rectangle(x, y, SLOT_SIZE, SLOT_SIZE, slotFill, slotAlpha);
      cell.setStrokeStyle(
        isSelected || isDragSource ? 2 : 1,
        isSelected || isDragSource ? INV_SLOT_SELECTED : INV_SLOT_BORDER,
        isSelected || isDragSource ? 1 : 0.65,
      );
      this.gridContainer.add(cell);

      if (slot && item) {
        const iconSize = SLOT_SIZE - 10;
        const iconWrap = this.scene.add.container(x, y);

        if (item.rarity && (item.type === 'equipment' || item.type === 'beast')) {
          const frame = createItemRarityFrame(this.scene, 0, 0, SLOT_SIZE - 4, item.rarity);
          iconWrap.add(frame);
        }

        const itemIcon = createItemIcon(this.scene, 0, 0, item, iconSize);
        if (itemIcon) {
          if (usesHubUiItemIcon(item.id)) {
            iconWrap.add(itemIcon);
          } else {
            const maskGfx = applyIconCircleMask(this.scene, itemIcon, 0, 0, iconSize * 0.45);
            maskGfx.setVisible(false);
            iconWrap.add([itemIcon, maskGfx]);
          }
        } else {
          const iconKey = resolveItemIconKey(slot.itemId);
          if (iconKey && this.scene.textures.exists(iconKey)) {
            const icon = this.scene.add.image(0, 0, iconKey).setDisplaySize(iconSize, iconSize);
            iconWrap.add(icon);
          }
        }
        this.gridContainer.add(iconWrap);
        if (slot.quantity > 1) {
          const qty = this.scene.add.text(x + SLOT_SIZE / 2 - 4, y + SLOT_SIZE / 2 - 4, `${slot.quantity}`, {
            fontFamily: UI_THEME.fontFamily,
            fontSize: clampFontSizePx('10px'),
            color: '#fff',
            backgroundColor: '#000000aa',
            padding: { x: 2, y: 1 },
          }).setOrigin(1, 1);
          this.gridContainer.add(qty);
        }
      }

      const hit = this.scene.add.zone(x, y, SLOT_SIZE, SLOT_SIZE).setInteractive({ useHandCursor: true });
      this.bindSlotPointer(hit, i, slot, rawItem, visible);
      this.gridContainer.add(hit);
    }
  }

  private bindSlotPointer(
    zone: Phaser.GameObjects.Zone,
    slotIndex: number,
    slot: { itemId: string; quantity: number } | null,
    item: ItemData | null,
    matchesFilterTab: boolean,
  ): void {
    zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      if (!slot || !item || !matchesFilterTab) return;
      if (this.bulkMode) {
        soundManager.playUiClick();
        this.toggleBulkSlot(slotIndex);
        return;
      }
      if (slot && item && matchesFilterTab) {
        this.beginItemDrag(slotIndex, slot.itemId, pointer);
      }
    });

    zone.on('pointerup', () => {
      if (this.bulkMode || this.dragSourceIndex !== null) return;
      if (!slot || !item) {
        this.clearGridSelection();
        this.renderGrid();
      }
    });
  }

  private slotIndexAtPointer(px: number, py: number): number | null {
    const gs = GameState.getInstance();
    const capacity = gs.inventoryManager.getCapacity();
    const rows = gridRowsForCapacity(capacity);
    const gridX = inventoryGridLeft();
    const gridY = 72;

    for (let i = 0; i < capacity; i++) {
      const row = Math.floor(i / GRID_COLS);
      if (row >= rows) break;
      const col = i % GRID_COLS;
      const left = gridX + col * (SLOT_SIZE + SLOT_GAP);
      const top = gridY + row * (SLOT_SIZE + SLOT_GAP);
      if (px >= left && px < left + SLOT_SIZE && py >= top && py < top + SLOT_SIZE) {
        return i;
      }
    }
    return null;
  }

  private beginItemDrag(
    slotIndex: number,
    itemId: string,
    pointer: Phaser.Input.Pointer,
  ): void {
    this.teardownDrag();
    this.dragSourceIndex = slotIndex;
    this.dragItemId = itemId;
    this.dragStart = { x: pointer.x, y: pointer.y };
    this.dragActive = false;

    const onMove = (p: Phaser.Input.Pointer) => this.onDragMove(p);
    const onUp = (p: Phaser.Input.Pointer) => this.endItemDrag(p);

    this.scene.input.on('pointermove', onMove);
    this.scene.input.on('pointerup', onUp);
    this.dragTeardown.push(
      () => this.scene.input.off('pointermove', onMove),
      () => this.scene.input.off('pointerup', onUp),
    );
  }

  private onDragMove(pointer: Phaser.Input.Pointer): void {
    if (this.dragSourceIndex === null || !pointer.isDown) return;

    const dx = pointer.x - this.dragStart.x;
    const dy = pointer.y - this.dragStart.y;
    if (!this.dragActive) {
      if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
      const item = getItemById(this.dragItemId ?? '');
      if (!item) return;
      this.dragActive = true;
      this.createDragGhost(item, this.dragItemId!, pointer.x, pointer.y);
      this.renderGrid();
    }

    this.dragGhost?.setPosition(pointer.x, pointer.y);
  }

  private endItemDrag(pointer: Phaser.Input.Pointer): void {
    const src = this.dragSourceIndex;
    if (src === null) return;

    if (this.dragActive) {
      const dest = this.slotIndexAtPointer(pointer.x, pointer.y);
      if (dest !== null && dest !== src) {
        const gs = GameState.getInstance();
        if (gs.inventoryManager.swapGridSlots(src, dest)) {
          gs.persist();
          if (this.selectedGridIndex === src) {
            this.selectedGridIndex = dest;
          } else if (this.selectedGridIndex === dest) {
            this.selectedGridIndex = src;
          }
        }
      }
    } else {
      const item = getItemById(this.dragItemId ?? '');
      if (item && matchesInventoryTab(item, this.filter)) {
        this.selectGridItem(src, this.dragItemId!);
      }
    }

    this.teardownDrag();
    this.renderGrid();
  }

  private createDragGhost(item: ItemData, itemId: string, x: number, y: number): void {
    this.destroyDragGhost();
    const iconSize = SLOT_SIZE - 10;
    const ghost = this.scene.add.container(x, y).setDepth(UI_THEME.depth.overlay + 2);
    ghost.setAlpha(0.88);

    if (item.rarity && (item.type === 'equipment' || item.type === 'beast')) {
      ghost.add(createItemRarityFrame(this.scene, 0, 0, SLOT_SIZE - 4, item.rarity));
    }

    const itemIcon = createItemIcon(this.scene, 0, 0, item, iconSize);
    if (itemIcon) {
      if (usesHubUiItemIcon(item.id)) {
        ghost.add(itemIcon);
      } else {
        const maskGfx = applyIconCircleMask(this.scene, itemIcon, 0, 0, iconSize * 0.45);
        maskGfx.setVisible(false);
        ghost.add([itemIcon, maskGfx]);
      }
    } else {
      const iconKey = resolveItemIconKey(itemId);
      if (iconKey && this.scene.textures.exists(iconKey)) {
        ghost.add(this.scene.add.image(0, 0, iconKey).setDisplaySize(iconSize, iconSize));
      }
    }

    this.dragGhost = ghost;
    this.container.add(ghost);
  }

  private destroyDragGhost(): void {
    this.dragGhost?.destroy(true);
    this.dragGhost = null;
  }

  private teardownDrag(): void {
    for (const off of this.dragTeardown) off();
    this.dragTeardown = [];
    this.destroyDragGhost();
    this.dragSourceIndex = null;
    this.dragItemId = null;
    this.dragActive = false;
  }

  private toggleBulkMode(mode: 'delete' | 'use'): void {
    if (this.bulkMode === mode) {
      this.exitBulkMode();
      return;
    }
    this.teardownDrag();
    this.bulkMode = mode;
    this.bulkSelectedSlots.clear();
    this.clearGridSelection();
    this.bulkDoneBtn?.setVisible(true);
    this.renderGrid();
  }

  private exitBulkMode(): void {
    this.bulkMode = null;
    this.bulkSelectedSlots.clear();
    this.bulkDoneBtn?.setVisible(false);
    this.renderGrid();
  }

  private toggleBulkSlot(slotIndex: number): void {
    const gs = GameState.getInstance();
    const slots = gs.inventoryManager.getGridSlots();
    const slot = slots[slotIndex];
    if (!slot) return;
    const item = getItemById(slot.itemId);
    if (!item || !matchesInventoryTab(item, this.filter)) return;

    if (this.bulkSelectedSlots.has(slotIndex)) {
      this.bulkSelectedSlots.delete(slotIndex);
    } else {
      this.bulkSelectedSlots.add(slotIndex);
    }
    this.updateItemDescription(item);
    this.renderGrid();
  }

  private onBulkDone(): void {
    if (this.bulkSelectedSlots.size === 0) {
      this.showToast('Chọn ít nhất một vật phẩm.');
      return;
    }
    soundManager.playUiClick();
    if (this.bulkMode === 'delete') {
      this.requestBulkDelete();
      return;
    }
    if (this.bulkMode === 'use') {
      this.applyBulkUse();
    }
  }

  private requestBulkDelete(): void {
    const count = this.bulkSelectedSlots.size;
    this.showConfirmDialog(
      `Bạn có muốn xóa ${count} vật phẩm đã chọn không?`,
      () => this.confirmBulkDelete(),
      () => {},
    );
  }

  private confirmBulkDelete(): void {
    const gs = GameState.getInstance();
    const indices = [...this.bulkSelectedSlots].sort((a, b) => b - a);
    let deleted = 0;

    for (const index of indices) {
      if (gs.inventoryManager.removeGridSlotStack(index)) {
        deleted += 1;
      }
    }

    gs.persist();
    this.teardownDrag();
    this.exitBulkMode();
    this.clearGridSelection();
    this.renderGrid();
    this.showToast(deleted > 0 ? `Đã xóa ${deleted} vật phẩm.` : 'Không thể xóa vật phẩm.');
  }

  private applyBulkUse(): void {
    const gs = GameState.getInstance();
    const indices = [...this.bulkSelectedSlots].sort((a, b) => a - b);
    let ok = 0;
    let fail = 0;

    for (const index of indices) {
      const slot = gs.inventoryManager.getGridSlot(index);
      if (!slot) continue;
      const result = this.useItemById(slot.itemId, true);
      if (result.success) ok += 1;
      else fail += 1;
    }

    gs.syncPartyVitals();
    gs.persist();
    this.teardownDrag();
    this.exitBulkMode();
    this.clearGridSelection();
    this.renderCharacterStats();
    this.renderEquipHighlights();
    this.renderGrid();

    if (fail === 0) {
      this.showToast(`Đã dùng ${ok} vật phẩm.`);
    } else if (ok === 0) {
      this.showToast(`Không thể dùng ${fail} vật phẩm đã chọn.`);
    } else {
      this.showToast(`Dùng thành công ${ok}, thất bại ${fail}.`);
    }
  }

  private useSelectedItem(): void {
    if (!this.selectedItemId) {
      this.showToast('Chọn vật phẩm trước.');
      return;
    }

    const itemId = this.selectedItemId;
    if (itemId === CHUYEN_SINH_DAN_ITEM_ID || itemId === 'med_chuyenSinhDan') {
      const gs = GameState.getInstance();
      const consumeId = resolveChuyenSinhDanItemId(gs.inventoryManager);
      if (!consumeId) {
        this.showToast('Không có Chuyển sinh đan.');
        return;
      }
      const item = getItemById(consumeId);
      this.showConfirmDialog(
        `Xác nhận dùng Chuyển sinh đan\n\n${item?.description ?? 'Chuyển sinh đan.'}\n\nHành động này không thể hoàn tác.`,
        () => this.applyUseItem(itemId),
        () => {},
      );
      return;
    }

    this.applyUseItem(itemId);
  }

  private applyUseItem(itemId: string): void {
    const result = this.useItemById(itemId);
    this.showToast(result.message);
    if (result.success && result.fullRefresh) {
      this.refresh();
      return;
    }
    if (result.success) {
      this.renderCharacterStats();
      this.renderEquipHighlights();
      this.renderGrid();
    }
  }

  private requestDeleteSelectedItem(): void {
    if (!this.selectedItemId || this.selectedGridIndex === null) {
      this.showToast('Chọn vật phẩm trước.');
      return;
    }

    const item = getItemById(this.selectedItemId);
    if (!item) {
      this.showToast('Không tìm thấy vật phẩm.');
      return;
    }

    soundManager.playUiClick();
    this.showConfirmDialog(
      `Bạn có muốn xóa ${item.name} không?`,
      () => this.confirmDeleteSelectedItem(),
      () => {},
    );
  }

  private confirmDeleteSelectedItem(): void {
    if (!this.selectedItemId || this.selectedGridIndex === null) return;

    const gs = GameState.getInstance();
    const slots = gs.inventoryManager.getGridSlots();
    const slot = slots[this.selectedGridIndex];
    if (!slot || slot.itemId !== this.selectedItemId) {
      this.showToast('Vật phẩm không còn trong túi.');
      this.clearGridSelection();
      this.renderGrid();
      return;
    }

    const item = getItemById(this.selectedItemId);
    const qty = slot.quantity;
    if (!gs.inventoryManager.removeItem(this.selectedItemId, qty)) {
      this.showToast('Không thể xóa vật phẩm.');
      return;
    }

    gs.persist();
    this.teardownDrag();
    this.clearGridSelection();
    this.renderGrid();
    this.showToast(`Đã xóa ${item?.name ?? 'vật phẩm'}.`);
  }

  private showConfirmDialog(message: string, onYes: () => void, onNo: () => void): void {
    this.confirmContainer?.destroy(true);

    const overlay = this.scene.add.container(0, 0).setDepth(UI_THEME.depth.overlay + 3);
    const dim = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55);
    const panel = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 520, 200, 0x16213e, 1);
    panel.setStrokeStyle(2, 0xfca311, 1);

    const messageText = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 36, message, {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('17px'),
      color: UI_THEME.colors.text,
      align: 'center',
      wordWrap: { width: 460 },
    }).setOrigin(0.5);

    const yesBtn = new UIButton(this.scene, {
      x: GAME_WIDTH / 2 - 100,
      y: GAME_HEIGHT / 2 + 44,
      width: 140,
      height: 44,
      label: 'Có',
      onClick: () => {
        overlay.destroy(true);
        this.confirmContainer = null;
        soundManager.playUiClick();
        onYes();
      },
      addToScene: false,
    });

    const noBtn = new UIButton(this.scene, {
      x: GAME_WIDTH / 2 + 100,
      y: GAME_HEIGHT / 2 + 44,
      width: 140,
      height: 44,
      label: 'Không',
      onClick: () => {
        overlay.destroy(true);
        this.confirmContainer = null;
        soundManager.playUiClick();
        onNo();
      },
      addToScene: false,
    });

    overlay.add([dim, panel, messageText, yesBtn, noBtn]);
    this.confirmContainer = overlay;
    this.container.add(overlay);
  }

  private onEquipSlotClick(slot: EquipmentSlot): void {
    const gs = GameState.getInstance();
    const char = this.getSelectedCharacter();
    if (!char) {
      this.showToast('Chọn nhân vật trước.');
      return;
    }

    const itemId = char.equipment[slot];
    if (!itemId) {
      this.showToast(`Ô ${EQUIP_SLOTS.find((e) => e.slot === slot)?.label ?? slot} đang trống.`);
      return;
    }

    if (gs.inventoryManager.unequipItem(char, slot)) {
      gs.syncPartyVitals();
      gs.persist();
      this.showToast(`Đã tháo ${getItemById(itemId)?.name ?? 'trang bị'}.`);
      this.renderCharacterStats();
      this.renderEquipHighlights();
      this.renderGrid();
    } else {
      this.showToast('Túi đầy — không thể tháo trang bị.');
    }
  }

  private useItemById(
    itemId: string,
    _silent = false,
  ): { success: boolean; message: string; fullRefresh?: boolean } {
    const gs = GameState.getInstance();
    const item = getItemById(itemId);
    if (!item) {
      return { success: false, message: 'Không tìm thấy vật phẩm.' };
    }

    if (itemId === SPATIAL_RING_ITEM_ID) {
      const result = gs.inventoryManager.useSpatialRing();
      if (result.success) {
        gs.persist();
      }
      return { success: result.success, message: result.message, fullRefresh: result.success };
    }

    if (itemId === 'item_hoiThe') {
      if (gs.inventoryManager.getItemQuantity(itemId) <= 0) {
        return { success: false, message: 'Không có vật phẩm trong túi.' };
      }
      if (!gs.inventoryManager.removeItem(itemId, 1)) {
        return { success: false, message: 'Không thể dùng vật phẩm.' };
      }
      const restored = STAMINA_CONSTANTS.HOI_THE_RESTORE_AMOUNT;
      gs.staminaManager.addStamina(restored);
      gs.persist();
      return { success: true, message: `Hồi ${restored} điểm thể lực.` };
    }

    if (itemId === CHUYEN_SINH_DAN_ITEM_ID || itemId === 'med_chuyenSinhDan') {
      const mc = gs.characterManager.getMainCharacter();
      if (!mc) {
        return { success: false, message: 'Chưa có nhân vật chính.' };
      }
      const consumeId = resolveChuyenSinhDanItemId(gs.inventoryManager);
      if (!consumeId) {
        return { success: false, message: 'Không có Chuyển sinh đan.' };
      }
      if (!gs.inventoryManager.removeItem(consumeId, 1)) {
        return { success: false, message: 'Không thể dùng Chuyển sinh đan.' };
      }
      const result = gs.applyReincarnation(mc.id);
      if (result.success) {
        return { success: true, message: result.message, fullRefresh: true };
      }
      gs.inventoryManager.addItem(consumeId, 1);
      return { success: false, message: result.message };
    }

    if (itemId === 'item_pheVo') {
      const char = this.getSelectedCharacter();
      if (!char) {
        return { success: false, message: 'Chọn nhân vật để dùng Phế võ.' };
      }
      if (gs.inventoryManager.getItemQuantity(itemId) <= 0) {
        return { success: false, message: 'Không có Phế võ.' };
      }
      if (!gs.inventoryManager.removeItem(itemId, 1)) {
        return { success: false, message: 'Không thể dùng Phế võ.' };
      }
      const result = gs.characterManager.resetSkills(char.id);
      if (result.success) {
        gs.persist();
        return { success: true, message: result.message };
      }
      gs.inventoryManager.addItem(itemId, 1);
      return { success: false, message: result.message };
    }

    if (itemId === 'item_thienQuy' || itemId === 'item_thatSinhThatTuDo') {
      return { success: false, message: `${item.name} — dùng tại giao diện Tu Luyện.` };
    }

    const char = this.getSelectedCharacter();
    if (!char) {
      return { success: false, message: `${item.name} — chọn nhân vật để trang bị/dùng.` };
    }

    if (item.type === 'equipment' || item.type === 'beast') {
      if (gs.inventoryManager.equipItem(char, itemId)) {
        gs.syncPartyVitals();
        gs.persist();
        return { success: true, message: `Đã trang bị ${item.name}.` };
      }
      return { success: false, message: `Không thể trang bị ${item.name}.` };
    }

    if (item.type === 'medicine') {
      const result = gs.inventoryManager.useMedicine(itemId, gs.characterManager, char.id);
      if (result.success) {
        gs.syncPartyVitals();
        gs.persist();
      }
      return { success: result.success, message: result.message };
    }

    return { success: false, message: item.description || item.name };
  }
}
