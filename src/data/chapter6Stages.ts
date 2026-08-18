import type { MapStageNode } from '../types/game.ts';
import type { StageItemReward } from '../constants/gameRules.ts';
import { CH5_GATE_12_ID } from './chapter5Stages.ts';

const CH6 = 'chapter_6';

/** Bố cục bản đồ zigzag — 7 cột × 11 hàng (theo sơ đồ Chương 6). */
const CH6_GATE_GRID: readonly { x: number; y: number }[] = [
  { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 },
  { x: 6, y: 1 }, { x: 6, y: 2 },
  { x: 6, y: 3 }, { x: 5, y: 3 }, { x: 4, y: 3 }, { x: 3, y: 3 }, { x: 2, y: 3 }, { x: 1, y: 3 }, { x: 0, y: 3 },
  { x: 0, y: 4 }, { x: 0, y: 5 },
  { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 },
  { x: 6, y: 7 }, { x: 6, y: 8 }, { x: 6, y: 9 },
  { x: 6, y: 10 }, { x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }, { x: 2, y: 10 }, { x: 1, y: 10 }, { x: 0, y: 10 },
];

function ch6GatePos(gateNum: number): { gridX: number; gridY: number } {
  const pos = CH6_GATE_GRID[gateNum - 1]!;
  return { gridX: pos.x, gridY: pos.y };
}

function stage6(
  partial: Omit<MapStageNode, 'chapterId' | 'type'> & { chapterId?: string; type?: MapStageNode['type'] },
): MapStageNode {
  return { chapterId: CH6, tinhThachReward: 0, type: 'normal', ...partial };
}

function n(id: string, count: number): string[] {
  return Array.from({ length: count }, () => id);
}

function waves(...waveNpcLists: string[][]): string[][] {
  return waveNpcLists;
}

const BO_DE: StageItemReward[] = [{ itemId: 'med_boDeQua', quantity: 10 }];
const DIEP_KHONG: StageItemReward[] = [{ itemId: 'med_diepKhongQua', quantity: 10 }];
const DU_HA: StageItemReward[] = [{ itemId: 'med_duHaQua', quantity: 10 }];
const NGHENH_XUAN: StageItemReward[] = [{ itemId: 'med_nghenhXuanThao', quantity: 10 }];
const HAI_HOANG: StageItemReward[] = [{ itemId: 'med_haiHoangThao', quantity: 10 }];
const HAC_BACH: StageItemReward[] = [{ itemId: 'med_hacBachSongHoa', quantity: 10 }];
const HOA_CO: StageItemReward[] = [{ itemId: 'med_hoaCoQua', quantity: 10 }];
const HOA_LIEN: StageItemReward[] = [{ itemId: 'med_hoaLienThao', quantity: 10 }];
const DAI_NGUYEN: StageItemReward[] = [{ itemId: 'med_daiNguyenDan', quantity: 10 }];
const PHUC_NGUYEN: StageItemReward[] = [{ itemId: 'med_phucNguyenDan', quantity: 10 }];
const DA_PHUC: StageItemReward[] = [{ itemId: 'med_daPhucNguyen', quantity: 10 }];
const MOC_KHIEN: StageItemReward[] = [{ itemId: 'item_mocKhien', quantity: 10 }];
const CU_THACH_KHIEN: StageItemReward[] = [{ itemId: 'item_cuThachKhien', quantity: 10 }];
const TICH_LICH_DAN: StageItemReward[] = [{ itemId: 'item_tichLichDan', quantity: 10 }];
const LOI_HOA_CHAU: StageItemReward[] = [{ itemId: 'item_loiHoaChau', quantity: 10 }];
const NGO_DONG_HOANG: StageItemReward[] = [{ itemId: 'med_ngoDongHoangThao', quantity: 1 }];
const NGO_DONG: StageItemReward[] = [{ itemId: 'med_ngoDongThao', quantity: 1 }];
const HUYET_LINH: StageItemReward[] = [{ itemId: 'med_huyetLinhDan', quantity: 1 }];
const PHONG_THAN: StageItemReward[] = [{ itemId: 'mat_phongThanThach', quantity: 1 }];

const GIOI_THUY: StageItemReward[] = [{ itemId: 'med_gioiThuy', quantity: 1 }];

export const CH6_GATE_35_ID = 'ch6_gate_35';
export const CH6_DUNGEON_HUB_ID = 'ch6_ham_nguc';

export const CH6_DUNGEON_BATTLE_IDS = Array.from({ length: 28 }, (_, i) => `ch6_dungeon_${i + 1}`) as readonly string[];

type Ch6DungeonDef = {
  exp: number;
  itemRewards: StageItemReward[];
  enemyNpcIds: string[];
  enemyWaves?: string[][];
};

const CH6_DUNGEON_DEFS: readonly Ch6DungeonDef[] = [
  { exp: 18_000, itemRewards: PHONG_THAN, enemyWaves: waves(n('npc23', 5), n('npc23', 4), n('npc23', 5)), enemyNpcIds: n('npc23', 5) },
  { exp: 19_000, itemRewards: PHONG_THAN, enemyWaves: waves(n('npc23', 4), n('npc23', 5), n('npc24', 1)), enemyNpcIds: n('npc23', 4) },
  { exp: 20_000, itemRewards: PHONG_THAN, enemyNpcIds: n('npc24', 4) },
  { exp: 21_000, itemRewards: DAI_NGUYEN, enemyNpcIds: n('npc24', 5) },
  { exp: 22_000, itemRewards: PHUC_NGUYEN, enemyWaves: waves(n('npc24', 4), n('npc24', 5)), enemyNpcIds: n('npc24', 4) },
  { exp: 23_000, itemRewards: DA_PHUC, enemyWaves: waves(n('npc24', 1), n('npc24', 4), n('npc24', 5)), enemyNpcIds: n('npc24', 1) },
  { exp: 24_000, itemRewards: DAI_NGUYEN, enemyWaves: waves(n('npc24', 2), n('npc24', 4), n('npc24', 5)), enemyNpcIds: n('npc24', 2) },
  { exp: 25_000, itemRewards: PHUC_NGUYEN, enemyWaves: waves(n('npc24', 3), n('npc24', 4), n('npc24', 5)), enemyNpcIds: n('npc24', 3) },
  { exp: 26_000, itemRewards: DA_PHUC, enemyWaves: waves(n('npc24', 4), n('npc24', 4), n('npc24', 5)), enemyNpcIds: n('npc24', 4) },
  { exp: 27_000, itemRewards: NGO_DONG_HOANG, enemyWaves: waves(n('npc24', 5), n('npc24', 5)), enemyNpcIds: n('npc24', 5) },
  { exp: 28_000, itemRewards: NGO_DONG, enemyWaves: waves(n('npc24', 5), n('npc24', 5)), enemyNpcIds: n('npc24', 5) },
  { exp: 29_000, itemRewards: HUYET_LINH, enemyWaves: waves(n('npc24', 5), n('npc24', 5)), enemyNpcIds: n('npc24', 5) },
  { exp: 30_000, itemRewards: NGO_DONG_HOANG, enemyNpcIds: n('npc25', 1) },
  { exp: 31_000, itemRewards: NGO_DONG, enemyNpcIds: n('npc25', 2) },
  { exp: 32_000, itemRewards: HUYET_LINH, enemyNpcIds: n('npc25', 3) },
  { exp: 33_000, itemRewards: PHONG_THAN, enemyNpcIds: n('npc25', 4) },
  { exp: 34_000, itemRewards: PHONG_THAN, enemyNpcIds: n('npc25', 5) },
  { exp: 35_000, itemRewards: PHONG_THAN, enemyWaves: waves(n('npc25', 1), n('npc25', 5)), enemyNpcIds: n('npc25', 1) },
  { exp: 36_000, itemRewards: PHONG_THAN, enemyWaves: waves(n('npc25', 2), n('npc25', 5)), enemyNpcIds: n('npc25', 2) },
  { exp: 37_000, itemRewards: PHONG_THAN, enemyWaves: waves(n('npc25', 3), n('npc25', 5)), enemyNpcIds: n('npc25', 3) },
  { exp: 38_000, itemRewards: PHONG_THAN, enemyWaves: waves(n('npc25', 4), n('npc25', 5)), enemyNpcIds: n('npc25', 4) },
  { exp: 39_000, itemRewards: PHONG_THAN, enemyWaves: waves(n('npc25', 1), n('npc25', 2), n('npc25', 5)), enemyNpcIds: n('npc25', 1) },
  { exp: 40_000, itemRewards: NGO_DONG_HOANG, enemyWaves: waves(n('npc25', 2), n('npc25', 3), n('npc25', 5)), enemyNpcIds: n('npc25', 2) },
  { exp: 41_000, itemRewards: NGO_DONG, enemyWaves: waves(n('npc25', 3), n('npc25', 4), n('npc25', 5)), enemyNpcIds: n('npc25', 3) },
  { exp: 42_000, itemRewards: HUYET_LINH, enemyWaves: waves(n('npc25', 5), n('npc25', 5)), enemyNpcIds: n('npc25', 5) },
  { exp: 43_000, itemRewards: GIOI_THUY, enemyNpcIds: n('npc26', 5) },
  { exp: 44_000, itemRewards: GIOI_THUY, enemyNpcIds: n('npc27', 5) },
  { exp: 45_000, itemRewards: GIOI_THUY, enemyNpcIds: n('npc28', 5) },
];

function buildCh6DungeonStages(): MapStageNode[] {
  return CH6_DUNGEON_DEFS.map((def, index) => {
    const num = index + 1;
    return stage6({
      id: `ch6_dungeon_${num}`,
      name: `Hầm ${num}`,
      order: 35 + num,
      type: 'dungeon',
      displayLabel: `H${num}`,
      gridX: 0,
      gridY: 0,
      prerequisites: num === 1 ? [] : [`ch6_dungeon_${num - 1}`],
      mapHidden: true,
      enemyNpcIds: def.enemyNpcIds,
      ...(def.enemyWaves ? { enemyWaves: def.enemyWaves } : {}),
      expReward: def.exp,
      itemRewards: def.itemRewards,
    });
  });
}

/** Chương 6 – Không Giới: 35 cửa ải chính. */
const CH6_MAIN_STAGES: MapStageNode[] = [
  stage6({
    id: 'ch6_gate_1', name: 'Cửa ải 1', order: 1, displayLabel: '1',
    ...ch6GatePos(1), prerequisites: [CH5_GATE_12_ID],
    enemyNpcIds: n('npc21', 3), expReward: 18_000, itemRewards: MOC_KHIEN,
  }),
  stage6({
    id: 'ch6_gate_2', name: 'Cửa ải 2', order: 2, displayLabel: '2',
    ...ch6GatePos(2), prerequisites: ['ch6_gate_1'],
    enemyNpcIds: n('npc21', 4), expReward: 19_000, itemRewards: CU_THACH_KHIEN,
  }),
  stage6({
    id: 'ch6_gate_3', name: 'Cửa ải 3', order: 3, displayLabel: '3',
    ...ch6GatePos(3), prerequisites: ['ch6_gate_2'],
    enemyNpcIds: n('npc21', 5), expReward: 20_000, itemRewards: TICH_LICH_DAN,
  }),
  stage6({
    id: 'ch6_gate_4', name: 'Cửa ải 4', order: 4, displayLabel: '4',
    ...ch6GatePos(4), prerequisites: ['ch6_gate_3'],
    enemyWaves: waves(n('npc21', 4), n('npc21', 5)),
    enemyNpcIds: n('npc21', 4), expReward: 21_000, itemRewards: LOI_HOA_CHAU,
  }),
  stage6({
    id: 'ch6_gate_5', name: 'Cửa ải 5', order: 5, displayLabel: '5',
    ...ch6GatePos(5), prerequisites: ['ch6_gate_4'],
    enemyNpcIds: n('npc22', 1), expReward: 22_000, itemRewards: HAI_HOANG,
  }),
  stage6({
    id: 'ch6_gate_6', name: 'Cửa ải 6', order: 6, displayLabel: '6',
    ...ch6GatePos(6), prerequisites: ['ch6_gate_5'],
    enemyNpcIds: n('npc22', 2), expReward: 23_000, itemRewards: HAC_BACH,
  }),
  stage6({
    id: 'ch6_gate_7', name: 'Cửa ải 7', order: 7, displayLabel: '7',
    ...ch6GatePos(7), prerequisites: ['ch6_gate_6'],
    enemyNpcIds: n('npc22', 3), expReward: 24_000, itemRewards: HOA_CO,
  }),
  stage6({
    id: 'ch6_gate_8', name: 'Cửa ải 8', order: 8, displayLabel: '8',
    ...ch6GatePos(8), prerequisites: ['ch6_gate_7'],
    enemyNpcIds: n('npc22', 4), expReward: 25_000, itemRewards: HOA_LIEN,
  }),
  stage6({
    id: 'ch6_gate_9', name: 'Cửa ải 9', order: 9, displayLabel: '9',
    ...ch6GatePos(9), prerequisites: ['ch6_gate_8'],
    enemyNpcIds: n('npc22', 5), expReward: 26_000, itemRewards: BO_DE,
  }),
  stage6({
    id: 'ch6_gate_10', name: 'Cửa ải 10', order: 10, displayLabel: '10',
    ...ch6GatePos(10), prerequisites: ['ch6_gate_9'],
    enemyWaves: waves(n('npc22', 4), n('npc22', 5)),
    enemyNpcIds: n('npc22', 4), expReward: 27_000, itemRewards: DIEP_KHONG,
  }),
  stage6({
    id: 'ch6_gate_11', name: 'Cửa ải 11', order: 11, displayLabel: '11',
    ...ch6GatePos(11), prerequisites: ['ch6_gate_10'],
    enemyNpcIds: n('npc23', 1), expReward: 28_000, itemRewards: DU_HA,
  }),
  stage6({
    id: 'ch6_gate_12', name: 'Cửa ải 12', order: 12, displayLabel: '12',
    ...ch6GatePos(12), prerequisites: ['ch6_gate_11'],
    enemyNpcIds: n('npc23', 2), expReward: 29_000, itemRewards: NGHENH_XUAN,
  }),
  stage6({
    id: 'ch6_gate_13', name: 'Cửa ải 13', order: 13, displayLabel: '13',
    ...ch6GatePos(13), prerequisites: ['ch6_gate_12'],
    enemyNpcIds: n('npc23', 3), expReward: 30_000, itemRewards: HAI_HOANG,
  }),
  stage6({
    id: 'ch6_gate_14', name: 'Cửa ải 14', order: 14, displayLabel: '14',
    ...ch6GatePos(14), prerequisites: ['ch6_gate_13'],
    enemyNpcIds: n('npc23', 4), expReward: 31_000, itemRewards: HAC_BACH,
  }),
  stage6({
    id: 'ch6_gate_15', name: 'Cửa ải 15', order: 15, displayLabel: '15',
    ...ch6GatePos(15), prerequisites: ['ch6_gate_14'],
    enemyNpcIds: n('npc23', 5), expReward: 32_000, itemRewards: HOA_CO,
  }),
  stage6({
    id: 'ch6_gate_16', name: 'Cửa ải 16', order: 16, displayLabel: '16',
    ...ch6GatePos(16), prerequisites: ['ch6_gate_15'],
    enemyWaves: waves(n('npc23', 4), n('npc23', 5)),
    enemyNpcIds: n('npc23', 4), expReward: 33_000, itemRewards: HOA_LIEN,
  }),
  stage6({
    id: 'ch6_gate_17', name: 'Cửa ải 17', order: 17, displayLabel: '17',
    ...ch6GatePos(17), prerequisites: ['ch6_gate_16'],
    enemyNpcIds: n('npc24', 1), expReward: 34_000, itemRewards: BO_DE,
  }),
  stage6({
    id: 'ch6_gate_18', name: 'Cửa ải 18', order: 18, displayLabel: '18',
    ...ch6GatePos(18), prerequisites: ['ch6_gate_17'],
    enemyNpcIds: n('npc24', 2), expReward: 35_000, itemRewards: DIEP_KHONG,
  }),
  stage6({
    id: 'ch6_gate_19', name: 'Cửa ải 19', order: 19, displayLabel: '19',
    ...ch6GatePos(19), prerequisites: ['ch6_gate_18'],
    enemyWaves: waves(n('npc24', 1), n('npc24', 2)),
    enemyNpcIds: n('npc24', 1), expReward: 36_000, itemRewards: DU_HA,
  }),
  stage6({
    id: 'ch6_gate_20', name: 'Cửa ải 20', order: 20, displayLabel: '20',
    ...ch6GatePos(20), prerequisites: ['ch6_gate_19'],
    enemyNpcIds: n('npc24', 3), expReward: 37_000, itemRewards: NGHENH_XUAN,
  }),
  stage6({
    id: 'ch6_gate_21', name: 'Cửa ải 21', order: 21, displayLabel: '21',
    ...ch6GatePos(21), prerequisites: ['ch6_gate_20'],
    enemyWaves: waves(n('npc24', 1), n('npc24', 2), n('npc24', 3)),
    enemyNpcIds: n('npc24', 1), expReward: 38_000, itemRewards: HAI_HOANG,
  }),
  stage6({
    id: 'ch6_gate_22', name: 'Cửa ải 22', order: 22, displayLabel: '22',
    ...ch6GatePos(22), prerequisites: ['ch6_gate_21'],
    enemyWaves: waves(n('npc24', 1), n('npc24', 2), n('npc24', 3), n('npc24', 4)),
    enemyNpcIds: n('npc24', 1), expReward: 39_000, itemRewards: HAC_BACH,
  }),
  stage6({
    id: 'ch6_gate_23', name: 'Cửa ải 23', order: 23, displayLabel: '23',
    ...ch6GatePos(23), prerequisites: ['ch6_gate_22'],
    enemyWaves: waves(n('npc21', 5), n('npc21', 4), n('npc21', 5)),
    enemyNpcIds: n('npc21', 5), expReward: 40_000, itemRewards: HOA_CO,
  }),
  stage6({
    id: 'ch6_gate_24', name: 'Cửa ải 24', order: 24, displayLabel: '24',
    ...ch6GatePos(24), prerequisites: ['ch6_gate_23'],
    enemyWaves: waves(n('npc22', 5), n('npc22', 4), n('npc22', 5)),
    enemyNpcIds: n('npc22', 5), expReward: 41_000, itemRewards: HOA_LIEN,
  }),
  stage6({
    id: 'ch6_gate_25', name: 'Cửa ải 25', order: 25, displayLabel: '25',
    ...ch6GatePos(25), prerequisites: ['ch6_gate_24'],
    enemyWaves: waves(n('npc22', 5), n('npc22', 4), n('npc23', 5)),
    enemyNpcIds: n('npc22', 5), expReward: 42_000, itemRewards: BO_DE,
  }),
  stage6({
    id: 'ch6_gate_26', name: 'Cửa ải 26', order: 26, displayLabel: '26',
    ...ch6GatePos(26), prerequisites: ['ch6_gate_25'],
    enemyWaves: waves(n('npc23', 5), n('npc23', 4), n('npc23', 5)),
    enemyNpcIds: n('npc23', 5), expReward: 43_000, itemRewards: DIEP_KHONG,
  }),
  stage6({
    id: 'ch6_gate_27', name: 'Cửa ải 27', order: 27, displayLabel: '27',
    ...ch6GatePos(27), prerequisites: ['ch6_gate_26'],
    enemyWaves: waves(n('npc23', 4), n('npc23', 5), n('npc24', 1)),
    enemyNpcIds: n('npc23', 4), expReward: 44_000, itemRewards: DU_HA,
  }),
  stage6({
    id: 'ch6_gate_28', name: 'Cửa ải 28', order: 28, displayLabel: '28',
    ...ch6GatePos(28), prerequisites: ['ch6_gate_27'],
    enemyNpcIds: n('npc24', 4), expReward: 45_000, itemRewards: NGHENH_XUAN,
  }),
  stage6({
    id: 'ch6_gate_29', name: 'Cửa ải 29', order: 29, displayLabel: '29',
    ...ch6GatePos(29), prerequisites: ['ch6_gate_28'],
    enemyNpcIds: n('npc24', 5), expReward: 46_000, itemRewards: NGHENH_XUAN,
  }),
  stage6({
    id: 'ch6_gate_30', name: 'Cửa ải 30', order: 30, displayLabel: '30',
    ...ch6GatePos(30), prerequisites: ['ch6_gate_29'],
    enemyWaves: waves(n('npc24', 4), n('npc24', 5)),
    enemyNpcIds: n('npc24', 4), expReward: 47_000, itemRewards: NGHENH_XUAN,
  }),
  stage6({
    id: 'ch6_gate_31', name: 'Cửa ải 31', order: 31, displayLabel: '31',
    ...ch6GatePos(31), prerequisites: ['ch6_gate_30'],
    enemyWaves: waves(n('npc24', 1), n('npc24', 4), n('npc24', 5)),
    enemyNpcIds: n('npc24', 1), expReward: 48_000, itemRewards: NGHENH_XUAN,
  }),
  stage6({
    id: 'ch6_gate_32', name: 'Cửa ải 32', order: 32, displayLabel: '32',
    ...ch6GatePos(32), prerequisites: ['ch6_gate_31'],
    enemyWaves: waves(n('npc24', 2), n('npc24', 4), n('npc24', 5)),
    enemyNpcIds: n('npc24', 2), expReward: 49_000, itemRewards: NGHENH_XUAN,
  }),
  stage6({
    id: 'ch6_gate_33', name: 'Cửa ải 33', order: 33, displayLabel: '33',
    ...ch6GatePos(33), prerequisites: ['ch6_gate_32'],
    enemyWaves: waves(n('npc24', 3), n('npc24', 4), n('npc24', 5)),
    enemyNpcIds: n('npc24', 3), expReward: 50_000, itemRewards: DAI_NGUYEN,
  }),
  stage6({
    id: 'ch6_gate_34', name: 'Cửa ải 34', order: 34, displayLabel: '34',
    ...ch6GatePos(34), prerequisites: ['ch6_gate_33'],
    enemyWaves: waves(n('npc24', 4), n('npc24', 4), n('npc24', 5)),
    enemyNpcIds: n('npc24', 4), expReward: 51_000, itemRewards: PHUC_NGUYEN,
  }),
  stage6({
    id: CH6_GATE_35_ID, name: 'Cửa ải 35', order: 35, displayLabel: '35',
    ...ch6GatePos(35), prerequisites: ['ch6_gate_34'],
    enemyWaves: waves(n('npc24', 5), n('npc24', 5)),
    enemyNpcIds: n('npc24', 5), expReward: 52_000, itemRewards: DA_PHUC,
  }),
];

const CH6_DUNGEON_STAGES: MapStageNode[] = buildCh6DungeonStages();

const CH6_HUB_STAGES: MapStageNode[] = [
  stage6({
    id: CH6_DUNGEON_HUB_ID, name: 'Hầm ngục', order: 64, type: 'dungeon', displayLabel: 'Hầm ngục',
    gridX: 3, gridY: 5, prerequisites: [CH6_GATE_35_ID],
    enemyNpcIds: [], expReward: 0,
    trialBattleIds: [...CH6_DUNGEON_BATTLE_IDS],
  }),
];

export const CHAPTER_6_STAGES: MapStageNode[] = [
  ...CH6_MAIN_STAGES,
  ...CH6_HUB_STAGES,
  ...CH6_DUNGEON_STAGES,
];
