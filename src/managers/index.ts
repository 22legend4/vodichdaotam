export { CharacterManager, COMPANION_TEMPLATES, COMPANION_UNLOCKS, REALM_ORDER } from './CharacterManager.ts';
export type {
  BreakthroughResult,
  CharacterMeta,
  CompanionUnlockDef,
  CreateCompanionInput,
  ComputedCharacterStats,
  CreateMainCharacterInput,
} from './CharacterManager.ts';

export {
  InventoryManager,
  MEDICINE_EFFECTS,
  SPATIAL_RING_ITEM_ID,
  DEFAULT_INVENTORY_CAPACITY,
  EXPANDED_INVENTORY_CAPACITY,
} from './InventoryManager.ts';
export type { InventorySlot, MedicineEffect, UseMedicineResult } from './InventoryManager.ts';

export { StaminaManager, STAMINA_PURCHASE_AMOUNT, STAMINA_PURCHASE_COST } from './StaminaManager.ts';

export { SaveManager, SAVE_STORAGE_KEY, SAVE_VERSION } from './SaveManager.ts';
export type { GameSaveData, StageProgress } from './SaveManager.ts';

export { DailyRewardManager, DAILY_REWARDS } from './DailyRewardManager.ts';
export type { DailyRewardEntry, DailyRewardSaveData, ClaimResult, RewardGrant } from './DailyRewardManager.ts';
