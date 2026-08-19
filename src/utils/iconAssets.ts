import Phaser from 'phaser';
import { ICON_MANIFEST } from '../data/iconManifest.ts';
import { ITEMS_DATA } from '../data/itemsData.ts';
import { resolveItemIconPath, resolveItemIconTint } from '../data/itemIconPaths.ts';
import type { ItemData } from '../types/game.ts';
import { ASSET_KEYS } from './AssetGenerator.ts';
import { publicIconsUrl } from './publicAssetUrl.ts';

/** Vật phẩm dùng PNG tiền tệ sảnh chính (public/assets/ui/) — hiển thị nguyên tỷ lệ, không sketch/mask. */
const HUB_UI_ITEM_ICONS: Record<string, string> = {
  cur_tinhThach: ASSET_KEYS.uiIconTinhThach,
  med_gioiThuy: ASSET_KEYS.uiIconGioiThuy,
  cur_gioiThuy: ASSET_KEYS.uiIconGioiThuy,
};

export type CurrencyUiKind = 'tinhThach' | 'gioiThuy';

export function currencyUiTextureKey(kind: CurrencyUiKind): string {
  return kind === 'tinhThach' ? ASSET_KEYS.uiIconTinhThach : ASSET_KEYS.uiIconGioiThuy;
}

/** Icon PNG tiền tệ — fit trong khung, giữ nguyên tỷ lệ gốc. */
export function createCurrencyUiIcon(
  scene: Phaser.Scene,
  x: number,
  y: number,
  kind: CurrencyUiKind,
  maxW: number,
  maxH: number = maxW,
): Phaser.GameObjects.Image | null {
  const key = currencyUiTextureKey(kind);
  if (!scene.textures.exists(key)) return null;
  const { w, h } = fitTextureDisplaySize(scene, key, maxW, maxH);
  return scene.add.image(x, y, key).setDisplaySize(w, h);
}

export function usesHubUiItemIcon(itemId: string): boolean {
  return itemId in HUB_UI_ITEM_ICONS;
}

/** Scale PNG vào khung maxW×maxH, giữ nguyên tỷ lệ (contain). */
export function fitTextureDisplaySize(
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

/** Slot icon trong game — ghép từ tên file PNG. */
export type IconSlot =
  | 'hub_meditate'
  | 'hub_forge'
  | 'skill_martial'
  | 'item_medicine'
  | 'hub_inventory'
  | 'hub_settings'
  | 'equip_gear'
  | 'beast_pet'
  | 'hub_event'
  | 'hub_daily'
  | 'hub_map'
  | 'hub_shop'
  | 'hub_character';

export interface ResolvedIcon {
  slot: IconSlot;
  key: string;
  path: string;
  score: number;
}

/** Icon cố định cho slot — ưu tiên hơn ghép tự động từ manifest. */
const SLOT_ICON_OVERRIDES: Partial<Record<IconSlot, string>> = {
  skill_martial: 'lorc/fist.png',
  hub_daily: 'delapouite/present.png',
};

export function itemIconTextureKey(item: ItemData): string {
  const path = resolveItemIconPath(item);
  if (!path) return '';
  return iconPathTextureKey(path);
}

/** Texture key ổn định cho path PNG trong public/assets/icons/. */
export function iconPathTextureKey(path: string): string {
  return `icon_path_${path.replace(/[^a-zA-Z0-9]+/g, '_')}`;
}

/** Icon kinh nghiệm trên HUD sảnh chính. */
export const HUB_EXP_ICON_PATH = 'lorc/burning-passion.png';

/** Icon bút sửa tên trên màn đội hình. */
export const ROSTER_RENAME_PEN_ICON_PATH = 'delapouite/pencil.png';

export function queueHubStatIconLoads(scene: Phaser.Scene): void {
  scene.load.image(iconPathTextureKey(HUB_EXP_ICON_PATH), publicIconsUrl(HUB_EXP_ICON_PATH));
  scene.load.image(
    iconPathTextureKey(ROSTER_RENAME_PEN_ICON_PATH),
    publicIconsUrl(ROSTER_RENAME_PEN_ICON_PATH),
  );
}

/** BootScene.preload — nạp icon PNG (dedupe theo path, không theo itemId). */
export function queueItemIconLoads(scene: Phaser.Scene): void {
  const queuedPaths = new Set<string>();
  for (const item of ITEMS_DATA) {
    const path = resolveItemIconPath(item);
    if (!path || queuedPaths.has(path)) continue;
    queuedPaths.add(path);
    scene.load.image(itemIconTextureKey({ ...item, iconPath: path }), publicIconsUrl(path));
  }
  if (queuedPaths.size > 0) {
    console.log(`[iconAssets] Queue ${queuedPaths.size} unique item icon path(s)`);
  }
}

/** Tạo icon vật phẩm đã load — ADD blend + tint riêng từng item. */
export function createItemIcon(
  scene: Phaser.Scene,
  x: number,
  y: number,
  item: ItemData,
  displaySize: number,
): Phaser.GameObjects.Image | null {
  const uiKey = HUB_UI_ITEM_ICONS[item.id];
  if (uiKey && scene.textures.exists(uiKey)) {
    const { w, h } = fitTextureDisplaySize(scene, uiKey, displaySize, displaySize);
    return scene.add.image(x, y, uiKey).setDisplaySize(w, h);
  }

  const key = itemIconTextureKey(item);
  if (!key || !scene.textures.exists(key)) return null;

  const img = scene.add.image(x, y, key).setDisplaySize(displaySize, displaySize);
  img.setBlendMode(Phaser.BlendModes.ADD);
  img.setTint(resolveItemIconTint(item));
  return img;
}

/** Từ khóa theo nhóm — ưu tiên khớp dài hơn. */
const SLOT_KEYWORDS: Record<IconSlot, string[]> = {
  hub_meditate: ['yin-yang', 'meditation', 'lotus', 'zen'],
  hub_forge: ['sword', 'blade', 'spear', 'slashing', 'fist', 'shield'],
  skill_martial: ['sword', 'blade', 'spear', 'fist', 'shield', 'slashing'],
  item_medicine: ['flask', 'vial', 'potion', 'pill', 'herb'],
  hub_inventory: ['knapsack', 'crate', 'bag'],
  hub_settings: ['gear', 'cog'],
  equip_gear: ['armor', 'boots', 'hood'],
  beast_pet: ['dragon', 'wolf', 'fox'],
  hub_event: ['gift', 'trophy'],
  hub_daily: ['present', 'gift', 'wrapped'],
  hub_map: ['scroll', 'map'],
  hub_shop: ['gift', 'crate', 'bag'],
  hub_character: ['hood', 'armor', 'wolf'],
};

/** Màu Linh Khí — Mẫu 3 Ngọc Bích. */
const ICON_TINTS: Record<IconSlot, number> = {
  hub_meditate: 0x00eeee,
  hub_forge: 0xffd700,
  skill_martial: 0xff8888,
  item_medicine: 0x88ffaa,
  hub_inventory: 0xffa500,
  hub_settings: 0xf3e5ab,
  equip_gear: 0xc9b896,
  beast_pet: 0xffaacc,
  hub_event: 0xffcc00,
  hub_daily: 0xff9966,
  hub_map: 0x9933ff,
  hub_shop: 0xff3366,
  hub_character: 0x50c878,
};

let resolvedIcons = new Map<IconSlot, ResolvedIcon>();

function iconTextureKey(slot: IconSlot): string {
  return `icon_ext_${slot}`;
}

function scoreFileName(filePath: string, keywords: string[]): number {
  const base = filePath.replace(/\\/g, '/').split('/').pop()?.toLowerCase() ?? '';
  const stem = base.replace(/\.png$/i, '');
  let score = 0;
  for (const kw of keywords) {
    if (stem.includes(kw)) score += kw.length * 10;
  }
  return score;
}

/** Ghép icon phù hợp nhất cho từng slot (mỗi file chỉ dùng 1 lần). */
export function resolveIconMatches(manifest: string[] = ICON_MANIFEST): Map<IconSlot, ResolvedIcon> {
  const slots = Object.keys(SLOT_KEYWORDS) as IconSlot[];
  const candidates = [];
  const usedFiles = new Set<string>();
  const result = new Map<IconSlot, ResolvedIcon>();

  for (const slot of slots) {
    const overridePath = SLOT_ICON_OVERRIDES[slot];
    if (overridePath && manifest.includes(overridePath)) {
      usedFiles.add(overridePath);
      result.set(slot, {
        slot,
        key: iconTextureKey(slot),
        path: overridePath,
        score: 9999,
      });
    }
  }

  for (const slot of slots) {
    for (const file of manifest) {
      const score = scoreFileName(file, SLOT_KEYWORDS[slot]);
      if (score > 0) {
        candidates.push({ slot, file, score });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  for (const c of candidates) {
    if (result.has(c.slot) || usedFiles.has(c.file)) continue;
    usedFiles.add(c.file);
    result.set(c.slot, {
      slot: c.slot,
      key: iconTextureKey(c.slot),
      path: c.file,
      score: c.score,
    });
  }

  resolvedIcons = result;
  return result;
}

export function getResolvedIcon(slot: IconSlot): ResolvedIcon | undefined {
  return resolvedIcons.get(slot);
}

export function hasExternalIcon(slot: IconSlot, scene?: Phaser.Scene): boolean {
  const info = resolvedIcons.get(slot);
  if (!info) return false;
  return scene ? scene.textures.exists(info.key) : true;
}

/** BootScene.preload — nạp PNG từ public/assets/icons/... */
export function queueExternalIconLoads(scene: Phaser.Scene): Map<IconSlot, ResolvedIcon> {
  const matches = resolveIconMatches();
  for (const { key, path } of matches.values()) {
    scene.load.image(key, publicIconsUrl(path));
  }
  if (matches.size > 0) {
    console.log(`[iconAssets] Queue ${matches.size} external icon(s)`);
  }
  return matches;
}

/** Lọc nền đen Game-icons + tint theo slot. */
export function applyGameIconStyle(
  target: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
  slot: IconSlot,
): void {
  target.setBlendMode(Phaser.BlendModes.ADD);
  target.setTint(ICON_TINTS[slot] ?? 0xffffff);
}

/** Cắt halo vuông ADD — mask cùng container với icon. */
export function applyIconCircleMask(
  scene: Phaser.Scene,
  img: Phaser.GameObjects.Image,
  x: number,
  y: number,
  radius: number,
): Phaser.GameObjects.Graphics {
  const maskGfx = scene.add.graphics();
  maskGfx.fillStyle(0xffffff, 1);
  maskGfx.fillCircle(x, y, radius);
  maskGfx.setVisible(false);
  img.setMask(maskGfx.createGeometryMask());
  return maskGfx;
}

/** Tạo image icon đã áp dụng ADD + tint. */
export function createStyledIcon(
  scene: Phaser.Scene,
  x: number,
  y: number,
  slot: IconSlot,
  displaySize: number,
): Phaser.GameObjects.Image | null {
  const info = resolvedIcons.get(slot);
  if (!info || !scene.textures.exists(info.key)) return null;

  const img = scene.add.image(x, y, info.key).setDisplaySize(displaySize, displaySize);
  applyGameIconStyle(img, slot);
  return img;
}

/** Map nút sảnh chính → slot icon. */
export function getExternalIconTextureKey(slot: IconSlot): string | null {
  return getResolvedIcon(slot)?.key ?? null;
}

export function hubKindToIconSlot(kind: import('./assetDrawUi.ts').HubButtonKind): IconSlot {
  switch (kind) {
    case 'settings': return 'hub_settings';
    case 'inventory': return 'hub_inventory';
    case 'map': return 'hub_map';
    case 'shop': return 'hub_shop';
    case 'character': return 'hub_character';
    default: return 'hub_character';
  }
}

export function resolveItemTypeIconSlot(itemType: string, equipSlot?: string): IconSlot | null {
  if (itemType === 'medicine') return 'item_medicine';
  if (itemType === 'beast' || equipSlot === 'pet') return 'beast_pet';
  if (itemType === 'equipment') return 'equip_gear';
  return null;
}
