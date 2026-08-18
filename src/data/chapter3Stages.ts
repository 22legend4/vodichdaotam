import type { MapStageNode } from '../types/game.ts';
import type { StageItemReward } from '../constants/gameRules.ts';

const CH3 = 'chapter_3';

function stage3(
  partial: Omit<MapStageNode, 'chapterId' | 'type'> & { chapterId?: string; type?: MapStageNode['type'] },
): MapStageNode {
  return { chapterId: CH3, tinhThachReward: 0, type: 'normal', ...partial };
}

function n(id: string, count: number): string[] {
  return Array.from({ length: count }, () => id);
}

function waves(...waveNpcLists: string[][]): string[][] {
  return waveNpcLists;
}

const CO_CHAN: StageItemReward[] = [{ itemId: 'mat_coChanThiet', quantity: 1 }];
const BO_DE: StageItemReward[] = [{ itemId: 'med_boDeQua', quantity: 1 }];
const DIEP_KHONG: StageItemReward[] = [{ itemId: 'med_diepKhongQua', quantity: 1 }];
const DU_HA: StageItemReward[] = [{ itemId: 'med_duHaQua', quantity: 1 }];
const LOI_HOA_CHAU = (qty: number): StageItemReward[] => [{ itemId: 'item_loiHoaChau', quantity: qty }];
const NGHENH_XUAN: StageItemReward[] = [{ itemId: 'med_nghenhXuanThao', quantity: 1 }];
const HAI_HOANG: StageItemReward[] = [{ itemId: 'med_haiHoangThao', quantity: 1 }];
const HAC_BACH: StageItemReward[] = [{ itemId: 'med_hacBachSongHoa', quantity: 1 }];
const HOA_LIEN: StageItemReward[] = [{ itemId: 'med_hoaLienThao', quantity: 1 }];
const HOA_CO: StageItemReward[] = [{ itemId: 'med_hoaCoQua', quantity: 1 }];
const PHONG_THAN = (qty: number): StageItemReward[] => [{ itemId: 'mat_phongThanThach', quantity: qty }];

export const CH3_GATE_38_ID = 'ch3_gate_38';
export const CH3_DUNGEON_HUB_ID = 'ch3_ham_nguc';
export const CH3_THIEN_KIEU_HUB_ID = 'ch3_thien_kieu';

export const CH3_DUNGEON_BATTLE_IDS = Array.from({ length: 21 }, (_, i) => `ch3_dungeon_${i + 1}`) as readonly string[];
export const CH3_THIEN_KIEU_BATTLE_IDS = Array.from({ length: 6 }, (_, i) => `ch3_thien_kieu_${i + 1}`) as readonly string[];

/** Cửa ải chính 1–38 + Start. */
const CH3_MAIN_STAGES: MapStageNode[] = [
  stage3({
    id: 'ch3_start', name: 'Start', order: 0, displayLabel: '★',
    gridX: 7, gridY: 11, prerequisites: ['ch2_arena_4'],
    enemyNpcIds: n('npc9', 1), expReward: 400, itemRewards: CO_CHAN,
  }),
  stage3({
    id: 'ch3_gate_1', name: 'Cửa ải 1', order: 1, displayLabel: '1',
    gridX: 7, gridY: 10, prerequisites: ['ch3_start'],
    enemyNpcIds: n('npc9', 2), expReward: 450, itemRewards: CO_CHAN,
  }),
  stage3({
    id: 'ch3_gate_2', name: 'Cửa ải 2', order: 2, displayLabel: '2',
    gridX: 6, gridY: 10, prerequisites: ['ch3_gate_1'],
    enemyWaves: waves(n('npc9', 1), n('npc9', 2)),
    enemyNpcIds: n('npc9', 1), expReward: 500, itemRewards: LOI_HOA_CHAU(1),
  }),
  stage3({
    id: 'ch3_gate_3', name: 'Cửa ải 3', order: 3, displayLabel: '3',
    gridX: 5, gridY: 13, prerequisites: ['ch3_gate_2'],
    enemyWaves: waves(n('npc9', 2), n('npc9', 2)),
    enemyNpcIds: n('npc9', 2), expReward: 550, tinhThachReward: 20,
  }),
  stage3({
    id: 'ch3_gate_4', name: 'Cửa ải 4', order: 4, displayLabel: '4',
    gridX: 5, gridY: 12, prerequisites: ['ch3_gate_3'],
    enemyNpcIds: n('npc9', 3), expReward: 600, tinhThachReward: 20,
  }),
  stage3({
    id: 'ch3_gate_5', name: 'Cửa ải 5', order: 5, displayLabel: '5',
    gridX: 4, gridY: 12, prerequisites: ['ch3_gate_4'],
    enemyNpcIds: n('npc9', 4), expReward: 650, tinhThachReward: 20,
  }),
  stage3({
    id: 'ch3_gate_6', name: 'Cửa ải 6', order: 6, displayLabel: '6',
    gridX: 4, gridY: 11, prerequisites: ['ch3_gate_5'],
    enemyNpcIds: n('npc9', 5), expReward: 700, itemRewards: NGHENH_XUAN,
  }),
  stage3({
    id: 'ch3_gate_7', name: 'Cửa ải 7', order: 7, displayLabel: '7',
    gridX: 3, gridY: 11, prerequisites: ['ch3_gate_6'],
    enemyWaves: waves(n('npc9', 4), n('npc9', 5)),
    enemyNpcIds: n('npc9', 4), expReward: 750, itemRewards: HAI_HOANG,
  }),
  stage3({
    id: 'ch3_gate_8', name: 'Cửa ải 8', order: 8, displayLabel: '8',
    gridX: 3, gridY: 10, prerequisites: ['ch3_gate_7'],
    enemyNpcIds: n('npc10', 1), expReward: 800, itemRewards: HAC_BACH,
  }),
  stage3({
    id: 'ch3_gate_9', name: 'Cửa ải 9', order: 9, displayLabel: '9',
    gridX: 4, gridY: 9, prerequisites: ['ch3_gate_8'],
    enemyNpcIds: n('npc10', 2), expReward: 850, itemRewards: HOA_LIEN,
  }),
  stage3({
    id: 'ch3_gate_10', name: 'Cửa ải 10', order: 10, displayLabel: '10',
    gridX: 5, gridY: 9, prerequisites: ['ch3_gate_9'],
    enemyNpcIds: n('npc10', 3), expReward: 900, itemRewards: HOA_CO,
  }),
  stage3({
    id: 'ch3_gate_11', name: 'Cửa ải 11', order: 11, displayLabel: '11',
    gridX: 6, gridY: 9, prerequisites: ['ch3_gate_10'],
    enemyNpcIds: n('npc10', 4), expReward: 950, itemRewards: CO_CHAN,
  }),
  stage3({
    id: 'ch3_gate_12', name: 'Cửa ải 12', order: 12, displayLabel: '12',
    gridX: 6, gridY: 8, prerequisites: ['ch3_gate_11'],
    enemyNpcIds: n('npc10', 5), expReward: 1500, itemRewards: CO_CHAN,
  }),
  stage3({
    id: 'ch3_gate_13', name: 'Cửa ải 13', order: 13, displayLabel: '13',
    gridX: 6, gridY: 7, prerequisites: ['ch3_gate_12'],
    enemyWaves: waves(n('npc10', 4), n('npc10', 5)),
    enemyNpcIds: n('npc10', 4), expReward: 1050,
    itemRewards: LOI_HOA_CHAU(10),
  }),
  stage3({
    id: 'ch3_gate_14', name: 'Cửa ải 14', order: 14, displayLabel: '14',
    gridX: 7, gridY: 7, prerequisites: ['ch3_gate_13'],
    enemyNpcIds: n('npc11', 1), expReward: 1100, tinhThachReward: 20,
  }),
  stage3({
    id: 'ch3_gate_15', name: 'Cửa ải 15', order: 15, displayLabel: '15',
    gridX: 8, gridY: 7, prerequisites: ['ch3_gate_14'],
    enemyNpcIds: n('npc11', 2), expReward: 1150, tinhThachReward: 20,
  }),
  stage3({
    id: 'ch3_gate_16', name: 'Cửa ải 16', order: 16, displayLabel: '16',
    gridX: 9, gridY: 7, prerequisites: ['ch3_gate_15'],
    enemyNpcIds: n('npc11', 3), expReward: 1200, tinhThachReward: 20,
  }),
  stage3({
    id: 'ch3_gate_17', name: 'Cửa ải 17', order: 17, displayLabel: '17',
    gridX: 9, gridY: 8, prerequisites: ['ch3_gate_16'],
    enemyNpcIds: n('npc11', 4), expReward: 1250, itemRewards: NGHENH_XUAN,
  }),
  stage3({
    id: 'ch3_gate_18', name: 'Cửa ải 18', order: 18, displayLabel: '18',
    gridX: 8, gridY: 8, prerequisites: ['ch3_gate_17'],
    enemyNpcIds: n('npc11', 5), expReward: 1300, itemRewards: HAI_HOANG,
  }),
  stage3({
    id: 'ch3_gate_19', name: 'Cửa ải 19', order: 19, displayLabel: '19',
    gridX: 9, gridY: 9, prerequisites: ['ch3_gate_18'],
    enemyWaves: waves(n('npc11', 4), n('npc11', 5)),
    enemyNpcIds: n('npc11', 4), expReward: 1350, itemRewards: HAC_BACH,
  }),
  stage3({
    id: 'ch3_gate_20', name: 'Cửa ải 20', order: 20, displayLabel: '20',
    gridX: 10, gridY: 8, prerequisites: ['ch3_gate_19'],
    enemyNpcIds: n('npc12', 1), expReward: 1400, itemRewards: HOA_LIEN,
  }),
  stage3({
    id: 'ch3_gate_21', name: 'Cửa ải 21', order: 21, displayLabel: '21',
    gridX: 11, gridY: 8, prerequisites: ['ch3_gate_20'],
    enemyNpcIds: n('npc12', 2), expReward: 1450, itemRewards: HOA_CO,
  }),
  stage3({
    id: 'ch3_gate_22', name: 'Cửa ải 22', order: 22, displayLabel: '22',
    gridX: 12, gridY: 7, prerequisites: ['ch3_gate_21'],
    enemyWaves: waves(n('npc12', 1), n('npc12', 2)),
    enemyNpcIds: n('npc12', 1), expReward: 1500, itemRewards: CO_CHAN,
  }),
  stage3({
    id: 'ch3_gate_23', name: 'Cửa ải 23', order: 23, displayLabel: '23',
    gridX: 13, gridY: 6, prerequisites: ['ch3_gate_22'],
    enemyNpcIds: n('npc12', 3), expReward: 1550, itemRewards: CO_CHAN,
  }),
  stage3({
    id: 'ch3_gate_24', name: 'Cửa ải 24', order: 24, displayLabel: '24',
    gridX: 13, gridY: 7, prerequisites: ['ch3_gate_23'],
    enemyWaves: waves(n('npc12', 1), n('npc12', 2), n('npc12', 3)),
    enemyNpcIds: n('npc12', 1), expReward: 1600, itemRewards: CO_CHAN,
  }),
  stage3({
    id: 'ch3_gate_25', name: 'Cửa ải 25', order: 25, displayLabel: '25',
    gridX: 13, gridY: 8, prerequisites: ['ch3_gate_24'],
    enemyWaves: waves(n('npc12', 1), n('npc12', 2), n('npc12', 3), n('npc12', 4)),
    enemyNpcIds: n('npc12', 1), expReward: 1650, itemRewards: CO_CHAN,
  }),
  stage3({
    id: 'ch3_gate_26', name: 'Cửa ải 26', order: 26, displayLabel: '26',
    gridX: 13, gridY: 9, prerequisites: ['ch3_gate_25'],
    enemyWaves: waves(n('npc9', 5), n('npc9', 4), n('npc9', 5)),
    enemyNpcIds: n('npc9', 5), expReward: 1700, itemRewards: BO_DE,
  }),
  stage3({
    id: 'ch3_gate_27', name: 'Cửa ải 27', order: 27, displayLabel: '27',
    gridX: 12, gridY: 9, prerequisites: ['ch3_gate_26'],
    enemyWaves: waves(n('npc10', 5), n('npc10', 4), n('npc10', 5)),
    enemyNpcIds: n('npc10', 5), expReward: 1750, itemRewards: DIEP_KHONG,
  }),
  stage3({
    id: 'ch3_gate_28', name: 'Cửa ải 28', order: 28, displayLabel: '28',
    gridX: 11, gridY: 10, prerequisites: ['ch3_gate_27'],
    enemyWaves: waves(n('npc10', 5), n('npc10', 4), n('npc11', 5)),
    enemyNpcIds: n('npc10', 5), expReward: 1800, itemRewards: DU_HA,
  }),
  stage3({
    id: 'ch3_gate_29', name: 'Cửa ải 29', order: 29, displayLabel: '29',
    gridX: 10, gridY: 11, prerequisites: ['ch3_gate_28'],
    enemyWaves: waves(n('npc11', 5), n('npc11', 4), n('npc11', 5)),
    enemyNpcIds: n('npc11', 5), expReward: 1850, itemRewards: NGHENH_XUAN,
  }),
  stage3({
    id: 'ch3_gate_30', name: 'Cửa ải 30', order: 30, displayLabel: '30',
    gridX: 10, gridY: 12, prerequisites: ['ch3_gate_29'],
    enemyWaves: waves(n('npc11', 4), n('npc11', 5), n('npc12', 1)),
    enemyNpcIds: n('npc11', 4), expReward: 1900, itemRewards: HAI_HOANG,
  }),
  stage3({
    id: 'ch3_gate_31', name: 'Cửa ải 31', order: 31, displayLabel: '31',
    gridX: 10, gridY: 13, prerequisites: ['ch3_gate_30'],
    enemyNpcIds: n('npc12', 4), expReward: 1950, itemRewards: HAC_BACH,
  }),
  stage3({
    id: 'ch3_gate_32', name: 'Cửa ải 32', order: 32, displayLabel: '32',
    gridX: 11, gridY: 13, prerequisites: ['ch3_gate_31'],
    enemyNpcIds: n('npc12', 5), expReward: 2000, itemRewards: HOA_LIEN,
  }),
  stage3({
    id: 'ch3_gate_33', name: 'Cửa ải 33', order: 33, displayLabel: '33',
    gridX: 11, gridY: 12, prerequisites: ['ch3_gate_32'],
    enemyWaves: waves(n('npc12', 2), n('npc12', 5)),
    enemyNpcIds: n('npc12', 2), expReward: 2050, itemRewards: HOA_CO,
  }),
  stage3({
    id: 'ch3_gate_34', name: 'Cửa ải 34', order: 34, displayLabel: '34',
    gridX: 11, gridY: 11, prerequisites: ['ch3_gate_33'],
    enemyWaves: waves(n('npc12', 1), n('npc12', 4), n('npc12', 5)),
    enemyNpcIds: n('npc12', 1), expReward: 2100, itemRewards: CO_CHAN,
  }),
  stage3({
    id: 'ch3_gate_35', name: 'Cửa ải 35', order: 35, displayLabel: '35',
    gridX: 12, gridY: 11, prerequisites: ['ch3_gate_34'],
    enemyWaves: waves(n('npc9', 5), n('npc10', 5), n('npc11', 5)),
    enemyNpcIds: n('npc9', 5), expReward: 2150, itemRewards: CO_CHAN,
  }),
  stage3({
    id: 'ch3_gate_36', name: 'Cửa ải 36', order: 36, displayLabel: '36',
    gridX: 13, gridY: 11, prerequisites: ['ch3_gate_35'],
    enemyWaves: waves(n('npc10', 5), n('npc11', 5), n('npc12', 5)),
    enemyNpcIds: n('npc10', 5), expReward: 2200, itemRewards: CO_CHAN,
  }),
  stage3({
    id: 'ch3_gate_37', name: 'Cửa ải 37', order: 37, displayLabel: '37',
    gridX: 14, gridY: 11, prerequisites: ['ch3_gate_36'],
    enemyWaves: waves(n('npc12', 2), n('npc12', 3), n('npc12', 5)),
    enemyNpcIds: n('npc12', 2), expReward: 2250, itemRewards: CO_CHAN,
  }),
  stage3({
    id: CH3_GATE_38_ID, name: 'Cửa ải 38', order: 38, displayLabel: '38',
    gridX: 15, gridY: 11, prerequisites: ['ch3_gate_37'],
    enemyWaves: waves(n('npc12', 5), n('npc12', 5)),
    enemyNpcIds: n('npc12', 5), expReward: 2300, itemRewards: HOA_LIEN,
  }),
];

const CH3_DUNGEON_STAGES: MapStageNode[] = [
  stage3({
    id: 'ch3_dungeon_1', name: 'Hầm 1', order: 39, type: 'dungeon', displayLabel: 'H1',
    gridX: 0, gridY: 0, prerequisites: [], mapHidden: true,
    enemyNpcIds: n('npc11', 5), expReward: 1000, tinhThachReward: 10,
  }),
  stage3({
    id: 'ch3_dungeon_2', name: 'Hầm 2', order: 40, type: 'dungeon', displayLabel: 'H2',
    gridX: 0, gridY: 0, prerequisites: ['ch3_dungeon_1'], mapHidden: true,
    enemyWaves: waves(n('npc11', 4), n('npc11', 5)),
    enemyNpcIds: n('npc11', 4), expReward: 1050, tinhThachReward: 10,
  }),
  stage3({
    id: 'ch3_dungeon_3', name: 'Hầm 3', order: 41, type: 'dungeon', displayLabel: 'H3',
    gridX: 0, gridY: 0, prerequisites: ['ch3_dungeon_2'], mapHidden: true,
    enemyNpcIds: n('npc12', 1), expReward: 1100, tinhThachReward: 10,
  }),
  stage3({
    id: 'ch3_dungeon_4', name: 'Hầm 4', order: 42, type: 'dungeon', displayLabel: 'H4',
    gridX: 0, gridY: 0, prerequisites: ['ch3_dungeon_3'], mapHidden: true,
    enemyNpcIds: n('npc12', 2), expReward: 1150, tinhThachReward: 10,
  }),
  stage3({
    id: 'ch3_dungeon_5', name: 'Hầm 5', order: 43, type: 'dungeon', displayLabel: 'H5',
    gridX: 0, gridY: 0, prerequisites: ['ch3_dungeon_4'], mapHidden: true,
    enemyWaves: waves(n('npc12', 1), n('npc12', 2)),
    enemyNpcIds: n('npc12', 1), expReward: 1200, tinhThachReward: 10,
  }),
  stage3({
    id: 'ch3_dungeon_6', name: 'Hầm 6', order: 44, type: 'dungeon', displayLabel: 'H6',
    gridX: 0, gridY: 0, prerequisites: ['ch3_dungeon_5'], mapHidden: true,
    enemyNpcIds: n('npc12', 3), expReward: 1250, tinhThachReward: 10,
  }),
  stage3({
    id: 'ch3_dungeon_7', name: 'Hầm 7', order: 45, type: 'dungeon', displayLabel: 'H7',
    gridX: 0, gridY: 0, prerequisites: ['ch3_dungeon_6'], mapHidden: true,
    enemyWaves: waves(n('npc12', 1), n('npc12', 2), n('npc12', 3)),
    enemyNpcIds: n('npc12', 1), expReward: 1300, tinhThachReward: 10,
  }),
  stage3({
    id: 'ch3_dungeon_8', name: 'Hầm 8', order: 46, type: 'dungeon', displayLabel: 'H8',
    gridX: 0, gridY: 0, prerequisites: ['ch3_dungeon_7'], mapHidden: true,
    enemyWaves: waves(n('npc12', 1), n('npc12', 2), n('npc12', 3), n('npc12', 4)),
    enemyNpcIds: n('npc12', 1), expReward: 1350, tinhThachReward: 10,
  }),
  stage3({
    id: 'ch3_dungeon_9', name: 'Hầm 9', order: 47, type: 'dungeon', displayLabel: 'H9',
    gridX: 0, gridY: 0, prerequisites: ['ch3_dungeon_8'], mapHidden: true,
    enemyWaves: waves(n('npc9', 5), n('npc9', 4), n('npc9', 5)),
    enemyNpcIds: n('npc9', 5), expReward: 1400, tinhThachReward: 10,
  }),
  stage3({
    id: 'ch3_dungeon_10', name: 'Hầm 10', order: 48, type: 'dungeon', displayLabel: 'H10',
    gridX: 0, gridY: 0, prerequisites: ['ch3_dungeon_9'], mapHidden: true,
    enemyWaves: waves(n('npc10', 5), n('npc10', 4), n('npc10', 5)),
    enemyNpcIds: n('npc10', 5), expReward: 1450, tinhThachReward: 10,
  }),
  stage3({
    id: 'ch3_dungeon_11', name: 'Hầm 11', order: 49, type: 'dungeon', displayLabel: 'H11',
    gridX: 0, gridY: 0, prerequisites: ['ch3_dungeon_10'], mapHidden: true,
    enemyWaves: waves(n('npc10', 5), n('npc10', 4), n('npc11', 5)),
    enemyNpcIds: n('npc10', 5), expReward: 1500, itemRewards: CO_CHAN,
  }),
  stage3({
    id: 'ch3_dungeon_12', name: 'Hầm 12', order: 50, type: 'dungeon', displayLabel: 'H12',
    gridX: 0, gridY: 0, prerequisites: ['ch3_dungeon_11'], mapHidden: true,
    enemyWaves: waves(n('npc11', 5), n('npc11', 4), n('npc11', 5)),
    enemyNpcIds: n('npc11', 5), expReward: 1550, itemRewards: CO_CHAN,
  }),
  stage3({
    id: 'ch3_dungeon_13', name: 'Hầm 13', order: 51, type: 'dungeon', displayLabel: 'H13',
    gridX: 0, gridY: 0, prerequisites: ['ch3_dungeon_12'], mapHidden: true,
    enemyWaves: waves(n('npc11', 4), n('npc11', 5), n('npc12', 1)),
    enemyNpcIds: n('npc11', 4), expReward: 1600, itemRewards: CO_CHAN,
  }),
  stage3({
    id: 'ch3_dungeon_14', name: 'Hầm 14', order: 52, type: 'dungeon', displayLabel: 'H14',
    gridX: 0, gridY: 0, prerequisites: ['ch3_dungeon_13'], mapHidden: true,
    enemyNpcIds: n('npc12', 4), expReward: 1950, itemRewards: CO_CHAN,
  }),
  stage3({
    id: 'ch3_dungeon_15', name: 'Hầm 15', order: 53, type: 'dungeon', displayLabel: 'H15',
    gridX: 0, gridY: 0, prerequisites: ['ch3_dungeon_14'], mapHidden: true,
    enemyNpcIds: n('npc12', 5), expReward: 2000, itemRewards: CO_CHAN,
  }),
  stage3({
    id: 'ch3_dungeon_16', name: 'Hầm 16', order: 54, type: 'dungeon', displayLabel: 'H16',
    gridX: 0, gridY: 0, prerequisites: ['ch3_dungeon_15'], mapHidden: true,
    enemyWaves: waves(n('npc12', 4), n('npc12', 5)),
    enemyNpcIds: n('npc12', 4), expReward: 2050, itemRewards: CO_CHAN,
  }),
  stage3({
    id: 'ch3_dungeon_17', name: 'Hầm 17', order: 55, type: 'dungeon', displayLabel: 'H17',
    gridX: 0, gridY: 0, prerequisites: ['ch3_dungeon_16'], mapHidden: true,
    enemyWaves: waves(n('npc12', 1), n('npc12', 4), n('npc12', 5)),
    enemyNpcIds: n('npc12', 1), expReward: 2100, itemRewards: CO_CHAN,
  }),
  stage3({
    id: 'ch3_dungeon_18', name: 'Hầm 18', order: 56, type: 'dungeon', displayLabel: 'H18',
    gridX: 0, gridY: 0, prerequisites: ['ch3_dungeon_17'], mapHidden: true,
    enemyWaves: waves(n('npc12', 2), n('npc12', 4), n('npc12', 5)),
    enemyNpcIds: n('npc12', 2), expReward: 2150, itemRewards: CO_CHAN,
  }),
  stage3({
    id: 'ch3_dungeon_19', name: 'Hầm 19', order: 57, type: 'dungeon', displayLabel: 'H19',
    gridX: 0, gridY: 0, prerequisites: ['ch3_dungeon_18'], mapHidden: true,
    enemyWaves: waves(n('npc12', 3), n('npc12', 4), n('npc12', 5)),
    enemyNpcIds: n('npc12', 3), expReward: 2200, itemRewards: CO_CHAN,
  }),
  stage3({
    id: 'ch3_dungeon_20', name: 'Hầm 20', order: 58, type: 'dungeon', displayLabel: 'H20',
    gridX: 0, gridY: 0, prerequisites: ['ch3_dungeon_19'], mapHidden: true,
    enemyWaves: waves(n('npc12', 4), n('npc12', 4), n('npc12', 5)),
    enemyNpcIds: n('npc12', 4), expReward: 2250, itemRewards: CO_CHAN,
  }),
  stage3({
    id: 'ch3_dungeon_21', name: 'Hầm 21', order: 59, type: 'dungeon', displayLabel: 'H21',
    gridX: 0, gridY: 0, prerequisites: ['ch3_dungeon_20'], mapHidden: true,
    enemyWaves: waves(n('npc12', 5), n('npc12', 5), n('npc12', 5)),
    enemyNpcIds: n('npc12', 5), expReward: 2300, itemRewards: CO_CHAN,
  }),
];

const CH3_THIEN_KIEU_STAGES: MapStageNode[] = [
  stage3({
    id: 'ch3_thien_kieu_1', name: 'Thiên Kiêu Tử 1', order: 60, type: 'special', displayLabel: 'Tử 1',
    gridX: 0, gridY: 0, prerequisites: [], mapHidden: true,
    enemyWaves: waves(n('npc17', 4), n('npc18', 4), n('npc19', 4)),
    enemyNpcIds: n('npc17', 4), expReward: 10000, itemRewards: PHONG_THAN(3),
  }),
  stage3({
    id: 'ch3_thien_kieu_2', name: 'Thiên Kiêu Tử 2', order: 61, type: 'special', displayLabel: 'Tử 2',
    gridX: 0, gridY: 0, prerequisites: ['ch3_thien_kieu_1'], mapHidden: true,
    enemyWaves: waves(n('npc17', 5), n('npc18', 5), n('npc19', 5)),
    enemyNpcIds: n('npc17', 5), expReward: 10000, itemRewards: PHONG_THAN(3),
  }),
  stage3({
    id: 'ch3_thien_kieu_3', name: 'Thiên Kiêu Tử 3', order: 62, type: 'special', displayLabel: 'Tử 3',
    gridX: 0, gridY: 0, prerequisites: ['ch3_thien_kieu_2'], mapHidden: true,
    enemyWaves: waves(n('npc20', 4), n('npc21', 4), n('npc22', 4)),
    enemyNpcIds: n('npc20', 4), expReward: 10000, itemRewards: PHONG_THAN(3),
  }),
  stage3({
    id: 'ch3_thien_kieu_4', name: 'Thiên Kiêu Tử 4', order: 63, type: 'special', displayLabel: 'Tử 4',
    gridX: 0, gridY: 0, prerequisites: ['ch3_thien_kieu_3'], mapHidden: true,
    enemyWaves: waves(n('npc20', 5), n('npc21', 5), n('npc22', 5)),
    enemyNpcIds: n('npc20', 5), expReward: 10000, itemRewards: PHONG_THAN(3),
  }),
  stage3({
    id: 'ch3_thien_kieu_5', name: 'Thiên Kiêu Tử 5', order: 64, type: 'special', displayLabel: 'Tử 5',
    gridX: 0, gridY: 0, prerequisites: ['ch3_thien_kieu_4'], mapHidden: true,
    enemyWaves: waves(n('npc23', 4), n('npc24', 4), n('npc25', 4)),
    enemyNpcIds: n('npc23', 4), expReward: 10000, itemRewards: PHONG_THAN(3),
  }),
  stage3({
    id: 'ch3_thien_kieu_6', name: 'Thiên Kiêu Tử 6', order: 65, type: 'special', displayLabel: 'Tử 6',
    gridX: 0, gridY: 0, prerequisites: ['ch3_thien_kieu_5'], mapHidden: true,
    enemyWaves: waves(n('npc23', 5), n('npc24', 5), n('npc25', 5)),
    enemyNpcIds: n('npc23', 5), expReward: 10000, itemRewards: PHONG_THAN(5),
  }),
];

const CH3_HUB_STAGES: MapStageNode[] = [
  stage3({
    id: CH3_DUNGEON_HUB_ID, name: 'Hầm ngục', order: 66, type: 'dungeon', displayLabel: 'Hầm ngục',
    gridX: 10, gridY: 5, prerequisites: [CH3_GATE_38_ID],
    enemyNpcIds: [], expReward: 0,
    trialBattleIds: [...CH3_DUNGEON_BATTLE_IDS],
  }),
  stage3({
    id: CH3_THIEN_KIEU_HUB_ID, name: 'Thiên kiêu chi tử', order: 67, type: 'special', displayLabel: 'Thiên kiêu chi tử',
    gridX: 9, gridY: 12, prerequisites: ['ch2_thien_tai_6'],
    enemyNpcIds: [], expReward: 0,
    trialBattleIds: [...CH3_THIEN_KIEU_BATTLE_IDS],
  }),
];

export const CHAPTER_3_STAGES: MapStageNode[] = [
  ...CH3_MAIN_STAGES,
  ...CH3_HUB_STAGES,
  ...CH3_DUNGEON_STAGES,
  ...CH3_THIEN_KIEU_STAGES,
];

export function isThienKieuComplete(clearedIds: readonly string[]): boolean {
  return CH3_THIEN_KIEU_BATTLE_IDS.every((id) => clearedIds.includes(id));
}
