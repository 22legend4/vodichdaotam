import type { MapStageNode } from '../types/game.ts';
import type { StageItemReward } from '../constants/gameRules.ts';
import { LEO_THAP_FLOOR33_WEAPON_CHOICES } from './eventItems.ts';

export const LEO_THAP_CHAPTER_ID = 'event_leo_thap';
export const LEO_THAP_EVENT_DAY = 5; // Thứ 6
export const LEO_THAP_EVENT_START_HOUR = 22;
export const LEO_THAP_EVENT_END_HOUR = 24;

function n(npcId: string, count: number): string[] {
  return Array.from({ length: count }, () => npcId);
}

function waves(...parts: string[][]): string[][] {
  return parts;
}

function itemReward(itemId: string, quantity = 1): StageItemReward[] {
  return [{ itemId, quantity }];
}

interface FloorDef {
  enemies: string[] | string[][];
  tinhThach?: number;
  items?: StageItemReward[];
  rewardChoiceIds?: readonly string[];
}

function toStage(floor: number, def: FloorDef): MapStageNode {
  const wavesDef = Array.isArray(def.enemies[0])
    ? (def.enemies as string[][])
    : undefined;
  const flat = wavesDef ? wavesDef[0]! : (def.enemies as string[]);

  return {
    id: `leo_thap_${floor}`,
    name: `Leo Tháp — Tầng ${floor}`,
    chapterId: LEO_THAP_CHAPTER_ID,
    order: floor,
    type: 'normal',
    gridX: 0,
    gridY: 0,
    prerequisites: [],
    displayLabel: `${floor}`,
    enemyNpcIds: flat,
    enemyWaves: wavesDef,
    expReward: 0,
    tinhThachReward: def.tinhThach,
    itemRewards: def.items,
    rewardChoiceIds: def.rewardChoiceIds,
    mapHidden: true,
  };
}

const FLOOR_DEFS: FloorDef[] = [
  { enemies: n('npc8', 5), tinhThach: 5 },
  { enemies: n('npc9', 5), tinhThach: 10 },
  { enemies: n('npc10', 5), tinhThach: 15 },
  { enemies: n('npc11', 5), tinhThach: 20 },
  { enemies: n('npc12', 5), tinhThach: 25 },
  { enemies: n('npc13', 5), tinhThach: 30 },
  { enemies: n('npc14', 5), tinhThach: 35 },
  { enemies: n('npc15', 5), tinhThach: 40 },
  { enemies: waves(n('npc14', 4), n('npc15', 4)), tinhThach: 45 },
  { enemies: n('npc16', 5), tinhThach: 50 },
  { enemies: waves(n('npc16', 4), n('npc17', 4)), items: itemReward('item_thienQuy', 5) },
  { enemies: n('npc17', 5), items: itemReward('med_hoaLienThao', 5) },
  { enemies: waves(n('npc17', 4), n('npc18', 4)), items: itemReward('med_hacLienVanNam', 1) },
  { enemies: n('npc19', 5), items: itemReward('eq_coChanKhi', 1) },
  { enemies: waves(n('npc19', 4), n('npc20', 4)), items: itemReward('eq_phongThanKhi', 1) },
  { enemies: n('npc21', 5), items: itemReward('beast_hacMieu', 1) },
  { enemies: waves(n('npc21', 4), n('npc22', 4)), items: itemReward('beast_bachHau', 1) },
  { enemies: n('npc23', 5), items: itemReward('beast_xichHuyetMa', 1) },
  { enemies: waves(n('npc23', 4), n('npc24', 4)), items: itemReward('beast_kimLong', 1) },
  { enemies: n('npc25', 5), items: itemReward('beast_linhMieu', 1) },
  { enemies: waves(n('npc25', 4), n('npc26', 4)), items: itemReward('beast_uCotLang', 1) },
  { enemies: n('npc27', 5), items: itemReward('beast_xichThietHung', 1) },
  { enemies: waves(n('npc27', 4), n('npc28', 4)), items: itemReward('beast_thanhMocXa', 1) },
  { enemies: n('npc29', 5), items: itemReward('beast_songDauHuyetHo', 1) },
  { enemies: waves(n('npc29', 4), n('npc30', 4)), items: itemReward('beast_bichThuyQuy', 1) },
  { enemies: n('npc31', 5), items: itemReward('beast_uCocMocYeu', 1) },
  { enemies: waves(n('npc31', 4), n('npc32', 4)), items: itemReward('beast_hoaChuBao', 1) },
  { enemies: n('npc32', 5), items: itemReward('beast_cuuViHo', 1) },
  { enemies: waves(n('npc32', 4), n('npc33', 4)), items: itemReward('beast_suongNhanBang', 1) },
  { enemies: n('npc33', 5), items: itemReward('beast_nguTracKimLong', 1) },
  { enemies: waves(n('npc33', 4), n('npc34', 4)), items: itemReward('beast_thanhQuy', 1) },
  { enemies: n('npc34', 5), items: itemReward('beast_hoaKyLan', 1) },
  { enemies: waves(n('npc34', 4), n('npc35', 4)), rewardChoiceIds: LEO_THAP_FLOOR33_WEAPON_CHOICES },
  { enemies: n('npc36', 5), items: itemReward('eq_thaiHuBaoDinh', 1) },
  { enemies: waves(n('npc36', 4), n('npc36', 4)), items: itemReward('eq_honNguyenKimCuongKhai', 1) },
  { enemies: waves(n('npc36', 5), n('npc36', 5)), items: itemReward('eq_hoaNguyetHuNgoa', 1) },
];

export const LEO_THAP_STAGES: MapStageNode[] = FLOOR_DEFS.map((def, i) => toStage(i + 1, def));

export const LEO_THAP_BATTLE_IDS: readonly string[] = LEO_THAP_STAGES.map((s) => s.id);

const STAGE_BY_ID = new Map<string, MapStageNode>(LEO_THAP_STAGES.map((s) => [s.id, s]));

export function getLeoThapStageById(id: string): MapStageNode | undefined {
  return STAGE_BY_ID.get(id);
}

export function isLeoThapStage(stageId: string): boolean {
  return stageId.startsWith('leo_thap_');
}

export function getLeoThapFirstStageId(): string {
  return LEO_THAP_BATTLE_IDS[0]!;
}

/** Thứ Sáu (0=CN) của tuần chứa `date` — dùng làm khóa phiên sự kiện. */
export function getLeoThapFridayDate(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  if (day === LEO_THAP_EVENT_DAY) return d;
  if (day === 6) {
    d.setDate(d.getDate() - 1);
    return d;
  }
  if (day === 0) {
    d.setDate(d.getDate() - 2);
    return d;
  }
  d.setDate(d.getDate() + (LEO_THAP_EVENT_DAY - day));
  return d;
}

export function getLeoThapSessionKey(date = new Date()): string {
  const fri = getLeoThapFridayDate(date);
  const m = String(fri.getMonth() + 1).padStart(2, '0');
  const day = String(fri.getDate()).padStart(2, '0');
  return `${fri.getFullYear()}-${m}-${day}`;
}

export function isLeoThapEventActive(date = new Date()): boolean {
  const day = date.getDay();
  const hour = date.getHours();
  return day === LEO_THAP_EVENT_DAY && hour >= LEO_THAP_EVENT_START_HOUR && hour < LEO_THAP_EVENT_END_HOUR;
}

export function formatLeoThapScheduleLabel(): string {
  return `Thứ 6 hàng tuần · ${LEO_THAP_EVENT_START_HOUR}h–${LEO_THAP_EVENT_END_HOUR}h`;
}

export function buildLeoThapBattleReward(stage: MapStageNode): BattleSceneStageReward {
  return {
    exp: stage.expReward,
    tinhThach: stage.tinhThachReward ?? 0,
    itemRewards: stage.itemRewards,
    rewardChoiceIds: stage.rewardChoiceIds,
    bonusRewardLabel: stage.rewardChoiceIds?.length
      ? 'Chọn 1 trong 4 vũ khí kim cương'
      : undefined,
    stageLabel: stage.name,
  };
}

/** Payload phần thưởng khi vào trận Leo Tháp. */
export interface BattleSceneStageReward {
  exp: number;
  tinhThach: number;
  itemRewards?: StageItemReward[];
  stageLabel?: string;
  bonusRewardLabel?: string;
  rewardChoiceIds?: readonly string[];
}
