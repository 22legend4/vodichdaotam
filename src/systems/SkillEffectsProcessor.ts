import type { BattleSide, CombatUnit } from './combatTypes.ts';

/** Hiệu ứng đang hoạt động trên từng unit (chỉ còn phòng thủ). */
export interface UnitActiveEffects {
  controlled: boolean;
  controlImmune: boolean;
}

export class SkillEffectsProcessor {
  private activeDefenseSkills = new Map<string, string>();

  beginTurn(_turnNumber: number): void {
    this.activeDefenseSkills.clear();
  }

  endTurn(): void {
    this.activeDefenseSkills.clear();
  }

  getDefenseSkillIcon(unitId: string): string | undefined {
    return this.activeDefenseSkills.get(unitId);
  }

  setDefenseSkillIcon(unitId: string, skillId: string): void {
    this.activeDefenseSkills.set(unitId, skillId);
  }

  detectActiveCombo(_allies: CombatUnit[]): null {
    return null;
  }

  getComboDamageMultiplier(): number {
    return 1;
  }

  getActiveCombo(): null {
    return null;
  }

  getSkillAtkMultiplier(_unitId: string): number {
    return 1;
  }

  resolveStealthRedirect(intendedTarget: CombatUnit, _getAliveUnits: (side?: BattleSide) => CombatUnit[]): CombatUnit {
    return intendedTarget;
  }

  resolveDamageTarget(originalTargetId: string): string {
    return originalTargetId;
  }

  shouldNegateDamage(_target: CombatUnit, _attackerSide: BattleSide): boolean {
    return false;
  }

  shouldNegateAllyQiCost(_side: BattleSide): boolean {
    return false;
  }

  isTeamVoid(_side: BattleSide): boolean {
    return false;
  }

  canSideAttack(_side: BattleSide): boolean {
    return true;
  }
}
