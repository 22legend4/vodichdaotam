import type { CharacterData, NpcData, WeaponType } from '../types/game.ts';

export type BattleSide = 'ally' | 'enemy';
export type BattleMode = 'pve' | 'pvp';
export type BattleOutcome = 'ongoing' | 'victory' | 'defeat' | 'draw';
export type CombatPhase = 'command' | 'execution' | 'ended';

export type CommandType = 'attack' | 'defense' | 'special' | 'item' | 'normalAttack';

export interface CombatUnit {
  id: string;
  name: string;
  side: BattleSide;
  /** ID nhân vật/NPC gốc. */
  sourceId: string;
  isPet: boolean;
  /** Pet thuộc về nhân vật nào. */
  ownerId?: string;
  baseAtk: number;
  baseDef: number;
  currentHp: number;
  maxHp: number;
  currentQi: number;
  maxQi: number;
  /** Võ kỹ chủ động mang vào trận (NPC: mainSkillId). */
  skillIds: string[];
  /** Võ kỹ bổ trợ bị động — tự kích hoạt suốt trận (vd. Miễn khống). Không thay võ kỹ chủ động. */
  passiveSupportSkillId?: string | null;
  /** Phe địch: ẩn chỉ số theo GDD. */
  hideStats: boolean;
  isAlive: boolean;
}

export interface TurnBuff {
  atkBonus: number;
  defBonus: number;
}

export interface CombatCommand {
  unitId: string;
  type: CommandType;
  skillId?: string;
  targetId?: string;
  /** Mục tiêu bổ sung (Nhị Chỉ: 1, Tam Đằng: 2). */
  extraTargetIds?: string[];
  itemId?: string;
}

export interface CombatActionResult {
  actorId: string;
  actorName: string;
  targetId?: string;
  targetName?: string;
  actionType: CommandType;
  skillId?: string;
  skillName?: string;
  damage: number;
  healing: number;
  qiCost: number;
  qiRecovered: number;
  message: string;
  isNormalAttackFallback: boolean;
  /** Hiệu ứng đặc biệt đã kích hoạt (nếu có). */
  effectApplied?: string;
  /** Mục tiêu bị khống chế (bind). */
  boundTargetIds?: string[];
  /** Mục tiêu được hồi máu/Qi (vd. vật phẩm toàn đội). */
  healedTargetIds?: string[];
  /** Hành động bị chặn (khống chế / hư không). */
  blocked?: boolean;
}

export interface BattleSetupConfig {
  mode: BattleMode;
  allies: CharacterData[];
  enemyNpcIds?: string[];
  enemyCharacters?: CharacterData[];
  getItemById: (id: string) => import('../types/game.ts').ItemData | undefined;
  getNpcById: (id: string) => NpcData | undefined;
  /** Võ kỹ tùy chỉnh theo nhân vật (mặc định: võ kỹ vũ khí + hỗ trợ). */
  allySkillIds?: Record<string, string[]>;
  /** Võ kỹ đã học — dùng cộng chỉ số công/thủ thụ động. */
  allyLearnedSkillIds?: Record<string, string[]>;
}

export interface TurnManagerEvents {
  onPhaseChange?: (phase: CombatPhase) => void;
  onTurnStart?: (turn: number) => void;
  onCommandRequested?: (unit: CombatUnit) => void;
  onCommandSubmitted?: (command: CombatCommand) => void;
  /** Tất cả đồng minh đã chọn lệnh — chờ Chiến Luôn hoặc hết giờ. */
  onAllCommandsReady?: () => void;
  onPrepareTimeUpdate?: (remainingMs: number) => void;
  onTurnExecuted?: (
    results: CombatActionResult[],
    turn: number,
    hpBefore: Map<string, number>,
    qiBefore: Map<string, number>,
    onComplete: () => void,
  ) => void;
  onBattleEnd?: (outcome: BattleOutcome) => void;
}

export interface TurnManagerConfig {
  mode: BattleMode;
  events?: TurnManagerEvents;
  /** Callback tiêu hao vật phẩm khi dùng trong trận. */
  onUseItem?: (itemId: string, actorUnitId: string, targetUnitId?: string) => boolean;
  /** RNG tùy chỉnh (testing). */
  random?: () => number;
}

export const WEAPON_DEFAULT_SKILL: Record<WeaponType, string> = {
  quyen: 'khongPhaQuyen',
  kiem: 'kiemNhuLai',
  dao: 'hoanhKhongDao',
  thuong: 'thuongVoHoi',
};
