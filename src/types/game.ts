import type { StageItemReward } from '../constants/gameRules.ts';

export type WeaponType = 'quyen' | 'kiem' | 'dao' | 'thuong';

export type EquipmentSlot = 'head' | 'body' | 'weapon' | 'feet' | 'pet';

export type RealmLevel =
  | 'LuyenThe'
  | 'NhatTinh'
  | 'NhiTinh'
  | 'TamTinh'
  | 'VanNhien'
  | 'TienLinh'
  | 'GiapLinh'
  | 'CuLinh'
  | 'Hoang'
  | 'Huyen'
  | 'Dia'
  | 'Thien';

/** 1 điểm hp stat = 1 HP thực tế (xem calculateMaxHp). */
export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  qi: number;
}

export interface CharacterData {
  id: string;
  name: string;
  gender: 'nam' | 'nu';
  /** Ngoại hình PNG: nam_1…nam_4 / nu_1…nu_4 (tạo NV); nam_5… / nu_5… (đồng đội, NPC). */
  appearanceId: string;
  weaponType: WeaponType;
  /** Chỉ số cơ bản: 4 điểm gốc + mọi điểm cộng khi thăng cấp / phân bổ. */
  baseStats: BaseStats;
  realm: RealmLevel;
  exp: number;
  currentHp: number;
  maxHp: number;
  currentQi: number;
  maxQi: number;
  equipment: Record<EquipmentSlot, string | null>;
}

export type SkillType = WeaponType | 'chung' | 'dodon' | 'control' | 'immunity' | 'breakControl';

export interface SkillData {
  id: string;
  name: string;
  type: SkillType;
  atkBonus: number;
  defBonus: number;
  /** Chi phí Qi cố định. */
  qiCost: number;
  category: 'damage' | 'defense' | 'control' | 'special';
  description: string;
  /** Điểm võ kỹ cần để mua. */
  skillPointCost: number;
  /** PNG trong public/assets/icons/ */
  iconPath: string;
  /** Hiệu ứng đặc biệt (khống chế, miễn khống…). */
  effect?: string;
}

export type ItemType = 'equipment' | 'medicine' | 'beast' | 'material' | 'currency';
export type PriceType = 'tinhThach' | 'gioiThuy' | 'realMoney';
export type ItemRarity = 'dong' | 'bac' | 'vang' | 'kimcuong' | 'than';

/** Tab phân loại trong túi đồ (ghi đè suy luận từ type). */
export type ItemBagTab = 'weapon' | 'shard' | 'medicine' | 'beast' | 'other';

export interface ItemData {
  id: string;
  name: string;
  slot?: EquipmentSlot;
  weaponType?: WeaponType;
  type: ItemType;
  atk: number;
  def: number;
  hp: number;
  qi: number;
  description: string;
  value: number;
  priceType: PriceType;
  rarity?: ItemRarity;
  /** Tab túi đồ — ưu tiên hơn suy luận từ type. */
  bagTab?: ItemBagTab;
  /** PNG trong public/assets/icons/ — load qua iconAssets. */
  iconPath?: string;
  /** Võ kỹ bổ trợ bị động khi trang bị (yêu thú). */
  supportSkillId?: string | null;
}

export interface NpcData {
  id: string;
  name: string;
  atk: number;
  def: number;
  /** Chỉ số máu (1 stat = 1 HP thực tế). */
  hp: number;
  maxQi: number;
  mainSkillId: string | null;
  supportSkillId: string | null;
}

export type StageType =
  | 'normal'
  | 'companionUnlock'
  | 'arena'
  | 'thunderTrial'
  | 'special'
  /** Hầm ngục — được chơi lại sau khi đã vượt. */
  | 'dungeon';

export interface StageData {
  id: string;
  name: string;
  chapterId: string;
  order: number;
  type: StageType;
  /** Danh sách NPC địch (tối đa 5). */
  enemyNpcIds: string[];
  unlockCompanionId?: string;
  requiredStageId?: string;
  expReward: number;
  tinhThachReward?: number;
  /** Quà vật phẩm khi vượt ải — không dùng để tặng điểm chỉ số. */
  itemRewards?: StageItemReward[];
  /** Mô tả phần thưởng thêm (vd. Giải cứu đồng đội). */
  bonusRewardLabel?: string;
  /** Danh sách vật phẩm để người chơi chọn 1 (Leo Tháp tầng 33). */
  rewardChoiceIds?: readonly string[];
}

/** Node bản đồ nhánh – có tọa độ lưới & điều kiện mở. */
export interface MapStageNode extends StageData {
  gridX: number;
  gridY: number;
  prerequisites: string[];
  displayLabel: string;
  /** Nhiều đợt địch liên tiếp trong cùng một trận. */
  enemyWaves?: string[][];
  /** Yêu cầu số Tinh Thạch đang có để mở (Thiên Tài Trận). */
  requiredTinhThach?: number;
  /** Hub trung tâm – không có trận đánh. */
  isHub?: boolean;
  /** Không hiển thị trên bản đồ (trận con của hub thử thách). */
  mapHidden?: boolean;
  /** Hub thử thách — danh sách id trận con theo thứ tự. */
  trialBattleIds?: string[];
  unlockCompanion?: '1A' | '1B' | '1C' | '1D';
}

export interface ChapterData {
  id: string;
  name: string;
  order: number;
  stages: MapStageNode[];
}
