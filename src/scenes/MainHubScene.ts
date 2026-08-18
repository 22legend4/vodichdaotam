import Phaser from 'phaser';
import { GameState } from '../state/gameState.ts';
import {
  UI_THEME,
  MainHubLayout,
  CraftingModal,
  ShopModal,
  InventoryModal,
  MeditationModal,
  MapModal,
  EventsModal,
  SettingsModal,
  PlayerRosterModal,
  SkillModal,
  DailyRewardModal,
  runPartyRealmProgressionFlow,
  SkillEquipGuideController,
  tryResumeSkillEquipGuide,
  SKILL_EQUIP_GUIDE_START_EVENT,
  SKILL_EQUIP_GUIDE_FINISHED_EVENT,
} from '../ui/index.ts';
import { HUYET_LONG_TRI_SKILL_NOTICE } from '../data/chapter9Stages.ts';
import { addSceneBackground } from '../utils/AssetGenerator.ts';

export interface MainHubSceneData {
  openMap?: boolean;
  openEvents?: boolean;
  /** Chương bản đồ mở sau trận (fallback khi Hub bị destroy — vd. nhận đồng đội). */
  mapChapterId?: string;
}

export class MainHubScene extends Phaser.Scene {
  private hubLayout!: MainHubLayout;
  private skillEquipGuide?: SkillEquipGuideController;
  private openMapOnCreate = false;
  private openEventsOnCreate = false;
  private mapChapterIdOnCreate?: string;

  constructor() {
    super({ key: 'MainHubScene' });
  }

  init(data: MainHubSceneData = {}): void {
    this.openMapOnCreate = data.openMap ?? false;
    this.openEventsOnCreate = data.openEvents ?? false;
    this.mapChapterIdOnCreate = data.mapChapterId;
  }

  create(): void {
    addSceneBackground(this, 'meditation', UI_THEME.depth.background);

    this.hubLayout = new MainHubLayout(this, {
      onForge: () => this.openModal(() => new CraftingModal(this)),
      onShop: () => this.openModal(() => new ShopModal(this)),
      onInventory: () => this.openModal(() => new InventoryModal(this)),
      onMeditate: () => this.openModal(() => new MeditationModal(this)),
      onMap: () => {
        const gs = GameState.getInstance();
        if (this.hubLayout.isMapGuideActive()) {
          gs.markHubMapGuideDone();
          this.hubLayout.dismissMapEntryGuide();
        }
        gs.syncActiveMapChapterFromProgress();
        this.openMapModal();
      },
      onChallenge: () => this.hubLayout.showToast('Sắp ra mắt'),
      onFriends: () => this.hubLayout.showToast('Bạn bè — sắp ra mắt'),
      onSettings: () => this.openModal(() => new SettingsModal(this)),
      onPlayerRoster: () => this.openModal(() => new PlayerRosterModal(this)),
      onSkills: () => {
        if (this.skillEquipGuide?.handleSkillsPress()) return;
        this.openModal(() => new SkillModal(this));
      },
      onEvents: () => this.openModal(() => new EventsModal(this)),
      onDailyReward: () => this.openModal(() => new DailyRewardModal(this)),
    });

    this.events.on(SKILL_EQUIP_GUIDE_START_EVENT, this.onSkillEquipGuideStart, this);

    this.refreshHud();

    const mc = GameState.getInstance().characterManager.getMainCharacter();
    if (mc) {
      this.time.delayedCall(80, () => {
        runPartyRealmProgressionFlow(this, () => {
          this.afterRealmProgression(() => {
            if (this.openMapOnCreate) {
              this.openMapOnCreate = false;
              this.openMapModal();
            } else if (this.openEventsOnCreate) {
              this.openEventsOnCreate = false;
              this.openModal(() => new EventsModal(this));
            } else {
              this.maybeShowHubMapGuide();
            }
          });
        });
      });
    } else if (this.openMapOnCreate) {
      this.openMapOnCreate = false;
      this.time.delayedCall(0, () => this.openMapModal());
    } else if (this.openEventsOnCreate) {
      this.openEventsOnCreate = false;
      this.time.delayedCall(0, () => this.openModal(() => new EventsModal(this)));
    } else {
      this.time.delayedCall(120, () => this.maybeShowHubMapGuide());
    }
  }

  /** Sau trận sự kiện (Hub vẫn sống). */
  resumeFromEventBattle(): void {
    this.refreshHud();
    runPartyRealmProgressionFlow(this, () => {
      this.afterRealmProgression(() => {
        this.openModal(() => new EventsModal(this));
      });
    });
  }

  /** Sau trận bản đồ (Hub vẫn sống — launch/stop BattleScene). */
  resumeFromMapBattle(mapChapterId?: string): void {
    if (mapChapterId) {
      GameState.getInstance().setActiveMapChapter(mapChapterId);
    }
    this.refreshHud();
    runPartyRealmProgressionFlow(this, () => {
      this.afterRealmProgression(() => {
        this.openMapModal();
      });
    });
  }

  /** Sau đột phá / phân bổ điểm — ưu tiên hướng dẫn võ kỹ nếu còn dang dở. */
  private afterRealmProgression(next: () => void): void {
    this.refreshHud();
    if (tryResumeSkillEquipGuide(this)) return;
    next();
  }

  /** Lần đầu lên Nhất Tinh — hướng dẫn học & trang bị võ kỹ. */
  private onSkillEquipGuideStart(characterId: string): void {
    const gs = GameState.getInstance();
    if (gs.isSkillEquipGuideDone()) {
      this.events.emit(SKILL_EQUIP_GUIDE_FINISHED_EVENT);
      return;
    }
    const guideCharId = gs.getSkillEquipGuideCharacterId();
    if (guideCharId && guideCharId !== characterId) {
      gs.markSkillEquipGuideDone();
      this.events.emit(SKILL_EQUIP_GUIDE_FINISHED_EVENT);
      return;
    }
    if (this.skillEquipGuide?.isActive()) return;
    this.skillEquipGuide = new SkillEquipGuideController(this, this.hubLayout, () => {
      this.skillEquipGuide = undefined;
      this.refreshHud();
    });
    this.skillEquipGuide.start(characterId);
  }

  shutdown(): void {
    this.events.off(SKILL_EQUIP_GUIDE_START_EVENT, this.onSkillEquipGuideStart, this);
    this.skillEquipGuide = undefined;
  }

  /** Lần đầu vào sảnh sau tutorial — hướng dẫn bấm Bản Đồ (tắt sau ải 1 hoặc khi bấm Bản Đồ). */
  private maybeShowHubMapGuide(): void {
    const gs = GameState.getInstance();
    if (this.skillEquipGuide?.isActive()) return;
    if (gs.isTutorialComplete() && !gs.isHubMapGuideDone()) {
      this.hubLayout.showMapEntryGuide();
    }
  }

  private refreshHud(): void {
    const gs = GameState.getInstance();
    const mc = gs.characterManager.getMainCharacter();
    this.hubLayout.refresh(
      mc,
      gs.inventoryManager.getTinhThach(),
      gs.inventoryManager.getGioiThuy(),
      gs.staminaManager.getCurrentStamina(),
      gs.getPlayerDisplayId(),
    );
  }

  /** Mở modal và làm mới HUD khi đóng (nếu modal có onClose). */
  private openMapModal(): void {
    if (this.mapChapterIdOnCreate) {
      GameState.getInstance().setActiveMapChapter(this.mapChapterIdOnCreate);
      this.mapChapterIdOnCreate = undefined;
    }
    this.openModal(() => new MapModal(this, {
      onHuyetLongTriComplete: () => {
        this.openModal(() => new SkillModal(this, undefined, undefined, HUYET_LONG_TRI_SKILL_NOTICE));
      },
    }));
  }

  private openModal(factory: () => { container?: { on?: (ev: string, fn: () => void) => void } }): void {
    factory();
    this.time.delayedCall(300, () => this.refreshHud());
  }
}
