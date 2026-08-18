import type Phaser from 'phaser';
import { GameState } from '../state/gameState.ts';
import type { BreakthroughResult } from '../managers/CharacterManager.ts';
import { StatAllocationModal } from './modals/StatAllocationModal.ts';
import { SkillIntroModal } from './modals/SkillIntroModal.ts';
import {
  shouldStartSkillEquipGuide,
  SKILL_EQUIP_GUIDE_START_EVENT,
  SKILL_EQUIP_GUIDE_FINISHED_EVENT,
} from './skillEquipGuide.ts';

interface RealmFlowOptions {
  /** Chỉ 1 bảng võ kỹ mỗi lần quét đội (tu luyện / nhận EXP hàng loạt). */
  skillIntroBatch?: { shownThisBatch: boolean };
}

/** Kiểm tra đột phá cảnh giới + mở bảng phân bổ điểm tu luyện nếu cần. */
export function runRealmProgressionFlow(
  scene: Phaser.Scene,
  characterId: string,
  onComplete?: () => void,
): void {
  runRealmProgressionFlowInternal(scene, characterId, onComplete);
}

/** Lần lượt kiểm tra thăng cấp cho toàn bộ đội (nhân vật chính + đồng đội). */
export function runPartyRealmProgressionFlow(
  scene: Phaser.Scene,
  onComplete?: () => void,
): void {
  const party = GameState.getInstance().characterManager.getParty();
  const skillIntroBatch = { shownThisBatch: false };
  let index = 0;

  const next = (): void => {
    if (index >= party.length) {
      onComplete?.();
      return;
    }
    const member = party[index++]!;
    runRealmProgressionFlowInternal(scene, member.id, next, { skillIntroBatch });
  };

  next();
}

function runRealmProgressionFlowInternal(
  scene: Phaser.Scene,
  characterId: string,
  onComplete?: () => void,
  options?: RealmFlowOptions,
): void {
  const gs = GameState.getInstance();
  const breakthrough = gs.characterManager.tryAutoBreakthrough(characterId);
  if (breakthrough?.success) {
    if (breakthrough.shouldRestoreStamina) {
      gs.staminaManager.restoreFullOnRealmUpgrade();
    }
    gs.syncPartyVitals();
    gs.persist();
  }

  const pending = gs.characterManager.getPendingStatPoints(characterId);
  const hadBreakthrough = Boolean(breakthrough?.success);
  const startSkillEquipGuide = shouldStartSkillEquipGuide(breakthrough, characterId);

  if (pending > 0) {
    openStatAllocationForCharacter(scene, characterId, breakthrough, () => {
      gs.syncPartyVitals();
      gs.persist();
      afterStatAllocation(scene, characterId, hadBreakthrough, startSkillEquipGuide, () => {
        runRealmProgressionFlowInternal(scene, characterId, onComplete, options);
      }, options);
    });
    return;
  }

  finishRealmStep(scene, characterId, hadBreakthrough, startSkillEquipGuide, onComplete, options);
}

function afterStatAllocation(
  scene: Phaser.Scene,
  characterId: string,
  hadBreakthrough: boolean,
  startSkillEquipGuide: boolean,
  onDone: () => void,
  options?: RealmFlowOptions,
): void {
  finishRealmStep(scene, characterId, hadBreakthrough, startSkillEquipGuide, onDone, options);
}

function finishRealmStep(
  scene: Phaser.Scene,
  characterId: string,
  hadBreakthrough: boolean,
  startSkillEquipGuide: boolean,
  onComplete?: () => void,
  options?: RealmFlowOptions,
): void {
  if (hadBreakthrough && shouldOfferSkillIntro(options)) {
    const gs = GameState.getInstance();
    if (gs.tryConsumeSkillIntroShow()) {
      if (options?.skillIntroBatch) {
        options.skillIntroBatch.shownThisBatch = true;
      }
      gs.persist();
      openSkillIntroModal(scene, () => {
        if (startSkillEquipGuide) {
          beginSkillEquipGuide(scene, characterId, onComplete);
        } else {
          onComplete?.();
        }
      });
      return;
    }
  }

  if (startSkillEquipGuide) {
    beginSkillEquipGuide(scene, characterId, onComplete);
    return;
  }

  onComplete?.();
}

function shouldOfferSkillIntro(options?: RealmFlowOptions): boolean {
  const gs = GameState.getInstance();
  if (!gs.shouldShowSkillIntro()) return false;
  if (options?.skillIntroBatch?.shownThisBatch) return false;
  return true;
}

function beginSkillEquipGuide(
  scene: Phaser.Scene,
  characterId: string,
  onComplete?: () => void,
): void {
  scene.events.once(SKILL_EQUIP_GUIDE_FINISHED_EVENT, () => {
    onComplete?.();
  });
  scene.events.emit(SKILL_EQUIP_GUIDE_START_EVENT, characterId);
}

function openSkillIntroModal(scene: Phaser.Scene, onDone: () => void): void {
  new SkillIntroModal(scene, onDone);
}

function openStatAllocationForCharacter(
  scene: Phaser.Scene,
  characterId: string,
  breakthrough: BreakthroughResult | null,
  onDone: () => void,
): void {
  const gs = GameState.getInstance();
  const pending = gs.characterManager.getPendingStatPoints(characterId);
  if (pending <= 0) {
    onDone();
    return;
  }

  new StatAllocationModal(scene, {
    characterId,
    pointBudget: pending,
    title: 'Phân bổ điểm tu luyện',
    newRealm: breakthrough?.success ? breakthrough.newRealm : undefined,
    onDone,
  });
}
