import { COMBAT_CONSTANTS } from '../constants/gameRules.ts';
import type { SkillData } from '../types/game.ts';
import type { BattleSide, CombatActionResult, CombatCommand, CombatUnit } from './combatTypes.ts';

/** Hiệu ứng đang hoạt động trên từng unit. */
export interface UnitActiveEffects {
  controlled: boolean;
  controlImmune: boolean;
}

export interface SkillEffectApplyContext {
  actor: CombatUnit;
  skill: SkillData;
  command: CombatCommand;
  units: Map<string, CombatUnit>;
  getAliveUnits: (side?: BattleSide) => CombatUnit[];
  getTotalDef: (unit: CombatUnit) => number;
  pendingDamage: Map<string, number>;
  pendingQiDelta: Map<string, number>;
  random?: () => number;
}

/** Thứ tự xử lý mỗi lượt: miễn khống → công/thủ → giải khống → khống chế (hiệu lực lượt sau). */
const SPECIAL_SKILL_PRIORITY: Record<string, number> = {
  immunityTwoTwo: 1,
  immunityTeamThree: 1,
  breakControlTeam: 3,
  bindOneOne: 4,
  bindTwoTwo: 4,
  bindThreeThree: 4,
  bindThreeFive: 4,
};

interface ScheduledControl {
  skillId: string;
  activeFromTurn: number;
  expiresAfterTurn: number;
}

export class SkillEffectsProcessor {
  private unitEffects = new Map<string, UnitActiveEffects>();
  private activeControls = new Map<string, ScheduledControl>();
  private scheduledControls = new Map<string, ScheduledControl>();
  private immunityUntil = new Map<string, number>();
  private activeDefenseSkills = new Map<string, string>();
  private activeControlIcons = new Map<string, string>();
  private currentTurn = 0;
  private random: () => number;

  constructor(random: () => number = Math.random) {
    this.random = random;
  }

  /** Võ kỹ bổ trợ NPC — bị động, chỉ áp lên bản thân, hiệu lực suốt trận. */
  applyPassiveBattleSupport(
    actor: CombatUnit,
    skill: SkillData,
    getAliveUnits: (side?: BattleSide) => CombatUnit[],
  ): void {
    const battleEndTurn = COMBAT_CONSTANTS.MAX_TURNS;

    if (skill.type === 'immunity') {
      this.immunityUntil.set(actor.id, battleEndTurn);
      this.updateUnitEffect(actor.id, { controlImmune: true });
      return;
    }

    if (skill.type === 'breakControl') {
      for (const ally of getAliveUnits(actor.side)) {
        this.activeControls.delete(ally.id);
        this.activeControlIcons.delete(ally.id);
        this.scheduledControls.delete(ally.id);
        this.updateUnitEffect(ally.id, { controlled: false });
      }
    }
  }

  beginTurn(turnNumber: number): void {
    this.currentTurn = turnNumber;
    this.activeDefenseSkills.clear();

    for (const [unitId, sched] of this.scheduledControls) {
      if (sched.activeFromTurn <= turnNumber) {
        this.activeControls.set(unitId, sched);
        this.activeControlIcons.set(unitId, sched.skillId);
        this.updateUnitEffect(unitId, { controlled: true });
        this.scheduledControls.delete(unitId);
      }
    }

    for (const [unitId, ctrl] of this.activeControls) {
      if (ctrl.expiresAfterTurn < turnNumber) {
        this.activeControls.delete(unitId);
        this.activeControlIcons.delete(unitId);
        this.updateUnitEffect(unitId, { controlled: false });
      }
    }

    for (const [unitId, until] of this.immunityUntil) {
      if (until < turnNumber) {
        this.immunityUntil.delete(unitId);
        this.updateUnitEffect(unitId, { controlImmune: false });
      }
    }
  }

  endTurn(): void {
    this.activeDefenseSkills.clear();

    for (const [unitId, ctrl] of this.activeControls) {
      if (ctrl.expiresAfterTurn <= this.currentTurn) {
        this.activeControls.delete(unitId);
        this.activeControlIcons.delete(unitId);
        this.updateUnitEffect(unitId, { controlled: false });
      }
    }
  }

  /** Địch đang / sắp bị khống chế (hiển thị UI). */
  isBound(unitId: string): boolean {
    if (this.isControlled(unitId)) return true;
    return this.scheduledControls.has(unitId);
  }

  isControlled(unitId: string): boolean {
    const ctrl = this.activeControls.get(unitId);
    if (!ctrl) return false;
    return ctrl.activeFromTurn <= this.currentTurn && ctrl.expiresAfterTurn >= this.currentTurn;
  }

  isControlImmune(unitId: string): boolean {
    const until = this.immunityUntil.get(unitId);
    return until !== undefined && until >= this.currentTurn;
  }

  canUnitAct(unitId: string): boolean {
    return !this.isControlled(unitId);
  }

  getUnitEffects(unitId: string): UnitActiveEffects | undefined {
    return this.unitEffects.get(unitId);
  }

  getDefenseSkillIcon(unitId: string): string | undefined {
    return this.activeDefenseSkills.get(unitId);
  }

  getControlSkillIcon(unitId: string): string | undefined {
    const active = this.activeControlIcons.get(unitId);
    if (active) return active;
    return this.scheduledControls.get(unitId)?.skillId;
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

  sortSpecialCommands(commands: CombatCommand[], getSkillEffect: (id: string) => string | undefined): CombatCommand[] {
    return [...commands].sort((a, b) => {
      const effectA = a.skillId ? getSkillEffect(a.skillId) : '';
      const effectB = b.skillId ? getSkillEffect(b.skillId) : '';
      const priorityA = effectA ? (SPECIAL_SKILL_PRIORITY[effectA] ?? 99) : 99;
      const priorityB = effectB ? (SPECIAL_SKILL_PRIORITY[effectB] ?? 99) : 99;
      return priorityA - priorityB;
    });
  }

  /** Chia lệnh đặc biệt theo phase GDD. */
  partitionSpecialCommands(commands: CombatCommand[], getSkillEffect: (id: string) => string | undefined): {
    immunity: CombatCommand[];
    breakControl: CombatCommand[];
    control: CombatCommand[];
  } {
    const immunity: CombatCommand[] = [];
    const breakControl: CombatCommand[] = [];
    const control: CombatCommand[] = [];

    for (const cmd of commands) {
      const effect = cmd.skillId ? getSkillEffect(cmd.skillId) : undefined;
      if (!effect) continue;
      if (effect.startsWith('immunity')) immunity.push(cmd);
      else if (effect.startsWith('breakControl')) breakControl.push(cmd);
      else if (effect.startsWith('bind')) control.push(cmd);
    }

    return { immunity, breakControl, control };
  }

  applySpecialSkill(ctx: SkillEffectApplyContext): CombatActionResult | null {
    const effect = ctx.skill.effect;
    if (!effect) return null;

    switch (effect) {
      case 'immunityTwoTwo':
        return this.applyImmunityAllies(ctx, 2, 2);
      case 'immunityTeamThree':
        return this.applyImmunityTeam(ctx, 3);
      case 'breakControlTeam':
        return this.applyBreakControlTeam(ctx);
      case 'bindOneOne':
        return this.applyBind(ctx, 1, 1);
      case 'bindTwoTwo':
        return this.applyBind(ctx, 2, 2);
      case 'bindThreeThree':
        return this.applyBind(ctx, 3, 3);
      case 'bindThreeFive':
        return this.applyBind(ctx, 5, 3);
      default:
        return null;
    }
  }

  private applyImmunityAllies(ctx: SkillEffectApplyContext, allyCount: number, turns: number): CombatActionResult | null {
    const targetIds = this.collectAllyTargetIds(ctx, allyCount);
    if (targetIds.length === 0) return null;

    for (const id of targetIds) {
      this.immunityUntil.set(id, this.currentTurn + turns);
      this.updateUnitEffect(id, { controlImmune: true });
    }

    return this.createEffectResult(ctx, ctx.skill.name, ctx.skill.effect!, undefined,
      `${ctx.actor.name} dùng ${ctx.skill.name} cho ${targetIds.length} đồng minh.`);
  }

  private applyImmunityTeam(ctx: SkillEffectApplyContext, turns: number): CombatActionResult {
    for (const ally of ctx.getAliveUnits(ctx.actor.side)) {
      this.immunityUntil.set(ally.id, this.currentTurn + turns);
      this.updateUnitEffect(ally.id, { controlImmune: true });
    }
    return this.createEffectResult(ctx, ctx.skill.name, ctx.skill.effect!);
  }

  private applyBreakControlTeam(ctx: SkillEffectApplyContext): CombatActionResult {
    let freed = 0;
    for (const ally of ctx.getAliveUnits(ctx.actor.side)) {
      if (!this.isControlled(ally.id)) continue;
      this.activeControls.delete(ally.id);
      this.activeControlIcons.delete(ally.id);
      this.scheduledControls.delete(ally.id);
      this.updateUnitEffect(ally.id, { controlled: false });
      freed += 1;
    }
    return this.createEffectResult(
      ctx,
      ctx.skill.name,
      ctx.skill.effect!,
      undefined,
      freed > 0
        ? `${ctx.actor.name} dùng ${ctx.skill.name}, giải khống ${freed} đồng minh.`
        : `${ctx.actor.name} dùng ${ctx.skill.name} — không ai bị khống chế.`,
    );
  }

  private applyBind(ctx: SkillEffectApplyContext, targetCount: number, duration: number): CombatActionResult | null {
    const enemies = ctx.getAliveUnits(ctx.actor.side === 'ally' ? 'enemy' : 'ally');
    const picked = this.collectEnemyTargetIds(ctx, enemies, targetCount);
    if (picked.length === 0) {
      return this.createBlockedResult(ctx, undefined, 'Không có mục tiêu hợp lệ để khống chế.');
    }

    const bound: CombatUnit[] = [];
    for (const targetId of picked) {
      if (this.isControlImmune(targetId)) continue;
      this.applyControlEffect(targetId, ctx.skill.id, duration);
      const target = ctx.units.get(targetId);
      if (target) bound.push(target);
    }

    if (bound.length === 0) {
      return this.createBlockedResult(ctx, undefined, 'Mục tiêu miễn khống.');
    }

    return this.createEffectResult(
      ctx,
      ctx.skill.name,
      ctx.skill.effect!,
      bound[0],
      `${ctx.actor.name} dùng ${ctx.skill.name} lên ${bound.map((u) => u.name).join(', ')} — không thể hành động ${duration} lượt đánh.`,
      bound.map((unit) => unit.id),
    );
  }

  /** Khống chế: chặn ngay lượt đánh hiện tại + duy trì thêm N lượt đánh kế tiếp. */
  private applyControlEffect(targetId: string, skillId: string, duration: number): void {
    this.activeControls.set(targetId, {
      skillId,
      activeFromTurn: this.currentTurn,
      expiresAfterTurn: this.currentTurn,
    });
    this.activeControlIcons.set(targetId, skillId);
    this.updateUnitEffect(targetId, { controlled: true });

    this.scheduledControls.set(targetId, {
      skillId,
      activeFromTurn: this.currentTurn + 1,
      expiresAfterTurn: this.currentTurn + duration,
    });
  }

  private collectAllyTargetIds(ctx: SkillEffectApplyContext, count: number): string[] {
    const ids: string[] = [];
    if (ctx.command.targetId) ids.push(ctx.command.targetId);
    if (ctx.command.extraTargetIds) ids.push(...ctx.command.extraTargetIds);
    const allies = ctx.getAliveUnits(ctx.actor.side).filter((u) => u.id !== ctx.actor.id);
    while (ids.length < count && allies.length > 0) {
      const pick = allies[Math.floor(this.random() * allies.length)]!;
      if (!ids.includes(pick.id)) ids.push(pick.id);
    }
    return ids.slice(0, count);
  }

  /** Khống chế: dùng mục tiêu người chơi chọn; NPC/auto thì ưu tiên địch tổng thủ cao nhất. */
  private collectEnemyTargetIds(
    ctx: SkillEffectApplyContext,
    enemies: CombatUnit[],
    count: number,
  ): string[] {
    const ids: string[] = [];
    if (ctx.command.targetId) ids.push(ctx.command.targetId);
    if (ctx.command.extraTargetIds) {
      for (const id of ctx.command.extraTargetIds) {
        if (!ids.includes(id)) ids.push(id);
      }
    }

    if (ids.length > 0) {
      return ids
        .filter((id) => {
          const enemy = enemies.find((unit) => unit.id === id);
          return Boolean(enemy?.isAlive);
        })
        .slice(0, count);
    }

    return enemies
      .filter((enemy) => enemy.isAlive && !this.isControlImmune(enemy.id))
      .sort((a, b) => {
        const defDiff = ctx.getTotalDef(b) - ctx.getTotalDef(a);
        if (defDiff !== 0) return defDiff;
        return a.id.localeCompare(b.id);
      })
      .slice(0, count)
      .map((enemy) => enemy.id);
  }

  private updateUnitEffect(unitId: string, patch: Partial<UnitActiveEffects>): void {
    const existing = this.unitEffects.get(unitId) ?? { controlled: false, controlImmune: false };
    this.unitEffects.set(unitId, { ...existing, ...patch });
  }

  private createEffectResult(
    ctx: SkillEffectApplyContext,
    skillName: string,
    effect: string,
    target?: CombatUnit,
    customMessage?: string,
    boundTargetIds?: string[],
  ): CombatActionResult {
    return {
      actorId: ctx.actor.id,
      actorName: ctx.actor.name,
      targetId: target?.id,
      targetName: target?.name,
      boundTargetIds,
      actionType: 'special',
      skillId: ctx.skill.id,
      skillName,
      damage: 0,
      healing: 0,
      qiCost: 0,
      qiRecovered: 0,
      message: customMessage ?? `${ctx.actor.name} dùng ${skillName}${target ? ` lên ${target.name}` : ''}.`,
      isNormalAttackFallback: false,
      effectApplied: effect,
    };
  }

  private createBlockedResult(
    ctx: SkillEffectApplyContext,
    target: CombatUnit | undefined,
    message: string,
  ): CombatActionResult {
    return {
      actorId: ctx.actor.id,
      actorName: ctx.actor.name,
      targetId: target?.id,
      targetName: target?.name,
      actionType: 'special',
      skillId: ctx.skill.id,
      skillName: ctx.skill.name,
      damage: 0,
      healing: 0,
      qiCost: 0,
      qiRecovered: 0,
      message,
      isNormalAttackFallback: false,
      blocked: true,
    };
  }
}
