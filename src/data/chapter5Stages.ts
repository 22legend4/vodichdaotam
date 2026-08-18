import type { MapStageNode } from '../types/game.ts';
import type { StageItemReward } from '../constants/gameRules.ts';
import { CH4_GATE_18_ID } from './chapter4Stages.ts';

const CH5 = 'chapter_5';

/** Hàng giữa — 12 cửa ải. */
const GATE_ROW_Y = 8;
/** Hàng trên / dưới — nút Yêu vực. */
const YEU_VUC_TOP_Y = 6;
const YEU_VUC_BOTTOM_Y = 10;

function stage5(
  partial: Omit<MapStageNode, 'chapterId' | 'type'> & { chapterId?: string; type?: MapStageNode['type'] },
): MapStageNode {
  return { chapterId: CH5, tinhThachReward: 0, type: 'normal', ...partial };
}

function yeuVuc(
  partial: Omit<MapStageNode, 'chapterId' | 'type'> & { chapterId?: string; type?: MapStageNode['type'] },
): MapStageNode {
  return stage5({ ...partial, type: 'special' });
}

function n(id: string, count: number): string[] {
  return Array.from({ length: count }, () => id);
}

function waves(...waveNpcLists: string[][]): string[][] {
  return waveNpcLists;
}

const THIEN_QUY: StageItemReward[] = [{ itemId: 'item_thienQuy', quantity: 5 }];
const MOC_KHIEN: StageItemReward[] = [{ itemId: 'item_mocKhien', quantity: 5 }];
const CU_THACH_KHIEN: StageItemReward[] = [{ itemId: 'item_cuThachKhien', quantity: 5 }];
const PHONG_THAN: StageItemReward[] = [{ itemId: 'mat_phongThanThach', quantity: 1 }];

export const CH5_GATE_12_ID = 'ch5_gate_12';

export const CH5_YEU_VUC_STAGE_IDS = [
  'ch5_yeu_vuc_tieuLongNgu',
  'ch5_yeu_vuc_haoThienKhuyen',
  'ch5_yeu_vuc_diemPhuong',
  'ch5_yeu_vuc_diaNguu',
  'ch5_yeu_vuc_hacMieu',
  'ch5_yeu_vuc_bachHau',
  'ch5_yeu_vuc_xichHuyetMa',
  'ch5_yeu_vuc_kimLong',
  'ch5_yeu_vuc_linhMieu',
  'ch5_yeu_vuc_uCotLang',
] as const;

export function isYeuVucStage(stage: { id: string }): boolean {
  return stage.id.startsWith('ch5_yeu_vuc_');
}

/**
 * Chương 5 – Yêu Vực.
 * Hàng giữa: Cửa 1–12. Trên/dưới: Yêu vực (mở sau Cửa 12, không thứ tự, không chơi lại).
 */
const CH5_MAIN_STAGES: MapStageNode[] = [
  stage5({
    id: 'ch5_gate_1', name: 'Cửa 1', order: 1, displayLabel: '1',
    gridX: 0, gridY: GATE_ROW_Y, prerequisites: [CH4_GATE_18_ID],
    enemyNpcIds: n('npc17', 3), expReward: 9000, itemRewards: THIEN_QUY,
  }),
  stage5({
    id: 'ch5_gate_2', name: 'Cửa 2', order: 2, displayLabel: '2',
    gridX: 1, gridY: GATE_ROW_Y, prerequisites: ['ch5_gate_1'],
    enemyNpcIds: n('npc17', 4), expReward: 9500, itemRewards: MOC_KHIEN,
  }),
  stage5({
    id: 'ch5_gate_3', name: 'Cửa 3', order: 3, displayLabel: '3',
    gridX: 2, gridY: GATE_ROW_Y, prerequisites: ['ch5_gate_2'],
    enemyNpcIds: n('npc17', 5), expReward: 9800,
    itemRewards: [{ itemId: 'eq_thienSinhNha', quantity: 1 }],
  }),
  stage5({
    id: 'ch5_gate_4', name: 'Cửa 4', order: 4, displayLabel: '4',
    gridX: 3, gridY: GATE_ROW_Y, prerequisites: ['ch5_gate_3'],
    enemyNpcIds: n('npc18', 3), expReward: 10100,
    itemRewards: [{ itemId: 'eq_diaLongThuong', quantity: 1 }],
  }),
  stage5({
    id: 'ch5_gate_5', name: 'Cửa 5', order: 5, displayLabel: '5',
    gridX: 4, gridY: GATE_ROW_Y, prerequisites: ['ch5_gate_4'],
    enemyNpcIds: n('npc18', 4), expReward: 10400,
    itemRewards: [{ itemId: 'eq_tinhVanKiem', quantity: 1 }],
  }),
  stage5({
    id: 'ch5_gate_6', name: 'Cửa 6', order: 6, displayLabel: '6',
    gridX: 5, gridY: GATE_ROW_Y, prerequisites: ['ch5_gate_5'],
    enemyNpcIds: n('npc18', 5), expReward: 10700,
    itemRewards: [{ itemId: 'eq_khaiPhongSao', quantity: 1 }],
  }),
  stage5({
    id: 'ch5_gate_7', name: 'Cửa 7', order: 7, displayLabel: '7',
    gridX: 6, gridY: GATE_ROW_Y, prerequisites: ['ch5_gate_6'],
    enemyNpcIds: n('npc19', 3), expReward: 11000,
    itemRewards: [{ itemId: 'eq_thanhNguyetQuan', quantity: 1 }],
  }),
  stage5({
    id: 'ch5_gate_8', name: 'Cửa 8', order: 8, displayLabel: '8',
    gridX: 7, gridY: GATE_ROW_Y, prerequisites: ['ch5_gate_7'],
    enemyNpcIds: n('npc19', 4), expReward: 11300,
    itemRewards: [{ itemId: 'eq_vanCuongGiap', quantity: 1 }],
  }),
  stage5({
    id: 'ch5_gate_9', name: 'Cửa 9', order: 9, displayLabel: '9',
    gridX: 8, gridY: GATE_ROW_Y, prerequisites: ['ch5_gate_8'],
    enemyNpcIds: n('npc19', 5), expReward: 11600,
    itemRewards: [{ itemId: 'eq_truyPhongNgoa', quantity: 1 }],
  }),
  stage5({
    id: 'ch5_gate_10', name: 'Cửa 10', order: 10, displayLabel: '10',
    gridX: 9, gridY: GATE_ROW_Y, prerequisites: ['ch5_gate_9'],
    enemyWaves: waves(
      [...n('npc17', 3), ...n('npc18', 2)],
      n('npc20', 1),
    ),
    enemyNpcIds: [...n('npc17', 3), ...n('npc18', 2)], expReward: 11900, itemRewards: CU_THACH_KHIEN,
  }),
  stage5({
    id: 'ch5_gate_11', name: 'Cửa 11', order: 11, displayLabel: '11',
    gridX: 10, gridY: GATE_ROW_Y, prerequisites: ['ch5_gate_10'],
    enemyWaves: waves(n('npc19', 5), n('npc20', 4)),
    enemyNpcIds: n('npc19', 5), expReward: 12200, itemRewards: PHONG_THAN,
  }),
  stage5({
    id: CH5_GATE_12_ID, name: 'Cửa 12', order: 12, displayLabel: '12',
    gridX: 11, gridY: GATE_ROW_Y, prerequisites: ['ch5_gate_11'],
    enemyWaves: waves(n('npc18', 5), n('npc19', 5), n('npc20', 5)),
    enemyNpcIds: n('npc18', 5), expReward: 12500, itemRewards: PHONG_THAN,
  }),
];

/** Yêu vực — dây nối tới cửa kề cận; mở khóa thực tế khi vượt Cửa 12 (xem isYeuVucStage). */
const CH5_YEU_VUC_STAGES: MapStageNode[] = [
  yeuVuc({
    id: 'ch5_yeu_vuc_tieuLongNgu', name: 'Tiểu Long Ngư', order: 20, displayLabel: 'Tiểu Long Ngư',
    gridX: 1, gridY: YEU_VUC_TOP_Y, prerequisites: ['ch5_gate_2'],
    enemyNpcIds: ['npc37'], expReward: 0,
    itemRewards: [{ itemId: 'beast_tieuLongNgu', quantity: 1 }],
  }),
  yeuVuc({
    id: 'ch5_yeu_vuc_haoThienKhuyen', name: 'Hạo Thiên Khuyển', order: 21, displayLabel: 'Hạo Thiên Khuyển',
    gridX: 3, gridY: YEU_VUC_TOP_Y, prerequisites: ['ch5_gate_4'],
    enemyNpcIds: ['npc38'], expReward: 0,
    itemRewards: [{ itemId: 'beast_haoThienKhuyen', quantity: 1 }],
  }),
  yeuVuc({
    id: 'ch5_yeu_vuc_diemPhuong', name: 'Diêm Phượng', order: 22, displayLabel: 'Diêm Phượng',
    gridX: 5, gridY: YEU_VUC_TOP_Y, prerequisites: ['ch5_gate_6'],
    enemyNpcIds: ['npc39'], expReward: 0,
    itemRewards: [{ itemId: 'beast_diemPhuong', quantity: 1 }],
  }),
  yeuVuc({
    id: 'ch5_yeu_vuc_diaNguu', name: 'Địa Ngưu', order: 23, displayLabel: 'Địa Ngưu',
    gridX: 7, gridY: YEU_VUC_TOP_Y, prerequisites: ['ch5_gate_8'],
    enemyNpcIds: ['npc40'], expReward: 0,
    itemRewards: [{ itemId: 'beast_diaNguu', quantity: 1 }],
  }),
  yeuVuc({
    id: 'ch5_yeu_vuc_linhMieu', name: 'Linh Miêu', order: 24, displayLabel: 'Linh Miêu',
    gridX: 10, gridY: YEU_VUC_TOP_Y, prerequisites: ['ch5_gate_11'],
    enemyNpcIds: ['npc44'], expReward: 0,
    itemRewards: [{ itemId: 'beast_linhMieu', quantity: 1 }],
  }),
  yeuVuc({
    id: 'ch5_yeu_vuc_hacMieu', name: 'Hắc Miêu', order: 25, displayLabel: 'Hắc Miêu',
    gridX: 1, gridY: YEU_VUC_BOTTOM_Y, prerequisites: ['ch5_gate_2'],
    enemyNpcIds: ['npc46'], expReward: 0,
    itemRewards: [{ itemId: 'beast_hacMieu', quantity: 1 }],
  }),
  yeuVuc({
    id: 'ch5_yeu_vuc_bachHau', name: 'Bạch Hầu', order: 26, displayLabel: 'Bạch Hầu',
    gridX: 3, gridY: YEU_VUC_BOTTOM_Y, prerequisites: ['ch5_gate_4'],
    enemyNpcIds: ['npc41'], expReward: 0,
    itemRewards: [{ itemId: 'beast_bachHau', quantity: 1 }],
  }),
  yeuVuc({
    id: 'ch5_yeu_vuc_xichHuyetMa', name: 'Xích Huyết Mã', order: 27, displayLabel: 'Xích Huyết Mã',
    gridX: 5, gridY: YEU_VUC_BOTTOM_Y, prerequisites: ['ch5_gate_6'],
    enemyNpcIds: ['npc42'], expReward: 0,
    itemRewards: [{ itemId: 'beast_xichHuyetMa', quantity: 1 }],
  }),
  yeuVuc({
    id: 'ch5_yeu_vuc_kimLong', name: 'Kim Long', order: 28, displayLabel: 'Kim Long',
    gridX: 7, gridY: YEU_VUC_BOTTOM_Y, prerequisites: ['ch5_gate_8'],
    enemyNpcIds: ['npc43'], expReward: 0,
    itemRewards: [{ itemId: 'beast_kimLong', quantity: 1 }],
  }),
  yeuVuc({
    id: 'ch5_yeu_vuc_uCotLang', name: 'U Cốt Lang', order: 29, displayLabel: 'U Cốt Lang',
    gridX: 10, gridY: YEU_VUC_BOTTOM_Y, prerequisites: ['ch5_gate_11'],
    enemyNpcIds: ['npc45'], expReward: 0,
    itemRewards: [{ itemId: 'beast_uCotLang', quantity: 1 }],
  }),
];

export const CHAPTER_5_STAGES: MapStageNode[] = [
  ...CH5_MAIN_STAGES,
  ...CH5_YEU_VUC_STAGES,
];

export function isYeuVucComplete(clearedIds: readonly string[]): boolean {
  return CH5_YEU_VUC_STAGE_IDS.every((id) => clearedIds.includes(id));
}
