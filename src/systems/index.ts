export type {
  BattleMode,
  BattleOutcome,
  BattleSetupConfig,
  CombatActionResult,
  CombatCommand,
  CombatPhase,
  CombatUnit,
  CommandType,
  TurnBuff,
  TurnManagerConfig,
  TurnManagerEvents,
} from './combatTypes.ts';

export { WEAPON_DEFAULT_SKILL } from './combatTypes.ts';

export {
  CombatEngine,
  createPveBattle,
  calculateDamage,
  getSkillQiCost,
} from './CombatEngine.ts';

export { TurnManager } from './TurnManager.ts';

export {
  SkillEffectsProcessor,
} from './SkillEffectsProcessor.ts';

export { isSpecialSkill, getSkillEffectId } from '../data/skillsData.ts';

export type {
  UnitActiveEffects,
  SkillEffectApplyContext,
} from './SkillEffectsProcessor.ts';
