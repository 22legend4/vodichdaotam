import type { BaseStats, RealmLevel } from '../types/game.ts';

export const DEFAULT_BASE_STATS: BaseStats = {
  hp: 4,
  atk: 4,
  def: 4,
  qi: 4,
};

export const INITIAL_FREE_STAT_POINTS = 10;

export function addBaseStats(a: BaseStats, b: BaseStats): BaseStats {
  return {
    hp: a.hp + b.hp,
    atk: a.atk + b.atk,
    def: a.def + b.def,
    qi: a.qi + b.qi,
  };
}

/** 4 điểm gốc + điểm phân bổ ban đầu → baseStats khởi tạo. */
export function buildBaseStatsFromAllocation(allocation: BaseStats): BaseStats {
  return addBaseStats(DEFAULT_BASE_STATS, allocation);
}

export const REALM_EXP_REQUIREMENTS: Record<RealmLevel, number> = {
  LuyenThe: 0,
  NhatTinh: 1_000,
  NhiTinh: 5_000,
  TamTinh: 20_000,
  VanNhien: 100_000,
  TienLinh: 200_000,
  GiapLinh: 400_000,
  CuLinh: 800_000,
  Hoang: 2_000_000,
  Huyen: 4_000_000,
  Dia: 8_000_000,
  Thien: 20_000_000,
};

export const REALM_STAT_POINTS: Record<RealmLevel, number> = {
  LuyenThe: 0,
  NhatTinh: 10,
  NhiTinh: 30,
  TamTinh: 50,
  VanNhien: 100,
  TienLinh: 150,
  GiapLinh: 200,
  CuLinh: 250,
  Hoang: 400,
  Huyen: 550,
  Dia: 700,
  Thien: 1_200,
};

export const COMBAT_CONSTANTS = {
  MAX_TEAM_SIZE: 5,
  MAX_TURNS: 20,
  TURN_PREPARE_TIME_SEC: 30,
  NORMAL_ATTACK_QI_RECOVERY: 0.2,
} as const;

/** Vượt ải: EXP và/hoặc vật phẩm (+ Tinh Thạch). Không tặng điểm Công/Thủ/Máu/Nguyên khí — chỉ đột phá cảnh giới. */
export interface StageItemReward {
  itemId: string;
  quantity: number;
}

/** Cửa ải đã vượt không được chơi lại — ngoại trừ Hầm ngục (type dungeon). */
export function isHamNguocStage(stage: { type: string }): boolean {
  return stage.type === 'dungeon';
}

/** Trận con Thiên Tài Trận — tiếp tục chuỗi khi chưa hoàn thành hết 6 trận. */
export function isThienTaiStage(stage: { id: string }): boolean {
  return stage.id.startsWith('ch2_thien_tai_');
}

/** Trận con Ngũ Lôi Chiến. */
export function isNguLoiStage(stage: { id: string }): boolean {
  return stage.id.startsWith('ch2_ngu_loi_');
}

/** Trận con Thiên kiêu chi tử (Chương 3). */
export function isThienKieuStage(stage: { id: string }): boolean {
  return stage.id.startsWith('ch3_thien_kieu_');
}

/** Cửa ải tốn 10 thể lực khi vào trận. */
export function isPremiumStaminaStage(stage: { id: string; type: string }): boolean {
  return (
    isHamNguocStage(stage)
    || isNguLoiStage(stage)
    || isThienTaiStage(stage)
    || isThienKieuStage(stage)
  );
}

export function getStageStaminaCost(stage: { id: string; type: string }): number {
  return isPremiumStaminaStage(stage)
    ? STAMINA_CONSTANTS.PREMIUM_STAGE_COST
    : STAMINA_CONSTANTS.NORMAL_STAGE_COST;
}

export const STAMINA_CONSTANTS = {
  MAX_STAMINA: 30,
  RESTORE_RATE_PER_MINUTE: 1,
  NORMAL_STAGE_COST: 1,
  PREMIUM_STAGE_COST: 10,
  HOI_THE_RESTORE_AMOUNT: 25,
  /** Mỗi N lần vượt hết Hầm ngục → tặng 1 Hắc Liên vạn năm. */
  DUNGEON_FULL_CLEAR_REWARD_EVERY: 3,
  DUNGEON_FULL_CLEAR_REWARD_ITEM_ID: 'med_hacLienVanNam',
} as const;

/** Tu Luyện — 1 phút tu luyện = 4 EXP / 1 Tinh thạch (toàn đội). */
export const CULTIVATION_CONSTANTS = {
  EXP_PER_MINUTE: 4,
  TT_PER_MINUTE: 1,
  THIEN_QUY_EXP_MULT: 2,
  THAT_SINH_SPEED_MULT: 7,
  /** Thiền Quy x Thất Sinh = 14x tốc độ. */
  COMBINED_SPEED_MULT: 14,
  BUFF_DURATION_MINUTES: 60,
  THIEN_QUY_ITEM_ID: 'item_thienQuy',
  THAT_SINH_ITEM_ID: 'item_thatSinhThatTuDo',
} as const;
