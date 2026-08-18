import Phaser from 'phaser';
import { GameState } from '../state/gameState.ts';
import { getItemById } from '../data/itemsData.ts';
import { getNpcById } from '../data/npcsData.ts';
import { BANDIT_NPC_ID } from '../data/npcAppearances.ts';
import { getDefeatSubtitleForStage, getStageById, getNextTrialStageIdInChain, isTrialChainBattleStage } from '../data/chaptersData.ts';
import type { MapStageNode } from '../types/game.ts';
import { getSkillById, getBindTargetCount } from '../data/skillsData.ts';
import { TurnManager } from '../systems/TurnManager.ts';
import { CombatEngine } from '../systems/CombatEngine.ts';
import type { CombatActionResult, CombatCommand, CombatUnit } from '../systems/combatTypes.ts';
import type { SkillData, ItemData } from '../types/game.ts';
import type { StageItemReward } from '../constants/gameRules.ts';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameDimensions.ts';
import {
  UI_THEME,
  clampFontSizePx,
  BattleUnitDisplay,
  BattleTopHud,
  CommandMenu,
  COMMAND_MENU_SLOT_SIZE,
  COMMAND_MENU_FIGHT_X,
  COMMAND_MENU_FIGHT_Y,
  COMMAND_MENU_ROUND_SIZE,
  skillSlotCenters,
  BattleGuideOverlay,
  type BattleGuideStep,
  type BattleGuideStepConfig,
  FloatingCombatText,
  DialogBox,
  UIButton,
  BattleVictoryOverlay,
  TrialSpoilsOverlay,
} from '../ui/index.ts';
import { resolveAvatarKey, resolveSkillFxKey, resolveItemIconKey, addSceneBackground, battleSlotPositions, weaponSwingFxKey, type SceneBackgroundKey } from '../utils/AssetGenerator.ts';
import { resolvePlayerAttackKey, resolvePlayerDisplayKey } from '../utils/characterSpriteAssets.ts';
import { buildEnemyInstances } from '../utils/combatEnemyInstances.ts';
import { getCompanionIdByUnlockStage } from '../managers/CharacterManager.ts';
import { soundManager } from '../utils/SoundManager.ts';
import { matchesInventoryTab } from '../data/inventoryTabCategories.ts';
import { formatItemDisplayDescription } from '../utils/equipmentDisplay.ts';
import { createItemIcon, applyIconCircleMask, usesHubUiItemIcon } from '../utils/iconAssets.ts';
import { isBattleUsableItem, getBattleItemTargetSide, getBattleItemTargetCount, isBattleTeamItem } from '../managers/InventoryManager.ts';
import { TutorialBattleScene } from './TutorialBattleScene.ts';
import { returnToHubMapAfterBattle, stopPausedHubIfAny, returnToHubEventsAfterBattle } from './battleHubFlow.ts';
import { isLeoThapStage, getLeoThapStageById, buildLeoThapBattleReward, type BattleSceneStageReward } from '../data/leoThapData.ts';
import { getLeoThapFloorFromStageId } from './leoThapBattleFlow.ts';
import type { TrialRunRewards } from '../utils/trialRunRewards.ts';
import { appendTrialRunReward, createEmptyTrialRunRewards } from '../utils/trialRunRewards.ts';

const COMBAT_ATTACK_ANIM_MS = 3000;
/** Thời điểm “trúng đòn” trong animation ra chiêu đồng thời (ms). */
const COMBAT_EXECUTION_HIT_MS = 450;

/** Bảng túi đồ trong trận — full chiều cao, rộng gấp đôi bảng cũ (400→800). */
const BATTLE_BAG_PANEL_W = 800;
const BATTLE_BAG_ICON = 60;
const BATTLE_BAG_ROW_H = 72;
const BATTLE_BAG_ROW_GAP = 8;
const BATTLE_BAG_PAD = 20;

export interface BattleSceneData {
  mode?: 'pve' | 'tutorial';
  stageId?: string;
  background?: SceneBackgroundKey;
  unlockCompanion?: '1A' | '1B' | '1C' | '1D';
  enemyNpcIds?: string[];
  /** Nhiều đợt địch — mỗi phần tử tối đa 5 NPC. */
  enemyWaves?: string[][];
  currentWaveIndex?: number;
  preserveAllyVitals?: Record<string, { hp: number; qi: number }>;
  unlockCompanionId?: string;
  allySkillIds?: Record<string, string[]>;
  stageReward?: {
    exp: number;
    tinhThach: number;
    stageLabel?: string;
    itemRewards?: StageItemReward[];
    bonusRewardLabel?: string;
    rewardChoiceIds?: readonly string[];
  };
  tutorial?: {
    turn1Hint?: string;
    turn2Hint?: string;
    hideSkillSlots?: boolean;
  };
  /** Hướng dẫn từng bước dùng võ kỹ (Cửa 1). */
  battleGuide?: 'gate1';
  onVictory?: () => void;
  onDefeat?: () => void;
  /** Sau trận quay lại MainHub và mở MapModal (ải từ bản đồ). */
  returnToMap?: boolean;
  /** Sau trận quay lại MainHub và mở EventsModal (Leo Tháp). */
  returnToEvents?: boolean;
  /** Tích lũy phần thưởng trong chuỗi thử thách (Hầm ngục, Ngũ Lôi, Thiên Tài…). */
  trialRunRewards?: TrialRunRewards;
}

type PendingAction = 'skill' | 'item' | 'normalAttack' | null;
type SkillPickMode = 'attack' | 'defense' | 'control' | 'support' | null;

export class BattleScene extends Phaser.Scene {
  private turnManager!: TurnManager;
  private unitDisplays = new Map<string, BattleUnitDisplay>();
  private topHud!: BattleTopHud;
  private commandMenu!: CommandMenu;
  private overlayPanel!: Phaser.GameObjects.Container;
  private bagScrollTeardown: (() => void)[] = [];
  private bagScrollY = 0;
  private bagMaxScroll = 0;
  private bagPanDragging = false;
  private bagPanMoved = false;
  private bagPanStart = { y: 0, scrollY: 0 };
  private bagListContainer?: Phaser.GameObjects.Container;
  private sceneData: BattleSceneData = {};
  private pendingAction: PendingAction = null;
  private skillPickMode: SkillPickMode = null;
  private selectedSkillId: string | null = null;
  private pendingControlTargetIds: string[] = [];
  private pendingItemTargetIds: string[] = [];
  /** Giữ hiệu ứng khống chế trên UI trong lúc animation (sau khi engine đã endTurn). */
  private turnBoundVisualIds = new Set<string>();
  private timerEvent?: Phaser.Time.TimerEvent;
  private allyIds: string[] = [];
  private enemyIds: string[] = [];
  private isPlayingCombatAnim = false;
  private victoryOverlay?: BattleVictoryOverlay;
  private trialSpoilsOverlay?: TrialSpoilsOverlay;
  private battleGuideOverlay?: BattleGuideOverlay;
  private battleGuideStep: BattleGuideStep | 'done' | null = null;
  private guideLifted: Phaser.GameObjects.GameObject[] = [];
  private tutorialCenterHint?: Phaser.GameObjects.Text;
  private tutorialHintDismissed = false;
  private dungeonBonusRewardLabel: string | null = null;
  private rewardChoiceOverlay?: Phaser.GameObjects.Container;
  private chosenRewardLabel: string | null = null;

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: BattleSceneData): void {
    this.sceneData = data;
    if (data.stageId && isTrialChainBattleStage(data.stageId)) {
      this.sceneData.trialRunRewards = data.trialRunRewards ?? createEmptyTrialRunRewards();
    }
    this.battleGuideStep = null;
    this.guideLifted = [];
    this.isPlayingCombatAnim = false;
    this.pendingAction = null;
    this.skillPickMode = null;
    this.selectedSkillId = null;
    this.pendingControlTargetIds = [];
    this.pendingItemTargetIds = [];
    this.turnBoundVisualIds.clear();
    this.dungeonBonusRewardLabel = null;
    this.chosenRewardLabel = null;
    this.unitDisplays.clear();
    this.victoryOverlay?.destroy();
    this.victoryOverlay = undefined;
    this.trialSpoilsOverlay?.destroy();
    this.trialSpoilsOverlay = undefined;
    this.rewardChoiceOverlay?.destroy(true);
    this.rewardChoiceOverlay = undefined;
    this.battleGuideOverlay?.destroy();
    this.battleGuideOverlay = undefined;
    this.tutorialCenterHint?.destroy();
    this.tutorialCenterHint = undefined;
    this.tutorialHintDismissed = false;
  }

  create(): void {
    try {
      this.buildBattle();
    } catch (err) {
      console.error('[BattleScene] create failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      this.add
        .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e, 0.95)
        .setDepth(999);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `Lỗi chiến đấu:\n${msg}`, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: '18px',
        color: '#e94560',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 80 },
      }).setOrigin(0.5).setDepth(1000);
    }
  }

  private buildBattle(): void {
    const gs = GameState.getInstance();
    const party = gs.characterManager.getParty();

    if (this.sceneData.preserveAllyVitals) {
      for (const char of party) {
        const vitals = this.sceneData.preserveAllyVitals[char.id];
        if (vitals) {
          char.currentHp = vitals.hp;
          char.currentQi = vitals.qi;
        }
      }
    }

    const enemyNpcIds = this.sceneData.enemyNpcIds ?? [BANDIT_NPC_ID];
    const bgKey = this.sceneData.background
      ?? (this.sceneData.mode === 'tutorial' ? 'village' : 'arena');
    addSceneBackground(this, bgKey, UI_THEME.depth.background);

    this.allyIds = party.slice(0, 5).map((c) => c.id);
    this.enemyIds = buildEnemyInstances(enemyNpcIds).map((entry) => entry.unitId);

    this.topHud = new BattleTopHud(this, () => this.surrender());
    this.topHud.bindAllies(this.allyIds);
    this.topHud.bindEnemies(this.enemyIds);
    const waveCount = this.sceneData.enemyWaves?.length ?? 1;
    this.topHud.setAttackWaveCount(waveCount);

    this.setupUnits(party, enemyNpcIds);

    this.commandMenu = new CommandMenu(this, {
      onSkillSelect: (skillId, category) => this.selectSkill(skillId, category),
      onItem: () => this.beginItemSelection(),
      onFightNow: () => this.fightNow(),
    });
    if (this.sceneData.tutorial?.hideSkillSlots) {
      this.commandMenu.setSkillsHidden(true);
    }

    if (this.sceneData.battleGuide === 'gate1') {
      this.battleGuideOverlay?.destroy();
      this.battleGuideOverlay = new BattleGuideOverlay(this);
    }

    this.overlayPanel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(UI_THEME.depth.overlay).setVisible(false);

    const allySkillIds: Record<string, string[]> = {
      ...this.sceneData.allySkillIds,
    };
    const allyLearnedSkillIds: Record<string, string[]> = {};
    for (const char of party) {
      const learned = gs.characterManager.getLearnedSkillIds(char.id);
      allyLearnedSkillIds[char.id] = learned;
      if (!allySkillIds[char.id]) {
        allySkillIds[char.id] = gs.characterManager.getResolvedBattleSkillIds(char.id);
      }
    }

    const battleSetup = {
      mode: 'pve' as const,
      allies: party,
      enemyNpcIds,
      allySkillIds,
      allyLearnedSkillIds,
      getItemById,
      getNpcById,
    };

    const turnConfig = {
      mode: 'pve' as const,
      events: {
        onTurnStart: (turn: number) => this.onTurnStart(turn),
        onCommandRequested: (unit: CombatUnit) => this.onCommandRequested(unit),
        onAllCommandsReady: () => this.onAllCommandsReady(),
        onPrepareTimeUpdate: (ms: number) => this.topHud.countdown.setSeconds(ms / 1000),
        onTurnExecuted: (
          results: CombatActionResult[],
          turn: number,
          hpBefore: Map<string, number>,
          qiBefore: Map<string, number>,
          onComplete: () => void,
        ) => this.onTurnExecuted(results, turn, hpBefore, qiBefore, onComplete),
        onBattleEnd: (outcome: 'victory' | 'defeat' | 'draw' | 'ongoing') => this.onBattleEnd(outcome),
      },
      onUseItem: (itemId: string) => gs.inventoryManager.getItemQuantity(itemId) > 0 &&
        gs.inventoryManager.removeItem(itemId, 1),
    };

    const engine = CombatEngine.createFromConfig(battleSetup);
    this.turnManager = new TurnManager(engine, turnConfig);
    this.turnManager.startBattle();

    this.createTutorialCenterHint();
    this.commandMenu.setFightNowEnabled(this.turnManager.canFightNow());
    this.updateUnitViews();
    this.startTimerTick();
  }

  private onTurnStart(turn: number): void {
    this.topHud.setTurn(turn);
    this.commandMenu.setFightNowEnabled(this.turnManager.canFightNow());
    this.applyTutorialSkillFilter(turn);
    this.updateTutorialHint(turn);
    this.updateUnitViews();
    const unit = this.turnManager.getCurrentCommandUnit();
    if (unit) {
      this.commandMenu.bindUnit(unit, getSkillById);
    }
  }

  private applyTutorialSkillFilter(_turn: number): void {
    this.commandMenu.setSkillFilter('all');
  }

  private updateTutorialHint(_turn: number): void {
    this.refreshTutorialCenterHint();
    this.topHud.setGuide('');
  }

  private createTutorialCenterHint(): void {
    if (this.sceneData.mode !== 'tutorial') return;

    const text = this.sceneData.tutorial?.turn1Hint
      ?? "Ấn vào 'Npc 3', rồi ấn vào 'Chiến luôn'";

    this.tutorialCenterHint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.48 - 120, text, {
      fontFamily: UI_THEME.fontFamilyTitle,
      fontSize: clampFontSizePx('28px'),
      color: '#ff4757',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 6,
      align: 'center',
      wordWrap: { width: GAME_WIDTH * 0.72 },
    }).setOrigin(0.5).setDepth(UI_THEME.depth.overlay + 12);

    this.refreshTutorialCenterHint();
  }

  private refreshTutorialCenterHint(): void {
    if (!this.tutorialCenterHint || this.tutorialHintDismissed) return;
    const show = this.sceneData.mode === 'tutorial'
      && this.turnManager.getTurn() === 1
      && this.turnManager.getPhase() === 'command'
      && this.turnManager.getOutcome() === 'ongoing';
    this.tutorialCenterHint.setVisible(show);
  }

  private dismissTutorialCenterHint(): void {
    this.tutorialHintDismissed = true;
    this.tutorialCenterHint?.setVisible(false);
  }

  /** Không hiện chữ hướng dẫn trên HUD; ải 1 dùng BattleGuideOverlay. */
  private setTopHudGuide(_text: string, _large = false): void {
    this.topHud.setGuide('');
  }

  private setGuideMsg(_text: string): void {
    this.topHud.setGuide('');
  }

  private isGate1GuideActive(): boolean {
    return this.sceneData.battleGuide === 'gate1' && this.battleGuideStep !== 'done';
  }

  private showGuideStep(step: BattleGuideStep): void {
    if (!this.battleGuideOverlay) return;
    this.time.delayedCall(0, () => {
      if (!this.battleGuideOverlay) return;
      this.restoreGuideLifted();
      this.battleGuideStep = step;
      const config = this.buildGuideConfig(step);
      this.battleGuideOverlay.show(config);
      this.applyGuideInputLocks(step);
      this.topHud.setGuide('');
    });
  }

  private buildGuideConfig(step: BattleGuideStep): BattleGuideStepConfig {
    const skillPos = skillSlotCenters()[0]!;

    if (step === 'pickSkill') {
      return {
        step,
        spotlight: {
          x: skillPos.x,
          y: skillPos.y,
          width: COMMAND_MENU_SLOT_SIZE,
          height: COMMAND_MENU_SLOT_SIZE,
          shape: 'rect',
        },
        instruction: 'Lựa chọn võ kỹ',
        arrow: { fromX: skillPos.x - 140, fromY: skillPos.y, toX: skillPos.x - 48, toY: skillPos.y },
      };
    }

    if (step === 'pickTarget') {
      const enemyId = this.enemyIds[0];
      const display = enemyId ? this.unitDisplays.get(enemyId) : undefined;
      const ex = display?.x ?? 880;
      const ey = (display?.y ?? 340) - 30;
      return {
        step,
        spotlight: {
          x: ex,
          y: ey,
          width: 200,
          height: 240,
          shape: 'circle',
          radius: 100,
        },
        instruction: 'Ấn để tấn công',
        arrow: { fromX: ex - 190, fromY: ey, toX: ex - 105, toY: ey },
      };
    }

    return {
      step: 'fightNow',
      spotlight: {
        x: COMMAND_MENU_FIGHT_X,
        y: COMMAND_MENU_FIGHT_Y + 8,
        width: COMMAND_MENU_ROUND_SIZE + 24,
        height: COMMAND_MENU_ROUND_SIZE + 40,
        shape: 'rect',
      },
      instruction: 'Mỗi lượt đánh, bạn có 30 giây để sắp xếp tấn công. Nếu không muốn chờ, ấn vào \'Chiến luôn\'',
      arrow: {
        fromX: COMMAND_MENU_FIGHT_X,
        fromY: GAME_HEIGHT * 0.54,
        toX: COMMAND_MENU_FIGHT_X,
        toY: COMMAND_MENU_FIGHT_Y + COMMAND_MENU_ROUND_SIZE / 2 + 12,
      },
    };
  }

  private applyGuideInputLocks(step: BattleGuideStep): void {
    const guideDepth = UI_THEME.depth.overlay + 25;

    if (step === 'pickSkill') {
      this.commandMenu.setOnlySlotEnabled(0);
      this.commandMenu.setAuxButtonsEnabled(false, false);
      for (const display of this.unitDisplays.values()) {
        display.setInteractiveEnabled(false);
      }
      const slot = this.commandMenu.getSlotContainer(0);
      if (slot) this.liftToGuideLayer(slot, guideDepth);
      return;
    }

    if (step === 'pickTarget') {
      this.commandMenu.setOnlySlotEnabled(null);
      this.commandMenu.setAuxButtonsEnabled(false, false);
      for (const [id, display] of this.unitDisplays) {
        display.setInteractiveEnabled(this.enemyIds.includes(id));
        if (this.enemyIds.includes(id)) {
          this.liftToGuideLayer(display, guideDepth);
        }
      }
      return;
    }

    this.commandMenu.setOnlySlotEnabled(null);
    this.commandMenu.setAuxButtonsEnabled(true, false);
    this.commandMenu.setFightNowEnabled(true);
    for (const display of this.unitDisplays.values()) {
      display.setInteractiveEnabled(false);
    }
    this.liftToGuideLayer(this.commandMenu.getFightButton(), guideDepth);
    this.liftToGuideLayer(this.commandMenu.getFightLabel(), guideDepth);
  }

  private liftToGuideLayer(obj: Phaser.GameObjects.GameObject, depth: number): void {
    const container = obj as Phaser.GameObjects.Container & { x: number; y: number };
    const parent = container.parentContainer;
    if (parent) {
      const matrix = container.getWorldTransformMatrix();
      parent.remove(container, false);
      this.add.existing(container);
      container.setPosition(matrix.tx, matrix.ty);
    }
    container.setDepth(depth);
    this.guideLifted.push(container);
  }

  private restoreGuideLifted(): void {
    for (const obj of this.guideLifted) {
      if (obj instanceof BattleUnitDisplay) {
        obj.setDepth(UI_THEME.depth.units);
        continue;
      }
      const go = obj as Phaser.GameObjects.Container & { x: number; y: number };
      const matrix = go.getWorldTransformMatrix();
      go.removeFromDisplayList();
      this.commandMenu.add(go);
      go.setPosition(matrix.tx, matrix.ty);
      go.setDepth(0);
    }
    this.guideLifted = [];
  }

  private endBattleGuide(): void {
    this.battleGuideStep = 'done';
    this.battleGuideOverlay?.hide();
    this.restoreGuideLifted();
    this.commandMenu.setFightNowEnabled(true);
    this.commandMenu.setOnlySlotEnabled(null);
    this.commandMenu.setAuxButtonsEnabled(true, true);
    this.commandMenu.setMenuEnabled(true);
    for (const display of this.unitDisplays.values()) {
      display.setInteractiveEnabled(true);
    }
    if (this.sceneData.battleGuide === 'gate1') {
      GameState.getInstance().markGate1BattleGuideDone();
    }
  }

  private onAllCommandsReady(): void {
    // HUD guide disabled; gate 1 uses BattleGuideOverlay only.
  }

  private onCommandRequested(unit: CombatUnit): void {
    if (this.turnManager.getOutcome() !== 'ongoing') return;
    this.resetPending();
    this.applyTutorialSkillFilter(this.turnManager.getTurn());
    this.commandMenu.setVisible(true);
    this.commandMenu.bindUnit(unit, getSkillById);
    this.commandMenu.setMenuEnabled(true);
    const turn = this.turnManager.getTurn();
    if (this.sceneData.battleGuide === 'gate1' && turn === 1 && this.battleGuideStep === null) {
      this.time.delayedCall(120, () => this.showGuideStep('pickSkill'));
    }
    this.refreshTutorialCenterHint();
    this.topHud.setGuide('');
    this.topHud.setActiveUnit(unit.id);
    this.updateUnitViews();
  }

  private selectSkill(skillId: string, category: SkillData['category']): void {
    const skill = getSkillById(skillId);
    if (!skill) return;

    if (this.pendingAction === 'skill' && this.selectedSkillId === skillId) {
      this.resetPending();
      this.updateUnitViews();
      return;
    }

    if (this.isGate1GuideActive() && this.battleGuideStep === 'pickSkill') {
      this.showGuideStep('pickTarget');
    }

    this.selectedSkillId = skillId;
    this.pendingAction = 'skill';
    this.pendingControlTargetIds = [];
    this.pendingItemTargetIds = [];
    if (category === 'defense') {
      this.submitDefenseSkill(skillId);
      return;
    } else if (category === 'control') {
      this.skillPickMode = 'control';
      const needed = getBindTargetCount(skill.effect);
      this.commandMenu.setSelectedSkillId(skillId);
      this.setTopHudGuide(
        needed <= 1
          ? `Chọn mục tiêu cho ${skill.name}`
          : `Chọn ${needed} kẻ địch cho ${skill.name} (0/${needed})`,
      );
      this.updateUnitViews();
      return;
    } else if (category === 'special') {
      if (skill.effect === 'breakControlTeam' || skill.effect === 'immunityTeamThree') {
        this.submitTeamSpecial(skillId);
        return;
      }
      this.skillPickMode = 'support';
    } else {
      this.skillPickMode = 'attack';
    }
    this.commandMenu.setSelectedSkillId(skillId);
    this.setTopHudGuide(`Chọn mục tiêu cho ${skill.name}`);
    this.updateUnitViews();
  }

  private submitDefenseSkill(skillId: string): void {
    const actor = this.turnManager.getCurrentCommandUnit();
    if (!actor) return;
    const command: CombatCommand = {
      unitId: actor.id,
      type: 'defense',
      skillId,
      targetId: actor.id,
    };
    if (this.turnManager.submitCommand(command)) {
      soundManager.playUiClick();
      this.resetPending();
      this.updateUnitViews();
    }
  }

  private submitTeamSpecial(skillId: string): void {
    const actor = this.turnManager.getCurrentCommandUnit();
    if (!actor) return;
    const command: CombatCommand = { unitId: actor.id, type: 'special', skillId };
    if (this.turnManager.submitCommand(command)) {
      soundManager.playUiClick();
      this.resetPending();
      this.updateUnitViews();
    }
  }

  private submitTeamItem(itemId: string): void {
    const actor = this.turnManager.getCurrentCommandUnit();
    if (!actor) return;
    const command: CombatCommand = {
      unitId: actor.id,
      type: 'item',
      itemId,
      targetId: actor.id,
    };
    if (this.turnManager.submitCommand(command)) {
      soundManager.playUiClick();
      this.resetPending();
      this.updateUnitViews();
      const item = getItemById(itemId);
      this.setTopHudGuide(item ? `Đã chọn ${item.name} — hồi toàn đội` : 'Đã chọn vật phẩm toàn đội');
    } else {
      this.setTopHudGuide('Không dùng được vật phẩm — thử lại.');
    }
  }

  private setupUnits(party: import('../types/game.ts').CharacterData[], enemyNpcIds: string[]): void {
    const enemyInstances = buildEnemyInstances(enemyNpcIds);
    const enemySlots = battleSlotPositions(Math.min(enemyInstances.length, 5), true, GAME_WIDTH);
    enemyInstances.forEach(({ unitId, npcId }, i) => {
      const npc = getNpcById(npcId);
      if (!npc) return;
      const pos = enemySlots[i]!;
      const display = new BattleUnitDisplay(this, unitId, {
        x: pos.x,
        y: pos.y,
        name: npc.name,
        isEnemy: true,
        avatarKey: resolveAvatarKey(npcId),
        onClick: () => this.onUnitTargetClick(unitId),
      });
      display.setDepth(UI_THEME.depth.units);
      this.unitDisplays.set(unitId, display);
    });

    const allySlots = battleSlotPositions(Math.min(party.length, 5), false, GAME_WIDTH);
    party.slice(0, 5).forEach((char, i) => {
      const pos = allySlots[i]!;
      const display = new BattleUnitDisplay(this, char.id, {
        x: pos.x,
        y: pos.y,
        name: char.name,
        isEnemy: false,
        avatarKey: resolvePlayerDisplayKey(this, char.appearanceId, char.gender, char.weaponType),
        avatarAttackKey: resolvePlayerAttackKey(this, char.appearanceId),
        onClick: () => this.onUnitTargetClick(char.id),
      });
      display.setDepth(UI_THEME.depth.units);
      this.unitDisplays.set(char.id, display);
    });
  }

  private beginItemSelection(): void {
    const gs = GameState.getInstance();
    const bagSlots = gs.inventoryManager.getSlots().filter((s) => {
      const item = getItemById(s.itemId);
      if (!item) return false;
      if (!matchesInventoryTab(item, 'medicine') && !matchesInventoryTab(item, 'other')) return false;
      return isBattleUsableItem(s.itemId);
    });

    this.teardownBagScroll();
    this.overlayPanel.removeAll(true);
    this.overlayPanel.setVisible(true);

    const dim = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.45);
    const bg = this.add.rectangle(0, 0, BATTLE_BAG_PANEL_W, GAME_HEIGHT, 0x16213e, 0.97);
    bg.setStrokeStyle(2, 0xfca311, 0.85);
    this.overlayPanel.add([dim, bg]);

    const title = this.add.text(0, -GAME_HEIGHT / 2 + 36, 'Túi đồ — Dược & Khác', {
      fontFamily: UI_THEME.fontFamilyTitle,
      fontSize: clampFontSizePx('22px'),
      color: UI_THEME.colors.accentAlt,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.overlayPanel.add(title);

    const closeBtn = new UIButton(this, {
      x: BATTLE_BAG_PANEL_W / 2 - 56,
      y: -GAME_HEIGHT / 2 + 36,
      width: 88,
      height: 36,
      label: 'Đóng',
      onClick: () => {
        soundManager.playUiClick();
        this.hideBattleOverlay();
      },
      addToScene: false,
    });
    this.overlayPanel.add(closeBtn);

    if (bagSlots.length === 0) {
      this.overlayPanel.add(this.add.text(0, 0, 'Không có vật phẩm Dược / Khác', {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('16px'),
        color: UI_THEME.colors.textMuted,
      }).setOrigin(0.5));
      return;
    }

    const listTopLocal = -GAME_HEIGHT / 2 + 72;
    const listBottomLocal = GAME_HEIGHT / 2 - 16;
    const listAreaH = listBottomLocal - listTopLocal;
    const rowW = BATTLE_BAG_PANEL_W - BATTLE_BAG_PAD * 2;
    const nameColW = 200;
    const effectColW = rowW - BATTLE_BAG_ICON - 24 - nameColW;
    const rowStep = BATTLE_BAG_ROW_H + BATTLE_BAG_ROW_GAP;
    const contentH = bagSlots.length * rowStep - BATTLE_BAG_ROW_GAP;

    const maskGfx = this.add.graphics();
    maskGfx.fillStyle(0xffffff, 1);
    maskGfx.fillRect(-BATTLE_BAG_PANEL_W / 2, listTopLocal, BATTLE_BAG_PANEL_W, listAreaH);
    const listMask = maskGfx.createGeometryMask();
    maskGfx.setVisible(false);

    const bagScrollRoot = this.add.container(0, listTopLocal);
    this.bagListContainer = this.add.container(0, 0);
    bagScrollRoot.add(this.bagListContainer);
    bagScrollRoot.setMask(listMask);

    bagSlots.forEach((slot, i) => {
      const item = getItemById(slot.itemId)!;
      const y = i * rowStep + BATTLE_BAG_ROW_H / 2;
      this.bagListContainer!.add(this.createBattleBagRow(
        0,
        y,
        rowW,
        nameColW,
        effectColW,
        item,
        slot.quantity,
        () => {
          soundManager.playUiClick();
          if (isBattleTeamItem(slot.itemId)) {
            this.hideBattleOverlay();
            this.submitTeamItem(slot.itemId);
            return;
          }
          this.pendingAction = 'item';
          this.selectedSkillId = slot.itemId;
          this.pendingItemTargetIds = [];
          this.hideBattleOverlay();
          const needed = getBattleItemTargetCount(slot.itemId);
          const targetSide = getBattleItemTargetSide(slot.itemId);
          const guide =
            needed > 1
              ? `Chọn ${needed} kẻ địch cho ${item.name} (0/${needed})`
              : targetSide === 'enemy'
                ? `Chọn kẻ địch để dùng ${item.name}`
                : `Chọn đồng minh để dùng ${item.name}`;
          this.setTopHudGuide(guide);
          this.updateUnitViews();
        },
      ));
    });

    this.bagScrollY = 0;
    this.bagMaxScroll = Math.max(0, contentH - listAreaH);
    this.setupBagDragScroll(GAME_HEIGHT / 2 + listTopLocal, GAME_HEIGHT / 2 + listBottomLocal);

    this.overlayPanel.add([maskGfx, bagScrollRoot]);
  }

  private hideBattleOverlay(): void {
    this.teardownBagScroll();
    this.overlayPanel.setVisible(false);
  }

  private teardownBagScroll(): void {
    for (const off of this.bagScrollTeardown) off();
    this.bagScrollTeardown = [];
    this.bagPanDragging = false;
    this.bagPanMoved = false;
    this.bagScrollY = 0;
    this.bagMaxScroll = 0;
    this.bagListContainer = undefined;
  }

  private setupBagDragScroll(listTopWorld: number, listBottomWorld: number): void {
    const panelLeft = GAME_WIDTH / 2 - BATTLE_BAG_PANEL_W / 2;
    const panelRight = GAME_WIDTH / 2 + BATTLE_BAG_PANEL_W / 2;

    const inListArea = (p: Phaser.Input.Pointer) =>
      p.x >= panelLeft && p.x <= panelRight && p.y >= listTopWorld && p.y <= listBottomWorld;

    const onDown = (p: Phaser.Input.Pointer) => {
      if (!this.overlayPanel.visible || !inListArea(p)) return;
      this.bagPanDragging = true;
      this.bagPanMoved = false;
      this.bagPanStart = { y: p.y, scrollY: this.bagScrollY };
    };

    const onMove = (p: Phaser.Input.Pointer) => {
      if (!this.bagPanDragging || !p.isDown || this.bagMaxScroll <= 0) return;
      const dy = p.y - this.bagPanStart.y;
      if (Math.abs(dy) > 6) this.bagPanMoved = true;
      if (!this.bagPanMoved) return;
      this.bagScrollY = Phaser.Math.Clamp(this.bagPanStart.scrollY + dy, -this.bagMaxScroll, 0);
      if (this.bagListContainer) {
        this.bagListContainer.y = this.bagScrollY;
      }
    };

    const onUp = () => {
      this.bagPanDragging = false;
    };

    this.input.on('pointerdown', onDown);
    this.input.on('pointermove', onMove);
    this.input.on('pointerup', onUp);

    this.bagScrollTeardown.push(
      () => this.input.off('pointerdown', onDown),
      () => this.input.off('pointermove', onMove),
      () => this.input.off('pointerup', onUp),
    );
  }

  private createBattleBagRow(
    centerX: number,
    centerY: number,
    rowW: number,
    nameColW: number,
    effectColW: number,
    item: ItemData,
    quantity: number,
    onSelect: () => void,
  ): Phaser.GameObjects.Container {
    const row = this.add.container(centerX, centerY);

    const bg = this.add.rectangle(0, 0, rowW, BATTLE_BAG_ROW_H, 0x1a508b, 0.92)
      .setStrokeStyle(1, 0xfca311, 0.55)
      .setInteractive({ useHandCursor: true });
    bg.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.bagPanMoved || pointer.getDistance() > 10) return;
      onSelect();
    });
    row.add(bg);

    const left = -rowW / 2;
    const iconX = left + BATTLE_BAG_PAD + BATTLE_BAG_ICON / 2;
    const iconWrap = this.add.container(iconX, 0);
    const iconSlot = this.add.rectangle(0, 0, BATTLE_BAG_ICON, BATTLE_BAG_ICON, 0x43518a, 1)
      .setStrokeStyle(1, 0x6b7cad, 0.7);
    iconWrap.add(iconSlot);

    const iconInner = BATTLE_BAG_ICON - 8;
    const itemIcon = createItemIcon(this, 0, 0, item, iconInner);
    if (itemIcon) {
      if (usesHubUiItemIcon(item.id)) {
        iconWrap.add(itemIcon);
      } else {
        const maskGfx = applyIconCircleMask(this, itemIcon, 0, 0, iconInner * 0.45);
        maskGfx.setVisible(false);
        iconWrap.add([itemIcon, maskGfx]);
      }
    } else {
      const iconKey = resolveItemIconKey(item.id);
      if (iconKey && this.textures.exists(iconKey)) {
        iconWrap.add(this.add.image(0, 0, iconKey).setDisplaySize(iconInner, iconInner));
      }
    }
    row.add(iconWrap);

    const nameX = left + BATTLE_BAG_PAD + BATTLE_BAG_ICON + 12;
    const qtyLabel = quantity > 1 ? ` x${quantity}` : '';
    const nameText = this.add.text(nameX, 0, `${item.name}${qtyLabel}`, {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('16px'),
      color: UI_THEME.colors.text,
      fontStyle: 'bold',
      wordWrap: { width: nameColW, useAdvancedWrap: true },
    }).setOrigin(0, 0.5);
    row.add(nameText);

    const effectX = nameX + nameColW + 8;
    const effectText = this.add.text(effectX, 0, formatItemDisplayDescription(item), {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('14px'),
      color: UI_THEME.colors.textMuted,
      wordWrap: { width: effectColW, useAdvancedWrap: true },
      lineSpacing: 2,
    }).setOrigin(0, 0.5);
    row.add(effectText);

    return row;
  }

  private onUnitTargetClick(unitId: string): void {
    const actor = this.turnManager.getCurrentCommandUnit();
    if (!actor || this.turnManager.getPhase() !== 'command') return;

    const target = this.turnManager.getEngine().getUnit(unitId);
    if (!target || !target.isAlive) return;

    if (!this.pendingAction) {
      if (target.side === actor.side) {
        this.setGuideMsg('Chọn kẻ địch để tấn công.');
        return;
      }
      if (!this.prepareDefaultAttack(actor)) return;
    }

    let command: CombatCommand | null = null;

    if (this.pendingAction === 'skill' && this.selectedSkillId) {
      const skill = getSkillById(this.selectedSkillId);
      if (!skill) return;

      if (this.skillPickMode === 'defense') {
        if (target.side !== actor.side) {
          this.setTopHudGuide('Võ kỹ phòng thủ — hãy chọn đồng minh.');
          return;
        }
        command = { unitId: actor.id, type: 'defense', skillId: this.selectedSkillId, targetId: unitId };
      } else if (this.skillPickMode === 'control') {
        if (target.side === actor.side) {
          this.setTopHudGuide('Võ kỹ khống chế — hãy chọn kẻ địch.');
          return;
        }
        if (target.isPet) return;

        const needed = getBindTargetCount(skill.effect);
        if (needed <= 0) return;

        const pickedIndex = this.pendingControlTargetIds.indexOf(unitId);
        if (pickedIndex >= 0) {
          this.pendingControlTargetIds.splice(pickedIndex, 1);
        } else if (this.pendingControlTargetIds.length < needed) {
          this.pendingControlTargetIds.push(unitId);
        } else {
          this.setTopHudGuide(`Đã chọn đủ ${needed} kẻ địch — bấm lại để bỏ chọn hoặc đổi mục tiêu.`);
          this.updateUnitViews();
          return;
        }

        this.playBattleTargetSelectSound();

        if (this.pendingControlTargetIds.length < needed) {
          this.setTopHudGuide(
            needed <= 1
              ? `Chọn mục tiêu cho ${skill.name}`
              : `Chọn ${needed} kẻ địch cho ${skill.name} (${this.pendingControlTargetIds.length}/${needed})`,
          );
          this.updateUnitViews();
          return;
        }

        command = {
          unitId: actor.id,
          type: 'special',
          skillId: this.selectedSkillId,
          targetId: this.pendingControlTargetIds[0],
          extraTargetIds: this.pendingControlTargetIds.slice(1),
        };
      } else if (this.skillPickMode === 'support') {
        if (target.side !== actor.side) {
          this.setTopHudGuide('Võ kỹ hỗ trợ — hãy chọn đồng minh.');
          return;
        }
        command = { unitId: actor.id, type: 'special', skillId: this.selectedSkillId, targetId: unitId };
      } else {
        if (target.side === actor.side) {
          this.setTopHudGuide('Võ kỹ tấn công — hãy chọn kẻ địch.');
          return;
        }
        command = { unitId: actor.id, type: 'attack', skillId: this.selectedSkillId, targetId: unitId };
      }
    } else if (this.pendingAction === 'normalAttack') {
      if (target.side === actor.side) {
        this.setTopHudGuide('Chọn kẻ địch để tấn công.');
        return;
      }
      command = { unitId: actor.id, type: 'normalAttack', targetId: unitId };
    } else if (this.pendingAction === 'item' && this.selectedSkillId) {
      const itemId = this.selectedSkillId;
      const targetSide = getBattleItemTargetSide(itemId);
      if (!targetSide) return;
      if (targetSide === 'ally' && target.side !== actor.side) {
        this.setTopHudGuide('Vật phẩm này — hãy chọn đồng minh.');
        return;
      }
      if (targetSide === 'enemy' && target.side === actor.side) {
        this.setTopHudGuide('Vật phẩm này — hãy chọn kẻ địch.');
        return;
      }
      if (targetSide === 'enemy' && target.isPet) return;

      const needed = getBattleItemTargetCount(itemId);
      if (needed > 1) {
        const pickedIndex = this.pendingItemTargetIds.indexOf(unitId);
        if (pickedIndex >= 0) {
          this.pendingItemTargetIds.splice(pickedIndex, 1);
        } else if (this.pendingItemTargetIds.length < needed) {
          this.pendingItemTargetIds.push(unitId);
        } else {
          this.setTopHudGuide(`Đã chọn đủ ${needed} kẻ địch — bấm lại để bỏ chọn hoặc đổi mục tiêu.`);
          this.updateUnitViews();
          return;
        }

        this.playBattleTargetSelectSound();

        const item = getItemById(itemId);
        if (this.pendingItemTargetIds.length < needed) {
          this.setTopHudGuide(
            `Chọn ${needed} kẻ địch cho ${item?.name ?? 'vật phẩm'} (${this.pendingItemTargetIds.length}/${needed})`,
          );
          this.updateUnitViews();
          return;
        }

        command = {
          unitId: actor.id,
          type: 'item',
          itemId,
          targetId: this.pendingItemTargetIds[0],
          extraTargetIds: this.pendingItemTargetIds.slice(1),
        };
      } else {
        command = { unitId: actor.id, type: 'item', itemId, targetId: unitId };
        this.playBattleTargetSelectSound();
      }
    }

    if (!command) return;

    if (this.turnManager.submitCommand(command)) {
      if (command.type !== 'item') {
        soundManager.playUiClick();
      }
      this.resetPending();
      this.updateUnitViews();
      if (this.isGate1GuideActive() && this.battleGuideStep === 'pickTarget') {
        this.time.delayedCall(80, () => this.showGuideStep('fightNow'));
      }
    } else {
      this.setTopHudGuide('Không ghi được lệnh — hãy chọn lại võ kỹ và mục tiêu.');
    }
  }

  private playBattleTargetSelectSound(): void {
    soundManager.playUiClick();
  }

  /**
   * Bấm kẻ địch khi chưa chọn võ kỹ → Đánh Thường (không tốn Qi, hồi 20% max Qi).
   */
  private prepareDefaultAttack(_actor: CombatUnit): boolean {
    this.pendingAction = 'normalAttack';
    this.skillPickMode = 'attack';
    this.selectedSkillId = null;
    this.commandMenu.setSelectedSkillId(null);
    return true;
  }

  private resetPending(): void {
    this.pendingAction = null;
    this.selectedSkillId = null;
    this.skillPickMode = null;
    this.pendingControlTargetIds = [];
    this.pendingItemTargetIds = [];
    this.commandMenu.setSelectedSkillId(null);
    this.hideBattleOverlay();
  }

  /** Chưa chọn đủ mục tiêu khống chế / vật phẩm đa mục tiêu — không cho Đánh ngay. */
  private getIncompletePendingSelection(): string | null {
    const control = this.getIncompleteControlSelection();
    if (control) return control;
    return this.getIncompleteItemSelection();
  }

  private getIncompleteItemSelection(): string | null {
    if (this.pendingAction !== 'item' || !this.selectedSkillId) return null;

    const needed = getBattleItemTargetCount(this.selectedSkillId);
    if (needed <= 1) return null;

    const actor = this.turnManager.getCurrentCommandUnit();
    if (!actor) return null;

    const itemId = this.selectedSkillId;
    const alreadySubmitted = this.turnManager.getSubmittedCommands().some(
      (cmd) => cmd.unitId === actor.id && cmd.type === 'item' && cmd.itemId === itemId,
    );
    if (alreadySubmitted) return null;

    const item = getItemById(itemId);
    const itemName = item?.name ?? 'vật phẩm';
    if (this.pendingItemTargetIds.length === 0) {
      return `Chọn ${needed} kẻ địch cho ${itemName} trước khi đánh.`;
    }
    if (this.pendingItemTargetIds.length < needed) {
      return `Chọn thêm ${needed - this.pendingItemTargetIds.length} kẻ địch (${this.pendingItemTargetIds.length}/${needed}).`;
    }
    return null;
  }

  private getIncompleteControlSelection(): string | null {
    if (this.pendingAction !== 'skill' || this.skillPickMode !== 'control' || !this.selectedSkillId) {
      return null;
    }
    const skill = getSkillById(this.selectedSkillId);
    if (!skill) return null;
    const needed = getBindTargetCount(skill.effect);
    if (needed <= 0) return null;

    const actor = this.turnManager.getCurrentCommandUnit();
    if (!actor) return null;

    const alreadySubmitted = this.turnManager.getSubmittedCommands().some(
      (cmd) => cmd.unitId === actor.id && cmd.type === 'special' && cmd.skillId === this.selectedSkillId,
    );
    if (alreadySubmitted) return null;

    if (this.pendingControlTargetIds.length === 0) {
      return `Chọn ${needed} kẻ địch cho ${skill.name} trước khi đánh.`;
    }
    if (this.pendingControlTargetIds.length < needed) {
      return `Chọn thêm ${needed - this.pendingControlTargetIds.length} kẻ địch (${this.pendingControlTargetIds.length}/${needed}).`;
    }
    return null;
  }

  private surrender(): void {
    this.timerEvent?.destroy();
    this.onBattleEnd('defeat');
  }

  private fightNow(): void {
    if (this.isPlayingCombatAnim) return;
    if (this.sceneData.mode === 'tutorial') {
      this.dismissTutorialCenterHint();
    }

    const incomplete = this.getIncompletePendingSelection();
    if (incomplete) {
      this.setTopHudGuide(incomplete);
      return;
    }

    const endingGuide = this.isGate1GuideActive() && this.battleGuideStep === 'fightNow';
    this.resetPending();

    const runFightNow = (): void => {
      if (endingGuide) {
        this.endBattleGuide();
      }
      if (!this.turnManager.requestFightNow()) return;
      this.commandMenu.setMenuEnabled(false);
    };

    if (endingGuide) {
      this.time.delayedCall(0, runFightNow);
      return;
    }
    runFightNow();
  }

  private startTimerTick(): void {
    this.timerEvent = this.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        if (this.getIncompletePendingSelection()) return;
        this.turnManager.tick();
      },
    });
  }

  private onTurnExecuted(
    results: CombatActionResult[],
    _turn: number,
    hpBefore: Map<string, number>,
    qiBefore: Map<string, number>,
    onComplete: () => void,
  ): void {
    if (this.battleGuideStep !== null && this.battleGuideStep !== 'done') {
      this.endBattleGuide();
    }
    this.isPlayingCombatAnim = true;
    this.commandMenu.setMenuEnabled(false);
    this.commandMenu.setFightNowEnabled(false);
    this.topHud.setGuide('');

    this.turnBoundVisualIds.clear();
    for (const result of results) {
      if (result.effectApplied?.startsWith('bind')) {
        for (const id of result.boundTargetIds ?? (result.targetId ? [result.targetId] : [])) {
          this.turnBoundVisualIds.add(id);
        }
      }
      if (result.blocked && result.message?.includes('khống chế')) {
        this.turnBoundVisualIds.add(result.actorId);
      }
    }
    this.updateUnitViews();

    for (const display of this.unitDisplays.values()) {
      display.setTurnIndicator(false);
      display.setSelected(false);
      display.setInteractiveEnabled(false);
    }

    const engine = this.turnManager.getEngine();
    const runningHp = new Map(hpBefore);
    const runningQi = new Map(qiBefore);

    for (const unit of engine.getUnits()) {
      const hp = hpBefore.get(unit.id) ?? unit.currentHp;
      const qi = qiBefore.get(unit.id) ?? unit.currentQi;
      const isAlly = this.allyIds.includes(unit.id);
      this.topHud.updateUnit(unit.id, hp, unit.maxHp, qi, unit.maxQi, isAlly);
    }

    if (results.length === 0) {
      this.finishTurnAnimation(onComplete);
      return;
    }

    this.playSimultaneousExecution(results, runningHp, runningQi, onComplete);
  }

  /** GDD: toàn bộ phe ra chiêu đồng thời — animation 3s, số liệu bay lên cùng lúc tại 450ms. */
  private playSimultaneousExecution(
    results: CombatActionResult[],
    runningHp: Map<string, number>,
    runningQi: Map<string, number>,
    onComplete: () => void,
  ): void {
    for (const result of results) {
      if (!this.shouldPlayAttackAnim(result)) continue;
      const actorDisplay = this.unitDisplays.get(result.actorId);
      if (!actorDisplay) continue;
      const targetDisplay = result.targetId
        ? this.unitDisplays.get(result.targetId)
        : undefined;
      actorDisplay.playStationaryAttack(
        targetDisplay ?? null,
        () => {},
        () => {},
        COMBAT_ATTACK_ANIM_MS,
      );
    }

    this.time.delayedCall(COMBAT_EXECUTION_HIT_MS, () => {
      for (const result of results) {
        this.applyResultVisuals(result, runningHp, runningQi);
      }
    });

    this.time.delayedCall(COMBAT_ATTACK_ANIM_MS, () => {
      this.finishTurnAnimation(onComplete);
    });
  }

  private shouldPlayAttackAnim(result: CombatActionResult): boolean {
    if (result.blocked) return false;
    if (result.actionType === 'defense') return false;
    if (result.actionType === 'item') {
      return result.damage > 0 && Boolean(result.targetId && result.targetId !== result.actorId);
    }
    if (result.actionType === 'special') return Boolean(result.skillId);
    if (result.actionType === 'attack' || result.actionType === 'normalAttack') {
      return Boolean(result.targetId && result.targetId !== result.actorId);
    }
    return false;
  }

  private floaterPosForResult(
    result: CombatActionResult,
    actorDisplay?: BattleUnitDisplay,
    targetDisplay?: BattleUnitDisplay,
  ): { x: number; y: number } {
    if (result.damage > 0 && targetDisplay) {
      return targetDisplay.getFloaterPosition();
    }
    const pos = targetDisplay ?? actorDisplay;
    return pos?.getFloaterPosition() ?? { x: GAME_WIDTH / 2, y: 400 };
  }

  private applyResultVisuals(
    result: CombatActionResult,
    runningHp: Map<string, number>,
    runningQi: Map<string, number>,
  ): void {
    const engine = this.turnManager.getEngine();
    const gs = GameState.getInstance();
    const mc = gs.characterManager.getMainCharacter();
    const actorDisplay = this.unitDisplays.get(result.actorId);
    const targetId = result.targetId ?? result.actorId;
    const targetDisplay = this.unitDisplays.get(targetId);
    const { x, y } = this.floaterPosForResult(result, actorDisplay, targetDisplay);

    if (actorDisplay && mc && result.actorId === mc.id && result.damage > 0) {
      soundManager.playWeaponSwing(mc.weaponType);
      actorDisplay.showSkillFx(weaponSwingFxKey(mc.weaponType));
    } else if (actorDisplay && result.damage > 0) {
      soundManager.playWeaponSwing('quyen');
    }

    if (result.skillId) {
      const fxKey = resolveSkillFxKey(result.skillId);
      if (fxKey && actorDisplay) {
        actorDisplay.showSkillFx(fxKey);
      }
    }

    if (result.damage > 0 && result.targetId) {
      soundManager.playHit(result.damage);
      FloatingCombatText.spawn(this, x, y, `-${result.damage}`, 'damage');
      targetDisplay?.playHitFlash();
      const unit = engine.getUnit(result.targetId);
      if (unit) {
        const prev = runningHp.get(result.targetId) ?? unit.currentHp;
        const nextHp = Math.max(0, prev - result.damage);
        runningHp.set(result.targetId, nextHp);
        const qi = runningQi.get(result.targetId) ?? unit.currentQi;
        const isAlly = this.allyIds.includes(result.targetId);
        this.topHud.updateUnit(result.targetId, nextHp, unit.maxHp, qi, unit.maxQi, isAlly);
      }
    }

    if (result.healing > 0 || (result.healedTargetIds && result.healedTargetIds.length > 0)) {
      const healTargetIds = result.healedTargetIds
        ?? (result.targetId ? [result.targetId] : [result.actorId]);
      for (const healTargetId of healTargetIds) {
        const healDisplay = this.unitDisplays.get(healTargetId);
        const unit = engine.getUnit(healTargetId);
        if (!unit) continue;
        const prev = runningHp.get(healTargetId) ?? unit.currentHp;
        const nextHp = Math.min(unit.maxHp, unit.currentHp);
        const actualHeal = Math.max(0, nextHp - prev);
        if (actualHeal <= 0) continue;
        const healPos = healDisplay?.getFloaterPosition() ?? { x, y };
        FloatingCombatText.spawn(this, healPos.x, healPos.y, `+${actualHeal}`, 'heal');
        runningHp.set(healTargetId, nextHp);
        const qi = runningQi.get(healTargetId) ?? unit.currentQi;
        const isAlly = this.allyIds.includes(healTargetId);
        this.topHud.updateUnit(healTargetId, nextHp, unit.maxHp, qi, unit.maxQi, isAlly);
      }
    }

    const qiActor = engine.getUnit(result.actorId);
    if (qiActor) {
      let qi = runningQi.get(result.actorId) ?? qiActor.currentQi;
      if (result.qiCost > 0) {
        qi = Math.max(0, qi - result.qiCost);
      }
      if (result.qiRecovered > 0) {
        qi = Math.min(qiActor.maxQi, qi + result.qiRecovered);
      }
      if (result.qiCost > 0 || result.qiRecovered > 0) {
        runningQi.set(result.actorId, qi);
        const isAlly = this.allyIds.includes(result.actorId);
        const hp = runningHp.get(result.actorId) ?? qiActor.currentHp;
        this.topHud.updateUnit(result.actorId, hp, qiActor.maxHp, qi, qiActor.maxQi, isAlly);
      }
    }

    if (result.blocked && result.message) {
      const blockedPos = (actorDisplay ?? targetDisplay)?.getFloaterPosition() ?? { x, y };
      FloatingCombatText.spawn(this, blockedPos.x, blockedPos.y, result.message, 'info');
    } else if (result.message && result.damage === 0 && result.healing === 0 && !result.blocked) {
      FloatingCombatText.spawn(this, x, y, result.message, 'info');
    }

    if (result.effectApplied?.startsWith('bind')) {
      const boundIds = result.boundTargetIds ?? (result.targetId ? [result.targetId] : []);
      const bindFxKey = result.skillId ? resolveSkillFxKey(result.skillId) : null;
      for (const boundId of boundIds) {
        if (bindFxKey) {
          this.unitDisplays.get(boundId)?.showSkillFx(bindFxKey);
        }
      }
      this.updateUnitViews();
    }

    if (result.blocked && result.message?.includes('khống chế')) {
      const blockedDisplay = actorDisplay ?? targetDisplay;
      blockedDisplay?.setControlBoundVisual(true);
      this.time.delayedCall(900, () => {
        const fx = this.turnManager.getEngine().getSkillEffectsProcessor();
        blockedDisplay?.setControlBoundVisual(fx.isBound(blockedDisplay.unitId));
      });
    }
  }

  private finishTurnAnimation(onComplete: () => void): void {
    this.turnBoundVisualIds.clear();
    this.updateUnitViews();
    for (const display of this.unitDisplays.values()) {
      const unit = this.turnManager.getEngine().getUnit(display.unitId);
      if (unit?.isAlive) {
        display.setInteractiveEnabled(true);
      }
    }
    this.isPlayingCombatAnim = false;
    onComplete();
    if (this.turnManager.getPhase() === 'command' && this.turnManager.getOutcome() === 'ongoing') {
      this.commandMenu.setMenuEnabled(true);
      this.commandMenu.setFightNowEnabled(this.turnManager.canFightNow());
    }
  }

  private onBattleEnd(outcome: 'victory' | 'defeat' | 'draw' | 'ongoing'): void {
    this.timerEvent?.destroy();
    this.commandMenu.setMenuEnabled(false);
    this.commandMenu.setVisible(false);
    this.topHud.setGuide('');

    for (const display of this.unitDisplays.values()) {
      display.setInteractiveEnabled(false);
      display.setTurnIndicator(false);
    }

    if (outcome === 'victory') {
      soundManager.playVictory();
      const waves = this.sceneData.enemyWaves;
      const waveIndex = this.sceneData.currentWaveIndex ?? 0;
      if (waves && waveIndex < waves.length - 1) {
        this.time.delayedCall(1400, () => this.advanceToNextWave());
        return;
      }
      this.restorePartyAfterStageEnd();
      const reward = this.sceneData.stageReward;
      const choiceIds = reward?.rewardChoiceIds;

      if (choiceIds && choiceIds.length > 0) {
        const deferLeoThapChoice = Boolean(
          this.sceneData.stageId
          && isLeoThapStage(this.sceneData.stageId)
          && getNextTrialStageIdInChain(this.sceneData.stageId),
        );
        if (deferLeoThapChoice) {
          this.applyStageRewards();
          this.continueAfterVictoryRewards();
          return;
        }

        this.applyStageRewards({ skipItemRewards: true });
        this.topHud.setGuide('Chọn phần thưởng');
        this.time.delayedCall(800, () => {
          this.showStageRewardChoice(choiceIds, (chosenId) => {
            const gs = GameState.getInstance();
            gs.inventoryManager.addItem(chosenId, 1);
            soundManager.playItemPickup();
            gs.persist();
            const item = getItemById(chosenId);
            this.chosenRewardLabel = item ? `+1 ${item.name}` : `+1 ${chosenId}`;
            this.recordTrialRunReward();
            this.continueAfterVictoryRewards();
          });
        });
        return;
      }

      this.applyStageRewards();
      this.continueAfterVictoryRewards();
    } else if (outcome === 'defeat') {
      soundManager.playDefeat();
      this.restorePartyAfterStageEnd();
      const gs = GameState.getInstance();
      if (this.sceneData.stageId && gs.isDungeonBattleStage(this.sceneData.stageId)) {
        gs.resetDungeonRunOnDefeat(this.sceneData.stageId);
      }
      const isLeoThap = Boolean(this.sceneData.stageId && isLeoThapStage(this.sceneData.stageId));
      const showTrialSpoils = !isLeoThap && Boolean(
        this.sceneData.stageId && isTrialChainBattleStage(this.sceneData.stageId),
      );
      const trialSpoils = this.sceneData.trialRunRewards ?? createEmptyTrialRunRewards();
      this.showBattleOutcomeOverlay('defeat', () => {
        const finishDefeat = (): void => {
          this.sceneData.onDefeat?.();
          if (!this.sceneData.onDefeat) {
            this.exitAfterBattle();
          }
        };
        if (isLeoThap) {
          this.grantLeoThapRunEndRewards(finishDefeat);
        } else if (showTrialSpoils) {
          this.showTrialSpoilsOverlay(trialSpoils, finishDefeat);
        } else {
          finishDefeat();
        }
      });
    } else if (outcome === 'draw') {
      this.restorePartyAfterStageEnd();
      this.showResult('Hòa!', () => this.exitAfterBattle());
    }
  }

  /** Kết thúc cửa ải — hồi 100% máu và nguyên khí toàn đội. */
  private restorePartyAfterStageEnd(): void {
    if (!this.sceneData.stageId) return;
    const gs = GameState.getInstance();
    gs.characterManager.restorePartyVitalsFull(getItemById);
    gs.persist();
  }

  /** Rời trận — ải bản đồ quay lại MapModal, còn lại về sảnh chính. */
  private exitAfterBattle(): void {
    const mapChapterId = this.sceneData.stageId
      ? getStageById(this.sceneData.stageId)?.chapterId
      : undefined;
    if (mapChapterId) {
      GameState.getInstance().setActiveMapChapter(mapChapterId);
    }

    if (this.sceneData.unlockCompanion) {
      const companionId = getCompanionIdByUnlockStage(this.sceneData.unlockCompanion)
        ?? this.sceneData.unlockCompanionId;
      const gs = GameState.getInstance();
      if (
        companionId
        && gs.characterManager.isCompanionUnlocked(companionId)
        && !gs.characterManager.hasCompanionCharacter(companionId)
      ) {
        stopPausedHubIfAny(this.scene);
        this.scene.start('CompanionRecruitmentScene', {
          companionId,
          unlockLabel: this.sceneData.unlockCompanion,
        });
        return;
      }
    }

    if (this.shouldReturnToMap()) {
      returnToHubMapAfterBattle(this, mapChapterId);
      return;
    }
    if (this.sceneData.returnToEvents) {
      returnToHubEventsAfterBattle(this);
      return;
    }
    this.scene.start('MainHubScene');
  }

  private continueAfterVictoryRewards(): void {
    const nextTrialStage = this.getNextTrialStageAfterVictory();
    if (nextTrialStage) {
      this.topHud.setGuide(`Tiếp theo: ${nextTrialStage.name}`);
      this.time.delayedCall(1400, () => this.advanceToNextTrialStage(nextTrialStage));
      return;
    }

    this.showBattleOutcomeOverlay('victory', () => {
      if (this.sceneData.mode === 'tutorial') {
        TutorialBattleScene.handleTutorialVictory(this);
        return;
      }
      this.sceneData.onVictory?.();
      if (!this.sceneData.onVictory) {
        this.exitAfterBattle();
      }
    });
  }

  private showStageRewardChoice(
    itemIds: readonly string[],
    onPick: (itemId: string) => void,
  ): void {
    this.rewardChoiceOverlay?.destroy(true);
    const overlay = this.add.container(0, 0).setDepth(5000);

    const dim = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.78)
      .setInteractive({ useHandCursor: false });
    overlay.add(dim);

    overlay.add(
      this.add.text(GAME_WIDTH / 2, 96, 'Chọn phần thưởng', {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('24px'),
        color: UI_THEME.colors.accentAlt,
        fontStyle: 'bold',
      }).setOrigin(0.5),
    );

    itemIds.forEach((id, i) => {
      const item = getItemById(id);
      const btn = new UIButton(this, {
        x: GAME_WIDTH / 2,
        y: 170 + i * 52,
        width: 460,
        height: 44,
        label: item?.name ?? id,
        flatBackground: true,
        onClick: () => {
          overlay.destroy(true);
          this.rewardChoiceOverlay = undefined;
          onPick(id);
        },
      });
      overlay.add(btn);
    });

    this.rewardChoiceOverlay = overlay;
  }

  private getNextTrialStageAfterVictory(): MapStageNode | null {
    const stageId = this.sceneData.stageId;
    if (!stageId) return null;
    const nextId = getNextTrialStageIdInChain(stageId);
    if (!nextId) return null;
    return getStageById(nextId) ?? null;
  }

  private battleBackgroundForChapter(chapterId: string): SceneBackgroundKey {
    if (chapterId === 'chapter_9') return 'chapter9Arena';
    if (chapterId === 'chapter_8' || chapterId === 'chapter_7') return 'chapter78Arena';
    if (chapterId === 'chapter_6') return 'chapter6Arena';
    if (chapterId === 'chapter_5') return 'chapter5Arena';
    if (chapterId === 'chapter_4') return 'chapter4Arena';
    if (chapterId === 'chapter_3') return 'chapter3Arena';
    if (chapterId === 'chapter_2') return 'chapter2Arena';
    if (chapterId === 'chapter_1') return 'chapter1Arena';
    return 'village';
  }

  /** Tự động vào cửa ải kế tiếp trong chuỗi thử thách — hồi full máu/Qi. */
  private advanceToNextTrialStage(nextStage: MapStageNode): void {
    const gs = GameState.getInstance();
    gs.characterManager.restorePartyVitalsFull(getItemById);
    gs.persist();

    this.dungeonBonusRewardLabel = null;
    this.scene.restart({
      stageId: nextStage.id,
      returnToMap: this.sceneData.returnToMap === true,
      returnToEvents: this.sceneData.returnToEvents === true,
      trialRunRewards: this.sceneData.trialRunRewards,
      background: isLeoThapStage(nextStage.id) ? 'chapter6Arena' : this.battleBackgroundForChapter(nextStage.chapterId),
      enemyNpcIds: nextStage.enemyWaves?.[0] ?? nextStage.enemyNpcIds,
      enemyWaves: nextStage.enemyWaves,
      currentWaveIndex: 0,
      stageReward: {
        exp: nextStage.expReward,
        tinhThach: nextStage.tinhThachReward ?? 0,
        itemRewards: nextStage.itemRewards,
        bonusRewardLabel: nextStage.bonusRewardLabel,
        rewardChoiceIds: nextStage.rewardChoiceIds,
        stageLabel: nextStage.name,
      },
    });
  }

  private advanceToNextWave(): void {
    const waves = this.sceneData.enemyWaves ?? [];
    const nextIndex = (this.sceneData.currentWaveIndex ?? 0) + 1;
    const engine = this.turnManager.getEngine();
    const gs = GameState.getInstance();
    const preserveAllyVitals: Record<string, { hp: number; qi: number }> = {};
    for (const id of this.allyIds) {
      const unit = engine.getUnit(id);
      if (!unit) continue;
      preserveAllyVitals[id] = { hp: unit.currentHp, qi: unit.currentQi };
      const char = gs.characterManager.getCharacter(id);
      if (char) {
        char.currentHp = unit.currentHp;
        char.currentQi = unit.currentQi;
      }
    }

    this.scene.restart({
      ...this.sceneData,
      currentWaveIndex: nextIndex,
      enemyNpcIds: waves[nextIndex],
      preserveAllyVitals,
    });
  }

  private resolveNpcIdFromUnit(unitId: string): string {
    return unitId.split('__')[0] ?? unitId;
  }

  private shouldReturnToMap(): boolean {
    return this.sceneData.returnToMap === true;
  }

  private getDefeatSubtitle(): string {
    return getDefeatSubtitleForStage(this.sceneData.stageId);
  }

  private showBattleOutcomeOverlay(
    outcome: 'victory' | 'defeat',
    onDone: () => void,
  ): void {
    const engine = this.turnManager.getEngine();
    const side = outcome === 'victory' ? 'ally' : 'enemy';
    const ids = (side === 'ally' ? this.allyIds : this.enemyIds).filter((id) => {
      const unit = engine.getUnit(id);
      return unit?.isAlive ?? true;
    });
    const fallbackIds = side === 'ally' ? this.allyIds : this.enemyIds;
    const winnerIds = ids.length > 0 ? ids : fallbackIds;

    const unitEntries = winnerIds.map((id) => {
      const unit = engine.getUnit(id);
      const isAlly = this.allyIds.includes(id);
      let name = unit?.name ?? id;
      if (isAlly) {
        const gs = GameState.getInstance();
        const char = gs.characterManager.getCharacter(id);
        if (char?.name) name = char.name;
      } else {
        const npc = getNpcById(this.resolveNpcIdFromUnit(id));
        if (npc) {
          name = npc.name;
        }
      }
      let avatarKey = resolveAvatarKey(this.resolveNpcIdFromUnit(id));
      if (isAlly) {
        const gs = GameState.getInstance();
        const char = gs.characterManager.getCharacter(id);
        if (char) {
          avatarKey = resolvePlayerDisplayKey(this, char.appearanceId, char.gender, char.weaponType);
        }
      }
      return { id, avatarKey, name };
    });

    const subtitle =
      outcome === 'victory'
        ? this.sceneData.stageReward
          ? this.buildVictoryMessage()
          : this.sceneData.mode === 'tutorial'
            ? 'Hoàn thành thử thách đầu tiên!\n+30 EXP'
            : ''
        : this.getDefeatSubtitle();

    this.victoryOverlay?.destroy();
    this.victoryOverlay = new BattleVictoryOverlay(this, {
      outcome,
      unitEntries,
      subtitle,
      onDone,
    });
  }

  private grantLeoThapRunEndRewards(onDone: () => void): void {
    const gs = GameState.getInstance();
    const bestFloor = gs.leoThapManager.getBestFloorThisSession();
    if (bestFloor <= 0) {
      onDone();
      return;
    }

    const stage = getLeoThapStageById(`leo_thap_${bestFloor}`);
    if (!stage) {
      onDone();
      return;
    }

    const reward = buildLeoThapBattleReward(stage);
    const choiceIds = reward.rewardChoiceIds;
    if (choiceIds && choiceIds.length > 0) {
      this.showStageRewardChoice(choiceIds, (chosenId) => {
        const item = getItemById(chosenId);
        const chosenLabel = item ? `+1 ${item.name}` : `+1 ${chosenId}`;
        this.applyLeoThapPayoutReward(reward, chosenId);
        const spoils = appendTrialRunReward(createEmptyTrialRunRewards(), {
          ...reward,
          chosenRewardLabel: chosenLabel,
        });
        this.showTrialSpoilsOverlay(spoils, onDone);
      });
      return;
    }

    this.applyLeoThapPayoutReward(reward);
    const spoils = appendTrialRunReward(createEmptyTrialRunRewards(), reward);
    this.showTrialSpoilsOverlay(spoils, onDone);
  }

  private applyLeoThapPayoutReward(reward: BattleSceneStageReward, chosenItemId?: string): void {
    const gs = GameState.getInstance();

    if (reward.exp > 0) {
      gs.characterManager.addExpToParty(reward.exp);
    }
    if (reward.tinhThach > 0) {
      gs.inventoryManager.addTinhThach(reward.tinhThach);
      soundManager.playItemPickup();
    }
    for (const grant of reward.itemRewards ?? []) {
      if (grant.quantity <= 0) continue;
      gs.inventoryManager.addItem(grant.itemId, grant.quantity);
      soundManager.playItemPickup();
    }
    if (chosenItemId) {
      gs.inventoryManager.addItem(chosenItemId, 1);
      soundManager.playItemPickup();
    }
    gs.persist();
  }

  private showTrialSpoilsOverlay(rewards: TrialRunRewards, onDone: () => void): void {
    this.trialSpoilsOverlay?.destroy();
    this.trialSpoilsOverlay = new TrialSpoilsOverlay(this, {
      rewards,
      onDone,
    });
  }

  private recordTrialRunReward(options?: { skipItemRewards?: boolean }): void {
    const stageId = this.sceneData.stageId;
    if (!stageId || !isTrialChainBattleStage(stageId) || isLeoThapStage(stageId)) return;

    const reward = this.sceneData.stageReward;
    if (!reward) return;

    this.sceneData.trialRunRewards = appendTrialRunReward(this.sceneData.trialRunRewards, {
      exp: reward.exp,
      tinhThach: reward.tinhThach,
      stageLabel: reward.stageLabel,
      itemRewards: options?.skipItemRewards ? [] : reward.itemRewards,
      bonusRewardLabel: reward.bonusRewardLabel,
      chosenRewardLabel: this.chosenRewardLabel ?? undefined,
      dungeonBonusRewardLabel: this.dungeonBonusRewardLabel ?? undefined,
    });
  }

  private applyStageRewards(options?: { skipItemRewards?: boolean }): void {
    const reward = this.sceneData.stageReward;
    const gs = GameState.getInstance();

    if (this.sceneData.stageId) {
      if (!isLeoThapStage(this.sceneData.stageId)) {
        gs.markStageCleared(this.sceneData.stageId);
      } else {
        const floor = getLeoThapFloorFromStageId(this.sceneData.stageId);
        if (floor > 0) {
          gs.leoThapManager.recordFloorCleared(floor);
        }
        if (getNextTrialStageIdInChain(this.sceneData.stageId)) {
          gs.persist();
          return;
        }
      }
      if (this.sceneData.unlockCompanion) {
        gs.characterManager.unlockCompanion(this.sceneData.unlockCompanion);
      }
      if (gs.isDungeonFinalStage(this.sceneData.stageId)) {
        const itemName = gs.recordDungeonFullClear();
        if (itemName) {
          this.dungeonBonusRewardLabel = `+1 ${itemName}`;
        }
      }
    }

    if (!reward) return;

    if (reward.exp > 0) {
      gs.characterManager.addExpToParty(reward.exp);
    }
    if (reward.tinhThach > 0) {
      gs.inventoryManager.addTinhThach(reward.tinhThach);
      soundManager.playItemPickup();
    }
    if (!options?.skipItemRewards) {
      for (const grant of reward.itemRewards ?? []) {
        if (grant.quantity <= 0) continue;
        gs.inventoryManager.addItem(grant.itemId, grant.quantity);
        soundManager.playItemPickup();
      }
    }
    if (!reward.rewardChoiceIds?.length) {
      this.recordTrialRunReward(options);
    }
    gs.persist();
  }

  private buildVictoryMessage(): string {
    const r = this.sceneData.stageReward;
    if (!r) return '';
    const parts: string[] = [];
    if (r.stageLabel) parts.push(r.stageLabel);
    if (r.exp > 0) parts.push(`+${r.exp} EXP`);
    if (r.tinhThach > 0) parts.push(`+${r.tinhThach} Tinh Thạch`);
    for (const grant of r.itemRewards ?? []) {
      if (grant.quantity <= 0) continue;
      const item = getItemById(grant.itemId);
      parts.push(`+${grant.quantity} ${item?.name ?? grant.itemId}`);
    }
    if (r.bonusRewardLabel) parts.push(r.bonusRewardLabel);
    if (this.chosenRewardLabel) parts.push(this.chosenRewardLabel);
    if (this.dungeonBonusRewardLabel) parts.push(this.dungeonBonusRewardLabel);
    return parts.join('\n');
  }

  private showResult(text: string, onDone: () => void): void {
    const dialog = new DialogBox(this, GAME_WIDTH, GAME_HEIGHT);
    dialog.show('Kết quả', text, onDone);
  }

  private updateUnitViews(): void {
    const engine = this.turnManager.getEngine();
    const effects = engine.getSkillEffectsProcessor();
    const currentUnit = this.turnManager.getCurrentCommandUnit();
    const stagedTargets = new Set(
      this.turnManager
        .getSubmittedCommands()
        .flatMap((cmd) => [
          ...(cmd.targetId ? [cmd.targetId] : []),
          ...(cmd.extraTargetIds ?? []),
        ]),
    );

    for (const [id, display] of this.unitDisplays) {
      const unit = engine.getUnit(id);
      if (!unit) continue;

      const isAlly = this.allyIds.includes(id);
      this.topHud.updateUnit(id, unit.currentHp, unit.maxHp, unit.currentQi, unit.maxQi, isAlly);
      display.updateStats(unit.currentHp, unit.maxHp, unit.currentQi, unit.maxQi);
      display.setSelected(currentUnit?.id === id);
      const isCurrentTurn =
        currentUnit?.id === id && this.turnManager.getPhase() === 'command';
      const isAttackTarget = this.shouldHighlightAttackTarget(
        id,
        currentUnit,
        stagedTargets,
      );
      const isSupportTarget = this.shouldHighlightSupportTarget(id, currentUnit, stagedTargets);
      const isBoundVisual = effects.isBound(id) || this.turnBoundVisualIds.has(id);

      display.setControlBoundVisual(isBoundVisual);
      display.setTargetHighlight(isAttackTarget || isSupportTarget, isAttackTarget);
      display.setTurnIndicator(isCurrentTurn);

      if (!unit.isAlive && this.shouldHideDeadUnitDisplay()) {
        display.setDead();
      }

      const status: string[] = [];
      if (isBoundVisual) {
        status.push(effects.isControlled(id) ? 'controlled' : 'pendingControl');
      }
      if (effects.isControlImmune(id)) status.push('controlImmune');
      display.setStatusEffects(status);
      display.setSkillOverlayIcons(
        this.resolveDefenseOverlaySkillId(id, effects),
        effects.getControlSkillIcon(id),
      );
    }

    this.topHud.setActiveUnit(currentUnit?.id ?? null);
  }

  /** Chỉ ẩn xác nhân vật khi vào lượt ra lệnh mới — giữ hiển thị trong lúc animation trừ máu. */
  private shouldHideDeadUnitDisplay(): boolean {
    return this.turnManager.getPhase() === 'command' && !this.isPlayingCombatAnim;
  }

  /** Icon võ kỹ thủ — sau khi chọn lệnh hoặc đang thi hành, hiện trên cả đội cùng phe. */
  private resolveDefenseOverlaySkillId(
    unitId: string,
    effects: ReturnType<CombatEngine['getSkillEffectsProcessor']>,
  ): string | undefined {
    const fromEffects = effects.getDefenseSkillIcon(unitId);
    if (fromEffects) return fromEffects;

    const engine = this.turnManager.getEngine();
    const unit = engine.getUnit(unitId);
    if (!unit?.isAlive) return undefined;

    for (const cmd of this.turnManager.getSubmittedCommands()) {
      if (cmd.type !== 'defense' || !cmd.skillId) continue;
      const actor = engine.getUnit(cmd.unitId);
      if (actor?.side === unit.side) return cmd.skillId;
    }
    return undefined;
  }

  /** Mục tiêu tấn công đã chọn hoặc đang chờ chọn (kẻ địch). */
  private shouldHighlightAttackTarget(
    unitId: string,
    actor: CombatUnit | null | undefined,
    stagedTargets: Set<string>,
  ): boolean {
    const engine = this.turnManager.getEngine();
    const target = engine.getUnit(unitId);
    if (!target?.isAlive || !actor) return false;

    if (stagedTargets.has(unitId)) {
      const cmd = this.turnManager.getSubmittedCommands().find((c) => c.targetId === unitId);
      if (!cmd) return target.side !== actor.side;
      if (cmd.type === 'attack' || cmd.type === 'normalAttack') return true;
      if (cmd.type === 'item' && cmd.itemId) {
        return getBattleItemTargetSide(cmd.itemId) === 'enemy';
      }
      if (cmd.type === 'special' && cmd.skillId) {
        const skill = getSkillById(cmd.skillId);
        return skill?.category !== 'defense';
      }
      return false;
    }

    if (this.turnManager.getPhase() !== 'command' || actor.id !== this.turnManager.getCurrentCommandUnit()?.id) {
      return false;
    }
    if (!this.pendingAction) return false;

    if (this.pendingAction === 'normalAttack') return target.side !== actor.side;
    if (this.pendingAction === 'item' && this.selectedSkillId) {
      return getBattleItemTargetSide(this.selectedSkillId) === 'enemy' && target.side !== actor.side;
    }
    if (this.pendingAction === 'skill' && (this.skillPickMode === 'attack' || this.skillPickMode === 'control')) {
      if (this.skillPickMode === 'control' && this.pendingControlTargetIds.includes(unitId)) {
        return true;
      }
      return target.side !== actor.side;
    }
    return false;
  }

  /** Mục tiêu hỗ trợ/phòng thủ (đồng minh) — đĩa đỏ, không phi kiếm. */
  private shouldHighlightSupportTarget(
    unitId: string,
    actor: CombatUnit | null | undefined,
    stagedTargets: Set<string>,
  ): boolean {
    const engine = this.turnManager.getEngine();
    const target = engine.getUnit(unitId);
    if (!target?.isAlive || !actor) return false;

    if (stagedTargets.has(unitId)) {
      const cmd = this.turnManager.getSubmittedCommands().find((c) => c.targetId === unitId);
      if (cmd?.type === 'defense') return true;
      if (cmd?.type === 'item' && cmd.itemId) {
        return getBattleItemTargetSide(cmd.itemId) === 'ally';
      }
      if (cmd?.type === 'special' && cmd.skillId) {
        const skill = getSkillById(cmd.skillId);
        return skill?.category === 'defense';
      }
      return false;
    }

    if (this.turnManager.getPhase() !== 'command' || actor.id !== this.turnManager.getCurrentCommandUnit()?.id) {
      return false;
    }
    if (this.pendingAction === 'item' && this.selectedSkillId) {
      return getBattleItemTargetSide(this.selectedSkillId) === 'ally' && target.side === actor.side;
    }
    if (this.pendingAction === 'skill' && (this.skillPickMode === 'defense' || this.skillPickMode === 'support')) {
      return target.side === actor.side;
    }
    return false;
  }

  shutdown(): void {
    this.timerEvent?.destroy();
    this.victoryOverlay?.destroy();
    this.battleGuideOverlay?.destroy();
    this.tutorialCenterHint?.destroy();
    this.commandMenu?.destroy();
    for (const display of this.unitDisplays.values()) {
      display.destroy();
    }
    this.unitDisplays.clear();
  }
}
