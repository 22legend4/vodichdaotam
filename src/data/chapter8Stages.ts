import type { MapStageNode } from '../types/game.ts';
import type { StageItemReward } from '../constants/gameRules.ts';
import { CH7_GATE_28_ID } from './chapter7Stages.ts';

const CH8 = 'chapter_8';

/** Bố cục bản đồ — serpentine S (theo sơ đồ Chương 8). */
const CH8_GATE_GRID: readonly { x: number; y: number }[] = [
  // Cột 1 — xuống (cửa 1–8)
  { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 },
  { x: 0, y: 4 }, { x: 0, y: 5 }, { x: 0, y: 6 }, { x: 0, y: 7 },
  // Hàng dưới sang phải (cửa 9–11; 8 dùng chung góc 0,7)
  { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 },
  // Cột 4 — lên (cửa 12–18; 11 dùng chung góc 3,7)
  { x: 3, y: 6 }, { x: 3, y: 5 }, { x: 3, y: 4 }, { x: 3, y: 3 },
  { x: 3, y: 2 }, { x: 3, y: 1 }, { x: 3, y: 0 },
  // Hàng trên sang phải (cửa 19–21; 18 dùng chung góc 3,0)
  { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 },
  // Cột 7 — xuống (cửa 22–28; 21 dùng chung góc 6,0)
  { x: 6, y: 1 }, { x: 6, y: 2 }, { x: 6, y: 3 }, { x: 6, y: 4 },
  { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 6, y: 7 },
  // Hàng dưới sang phải (cửa 29–31)
  { x: 7, y: 7 }, { x: 8, y: 7 }, { x: 9, y: 7 },
  // Cột 10 — lên (cửa 32–38)
  { x: 9, y: 6 }, { x: 9, y: 5 }, { x: 9, y: 4 }, { x: 9, y: 3 },
  { x: 9, y: 2 }, { x: 9, y: 1 }, { x: 9, y: 0 },
  // Hàng trên sang phải (cửa 39–41)
  { x: 10, y: 0 }, { x: 11, y: 0 }, { x: 12, y: 0 },
  // Cột 13 — xuống (cửa 42–48)
  { x: 12, y: 1 }, { x: 12, y: 2 }, { x: 12, y: 3 }, { x: 12, y: 4 },
  { x: 12, y: 5 }, { x: 12, y: 6 }, { x: 12, y: 7 },
  // Hàng dưới sang phải (cửa 49–51)
  { x: 13, y: 7 }, { x: 14, y: 7 }, { x: 15, y: 7 },
  // Cột 16 — lên (cửa 52–58)
  { x: 15, y: 6 }, { x: 15, y: 5 }, { x: 15, y: 4 }, { x: 15, y: 3 },
  { x: 15, y: 2 }, { x: 15, y: 1 }, { x: 15, y: 0 },
  // Hàng trên sang phải (cửa 59–61)
  { x: 16, y: 0 }, { x: 17, y: 0 }, { x: 18, y: 0 },
  // Cột 19 — xuống (cửa 62–64; 61 dùng chung góc 18,0)
  { x: 18, y: 1 }, { x: 18, y: 2 }, { x: 18, y: 3 },
];

function ch8GatePos(gateNum: number): { gridX: number; gridY: number } {
  const pos = CH8_GATE_GRID[gateNum - 1]!;
  return { gridX: pos.x, gridY: pos.y };
}

function stage8(
  partial: Omit<MapStageNode, 'chapterId' | 'type'> & { chapterId?: string; type?: MapStageNode['type'] },
): MapStageNode {
  return { chapterId: CH8, type: 'normal', ...partial };
}

function n(id: string, count: number): string[] {
  return Array.from({ length: count }, () => id);
}

function waves(...waveNpcLists: string[][]): string[][] {
  return waveNpcLists;
}

const TT_20 = 20;
const DA_PHUC: StageItemReward[] = [{ itemId: 'med_daPhucNguyen', quantity: 10 }];
const PHUC_NGUYEN: StageItemReward[] = [{ itemId: 'med_phucNguyenDan', quantity: 10 }];
const MOC_KHIEN: StageItemReward[] = [{ itemId: 'item_mocKhien', quantity: 10 }];
const CU_THACH_KHIEN: StageItemReward[] = [{ itemId: 'item_cuThachKhien', quantity: 10 }];
const GIOI_THUY: StageItemReward[] = [{ itemId: 'med_gioiThuy', quantity: 1 }];

type RewardKind = 'tt' | 'daPhuc' | 'phucNguyen' | 'mocKhien' | 'cuThach' | 'gioiThuy';

interface Ch8GateDef {
  npc: string;
  /** Một đợt hoặc nhiều đợt (mỗi phần tử = số NPC trong đợt). */
  counts: number[];
  exp: number;
  reward: RewardKind;
}

const REWARD_BY_KIND: Record<RewardKind, { tinhThachReward: number; itemRewards?: StageItemReward[] }> = {
  tt: { tinhThachReward: TT_20 },
  daPhuc: { tinhThachReward: 0, itemRewards: DA_PHUC },
  phucNguyen: { tinhThachReward: 0, itemRewards: PHUC_NGUYEN },
  mocKhien: { tinhThachReward: 0, itemRewards: MOC_KHIEN },
  cuThach: { tinhThachReward: 0, itemRewards: CU_THACH_KHIEN },
  gioiThuy: { tinhThachReward: 0, itemRewards: GIOI_THUY },
};

const CH8_GATE_DEFS: Ch8GateDef[] = [
  { npc: 'npc29', counts: [1], exp: 40_000, reward: 'tt' },
  { npc: 'npc29', counts: [2], exp: 41_000, reward: 'tt' },
  { npc: 'npc29', counts: [3], exp: 42_000, reward: 'tt' },
  { npc: 'npc29', counts: [4], exp: 43_000, reward: 'tt' },
  { npc: 'npc29', counts: [5], exp: 44_000, reward: 'tt' },
  { npc: 'npc29', counts: [1, 5], exp: 45_000, reward: 'tt' },
  { npc: 'npc29', counts: [2, 5], exp: 46_000, reward: 'tt' },
  { npc: 'npc29', counts: [3, 5], exp: 47_000, reward: 'tt' },
  { npc: 'npc29', counts: [4, 5], exp: 48_000, reward: 'tt' },
  { npc: 'npc29', counts: [5, 5], exp: 49_000, reward: 'tt' },
  { npc: 'npc29', counts: [1, 3, 5], exp: 50_000, reward: 'tt' },
  { npc: 'npc29', counts: [2, 3, 5], exp: 51_000, reward: 'daPhuc' },
  { npc: 'npc29', counts: [3, 3, 5], exp: 52_000, reward: 'phucNguyen' },
  { npc: 'npc29', counts: [3, 4, 5], exp: 53_000, reward: 'daPhuc' },
  { npc: 'npc29', counts: [3, 5, 5], exp: 54_000, reward: 'phucNguyen' },
  { npc: 'npc29', counts: [4, 5, 5], exp: 55_000, reward: 'daPhuc' },
  { npc: 'npc29', counts: [5, 5, 5], exp: 56_000, reward: 'phucNguyen' },
  { npc: 'npc30', counts: [1], exp: 57_000, reward: 'daPhuc' },
  { npc: 'npc30', counts: [2], exp: 58_000, reward: 'phucNguyen' },
  { npc: 'npc30', counts: [3], exp: 59_000, reward: 'daPhuc' },
  { npc: 'npc30', counts: [4], exp: 60_000, reward: 'phucNguyen' },
  { npc: 'npc30', counts: [5], exp: 61_000, reward: 'daPhuc' },
  { npc: 'npc30', counts: [1, 5], exp: 62_000, reward: 'phucNguyen' },
  { npc: 'npc30', counts: [2, 5], exp: 63_000, reward: 'daPhuc' },
  { npc: 'npc30', counts: [3, 5], exp: 64_000, reward: 'mocKhien' },
  { npc: 'npc30', counts: [4, 5], exp: 65_000, reward: 'cuThach' },
  { npc: 'npc30', counts: [5, 5], exp: 66_000, reward: 'mocKhien' },
  { npc: 'npc30', counts: [1, 3, 5], exp: 67_000, reward: 'cuThach' },
  { npc: 'npc30', counts: [2, 3, 5], exp: 68_000, reward: 'mocKhien' },
  { npc: 'npc30', counts: [3, 3, 5], exp: 69_000, reward: 'cuThach' },
  { npc: 'npc30', counts: [3, 4, 5], exp: 70_000, reward: 'mocKhien' },
  { npc: 'npc30', counts: [3, 5, 5], exp: 71_000, reward: 'cuThach' },
  { npc: 'npc30', counts: [4, 5, 5], exp: 72_000, reward: 'mocKhien' },
  { npc: 'npc30', counts: [5, 5, 5], exp: 73_000, reward: 'cuThach' },
  { npc: 'npc31', counts: [1], exp: 74_000, reward: 'mocKhien' },
  { npc: 'npc31', counts: [2], exp: 75_000, reward: 'cuThach' },
  { npc: 'npc31', counts: [3], exp: 76_000, reward: 'mocKhien' },
  { npc: 'npc31', counts: [4], exp: 77_000, reward: 'cuThach' },
  { npc: 'npc31', counts: [5], exp: 78_000, reward: 'mocKhien' },
  { npc: 'npc31', counts: [1, 5], exp: 79_000, reward: 'cuThach' },
  { npc: 'npc31', counts: [2, 5], exp: 80_000, reward: 'tt' },
  { npc: 'npc31', counts: [3, 5], exp: 81_000, reward: 'tt' },
  { npc: 'npc31', counts: [4, 5], exp: 82_000, reward: 'tt' },
  { npc: 'npc31', counts: [5, 5], exp: 83_000, reward: 'tt' },
  { npc: 'npc31', counts: [1, 3, 5], exp: 84_000, reward: 'tt' },
  { npc: 'npc31', counts: [2, 3, 5], exp: 85_000, reward: 'tt' },
  { npc: 'npc31', counts: [3, 3, 5], exp: 86_000, reward: 'tt' },
  { npc: 'npc31', counts: [3, 4, 5], exp: 87_000, reward: 'tt' },
  { npc: 'npc31', counts: [3, 5, 5], exp: 88_000, reward: 'tt' },
  { npc: 'npc31', counts: [4, 5, 5], exp: 89_000, reward: 'tt' },
  { npc: 'npc31', counts: [5, 5, 5], exp: 90_000, reward: 'tt' },
  { npc: 'npc32', counts: [1], exp: 91_000, reward: 'tt' },
  { npc: 'npc32', counts: [2], exp: 92_000, reward: 'tt' },
  { npc: 'npc32', counts: [3], exp: 93_000, reward: 'gioiThuy' },
  { npc: 'npc32', counts: [4], exp: 94_000, reward: 'gioiThuy' },
  { npc: 'npc32', counts: [5], exp: 95_000, reward: 'gioiThuy' },
  { npc: 'npc32', counts: [1, 5], exp: 96_000, reward: 'gioiThuy' },
  { npc: 'npc32', counts: [2, 5], exp: 97_000, reward: 'gioiThuy' },
  { npc: 'npc32', counts: [3, 5], exp: 98_000, reward: 'gioiThuy' },
  { npc: 'npc32', counts: [4, 5], exp: 99_000, reward: 'gioiThuy' },
  { npc: 'npc32', counts: [3, 4, 5], exp: 100_000, reward: 'gioiThuy' },
  { npc: 'npc32', counts: [3, 5, 5], exp: 101_000, reward: 'gioiThuy' },
  { npc: 'npc32', counts: [4, 5, 5], exp: 102_000, reward: 'gioiThuy' },
  { npc: 'npc32', counts: [5, 5, 5], exp: 103_000, reward: 'gioiThuy' },
];

export const CH8_GATE_64_ID = 'ch8_gate_64';

function buildCh8Stage(gateNum: number, def: Ch8GateDef): MapStageNode {
  const id = gateNum === 64 ? CH8_GATE_64_ID : `ch8_gate_${gateNum}`;
  const prereq = gateNum === 1 ? [CH7_GATE_28_ID] : [`ch8_gate_${gateNum - 1}`];
  const waveLists = def.counts.map((c) => n(def.npc, c));
  const reward = REWARD_BY_KIND[def.reward];

  return stage8({
    id,
    name: `Cửa ải ${gateNum}`,
    order: gateNum,
    displayLabel: `${gateNum}`,
    ...ch8GatePos(gateNum),
    prerequisites: prereq,
    enemyNpcIds: waveLists[0]!,
    enemyWaves: waveLists.length > 1 ? waves(...waveLists) : undefined,
    expReward: def.exp,
    ...reward,
  });
}

/** Chương 8 – Yêu Minh Nhãn: 64 cửa ải chính. */
export const CHAPTER_8_STAGES: MapStageNode[] = CH8_GATE_DEFS.map((def, i) => buildCh8Stage(i + 1, def));
