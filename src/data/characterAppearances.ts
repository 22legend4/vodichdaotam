import type { WeaponType } from '../types/game.ts';

export type CharacterGender = 'nam' | 'nu';

/** ID ngoại hình: nam_1 … nam_8, nu_1 … nu_8 */
export type CharacterAppearanceId = `${CharacterGender}_${number}`;

/** Số ngoại hình chọn khi tạo nhân vật ban đầu (mỗi giới). */
export const CREATOR_APPEARANCE_SLOTS = 4;

/** Tổng slot ngoại hình mỗi giới — slot 5–8 dành cho đồng đội (theo vũ khí). */
export const APPEARANCE_SLOTS_PER_GENDER = 8;

/** Slot PNG đồng đội: 5–8 (không dùng 1–4 của màn tạo nhân vật). */
export const COMPANION_APPEARANCE_SLOT_MIN = 5;

/** @deprecated Slot cố định theo vũ khí — dùng randomCompanionAppearanceId khi cấp đồng đội. */
export const WEAPON_COMPANION_APPEARANCE_SLOT: Record<WeaponType, number> = {
  dao: 5,
  kiem: 6,
  quyen: 7,
  thuong: 8,
};

export interface CharacterAppearanceDef {
  id: CharacterAppearanceId;
  gender: CharacterGender;
  slot: number;
  label: string;
  /** Đường dẫn PNG trong public/ (null = chưa upload) */
  idleFile: string | null;
  attackFile: string | null;
  /** Hiển thị trong màn tạo nhân vật ban đầu. */
  creatorSelectable: boolean;
}

function charPath(gender: CharacterGender, slot: number, kind: 'idle' | 'attack'): string {
  return `/assets/characters/${gender}/${slot}-${kind}.png`;
}

function slotDef(
  gender: CharacterGender,
  slot: number,
  creatorSelectable: boolean,
): CharacterAppearanceDef {
  const id = `${gender}_${slot}` as CharacterAppearanceId;
  return {
    id,
    gender,
    slot,
    label: `${gender === 'nam' ? 'Nam' : 'Nữ'} ${slot}`,
    idleFile: charPath(gender, slot, 'idle'),
    attackFile: charPath(gender, slot, 'attack'),
    creatorSelectable,
  };
}

/** 16 slot (8 nam + 8 nữ). Slot 1–4: tạo nhân vật; 5–8: đồng đội theo vũ khí. */
export const CHARACTER_APPEARANCES: CharacterAppearanceDef[] = [
  slotDef('nam', 1, true),
  slotDef('nam', 2, true),
  slotDef('nam', 3, true),
  slotDef('nam', 4, true),
  slotDef('nam', 5, false),
  slotDef('nam', 6, false),
  slotDef('nam', 7, false),
  slotDef('nam', 8, false),
  slotDef('nu', 1, true),
  slotDef('nu', 2, true),
  slotDef('nu', 3, true),
  slotDef('nu', 4, true),
  slotDef('nu', 5, false),
  slotDef('nu', 6, false),
  slotDef('nu', 7, false),
  slotDef('nu', 8, false),
];

export function isAppearanceAvailable(def: CharacterAppearanceDef): boolean {
  return def.idleFile !== null;
}

export function isCreatorAppearance(def: CharacterAppearanceDef): boolean {
  return def.creatorSelectable && def.slot >= 1 && def.slot <= CREATOR_APPEARANCE_SLOTS;
}

export function getAppearancesForGender(gender: CharacterGender): CharacterAppearanceDef[] {
  return CHARACTER_APPEARANCES.filter((a) => a.gender === gender);
}

/** 4 ngoại hình chọn được khi tạo nhân vật (Nam/Nữ). */
export function getCreatorAppearancesForGender(gender: CharacterGender): CharacterAppearanceDef[] {
  return getAppearancesForGender(gender).filter(isCreatorAppearance);
}

export function getAppearanceById(id: string): CharacterAppearanceDef | undefined {
  return CHARACTER_APPEARANCES.find((a) => a.id === id);
}

export function defaultAppearanceForGender(gender: CharacterGender): CharacterAppearanceId {
  const first = getCreatorAppearancesForGender(gender).find(isAppearanceAvailable);
  return first?.id ?? (`${gender}_1` as CharacterAppearanceId);
}

/** Ngoại hình đồng đội theo vũ khí ngẫu nhiên (slot 5–8). */
export function appearanceIdForWeapon(
  gender: CharacterGender,
  weapon: WeaponType,
): CharacterAppearanceId {
  const slot = WEAPON_COMPANION_APPEARANCE_SLOT[weapon];
  return `${gender}_${slot}` as CharacterAppearanceId;
}

export function randomCompanionWeapon(random: () => number = Math.random): WeaponType {
  const weapons: WeaponType[] = ['dao', 'kiem', 'quyen', 'thuong'];
  return weapons[Math.floor(random() * weapons.length)]!;
}

export function randomCompanionGender(random: () => number = Math.random): CharacterGender {
  return random() < 0.5 ? 'nam' : 'nu';
}

/** Ngoại hình đồng đội — slot 5–8, không dùng slot 1–4. */
export function randomCompanionAppearanceId(
  gender: CharacterGender,
  random: () => number = Math.random,
): CharacterAppearanceId {
  const slot = COMPANION_APPEARANCE_SLOT_MIN
    + Math.floor(random() * (APPEARANCE_SLOTS_PER_GENDER - COMPANION_APPEARANCE_SLOT_MIN + 1));
  return `${gender}_${slot}` as CharacterAppearanceId;
}

export interface CompanionRandomRoll {
  gender: CharacterGender;
  weapon: WeaponType;
  appearanceId: CharacterAppearanceId;
}

/** Danh sách ngoại hình dùng cho đồng đội (slot 5–8, cả hai giới). */
export function getCompanionAppearancePool(): CharacterAppearanceId[] {
  return CHARACTER_APPEARANCES
    .filter((a) => a.slot >= COMPANION_APPEARANCE_SLOT_MIN)
    .map((a) => a.id);
}

/** Cấp ngẫu nhiên giới tính, vũ khí và ngoại hình (slot ≥ 5). */
export function rollRandomCompanion(random: () => number = Math.random): CompanionRandomRoll {
  return rollRandomCompanionExcluding(new Set(), random);
}

/**
 * Cấp đồng đội CH1 — ngoại hình không trùng với đồng đội đã có.
 * @param usedAppearanceIds Các appearanceId đã dùng (đồng đội hiện có).
 */
export function rollRandomCompanionExcluding(
  usedAppearanceIds: ReadonlySet<string>,
  random: () => number = Math.random,
): CompanionRandomRoll {
  const available = getCompanionAppearancePool().filter((id) => !usedAppearanceIds.has(id));
  if (available.length === 0) {
    throw new Error('Không còn ngoại hình đồng đội khả dụng.');
  }
  const appearanceId = available[Math.floor(random() * available.length)]!;
  const def = getAppearanceById(appearanceId)!;
  return {
    gender: def.gender,
    weapon: randomCompanionWeapon(random),
    appearanceId,
  };
}

export function isCompanionAppearanceId(id: string): boolean {
  const def = getAppearanceById(id);
  return def !== undefined && def.slot >= COMPANION_APPEARANCE_SLOT_MIN;
}

/** Migrate save cũ không có appearanceId. */
export function normalizeAppearanceId(
  appearanceId: string | undefined,
  gender: CharacterGender,
): CharacterAppearanceId {
  if (appearanceId) {
    const def = getAppearanceById(appearanceId);
    if (def && isAppearanceAvailable(def)) {
      return def.id;
    }
  }
  return defaultAppearanceForGender(gender);
}
