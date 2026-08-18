import type { MapStageNode } from '../types/game.ts';
import type { StageItemReward } from '../constants/gameRules.ts';
import { CH6_GATE_35_ID } from './chapter6Stages.ts';

const CH7 = 'chapter_7';

/** Bố cục bản đồ — chéo 1→6, ngang 7→16, dọc 17→28 (theo sơ đồ Chương 7). */
const CH7_GATE_GRID: readonly { x: number; y: number }[] = [
  { x: 6, y: 7 }, { x: 5, y: 6 }, { x: 4, y: 5 }, { x: 3, y: 4 }, { x: 2, y: 3 }, { x: 1, y: 2 },
  { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 },
  { x: 6, y: 1 }, { x: 7, y: 1 }, { x: 8, y: 1 }, { x: 9, y: 1 },
  { x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 9, y: 5 }, { x: 9, y: 6 }, { x: 9, y: 7 },
  { x: 9, y: 8 }, { x: 9, y: 9 }, { x: 9, y: 10 }, { x: 9, y: 11 }, { x: 9, y: 12 }, { x: 9, y: 13 },
];

function ch7GatePos(gateNum: number): { gridX: number; gridY: number } {
  const pos = CH7_GATE_GRID[gateNum - 1]!;
  return { gridX: pos.x, gridY: pos.y };
}

function stage7(
  partial: Omit<MapStageNode, 'chapterId' | 'type'> & { chapterId?: string; type?: MapStageNode['type'] },
): MapStageNode {
  return { chapterId: CH7, tinhThachReward: 0, type: 'normal', ...partial };
}

function n(id: string, count: number): string[] {
  return Array.from({ length: count }, () => id);
}

function waves(...waveNpcLists: string[][]): string[][] {
  return waveNpcLists;
}

const TRAN_MA_DAO: StageItemReward[] = [{ itemId: 'eq_tranMaDao', quantity: 1 }];
const PHA_KHONG_THUONG: StageItemReward[] = [{ itemId: 'eq_phaKhongThuong', quantity: 1 }];
const LANG_SUONG_KIEM: StageItemReward[] = [{ itemId: 'eq_langSuongKiem', quantity: 1 }];
const KIM_CUONG_THU: StageItemReward[] = [{ itemId: 'eq_kimCuongThu', quantity: 1 }];
const TU_KIM_DINH_QUAN: StageItemReward[] = [{ itemId: 'eq_tuKimDinhQuan', quantity: 1 }];
const CU_LINH_KHAI: StageItemReward[] = [{ itemId: 'eq_cuLinhKhai', quantity: 1 }];
const THANH_VAN_HO_CUOC: StageItemReward[] = [{ itemId: 'eq_thanhVanHoCuoc', quantity: 1 }];
const THUONG_HAI: StageItemReward[] = [{ itemId: 'item_thuongHaiTangDien', quantity: 10 }];
const MOC_KHIEN: StageItemReward[] = [{ itemId: 'item_mocKhien', quantity: 10 }];
const CU_THACH_KHIEN: StageItemReward[] = [{ itemId: 'item_cuThachKhien', quantity: 10 }];
const GIOI_THUY: StageItemReward[] = [{ itemId: 'med_gioiThuy', quantity: 1 }];

export const CH7_GATE_28_ID = 'ch7_gate_28';

/** Chương 7 – Quỷ Giới: 28 cửa ải chính. */
export const CHAPTER_7_STAGES: MapStageNode[] = [
  stage7({
    id: 'ch7_gate_1', name: 'Cửa ải 1', order: 1, displayLabel: '1',
    ...ch7GatePos(1), prerequisites: [CH6_GATE_35_ID],
    enemyNpcIds: n('npc25', 3), expReward: 30_000, itemRewards: TRAN_MA_DAO,
  }),
  stage7({
    id: 'ch7_gate_2', name: 'Cửa ải 2', order: 2, displayLabel: '2',
    ...ch7GatePos(2), prerequisites: ['ch7_gate_1'],
    enemyNpcIds: n('npc25', 4), expReward: 31_000, itemRewards: PHA_KHONG_THUONG,
  }),
  stage7({
    id: 'ch7_gate_3', name: 'Cửa ải 3', order: 3, displayLabel: '3',
    ...ch7GatePos(3), prerequisites: ['ch7_gate_2'],
    enemyNpcIds: n('npc25', 5), expReward: 32_000, itemRewards: LANG_SUONG_KIEM,
  }),
  stage7({
    id: 'ch7_gate_4', name: 'Cửa ải 4', order: 4, displayLabel: '4',
    ...ch7GatePos(4), prerequisites: ['ch7_gate_3'],
    enemyWaves: waves(n('npc25', 3), n('npc25', 4)),
    enemyNpcIds: n('npc25', 3), expReward: 33_000, itemRewards: KIM_CUONG_THU,
  }),
  stage7({
    id: 'ch7_gate_5', name: 'Cửa ải 5', order: 5, displayLabel: '5',
    ...ch7GatePos(5), prerequisites: ['ch7_gate_4'],
    enemyWaves: waves(n('npc25', 4), n('npc25', 5)),
    enemyNpcIds: n('npc25', 4), expReward: 34_000, itemRewards: TU_KIM_DINH_QUAN,
  }),
  stage7({
    id: 'ch7_gate_6', name: 'Cửa ải 6', order: 6, displayLabel: '6',
    ...ch7GatePos(6), prerequisites: ['ch7_gate_5'],
    enemyWaves: waves(n('npc25', 5), n('npc25', 5)),
    enemyNpcIds: n('npc25', 5), expReward: 35_000, itemRewards: CU_LINH_KHAI,
  }),
  stage7({
    id: 'ch7_gate_7', name: 'Cửa ải 7', order: 7, displayLabel: '7',
    ...ch7GatePos(7), prerequisites: ['ch7_gate_6'],
    enemyWaves: waves(n('npc25', 3), n('npc25', 4), n('npc25', 5)),
    enemyNpcIds: n('npc25', 3), expReward: 36_000, itemRewards: THANH_VAN_HO_CUOC,
  }),
  stage7({
    id: 'ch7_gate_8', name: 'Cửa ải 8', order: 8, displayLabel: '8',
    ...ch7GatePos(8), prerequisites: ['ch7_gate_7'],
    enemyNpcIds: n('npc26', 3), expReward: 37_000, itemRewards: THUONG_HAI,
  }),
  stage7({
    id: 'ch7_gate_9', name: 'Cửa ải 9', order: 9, displayLabel: '9',
    ...ch7GatePos(9), prerequisites: ['ch7_gate_8'],
    enemyNpcIds: n('npc26', 4), expReward: 38_000, itemRewards: MOC_KHIEN,
  }),
  stage7({
    id: 'ch7_gate_10', name: 'Cửa ải 10', order: 10, displayLabel: '10',
    ...ch7GatePos(10), prerequisites: ['ch7_gate_9'],
    enemyNpcIds: n('npc26', 5), expReward: 39_000, itemRewards: CU_THACH_KHIEN,
  }),
  stage7({
    id: 'ch7_gate_11', name: 'Cửa ải 11', order: 11, displayLabel: '11',
    ...ch7GatePos(11), prerequisites: ['ch7_gate_10'],
    enemyWaves: waves(n('npc26', 3), n('npc26', 4)),
    enemyNpcIds: n('npc26', 3), expReward: 40_000, itemRewards: THUONG_HAI,
  }),
  stage7({
    id: 'ch7_gate_12', name: 'Cửa ải 12', order: 12, displayLabel: '12',
    ...ch7GatePos(12), prerequisites: ['ch7_gate_11'],
    enemyWaves: waves(n('npc26', 4), n('npc26', 5)),
    enemyNpcIds: n('npc26', 4), expReward: 41_000, itemRewards: MOC_KHIEN,
  }),
  stage7({
    id: 'ch7_gate_13', name: 'Cửa ải 13', order: 13, displayLabel: '13',
    ...ch7GatePos(13), prerequisites: ['ch7_gate_12'],
    enemyWaves: waves(n('npc26', 5), n('npc26', 5)),
    enemyNpcIds: n('npc26', 5), expReward: 42_000, itemRewards: CU_THACH_KHIEN,
  }),
  stage7({
    id: 'ch7_gate_14', name: 'Cửa ải 14', order: 14, displayLabel: '14',
    ...ch7GatePos(14), prerequisites: ['ch7_gate_13'],
    enemyWaves: waves(n('npc26', 3), n('npc26', 4), n('npc26', 5)),
    enemyNpcIds: n('npc26', 3), expReward: 43_000, itemRewards: THUONG_HAI,
  }),
  stage7({
    id: 'ch7_gate_15', name: 'Cửa ải 15', order: 15, displayLabel: '15',
    ...ch7GatePos(15), prerequisites: ['ch7_gate_14'],
    enemyNpcIds: n('npc27', 3), expReward: 44_000, itemRewards: MOC_KHIEN,
  }),
  stage7({
    id: 'ch7_gate_16', name: 'Cửa ải 16', order: 16, displayLabel: '16',
    ...ch7GatePos(16), prerequisites: ['ch7_gate_15'],
    enemyNpcIds: n('npc27', 4), expReward: 45_000, itemRewards: CU_THACH_KHIEN,
  }),
  stage7({
    id: 'ch7_gate_17', name: 'Cửa ải 17', order: 17, displayLabel: '17',
    ...ch7GatePos(17), prerequisites: ['ch7_gate_16'],
    enemyNpcIds: n('npc27', 5), expReward: 46_000, itemRewards: GIOI_THUY,
  }),
  stage7({
    id: 'ch7_gate_18', name: 'Cửa ải 18', order: 18, displayLabel: '18',
    ...ch7GatePos(18), prerequisites: ['ch7_gate_17'],
    enemyWaves: waves(n('npc27', 3), n('npc27', 4)),
    enemyNpcIds: n('npc27', 3), expReward: 47_000, itemRewards: GIOI_THUY,
  }),
  stage7({
    id: 'ch7_gate_19', name: 'Cửa ải 19', order: 19, displayLabel: '19',
    ...ch7GatePos(19), prerequisites: ['ch7_gate_18'],
    enemyWaves: waves(n('npc27', 4), n('npc27', 5)),
    enemyNpcIds: n('npc27', 4), expReward: 48_000, itemRewards: GIOI_THUY,
  }),
  stage7({
    id: 'ch7_gate_20', name: 'Cửa ải 20', order: 20, displayLabel: '20',
    ...ch7GatePos(20), prerequisites: ['ch7_gate_19'],
    enemyWaves: waves(n('npc27', 5), n('npc27', 5)),
    enemyNpcIds: n('npc27', 5), expReward: 49_000, itemRewards: GIOI_THUY,
  }),
  stage7({
    id: 'ch7_gate_21', name: 'Cửa ải 21', order: 21, displayLabel: '21',
    ...ch7GatePos(21), prerequisites: ['ch7_gate_20'],
    enemyWaves: waves(n('npc27', 3), n('npc27', 4), n('npc27', 5)),
    enemyNpcIds: n('npc27', 3), expReward: 50_000, itemRewards: GIOI_THUY,
  }),
  stage7({
    id: 'ch7_gate_22', name: 'Cửa ải 22', order: 22, displayLabel: '22',
    ...ch7GatePos(22), prerequisites: ['ch7_gate_21'],
    enemyNpcIds: n('npc28', 3), expReward: 51_000, itemRewards: GIOI_THUY,
  }),
  stage7({
    id: 'ch7_gate_23', name: 'Cửa ải 23', order: 23, displayLabel: '23',
    ...ch7GatePos(23), prerequisites: ['ch7_gate_22'],
    enemyNpcIds: n('npc28', 4), expReward: 52_000, tinhThachReward: 50,
  }),
  stage7({
    id: 'ch7_gate_24', name: 'Cửa ải 24', order: 24, displayLabel: '24',
    ...ch7GatePos(24), prerequisites: ['ch7_gate_23'],
    enemyNpcIds: n('npc28', 5), expReward: 53_000, tinhThachReward: 50,
  }),
  stage7({
    id: 'ch7_gate_25', name: 'Cửa ải 25', order: 25, displayLabel: '25',
    ...ch7GatePos(25), prerequisites: ['ch7_gate_24'],
    enemyWaves: waves(n('npc28', 3), n('npc28', 4)),
    enemyNpcIds: n('npc28', 3), expReward: 54_000, tinhThachReward: 50,
  }),
  stage7({
    id: 'ch7_gate_26', name: 'Cửa ải 26', order: 26, displayLabel: '26',
    ...ch7GatePos(26), prerequisites: ['ch7_gate_25'],
    enemyWaves: waves(n('npc28', 4), n('npc28', 5)),
    enemyNpcIds: n('npc28', 4), expReward: 55_000, tinhThachReward: 50,
  }),
  stage7({
    id: 'ch7_gate_27', name: 'Cửa ải 27', order: 27, displayLabel: '27',
    ...ch7GatePos(27), prerequisites: ['ch7_gate_26'],
    enemyWaves: waves(n('npc28', 5), n('npc28', 5)),
    enemyNpcIds: n('npc28', 5), expReward: 56_000, tinhThachReward: 50,
  }),
  stage7({
    id: CH7_GATE_28_ID, name: 'Cửa ải 28', order: 28, displayLabel: '28',
    ...ch7GatePos(28), prerequisites: ['ch7_gate_27'],
    enemyWaves: waves(n('npc28', 3), n('npc28', 4), n('npc28', 5)),
    enemyNpcIds: n('npc28', 3), expReward: 57_000, tinhThachReward: 50,
  }),
];
