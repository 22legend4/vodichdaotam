import type { MapStageNode } from '../types/game.ts';
import type { StageItemReward } from '../constants/gameRules.ts';
import { CH8_GATE_64_ID } from './chapter8Stages.ts';

const CH9 = 'chapter_9';

function stage9(
  partial: Omit<MapStageNode, 'chapterId' | 'type'> & { chapterId?: string; type?: MapStageNode['type'] },
): MapStageNode {
  return { chapterId: CH9, tinhThachReward: 0, type: 'normal', ...partial };
}

function n(id: string, count: number): string[] {
  return Array.from({ length: count }, () => id);
}

function waves(...waveNpcLists: string[][]): string[][] {
  return waveNpcLists;
}

const GIOI_THUY: StageItemReward[] = [{ itemId: 'med_gioiThuy', quantity: 1 }];

const GIOI_TAM_REWARDS: StageItemReward[] = [
  { itemId: 'eq_thienHoa', quantity: 1 },
  { itemId: 'eq_honNguyenThienCucQuan', quantity: 1 },
  { itemId: 'eq_cuuThienHuyenNuBao', quantity: 1 },
  { itemId: 'eq_honNguyenThauThienNgoa', quantity: 1 },
];

/** Hub bản đồ — Chuyển sinh (giữa trái). */
export const CH9_TELEPORT_HUB_ID = 'ch9_cong_dich_chuyen';
/** Hub bản đồ — Giới Tâm (giữa). */
export const CH9_GIOI_TAM_HUB_ID = 'ch9_gioi_tam';
export const CH9_GATE_9_ID = 'ch9_gate_9';

/** Tạm thời mở Chuyển sinh + Giới Tâm để test — đặt false trước khi release. */
export const DEV_UNLOCK_CH9_SPECIAL_HUBS = false;

/**
 * Bố cục bản đồ Chương 9 (theo sơ đồ):
 * Hàng trên: 1 — 2 — 3 — 4 — 5
 * Hàng giữa: Chuyển sinh — Giới Tâm — 6
 * Hàng dưới: 9 — 8 — 7
 */
export const CHAPTER_9_STAGES: MapStageNode[] = [
  stage9({
    id: 'ch9_gate_1', name: 'Cửa ải 1', order: 1, displayLabel: '1',
    gridX: 0, gridY: 0, prerequisites: [CH8_GATE_64_ID],
    enemyWaves: waves(n('npc1', 5), n('npc2', 5), n('npc3', 5), n('npc4', 5), n('npc5', 5)),
    enemyNpcIds: n('npc1', 5), expReward: 1_000_000, itemRewards: GIOI_THUY,
  }),
  stage9({
    id: 'ch9_gate_2', name: 'Cửa ải 2', order: 2, displayLabel: '2',
    gridX: 1, gridY: 0, prerequisites: ['ch9_gate_1'],
    enemyWaves: waves(n('npc6', 5), n('npc7', 5), n('npc8', 5), n('npc9', 5), n('npc10', 5)),
    enemyNpcIds: n('npc6', 5), expReward: 1_000_000, itemRewards: GIOI_THUY,
  }),
  stage9({
    id: 'ch9_gate_3', name: 'Cửa ải 3', order: 3, displayLabel: '3',
    gridX: 2, gridY: 0, prerequisites: ['ch9_gate_2'],
    enemyWaves: waves(n('npc11', 5), n('npc12', 5), n('npc13', 5), n('npc14', 5), n('npc15', 5)),
    enemyNpcIds: n('npc11', 5), expReward: 1_000_000, itemRewards: GIOI_THUY,
  }),
  stage9({
    id: 'ch9_gate_4', name: 'Cửa ải 4', order: 4, displayLabel: '4',
    gridX: 3, gridY: 0, prerequisites: ['ch9_gate_3'],
    enemyWaves: waves(n('npc16', 5), n('npc17', 5), n('npc18', 5), n('npc19', 5), n('npc20', 5)),
    enemyNpcIds: n('npc16', 5), expReward: 1_000_000, itemRewards: GIOI_THUY,
  }),
  stage9({
    id: 'ch9_gate_5', name: 'Cửa ải 5', order: 5, displayLabel: '5',
    gridX: 4, gridY: 0, prerequisites: ['ch9_gate_4'],
    enemyWaves: waves(n('npc21', 5), n('npc22', 5), n('npc23', 5), n('npc24', 5), n('npc25', 5)),
    enemyNpcIds: n('npc21', 5), expReward: 1_000_000, itemRewards: GIOI_THUY,
  }),
  stage9({
    id: CH9_TELEPORT_HUB_ID, name: 'Chuyển sinh', order: 10, displayLabel: 'Chuyển sinh',
    gridX: 0, gridY: 2, prerequisites: [CH9_GATE_9_ID], isHub: true,
    enemyNpcIds: [], expReward: 0,
  }),
  stage9({
    id: CH9_GIOI_TAM_HUB_ID, name: 'Giới Tâm', order: 11, displayLabel: 'Giới Tâm',
    gridX: 2, gridY: 2, prerequisites: [CH9_GATE_9_ID], isHub: true,
    enemyWaves: waves(n('npc47', 5)),
    enemyNpcIds: n('npc47', 5),
    expReward: 0,
    itemRewards: GIOI_TAM_REWARDS,
  }),
  stage9({
    id: 'ch9_gate_6', name: 'Cửa ải 6', order: 6, displayLabel: '6',
    gridX: 4, gridY: 2, prerequisites: ['ch9_gate_5'],
    enemyWaves: waves(n('npc26', 5), n('npc27', 5), n('npc28', 5), n('npc29', 5), n('npc30', 5)),
    enemyNpcIds: n('npc26', 5), expReward: 1_000_000, itemRewards: GIOI_THUY,
  }),
  stage9({
    id: 'ch9_gate_7', name: 'Cửa ải 7', order: 7, displayLabel: '7',
    gridX: 4, gridY: 4, prerequisites: ['ch9_gate_6'],
    enemyWaves: waves(n('npc31', 5), n('npc32', 5), n('npc33', 5), n('npc34', 5), n('npc35', 5)),
    enemyNpcIds: n('npc31', 5), expReward: 5_000_000, itemRewards: GIOI_THUY,
  }),
  stage9({
    id: 'ch9_gate_8', name: 'Cửa ải 8', order: 8, displayLabel: '8',
    gridX: 2, gridY: 4, prerequisites: ['ch9_gate_7'],
    enemyWaves: waves(n('npc33', 5), n('npc34', 5), n('npc35', 5), n('npc36', 5)),
    enemyNpcIds: n('npc33', 5), expReward: 5_000_000, itemRewards: GIOI_THUY,
  }),
  stage9({
    id: CH9_GATE_9_ID, name: 'Cửa ải 9', order: 9, displayLabel: '9',
    gridX: 0, gridY: 4, prerequisites: ['ch9_gate_8'],
    enemyWaves: waves(n('npc36', 5), n('npc36', 5), n('npc36', 5), n('npc36', 5)),
    enemyNpcIds: n('npc36', 5), expReward: 5_000_000, itemRewards: GIOI_THUY,
  }),
];
