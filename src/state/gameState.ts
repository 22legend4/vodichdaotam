import { CharacterManager, isRealmAtLeast } from '../managers/CharacterManager.ts';
import { InventoryManager } from '../managers/InventoryManager.ts';
import { StaminaManager } from '../managers/StaminaManager.ts';
import { SaveManager, type StageProgress, SKILL_INTRO_MAX_SHOWS } from '../managers/SaveManager.ts';
import { DailyRewardManager } from '../managers/DailyRewardManager.ts';
import { GiftcodeManager } from '../managers/GiftcodeManager.ts';
import { LeoThapManager } from '../managers/LeoThapManager.ts';
import { CultivationManager } from '../managers/CultivationManager.ts';
import { soundManager } from '../utils/SoundManager.ts';
import { getItemById } from '../data/itemsData.ts';
import { TUTORIAL_STAGE_ID, CH1_GATE_1_ID, isChapter1Complete, resolveActiveMapChapterId, getStageById, getChapterById } from '../data/chaptersData.ts';
import { CH3_DUNGEON_BATTLE_IDS } from '../data/chapter3Stages.ts';
import { CH6_DUNGEON_BATTLE_IDS } from '../data/chapter6Stages.ts';
import { getTrialBattleChain } from '../data/chaptersData.ts';
import { STAMINA_CONSTANTS } from '../constants/gameRules.ts';
import type { DailyRewardSaveData } from '../managers/DailyRewardManager.ts';
import { generatePlayerDisplayId, registerPlayerDisplayId } from '../utils/playerDisplayId.ts';
import { ensureGuestSession, loadGuestSession, saveGuestSession, type GuestSession } from '../utils/guestSession.ts';

export { TUTORIAL_STAGE_ID };

export class GameState {
  readonly characterManager = new CharacterManager();
  readonly inventoryManager = new InventoryManager();
  readonly staminaManager = new StaminaManager();
  readonly saveManager = new SaveManager();
  readonly dailyRewardManager = new DailyRewardManager();
  readonly giftcodeManager = new GiftcodeManager();
  readonly leoThapManager = new LeoThapManager();
  readonly cultivationManager = new CultivationManager();
  readonly soundManager = soundManager;
  progress: StageProgress = { clearedStageIds: [] };
  playerDisplayId: number | null = null;
  guestAccountId: string | null = null;

  /** Singleton truy cập xuyên scene. */
  private static instance: GameState | null = null;

  static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  /** Reset singleton sau xóa tài khoản. */
  static resetInstance(): void {
    GameState.instance = null;
  }

  async loadOrCreate(): Promise<'new' | 'loaded'> {
    const saveData = await this.saveManager.load();
    if (saveData) {
      this.progress = this.saveManager.apply(
        saveData,
        this.characterManager,
        this.inventoryManager,
        this.staminaManager,
      );
      this.playerDisplayId = saveData.playerDisplayId ?? null;
      this.guestAccountId = saveData.guestAccountId ?? loadGuestSession()?.guestAccountId ?? null;
      this.giftcodeManager.importState(saveData.redeemedGiftcodes);
      this.cultivationManager.importState(saveData.cultivation);
      this.dailyRewardManager.importState(saveData.dailyReward ?? this.loadLegacyDailyReward());
      this.leoThapManager.importState(saveData.leoThap);
      if (this.guestAccountId && this.playerDisplayId) {
        saveGuestSession({
          guestAccountId: this.guestAccountId,
          playerDisplayId: this.playerDisplayId,
          createdAt: saveData.savedAt,
        });
      }
      if (this.hasMainCharacter() && this.playerDisplayId === null) {
        this.playerDisplayId = generatePlayerDisplayId();
        this.persist();
      } else if (this.playerDisplayId !== null) {
        registerPlayerDisplayId(this.playerDisplayId);
      }
      this.syncActiveMapChapterFromProgress(true);
      this.repairSkillEquipGuideIfSkipped();
      return 'loaded';
    }
    return 'new';
  }

  /** Gắn phiên khách (Chơi Ngay). */
  applyGuestSession(session: GuestSession): void {
    this.guestAccountId = session.guestAccountId;
    this.playerDisplayId = session.playerDisplayId;
    registerPlayerDisplayId(session.playerDisplayId);
    saveGuestSession(session);
  }

  getGuestAccountId(): string | null {
    return this.guestAccountId;
  }

  /** Gán ID hiển thị khi tạo nhân vật mới. */
  assignPlayerDisplayId(): number {
    if (this.playerDisplayId === null) {
      this.playerDisplayId = generatePlayerDisplayId();
    }
    if (this.guestAccountId === null) {
      const session = ensureGuestSession(() => this.playerDisplayId!);
      this.guestAccountId = session.guestAccountId;
    }
    return this.playerDisplayId;
  }

  getPlayerDisplayId(): number | null {
    return this.playerDisplayId;
  }

  persist(): void {
    if (this.playerDisplayId !== null && this.guestAccountId) {
      saveGuestSession({
        guestAccountId: this.guestAccountId,
        playerDisplayId: this.playerDisplayId,
        createdAt: loadGuestSession()?.createdAt ?? Date.now(),
      });
    }
    this.pendingSave = this.saveManager.save(
      this.characterManager,
      this.inventoryManager,
      this.staminaManager,
      this.progress,
      this.playerDisplayId,
      this.guestAccountId,
      this.giftcodeManager.exportState(),
      this.cultivationManager.exportState(),
      this.dailyRewardManager.exportState(),
      this.leoThapManager.exportState(),
    );
  }

  private pendingSave: Promise<unknown> | null = null;

  /** Flush save khi tab ẩn / reload — tránh mất save do ghi async chưa xong. */
  async flushSave(): Promise<void> {
    if (this.pendingSave) {
      await this.pendingSave;
    }
    this.pendingSave = this.saveManager.save(
      this.characterManager,
      this.inventoryManager,
      this.staminaManager,
      this.progress,
      this.playerDisplayId,
      this.guestAccountId,
      this.giftcodeManager.exportState(),
      this.cultivationManager.exportState(),
      this.dailyRewardManager.exportState(),
      this.leoThapManager.exportState(),
    );
    await this.pendingSave;
  }

  /** Di chuyển tiến trình quà ngày từ localStorage cũ (nếu có). */
  private loadLegacyDailyReward(): DailyRewardSaveData | undefined {
    try {
      const raw = localStorage.getItem('vodichdaotam_daily_reward');
      if (!raw) return undefined;
      return JSON.parse(raw) as DailyRewardSaveData;
    } catch {
      return undefined;
    }
  }

  isTutorialComplete(): boolean {
    return this.progress.clearedStageIds.includes(TUTORIAL_STAGE_ID);
  }

  isChapter1Complete(): boolean {
    return isChapter1Complete(this.progress.clearedStageIds);
  }

  markTutorialComplete(): void {
    this.progress = this.saveManager.markStageCleared(this.progress, TUTORIAL_STAGE_ID);
    this.persist();
  }

  hasMainCharacter(): boolean {
    return this.characterManager.getMainCharacter() !== null;
  }

  syncPartyVitals(): void {
    this.characterManager.syncPartyVitals(getItemById);
  }

  isStageCleared(stageId: string): boolean {
    return this.saveManager.isStageCleared(this.progress, stageId);
  }

  markStageCleared(stageId: string): void {
    this.progress = this.saveManager.markStageCleared(this.progress, stageId);
    if (stageId === CH1_GATE_1_ID && !this.progress.hubMapGuideDone) {
      this.progress = { ...this.progress, hubMapGuideDone: true };
    }
    const stage = getStageById(stageId);
    if (stage) {
      this.progress = { ...this.progress, activeMapChapterId: stage.chapterId };
    }
    this.persist();
  }

  isGate1BattleGuideDone(): boolean {
    return this.progress.gate1BattleGuideDone === true;
  }

  markGate1BattleGuideDone(): void {
    if (this.progress.gate1BattleGuideDone) return;
    this.progress = { ...this.progress, gate1BattleGuideDone: true };
    this.persist();
  }

  /** Còn được hiện bảng giới thiệu võ kỹ (chung toàn tài khoản, tối đa 5 lần). */
  shouldShowSkillIntro(): boolean {
    return (this.progress.skillIntroShownCount ?? 0) < SKILL_INTRO_MAX_SHOWS;
  }

  /** Trừ 1 lượt hiển thị — trả false nếu đã đạt giới hạn. Gọi ngay trước khi mở modal. */
  tryConsumeSkillIntroShow(): boolean {
    const count = this.progress.skillIntroShownCount ?? 0;
    if (count >= SKILL_INTRO_MAX_SHOWS) return false;
    this.progress = { ...this.progress, skillIntroShownCount: count + 1 };
    return true;
  }

  getSkillIntroShownCount(): number {
    return this.progress.skillIntroShownCount ?? 0;
  }

  isSkillEquipGuideDone(): boolean {
    return this.progress.skillEquipGuideDone === true;
  }

  /** Chỉ nhân vật đầu tiên lên Nhất Tinh được nhận hướng dẫn trang bị võ kỹ (một lần). */
  claimSkillEquipGuideForCharacter(characterId: string): boolean {
    if (this.isSkillEquipGuideDone()) return false;

    const roster = this.characterManager.getRoster();
    const anotherAlreadyNhatTinh = roster.some(
      (c) => c.id !== characterId && isRealmAtLeast(c.realm, 'NhatTinh'),
    );
    if (anotherAlreadyNhatTinh) {
      this.markSkillEquipGuideDone();
      return false;
    }

    const claimedId = this.progress.skillEquipGuideCharacterId;
    if (claimedId) {
      return claimedId === characterId;
    }

    this.progress = { ...this.progress, skillEquipGuideCharacterId: characterId };
    this.persist();
    return true;
  }

  markSkillEquipGuideDone(): void {
    if (this.progress.skillEquipGuideDone) return;
    this.progress = { ...this.progress, skillEquipGuideDone: true };
    this.persist();
  }

  /** Save cũ bị đánh dấu xong hướng dẫn trước khi hiển thị (bug). */
  repairSkillEquipGuideIfSkipped(): void {
    if (!this.progress.skillEquipGuideDone) return;
    const charId = this.progress.skillEquipGuideCharacterId;
    if (!charId) return;
    const learned = this.characterManager.getLearnedSkillIds(charId);
    if (learned.length <= 1) {
      this.progress = { ...this.progress, skillEquipGuideDone: false };
      this.persist();
    }
  }

  getSkillEquipGuideCharacterId(): string | undefined {
    return this.progress.skillEquipGuideCharacterId;
  }

  isThienTaiUnlocked(): boolean {
    return this.progress.thienTaiUnlocked === true;
  }

  unlockThienTai(): void {
    if (this.progress.thienTaiUnlocked) return;
    this.progress = { ...this.progress, thienTaiUnlocked: true };
    this.persist();
  }

  setActiveMapChapter(chapterId: string): void {
    if (!getChapterById(chapterId)) return;
    this.progress = { ...this.progress, activeMapChapterId: chapterId };
    this.persist();
  }

  getActiveMapChapterId(): string {
    const saved = this.progress.activeMapChapterId;
    if (saved && getChapterById(saved)) return saved;
    return this.resolveMapChapterFromProgress();
  }

  /** Cập nhật chương bản đồ theo tiến trình (mở từ sảnh chính). */
  syncActiveMapChapterFromProgress(persist = false): void {
    const resolved = this.resolveMapChapterFromProgress();
    if (this.progress.activeMapChapterId === resolved) return;
    this.progress = { ...this.progress, activeMapChapterId: resolved };
    if (persist) this.persist();
  }

  private resolveMapChapterFromProgress(): string {
    return resolveActiveMapChapterId(
      this.progress.clearedStageIds,
      this.isTutorialComplete(),
      this.inventoryManager.getTinhThach(),
    );
  }

  /** Ghi nhận vượt hết Hầm ngục (thắng Hầm 21). Mỗi 3 lần tặng 1 Hắc Liên vạn năm. */
  recordDungeonFullClear(): string | null {
    const count = (this.progress.dungeonFullClearCount ?? 0) + 1;
    this.progress = { ...this.progress, dungeonFullClearCount: count };

    if (count % STAMINA_CONSTANTS.DUNGEON_FULL_CLEAR_REWARD_EVERY !== 0) {
      this.persist();
      return null;
    }

    const itemId = STAMINA_CONSTANTS.DUNGEON_FULL_CLEAR_REWARD_ITEM_ID;
    this.inventoryManager.addItem(itemId, 1);
    soundManager.playItemPickup();
    this.persist();
    return getItemById(itemId)?.name ?? itemId;
  }

  isDungeonFinalStage(stageId: string): boolean {
    const ch3Final = CH3_DUNGEON_BATTLE_IDS[CH3_DUNGEON_BATTLE_IDS.length - 1];
    const ch6Final = CH6_DUNGEON_BATTLE_IDS[CH6_DUNGEON_BATTLE_IDS.length - 1];
    return stageId === ch3Final || stageId === ch6Final;
  }

  isHubMapGuideDone(): boolean {
    if (this.progress.hubMapGuideDone === true) return true;
    return this.isStageCleared(CH1_GATE_1_ID);
  }

  markHubMapGuideDone(): void {
    if (this.progress.hubMapGuideDone) return;
    this.progress = { ...this.progress, hubMapGuideDone: true };
    this.persist();
  }

  isDungeonBattleStage(stageId: string): boolean {
    return (CH3_DUNGEON_BATTLE_IDS as readonly string[]).includes(stageId)
      || (CH6_DUNGEON_BATTLE_IDS as readonly string[]).includes(stageId);
  }

  /** Thua giữa chừng Hầm ngục — xóa tiến trình các tầng để lần sau vào lại từ Hầm 1. */
  resetDungeonRunOnDefeat(failedStageId?: string): void {
    const chain = failedStageId ? getTrialBattleChain(failedStageId) : null;
    if (!chain?.length) return;
    const dungeonIds = new Set<string>(chain);
    this.progress = {
      ...this.progress,
      clearedStageIds: this.progress.clearedStageIds.filter((id) => !dungeonIds.has(id)),
    };
    this.persist();
  }

  isTeleportGateReincarnationUsed(): boolean {
    return this.progress.teleportGateReincarnationUsed === true;
  }

  /** Đã Chuyển sinh tại cổng — cổng không còn hiện. */
  isTeleportGateChoiceMade(): boolean {
    return this.isTeleportGateReincarnationUsed();
  }

  /**
   * Chuyển sinh tại Chuyển sinh (Ch.9) — áp dụng ngay, hub biến mất;
   * sau khi vượt lại ải 9 chương 9 mới vào được Giới Tâm.
   */
  applyTeleportGateReincarnation(characterId: string): { success: boolean; message: string } {
    const result = this.characterManager.reincarnate(characterId);
    if (!result.success) return result;

    const tutorialDone = this.isTutorialComplete();
    this.progress = {
      ...this.progress,
      clearedStageIds: tutorialDone ? [TUTORIAL_STAGE_ID] : [],
      gate1BattleGuideDone: false,
      thienTaiUnlocked: false,
      dungeonFullClearCount: 0,
      skillEquipGuideDone: false,
      skillEquipGuideCharacterId: undefined,
      activeMapChapterId: 'chapter_1',
      teleportGateReincarnationUsed: true,
    };
    this.syncPartyVitals();
    this.persist();
    return {
      success: true,
      message: `${result.message} Hãy vượt lại ải 9 chương 9 để vào Giới Tâm.`,
    };
  }
}
