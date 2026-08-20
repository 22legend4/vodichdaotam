import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/gameDimensions.ts';
import { GameState } from '../../state/gameState.ts';
import { getItemById } from '../../data/itemsData.ts';
import { SHOP_ITEM_IDS } from '../../data/shopData.ts';
import type { ItemData } from '../../types/game.ts';
import { ModalBase } from './ModalBase.ts';
import { UI_THEME, clampFontSizePx } from '../theme.ts';
import { UIButton } from '../UIButton.ts';
import { soundManager } from '../../utils/SoundManager.ts';
import { resolveItemIconKey } from '../../utils/AssetGenerator.ts';
import { createItemIcon, applyIconCircleMask, usesHubUiItemIcon, createCurrencyUiIcon } from '../../utils/iconAssets.ts';
import { createItemRarityFrame } from '../itemRarityFrame.ts';
import { matchesInventoryTab, type InventoryFilter } from '../../data/inventoryTabCategories.ts';
import { formatItemDisplayDescription, formatEquipmentTypeLabel } from '../../utils/equipmentDisplay.ts';

/** Panel trái giảm 10% so với 34% màn hình. */
const LEFT_PANEL_W = Math.floor(GAME_WIDTH * 0.34 * 0.9);
const GRID_AREA_X = LEFT_PANEL_W;
const GRID_AREA_W = GAME_WIDTH - LEFT_PANEL_W;

const PANEL_LEFT = 0x0d1228;
const PANEL_RIGHT = 0x141c38;
const SLOT_BG = 0x43518a;
const SLOT_BORDER = 0x6b7cad;
const SLOT_SELECTED = 0xeab308;
const FILTER_IDLE = 0x252d52;
const FILTER_ACTIVE = 0x3d4f8a;
const FILTER_BORDER = 0xeab308;

const SHOP_TABS: { id: InventoryFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'weapon', label: 'Trang bị' },
  { id: 'medicine', label: 'Dược' },
  { id: 'beast', label: 'Yêu thú' },
  { id: 'other', label: 'Khác' },
];

const TITLE_Y = 32;
const TAB_ROW_Y = 118;
const TAB_H = 36;
const TAB_GAP = 8;
const GRID_AREA_BOTTOM = GAME_HEIGHT - 88;

const SLOT_SIZE = Math.round(81 * 1.8);
const SLOT_GAP = 20;
const NAME_ROW_H = 34;
const NAME_GAP = 4;
const PRICE_ROW_H = 24;
const PRICE_GAP = 4;
const CELL_H = SLOT_SIZE + NAME_GAP + NAME_ROW_H + PRICE_GAP + PRICE_ROW_H;

const TEXT_GOLD = '#eab308';
const TEXT_DESC = '#cccccc';
const TEXT_MUTED = '#9aa8c4';

function leftPanelCenterX(): number {
  return LEFT_PANEL_W / 2;
}

function computeGridLayout(
  itemCount: number,
  gridAreaTop: number,
  gridAreaBottom: number,
): {
  cols: number;
  gridLeft: number;
  gridTop: number;
  gridContentH: number;
} {
  const cols = Math.max(1, Math.min(
    itemCount,
    Math.floor((GRID_AREA_W + SLOT_GAP) / (SLOT_SIZE + SLOT_GAP)),
  ));
  const gridW = cols * SLOT_SIZE + (cols - 1) * SLOT_GAP;
  const gridLeft = GRID_AREA_X + (GRID_AREA_W - gridW) / 2;
  const rows = Math.ceil(itemCount / cols);
  const gridContentH = rows * CELL_H + Math.max(0, rows - 1) * SLOT_GAP;
  const areaH = gridAreaBottom - gridAreaTop;
  const gridTop = gridContentH <= areaH
    ? gridAreaTop + (areaH - gridContentH) / 2
    : gridAreaTop;
  return { cols, gridLeft, gridTop, gridContentH };
}

function getAllShopItems(): { itemId: string; item: ItemData }[] {
  const rows: { itemId: string; item: ItemData }[] = [];
  for (const itemId of SHOP_ITEM_IDS) {
    const item = getItemById(itemId);
    if (!item || item.value <= 0) continue;
    if (item.priceType === 'gioiThuy') continue;
    rows.push({ itemId, item });
  }
  return rows;
}

function getFilteredShopItems(filter: InventoryFilter): { itemId: string; item: ItemData }[] {
  const all = getAllShopItems();
  if (filter === 'all') return all;
  return all.filter(({ item }) => matchesInventoryTab(item, filter));
}

function priceIconKind(item: ItemData): 'tinhThach' | 'gioiThuy' | null {
  if (item.priceType === 'gioiThuy') return 'gioiThuy';
  if (item.priceType === 'tinhThach') return 'tinhThach';
  return null;
}

export class ShopModal extends ModalBase {
  private filter: InventoryFilter = 'all';
  private selectedItemId: string | null = null;
  private gridContainer!: Phaser.GameObjects.Container;
  private gridScrollRoot!: Phaser.GameObjects.Container;
  private gridScrollY = 0;
  private maxGridScroll = 0;
  private gridScrollTeardown: (() => void)[] = [];
  private gridPanDragging = false;
  private gridPanMoved = false;
  private gridPanStart = { y: 0, scrollY: 0 };
  private detailIconWrap!: Phaser.GameObjects.Container;
  private detailName!: Phaser.GameObjects.Text;
  private detailType!: Phaser.GameObjects.Text;
  private detailDesc!: Phaser.GameObjects.Text;
  private balanceWrap!: Phaser.GameObjects.Container;
  private buyButton?: UIButton;

  constructor(scene: Phaser.Scene, onClose?: () => void) {
    super(scene, { title: '🏪 Cửa Hàng', fullscreen: true, onClose });
    const defaultTab = SHOP_TABS.find((t) => getFilteredShopItems(t.id).length > 0)?.id ?? 'all';
    this.filter = defaultTab;
    const items = getFilteredShopItems(this.filter);
    this.selectedItemId = items[0]?.itemId ?? null;
    this.build();
  }

  close(): void {
    this.teardownGridScroll();
    super.close();
  }

  private build(): void {
    this.teardownGridScroll();
    this.container.removeAll(true);
    this.gridScrollY = 0;
    this.computeGridLayoutBounds();
    this.prependFullscreenInputBlocker();

    this.container.add([
      this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, PANEL_RIGHT, 1),
      this.scene.add.rectangle(LEFT_PANEL_W / 2, GAME_HEIGHT / 2, LEFT_PANEL_W, GAME_HEIGHT, PANEL_LEFT, 1),
    ]);

    this.balanceWrap = this.scene.add.container(leftPanelCenterX(), 68);
    this.renderBalance();

    this.detailName = this.scene.add.text(leftPanelCenterX(), 118, '', {
      fontFamily: UI_THEME.fontFamilyTitle,
      fontSize: clampFontSizePx('20px'),
      color: TEXT_GOLD,
      align: 'center',
      wordWrap: { width: LEFT_PANEL_W - 40 },
    }).setOrigin(0.5, 0);

    this.detailType = this.scene.add.text(leftPanelCenterX(), 148, '', {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('18px'),
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5, 0);

    this.detailIconWrap = this.scene.add.container(leftPanelCenterX(), 228);

    this.detailDesc = this.scene.add.text(leftPanelCenterX(), 308, 'Chọn vật phẩm để xem thông tin.', {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('15px'),
      color: TEXT_MUTED,
      align: 'center',
      wordWrap: { width: LEFT_PANEL_W - 48 },
      lineSpacing: 4,
    }).setOrigin(0.5, 0);

    this.buyButton = new UIButton(this.scene, {
      x: leftPanelCenterX(),
      y: GAME_HEIGHT - 150,
      width: 160,
      height: 48,
      label: 'Mua',
      onClick: () => this.purchaseSelected(),
      addToScene: false,
    });

    const closeBtn = new UIButton(this.scene, {
      x: leftPanelCenterX(),
      y: GAME_HEIGHT - 44,
      width: 140,
      height: 44,
      label: 'Đóng',
      onClick: () => this.close(),
      addToScene: false,
    });

    this.gridScrollRoot = this.scene.add.container(0, 0);
    this.gridContainer = this.scene.add.container(0, 0);
    this.gridScrollRoot.add(this.gridContainer);

    const maskGfx = this.scene.add.graphics();
    maskGfx.fillStyle(0xffffff, 1);
    maskGfx.fillRect(GRID_AREA_X, this.gridAreaTop, GRID_AREA_W, GRID_AREA_BOTTOM - this.gridAreaTop);
    const gridMask = maskGfx.createGeometryMask();
    this.gridScrollRoot.setMask(gridMask);
    maskGfx.setVisible(false);

    this.renderGrid();
    this.setupGridDragScroll();

    const headerBg = this.scene.add.rectangle(
      GRID_AREA_X + GRID_AREA_W / 2,
      this.gridHeaderH / 2,
      GRID_AREA_W,
      this.gridHeaderH,
      PANEL_RIGHT,
      1,
    );
    const title = this.scene.add.text(GRID_AREA_X + GRID_AREA_W / 2, TITLE_Y, '🏪 Cửa Hàng', {
      fontFamily: UI_THEME.fontFamilyTitle,
      fontSize: clampFontSizePx('22px'),
      color: UI_THEME.colors.accentAlt,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    const filterTabs = this.buildFilterTabs();
    const headerDivider = this.scene.add.rectangle(
      GRID_AREA_X + GRID_AREA_W / 2,
      this.gridHeaderH - 1,
      GRID_AREA_W,
      2,
      SLOT_BORDER,
      0.6,
    );

    this.updateDetailPanel();

    this.container.add([
      maskGfx,
      this.gridScrollRoot,
      headerBg,
      headerDivider,
      title,
      ...filterTabs,
      this.balanceWrap,
      this.detailName,
      this.detailType,
      this.detailIconWrap,
      this.detailDesc,
      this.buyButton,
      closeBtn,
    ]);
  }

  private teardownGridScroll(): void {
    for (const off of this.gridScrollTeardown) off();
    this.gridScrollTeardown = [];
  }

  private setupGridDragScroll(): void {
    const areaH = GRID_AREA_BOTTOM - this.gridAreaTop;
    this.maxGridScroll = Math.max(0, this.gridContentH - areaH);

    const inGridArea = (p: Phaser.Input.Pointer) =>
      p.x >= GRID_AREA_X && p.x <= GAME_WIDTH && p.y >= this.gridAreaTop && p.y <= GRID_AREA_BOTTOM;

    const onDown = (p: Phaser.Input.Pointer) => {
      if (!inGridArea(p)) return;
      this.gridPanDragging = true;
      this.gridPanMoved = false;
      this.gridPanStart = { y: p.y, scrollY: this.gridScrollY };
    };

    const onMove = (p: Phaser.Input.Pointer) => {
      if (!this.gridPanDragging || !p.isDown || this.maxGridScroll <= 0) return;
      const dy = p.y - this.gridPanStart.y;
      if (Math.abs(dy) > 6) this.gridPanMoved = true;
      if (!this.gridPanMoved) return;
      this.gridScrollY = Phaser.Math.Clamp(this.gridPanStart.scrollY + dy, -this.maxGridScroll, 0);
      this.gridContainer.y = this.gridScrollY;
    };

    const onUp = () => {
      this.gridPanDragging = false;
    };

    this.scene.input.on('pointerdown', onDown);
    this.scene.input.on('pointermove', onMove);
    this.scene.input.on('pointerup', onUp);

    this.gridScrollTeardown.push(
      () => this.scene.input.off('pointerdown', onDown),
      () => this.scene.input.off('pointermove', onMove),
      () => this.scene.input.off('pointerup', onUp),
    );
  }

  private gridContentH = 0;
  private gridAreaTop = TAB_ROW_Y + TAB_H / 2 + 18;
  private gridHeaderH = TAB_ROW_Y + TAB_H / 2 + 18;

  private computeGridLayoutBounds(): void {
    this.gridHeaderH = TAB_ROW_Y + TAB_H / 2 + 18;
    this.gridAreaTop = this.gridHeaderH;
  }

  private buildFilterTabs(): Phaser.GameObjects.GameObject[] {
    const parts: Phaser.GameObjects.GameObject[] = [];
    const tabCount = SHOP_TABS.length;
    const tabW = Math.floor((GRID_AREA_W - (tabCount - 1) * TAB_GAP - 32) / tabCount);
    const startX = GRID_AREA_X + 16 + tabW / 2;

    SHOP_TABS.forEach((tab, i) => {
      const x = startX + i * (tabW + TAB_GAP);
      const active = this.filter === tab.id;
      const bg = this.scene.add.rectangle(x, TAB_ROW_Y, tabW, TAB_H, active ? FILTER_ACTIVE : FILTER_IDLE, 1)
        .setInteractive({ useHandCursor: true });
      bg.setStrokeStyle(active ? 2 : 1, active ? FILTER_BORDER : SLOT_BORDER, active ? 1 : 0.55);

      const label = this.scene.add.text(x, TAB_ROW_Y, tab.label, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('14px'),
        color: active ? TEXT_GOLD : UI_THEME.colors.text,
        align: 'center',
      }).setOrigin(0.5);

      bg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event.stopPropagation();
        if (this.filter === tab.id) return;
        soundManager.playUiClick();
        this.filter = tab.id;
        this.gridScrollY = 0;
        const items = getFilteredShopItems(this.filter);
        if (!items.some((entry) => entry.itemId === this.selectedItemId)) {
          this.selectedItemId = items[0]?.itemId ?? null;
        }
        this.build();
      });

      parts.push(bg, label);
    });

    return parts;
  }

  private renderBalance(): void {
    this.balanceWrap.removeAll(true);
    const gs = GameState.getInstance();
    const parts: Phaser.GameObjects.GameObject[] = [];
    const tt = gs.inventoryManager.getTinhThach();
    const ttIcon = createCurrencyUiIcon(this.scene, -36, 0, 'tinhThach', 22, 32);
    if (ttIcon) {
      ttIcon.setOrigin(1, 0.5);
      parts.push(ttIcon);
    }
    parts.push(
      this.scene.add.text(-28, 0, tt.toLocaleString('vi-VN'), {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('16px'),
        color: UI_THEME.colors.text,
        fontStyle: 'bold',
      }).setOrigin(0, 0.5),
    );
    this.balanceWrap.add(parts);
  }

  private renderGrid(): void {
    this.gridContainer.removeAll(true);

    const items = getFilteredShopItems(this.filter);
    const { cols, gridLeft, gridTop, gridContentH } = computeGridLayout(
      items.length,
      this.gridAreaTop,
      GRID_AREA_BOTTOM,
    );
    this.gridContentH = gridContentH;
    this.gridContainer.y = Phaser.Math.Clamp(
      this.gridScrollY,
      -Math.max(0, gridContentH - (GRID_AREA_BOTTOM - this.gridAreaTop)),
      0,
    );

    items.forEach(({ itemId, item }, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cellTop = gridTop + row * (CELL_H + SLOT_GAP);
      const x = gridLeft + col * (SLOT_SIZE + SLOT_GAP) + SLOT_SIZE / 2;
      const iconY = cellTop + SLOT_SIZE / 2;
      const nameY = cellTop + SLOT_SIZE + NAME_GAP + NAME_ROW_H / 2;
      const priceY = cellTop + SLOT_SIZE + NAME_GAP + NAME_ROW_H + PRICE_GAP + PRICE_ROW_H / 2;
      const isSelected = this.selectedItemId === itemId;

      const cell = this.scene.add.rectangle(x, iconY, SLOT_SIZE, SLOT_SIZE, SLOT_BG, 1);
      cell.setStrokeStyle(isSelected ? 3 : 2, isSelected ? SLOT_SELECTED : SLOT_BORDER, isSelected ? 1 : 0.65);
      this.gridContainer.add(cell);

      const iconSize = SLOT_SIZE - 14;
      const iconWrap = this.scene.add.container(x, iconY);

      if (item.rarity && (item.type === 'equipment' || item.type === 'beast')) {
        iconWrap.add(createItemRarityFrame(this.scene, 0, 0, SLOT_SIZE - 6, item.rarity));
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
        const iconKey = resolveItemIconKey(itemId);
        if (iconKey && this.scene.textures.exists(iconKey)) {
          iconWrap.add(this.scene.add.image(0, 0, iconKey).setDisplaySize(iconSize, iconSize));
        }
      }
      this.gridContainer.add(iconWrap);

      this.gridContainer.add(
        this.scene.add.text(x, nameY, item.name, {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('12px'),
          color: UI_THEME.colors.text,
          align: 'center',
          wordWrap: { width: SLOT_SIZE + 12 },
        }).setOrigin(0.5),
      );

      this.addPriceRow(x, priceY, item);

      const hit = this.scene.add.zone(x, cellTop + CELL_H / 2, SLOT_SIZE + 12, CELL_H).setInteractive({ useHandCursor: true });
      hit.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (this.gridPanMoved || pointer.getDistance() > 10) return;
        soundManager.playUiClick();
        this.selectedItemId = itemId;
        this.renderGrid();
        this.updateDetailPanel();
      });
      this.gridContainer.add(hit);
    });

    if (items.length === 0) {
      this.gridContainer.add(
        this.scene.add.text(
          GRID_AREA_X + GRID_AREA_W / 2,
          (this.gridAreaTop + GRID_AREA_BOTTOM) / 2,
          'Không có hàng trong mục này.',
          {
            fontFamily: UI_THEME.fontFamily,
            fontSize: clampFontSizePx('16px'),
            color: TEXT_MUTED,
          },
        ).setOrigin(0.5),
      );
    }

    this.maxGridScroll = Math.max(0, this.gridContentH - (GRID_AREA_BOTTOM - this.gridAreaTop));
  }

  private addPriceRow(cx: number, cy: number, item: ItemData): void {
    const iconSize = 16;
    const priceText = this.scene.add.text(0, 0, item.value.toLocaleString('vi-VN'), {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('13px'),
      color: '#ffffff',
      fontStyle: 'bold',
    });

    const kind = priceIconKind(item);
    let iconW = 0;
    let icon: Phaser.GameObjects.Image | null = null;
    if (kind) {
      icon = createCurrencyUiIcon(this.scene, 0, cy, kind, iconSize, iconSize);
      if (icon) {
        iconW = icon.displayWidth;
      }
    }

    const textW = priceText.width;
    const totalW = (icon ? iconW + 5 : 0) + textW;
    let offsetX = cx - totalW / 2;

    if (icon) {
      icon.setPosition(offsetX + iconW / 2, cy);
      this.gridContainer.add(icon);
      offsetX += iconW + 5;
    }

    priceText.setPosition(offsetX, cy).setOrigin(0, 0.5);
    this.gridContainer.add(priceText);
  }

  private updateDetailPanel(): void {
    this.detailIconWrap.removeAll(true);

    if (!this.selectedItemId) {
      this.detailName.setText('');
      this.detailType.setText('');
      this.detailDesc.setText('Chọn vật phẩm để xem thông tin.');
      this.detailDesc.setColor(TEXT_MUTED);
      this.buyButton?.setEnabled(false);
      return;
    }

    const item = getItemById(this.selectedItemId);
    if (!item) {
      this.detailName.setText('');
      this.detailType.setText('');
      this.detailDesc.setText('Không tìm thấy vật phẩm.');
      this.detailDesc.setColor(TEXT_MUTED);
      this.buyButton?.setEnabled(false);
      return;
    }

    this.detailName.setText(item.name);
    this.detailType.setText(
      item.type === 'equipment' ? formatEquipmentTypeLabel(item) : '',
    );
    this.detailDesc.setText(formatItemDisplayDescription(item));
    this.detailDesc.setColor(TEXT_DESC);
    this.buyButton?.setEnabled(true);

    const previewSize = 88;
    if (item.rarity && (item.type === 'equipment' || item.type === 'beast')) {
      this.detailIconWrap.add(
        createItemRarityFrame(this.scene, 0, 0, previewSize + 8, item.rarity),
      );
    }

    const previewIcon = createItemIcon(this.scene, 0, 0, item, previewSize);
    if (previewIcon) {
      if (usesHubUiItemIcon(item.id)) {
        this.detailIconWrap.add(previewIcon);
      } else {
        const maskGfx = applyIconCircleMask(this.scene, previewIcon, 0, 0, previewSize * 0.45);
        maskGfx.setVisible(false);
        this.detailIconWrap.add([previewIcon, maskGfx]);
      }
    } else {
      const iconKey = resolveItemIconKey(this.selectedItemId);
      if (iconKey && this.scene.textures.exists(iconKey)) {
        this.detailIconWrap.add(
          this.scene.add.image(0, 0, iconKey).setDisplaySize(previewSize, previewSize),
        );
      }
    }
  }

  private purchaseSelected(): void {
    if (!this.selectedItemId) return;

    const item = getItemById(this.selectedItemId);
    if (!item || item.value <= 0) return;

    const gs = GameState.getInstance();
    const inv = gs.inventoryManager;

    if (!inv.hasSpaceForItem(this.selectedItemId)) {
      this.showToast('Túi đồ đã đầy');
      return;
    }

    const paid = inv.spendTinhThach(item.value);

    if (!paid) {
      this.showToast('Không đủ Tinh Thạch!');
      return;
    }

    if (!inv.addItem(this.selectedItemId, 1)) {
      inv.addTinhThach(item.value);
      this.showToast('Túi đồ đã đầy');
      return;
    }
    soundManager.playItemPickup();
    gs.persist();
    this.showToast(`Đã mua ${item.name}`);
    this.renderBalance();
  }
}
