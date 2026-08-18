import type { ChapterData, MapStageNode } from '../types/game.ts';
import { isHamNguocStage, isThienTaiStage } from '../constants/gameRules.ts';
import {
  CHAPTER_3_STAGES,
  CH3_DUNGEON_HUB_ID,
  CH3_DUNGEON_BATTLE_IDS,
  CH3_GATE_38_ID,
  CH3_THIEN_KIEU_HUB_ID,
  CH3_THIEN_KIEU_BATTLE_IDS,
  isThienKieuComplete,
} from './chapter3Stages.ts';
import { CHAPTER_4_STAGES } from './chapter4Stages.ts';
import { CHAPTER_5_STAGES, CH5_GATE_12_ID, isYeuVucStage } from './chapter5Stages.ts';
import {
  CHAPTER_6_STAGES,
  CH6_DUNGEON_HUB_ID,
  CH6_DUNGEON_BATTLE_IDS,
  CH6_GATE_35_ID,
} from './chapter6Stages.ts';
import { CHAPTER_7_STAGES } from './chapter7Stages.ts';
import { CHAPTER_8_STAGES } from './chapter8Stages.ts';
import { CHAPTER_9_STAGES, CH9_GATE_9_ID, CH9_GIOI_TAM_HUB_ID, CH9_TELEPORT_HUB_ID, DEV_UNLOCK_CH9_SPECIAL_HUBS } from './chapter9Stages.ts';
import { LEO_THAP_BATTLE_IDS, getLeoThapStageById } from './leoThapData.ts';

export const TUTORIAL_STAGE_ID = 'tutorial_bandit';

/** Cửa ải 1 — Chương 1 (sau tutorial). */
export const CH1_GATE_1_ID = 'ch1_gate_1';

export type StageAccessState = 'locked' | 'available' | 'cleared';

const CH1 = 'chapter_1';

/** Cửa ải cuối nhánh chính Chương 1 — vượt qua = hoàn thành chương. */
export const CHAPTER_1_COMPLETE_STAGE_ID = 'ch1_gate_14';

export function isChapter1Complete(clearedStageIds: readonly string[]): boolean {
  return clearedStageIds.includes(CHAPTER_1_COMPLETE_STAGE_ID);
}
const CH2 = 'chapter_2';

function stage(
  partial: Omit<MapStageNode, 'chapterId' | 'type'> & { chapterId?: string; type?: MapStageNode['type'] },
): MapStageNode {
  return { chapterId: CH1, tinhThachReward: 0, type: 'normal', ...partial };
}

function stage2(
  partial: Omit<MapStageNode, 'chapterId'> & { chapterId?: string },
): MapStageNode {
  return { chapterId: CH2, tinhThachReward: 0, ...partial };
}

/** Lặp cùng một NPC trong đội hình. */
function n(id: string, count: number): string[] {
  return Array.from({ length: count }, () => id);
}

/**
 * Chương 1 – Tiều Thôn (cửa 1–14 + nhánh 1A–1D).
 *
 * | Cửa   | Đội hình                          | EXP | Phần thưởng thêm        |
 * |-------|-----------------------------------|-----|-------------------------|
 * | 1     | 1 npc1                            | 70  |                         |
 * | 2     | 2 npc1                            | 70  |                         |
 * | 3     | 1 npc2                            | 70  | Nhất Tiễn Song Điêu     |
 * | 4     | 1 npc1, 1 npc2                    | 70  | 1 Tinh thạch            |
 * | 5     | đ1: 1 npc1 / đ2: 2 npc1           | 90  | 2 Tinh thạch            |
 * | 1A    | đ1: 2 npc1 / đ2: 1 npc2           | 90  | Giải cứu đồng đội 1     |
 * | 6     | 2 npc2                            | 90  | 3 Tinh thạch            |
 * | 7     | 1 npc3                            | 100 | 3 Tinh thạch            |
 * | 8     | 1 npc3, 1 npc1                    | 100 | 3 Tinh thạch            |
 * | 9     | 1 npc3, 1 npc2                    | 100 | 3 Tinh thạch            |
 * | 1B    | 1 npc1, 1 npc2, 1 npc3            | 100 | Giải cứu đồng đội 2     |
 * | 10    | 1 npc4, 1 npc1                    | 120 | 3 Tinh thạch            |
 * | 11    | 1 npc3, 1 npc2                    | 120 |                         |
 * | 1C    | đ1: npc1+npc2 / đ2: npc2+npc3     | 120 | Giải cứu đồng đội 3     |
 * | 12    | 4 npc1                            | 120 |                         |
 * | 13    | 4 npc2                            | 120 | 5 Tinh thạch            |
 * | 14    | 4 npc3                            | 120 | 10 Nhất Tiễn Xuyên Tâm |
 * | 1D    | đ1+đ2: 2 npc1, npc2, npc3 (×2)   | 120 | Giải cứu đồng đội 4     |
 */
const CHAPTER_1_STAGES: MapStageNode[] = [
  stage({
    id: 'ch1_gate_1', name: 'Cửa 1', order: 1, displayLabel: '1',
    gridX: 0, gridY: 3, prerequisites: [TUTORIAL_STAGE_ID],
    enemyNpcIds: ['npc1'], expReward: 70,
  }),
  stage({
    id: 'ch1_gate_2', name: 'Cửa 2', order: 2, displayLabel: '2',
    gridX: 1, gridY: 3, prerequisites: ['ch1_gate_1'],
    enemyNpcIds: ['npc1', 'npc1'], expReward: 70,
  }),
  stage({
    id: 'ch1_gate_3', name: 'Cửa 3', order: 3, displayLabel: '3',
    gridX: 2, gridY: 3, prerequisites: ['ch1_gate_2'],
    enemyNpcIds: ['npc2'], expReward: 70,
    itemRewards: [{ itemId: 'item_nhatTienSongDieu', quantity: 1 }],
  }),
  stage({
    id: 'ch1_gate_4', name: 'Cửa 4', order: 4, displayLabel: '4',
    gridX: 3, gridY: 3, prerequisites: ['ch1_gate_3'],
    enemyNpcIds: ['npc1', 'npc2'], expReward: 70, tinhThachReward: 1,
  }),
  stage({
    id: 'ch1_gate_5', name: 'Cửa 5', order: 5, displayLabel: '5',
    gridX: 3, gridY: 2, prerequisites: ['ch1_gate_4'],
    enemyWaves: [['npc1'], ['npc1', 'npc1']],
    enemyNpcIds: ['npc1'],
    expReward: 90, tinhThachReward: 2,
  }),
  stage({
    id: 'ch1_companion_1a', name: 'Cửa 1A', order: 6, type: 'companionUnlock', displayLabel: '1A',
    gridX: 3, gridY: 1, prerequisites: ['ch1_gate_5'],
    enemyWaves: [['npc1', 'npc1'], ['npc2']],
    enemyNpcIds: ['npc1', 'npc1'],
    expReward: 90,
    bonusRewardLabel: 'Giải cứu đồng đội 1',
    unlockCompanion: '1A', unlockCompanionId: 'companion_1a',
  }),
  stage({
    id: 'ch1_gate_6', name: 'Cửa 6', order: 7, displayLabel: '6',
    gridX: 4, gridY: 3, prerequisites: ['ch1_gate_4'],
    enemyNpcIds: ['npc2', 'npc2'], expReward: 90, tinhThachReward: 3,
  }),
  stage({
    id: 'ch1_gate_7', name: 'Cửa 7', order: 8, displayLabel: '7',
    gridX: 5, gridY: 3, prerequisites: ['ch1_gate_6'],
    enemyNpcIds: ['npc3'], expReward: 100, tinhThachReward: 3,
  }),
  stage({
    id: 'ch1_gate_8', name: 'Cửa 8', order: 9, displayLabel: '8',
    gridX: 5, gridY: 2, prerequisites: ['ch1_gate_7'],
    enemyNpcIds: ['npc3', 'npc1'], expReward: 100, tinhThachReward: 3,
  }),
  stage({
    id: 'ch1_gate_9', name: 'Cửa 9', order: 10, displayLabel: '9',
    gridX: 5, gridY: 1, prerequisites: ['ch1_gate_8'],
    enemyNpcIds: ['npc3', 'npc2'], expReward: 100, tinhThachReward: 3,
  }),
  stage({
    id: 'ch1_companion_1b', name: 'Cửa 1B', order: 11, type: 'companionUnlock', displayLabel: '1B',
    gridX: 5, gridY: 0, prerequisites: ['ch1_gate_9'],
    enemyNpcIds: ['npc1', 'npc2', 'npc3'], expReward: 100,
    bonusRewardLabel: 'Giải cứu đồng đội 2',
    unlockCompanion: '1B', unlockCompanionId: 'companion_1b',
  }),
  stage({
    id: 'ch1_gate_10', name: 'Cửa 10', order: 12, displayLabel: '10',
    gridX: 5, gridY: 4, prerequisites: ['ch1_gate_7'],
    enemyNpcIds: ['npc4', 'npc1'], expReward: 120, tinhThachReward: 3,
  }),
  stage({
    id: 'ch1_gate_11', name: 'Cửa 11', order: 13, displayLabel: '11',
    gridX: 5, gridY: 5, prerequisites: ['ch1_gate_10'],
    enemyNpcIds: ['npc3', 'npc2'], expReward: 120,
  }),
  stage({
    id: 'ch1_companion_1c', name: 'Cửa 1C', order: 14, type: 'companionUnlock', displayLabel: '1C',
    gridX: 5, gridY: 6, prerequisites: ['ch1_gate_11'],
    enemyWaves: [['npc1', 'npc2'], ['npc2', 'npc3']],
    enemyNpcIds: ['npc1', 'npc2'],
    expReward: 120,
    bonusRewardLabel: 'Giải cứu đồng đội 3',
    unlockCompanion: '1C', unlockCompanionId: 'companion_1c',
  }),
  stage({
    id: 'ch1_gate_12', name: 'Cửa 12', order: 15, displayLabel: '12',
    gridX: 6, gridY: 3, prerequisites: ['ch1_gate_7'],
    enemyNpcIds: ['npc1', 'npc1', 'npc1', 'npc1'], expReward: 120,
  }),
  stage({
    id: 'ch1_gate_13', name: 'Cửa 13', order: 16, displayLabel: '13',
    gridX: 7, gridY: 3, prerequisites: ['ch1_gate_12'],
    enemyNpcIds: ['npc2', 'npc2', 'npc2', 'npc2'], expReward: 120, tinhThachReward: 5,
  }),
  stage({
    id: 'ch1_gate_14', name: 'Cửa 14', order: 17, displayLabel: '14',
    gridX: 8, gridY: 3, prerequisites: ['ch1_gate_13'],
    enemyNpcIds: ['npc3', 'npc3', 'npc3', 'npc3'], expReward: 120,
    itemRewards: [{ itemId: 'item_nhatTienXuyenTam', quantity: 10 }],
  }),
  stage({
    id: 'ch1_companion_1d', name: 'Cửa 1D', order: 18, type: 'companionUnlock', displayLabel: '1D',
    gridX: 9, gridY: 3, prerequisites: ['ch1_gate_14'],
    enemyWaves: [
      ['npc1', 'npc1', 'npc2', 'npc3'],
      ['npc1', 'npc1', 'npc2', 'npc3'],
    ],
    enemyNpcIds: ['npc1', 'npc1', 'npc2', 'npc3'],
    expReward: 120,
    bonusRewardLabel: 'Giải cứu đồng đội 4',
    unlockCompanion: '1D', unlockCompanionId: 'companion_1d',
  }),
];

/** Chương 2 – Minh Thành (Start giữa, 4 nhánh + Ngũ Lôi / Thiên Tài Trận). */
export const CH2_ARENA_IDS = ['ch2_arena_1', 'ch2_arena_2', 'ch2_arena_3', 'ch2_arena_4'] as const;
export const CH2_NGU_LOI_HUB_ID = 'ch2_ngu_loi';
export const CH2_THIEN_TAI_HUB_ID = 'ch2_thien_tai';
export const CH2_NGU_LOI_BATTLE_IDS = [
  'ch2_ngu_loi_1',
  'ch2_ngu_loi_2',
  'ch2_ngu_loi_3',
  'ch2_ngu_loi_4',
  'ch2_ngu_loi_5',
] as const;
export const CH2_THIEN_TAI_BATTLE_IDS = [
  'ch2_thien_tai_1',
  'ch2_thien_tai_2',
  'ch2_thien_tai_3',
  'ch2_thien_tai_4',
  'ch2_thien_tai_5',
  'ch2_thien_tai_6',
] as const;
export const THIEN_TAI_TINH_THACH_COST = 500;
export const NGU_LOI_DEFEAT_MESSAGE =
  'Bạn hãy sang chương 3, tu luyện lên cấp hoặc thêm trang bị, võ kỹ rồi quay lại chinh phục Ngũ Lôi Chiến. Phần thưởng luôn ở đây chờ bạn';
export const CHAPTER_2_3_DEFEAT_TIP =
  'Bạn hãy tận dụng đạn pháo, đan dược trong túi đồ\nđể chiến thắng kẻ địch';
export const ADVANCED_DEFEAT_TIP =
  'Nếu đánh nhiều lần không được, hãy tìm cách thăng cấp rồi thử lại sau.\nHầm Ngục không giới hạn số lần chiến đấu';

const REWARD_STARTER_WEAPONS = [
  { itemId: 'eq_tuDienDao', quantity: 1 },
  { itemId: 'eq_thanhMocThuong', quantity: 1 },
  { itemId: 'eq_thanhPhongKiem', quantity: 1 },
  { itemId: 'eq_hoVanTy', quantity: 1 },
] as const;

const REWARD_STARTER_ARMOR = [
  { itemId: 'eq_nhaiThu', quantity: 1 },
  { itemId: 'eq_thanhLinhY', quantity: 1 },
  { itemId: 'eq_hanhVanNgoa', quantity: 1 },
] as const;

export function isNguLoiComplete(clearedIds: readonly string[]): boolean {
  return CH2_NGU_LOI_BATTLE_IDS.every((id) => clearedIds.includes(id));
}

export function getNextTrialBattleId(
  battleIds: readonly string[],
  clearedIds: readonly string[],
  replayWhenComplete = false,
): string {
  for (const id of battleIds) {
    if (!clearedIds.includes(id)) return id;
  }
  return replayWhenComplete ? battleIds[0]! : battleIds[battleIds.length - 1]!;
}

/** Cửa ải thuộc chuỗi thử thách (Hầm ngục / Ngũ Lôi / Thiên Tài / Thiên kiêu). */
export function getTrialBattleChain(stageId: string): readonly string[] | null {
  if ((CH2_NGU_LOI_BATTLE_IDS as readonly string[]).includes(stageId)) return CH2_NGU_LOI_BATTLE_IDS;
  if ((CH2_THIEN_TAI_BATTLE_IDS as readonly string[]).includes(stageId)) return CH2_THIEN_TAI_BATTLE_IDS;
  if ((CH3_DUNGEON_BATTLE_IDS as readonly string[]).includes(stageId)) return CH3_DUNGEON_BATTLE_IDS;
  if ((CH6_DUNGEON_BATTLE_IDS as readonly string[]).includes(stageId)) return CH6_DUNGEON_BATTLE_IDS;
  if ((CH3_THIEN_KIEU_BATTLE_IDS as readonly string[]).includes(stageId)) return CH3_THIEN_KIEU_BATTLE_IDS;
  if ((LEO_THAP_BATTLE_IDS as readonly string[]).includes(stageId)) return LEO_THAP_BATTLE_IDS;
  return null;
}

export function isTrialChainBattleStage(stageId: string): boolean {
  return getTrialBattleChain(stageId) !== null;
}

/** Cửa ải kế tiếp trong cùng chuỗi thử thách (null nếu đã là ải cuối). */
export function getNextTrialStageIdInChain(stageId: string): string | null {
  const chain = getTrialBattleChain(stageId);
  if (!chain) return null;
  const idx = chain.indexOf(stageId);
  if (idx < 0 || idx >= chain.length - 1) return null;
  return chain[idx + 1]!;
}

/**
 * Chương 2 – Minh Thành (GDD).
 *
 * | Cửa      | Đội hình                    | EXP | Phần thưởng thêm        |
 * |----------|-----------------------------|-----|-------------------------|
 * | Start    | 5 npc5                      | 150 | 2 Tinh Thạch + Tích Lịch Đạn + Lôi Hỏa Châu + 2 Hồi thể |
 * | 1.1      | 3 npc5                      | 150 | Chu Chỉ Dược            |
 * | 1.2      | 5 npc5                      | 150 | Cường Sinh Đan          |
 * | 1.3      | 3+5 npc5                    | 150 | Đào Tiên Quả            |
 * | VĐ1      | 1 npc6 + 5 npc5             | 150 | Hồi Nguyên Huyết        |
 * | 2.1      | 3 npc6                      | 150 | Tiểu Nguyên Đan         |
 * | 2.2      | 5 npc6                      | 150 | 10 Xích Thiết Thạch     |
 * | 2.3      | 3 npc5 + 5 npc6             | 150 | 10 Vô Lượng Thạch       |
 * | VĐ2      | 1 npc7 + 5 npc6             | 150 | 10 Tinh Thạch           |
 * | 3.1–3.4  | theo GDD                    | 200 | …                       |
 * | VĐ3      | 1 npc8 + 5 npc7             | 200 | 5 Tinh Thạch + 5 Nhất Tiễn Xuyên Tâm |
 * | 4.1–4.5  | theo GDD                    | 200 | …                       |
 * | VĐ4      | 3 npc7 + 5 npc8             | 300 | Nhai Thủ + Thanh Linh Y + Hành Vân Ngoa |
 * | Ngũ Lôi  | 5 trận (npc9–11)            | 1000 | vũ khí/giáp đồng     |
 * | Thiên Tài| 6 trận (npc8–16)            | 1k–5k | mảnh kim / thiết      |
 */
const CHAPTER_2_STAGES: MapStageNode[] = [
  stage2({
    id: 'ch2_start', name: 'Start', order: 0, type: 'normal', displayLabel: '★',
    gridX: 6, gridY: 6, prerequisites: ['ch1_gate_14'],
    enemyNpcIds: n('npc5', 1), expReward: 150, tinhThachReward: 2,
    itemRewards: [
      { itemId: 'item_tichLichDan', quantity: 1 },
      { itemId: 'item_loiHoaChau', quantity: 1 },
      { itemId: 'item_hoiThe', quantity: 2 },
    ],
  }),
  stage2({
    id: 'ch2_1_1', name: 'Cửa 1.1', order: 1, type: 'normal', displayLabel: '1.1',
    gridX: 5, gridY: 5, prerequisites: ['ch2_start'],
    enemyNpcIds: n('npc5', 3), expReward: 150,
    itemRewards: [{ itemId: 'med_chuChiDuoc', quantity: 1 }],
  }),
  stage2({
    id: 'ch2_1_2', name: 'Cửa 1.2', order: 2, type: 'normal', displayLabel: '1.2',
    gridX: 4, gridY: 5, prerequisites: ['ch2_1_1'],
    enemyNpcIds: n('npc5', 5), expReward: 150,
    itemRewards: [{ itemId: 'med_cuongSinhDan', quantity: 1 }],
  }),
  stage2({
    id: 'ch2_1_3', name: 'Cửa 1.3', order: 3, type: 'normal', displayLabel: '1.3',
    gridX: 3, gridY: 5, prerequisites: ['ch2_1_2'],
    enemyWaves: [n('npc5', 3), n('npc5', 5)],
    enemyNpcIds: n('npc5', 3), expReward: 150,
    itemRewards: [{ itemId: 'med_daoTienQua', quantity: 1 }],
  }),
  stage2({
    id: 'ch2_arena_1', name: 'Võ Đài 1', order: 4, type: 'arena', displayLabel: 'VĐ1',
    gridX: 2, gridY: 5, prerequisites: ['ch2_1_3'],
    enemyWaves: [n('npc6', 1), n('npc5', 5)],
    enemyNpcIds: n('npc6', 1), expReward: 150,
    itemRewards: [{ itemId: 'med_hoiNguyenHuyet', quantity: 1 }],
  }),
  stage2({
    id: 'ch2_2_1', name: 'Cửa 2.1', order: 5, type: 'normal', displayLabel: '2.1',
    gridX: 5, gridY: 7, prerequisites: ['ch2_start'],
    enemyNpcIds: n('npc6', 3), expReward: 150,
    itemRewards: [{ itemId: 'med_tieuNguyenDan', quantity: 1 }],
  }),
  stage2({
    id: 'ch2_2_2', name: 'Cửa 2.2', order: 6, type: 'normal', displayLabel: '2.2',
    gridX: 5, gridY: 8, prerequisites: ['ch2_2_1'],
    enemyNpcIds: n('npc6', 5), expReward: 150,
    itemRewards: [{ itemId: 'mat_xichThietThach', quantity: 10 }],
  }),
  stage2({
    id: 'ch2_2_3', name: 'Cửa 2.3', order: 7, type: 'normal', displayLabel: '2.3',
    gridX: 5, gridY: 9, prerequisites: ['ch2_2_2'],
    enemyWaves: [n('npc5', 3), n('npc6', 5)],
    enemyNpcIds: n('npc5', 3), expReward: 150,
    itemRewards: [{ itemId: 'mat_voLuongThach', quantity: 10 }],
  }),
  stage2({
    id: 'ch2_arena_2', name: 'Võ Đài 2', order: 8, type: 'arena', displayLabel: 'VĐ2',
    gridX: 4, gridY: 9, prerequisites: ['ch2_2_3'],
    enemyWaves: [n('npc7', 1), n('npc6', 5)],
    enemyNpcIds: n('npc7', 1), expReward: 150, tinhThachReward: 10,
  }),
  stage2({
    id: 'ch2_3_1', name: 'Cửa 3.1', order: 9, type: 'normal', displayLabel: '3.1',
    gridX: 7, gridY: 7, prerequisites: ['ch2_start'],
    enemyNpcIds: n('npc7', 3), expReward: 200,
    itemRewards: [{ itemId: 'med_boDeQua', quantity: 1 }],
  }),
  stage2({
    id: 'ch2_3_2', name: 'Cửa 3.2', order: 10, type: 'normal', displayLabel: '3.2',
    gridX: 7, gridY: 8, prerequisites: ['ch2_3_1'],
    enemyNpcIds: n('npc7', 5), expReward: 200,
    itemRewards: [{ itemId: 'mat_tichTaThach', quantity: 10 }],
  }),
  stage2({
    id: 'ch2_3_3', name: 'Cửa 3.3', order: 11, type: 'normal', displayLabel: '3.3',
    gridX: 8, gridY: 8, prerequisites: ['ch2_3_2'],
    enemyWaves: [n('npc7', 1), n('npc7', 5)],
    enemyNpcIds: n('npc7', 1), expReward: 200,
    itemRewards: [{ itemId: 'mat_voLangThach', quantity: 10 }],
  }),
  stage2({
    id: 'ch2_3_4', name: 'Cửa 3.4', order: 12, type: 'normal', displayLabel: '3.4',
    gridX: 8, gridY: 9, prerequisites: ['ch2_3_3'],
    enemyWaves: [n('npc7', 3), n('npc7', 5)],
    enemyNpcIds: n('npc7', 3), expReward: 200,
    itemRewards: [{ itemId: 'mat_thuDinhThach', quantity: 10 }],
  }),
  stage2({
    id: 'ch2_arena_3', name: 'Võ Đài 3', order: 13, type: 'arena', displayLabel: 'VĐ3',
    gridX: 8, gridY: 10, prerequisites: ['ch2_3_4'],
    enemyWaves: [n('npc8', 1), n('npc7', 5)],
    enemyNpcIds: n('npc8', 1), expReward: 200, tinhThachReward: 5,
    itemRewards: [{ itemId: 'item_nhatTienXuyenTam', quantity: 5 }],
  }),
  stage2({
    id: 'ch2_4_1', name: 'Cửa 4.1', order: 14, type: 'normal', displayLabel: '4.1',
    gridX: 7, gridY: 6, prerequisites: ['ch2_start'],
    enemyWaves: [n('npc5', 3), n('npc6', 3)],
    enemyNpcIds: n('npc5', 3), expReward: 200,
    itemRewards: [{ itemId: 'item_nhatTienSongDieu', quantity: 5 }],
  }),
  stage2({
    id: 'ch2_4_2', name: 'Cửa 4.2', order: 15, type: 'normal', displayLabel: '4.2',
    gridX: 7, gridY: 5, prerequisites: ['ch2_4_1'],
    enemyWaves: [n('npc6', 3), n('npc7', 3)],
    enemyNpcIds: n('npc6', 3), expReward: 200,
    itemRewards: [{ itemId: 'mat_ngoMinhThach', quantity: 10 }],
  }),
  stage2({
    id: 'ch2_4_3', name: 'Cửa 4.3', order: 16, type: 'normal', displayLabel: '4.3',
    gridX: 8, gridY: 5, prerequisites: ['ch2_4_2'],
    enemyWaves: [n('npc5', 3), n('npc6', 3), n('npc7', 3)],
    enemyNpcIds: n('npc5', 3), expReward: 200,
    itemRewards: [{ itemId: 'mat_thienLyThach', quantity: 10 }],
  }),
  stage2({
    id: 'ch2_4_4', name: 'Cửa 4.4', order: 17, type: 'normal', displayLabel: '4.4',
    gridX: 9, gridY: 5, prerequisites: ['ch2_4_3'],
    enemyNpcIds: n('npc8', 3), expReward: 200,
    itemRewards: [
      { itemId: 'eq_nhaiThu', quantity: 2 },
      { itemId: 'item_nhatTienXuyenTam', quantity: 20 },
      { itemId: 'item_tichLichDan', quantity: 2 },
    ],
  }),
  stage2({
    id: 'ch2_4_5', name: 'Cửa 4.5', order: 18, type: 'normal', displayLabel: '4.5',
    gridX: 10, gridY: 5, prerequisites: ['ch2_4_4'],
    enemyNpcIds: n('npc8', 5), expReward: 200,
    itemRewards: [...REWARD_STARTER_WEAPONS],
  }),
  stage2({
    id: 'ch2_arena_4', name: 'Võ Đài 4', order: 19, type: 'arena', displayLabel: 'VĐ4',
    gridX: 11, gridY: 5, prerequisites: ['ch2_4_5'],
    enemyWaves: [n('npc7', 3), n('npc8', 5)],
    enemyNpcIds: n('npc7', 3), expReward: 300,
    itemRewards: [...REWARD_STARTER_ARMOR],
  }),
  stage2({
    id: CH2_NGU_LOI_HUB_ID, name: 'Ngũ Lôi Chiến', order: 20, type: 'thunderTrial', displayLabel: 'Ngũ Lôi Chiến',
    gridX: 6, gridY: 1, prerequisites: [...CH2_ARENA_IDS],
    enemyNpcIds: [], expReward: 0,
    trialBattleIds: [...CH2_NGU_LOI_BATTLE_IDS],
  }),
  stage2({
    id: CH2_THIEN_TAI_HUB_ID, name: 'Thiên Tài Trận', order: 21, type: 'special', displayLabel: 'Thiên Tài Trận',
    gridX: 6, gridY: 10, prerequisites: [...CH2_NGU_LOI_BATTLE_IDS],
    enemyNpcIds: [], expReward: 0,
    trialBattleIds: [...CH2_THIEN_TAI_BATTLE_IDS],
  }),
  // —— Ngũ Lôi Chiến (ẩn trên bản đồ) ——
  stage2({
    id: 'ch2_ngu_loi_1', name: 'Chiến 1', order: 22, type: 'thunderTrial', displayLabel: 'Chiến 1',
    gridX: 0, gridY: 0, prerequisites: [], mapHidden: true,
    enemyNpcIds: n('npc9', 5), expReward: 1000,
    itemRewards: [...REWARD_STARTER_WEAPONS],
  }),
  stage2({
    id: 'ch2_ngu_loi_2', name: 'Chiến 2', order: 23, type: 'thunderTrial', displayLabel: 'Chiến 2',
    gridX: 0, gridY: 0, prerequisites: ['ch2_ngu_loi_1'], mapHidden: true,
    enemyWaves: [n('npc9', 5), n('npc9', 5)],
    enemyNpcIds: n('npc9', 5), expReward: 1000,
    itemRewards: [...REWARD_STARTER_ARMOR],
  }),
  stage2({
    id: 'ch2_ngu_loi_3', name: 'Chiến 3', order: 24, type: 'thunderTrial', displayLabel: 'Chiến 3',
    gridX: 0, gridY: 0, prerequisites: ['ch2_ngu_loi_2'], mapHidden: true,
    enemyNpcIds: n('npc10', 5), expReward: 1000,
    itemRewards: [...REWARD_STARTER_ARMOR],
  }),
  stage2({
    id: 'ch2_ngu_loi_4', name: 'Chiến 4', order: 25, type: 'thunderTrial', displayLabel: 'Chiến 4',
    gridX: 0, gridY: 0, prerequisites: ['ch2_ngu_loi_3'], mapHidden: true,
    enemyWaves: [n('npc10', 5), n('npc10', 5)],
    enemyNpcIds: n('npc10', 5), expReward: 1000,
    itemRewards: [...REWARD_STARTER_ARMOR],
  }),
  stage2({
    id: 'ch2_ngu_loi_5', name: 'Chiến 5', order: 26, type: 'thunderTrial', displayLabel: 'Chiến 5',
    gridX: 0, gridY: 0, prerequisites: ['ch2_ngu_loi_4'], mapHidden: true,
    enemyNpcIds: n('npc11', 5), expReward: 1000,
    itemRewards: [...REWARD_STARTER_ARMOR],
  }),
  // —— Thiên Tài Trận (ẩn trên bản đồ) ——
  stage2({
    id: 'ch2_thien_tai_1', name: 'Trận 1', order: 27, type: 'special', displayLabel: 'Trận 1',
    gridX: 0, gridY: 0, prerequisites: [], mapHidden: true,
    enemyWaves: [n('npc8', 4), n('npc9', 4), n('npc10', 4)],
    enemyNpcIds: n('npc8', 4), expReward: 1000,
    itemRewards: [
      { itemId: 'mat_xichThietKim', quantity: 10 },
      { itemId: 'mat_voLuongKim', quantity: 10 },
      { itemId: 'mat_tichTaKim', quantity: 10 },
      { itemId: 'mat_voLangKim', quantity: 10 },
    ],
  }),
  stage2({
    id: 'ch2_thien_tai_2', name: 'Trận 2', order: 28, type: 'special', displayLabel: 'Trận 2',
    gridX: 0, gridY: 0, prerequisites: ['ch2_thien_tai_1'], mapHidden: true,
    enemyWaves: [n('npc8', 5), n('npc9', 5), n('npc10', 5)],
    enemyNpcIds: n('npc8', 5), expReward: 1500,
    itemRewards: [
      { itemId: 'mat_thuDinhKim', quantity: 10 },
      { itemId: 'mat_ngoMinhKim', quantity: 10 },
      { itemId: 'mat_thienLyKim', quantity: 10 },
    ],
  }),
  stage2({
    id: 'ch2_thien_tai_3', name: 'Trận 3', order: 29, type: 'special', displayLabel: 'Trận 3',
    gridX: 0, gridY: 0, prerequisites: ['ch2_thien_tai_2'], mapHidden: true,
    enemyWaves: [n('npc11', 4), n('npc12', 4), n('npc13', 4)],
    enemyNpcIds: n('npc11', 4), expReward: 2000,
    itemRewards: [{ itemId: 'mat_coChanThiet', quantity: 10 }],
  }),
  stage2({
    id: 'ch2_thien_tai_4', name: 'Trận 4', order: 30, type: 'special', displayLabel: 'Trận 4',
    gridX: 0, gridY: 0, prerequisites: ['ch2_thien_tai_3'], mapHidden: true,
    enemyWaves: [n('npc11', 5), n('npc12', 5), n('npc13', 5)],
    enemyNpcIds: n('npc11', 5), expReward: 2500,
    itemRewards: [{ itemId: 'mat_coChanThiet', quantity: 10 }],
  }),
  stage2({
    id: 'ch2_thien_tai_5', name: 'Trận 5', order: 31, type: 'special', displayLabel: 'Trận 5',
    gridX: 0, gridY: 0, prerequisites: ['ch2_thien_tai_4'], mapHidden: true,
    enemyWaves: [n('npc14', 4), n('npc15', 4), n('npc16', 4)],
    enemyNpcIds: n('npc14', 4), expReward: 4000,
    itemRewards: [{ itemId: 'mat_coChanThiet', quantity: 10 }],
  }),
  stage2({
    id: 'ch2_thien_tai_6', name: 'Trận 6', order: 32, type: 'special', displayLabel: 'Trận 6',
    gridX: 0, gridY: 0, prerequisites: ['ch2_thien_tai_5'], mapHidden: true,
    enemyWaves: [n('npc14', 5), n('npc15', 5), n('npc16', 5)],
    enemyNpcIds: n('npc14', 5), expReward: 5000,
    itemRewards: [{ itemId: 'mat_phongThanThach', quantity: 10 }],
  }),
];

export function isThienTaiComplete(clearedIds: readonly string[]): boolean {
  return CH2_THIEN_TAI_BATTLE_IDS.every((id) => clearedIds.includes(id));
}

export const CHAPTERS_DATA: ChapterData[] = [
  { id: CH1, name: 'Chương 1 – Tiều Thôn', order: 1, stages: CHAPTER_1_STAGES },
  { id: CH2, name: 'Chương 2 – Minh Thành', order: 2, stages: CHAPTER_2_STAGES },
  { id: 'chapter_3', name: 'Chương 3 – Thiên Đãng Sơn Mạch', order: 3, stages: CHAPTER_3_STAGES },
  { id: 'chapter_4', name: 'Chương 4 – Tứ Hải Long Cung', order: 4, stages: CHAPTER_4_STAGES },
  { id: 'chapter_5', name: 'Chương 5 – Yêu Vực', order: 5, stages: CHAPTER_5_STAGES },
  { id: 'chapter_6', name: 'Chương 6 – Không Giới', order: 6, stages: CHAPTER_6_STAGES },
  { id: 'chapter_7', name: 'Chương 7 – Quỷ Giới', order: 7, stages: CHAPTER_7_STAGES },
  { id: 'chapter_8', name: 'Chương 8 – Yêu Minh Nhãn', order: 8, stages: CHAPTER_8_STAGES },
  { id: 'chapter_9', name: 'Chương 9 – Thiên Địa Nhân Yêu', order: 9, stages: CHAPTER_9_STAGES },
];

const STAGE_BY_ID = new Map<string, MapStageNode>(
  CHAPTERS_DATA.flatMap((ch) => ch.stages).map((s) => [s.id, s]),
);

export function getChapterById(id: string): ChapterData | undefined {
  return CHAPTERS_DATA.find((c) => c.id === id);
}

export function getStageById(id: string): MapStageNode | undefined {
  return STAGE_BY_ID.get(id) ?? getLeoThapStageById(id);
}

export function isChapter2Or3Stage(stageId: string): boolean {
  const chapterId = getStageById(stageId)?.chapterId;
  return chapterId === 'chapter_2' || chapterId === 'chapter_3';
}

/** Phụ đề màn Thất Bại — cửa ải thường CH1–3 vs CH4+ và ải đặc biệt CH2–3. */
export function getDefeatSubtitleForStage(stageId: string | undefined): string {
  if (!stageId) return 'Thử lại lần sau...';

  if (isTrialChainBattleStage(stageId)) {
    return ADVANCED_DEFEAT_TIP;
  }

  const chapterId = getStageById(stageId)?.chapterId;
  if (chapterId === 'chapter_1' || chapterId === 'chapter_2' || chapterId === 'chapter_3') {
    return CHAPTER_2_3_DEFEAT_TIP;
  }

  if (chapterId) {
    return ADVANCED_DEFEAT_TIP;
  }

  return 'Thử lại lần sau...';
}

/** Cửa ải chính trên bản đồ — bỏ hub thử thách / ẩn (vd. Thiên kiêu mở sớm ở CH3). */
function isMainMapChapterProgressStage(stage: MapStageNode): boolean {
  if (stage.mapHidden) return false;
  if (stage.trialBattleIds?.length) return false;
  if (stage.isHub) return false;
  if (stage.type === 'dungeon') return false;
  return true;
}

/** Chương bản đồ hiển thị — chương thấp nhất còn cửa ải chính chưa vượt (vd. 1D sau ải 14). */
export function resolveActiveMapChapterId(
  clearedIds: readonly string[],
  tutorialComplete: boolean,
  tinhThach = 0,
): string {
  for (const chapter of CHAPTERS_DATA) {
    const hasUnclearedMainStage = chapter.stages.some((stage) => {
      if (!isMainMapChapterProgressStage(stage)) return false;
      const state = getStageAccessState(stage, clearedIds, tutorialComplete, tinhThach);
      if (state === 'locked') return false;
      return !clearedIds.includes(stage.id);
    });
    if (hasUnclearedMainStage) return chapter.id;
  }

  let activeId = CHAPTERS_DATA[0]!.id;
  for (const chapter of CHAPTERS_DATA) {
    const unlocked = chapter.stages.some(
      (stage) =>
        isMainMapChapterProgressStage(stage) &&
        getStageAccessState(stage, clearedIds, tutorialComplete, tinhThach) !== 'locked',
    );
    if (unlocked) activeId = chapter.id;
  }
  return activeId;
}

/** Cửa ải bản đồ đã vượt không vào lại — trừ Hầm ngục (và Thiên Tài Trận khi chưa hoàn thành hết 6 trận). */
export function canEnterStageBattle(stage: MapStageNode, clearedIds: string[]): boolean {
  if (stage.trialBattleIds?.length) return false;
  const canReplayThienTai = isThienTaiStage(stage) && !isThienTaiComplete(clearedIds);
  if (stage.mapHidden) {
    if (!clearedIds.includes(stage.id)) return true;
    return isHamNguocStage(stage) || canReplayThienTai;
  }
  if (!clearedIds.includes(stage.id)) return true;
  return isHamNguocStage(stage) || canReplayThienTai;
}

export function getStageReplayBlockReason(stage: MapStageNode, clearedIds: string[]): string {
  if (canEnterStageBattle(stage, clearedIds)) return '';
  return 'Cửa ải đã vượt qua — không thể chơi lại';
}

export function getAllStages(): MapStageNode[] {
  return [...STAGE_BY_ID.values()];
}

export interface MapEdge {
  fromId: string;
  toId: string;
}

export function getChapterEdges(chapterId: string): MapEdge[] {
  const chapter = getChapterById(chapterId);
  if (!chapter) return [];
  const edges: MapEdge[] = [];
  for (const node of chapter.stages) {
    for (const pre of node.prerequisites) {
      if (STAGE_BY_ID.has(pre)) {
        edges.push({ fromId: pre, toId: node.id });
      }
    }
  }
  return edges;
}

export function getStageAccessState(
  stage: MapStageNode,
  clearedIds: readonly string[],
  tutorialComplete: boolean,
  tinhThach: number,
  huyetLongTriComplete = false,
): StageAccessState {
  if (isYeuVucStage(stage)) {
    if (!clearedIds.includes(CH5_GATE_12_ID)) return 'locked';
    if (clearedIds.includes(stage.id)) return 'cleared';
    return 'available';
  }

  if (stage.trialBattleIds?.length) {
    for (const pre of stage.prerequisites) {
      const met = pre === TUTORIAL_STAGE_ID ? tutorialComplete : clearedIds.includes(pre);
      if (!met) return 'locked';
    }
    if (stage.id === CH2_NGU_LOI_HUB_ID) {
      return isNguLoiComplete(clearedIds) ? 'cleared' : 'available';
    }
    if (stage.id === CH2_THIEN_TAI_HUB_ID) {
      return isThienTaiComplete(clearedIds) ? 'cleared' : 'available';
    }
    if (stage.id === CH3_DUNGEON_HUB_ID) {
      return 'available';
    }
    if (stage.id === CH6_DUNGEON_HUB_ID) {
      return 'available';
    }
    if (stage.id === CH3_THIEN_KIEU_HUB_ID) {
      return isThienKieuComplete(clearedIds) ? 'cleared' : 'available';
    }
  }

  if (stage.id === CH9_TELEPORT_HUB_ID) {
    if (DEV_UNLOCK_CH9_SPECIAL_HUBS) return 'available';
    return clearedIds.includes(CH9_GATE_9_ID) ? 'cleared' : 'locked';
  }

  if (stage.id === CH9_GIOI_TAM_HUB_ID) {
    if (clearedIds.includes(stage.id)) return 'cleared';
    if (DEV_UNLOCK_CH9_SPECIAL_HUBS) return 'available';
    if (!clearedIds.includes(CH9_GATE_9_ID) || !huyetLongTriComplete) return 'locked';
    return 'available';
  }

  if (stage.isHub) {
    const prereqsMet = stage.prerequisites.every(
      (p) => (p === TUTORIAL_STAGE_ID ? tutorialComplete : clearedIds.includes(p)),
    );
    return prereqsMet ? 'cleared' : 'locked';
  }

  if (clearedIds.includes(stage.id)) {
    if (isThienTaiStage(stage)) {
      return isThienTaiComplete(clearedIds) ? 'cleared' : 'available';
    }
    return 'cleared';
  }

  for (const pre of stage.prerequisites) {
    const met = pre === TUTORIAL_STAGE_ID ? tutorialComplete : clearedIds.includes(pre);
    if (!met) return 'locked';
  }

  if (stage.requiredTinhThach !== undefined && tinhThach < stage.requiredTinhThach) {
    return 'locked';
  }

  return 'available';
}

export function getStageLockReason(
  stage: MapStageNode,
  clearedIds: string[],
  tutorialComplete: boolean,
  tinhThach: number,
  huyetLongTriComplete = false,
): string {
  if (isYeuVucStage(stage) && !clearedIds.includes(CH5_GATE_12_ID)) {
    return 'Vượt qua Cửa 12 trước';
  }

  if (stage.trialBattleIds?.length) {
    if (stage.id === CH2_NGU_LOI_HUB_ID) {
      const allArenasCleared = CH2_ARENA_IDS.every((id) => clearedIds.includes(id));
      if (!allArenasCleared) {
        return 'Hoàn thành Chương 2 (vượt qua 4 Võ Đài) trước';
      }
      return '';
    }
    if (stage.id === CH2_THIEN_TAI_HUB_ID) {
      if (!isNguLoiComplete(clearedIds)) {
        return 'Vượt qua Ngũ Lôi Chiến trước';
      }
      return '';
    }
    if (stage.id === CH3_DUNGEON_HUB_ID) {
      if (!clearedIds.includes(CH3_GATE_38_ID)) {
        return 'Vượt qua Cửa ải 38 trước';
      }
      return '';
    }
    if (stage.id === CH6_DUNGEON_HUB_ID) {
      if (!clearedIds.includes(CH6_GATE_35_ID)) {
        return 'Vượt qua Cửa ải 35 trước';
      }
      return '';
    }
    if (stage.id === CH3_THIEN_KIEU_HUB_ID) {
      if (!isThienTaiComplete(clearedIds)) {
        return 'Vượt qua Thiên Tài Trận trước';
      }
      return '';
    }
  }

  if (stage.id === CH9_TELEPORT_HUB_ID && !DEV_UNLOCK_CH9_SPECIAL_HUBS && !clearedIds.includes(CH9_GATE_9_ID)) {
    return 'Vượt qua Cửa ải 9 trước';
  }

  if (stage.id === CH9_GIOI_TAM_HUB_ID && !DEV_UNLOCK_CH9_SPECIAL_HUBS && !clearedIds.includes(CH9_GATE_9_ID)) {
    return 'Vượt qua Cửa ải 9 trước';
  }

  if (stage.id === CH9_GIOI_TAM_HUB_ID && !DEV_UNLOCK_CH9_SPECIAL_HUBS && !huyetLongTriComplete) {
    return 'Tu luyện Huyết Long Trì tại Cổng dịch chuyển trước';
  }

  if (stage.isHub || clearedIds.includes(stage.id)) return '';

  for (const pre of stage.prerequisites) {
    const preStage = getStageById(pre);
    const met = pre === TUTORIAL_STAGE_ID ? tutorialComplete : clearedIds.includes(pre);
    if (!met) {
      return pre === TUTORIAL_STAGE_ID
        ? 'Hoàn thành tutorial trước'
        : `Vượt qua ${preStage?.name ?? pre} trước`;
    }
  }

  if (stage.requiredTinhThach !== undefined && tinhThach < stage.requiredTinhThach) {
    return `Cần ${stage.requiredTinhThach.toLocaleString()} Tinh Thạch (hiện có ${tinhThach})`;
  }

  return '';
}

/** Hub Hầm ngục — luôn bắt đầu từ Hầm 1, có thể chơi lại nhiều lần. */
export function isReplayableDungeonHub(stage: MapStageNode): boolean {
  return stage.id === CH3_DUNGEON_HUB_ID || stage.id === CH6_DUNGEON_HUB_ID;
}

/** @deprecated Dùng isReplayableDungeonHub */
export function isChapter3DungeonHub(stage: MapStageNode): boolean {
  return isReplayableDungeonHub(stage);
}

export { isThienKieuComplete, CH3_DUNGEON_HUB_ID, CH3_THIEN_KIEU_HUB_ID, CH3_GATE_38_ID } from './chapter3Stages.ts';
export { CH4_GATE_18_ID } from './chapter4Stages.ts';
export { CH5_GATE_12_ID, CH5_YEU_VUC_STAGE_IDS, isYeuVucStage, isYeuVucComplete } from './chapter5Stages.ts';
export { CH6_GATE_35_ID, CH6_DUNGEON_HUB_ID, CH6_DUNGEON_BATTLE_IDS } from './chapter6Stages.ts';
export { CH7_GATE_28_ID } from './chapter7Stages.ts';
export { CH8_GATE_64_ID } from './chapter8Stages.ts';
export { CH9_GATE_9_ID, CH9_GIOI_TAM_HUB_ID, CH9_TELEPORT_HUB_ID } from './chapter9Stages.ts';