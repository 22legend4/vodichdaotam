import type Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameDimensions.ts';
import type { BreakthroughResult } from '../managers/CharacterManager.ts';
import { GameState } from '../state/gameState.ts';
import { getFirstPurchasableWeaponSkill } from '../data/skillsData.ts';
import { BattleGuideOverlay } from './BattleGuideOverlay.ts';
import { UI_THEME } from './theme.ts';
import type { MainHubLayout } from './MainHubLayout.ts';
import { MapModal } from './modals/MapModal.ts';
import { SkillModal, type SkillModalGuideConfig } from './modals/SkillModal.ts';

const GUIDE_DEPTH = UI_THEME.depth.overlay + 25;
const MAP_CLOSE_Y = GAME_HEIGHT - 44;

export const SKILL_EQUIP_GUIDE_START_EVENT = 'start-skill-equip-guide';
export const SKILL_EQUIP_GUIDE_FINISHED_EVENT = 'skill-equip-guide-finished';

export function shouldStartSkillEquipGuide(
  breakthrough: BreakthroughResult | null,
  characterId: string,
): boolean {
  if (!breakthrough?.success || breakthrough.newRealm !== 'NhatTinh') return false;
  return GameState.getInstance().claimSkillEquipGuideForCharacter(characterId);
}

/** Nhân vật cần tiếp tục hướng dẫn (save cũ hoặc thoát giữa chừng). */
export function getPendingSkillEquipGuideCharacterId(): string | null {
  const gs = GameState.getInstance();
  if (gs.isSkillEquipGuideDone()) return null;

  const charId = gs.getSkillEquipGuideCharacterId();
  if (!charId) return null;

  const char = gs.characterManager.getCharacter(charId);
  if (!char || char.realm !== 'NhatTinh') return null;

  const learned = gs.characterManager.getLearnedSkillIds(charId);
  if (learned.length > 1) {
    gs.markSkillEquipGuideDone();
    return null;
  }

  return charId;
}

/** Khởi động lại hướng dẫn nếu còn dang dở. Trả về true nếu đã phát sự kiện. */
export function tryResumeSkillEquipGuide(scene: Phaser.Scene): boolean {
  const charId = getPendingSkillEquipGuideCharacterId();
  if (!charId) return false;
  scene.events.emit(SKILL_EQUIP_GUIDE_START_EVENT, charId);
  return true;
}

function liftToScene(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.GameObject & {
    getWorldTransformMatrix(): Phaser.GameObjects.Components.TransformMatrix;
    setDepth(depth: number): void;
    setPosition(x: number, y: number): void;
  },
  parent: Phaser.GameObjects.Container,
  depth: number = GUIDE_DEPTH + 10,
): void {
  const matrix = obj.getWorldTransformMatrix();
  parent.remove(obj, false);
  scene.add.existing(obj);
  obj.setPosition(matrix.tx, matrix.ty);
  obj.setDepth(depth);
}

/** Điều phối hướng dẫn học & trang bị võ kỹ lần đầu lên Nhất Tinh. */
export class SkillEquipGuideController {
  private step: 'mapClose' | 'hubSkill' | null = null;
  private overlay?: BattleGuideOverlay;
  private guideCharacterId?: string;
  private targetSkillId?: string;
  private mapCloseBtn?: Phaser.GameObjects.GameObject;
  private mapCloseParent?: Phaser.GameObjects.Container;
  private mapCloseLocal = { x: 0, y: 0 };
  private scene: Phaser.Scene;
  private hub: MainHubLayout;
  private onFinished: () => void;

  constructor(scene: Phaser.Scene, hub: MainHubLayout, onFinished: () => void) {
    this.scene = scene;
    this.hub = hub;
    this.onFinished = onFinished;
  }

  isActive(): boolean {
    return this.step !== null;
  }

  start(characterId: string): void {
    const gs = GameState.getInstance();
    if (gs.isSkillEquipGuideDone()) {
      this.finish();
      return;
    }
    const char = gs.characterManager.getCharacter(characterId);
    if (!char) {
      this.finish();
      return;
    }
    if (gs.getSkillEquipGuideCharacterId() && gs.getSkillEquipGuideCharacterId() !== characterId) {
      this.finish();
      return;
    }

    this.guideCharacterId = characterId;
    this.targetSkillId = getFirstPurchasableWeaponSkill(char.weaponType);
    this.step = 'mapClose';
    gs.syncActiveMapChapterFromProgress();
    this.openMapModal();
  }

  /** Bước 3 — người chơi bấm nút Võ Kỹ trên sảnh chính. */
  handleSkillsPress(): boolean {
    if (this.step !== 'hubSkill' || !this.guideCharacterId || !this.targetSkillId) return false;

    this.dismissOverlay();
    this.hub.dismissSkillButtonGuide();
    this.step = null;
    this.openSkillModal();
    return true;
  }

  private openMapModal(): void {
    new MapModal(this.scene, {
      onClose: () => this.onMapClosed(),
      skillEquipGuide: true,
      onCloseButtonReady: (btn, parent, localX, localY) => {
        this.setupMapCloseGuide(btn, parent, localX, localY);
      },
    });
  }

  private setupMapCloseGuide(
    closeBtn: Phaser.GameObjects.GameObject,
    parent: Phaser.GameObjects.Container,
    localX: number,
    localY: number,
  ): void {
    if (this.step !== 'mapClose') return;

    this.mapCloseBtn = closeBtn;
    this.mapCloseParent = parent;
    this.mapCloseLocal = { x: localX, y: localY };

    liftToScene(
      this.scene,
      closeBtn as Phaser.GameObjects.GameObject & {
        getWorldTransformMatrix(): Phaser.GameObjects.Components.TransformMatrix;
        setDepth(depth: number): void;
        setPosition(x: number, y: number): void;
      },
      parent,
    );

    this.overlay = new BattleGuideOverlay(this.scene);
    this.overlay.setDepth(GUIDE_DEPTH + 5);
    this.overlay.show({
      step: 'fightNow',
      spotlight: {
        x: GAME_WIDTH / 2,
        y: MAP_CLOSE_Y,
        width: 160,
        height: 56,
        shape: 'rect',
      },
      instruction: 'Ấn nút Đóng để quay lại sảnh chính.',
      arrow: {
        fromX: GAME_WIDTH / 2 - 220,
        fromY: MAP_CLOSE_Y - 120,
        toX: GAME_WIDTH / 2 - 90,
        toY: MAP_CLOSE_Y - 8,
      },
    });
  }

  private onMapClosed(): void {
    if (this.step !== 'mapClose') return;

    this.dismissOverlay();
    this.restoreMapCloseBtn();
    this.step = 'hubSkill';
    this.scene.time.delayedCall(120, () => {
      if (this.step === 'hubSkill') {
        this.hub.showSkillButtonGuide();
      }
    });
  }

  private openSkillModal(): void {
    if (!this.guideCharacterId || !this.targetSkillId) {
      this.finish();
      return;
    }

    const guide: SkillModalGuideConfig = {
      characterId: this.guideCharacterId,
      targetSkillId: this.targetSkillId,
      loadoutSlotIndex: 1,
      onComplete: () => this.finish(),
    };
    new SkillModal(this.scene, undefined, guide);
  }

  private restoreMapCloseBtn(): void {
    const btn = this.mapCloseBtn as Phaser.GameObjects.Container | undefined;
    const parent = this.mapCloseParent;
    if (!btn || !parent) return;

    btn.removeFromDisplayList();
    parent.add(btn);
    btn.setPosition(this.mapCloseLocal.x, this.mapCloseLocal.y);
    btn.setDepth(0);
    this.mapCloseBtn = undefined;
    this.mapCloseParent = undefined;
  }

  private dismissOverlay(): void {
    this.overlay?.hide();
    this.overlay?.destroy();
    this.overlay = undefined;
  }

  private finish(): void {
    this.dismissOverlay();
    this.restoreMapCloseBtn();
    this.hub.dismissSkillButtonGuide();
    this.step = null;
    GameState.getInstance().markSkillEquipGuideDone();
    this.onFinished();
    this.scene.events.emit(SKILL_EQUIP_GUIDE_FINISHED_EVENT);
  }
}
