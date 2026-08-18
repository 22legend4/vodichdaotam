import type { BaseStats, CharacterData, ItemData, RealmLevel, WeaponType } from '../types/game.ts';
import {
  COMBAT_CONSTANTS,
  DEFAULT_BASE_STATS,
  INITIAL_FREE_STAT_POINTS,
  REALM_EXP_REQUIREMENTS,
  REALM_STAT_POINTS,
  buildBaseStatsFromAllocation,
  addBaseStats,
} from '../constants/gameRules.ts';
import { calculateMaxHp } from '../utils/damageCalculator.ts';
import {
  isCompanionAppearanceId,
  normalizeAppearanceId,
  type CharacterAppearanceId,
} from '../data/characterAppearances.ts';
import {
  WEAPON_BASIC_SKILL,
  canLearnSkill,
  getSkillById,
  sumLearnedSkillStats,
  buildBattleSkillIds,
  resolveBattleSkillIdsFromLoadout,
  isRemovedSkill,
  BATTLE_SKILL_SLOT_COUNT,
} from '../data/skillsData.ts';
import { REALM_LABELS } from '../ui/theme.ts';

export const SKILL_POINTS_PER_REALM = 3;

export const REALM_ORDER: RealmLevel[] = [
  'LuyenThe',
  'NhatTinh',
  'NhiTinh',
  'TamTinh',
  'VanNhien',
  'TienLinh',
  'GiapLinh',
  'CuLinh',
  'Hoang',
  'Huyen',
  'Dia',
  'Thien',
];

export interface ComputedCharacterStats {
  totalAtk: number;
  totalDef: number;
  maxHp: number;
  maxQi: number;
  equipmentStats: BaseStats;
  petStats: BaseStats;
  skillStats: Pick<BaseStats, 'atk' | 'def'>;
}

export interface CombatStatBreakdown {
  baseAtk: number;
  baseDef: number;
  hpStat: number;
  maxHp: number;
  maxQi: number;
  equipmentStats: BaseStats;
  petStats: BaseStats;
  skillStats: Pick<BaseStats, 'atk' | 'def'>;
}

export interface CreateMainCharacterInput {
  name: string;
  gender: 'nam' | 'nu';
  appearanceId: string;
  weaponType: WeaponType;
  statAllocation: BaseStats;
}

export interface CompanionUnlockDef {
  id: string;
  unlockStageId: '1A' | '1B' | '1C' | '1D';
}

export interface CreateCompanionInput {
  companionId: string;
  name: string;
  gender: 'nam' | 'nu';
  weaponType: WeaponType;
  appearanceId: CharacterAppearanceId;
  statAllocation: BaseStats;
}

/** 4 đồng đội giải cứu tại cửa 1A–1D — tên/chỉ số do người chơi chọn, vũ khí ngẫu nhiên. */
export const COMPANION_UNLOCKS: CompanionUnlockDef[] = [
  { id: 'companion_1a', unlockStageId: '1A' },
  { id: 'companion_1b', unlockStageId: '1B' },
  { id: 'companion_1c', unlockStageId: '1C' },
  { id: 'companion_1d', unlockStageId: '1D' },
];

/** @deprecated Dùng COMPANION_UNLOCKS */
export const COMPANION_TEMPLATES = COMPANION_UNLOCKS;

export interface CharacterMeta {
  isMainCharacter: boolean;
  pendingStatPoints: number;
  /** Điểm võ kỹ chưa dùng. */
  skillPoints: number;
  /** ID võ kỹ đã mua. */
  learnedSkillIds: string[];
  /** 4 ô võ kỹ mang vào trận (null = trống). */
  battleSkillLoadout?: (string | null)[];
  /** Đã mở nhánh võ kỹ chuyển sinh (Huyết Long Trì hoặc Chuyển sinh tại Cổng dịch chuyển). */
  hasReincarnated?: boolean;
}

export interface BreakthroughResult {
  success: boolean;
  previousRealm?: RealmLevel;
  newRealm?: RealmLevel;
  statPointsGained: number;
  skillPointsGained: number;
  shouldRestoreStamina: boolean;
  message: string;
}

export function getCompanionIdByUnlockStage(
  unlockStageId: CompanionUnlockDef['unlockStageId'],
): string | undefined {
  return COMPANION_UNLOCKS.find((c) => c.unlockStageId === unlockStageId)?.id;
}

function emptyEquipment(): CharacterData['equipment'] {
  return { head: null, body: null, weapon: null, feet: null, pet: null };
}

function sumStats(stats: BaseStats): number {
  return stats.hp + stats.atk + stats.def + stats.qi;
}

export function validateCharacterName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 15;
}

export function validateInitialAllocation(allocation: BaseStats): boolean {
  return (
    allocation.hp >= 0 &&
    allocation.atk >= 0 &&
    allocation.def >= 0 &&
    allocation.qi >= 0 &&
    sumStats(allocation) === INITIAL_FREE_STAT_POINTS
  );
}

export function getNextRealm(current: RealmLevel): RealmLevel | null {
  const index = REALM_ORDER.indexOf(current);
  if (index < 0 || index >= REALM_ORDER.length - 1) {
    return null;
  }
  return REALM_ORDER[index + 1]!;
}

export function isRealmAtLeast(realm: RealmLevel, minimum: RealmLevel): boolean {
  return REALM_ORDER.indexOf(realm) >= REALM_ORDER.indexOf(minimum);
}

export function getEquipmentAndPetStats(
  character: CharacterData,
  getItemById: (id: string) => ItemData | undefined,
): { equipmentStats: BaseStats; petStats: BaseStats } {
  const equipmentStats: BaseStats = { hp: 0, atk: 0, def: 0, qi: 0 };
  const petStats: BaseStats = { hp: 0, atk: 0, def: 0, qi: 0 };

  for (const [slot, itemId] of Object.entries(character.equipment)) {
    if (!itemId) continue;
    const item = getItemById(itemId);
    if (!item) continue;

    const target = slot === 'pet' ? petStats : equipmentStats;
    target.hp += item.hp;
    target.atk += item.atk;
    target.def += item.def;
    target.qi += item.qi;
  }

  return { equipmentStats, petStats };
}

/** Tổng công/thủ/máu/Qi cho nhân vật (base + trang bị + yêu thú). Võ kỹ chỉ cộng khi ra chiêu. */
export function buildCombatStatBreakdown(
  character: CharacterData,
  getItemById: (id: string) => ItemData | undefined,
  learnedSkillIds: string[] = [],
): CombatStatBreakdown {
  const { equipmentStats, petStats } = getEquipmentAndPetStats(character, getItemById);
  const skillBonuses = sumLearnedSkillStats(learnedSkillIds);
  const skillStats = { hp: 0, atk: skillBonuses.atk, def: skillBonuses.def, qi: 0 };
  const hpStat =
    character.baseStats.hp +
    equipmentStats.hp +
    petStats.hp;
  return {
    baseAtk:
      character.baseStats.atk +
      equipmentStats.atk +
      petStats.atk,
    baseDef:
      character.baseStats.def +
      equipmentStats.def +
      petStats.def,
    hpStat,
    maxHp: calculateMaxHp(hpStat),
    maxQi:
      character.baseStats.qi +
      equipmentStats.qi +
      petStats.qi,
    equipmentStats,
    petStats,
    skillStats,
  };
}

export function computeCharacterStats(
  character: CharacterData,
  getItemById: (id: string) => ItemData | undefined,
  learnedSkillIds: string[] = [],
): ComputedCharacterStats {
  const breakdown = buildCombatStatBreakdown(character, getItemById, learnedSkillIds);
  return {
    totalAtk: breakdown.baseAtk,
    totalDef: breakdown.baseDef,
    maxHp: breakdown.maxHp,
    maxQi: breakdown.maxQi,
    equipmentStats: breakdown.equipmentStats,
    petStats: breakdown.petStats,
    skillStats: breakdown.skillStats,
  };
}

/** Gộp allocatedStats cũ vào baseStats khi load save legacy. */
function migrateCharacterStats(
  c: CharacterData & { allocatedStats?: BaseStats },
): CharacterData {
  if (!c.allocatedStats) {
    return c;
  }
  const { allocatedStats, ...rest } = c;
  return {
    ...rest,
    baseStats: addBaseStats(c.baseStats, allocatedStats),
  };
}

export class CharacterManager {
  private characters = new Map<string, CharacterData>();
  private meta = new Map<string, CharacterMeta>();
  private partyIds: string[] = [];
  private unlockedCompanionIds = new Set<string>();
  private mainCharacterId: string | null = null;

  createMainCharacter(input: CreateMainCharacterInput): CharacterData {
    if (this.mainCharacterId) {
      throw new Error('Nhân vật chính đã được tạo.');
    }

    if (!validateCharacterName(input.name)) {
      throw new Error('Tên nhân vật phải từ 1–15 ký tự.');
    }

    if (!validateInitialAllocation(input.statAllocation)) {
      throw new Error(`Phải phân bổ đúng ${INITIAL_FREE_STAT_POINTS} điểm chỉ số ban đầu.`);
    }

    const id = `char_main_${Date.now()}`;
    const character: CharacterData = {
      id,
      name: input.name.trim(),
      gender: input.gender,
      appearanceId: normalizeAppearanceId(input.appearanceId, input.gender),
      weaponType: input.weaponType,
      baseStats: buildBaseStatsFromAllocation(input.statAllocation),
      realm: 'LuyenThe',
      exp: 0,
      currentHp: 0,
      maxHp: 0,
      currentQi: 0,
      maxQi: 0,
      equipment: emptyEquipment(),
    };

    this.characters.set(id, character);
    this.meta.set(id, {
      isMainCharacter: true,
      pendingStatPoints: 0,
      skillPoints: 0,
      learnedSkillIds: [WEAPON_BASIC_SKILL[input.weaponType]],
      battleSkillLoadout: [WEAPON_BASIC_SKILL[input.weaponType], null, null, null],
    });
    this.mainCharacterId = id;
    this.partyIds = [id];

    return character;
  }

  unlockCompanion(unlockStageId: CompanionUnlockDef['unlockStageId']): CompanionUnlockDef | null {
    const def = COMPANION_UNLOCKS.find((c) => c.unlockStageId === unlockStageId);
    if (!def) return null;
    this.unlockedCompanionIds.add(def.id);
    return def;
  }

  hasCompanionCharacter(companionId: string): boolean {
    return this.characters.has(companionId);
  }

  isCompanionUnlocked(companionId: string): boolean {
    return this.unlockedCompanionIds.has(companionId);
  }

  /** Ngoại hình đã dùng bởi đồng đội (CH1: 4 đồng đội không trùng hình). */
  getUsedCompanionAppearanceIds(): Set<string> {
    const used = new Set<string>();
    for (const [id, character] of this.characters) {
      if (id === this.mainCharacterId) continue;
      used.add(character.appearanceId);
    }
    return used;
  }

  isCompanionAppearanceTaken(appearanceId: string, exceptCompanionId?: string): boolean {
    for (const [id, character] of this.characters) {
      if (id === this.mainCharacterId || id === exceptCompanionId) continue;
      if (character.appearanceId === appearanceId) return true;
    }
    return false;
  }

  createCompanion(input: CreateCompanionInput): CharacterData {
    if (!this.unlockedCompanionIds.has(input.companionId)) {
      throw new Error('Đồng đội chưa được giải cứu.');
    }
    if (!validateCharacterName(input.name)) {
      throw new Error('Tên nhân vật phải từ 1–15 ký tự.');
    }
    if (!validateInitialAllocation(input.statAllocation)) {
      throw new Error(`Phải phân bổ đúng ${INITIAL_FREE_STAT_POINTS} điểm chỉ số ban đầu.`);
    }
    if (this.characters.has(input.companionId)) {
      throw new Error('Đồng đội đã được tuyển.');
    }
    if (this.partyIds.length >= COMBAT_CONSTANTS.MAX_TEAM_SIZE) {
      throw new Error('Đội hình đã đủ 5 người.');
    }
    if (!isCompanionAppearanceId(input.appearanceId)) {
      throw new Error('Ngoại hình đồng đội phải từ slot 5 trở lên.');
    }
    if (this.isCompanionAppearanceTaken(input.appearanceId)) {
      throw new Error('Ngoại hình này đã được đồng đội khác sử dụng.');
    }

    const character: CharacterData = {
      id: input.companionId,
      name: input.name.trim(),
      gender: input.gender,
      appearanceId: input.appearanceId,
      weaponType: input.weaponType,
      baseStats: buildBaseStatsFromAllocation(input.statAllocation),
      realm: 'LuyenThe',
      exp: 0,
      currentHp: 0,
      maxHp: 0,
      currentQi: 0,
      maxQi: 0,
      equipment: emptyEquipment(),
    };

    this.characters.set(input.companionId, character);
    this.meta.set(input.companionId, {
      isMainCharacter: false,
      pendingStatPoints: 0,
      skillPoints: 0,
      learnedSkillIds: [WEAPON_BASIC_SKILL[input.weaponType]],
      battleSkillLoadout: [WEAPON_BASIC_SKILL[input.weaponType], null, null, null],
    });
    this.partyIds.push(input.companionId);
    return character;
  }

  /** @deprecated Dùng createCompanion sau màn giải cứu. */
  recruitCompanion(companionId: string): CharacterData | null {
    if (!this.unlockedCompanionIds.has(companionId)) {
      return null;
    }
    if (this.characters.has(companionId)) {
      if (!this.partyIds.includes(companionId)) {
        this.partyIds.push(companionId);
      }
      return this.characters.get(companionId)!;
    }
    return null;
  }

  syncCharacterVitals(
    characterId: string,
    getItemById: (id: string) => ItemData | undefined,
  ): CharacterData | null {
    const character = this.characters.get(characterId);
    if (!character) return null;

    const computed = computeCharacterStats(
      character,
      getItemById,
      this.getLearnedSkillIds(characterId),
    );
    const previousMaxHp = character.maxHp;
    const previousMaxQi = character.maxQi;

    character.maxHp = computed.maxHp;
    character.maxQi = computed.maxQi;

    if (previousMaxHp === 0 && previousMaxQi === 0) {
      character.currentHp = character.maxHp;
      character.currentQi = character.maxQi;
    } else {
      if (computed.maxHp > previousMaxHp) {
        character.currentHp = character.maxHp;
      } else {
        character.currentHp = Math.min(character.currentHp, character.maxHp);
      }
      if (computed.maxQi > previousMaxQi) {
        character.currentQi = character.maxQi;
      } else {
        character.currentQi = Math.min(character.currentQi, character.maxQi);
      }
    }

    return character;
  }

  syncPartyVitals(getItemById: (id: string) => ItemData | undefined): void {
    for (const id of this.partyIds) {
      this.syncCharacterVitals(id, getItemById);
    }
  }

  getCharacter(id: string): CharacterData | undefined {
    return this.characters.get(id);
  }

  renameCharacter(characterId: string, name: string): { success: boolean; message: string } {
    const character = this.characters.get(characterId);
    if (!character) {
      return { success: false, message: 'Không tìm thấy nhân vật.' };
    }
    if (!validateCharacterName(name)) {
      return { success: false, message: 'Tên nhân vật phải từ 1–15 ký tự.' };
    }
    character.name = name.trim();
    return { success: true, message: 'Đã đổi tên nhân vật.' };
  }

  getParty(): CharacterData[] {
    return this.partyIds
      .map((id) => this.characters.get(id))
      .filter((c): c is CharacterData => c !== undefined);
  }

  getRoster(): CharacterData[] {
    return [...this.characters.values()];
  }

  getMainCharacter(): CharacterData | null {
    return this.mainCharacterId ? this.characters.get(this.mainCharacterId) ?? null : null;
  }

  getPendingStatPoints(characterId: string): number {
    return this.meta.get(characterId)?.pendingStatPoints ?? 0;
  }

  getSkillPoints(characterId: string): number {
    return this.meta.get(characterId)?.skillPoints ?? 0;
  }

  getLearnedSkillIds(characterId: string): string[] {
    return (this.meta.get(characterId)?.learnedSkillIds ?? []).filter((id) => !isRemovedSkill(id));
  }

  getBattleSkillLoadout(characterId: string): (string | null)[] {
    const meta = this.meta.get(characterId);
    const character = this.characters.get(characterId);
    if (!meta || !character) {
      return Array.from({ length: BATTLE_SKILL_SLOT_COUNT }, () => null);
    }
    return this.normalizeBattleSkillLoadout(meta, character);
  }

  /** Võ kỹ thực tế mang vào trận (theo ô người chơi chọn). */
  getResolvedBattleSkillIds(characterId: string): string[] {
    const meta = this.meta.get(characterId);
    const character = this.characters.get(characterId);
    if (!meta || !character) return [];
    return resolveBattleSkillIdsFromLoadout(
      meta.learnedSkillIds,
      character.weaponType,
      this.normalizeBattleSkillLoadout(meta, character),
    );
  }

  setBattleLoadoutSkill(
    characterId: string,
    slotIndex: number,
    skillId: string | null,
  ): { success: boolean; message: string } {
    if (slotIndex < 0 || slotIndex >= BATTLE_SKILL_SLOT_COUNT) {
      return { success: false, message: 'Ô võ kỹ không hợp lệ.' };
    }

    const meta = this.meta.get(characterId);
    const character = this.characters.get(characterId);
    if (!meta || !character) {
      return { success: false, message: 'Không tìm thấy nhân vật.' };
    }

    const loadout = this.normalizeBattleSkillLoadout(meta, character);

    if (skillId === null) {
      loadout[slotIndex] = null;
      meta.battleSkillLoadout = loadout;
      return { success: true, message: 'Đã gỡ võ kỹ khỏi ô trận đấu.' };
    }

    if (!meta.learnedSkillIds.includes(skillId)) {
      return { success: false, message: 'Chưa học võ kỹ này.' };
    }

    for (let i = 0; i < BATTLE_SKILL_SLOT_COUNT; i += 1) {
      if (i !== slotIndex && loadout[i] === skillId) loadout[i] = null;
    }
    loadout[slotIndex] = skillId;
    meta.battleSkillLoadout = loadout;

    const skill = getSkillById(skillId);
    return {
      success: true,
      message: skill ? `Đã chọn ${skill.name} vào ô ${slotIndex + 1}.` : 'Đã chọn võ kỹ.',
    };
  }

  private normalizeBattleSkillLoadout(meta: CharacterMeta, character: CharacterData): (string | null)[] {
    const slots: (string | null)[] = Array.from({ length: BATTLE_SKILL_SLOT_COUNT }, () => null);
    const source = meta.battleSkillLoadout;
    if (source?.length) {
      for (let i = 0; i < BATTLE_SKILL_SLOT_COUNT; i += 1) {
        const id = source[i] ?? null;
        slots[i] = id && !isRemovedSkill(id) ? id : null;
      }
    } else {
      const auto = buildBattleSkillIds(meta.learnedSkillIds, character.weaponType);
      for (let i = 0; i < BATTLE_SKILL_SLOT_COUNT; i += 1) {
        slots[i] = auto[i] ?? null;
      }
      meta.battleSkillLoadout = [...slots];
    }
    return slots;
  }

  private resetBattleSkillLoadout(meta: CharacterMeta, weapon: WeaponType): void {
    meta.battleSkillLoadout = [WEAPON_BASIC_SKILL[weapon], null, null, null];
  }

  hasReincarnated(characterId: string): boolean {
    return this.meta.get(characterId)?.hasReincarnated === true;
  }

  /** Chuyển sinh tại Cổng dịch chuyển — reset nhân vật chính, xóa đồng đội thu phục, mở võ kỹ chuyển sinh. */
  reincarnate(characterId: string): { success: boolean; message: string } {
    const character = this.characters.get(characterId);
    const characterMeta = this.meta.get(characterId);
    if (!character || !characterMeta) {
      return { success: false, message: 'Không tìm thấy nhân vật.' };
    }
    if (characterId !== this.mainCharacterId) {
      return { success: false, message: 'Chỉ nhân vật chính mới chuyển sinh được tại Cổng dịch chuyển.' };
    }

    const companionIds = [...this.characters.keys()].filter((id) => {
      const meta = this.meta.get(id);
      return meta && !meta.isMainCharacter;
    });
    for (const id of companionIds) {
      this.characters.delete(id);
      this.meta.delete(id);
    }
    this.unlockedCompanionIds.clear();
    this.partyIds = [characterId];

    character.realm = 'LuyenThe';
    character.exp = 0;
    character.baseStats = { ...DEFAULT_BASE_STATS };
    characterMeta.pendingStatPoints = INITIAL_FREE_STAT_POINTS;
    characterMeta.skillPoints = 3;
    characterMeta.learnedSkillIds = [WEAPON_BASIC_SKILL[character.weaponType]];
    characterMeta.hasReincarnated = true;
    this.resetBattleSkillLoadout(characterMeta, character.weaponType);

    return {
      success: true,
      message: `${character.name} đã chuyển sinh — Luyện Thể, +3 điểm võ kỹ. Mở võ kỹ ẩn Tứ Phân Quy Nguyên Khí.`,
    };
  }

  /** Huyết Long Trì — +3 điểm võ kỹ, mở nhánh võ kỹ chuyển sinh (không reset nhân vật). */
  completeHuyetLongTriTraining(characterId: string): { success: boolean; message: string } {
    const character = this.characters.get(characterId);
    const characterMeta = this.meta.get(characterId);
    if (!character || !characterMeta) {
      return { success: false, message: 'Không tìm thấy nhân vật.' };
    }
    if (characterId !== this.mainCharacterId) {
      return { success: false, message: 'Chỉ nhân vật chính mới tu luyện được tại Huyết Long Trì.' };
    }

    characterMeta.skillPoints += 3;
    characterMeta.hasReincarnated = true;

    return {
      success: true,
      message: `${character.name} hoàn thành tu luyện Huyết Long Trì — +3 điểm võ kỹ, mở võ kỹ ẩn Tứ Phân Quy Nguyên Khí.`,
    };
  }

  /** Phế võ — xóa võ kỹ đã học (giữ cơ bản), hoàn điểm võ kỹ. */
  resetSkills(characterId: string): { success: boolean; message: string } {
    const character = this.characters.get(characterId);
    const characterMeta = this.meta.get(characterId);
    if (!character || !characterMeta) {
      return { success: false, message: 'Không tìm thấy nhân vật.' };
    }

    const basic = WEAPON_BASIC_SKILL[character.weaponType];
    let refunded = 0;
    for (const skillId of characterMeta.learnedSkillIds) {
      if (skillId === basic) continue;
      const skill = getSkillById(skillId);
      if (skill) refunded += skill.skillPointCost;
    }

    characterMeta.learnedSkillIds = [basic];
    characterMeta.skillPoints += refunded;
    this.resetBattleSkillLoadout(characterMeta, character.weaponType);

    return {
      success: true,
      message: refunded > 0
        ? `Đã phế võ — thu hồi ${refunded} điểm võ kỹ.`
        : 'Không có võ kỹ nào để phế.',
    };
  }

  learnSkill(characterId: string, skillId: string): { success: boolean; message: string } {
    const character = this.characters.get(characterId);
    const characterMeta = this.meta.get(characterId);
    const skill = getSkillById(skillId);
    if (!character || !characterMeta || !skill) {
      return { success: false, message: 'Không tìm thấy nhân vật hoặc võ kỹ.' };
    }

    const check = canLearnSkill(
      skill,
      character.weaponType,
      characterMeta.learnedSkillIds,
      characterMeta.skillPoints,
      characterMeta.hasReincarnated === true,
    );
    if (!check.ok) {
      return { success: false, message: check.reason ?? 'Không thể học võ kỹ.' };
    }

    characterMeta.skillPoints -= skill.skillPointCost;
    characterMeta.learnedSkillIds.push(skillId);
    return { success: true, message: `Đã học ${skill.name}!` };
  }

  allocateStatPoints(
    characterId: string,
    stat: keyof BaseStats,
    points: number,
  ): boolean {
    if (points <= 0) return false;

    const character = this.characters.get(characterId);
    const characterMeta = this.meta.get(characterId);
    if (!character || !characterMeta) return false;
    if (characterMeta.pendingStatPoints < points) return false;

    character.baseStats[stat] += points;
    characterMeta.pendingStatPoints -= points;
    return true;
  }

  addExp(characterId: string, amount: number): void {
    const character = this.characters.get(characterId);
    if (!character || amount <= 0) return;
    character.exp += amount;
  }

  /** Cộng EXP cho mọi nhân vật trong đội (phần thưởng cửa ải). */
  addExpToParty(amount: number): void {
    if (amount <= 0) return;
    for (const member of this.getParty()) {
      this.addExp(member.id, amount);
    }
  }

  /** Tự động đột phá khi đủ EXP; trả về kết quả nếu thăng cấp. */
  tryAutoBreakthrough(characterId: string): BreakthroughResult | null {
    if (!this.canBreakthrough(characterId)) return null;
    const result = this.breakthrough(characterId);
    return result.success ? result : null;
  }

  /** Áp dụng phân bổ điểm tu luyện đang chờ. */
  applyPendingStatAllocation(characterId: string, allocation: BaseStats): boolean {
    const pending = this.getPendingStatPoints(characterId);
    const total = allocation.hp + allocation.atk + allocation.def + allocation.qi;
    if (total !== pending) return false;

    for (const stat of ['hp', 'atk', 'def', 'qi'] as const) {
      const points = allocation[stat];
      if (points <= 0) continue;
      if (!this.allocateStatPoints(characterId, stat, points)) {
        return false;
      }
    }
    return this.getPendingStatPoints(characterId) === 0;
  }

  canBreakthrough(characterId: string): boolean {
    const character = this.characters.get(characterId);
    if (!character) return false;

    const nextRealm = getNextRealm(character.realm);
    if (!nextRealm) return false;

    return character.exp >= REALM_EXP_REQUIREMENTS[nextRealm];
  }

  breakthrough(characterId: string): BreakthroughResult {
    const character = this.characters.get(characterId);
    if (!character) {
      return { success: false, statPointsGained: 0, skillPointsGained: 0, shouldRestoreStamina: false, message: 'Không tìm thấy nhân vật.' };
    }

    const nextRealm = getNextRealm(character.realm);
    if (!nextRealm) {
      return { success: false, statPointsGained: 0, skillPointsGained: 0, shouldRestoreStamina: false, message: 'Đã đạt cảnh giới tối đa.' };
    }

    if (character.exp < REALM_EXP_REQUIREMENTS[nextRealm]) {
      return {
        success: false,
        statPointsGained: 0,
        skillPointsGained: 0,
        shouldRestoreStamina: false,
        message: `Cần ${REALM_EXP_REQUIREMENTS[nextRealm]} EXP để đột phá lên ${nextRealm}.`,
      };
    }

    const previousRealm = character.realm;
    const statPointsGained = REALM_STAT_POINTS[nextRealm];
    character.realm = nextRealm;

    const characterMeta = this.meta.get(characterId);
    if (characterMeta) {
      characterMeta.pendingStatPoints += statPointsGained;
      characterMeta.skillPoints += SKILL_POINTS_PER_REALM;
    }

    return {
      success: true,
      previousRealm,
      newRealm: nextRealm,
      statPointsGained,
      skillPointsGained: SKILL_POINTS_PER_REALM,
      shouldRestoreStamina: true,
      message: `Đột phá thành công lên ${REALM_LABELS[nextRealm] ?? nextRealm}! Nhận ${statPointsGained} điểm tu luyện và ${SKILL_POINTS_PER_REALM} điểm võ kỹ.`,
    };
  }

  healCharacter(characterId: string, hpAmount: number): boolean {
    const character = this.characters.get(characterId);
    if (!character || hpAmount <= 0) return false;
    character.currentHp = Math.min(character.maxHp, character.currentHp + hpAmount);
    return true;
  }

  healCharacterFull(characterId: string): boolean {
    const character = this.characters.get(characterId);
    if (!character) return false;
    character.currentHp = character.maxHp;
    return true;
  }

  restoreQi(characterId: string, qiAmount: number): boolean {
    const character = this.characters.get(characterId);
    if (!character || qiAmount <= 0) return false;
    character.currentQi = Math.min(character.maxQi, character.currentQi + qiAmount);
    return true;
  }

  restoreQiFull(characterId: string): boolean {
    const character = this.characters.get(characterId);
    if (!character) return false;
    character.currentQi = character.maxQi;
    return true;
  }

  restoreQiPercent(characterId: string, percent: number): boolean {
    const character = this.characters.get(characterId);
    if (!character || percent <= 0) return false;
    const amount = Math.floor(character.maxQi * percent);
    character.currentQi = Math.min(character.maxQi, character.currentQi + amount);
    return true;
  }

  healParty(hpAmount: number): void {
    for (const id of this.partyIds) {
      this.healCharacter(id, hpAmount);
    }
  }

  healPartyFull(): void {
    for (const id of this.partyIds) {
      this.healCharacterFull(id);
    }
  }

  /** Hồi đầy máu và nguyên khí toàn đội (sau khi sync maxHp/maxQi). */
  restorePartyVitalsFull(getItemById: (id: string) => ItemData | undefined): void {
    for (const id of this.partyIds) {
      this.syncCharacterVitals(id, getItemById);
      const character = this.characters.get(id);
      if (!character) continue;
      character.currentHp = character.maxHp;
      character.currentQi = character.maxQi;
    }
  }

  getComputedStats(
    characterId: string,
    getItemById: (id: string) => ItemData | undefined,
  ): ComputedCharacterStats | null {
    const character = this.characters.get(characterId);
    if (!character) return null;
    return computeCharacterStats(
      character,
      getItemById,
      this.getLearnedSkillIds(characterId),
    );
  }

  getUnlockedCompanionIds(): string[] {
    return [...this.unlockedCompanionIds];
  }

  /** Dùng cho SaveManager. */
  exportState(): {
    characters: CharacterData[];
    meta: Record<string, CharacterMeta>;
    partyIds: string[];
    unlockedCompanionIds: string[];
    mainCharacterId: string | null;
  } {
    return {
      characters: [...this.characters.values()],
      meta: Object.fromEntries(this.meta),
      partyIds: [...this.partyIds],
      unlockedCompanionIds: [...this.unlockedCompanionIds],
      mainCharacterId: this.mainCharacterId,
    };
  }

  /** Dùng cho SaveManager. */
  importState(state: {
    characters: Array<CharacterData & { allocatedStats?: BaseStats }>;
    meta: Record<string, CharacterMeta>;
    partyIds: string[];
    unlockedCompanionIds: string[];
    mainCharacterId: string | null;
  }): void {
    this.characters = new Map(
      state.characters.map((c) => {
        const migrated = migrateCharacterStats(c);
        return [
          c.id,
          {
            ...migrated,
            appearanceId: normalizeAppearanceId(migrated.appearanceId, migrated.gender),
          },
        ];
      }),
    );
    this.meta = new Map(Object.entries(state.meta));
    for (const [id, meta] of this.meta) {
      const character = this.characters.get(id);
      if (meta.skillPoints === undefined) meta.skillPoints = 0;
      if (!meta.learnedSkillIds?.length && character) {
        meta.learnedSkillIds = [WEAPON_BASIC_SKILL[character.weaponType]];
      } else if (!meta.learnedSkillIds) {
        meta.learnedSkillIds = [];
      }
      meta.learnedSkillIds = meta.learnedSkillIds.filter((id) => !isRemovedSkill(id));
      if (meta.hasReincarnated === undefined) meta.hasReincarnated = false;
      if (character) {
        this.normalizeBattleSkillLoadout(meta, character);
      }
    }
    this.partyIds = [...state.partyIds];
    this.unlockedCompanionIds = new Set(state.unlockedCompanionIds);
    this.mainCharacterId = state.mainCharacterId;
  }
}
