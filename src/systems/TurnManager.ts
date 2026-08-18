import { COMBAT_CONSTANTS } from '../constants/gameRules.ts';
import { getSkillById, isSpecialSkill, getBindTargetCount } from '../data/skillsData.ts';
import { CombatEngine } from './CombatEngine.ts';
import { MEDICINE_EFFECTS } from '../managers/InventoryManager.ts';
import type {
  BattleMode,
  BattleOutcome,
  CombatCommand,
  CombatPhase,
  CombatUnit,
  TurnManagerConfig,
  TurnManagerEvents,
} from './combatTypes.ts';
import type { BattleSetupConfig } from './combatTypes.ts';

export class TurnManager {
  private engine: CombatEngine;
  private mode: BattleMode;
  private phase: CombatPhase = 'command';
  private turn = 0;
  private outcome: BattleOutcome = 'ongoing';
  private commands = new Map<string, CombatCommand>();
  private commandQueue: string[] = [];
  private commandIndex = 0;
  private prepareDeadline = 0;
  private events: TurnManagerEvents;
  private onUseItem?: TurnManagerConfig['onUseItem'];
  private random: () => number;

  constructor(engine: CombatEngine, config: TurnManagerConfig) {
    this.engine = engine;
    this.mode = config.mode;
    this.events = config.events ?? {};
    this.onUseItem = config.onUseItem;
    this.random = config.random ?? Math.random;
  }

  static fromBattleConfig(
    battleConfig: BattleSetupConfig,
    turnConfig: TurnManagerConfig,
  ): TurnManager {
    const engine = CombatEngine.createFromConfig(battleConfig);
    const manager = new TurnManager(engine, turnConfig);
    manager.startBattle();
    return manager;
  }

  getEngine(): CombatEngine {
    return this.engine;
  }

  getPhase(): CombatPhase {
    return this.phase;
  }

  getTurn(): number {
    return this.turn;
  }

  getOutcome(): BattleOutcome {
    return this.outcome;
  }

  getPrepareTimeRemainingMs(now = Date.now()): number {
    if (this.phase !== 'command') return 0;
    return Math.max(0, this.prepareDeadline - now);
  }

  getPrepareTimeSec(now = Date.now()): number {
    return Math.ceil(this.getPrepareTimeRemainingMs(now) / 1000);
  }

  /** PvE: Lượt 1 có nút. PvP: từ lượt 2. */
  canFightNow(): boolean {
    if (this.phase !== 'command') return false;
    if (this.mode === 'pve') return true;
    return this.turn >= 2;
  }

  getCurrentCommandUnit(): CombatUnit | null {
    if (this.phase !== 'command') return null;

    const unitId = this.commandQueue[this.commandIndex];
    if (!unitId) return null;

    return this.engine.getUnit(unitId) ?? null;
  }

  getSubmittedCommands(): CombatCommand[] {
    return [...this.commands.values()];
  }

  startBattle(): void {
    this.turn = 1;
    this.outcome = 'ongoing';
    this.engine.activateNpcPassiveSupportSkills();
    this.startCommandPhase();
  }

  startCommandPhase(): void {
    this.phase = 'command';
    this.commands.clear();
    this.commandIndex = 0;

    this.commandQueue = this.engine
      .getAliveUnits('ally')
      .filter((unit) => !unit.isPet)
      .map((unit) => unit.id);

    const prepareSec = COMBAT_CONSTANTS.TURN_PREPARE_TIME_SEC;

    this.prepareDeadline = Date.now() + prepareSec * 1000;

    this.events.onTurnStart?.(this.turn);

    const firstUnit = this.getCurrentCommandUnit();
    if (firstUnit) {
      this.events.onCommandRequested?.(firstUnit);
    } else {
      this.beginExecution();
    }
  }

  submitCommand(command: CombatCommand): boolean {
    if (this.phase !== 'command') return false;

    const unit = this.engine.getUnit(command.unitId);
    if (!unit || !unit.isAlive) return false;

    if (command.type === 'item') {
      if (!command.itemId) return false;
    }

    if (!this.validateCommand(command, unit)) return false;

    const expectedUnitId = this.commandQueue[this.commandIndex];

    if (command.unitId === expectedUnitId) {
      this.commands.set(command.unitId, command);
      this.events.onCommandSubmitted?.(command);
      this.commandIndex += 1;

      const nextUnit = this.getCurrentCommandUnit();
      if (nextUnit) {
        this.events.onCommandRequested?.(nextUnit);
      } else {
        this.events.onAllCommandsReady?.();
      }
      return true;
    }

    if (this.commands.has(command.unitId)) {
      this.commands.set(command.unitId, command);
      this.events.onCommandSubmitted?.(command);
      return true;
    }

    return false;
  }

  requestFightNow(): boolean {
    if (!this.canFightNow()) return false;
    this.fillMissingAllyCommands();
    this.beginExecution();
    return true;
  }

  /** Gọi mỗi frame/tick để cập nhật đếm ngược. */
  tick(now = Date.now()): void {
    if (this.phase !== 'command') return;

    const remaining = this.getPrepareTimeRemainingMs(now);
    this.events.onPrepareTimeUpdate?.(remaining);

    if (remaining <= 0) {
      this.fillMissingAllyCommands();
      this.beginExecution();
    }
  }

  private validateCommand(command: CombatCommand, actor: CombatUnit): boolean {
    switch (command.type) {
      case 'attack': {
        if (!command.skillId || !command.targetId) return false;
        const skill = getSkillById(command.skillId);
        const target = this.engine.getUnit(command.targetId);
        if (!skill || !target || target.side === actor.side || !target.isAlive || target.isPet) return false;
        return skill.category === 'damage';
      }
      case 'defense': {
        if (!command.skillId || !command.targetId) return false;
        const skill = getSkillById(command.skillId);
        const target = this.engine.getUnit(command.targetId);
        if (!skill || !target || target.side !== actor.side || !target.isAlive) return false;
        return skill.category === 'defense';
      }
      case 'special': {
        if (!command.skillId) return false;
        const skill = getSkillById(command.skillId);
        if (!skill || !isSpecialSkill(skill)) return false;
        if (skill.category === 'control') {
          const needed = getBindTargetCount(skill.effect);
          if (needed <= 0) return false;

          const targetIds = [
            ...(command.targetId ? [command.targetId] : []),
            ...(command.extraTargetIds ?? []),
          ];

          if (targetIds.length === 0) {
            return actor.side === 'enemy';
          }

          if (targetIds.length !== needed) return false;
          if (new Set(targetIds).size !== targetIds.length) return false;

          return targetIds.every((id) => {
            const target = this.engine.getUnit(id);
            return Boolean(target && target.side !== actor.side && target.isAlive && !target.isPet);
          });
        }
        if (skill.type === 'immunity' && skill.effect === 'immunityTwoTwo') {
          if (!command.targetId) return false;
          const target = this.engine.getUnit(command.targetId);
          return Boolean(target && target.side === actor.side && target.isAlive);
        }
        if (skill.type === 'breakControl' || skill.effect === 'breakControlTeam' || skill.effect === 'immunityTeamThree') {
          return true;
        }
        return Boolean(command.targetId);
      }
      case 'item': {
        if (!command.itemId) return false;
        const effect = MEDICINE_EFFECTS[command.itemId];
        if (!effect) return false;
        if ('target' in effect && effect.target === 'team') {
          return actor.isAlive;
        }
        if (!command.targetId) return false;
        const target = this.engine.getUnit(command.targetId);
        if (!target || !target.isAlive || target.isPet) return false;
        if (effect.kind === 'attackFixedMulti') {
          const targetIds = [
            ...(command.targetId ? [command.targetId] : []),
            ...(command.extraTargetIds ?? []),
          ];
          if (targetIds.length !== effect.hitCount) return false;
          if (new Set(targetIds).size !== targetIds.length) return false;
          return targetIds.every((id) => {
            const hitTarget = this.engine.getUnit(id);
            return Boolean(hitTarget && hitTarget.side !== actor.side && hitTarget.isAlive && !hitTarget.isPet);
          });
        }
        if (effect.kind === 'attackFixed' || effect.kind === 'mutualHpLoss') {
          return target.side !== actor.side;
        }
        return target.side === actor.side;
      }
      case 'normalAttack': {
        if (!command.targetId) return false;
        const target = this.engine.getUnit(command.targetId);
        return Boolean(target && target.side !== actor.side && target.isAlive && !target.isPet);
      }
      default:
        return false;
    }
  }

  private fillMissingAllyCommands(): void {
    for (const unitId of this.commandQueue) {
      if (this.commands.has(unitId)) continue;

      const unit = this.engine.getUnit(unitId);
      if (!unit || !unit.isAlive) continue;

      this.commands.set(unitId, this.createAutoCommand(unit));
    }
  }

  private createAutoCommand(unit: CombatUnit): CombatCommand {
    const enemies = this.engine.getAliveUnits('enemy');
    const randomTarget = enemies[Math.floor(this.random() * enemies.length)];

    if (!randomTarget) {
      return { unitId: unit.id, type: 'normalAttack', targetId: unit.id };
    }

    return { unitId: unit.id, type: 'normalAttack', targetId: randomTarget.id };
  }

  private generateEnemyCommands(): CombatCommand[] {
    return this.engine
      .getAliveUnits('enemy')
      .map((unit) => this.generateNpcCommand(unit));
  }

  /** NPC AI: chỉ Đánh Thường. Võ kỹ bổ trợ (Miễn khống) là bị động — kích hoạt lúc vào trận. */
  private generateNpcCommand(unit: CombatUnit): CombatCommand {
    const enemies = this.engine.getAliveUnits('ally');
    if (enemies.length === 0) {
      return { unitId: unit.id, type: 'normalAttack' };
    }

    const target = enemies[Math.floor(this.random() * enemies.length)]!;
    return { unitId: unit.id, type: 'normalAttack', targetId: target.id };
  }

  private beginExecution(): void {
    if (this.phase === 'execution' || this.phase === 'ended') return;

    this.phase = 'execution';
    this.events.onPhaseChange?.('execution');

    const allyCommands = [...this.commands.values()];
    for (const cmd of allyCommands) {
      if (cmd.type !== 'item' || !cmd.itemId || !this.onUseItem) continue;
      const actor = this.engine.getUnit(cmd.unitId);
      if (!actor?.isAlive) continue;
      if (!this.onUseItem(cmd.itemId, cmd.unitId, cmd.targetId)) {
        this.commands.set(cmd.unitId, this.createAutoCommand(actor));
      }
    }

    const resolvedAllyCommands = [...this.commands.values()];
    const enemyCommands = this.generateEnemyCommands();
    const allCommands = [...resolvedAllyCommands, ...enemyCommands];

    const hpBefore = new Map<string, number>();
    const qiBefore = new Map<string, number>();
    for (const unit of this.engine.getUnits()) {
      hpBefore.set(unit.id, unit.currentHp);
      qiBefore.set(unit.id, unit.currentQi);
    }

    const results = this.engine.executeTurn(allCommands);

    const continueTurn = (): void => {
      this.outcome = this.engine.checkOutcome();

      if (this.outcome !== 'ongoing') {
        this.phase = 'ended';
        this.events.onPhaseChange?.('ended');
        this.events.onBattleEnd?.(this.outcome);
        return;
      }

      this.turn += 1;
      this.startCommandPhase();
    };

    if (this.events.onTurnExecuted) {
      this.events.onTurnExecuted(results, this.turn, hpBefore, qiBefore, continueTurn);
    } else {
      continueTurn();
    }
  }
}

export type { TurnManagerConfig, TurnManagerEvents };
