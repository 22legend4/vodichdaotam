import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/gameDimensions.ts';
import { GameState } from '../../state/gameState.ts';
import { getItemById } from '../../data/itemsData.ts';
import { CRAFT_RECIPES, type CraftRecipe } from '../../data/craftingRecipes.ts';
import type { ItemData } from '../../types/game.ts';
import { ModalBase } from './ModalBase.ts';
import { UI_THEME, clampFontSizePx } from '../theme.ts';
import { UIButton } from '../UIButton.ts';
import { soundManager } from '../../utils/SoundManager.ts';
import { resolveItemIconKey } from '../../utils/AssetGenerator.ts';
import { createItemIcon, applyIconCircleMask, usesHubUiItemIcon } from '../../utils/iconAssets.ts';
import { createItemRarityFrame } from '../itemRarityFrame.ts';
import {
  formatEquipmentTypeLabel,
  formatItemDisplayDescription,
} from '../../utils/equipmentDisplay.ts';

const LEFT_PANEL_W = Math.floor(GAME_WIDTH * 0.38);
const PANEL_LEFT = 0x0d1228;
const PANEL_RIGHT = 0x141c38;
const ROW_H = 72;
const ROW_GAP = 8;
const LIST_ICON = 52;
const DETAIL_ICON = 108;
const MAT_ICON = 44;
const LIST_AREA_X = LEFT_PANEL_W + 24;
const LIST_AREA_W = GAME_WIDTH - LEFT_PANEL_W - 48;
const LIST_AREA_TOP = 72;
const LIST_AREA_BOTTOM = GAME_HEIGHT - 88;

const TEXT_GOLD = '#eab308';
const TEXT_LIGHT = '#ffffff';
const TEXT_MUTED = '#9aa8c4';
const TEXT_OK = '#2ecc71';
const TEXT_FAIL = '#e74c3c';
const SLOT_BG = 0x43518a;
const SLOT_BORDER = 0x6b7cad;
const SLOT_SELECTED = 0xeab308;

function leftPanelCenterX(): number {
  return LEFT_PANEL_W / 2;
}

function rightPanelCenterX(): number {
  return LEFT_PANEL_W + (GAME_WIDTH - LEFT_PANEL_W) / 2;
}

export class CraftingModal extends ModalBase {
  private selectedRecipeId: string;
  private listScrollRoot!: Phaser.GameObjects.Container;
  private listContainer!: Phaser.GameObjects.Container;
  private listScrollY = 0;
  private maxListScroll = 0;
  private listContentH = 0;
  private listScrollTeardown: (() => void)[] = [];
  private listPanDragging = false;
  private listPanMoved = false;
  private listPanStart = { y: 0, scrollY: 0 };
  private materialsContainer!: Phaser.GameObjects.Container;
  private detailIconWrap!: Phaser.GameObjects.Container;
  private detailName!: Phaser.GameObjects.Text;
  private detailType!: Phaser.GameObjects.Text;
  private detailDesc!: Phaser.GameObjects.Text;
  private craftButton!: UIButton;

  constructor(scene: Phaser.Scene, onClose?: () => void) {
    super(scene, { title: 'Luyện Khí', fullscreen: true, onClose });
    this.selectedRecipeId = CRAFT_RECIPES[0]?.id ?? '';
    this.build();
  }

  close(): void {
    this.teardownListScroll();
    super.close();
  }

  private build(): void {
    this.teardownListScroll();
    this.container.removeAll(true);
    this.listScrollY = 0;
    this.prependFullscreenInputBlocker();

    this.container.add([
      this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, PANEL_RIGHT, 1),
      this.scene.add.rectangle(LEFT_PANEL_W / 2, GAME_HEIGHT / 2, LEFT_PANEL_W, GAME_HEIGHT, PANEL_LEFT, 1),
    ]);

    this.container.add(
      this.scene.add.text(rightPanelCenterX(), 36, 'Luyện Khí', {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('24px'),
        color: TEXT_GOLD,
        fontStyle: 'bold',
      }).setOrigin(0.5),
    );

    this.detailName = this.scene.add.text(leftPanelCenterX(), 48, '', {
      fontFamily: UI_THEME.fontFamilyTitle,
      fontSize: clampFontSizePx('22px'),
      color: TEXT_GOLD,
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: LEFT_PANEL_W - 40 },
    }).setOrigin(0.5, 0);

    this.detailType = this.scene.add.text(leftPanelCenterX(), 82, '', {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('16px'),
      color: TEXT_LIGHT,
      align: 'center',
    }).setOrigin(0.5, 0);

    this.detailIconWrap = this.scene.add.container(leftPanelCenterX(), 168);

    this.detailDesc = this.scene.add.text(leftPanelCenterX(), 248, '', {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('15px'),
      color: TEXT_MUTED,
      align: 'center',
      wordWrap: { width: LEFT_PANEL_W - 48 },
      lineSpacing: 4,
    }).setOrigin(0.5, 0);

    this.container.add([
      this.scene.add.text(leftPanelCenterX(), 292, 'Nguyên liệu', {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('16px'),
        color: TEXT_GOLD,
        fontStyle: 'bold',
      }).setOrigin(0.5),
    ]);

    this.materialsContainer = this.scene.add.container(0, 0);
    this.container.add(this.materialsContainer);

    this.craftButton = new UIButton(this.scene, {
      x: leftPanelCenterX(),
      y: GAME_HEIGHT - 100,
      width: 200,
      height: 48,
      label: 'Rèn',
      onClick: () => this.craftSelected(),
      addToScene: false,
    });

    const closeBtn = new UIButton(this.scene, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 44,
      width: 140,
      height: 44,
      label: 'Đóng',
      onClick: () => this.close(),
      addToScene: false,
    });

    this.listScrollRoot = this.scene.add.container(0, 0);
    this.listContainer = this.scene.add.container(0, 0);
    this.listScrollRoot.add(this.listContainer);

    const listMaskGfx = this.scene.add.graphics();
    listMaskGfx.fillStyle(0xffffff, 1);
    listMaskGfx.fillRect(LIST_AREA_X, LIST_AREA_TOP, LIST_AREA_W, LIST_AREA_BOTTOM - LIST_AREA_TOP);
    const listMask = listMaskGfx.createGeometryMask();
    this.listScrollRoot.setMask(listMask);
    listMaskGfx.setVisible(false);

    this.container.add([
      listMaskGfx,
      this.listScrollRoot,
      this.detailName,
      this.detailType,
      this.detailIconWrap,
      this.detailDesc,
      this.materialsContainer,
      this.craftButton,
      closeBtn,
    ]);

    this.renderRecipeList();
    this.renderDetail();
    this.setupListDragScroll();
  }

  private teardownListScroll(): void {
    for (const off of this.listScrollTeardown) off();
    this.listScrollTeardown = [];
  }

  private setupListDragScroll(): void {
    const areaH = LIST_AREA_BOTTOM - LIST_AREA_TOP;
    this.maxListScroll = Math.max(0, this.listContentH - areaH);

    const inListArea = (p: Phaser.Input.Pointer) =>
      p.x >= LIST_AREA_X && p.x <= LIST_AREA_X + LIST_AREA_W
      && p.y >= LIST_AREA_TOP && p.y <= LIST_AREA_BOTTOM;

    const onDown = (p: Phaser.Input.Pointer) => {
      if (!inListArea(p)) return;
      this.listPanDragging = true;
      this.listPanMoved = false;
      this.listPanStart = { y: p.y, scrollY: this.listScrollY };
    };

    const onMove = (p: Phaser.Input.Pointer) => {
      if (!this.listPanDragging || !p.isDown || this.maxListScroll <= 0) return;
      const dy = p.y - this.listPanStart.y;
      if (Math.abs(dy) > 6) this.listPanMoved = true;
      if (!this.listPanMoved) return;
      this.listScrollY = Phaser.Math.Clamp(this.listPanStart.scrollY + dy, -this.maxListScroll, 0);
      this.listContainer.y = this.listScrollY;
    };

    const onUp = () => {
      this.listPanDragging = false;
    };

    this.scene.input.on('pointerdown', onDown);
    this.scene.input.on('pointermove', onMove);
    this.scene.input.on('pointerup', onUp);

    this.listScrollTeardown.push(
      () => this.scene.input.off('pointerdown', onDown),
      () => this.scene.input.off('pointermove', onMove),
      () => this.scene.input.off('pointerup', onUp),
    );
  }

  private updateListScrollBounds(): void {
    const areaH = LIST_AREA_BOTTOM - LIST_AREA_TOP;
    this.maxListScroll = Math.max(0, this.listContentH - areaH);
    this.listScrollY = Phaser.Math.Clamp(this.listScrollY, -this.maxListScroll, 0);
    this.listContainer.y = this.listScrollY;
  }

  private getSelectedRecipe(): CraftRecipe | undefined {
    return CRAFT_RECIPES.find((r) => r.id === this.selectedRecipeId);
  }

  private canCraft(recipe: CraftRecipe): boolean {
    const inv = GameState.getInstance().inventoryManager;
    for (const mat of recipe.materials) {
      if (inv.getItemQuantity(mat.itemId) < mat.quantity) return false;
    }
    return inv.hasSpaceForItem(recipe.resultItemId);
  }

  private renderRecipeList(): void {
    this.listContainer.removeAll(true);

    const listLeft = LIST_AREA_X + LIST_AREA_W / 2;
    this.listContentH = CRAFT_RECIPES.length * (ROW_H + ROW_GAP) - ROW_GAP;
    this.updateListScrollBounds();

    CRAFT_RECIPES.forEach((recipe, i) => {
      const y = LIST_AREA_TOP + i * (ROW_H + ROW_GAP) + ROW_H / 2;
      const item = getItemById(recipe.resultItemId);
      if (!item) return;

      const selected = recipe.id === this.selectedRecipeId;
      const row = this.scene.add.container(listLeft, y);

      const bg = this.scene.add
        .rectangle(0, 0, LIST_AREA_W, ROW_H, selected ? 0x3d4f8a : SLOT_BG, 1)
        .setStrokeStyle(selected ? 2 : 1, selected ? SLOT_SELECTED : SLOT_BORDER, selected ? 1 : 0.65);

      const iconX = -LIST_AREA_W / 2 + 16 + LIST_ICON / 2;
      row.add(this.createItemIconWrap(item, iconX, 0, LIST_ICON - 6));

      const nameX = -LIST_AREA_W / 2 + 16 + LIST_ICON + 12;
      const name = this.scene.add.text(nameX, -8, item.name, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('16px'),
        color: TEXT_LIGHT,
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      const typeLabel = formatEquipmentTypeLabel(item);
      const sub = this.scene.add.text(nameX, 14, typeLabel || formatItemDisplayDescription(item), {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('13px'),
        color: TEXT_MUTED,
      }).setOrigin(0, 0.5);

      const ready = this.canCraft(recipe);
      const status = this.scene.add.text(LIST_AREA_W / 2 - 16, 0, ready ? 'Đủ NL' : 'Thiếu NL', {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('13px'),
        color: ready ? TEXT_OK : TEXT_FAIL,
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);

      row.add([bg, name, sub, status]);

      const hit = this.scene.add
        .zone(0, 0, LIST_AREA_W, ROW_H)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (this.listPanMoved || pointer.getDistance() > 10) return;
        soundManager.playUiClick();
        this.selectedRecipeId = recipe.id;
        this.renderRecipeList();
        this.renderDetail();
      });
      row.add(hit);

      this.listContainer.add(row);
    });
  }

  private renderDetail(): void {
    const recipe = this.getSelectedRecipe();
    const item = recipe ? getItemById(recipe.resultItemId) : undefined;

    this.detailIconWrap.removeAll(true);
    this.materialsContainer.removeAll(true);

    if (!recipe || !item) {
      this.detailName.setText('—');
      this.detailType.setText('');
      this.detailDesc.setText('Chọn công thức rèn.');
      this.craftButton.setEnabled(false);
      return;
    }

    this.detailName.setText(item.name);
    this.detailType.setText(formatEquipmentTypeLabel(item));
    this.detailDesc.setText(formatItemDisplayDescription(item));
    this.detailIconWrap.add(this.createItemIconWrap(item, 0, 0, DETAIL_ICON));

    const inv = GameState.getInstance().inventoryManager;
    const matStartY = 328;
    const matRowH = 52;
    const matW = LEFT_PANEL_W - 48;

    recipe.materials.forEach((mat, i) => {
      const matItem = getItemById(mat.itemId);
      if (!matItem) return;

      const owned = inv.getItemQuantity(mat.itemId);
      const enough = owned >= mat.quantity;
      const y = matStartY + i * matRowH;
      const row = this.scene.add.container(leftPanelCenterX(), y);

      const bg = this.scene.add.rectangle(0, 0, matW, matRowH - 4, 0x252d52, 0.9)
        .setStrokeStyle(1, enough ? 0x2ecc71 : 0xe74c3c, 0.55);
      row.add(bg);

      const iconX = -matW / 2 + 12 + MAT_ICON / 2;
      row.add(this.createItemIconWrap(matItem, iconX, 0, MAT_ICON - 4));

      const textX = -matW / 2 + 12 + MAT_ICON + 10;
      row.add(
        this.scene.add.text(textX, -6, matItem.name, {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('14px'),
          color: TEXT_LIGHT,
        }).setOrigin(0, 0.5),
      );
      row.add(
        this.scene.add.text(textX, 12, `${owned} / ${mat.quantity}`, {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('13px'),
          color: enough ? TEXT_OK : TEXT_FAIL,
          fontStyle: 'bold',
        }).setOrigin(0, 0.5),
      );

      this.materialsContainer.add(row);
    });

    const canCraft = this.canCraft(recipe);
    this.craftButton.setEnabled(canCraft);
    this.craftButton.setLabel('Rèn');
  }

  private createItemIconWrap(item: ItemData, x: number, y: number, size: number): Phaser.GameObjects.Container {
    const wrap = this.scene.add.container(x, y);
    if (item.rarity && (item.type === 'equipment' || item.type === 'beast')) {
      wrap.add(createItemRarityFrame(this.scene, 0, 0, size + 4, item.rarity));
    }
    const icon = createItemIcon(this.scene, 0, 0, item, size);
    if (icon) {
      if (usesHubUiItemIcon(item.id)) {
        wrap.add(icon);
      } else {
        const mask = applyIconCircleMask(this.scene, icon, 0, 0, size * 0.45);
        mask.setVisible(false);
        wrap.add([icon, mask]);
      }
    } else {
      const key = resolveItemIconKey(item.id);
      if (key && this.scene.textures.exists(key)) {
        wrap.add(this.scene.add.image(0, 0, key).setDisplaySize(size, size));
      }
    }
    return wrap;
  }

  private craftSelected(): void {
    const recipe = this.getSelectedRecipe();
    if (!recipe) return;

    soundManager.playUiClick();
    const gs = GameState.getInstance();
    const result = gs.inventoryManager.craftItem(recipe);

    if (result.success) {
      soundManager.playItemPickup();
    }

    this.showToast(result.message);
    if (result.success) {
      gs.persist();
    }
    this.renderRecipeList();
    this.renderDetail();
  }
}
