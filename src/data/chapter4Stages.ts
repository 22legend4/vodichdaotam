import type { MapStageNode } from '../types/game.ts';
import type { StageItemReward } from '../constants/gameRules.ts';
import { CH3_GATE_38_ID } from './chapter3Stages.ts';

const CH4 = 'chapter_4';

function stage4(
  partial: Omit<MapStageNode, 'chapterId' | 'type'> & { chapterId?: string; type?: MapStageNode['type'] },
): MapStageNode {
  return { chapterId: CH4, tinhThachReward: 0, type: 'normal', ...partial };
}

function n(id: string, count: number): string[] {
  return Array.from({ length: count }, () => id);
}

function waves(...waveNpcLists: string[][]): string[][] {
  return waveNpcLists;
}

const THUONG_HAI: StageItemReward[] = [{ itemId: 'item_thuongHaiTangDien', quantity: 3 }];
const CUONG_SINH: StageItemReward[] = [{ itemId: 'med_cuongSinhDan', quantity: 1 }];
const DAO_TIEN: StageItemReward[] = [{ itemId: 'med_daoTienQua', quantity: 1 }];
const HOI_NGUYEN_HUYET: StageItemReward[] = [{ itemId: 'med_hoiNguyenHuyet', quantity: 1 }];
const TIEU_NGUYEN: StageItemReward[] = [{ itemId: 'med_tieuNguyenDan', quantity: 1 }];
const DAI_NGUYEN: StageItemReward[] = [{ itemId: 'med_daiNguyenDan', quantity: 1 }];
const PHUC_NGUYEN: StageItemReward[] = [{ itemId: 'med_phucNguyenDan', quantity: 1 }];
const DA_PHUC: StageItemReward[] = [{ itemId: 'med_daPhucNguyen', quantity: 1 }];
const NGO_DONG_HOANG: StageItemReward[] = [{ itemId: 'med_ngoDongHoangThao', quantity: 1 }];
const NGO_DONG: StageItemReward[] = [{ itemId: 'med_ngoDongThao', quantity: 1 }];
const HUYET_LINH: StageItemReward[] = [{ itemId: 'med_huyetLinhDan', quantity: 1 }];

export const CH4_GATE_18_ID = 'ch4_gate_18';

/**
 * Chương 4 – Tứ Hải Long Cung (18 cửa ải).
 */
export const CHAPTER_4_STAGES: MapStageNode[] = [
  stage4({
    id: 'ch4_gate_1', name: 'Cửa 1', order: 1, displayLabel: '1',
    gridX: 0, gridY: 8, prerequisites: [CH3_GATE_38_ID],
    enemyNpcIds: n('npc13', 3), expReward: 3500, itemRewards: THUONG_HAI,
  }),
  stage4({
    id: 'ch4_gate_2', name: 'Cửa 2', order: 2, displayLabel: '2',
    gridX: 1, gridY: 8, prerequisites: ['ch4_gate_1'],
    enemyNpcIds: n('npc13', 4), expReward: 4000, itemRewards: CUONG_SINH,
  }),
  stage4({
    id: 'ch4_gate_3', name: 'Cửa 3', order: 3, displayLabel: '3',
    gridX: 2, gridY: 8, prerequisites: ['ch4_gate_2'],
    enemyNpcIds: n('npc13', 5), expReward: 4500, itemRewards: DAO_TIEN,
  }),
  stage4({
    id: 'ch4_gate_4', name: 'Cửa 4', order: 4, displayLabel: '4',
    gridX: 3, gridY: 8, prerequisites: ['ch4_gate_3'],
    enemyNpcIds: n('npc14', 3), expReward: 5000, itemRewards: HOI_NGUYEN_HUYET,
  }),
  stage4({
    id: 'ch4_gate_5', name: 'Cửa 5', order: 5, displayLabel: '5',
    gridX: 4, gridY: 8, prerequisites: ['ch4_gate_4'],
    enemyNpcIds: n('npc14', 4), expReward: 5500, itemRewards: TIEU_NGUYEN,
  }),
  stage4({
    id: 'ch4_gate_6', name: 'Cửa 6', order: 6, displayLabel: '6',
    gridX: 5, gridY: 8, prerequisites: ['ch4_gate_5'],
    enemyNpcIds: n('npc14', 5), expReward: 6000, itemRewards: DAI_NGUYEN,
  }),
  stage4({
    id: 'ch4_gate_7', name: 'Cửa 7', order: 7, displayLabel: '7',
    gridX: 6, gridY: 7, prerequisites: ['ch4_gate_6'],
    enemyNpcIds: n('npc15', 3), expReward: 6500, itemRewards: PHUC_NGUYEN,
  }),
  stage4({
    id: 'ch4_gate_8', name: 'Cửa 8', order: 8, displayLabel: '8',
    gridX: 7, gridY: 7, prerequisites: ['ch4_gate_7'],
    enemyNpcIds: n('npc15', 4), expReward: 7000, itemRewards: DA_PHUC,
  }),
  stage4({
    id: 'ch4_gate_9', name: 'Cửa 9', order: 9, displayLabel: '9',
    gridX: 8, gridY: 7, prerequisites: ['ch4_gate_8'],
    enemyNpcIds: n('npc15', 5), expReward: 7500, itemRewards: NGO_DONG_HOANG,
  }),
  stage4({
    id: 'ch4_gate_10', name: 'Cửa 10', order: 10, displayLabel: '10',
    gridX: 9, gridY: 7, prerequisites: ['ch4_gate_9'],
    enemyWaves: waves(n('npc13', 5), n('npc16', 1)),
    enemyNpcIds: n('npc13', 5), expReward: 8000, itemRewards: NGO_DONG,
  }),
  stage4({
    id: 'ch4_gate_11', name: 'Cửa 11', order: 11, displayLabel: '11',
    gridX: 10, gridY: 7, prerequisites: ['ch4_gate_10'],
    enemyWaves: waves(n('npc14', 5), n('npc16', 1)),
    enemyNpcIds: n('npc14', 5), expReward: 8500, itemRewards: HUYET_LINH,
  }),
  stage4({
    id: 'ch4_gate_12', name: 'Cửa 12', order: 12, displayLabel: '12',
    gridX: 11, gridY: 7, prerequisites: ['ch4_gate_11'],
    enemyWaves: waves(n('npc15', 5), n('npc16', 1)),
    enemyNpcIds: n('npc15', 5), expReward: 9000,
    itemRewards: [{ itemId: 'eq_phaNhuocDao', quantity: 1 }],
  }),
  stage4({
    id: 'ch4_gate_13', name: 'Cửa 13', order: 13, displayLabel: '13',
    gridX: 12, gridY: 6, prerequisites: ['ch4_gate_12'],
    enemyNpcIds: ['npc13', 'npc14', 'npc15', 'npc16'], expReward: 9500,
    itemRewards: [{ itemId: 'eq_thietLangThuong', quantity: 1 }],
  }),
  stage4({
    id: 'ch4_gate_14', name: 'Cửa 14', order: 14, displayLabel: '14',
    gridX: 13, gridY: 6, prerequisites: ['ch4_gate_13'],
    enemyNpcIds: ['npc13', 'npc14', 'npc15', 'npc15', 'npc16'], expReward: 10000,
    itemRewards: [{ itemId: 'eq_mocLinhKiem', quantity: 1 }],
  }),
  stage4({
    id: 'ch4_gate_15', name: 'Cửa 15', order: 15, displayLabel: '15',
    gridX: 14, gridY: 6, prerequisites: ['ch4_gate_14'],
    enemyNpcIds: ['npc13', 'npc14', 'npc15', 'npc16', 'npc16'], expReward: 10500,
    itemRewards: [{ itemId: 'eq_thietChanTac', quantity: 1 }],
  }),
  stage4({
    id: 'ch4_gate_16', name: 'Cửa 16', order: 16, displayLabel: '16',
    gridX: 15, gridY: 6, prerequisites: ['ch4_gate_15'],
    enemyWaves: waves(n('npc14', 5), n('npc16', 5)),
    enemyNpcIds: n('npc14', 5), expReward: 11000,
    itemRewards: [{ itemId: 'eq_thanhMocQuan', quantity: 1 }],
  }),
  stage4({
    id: 'ch4_gate_17', name: 'Cửa 17', order: 17, displayLabel: '17',
    gridX: 16, gridY: 6, prerequisites: ['ch4_gate_16'],
    enemyWaves: waves(n('npc15', 5), n('npc16', 5)),
    enemyNpcIds: n('npc15', 5), expReward: 11500,
    itemRewards: [{ itemId: 'eq_bichMocKhai', quantity: 1 }],
  }),
  stage4({
    id: CH4_GATE_18_ID, name: 'Cửa 18', order: 18, displayLabel: '18',
    gridX: 17, gridY: 6, prerequisites: ['ch4_gate_17'],
    enemyWaves: waves(n('npc16', 5), n('npc16', 5)),
    enemyNpcIds: n('npc16', 5), expReward: 12000,
    itemRewards: [{ itemId: 'eq_thietCuongKhang', quantity: 1 }],
  }),
];
