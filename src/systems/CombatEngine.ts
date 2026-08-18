import type { CharacterData, ItemData, NpcData, SkillData } from '../types/game.ts';
import { COMBAT_CONSTANTS } from '../constants/gameRules.ts';
import { buildCombatStatBreakdown } from '../managers/CharacterManager.ts';
import { calculateDamage, calculateMaxHp } from '../utils/damageCalculator.ts';
import { buildBattleSkillIds, getSkillById } from '../data/skillsData.ts';
import { getItemById } from '../data/itemsData.ts';
import { getNpcById } from '../data/npcsData.ts';
import { buildEnemyInstances } from '../utils/combatEnemyInstances.ts';
import { MEDICINE_EFFECTS } from '../managers/InventoryManager.ts';
import { SkillEffectsProcessor } from './SkillEffectsProcessor.ts';
import type {
  BattleOutcome,
  BattleSetupConfig,
  CombatActionResult,
  CombatCommand,
  CombatUnit,
  TurnBuff,
} from './combatTypes.ts';

export type { CombatUnit, CombatCommand, CombatActionResult, BattleOutcome, BattleSetupConfig };

export function getSkillQiCost(skill: SkillData, _maxQi: number): number {
  return skill.qiCost;
}

function clampQi(current: number, max: number): number {
  return Math.max(0, Math.min(max, current));
}

function resolveEquippedPetSupportSkillId(
  character: CharacterData,
  getItemById: (id: string) => ItemData | undefined,
): string | null {
  const petId = character.equipment.pet;
  if (!petId) return null;
  return getItemById(petId)?.supportSkillId ?? null;
}

export class CombatEngine {
  private units = new Map<string, CombatUnit>();
  private turnBuffs = new Map<string, TurnBuff>();
  /** Hệ số công võ kỹ từ vật phẩm — giữ suốt trận (vd. Huyết Khởi Chú). */
  private itemSkillAtkMultipliers = new Map<string, number>();
  private turnNumber = 0;
  private skillEffects: SkillEffectsProcessor;
  /** Đơn vị còn sống khi bắt đầu Execution — vẫn ra chiêu dù HP về 0 trong cùng lượt. */
  private executionEligible = new Set<string>();

  constructor(_random: () => number = Math.random) {
    this.skillEffects = new SkillEffectsProcessor();
  }

  static createFromConfig(config: BattleSetupConfig): CombatEngine {
    const engine = new CombatEngine();

    for (const character of config.allies.slice(0, COMBAT_CONSTANTS.MAX_TEAM_SIZE)) {
      engine.addAllyCharacter(
        character,
        config.getItemById,
        config.allySkillIds?.[character.id],
        config.allyLearnedSkillIds?.[character.id],
      );
    }

    if (config.enemyNpcIds) {
      for (const { unitId, npcId } of buildEnemyInstances(config.enemyNpcIds)) {
        const npc = config.getNpcById(npcId);
        if (npc) engine.addEnemyNpc(npc, unitId);
      }
    }

    if (config.enemyCharacters) {
      for (const character of config.enemyCharacters.slice(0, COMBAT_CONSTANTS.MAX_TEAM_SIZE)) {
        engine.addEnemyCharacter(character, config.getItemById);
      }
    }

    return engine;
  }

  getSkillEffectsProcessor(): SkillEffectsProcessor {
    return this.skillEffects;
  }

  addAllyCharacter(
    character: CharacterData,
    getItemById: (id: string) => ItemData | undefined,
    customSkillIds?: string[],
    learnedSkillIds?: string[],
  ): void {
    const stats = buildCombatStatBreakdown(character, getItemById, learnedSkillIds ?? []);

    const skillIds =
      customSkillIds ??
      buildBattleSkillIds([], character.weaponType);

    this.units.set(character.id, {
      id: character.id,
      name: character.name,
      side: 'ally',
      sourceId: character.id,
      isPet: false,
      baseAtk: stats.baseAtk,
      baseDef: stats.baseDef,
      currentHp: Math.min(character.currentHp, stats.maxHp),
      maxHp: stats.maxHp,
      currentQi: Math.min(character.currentQi, stats.maxQi),
      maxQi: stats.maxQi,
      skillIds,
      passiveSupportSkillId: resolveEquippedPetSupportSkillId(character, getItemById),
      hideStats: false,
      isAlive: character.currentHp > 0,
    });
  }

  addEnemyNpc(npc: NpcData, unitId?: string): void {
    const id = unitId ?? npc.id;
    const maxHp = calculateMaxHp(npc.hp);
    const skillIds = npc.mainSkillId ? [npc.mainSkillId] : [];

    this.units.set(id, {
      id,
      name: npc.name,
      side: 'enemy',
      sourceId: npc.id,
      isPet: false,
      baseAtk: npc.atk,
      baseDef: npc.def,
      currentHp: maxHp,
      maxHp,
      currentQi: npc.maxQi,
      maxQi: npc.maxQi,
      skillIds,
      passiveSupportSkillId: npc.supportSkillId,
      hideStats: true,
      isAlive: true,
    });
  }

  /** @deprecated Không còn võ kỹ bổ trợ bị động — giữ API trống cho tương thích. */
  activateNpcPassiveSupportSkills(): void {}

  addEnemyCharacter(
    character: CharacterData,
    getItemById: (id: string) => ItemData | undefined,
    customSkillIds?: string[],
    learnedSkillIds?: string[],
  ): void {
    const stats = buildCombatStatBreakdown(character, getItemById, learnedSkillIds ?? []);

    const unitId = `enemy_${character.id}`;
    const skillIds =
      customSkillIds ??
      buildBattleSkillIds([], character.weaponType);

    this.units.set(unitId, {
      id: unitId,
      name: character.name,
      side: 'enemy',
      sourceId: character.id,
      isPet: false,
      baseAtk: stats.baseAtk,
      baseDef: stats.baseDef,
      currentHp: Math.min(character.currentHp, stats.maxHp),
      maxHp: stats.maxHp,
      currentQi: Math.min(character.currentQi, stats.maxQi),
      maxQi: stats.maxQi,
      skillIds,
      passiveSupportSkillId: resolveEquippedPetSupportSkillId(character, getItemById),
      hideStats: true,
      isAlive: character.currentHp > 0,
    });
  }

  getUnit(id: string): CombatUnit | undefined {
    return this.units.get(id);
  }

  getUnits(side?: CombatUnit['side']): CombatUnit[] {
    const all = [...this.units.values()];
    return side ? all.filter((u) => u.side === side) : all;
  }

  getAliveUnits(side?: CombatUnit['side']): CombatUnit[] {
    return this.getUnits(side).filter((u) => u.isAlive && !u.isPet);
  }

  getTurnNumber(): number {
    return this.turnNumber;
  }

  clearTurnBuffs(): void {
    this.turnBuffs.clear();
  }

  private getItemSkillAtkMultiplier(unitId: string): number {
    return this.itemSkillAtkMultipliers.get(unitId) ?? 1;
  }

  private setItemSkillAtkMultiplier(unitId: string, multiplier: number): void {
    this.itemSkillAtkMultipliers.set(unitId, multiplier);
  }

  /** Thực thi đồng thời tất cả lệnh trong 1 lượt (GDD: Simultaneous Turn Resolution). */
  executeTurn(commands: CombatCommand[]): CombatActionResult[] {
    this.turnNumber += 1;
    this.skillEffects.beginTurn(this.turnNumber);
    this.skillEffects.detectActiveCombo(this.getAliveUnits('ally'));
    this.clearTurnBuffs();

    this.executionEligible.clear();
    for (const unit of this.units.values()) {
      if (unit.currentHp > 0) {
        this.executionEligible.add(unit.id);
      }
    }

    const results: CombatActionResult[] = [];
    const pendingDamage = new Map<string, number>();
    const pendingHealing = new Map<string, number>();
    const pendingQiDelta = new Map<string, number>();

    const actionCommands = commands;

    for (const command of actionCommands) {
      const result = this.resolveActionCommand(
        command,
        pendingDamage,
        pendingHealing,
        pendingQiDelta,
      );
      if (result) results.push(result);
    }

    this.applyPendingChanges(pendingDamage, pendingHealing, pendingQiDelta);
    this.syncAliveState();
    this.executionEligible.clear();
    this.skillEffects.endTurn();

    return results;
  }

  /** Còn đủ điều kiện ra chiêu trong Execution Phase (snapshot HP). */
  private canExecuteUnit(unitId: string): boolean {
    return this.executionEligible.has(unitId);
  }

  checkOutcome(): BattleOutcome {
    const alliesAlive = this.getAliveUnits('ally').length;
    const enemiesAlive = this.getAliveUnits('enemy').length;

    if (enemiesAlive === 0) return 'victory';
    if (alliesAlive === 0) return 'defeat';
    if (this.turnNumber >= COMBAT_CONSTANTS.MAX_TURNS) return 'draw';
    return 'ongoing';
  }

  private resolveActionCommand(
    command: CombatCommand,
    pendingDamage: Map<string, number>,
    pendingHealing: Map<string, number>,
    pendingQiDelta: Map<string, number>,
  ): CombatActionResult | null {
    const actor = this.units.get(command.unitId);
    if (!actor || !this.canExecuteUnit(actor.id)) {
      return null;
    }

    if (!this.skillEffects.canSideAttack(actor.side)) {
      const isAttackItem =
        command.type === 'item' &&
        command.itemId &&
        (MEDICINE_EFFECTS[command.itemId]?.kind === 'attackFixed'
          || MEDICINE_EFFECTS[command.itemId]?.kind === 'attackFixedMulti');
      if (command.type === 'attack' || command.type === 'normalAttack' || isAttackItem) {
        return this.createBlockedAction(actor, command.type, 'Phe ta đang ở Hư Không, không thể tấn công.');
      }
    }

    switch (command.type) {
      case 'attack':
        return this.resolveAttackCommand(command, actor, pendingDamage, pendingQiDelta);
      case 'defense':
        return this.resolveDefenseCommand(command, actor, pendingQiDelta);
      case 'item':
        return this.resolveItemCommand(command, actor, pendingDamage, pendingHealing, pendingQiDelta);
      case 'normalAttack':
        return this.resolveNormalAttackCommand(command, actor, pendingDamage, pendingQiDelta);
      default:
        return null;
    }
  }

  private resolveAttackCommand(
    command: CombatCommand,
    actor: CombatUnit,
    pendingDamage: Map<string, number>,
    pendingQiDelta: Map<string, number>,
  ): CombatActionResult | null {
    if (!command.targetId || !command.skillId) return null;

    let target = this.units.get(command.targetId);
    if (!target || !target.isAlive) return null;

    const skill = getSkillById(command.skillId);
    if (!skill) return null;

    const qiCost = getSkillQiCost(skill, actor.maxQi);
    if (!this.tryConsumeQi(actor, qiCost, pendingQiDelta)) {
      return this.resolveQiFallbackNormalAttack(command, actor, pendingDamage, pendingQiDelta);
    }

    const redirected = this.skillEffects.resolveStealthRedirect(
      target,
      (side) => this.getAliveUnits(side),
    );
    if (!redirected) {
      return {
        actorId: actor.id,
        actorName: actor.name,
        actionType: 'attack',
        skillId: skill.id,
        skillName: skill.name,
        damage: 0,
        healing: 0,
        qiCost,
        qiRecovered: 0,
        message: `${actor.name} tấn công ${target.name} nhưng Ẩn thân vô hiệu (không còn đồng đội).`,
        isNormalAttackFallback: false,
        blocked: true,
      };
    }
    target = redirected;

    if (this.skillEffects.shouldNegateDamage(target, actor.side)) {
      return {
        actorId: actor.id,
        actorName: actor.name,
        targetId: target.id,
        targetName: target.name,
        actionType: 'attack',
        skillId: skill.id,
        skillName: skill.name,
        damage: 0,
        healing: 0,
        qiCost,
        qiRecovered: 0,
        message: `${target.name} né đòn nhờ Hư Không.`,
        isNormalAttackFallback: false,
        blocked: true,
      };
    }

    const skillMultiplier =
      this.skillEffects.getSkillAtkMultiplier(actor.id) * this.getItemSkillAtkMultiplier(actor.id);
    const comboMultiplier = this.skillEffects.getComboDamageMultiplier();
    const totalAtk = Math.floor((actor.baseAtk + skill.atkBonus) * skillMultiplier * comboMultiplier);

    const targetBuff = this.turnBuffs.get(target.id);
    const totalDef = target.baseDef + (targetBuff?.defBonus ?? 0);
    const damage = calculateDamage(totalAtk, totalDef);

    const finalTargetId = this.skillEffects.resolveDamageTarget(target.id);
    this.addPendingDelta(pendingDamage, finalTargetId, damage);

    const comboText = '';

    return {
      actorId: actor.id,
      actorName: actor.name,
      targetId: finalTargetId,
      targetName: this.units.get(finalTargetId)?.name ?? target.name,
      actionType: 'attack',
      skillId: skill.id,
      skillName: skill.name,
      damage,
      healing: 0,
      qiCost,
      qiRecovered: 0,
      message: `${actor.name} dùng ${skill.name} lên ${this.units.get(finalTargetId)?.name ?? target.name}, gây ${damage} sát thương${comboText}.`,
      isNormalAttackFallback: false,
    };
  }

  private resolveDefenseCommand(
    command: CombatCommand,
    actor: CombatUnit,
    pendingQiDelta: Map<string, number>,
  ): CombatActionResult | null {
    if (!command.targetId || !command.skillId) return null;

    const target = this.units.get(command.targetId);
    if (!target || !target.isAlive) return null;

    const skill = getSkillById(command.skillId);
    if (!skill || skill.category !== 'defense') return null;

    const qiCost = getSkillQiCost(skill, actor.maxQi);
    if (!this.tryConsumeQi(actor, qiCost, pendingQiDelta)) {
      return this.resolveQiFallbackNormalAttack(
        command,
        actor,
        new Map(),
        pendingQiDelta,
      );
    }

    const allies = this.getAliveUnits(actor.side);
    for (const ally of allies) {
      const existing = this.turnBuffs.get(ally.id) ?? { atkBonus: 0, defBonus: 0 };
      this.turnBuffs.set(ally.id, {
        atkBonus: existing.atkBonus + skill.atkBonus,
        defBonus: existing.defBonus + skill.defBonus,
      });
      this.skillEffects.setDefenseSkillIcon(ally.id, skill.id);
    }

    const buffText = skill.defBonus > 0 ? ` — toàn đội +${skill.defBonus} tổng thủ` : '';

    return {
      actorId: actor.id,
      actorName: actor.name,
      targetId: target.id,
      targetName: target.name,
      actionType: 'defense',
      skillId: skill.id,
      skillName: skill.name,
      damage: 0,
      healing: 0,
      qiCost,
      qiRecovered: 0,
      message: `${actor.name} dùng ${skill.name}${buffText}.`,
      isNormalAttackFallback: false,
    };
  }

  private resolveItemCommand(
    command: CombatCommand,
    actor: CombatUnit,
    pendingDamage: Map<string, number>,
    pendingHealing: Map<string, number>,
    pendingQiDelta: Map<string, number>,
  ): CombatActionResult | null {
    if (!command.itemId) return null;

    const effect = MEDICINE_EFFECTS[command.itemId];
    if (!effect) return null;

    const isTeamItem = 'target' in effect && effect.target === 'team';
    if (!command.targetId && !isTeamItem) return null;

    const item = getItemById(command.itemId);
    const itemName = item?.name ?? command.itemId;

    let healing = 0;
    let damage = 0;
    let qiRecovered = 0;
    let message = `${actor.name} dùng ${itemName}.`;
    let resultTargetId = command.targetId ?? actor.id;
    let healedTargetIds: string[] | undefined;
    const pickedTargetId = command.targetId;

    if (effect.kind === 'attackFixed') {
      if (!pickedTargetId) return null;
      const target = this.units.get(pickedTargetId);
      if (!target || !target.isAlive || target.side === actor.side || target.isPet) return null;

      const targetBuff = this.turnBuffs.get(target.id);
      const totalDef = target.baseDef + (targetBuff?.defBonus ?? 0);
      damage = calculateDamage(effect.atk, totalDef);
      const finalTargetId = this.skillEffects.resolveDamageTarget(target.id);
      this.addPendingDelta(pendingDamage, finalTargetId, damage);
      resultTargetId = finalTargetId;
      message = `${actor.name} dùng ${itemName} lên ${this.units.get(finalTargetId)?.name ?? target.name}, gây ${damage} sát thương.`;
    } else if (effect.kind === 'attackFixedMulti') {
      const targetIds: string[] = [];
      if (pickedTargetId) targetIds.push(pickedTargetId);
      if (command.extraTargetIds) {
        for (const id of command.extraTargetIds) {
          if (!targetIds.includes(id)) targetIds.push(id);
        }
      }

      const targets: CombatUnit[] = [];
      for (const id of targetIds.slice(0, effect.hitCount)) {
        const hitTarget = this.units.get(id);
        if (hitTarget?.isAlive && hitTarget.side !== actor.side && !hitTarget.isPet) {
          targets.push(hitTarget);
        }
      }
      if (targets.length === 0) return null;

      const hitParts: string[] = [];
      for (const hitTarget of targets) {
        const targetBuff = this.turnBuffs.get(hitTarget.id);
        const totalDef = hitTarget.baseDef + (targetBuff?.defBonus ?? 0);
        const hitDamage = calculateDamage(effect.atk, totalDef);
        const finalTargetId = this.skillEffects.resolveDamageTarget(hitTarget.id);
        this.addPendingDelta(pendingDamage, finalTargetId, hitDamage);
        damage += hitDamage;
        const finalName = this.units.get(finalTargetId)?.name ?? hitTarget.name;
        hitParts.push(`${finalName} (${hitDamage})`);
      }
      resultTargetId = targets[0]!.id;
      message = `${actor.name} dùng ${itemName} trúng ${hitParts.join(', ')}.`;
    } else if (effect.kind === 'healHp') {
      if (effect.target === 'team') {
        healedTargetIds = [];
        for (const ally of this.getAliveUnits('ally')) {
          this.addPendingDelta(pendingHealing, ally.id, effect.amount);
          healedTargetIds.push(ally.id);
        }
        healing = effect.amount;
        message = `${actor.name} dùng ${itemName}, toàn đội hồi ${effect.amount} HP.`;
      } else if (command.targetId) {
        this.addPendingDelta(pendingHealing, command.targetId, effect.amount);
        healing = effect.amount;
        healedTargetIds = [command.targetId];
        const target = this.units.get(command.targetId);
        message = `${actor.name} dùng ${itemName}, ${target?.name ?? 'mục tiêu'} hồi ${effect.amount} HP.`;
      }
    } else if (effect.kind === 'healHpPercent') {
      if (effect.target === 'team') {
        healedTargetIds = [];
        for (const ally of this.getAliveUnits('ally')) {
          const amount = Math.floor(ally.maxHp * effect.percent);
          this.addPendingDelta(pendingHealing, ally.id, amount);
          healedTargetIds.push(ally.id);
          healing = Math.max(healing, amount);
        }
        message = `${actor.name} dùng ${itemName}, toàn đội hồi ${effect.percent * 100}% HP.`;
      } else if (command.targetId) {
        const target = this.units.get(command.targetId);
        if (target) {
          const amount = Math.floor(target.maxHp * effect.percent);
          this.addPendingDelta(pendingHealing, command.targetId, amount);
          healing = amount;
          healedTargetIds = [command.targetId];
          message = `${actor.name} dùng ${itemName}, ${target.name} hồi ${effect.percent * 100}% HP.`;
        }
      }
    } else if (effect.kind === 'restoreQi') {
      const targetId = command.targetId ?? actor.id;
      this.addPendingDelta(pendingQiDelta, targetId, effect.amount);
      qiRecovered = effect.amount;
      const target = this.units.get(targetId);
      message = `${actor.name} dùng ${itemName}, ${target?.name ?? 'mục tiêu'} hồi ${effect.amount} Qi.`;
    } else if (effect.kind === 'restoreQiFull') {
      const targets =
        effect.target === 'team'
          ? this.getAliveUnits('ally')
          : [this.units.get(command.targetId ?? actor.id)].filter(Boolean) as CombatUnit[];
      if (effect.target === 'team') {
        healedTargetIds = targets.map((target) => target.id);
      }
      for (const target of targets) {
        const pending = pendingQiDelta.get(target.id) ?? 0;
        const needed = Math.max(0, target.maxQi - (target.currentQi + pending));
        if (needed > 0) {
          this.addPendingDelta(pendingQiDelta, target.id, needed);
          qiRecovered = Math.max(qiRecovered, needed);
        }
      }
      message =
        effect.target === 'team'
          ? `${actor.name} dùng ${itemName}, toàn đội hồi đầy nguyên khí.`
          : `${actor.name} dùng ${itemName}, hồi đầy nguyên khí.`;
    } else if (effect.kind === 'restoreQiPercent') {
      const targets =
        effect.target === 'team'
          ? this.getAliveUnits('ally')
          : [this.units.get(command.targetId ?? actor.id)].filter(Boolean) as CombatUnit[];
      if (effect.target === 'team') {
        healedTargetIds = targets.map((target) => target.id);
      }
      for (const target of targets) {
        const amount = Math.floor(target.maxQi * effect.percent);
        if (amount > 0) {
          this.addPendingDelta(pendingQiDelta, target.id, amount);
          qiRecovered = Math.max(qiRecovered, amount);
        }
      }
      message =
        effect.target === 'team'
          ? `${actor.name} dùng ${itemName}, toàn đội hồi ${effect.percent * 100}% nguyên khí tối đa.`
          : `${actor.name} dùng ${itemName}, hồi ${effect.percent * 100}% nguyên khí tối đa.`;
    } else if (effect.kind === 'buffDef') {
      const target = this.units.get(command.targetId ?? actor.id);
      if (!target || !target.isAlive || target.side !== actor.side || target.isPet) return null;

      const existing = this.turnBuffs.get(target.id) ?? { atkBonus: 0, defBonus: 0 };
      this.turnBuffs.set(target.id, {
        atkBonus: existing.atkBonus,
        defBonus: existing.defBonus + effect.amount,
      });
      resultTargetId = target.id;
      message = `${actor.name} dùng ${itemName}, ${target.name} +${effect.amount} tổng thủ trong lượt này.`;
    } else if (effect.kind === 'sacrificeHpForSkillAtk') {
      const target = this.units.get(command.targetId ?? actor.id);
      if (!target || !target.isAlive || target.side !== actor.side || target.isPet) return null;

      const hpLoss = Math.floor(target.maxHp * effect.hpLossPercent);
      if (hpLoss > 0) {
        this.addPendingDelta(pendingDamage, target.id, hpLoss);
        damage = hpLoss;
      }
      this.setItemSkillAtkMultiplier(target.id, effect.skillAtkMultiplier);
      resultTargetId = target.id;
      message =
        `${actor.name} dùng ${itemName}, ${target.name} mất ${Math.round(effect.hpLossPercent * 100)}% máu — `
        + `võ kỹ x${effect.skillAtkMultiplier} ở các lần tấn công sau.`;
    } else if (effect.kind === 'mutualHpLoss') {
      if (!pickedTargetId) return null;
      const target = this.units.get(pickedTargetId);
      if (!target || !target.isAlive || target.side === actor.side || target.isPet) return null;

      this.addPendingDelta(pendingDamage, actor.id, effect.amount);
      this.addPendingDelta(pendingDamage, target.id, effect.amount);
      damage = effect.amount;
      resultTargetId = target.id;
      message = `${actor.name} dùng ${itemName}, bản thân và ${target.name} mỗi bên mất ${effect.amount} máu.`;
    } else {
      return null;
    }

    const normalAttackQi =
      actor.maxQi > 0
        ? Math.floor(actor.maxQi * COMBAT_CONSTANTS.NORMAL_ATTACK_QI_RECOVERY)
        : 0;
    if (normalAttackQi > 0 && !this.skillEffects.shouldNegateAllyQiCost(actor.side)) {
      this.addPendingDelta(pendingQiDelta, actor.id, normalAttackQi);
      qiRecovered += normalAttackQi;
    }

    return {
      actorId: actor.id,
      actorName: actor.name,
      targetId: resultTargetId,
      targetName: resultTargetId ? this.units.get(resultTargetId)?.name : undefined,
      healedTargetIds,
      actionType: 'item',
      skillId: command.itemId,
      skillName: itemName,
      damage,
      healing,
      qiCost: 0,
      qiRecovered,
      message,
      isNormalAttackFallback: false,
    };
  }

  private resolveNormalAttackCommand(
    command: CombatCommand,
    actor: CombatUnit,
    pendingDamage: Map<string, number>,
    pendingQiDelta: Map<string, number>,
    isFallback = false,
  ): CombatActionResult | null {
    if (!command.targetId) return null;

    let target = this.units.get(command.targetId);
    if (!target || !target.isAlive) return null;

    const redirected = this.skillEffects.resolveStealthRedirect(
      target,
      (side) => this.getAliveUnits(side),
    );
    if (!redirected) {
      return {
        actorId: actor.id,
        actorName: actor.name,
        actionType: 'normalAttack',
        damage: 0,
        healing: 0,
        qiCost: 0,
        qiRecovered: 0,
        message: `${actor.name} tấn công nhưng Ẩn thân vô hiệu.`,
        isNormalAttackFallback: isFallback,
        blocked: true,
      };
    }
    target = redirected;

    if (this.skillEffects.shouldNegateDamage(target, actor.side)) {
      const qiRecovered =
        actor.maxQi > 0
          ? Math.floor(actor.maxQi * COMBAT_CONSTANTS.NORMAL_ATTACK_QI_RECOVERY)
          : 0;
      if (qiRecovered > 0 && !this.skillEffects.shouldNegateAllyQiCost(actor.side)) {
        this.addPendingDelta(pendingQiDelta, actor.id, qiRecovered);
      }
      return {
        actorId: actor.id,
        actorName: actor.name,
        targetId: target.id,
        targetName: target.name,
        actionType: 'normalAttack',
        damage: 0,
        healing: 0,
        qiCost: 0,
        qiRecovered,
        message: `${target.name} né đòn nhờ Hư Không.`,
        isNormalAttackFallback: isFallback,
        blocked: true,
      };
    }

    const comboMultiplier = this.skillEffects.getComboDamageMultiplier();
    const totalAtk = Math.floor(actor.baseAtk * comboMultiplier);

    const targetBuff = this.turnBuffs.get(target.id);
    const totalDef = target.baseDef + (targetBuff?.defBonus ?? 0);
    const damage = calculateDamage(totalAtk, totalDef);

    const finalTargetId = this.skillEffects.resolveDamageTarget(target.id);
    this.addPendingDelta(pendingDamage, finalTargetId, damage);

    const qiRecovered =
      actor.maxQi > 0
        ? Math.floor(actor.maxQi * COMBAT_CONSTANTS.NORMAL_ATTACK_QI_RECOVERY)
        : 0;

    if (qiRecovered > 0 && !this.skillEffects.shouldNegateAllyQiCost(actor.side)) {
      this.addPendingDelta(pendingQiDelta, actor.id, qiRecovered);
    }

    return {
      actorId: actor.id,
      actorName: actor.name,
      targetId: finalTargetId,
      targetName: this.units.get(finalTargetId)?.name ?? target.name,
      actionType: 'normalAttack',
      damage,
      healing: 0,
      qiCost: 0,
      qiRecovered,
      message: isFallback
        ? `${actor.name} không đủ Nguyên khí, Đánh Thường ${this.units.get(finalTargetId)?.name ?? target.name} (${damage} sát thương, hồi ${qiRecovered} Qi).`
        : `${actor.name} Đánh Thường ${this.units.get(finalTargetId)?.name ?? target.name} (${damage} sát thương, hồi ${qiRecovered} Qi).`,
      isNormalAttackFallback: isFallback,
    };
  }

  private tryConsumeQi(
    actor: CombatUnit,
    qiCost: number,
    pendingQiDelta: Map<string, number>,
  ): boolean {
    if (qiCost <= 0) return true;
    if (this.skillEffects.shouldNegateAllyQiCost(actor.side)) return true;

    const effectiveQi = actor.currentQi + (pendingQiDelta.get(actor.id) ?? 0);
    if (actor.maxQi > 0 && effectiveQi < qiCost) return false;

    this.addPendingDelta(pendingQiDelta, actor.id, -qiCost);
    return true;
  }

  private createBlockedAction(
    actor: CombatUnit,
    actionType: CombatCommand['type'],
    message: string,
  ): CombatActionResult {
    return {
      actorId: actor.id,
      actorName: actor.name,
      actionType,
      damage: 0,
      healing: 0,
      qiCost: 0,
      qiRecovered: 0,
      message,
      isNormalAttackFallback: false,
      blocked: true,
    };
  }

  private addPendingDelta(map: Map<string, number>, id: string, delta: number): void {
    map.set(id, (map.get(id) ?? 0) + delta);
  }

  private applyPendingChanges(
    pendingDamage: Map<string, number>,
    pendingHealing: Map<string, number>,
    pendingQiDelta: Map<string, number>,
  ): void {
    for (const [id, healing] of pendingHealing) {
      const unit = this.units.get(id);
      if (!unit) continue;
      unit.currentHp = Math.min(unit.maxHp, unit.currentHp + healing);
    }

    for (const [id, damage] of pendingDamage) {
      const unit = this.units.get(id);
      if (!unit) continue;
      unit.currentHp = Math.max(0, unit.currentHp - damage);
    }

    for (const [id, delta] of pendingQiDelta) {
      const unit = this.units.get(id);
      if (!unit || unit.maxQi <= 0) continue;
      unit.currentQi = clampQi(unit.currentQi + delta, unit.maxQi);
    }
  }

  private syncAliveState(): void {
    for (const unit of this.units.values()) {
      unit.isAlive = unit.currentHp > 0;
    }
  }

  /** Không đủ Qi → Đánh Thường; ưu tiên mục tiêu người chơi đã chọn. */
  private resolveQiFallbackNormalAttack(
    command: CombatCommand,
    actor: CombatUnit,
    pendingDamage: Map<string, number>,
    pendingQiDelta: Map<string, number>,
  ): CombatActionResult | null {
    const fallbackTarget = this.pickFallbackEnemyTarget(actor, command.targetId);
    if (!fallbackTarget) return null;

    return this.resolveNormalAttackCommand(
      { unitId: actor.id, type: 'normalAttack', targetId: fallbackTarget.id },
      actor,
      pendingDamage,
      pendingQiDelta,
      true,
    );
  }

  private pickFallbackEnemyTarget(actor: CombatUnit, preferredTargetId?: string): CombatUnit | null {
    if (preferredTargetId) {
      const preferred = this.units.get(preferredTargetId);
      if (preferred?.isAlive && preferred.side !== actor.side && !preferred.isPet) {
        return preferred;
      }
    }
    return this.pickRandomEnemyTarget(actor);
  }

  private pickRandomEnemyTarget(actor: CombatUnit): CombatUnit | null {
    const targets = this.getAliveUnits(actor.side === 'ally' ? 'enemy' : 'ally');
    return targets[0] ?? null;
  }
}

/** Factory tiện lợi cho PvE. */
export function createPveBattle(
  allies: CharacterData[],
  enemyNpcIds: string[],
  getItemById: (id: string) => ItemData | undefined,
): CombatEngine {
  return CombatEngine.createFromConfig({
    mode: 'pve',
    allies,
    enemyNpcIds,
    getItemById,
    getNpcById,
  });
}

export { calculateDamage };
