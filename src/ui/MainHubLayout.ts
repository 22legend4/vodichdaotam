import Phaser from 'phaser';
import type { CharacterData } from '../types/game.ts';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameDimensions.ts';
import { STAMINA_CONSTANTS } from '../constants/gameRules.ts';
import { REALM_EXP_REQUIREMENTS } from '../constants/gameRules.ts';
import { REALM_ORDER } from '../managers/CharacterManager.ts';
import { UI_THEME, REALM_LABELS, clampFontSizePx, UI_FONT_MIN } from './theme.ts';
import { BattleGuideOverlay } from './BattleGuideOverlay.ts';
import { ASSET_KEYS, resolveAvatarKey } from '../utils/AssetGenerator.ts';
import type { HubButtonKind } from '../utils/assetDrawUi.ts';
import {
  applyGameIconStyle,
  applyIconCircleMask,
  createStyledIcon,
  getResolvedIcon,
  hubKindToIconSlot,
  type IconSlot,
} from '../utils/iconAssets.ts';
import { JADE_DISC_RADIUS } from '../utils/assetDrawUi.ts';
import { HUB_MAP_WORLD_ICON } from '../utils/characterSpriteAssets.ts';
import { AVATAR_W, AVATAR_H } from '../utils/assetDrawCharacters.ts';
import { soundManager } from '../utils/SoundManager.ts';
import { GameState } from '../state/gameState.ts';
import { WorldLoreModal } from './modals/WorldLoreModal.ts';

const HUB_ORANGE = 0xf8b181;
const HUB_BTN = 0xc97a4a;
const BTN_GAP_BOTTOM = 130;
const BTN_GAP_RIGHT = 112;
const BTN_RADIUS = JADE_DISC_RADIUS;
/** Nút Bản Đồ — lớn hơn các nút jade khác 20px đường kính. */
const MAP_BTN_RADIUS = BTN_RADIUS + 10;
/** Vị trí nút Bản Đồ trên sảnh chính. */
export const HUB_MAP_BUTTON_X = GAME_WIDTH - 96;
export const HUB_MAP_BUTTON_Y = GAME_HEIGHT - 84;
export const HUB_MAP_BUTTON_RADIUS = MAP_BTN_RADIUS;
const HUB_EDGE_MARGIN = 5;
/** Lề phải cột icon — dùng trong method, tránh circular init với phaserConfig. */
const HUB_RIGHT_MARGIN = 72;
const HUB_RIGHT_COL_START_Y = 162;
const JADE_ICON_PX = 38;
const JADE_HOVER_SCALE = 1.08;
const HUB_LABEL_FONT = 'Inter, sans-serif';
const HUB_LABEL_SIZE = UI_FONT_MIN;
const HUB_LABEL_STROKE = 4;
const HUB_LABEL_BADGE_PAD_X = 8;
const HUB_LABEL_BADGE_PAD_Y = 4;
const HUB_LABEL_BADGE_RADIUS = 8;
const HUB_HERO_SCALE = 2.1;
const HUB_HERO_HEIGHT_CHAR = 200;
const HUB_HERO_HEIGHT_AVATAR = AVATAR_H * 1.35;
const HUB_TEXT_STROKE = '#000000';
const HUB_TEXT_STROKE_THICKNESS = 3;
/** PNG tiền tệ — fit trong khung, giữ tỷ lệ gốc (không ép vuông). */
const HUB_CURRENCY_PNG_MAX_W = 28;
const HUB_CURRENCY_PNG_MAX_H = 40;
const HUB_STAMINA_ICON_SIZE = 36;

const CURRENCY_ICON_KEYS: Record<string, string> = {
  cur_tinhThach: ASSET_KEYS.uiIconTinhThach,
  cur_gioiThuy: ASSET_KEYS.uiIconGioiThuy,
};

const ICON_SLOT_LABELS: Partial<Record<IconSlot, string>> = {
  hub_forge: 'Luyện Khí',
  hub_meditate: 'Tu Luyện',
  hub_event: 'Sự Kiện',
  hub_daily: 'Quà tặng hàng ngày',
  hub_inventory: 'Túi Đồ',
  hub_settings: 'Cài Đặt',
  hub_map: 'Bản Đồ',
  hub_shop: 'Cửa Hàng',
};

const HUB_KIND_LABELS: Record<HubButtonKind, string> = {
  settings: 'Cài Đặt',
  character: 'Nhân Vật',
  inventory: 'Túi Đồ',
  shop: 'Cửa Hàng',
  map: 'Bản Đồ',
};

export interface MainHubLayoutCallbacks {
  onSkills: () => void;
  onForge: () => void;
  onShop: () => void;
  onInventory: () => void;
  onMeditate: () => void;
  onMap: () => void;
  onSettings: () => void;
  onPlayerRoster: () => void;
  onEvents: () => void;
  onDailyReward: () => void;
}

function formatDots(n: number): string {
  return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatExpCap(n: number): string {
  if (n >= 1_000_000) return `${Math.round(n / 100_000) / 10}M`;
  if (n >= 1_000) return `${Math.round(n / 100) / 10}k`;
  return formatDots(n);
}

function nextRealmExp(realm: CharacterData['realm']): number {
  const idx = REALM_ORDER.indexOf(realm);
  if (idx < 0 || idx >= REALM_ORDER.length - 1) {
    return REALM_EXP_REQUIREMENTS.Thien;
  }
  return REALM_EXP_REQUIREMENTS[REALM_ORDER[idx + 1]!];
}

/** Scale PNG vào khung maxW×maxH, giữ nguyên tỷ lệ (contain). */
function fitTextureDisplaySize(
  scene: Phaser.Scene,
  textureKey: string,
  maxW: number,
  maxH: number,
): { w: number; h: number } {
  const tex = scene.textures.get(textureKey);
  const frame = tex.get();
  const src = tex.getSourceImage() as { width?: number; height?: number } | null;
  const frameW = src?.width ?? frame.width;
  const frameH = src?.height ?? frame.height;
  const scale = Math.min(maxW / frameW, maxH / frameH);
  return { w: frameW * scale, h: frameH * scale };
}

/** Giao diện sảnh chính — HUD trên, sự kiện phải, menu dưới (bản offline). */
export class MainHubLayout extends Phaser.GameObjects.Container {
  private nameText!: Phaser.GameObjects.Text;
  private idText!: Phaser.GameObjects.Text;
  private realmText!: Phaser.GameObjects.Text;
  private expText!: Phaser.GameObjects.Text;
  private tinhThachText!: Phaser.GameObjects.Text;
  private gioiThuyText!: Phaser.GameObjects.Text;
  private staminaText!: Phaser.GameObjects.Text;
  private heroSlot!: Phaser.GameObjects.Container;
  private toastText?: Phaser.GameObjects.Text;
  private mapButton?: Phaser.GameObjects.Container;
  private mapGuideOverlay?: BattleGuideOverlay;
  private mapButtonLifted = false;
  private skillButton?: Phaser.GameObjects.Container;
  private skillGuideOverlay?: BattleGuideOverlay;
  private skillButtonLifted = false;
  private worldLoreModal?: WorldLoreModal;
  private callbacks: MainHubLayoutCallbacks;

  constructor(
    scene: Phaser.Scene,
    callbacks: MainHubLayoutCallbacks,
  ) {
    super(scene, 0, 0);
    this.callbacks = callbacks;
    this.setDepth(UI_THEME.depth.hud);
    scene.add.existing(this);

    this.buildTopBar();
    this.buildWorldLoreButton();
    this.buildRightColumn();
    this.buildBottomBar();
    this.buildHeroCenter();
  }

  refresh(
    mc: CharacterData | null,
    tinhThach: number,
    gioiThuy: number,
    stamina: number,
    playerDisplayId: number | null = null,
  ): void {
    if (!mc) {
      this.nameText.setText('—');
      this.idText.setText('ID: —');
      this.realmText.setText('Cảnh giới: —');
      this.expText.setText('—');
      return;
    }

    const cap = nextRealmExp(mc.realm);
    this.nameText.setText(mc.name);
    this.idText.setText(`ID: ${playerDisplayId ?? '—'}`);
    this.realmText.setText(`Cảnh giới: ${REALM_LABELS[mc.realm] ?? mc.realm}`);
    this.expText.setText(`${formatDots(mc.exp)}/ ${formatExpCap(cap)}`);
    this.tinhThachText.setText(formatDots(tinhThach));
    this.gioiThuyText.setText(formatDots(gioiThuy));
    this.staminaText.setText(`${stamina}/${STAMINA_CONSTANTS.MAX_STAMINA}`);

    this.heroSlot.removeAll(true);
    const glow = this.scene.add.ellipse(
      0,
      70 * HUB_HERO_SCALE,
      140 * HUB_HERO_SCALE,
      36 * HUB_HERO_SCALE,
      HUB_ORANGE,
      0.2,
    );
    this.heroSlot.add(glow);
    const avatarKey = resolveAvatarKey(mc.id, mc.gender, mc.weaponType, mc.appearanceId);
    if (this.scene.textures.exists(avatarKey)) {
      const img = this.scene.add.image(0, 0, avatarKey);
      const tex = this.scene.textures.get(avatarKey);
      const src = tex.getSourceImage() as { width?: number; height?: number };
      const aspect = (src.width ?? AVATAR_W) / (src.height ?? AVATAR_H);
      const h = (avatarKey.startsWith('char_') ? HUB_HERO_HEIGHT_CHAR : HUB_HERO_HEIGHT_AVATAR) * HUB_HERO_SCALE;
      img.setDisplaySize(h * aspect, h);
      this.heroSlot.add(img);
    } else {
      this.heroSlot.add(
        this.scene.add.rectangle(
          0,
          0,
          AVATAR_W * 1.2 * HUB_HERO_SCALE,
          AVATAR_H * 1.2 * HUB_HERO_SCALE,
          0x2980b9,
          0.5,
        ),
      );
    }
  }

  showToast(message: string): void {
    this.toastText?.destroy();
    this.toastText = this.scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 120, message, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('15px'),
        color: UI_THEME.colors.text,
        backgroundColor: '#0f3460',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(UI_THEME.depth.overlay);
    this.scene.time.delayedCall(2200, () => {
      this.toastText?.destroy();
      this.toastText = undefined;
    });
  }

  private buildTopBar(): void {
    const profileX = 20;
    const profileY = 14;

    if (this.scene.textures.exists(ASSET_KEYS.uiHubProfileRing)) {
      this.add(
        this.scene.add.image(profileX + 36, profileY + 36, ASSET_KEYS.uiHubProfileRing)
          .setDisplaySize(80, 80),
      );
    } else {
      this.add(
        this.scene.add.circle(profileX + 36, profileY + 36, 38, 0x16213e, 0.95).setStrokeStyle(3, HUB_ORANGE),
      );
    }

    const profileKey = ASSET_KEYS.hubPlayerProfile;
    if (this.scene.textures.exists(profileKey)) {
      this.add(
        this.scene.add.image(profileX + 36, profileY + 36, profileKey)
          .setDisplaySize(72, 72),
      );
    }

    const profileHit = this.scene.add.circle(profileX + 36, profileY + 36, 40, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    profileHit.on('pointerup', () => {
      soundManager.playUiClick();
      this.callbacks.onPlayerRoster();
    });
    this.add(profileHit);

    this.nameText = this.scene.add.text(profileX + 84, profileY + 8, '—', {
      fontFamily: UI_THEME.fontFamilyTitle,
      fontSize: '17px',
      color: UI_THEME.colors.accentAlt,
      fontStyle: 'bold',
    });
    this.idText = this.scene.add.text(profileX + 84, profileY + 30, 'ID: —', {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('14px'),
      color: '#ffffff',
      stroke: HUB_TEXT_STROKE,
      strokeThickness: HUB_TEXT_STROKE_THICKNESS,
    });
    this.realmText = this.scene.add.text(profileX + 84, profileY + 50, 'Cảnh giới: —', {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('14px'),
      color: UI_THEME.colors.text,
      stroke: HUB_TEXT_STROKE,
      strokeThickness: HUB_TEXT_STROKE_THICKNESS,
    });
    this.add([this.nameText, this.idText, this.realmText]);

    const statY = 36;
    let statX = 280;

    const expLabel = this.scene.add.text(statX, statY, 'exp', {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('15px'),
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: HUB_TEXT_STROKE_THICKNESS,
    }).setOrigin(0, 0.5);
    this.add(expLabel);
    statX += expLabel.width + 6;

    this.expText = this.scene.add.text(statX, statY, '—', {
      fontFamily: UI_THEME.fontFamily,
      fontSize: '17px',
      color: UI_THEME.colors.text,
      fontStyle: 'bold',
      stroke: HUB_TEXT_STROKE,
      strokeThickness: HUB_TEXT_STROKE_THICKNESS,
    }).setOrigin(0, 0.5);
    this.add(this.expText);

    statX += 178;
    statX = this.addCurrencyStat(statX, statY, 'cur_tinhThach', (t) => { this.tinhThachText = t; });
    statX += 92;
    statX = this.addCurrencyStat(statX, statY, 'cur_gioiThuy', (t) => { this.gioiThuyText = t; });
    statX += 82;
    const staminaX = statX - 50;
    this.staminaText = this.scene.add.text(staminaX + HUB_STAMINA_ICON_SIZE + 4, statY, '0', {
      fontFamily: UI_THEME.fontFamily,
      fontSize: '17px',
      color: UI_THEME.colors.text,
      fontStyle: 'bold',
      stroke: HUB_TEXT_STROKE,
      strokeThickness: HUB_TEXT_STROKE_THICKNESS,
    }).setOrigin(0, 0.5);
    this.add(this.staminaText);
    this.add(this.scene.add.text(staminaX, statY, '⚡', { fontSize: `${HUB_STAMINA_ICON_SIZE}px` }).setOrigin(0, 0.5));

    const topRightY = HUB_EDGE_MARGIN + BTN_RADIUS;
    const topRightStartX = GAME_WIDTH - HUB_RIGHT_MARGIN;
    this.addIconRoundButton(topRightStartX, topRightY, BTN_RADIUS, 'settings', () => {
      soundManager.playUiClick();
      this.callbacks.onSettings();
    });
  }

  private addCurrencyStat(
    x: number,
    y: number,
    iconId: string,
    assign: (text: Phaser.GameObjects.Text) => void,
  ): number {
    const pngKey = CURRENCY_ICON_KEYS[iconId];
    if (!pngKey || !this.scene.textures.exists(pngKey)) {
      const val = this.scene.add.text(x, y, '0', {
        fontFamily: UI_THEME.fontFamily,
        fontSize: '17px',
        color: UI_THEME.colors.text,
        fontStyle: 'bold',
        stroke: HUB_TEXT_STROKE,
        strokeThickness: HUB_TEXT_STROKE_THICKNESS,
      }).setOrigin(0, 0.5);
      this.add(val);
      assign(val);
      return x + 56;
    }

    const { w: displayW, h: displayH } = fitTextureDisplaySize(
      this.scene,
      pngKey,
      HUB_CURRENCY_PNG_MAX_W,
      HUB_CURRENCY_PNG_MAX_H,
    );
    const img = this.scene.add.image(x, y, pngKey)
      .setDisplaySize(displayW, displayH)
      .setOrigin(0, 0.5);
    this.add(img);
    x += displayW + 6;

    const val = this.scene.add.text(x, y, '0', {
      fontFamily: UI_THEME.fontFamily,
      fontSize: '17px',
      color: UI_THEME.colors.text,
      fontStyle: 'bold',
      stroke: HUB_TEXT_STROKE,
      strokeThickness: HUB_TEXT_STROKE_THICKNESS,
    }).setOrigin(0, 0.5);
    this.add(val);
    assign(val);
    return x + 56;
  }

  /** Nút ? mở câu chuyện thế giới — góc trái dưới sảnh chính. */
  private buildWorldLoreButton(): void {
    const loreBtnX = 16 + BTN_RADIUS;
    const loreBtnY = GAME_HEIGHT - 100;
    this.addWorldLoreHelpButton(loreBtnX, loreBtnY);
  }

  /** Dấu ? mở câu chuyện thế giới — nút jade giống Túi Đồ / Võ Kỹ. */
  private addWorldLoreHelpButton(x: number, y: number): void {
    const btn = this.scene.add.container(x, y);
    const radius = BTN_RADIUS;
    const discSize = radius * 2;
    const discKey = ASSET_KEYS.uiJadeDisc;

    if (this.scene.textures.exists(discKey)) {
      btn.add(this.scene.add.image(0, 0, discKey).setDisplaySize(discSize, discSize));
    } else {
      btn.add(this.scene.add.circle(0, 0, radius, HUB_BTN, 1).setStrokeStyle(3, HUB_ORANGE));
    }

    btn.add(
      this.scene.add.text(0, 0, '?', {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('44px'),
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      }).setOrigin(0.5),
    );

    const hit = this.scene.add.circle(0, 0, radius, 0xffffff, 0.001);
    hit.setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => btn.setScale(JADE_HOVER_SCALE));
    hit.on('pointerout', () => btn.setScale(1));
    hit.on('pointerdown', () => {
      soundManager.playUiClick();
      this.openWorldLore();
    });
    btn.add(hit);
    btn.bringToTop(hit);
    this.add(btn);
  }

  private openWorldLore(): void {
    this.worldLoreModal?.close();
    this.worldLoreModal = new WorldLoreModal(this.scene, () => {
      this.worldLoreModal = undefined;
    });
  }

  private buildRightColumn(): void {
    const cx = GAME_WIDTH - HUB_RIGHT_MARGIN;
    const startY = HUB_RIGHT_COL_START_Y;
    const gap = BTN_GAP_RIGHT;
    const btnRadius = BTN_RADIUS;
    const labels: { kind?: HubButtonKind; slot?: IconSlot; text: string; cb: () => void }[] = [
      { kind: 'shop', slot: 'hub_shop', text: 'Cửa Hàng', cb: this.callbacks.onShop },
      { slot: 'hub_daily', text: 'Quà tặng\nhàng ngày', cb: this.callbacks.onDailyReward },
      { slot: 'hub_event', text: 'Sự Kiện', cb: this.callbacks.onEvents },
    ];
    labels.forEach((item, i) => {
      if (item.kind) {
        this.addMetallicHubButton(cx, startY + i * gap, btnRadius, item.kind, item.text.replace(/\n/g, ' '), () => {
          soundManager.playUiClick();
          item.cb();
        }, false, item.slot);
      } else if (item.slot) {
        this.addSlotIconButton(cx, startY + i * gap, btnRadius, item.slot, item.text, () => {
          soundManager.playUiClick();
          item.cb();
        });
      } else {
        this.addRoundButton(cx, startY + i * gap, btnRadius, item.text, () => {
          soundManager.playUiClick();
          item.cb();
        });
      }
    });
  }

  private buildBottomBar(): void {
    const y = GAME_HEIGHT - 74;
    const startX = 72;
    const gap = BTN_GAP_BOTTOM - 8;
    const btnRadius = BTN_RADIUS;
    const ch1Done = GameState.getInstance().isChapter1Complete();
    const items: { kind?: HubButtonKind; slot?: IconSlot; label: string; cb: () => void }[] = [
      ...(ch1Done ? [{ slot: 'hub_forge' as IconSlot, label: 'Luyện Khí', cb: this.callbacks.onForge }] : []),
      { kind: 'inventory', slot: 'hub_inventory', label: 'Túi Đồ', cb: this.callbacks.onInventory },
      ...(ch1Done ? [{ slot: 'hub_meditate' as IconSlot, label: 'Tu Luyện', cb: this.callbacks.onMeditate }] : []),
      { slot: 'skill_martial', label: 'Võ Kỹ', cb: this.callbacks.onSkills },
    ];
    items.forEach((item, i) => {
      if (item.kind) {
        this.addMetallicHubButton(startX + i * gap, y, btnRadius, item.kind, item.label.replace(/\n/g, ' '), () => {
          soundManager.playUiClick();
          item.cb();
        }, false, item.slot);
      } else if (item.slot) {
        const btn = this.addSlotIconButton(startX + i * gap, y, btnRadius, item.slot, item.label.replace(/\n/g, ' '), () => {
          soundManager.playUiClick();
          item.cb();
        });
        if (item.slot === 'skill_martial') {
          this.skillButton = btn;
        }
      } else {
        this.addRoundButton(startX + i * gap, y, btnRadius, item.label, () => {
          soundManager.playUiClick();
          item.cb();
        });
      }
    });

    const mapX = HUB_MAP_BUTTON_X;
    const mapY = HUB_MAP_BUTTON_Y;
    this.mapButton = this.addMetallicHubButton(mapX, mapY, HUB_MAP_BUTTON_RADIUS, 'map', 'Bản Đồ', () => {
      soundManager.playUiClick();
      this.callbacks.onMap();
    }, false, 'hub_map');
  }

  isMapGuideActive(): boolean {
    return this.mapGuideOverlay?.visible ?? false;
  }

  /** Hướng dẫn lần đầu sau tutorial — mũi tên chỉ nút Bản Đồ. */
  showMapEntryGuide(): void {
    if (!this.mapButton || this.mapGuideOverlay) return;

    this.mapGuideOverlay = new BattleGuideOverlay(this.scene);
    const spotlightR = HUB_MAP_BUTTON_RADIUS + 34;
    this.mapGuideOverlay.show({
      step: 'fightNow',
      spotlight: {
        x: HUB_MAP_BUTTON_X,
        y: HUB_MAP_BUTTON_Y - 6,
        width: spotlightR * 2,
        height: spotlightR * 2,
        shape: 'circle',
        radius: spotlightR,
      },
      instruction: 'Ấn vào bản đồ để vượt ải và thu thập đồng đội.',
      arrow: {
        fromX: HUB_MAP_BUTTON_X - 300,
        fromY: HUB_MAP_BUTTON_Y - 150,
        toX: HUB_MAP_BUTTON_X - HUB_MAP_BUTTON_RADIUS - 6,
        toY: HUB_MAP_BUTTON_Y - 24,
      },
    });
    this.liftMapButtonForGuide();
  }

  dismissMapEntryGuide(): void {
    this.mapGuideOverlay?.hide();
    this.mapGuideOverlay?.destroy();
    this.mapGuideOverlay = undefined;
    this.restoreMapButtonFromGuide();
  }

  /** Hướng dẫn bấm nút Võ Kỹ — bước 3 hướng dẫn trang bị võ kỹ. */
  showSkillButtonGuide(): void {
    if (!this.skillButton || this.skillGuideOverlay) return;

    const matrix = this.skillButton.getWorldTransformMatrix();
    const btnX = matrix.tx;
    const btnY = matrix.ty;

    this.skillGuideOverlay = new BattleGuideOverlay(this.scene);
    const spotlightR = BTN_RADIUS + 34;
    this.skillGuideOverlay.show({
      step: 'fightNow',
      spotlight: {
        x: btnX,
        y: btnY - 6,
        width: spotlightR * 2,
        height: spotlightR * 2,
        shape: 'circle',
        radius: spotlightR,
      },
      instruction: 'Ấn vào nút Võ Kỹ.',
      arrow: {
        fromX: btnX + 200,
        fromY: btnY - 140,
        toX: btnX + BTN_RADIUS + 8,
        toY: btnY - 20,
      },
    });
    this.liftSkillButtonForGuide();
  }

  dismissSkillButtonGuide(): void {
    this.skillGuideOverlay?.hide();
    this.skillGuideOverlay?.destroy();
    this.skillGuideOverlay = undefined;
    this.restoreSkillButtonFromGuide();
  }

  private liftSkillButtonForGuide(): void {
    if (!this.skillButton || this.skillButtonLifted) return;
    const guideDepth = UI_THEME.depth.overlay + 25;
    const btn = this.skillButton;
    const matrix = btn.getWorldTransformMatrix();
    this.remove(btn, false);
    this.scene.add.existing(btn);
    btn.setPosition(matrix.tx, matrix.ty);
    btn.setDepth(guideDepth);
    this.skillButtonLifted = true;
  }

  restoreSkillButtonFromGuide(): void {
    if (!this.skillButton || !this.skillButtonLifted) return;
    const btn = this.skillButton;
    const matrix = btn.getWorldTransformMatrix();
    btn.removeFromDisplayList();
    this.add(btn);
    btn.setPosition(matrix.tx, matrix.ty);
    btn.setDepth(0);
    btn.setScale(1);
    this.skillButtonLifted = false;
  }

  private liftMapButtonForGuide(): void {
    if (!this.mapButton || this.mapButtonLifted) return;
    const guideDepth = UI_THEME.depth.overlay + 25;
    const btn = this.mapButton;
    const matrix = btn.getWorldTransformMatrix();
    this.remove(btn, false);
    this.scene.add.existing(btn);
    btn.setPosition(matrix.tx, matrix.ty);
    btn.setDepth(guideDepth);
    this.mapButtonLifted = true;
  }

  private restoreMapButtonFromGuide(): void {
    if (!this.mapButton || !this.mapButtonLifted) return;
    const btn = this.mapButton;
    btn.removeFromDisplayList();
    this.add(btn);
    btn.setPosition(HUB_MAP_BUTTON_X, HUB_MAP_BUTTON_Y);
    btn.setDepth(0);
    btn.setScale(1);
    this.mapButtonLifted = false;
  }

  private buildHeroCenter(): void {
    this.heroSlot = this.scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
    this.add(this.heroSlot);
  }

  private createLabelBadge(label: string, y: number): Phaser.GameObjects.Container {
    const wrap = this.scene.add.container(0, y);
    const txt = this.scene.add.text(0, 0, label, {
      fontFamily: HUB_LABEL_FONT,
      fontSize: HUB_LABEL_SIZE,
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
      stroke: HUB_TEXT_STROKE,
      strokeThickness: HUB_LABEL_STROKE,
      lineSpacing: 2,
    }).setOrigin(0.5);
    const w = txt.width + HUB_LABEL_BADGE_PAD_X * 2;
    const h = txt.height + HUB_LABEL_BADGE_PAD_Y * 2;
    const pill = this.scene.add.graphics();
    pill.fillStyle(0x000000, 0.75);
    pill.fillRoundedRect(-w / 2, -h / 2, w, h, HUB_LABEL_BADGE_RADIUS);
    wrap.add([pill, txt]);
    return wrap;
  }

  private mountJadeHubButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    options: {
      slot?: IconSlot;
      textureKey?: string;
      coloredIcon?: boolean;
      spiritSlot?: IconSlot;
      buttonRadius?: number;
      iconTint?: number;
    } = {},
  ): Phaser.GameObjects.Container {
    const btn = this.scene.add.container(x, y);
    const radius = options.buttonRadius ?? BTN_RADIUS;
    const iconPx = options.buttonRadius ? JADE_ICON_PX + (radius - BTN_RADIUS) : JADE_ICON_PX;
    const discSize = radius * 2;
    const discKey = ASSET_KEYS.uiJadeDisc;

    if (!this.scene.textures.exists(discKey)) {
      const btn = this.scene.add.container(x, y);
      const circle = this.scene.add.circle(0, 0, radius, HUB_BTN, 1).setStrokeStyle(3, HUB_ORANGE);
      const badge = this.createLabelBadge(label, radius + 16);
      const hit = this.scene.add.circle(0, 0, radius, 0xffffff, 0.001);
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => btn.setScale(JADE_HOVER_SCALE));
      hit.on('pointerout', () => btn.setScale(1));
      hit.on('pointerdown', onClick);
      btn.add([circle, badge, hit]);
      btn.bringToTop(hit);
      this.add(btn);
      return btn;
    }

    const disc = this.scene.add.image(0, 0, discKey).setDisplaySize(discSize, discSize);

    let icon: Phaser.GameObjects.Image | null = null;
    let maskGfx: Phaser.GameObjects.Graphics | undefined;

    if (options.slot) {
      icon = createStyledIcon(this.scene, 0, 0, options.slot, iconPx);
      if (icon) {
        maskGfx = applyIconCircleMask(this.scene, icon, 0, 0, iconPx * 0.46);
        maskGfx.setVisible(false);
      }
    } else if (options.textureKey && this.scene.textures.exists(options.textureKey)) {
      icon = this.scene.add.image(0, 0, options.textureKey).setDisplaySize(iconPx, iconPx);
      if (options.iconTint !== undefined) {
        icon.setBlendMode(Phaser.BlendModes.ADD);
        icon.setTint(options.iconTint);
        maskGfx = applyIconCircleMask(this.scene, icon, 0, 0, iconPx * 0.46);
        maskGfx.setVisible(false);
      } else if (options.spiritSlot) {
        applyGameIconStyle(icon, options.spiritSlot);
        maskGfx = applyIconCircleMask(this.scene, icon, 0, 0, iconPx * 0.46);
        maskGfx.setVisible(false);
      }
    }

    const badge = this.createLabelBadge(label, radius + 16);
    const hit = this.scene.add.circle(0, 0, radius, 0xffffff, 0.001);

    const setHovered = (hovered: boolean) => {
      btn.setScale(hovered ? JADE_HOVER_SCALE : 1);
    };

    hit.setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => setHovered(true));
    hit.on('pointerout', () => setHovered(false));
    hit.on('pointerdown', onClick);

    const parts: Phaser.GameObjects.GameObject[] = [disc];
    if (icon) parts.push(icon);
    if (maskGfx) parts.push(maskGfx);
    parts.push(badge, hit);
    btn.add(parts);
    btn.bringToTop(hit);
    this.add(btn);
    return btn;
  }

  private addRoundButton(
    x: number,
    y: number,
    _radius: number,
    label: string,
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    return this.mountJadeHubButton(x, y, label, onClick);
  }

  private addMetallicHubButton(
    x: number,
    y: number,
    _radius: number,
    kind: HubButtonKind,
    label: string,
    onClick: () => void,
    _large = false,
    iconSlot?: IconSlot,
  ): Phaser.GameObjects.Container {
    const slot = iconSlot ?? hubKindToIconSlot(kind);
    const displayLabel = label || HUB_KIND_LABELS[kind];

    if (kind === 'shop' && this.scene.textures.exists(ASSET_KEYS.uiIconShop)) {
      return this.mountJadeHubButton(x, y, displayLabel, onClick, {
        textureKey: ASSET_KEYS.uiIconShop,
        spiritSlot: 'hub_shop',
      });
    }

    if (kind === 'map' && this.scene.textures.exists(HUB_MAP_WORLD_ICON)) {
      return this.mountJadeHubButton(x, y, displayLabel, onClick, {
        textureKey: HUB_MAP_WORLD_ICON,
        iconTint: 0xffffff,
        buttonRadius: HUB_MAP_BUTTON_RADIUS,
      });
    }

    const info = getResolvedIcon(slot);

    if (info && this.scene.textures.exists(info.key)) {
      return this.mountJadeHubButton(x, y, displayLabel, onClick, { slot });
    }

    return this.mountJadeHubButton(x, y, displayLabel, onClick);
  }

  private addSlotIconButton(
    x: number,
    y: number,
    _radius: number,
    slot: IconSlot,
    label: string,
    onClick: () => void,
    _large = false,
  ): Phaser.GameObjects.Container {
    const displayLabel = label || ICON_SLOT_LABELS[slot] || '—';
    const info = getResolvedIcon(slot);

    if (info && this.scene.textures.exists(info.key)) {
      return this.mountJadeHubButton(x, y, displayLabel, onClick, { slot });
    }

    return this.mountJadeHubButton(x, y, displayLabel, onClick);
  }

  private addIconRoundButton(
    x: number,
    y: number,
    _radius: number,
    kind: HubButtonKind,
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    return this.addMetallicHubButton(x, y, _radius, kind, HUB_KIND_LABELS[kind], onClick, false, hubKindToIconSlot(kind));
  }
}
