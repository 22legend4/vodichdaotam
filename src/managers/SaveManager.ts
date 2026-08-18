import { CharacterManager } from './CharacterManager.ts';
import { InventoryManager } from './InventoryManager.ts';
import { StaminaManager } from './StaminaManager.ts';
import { TournamentManager } from './TournamentManager.ts';
import { getItemById } from '../data/itemsData.ts';
import type { CharacterMeta } from './CharacterManager.ts';
import type { CharacterData } from '../types/game.ts';
import type { InventorySlot } from './InventoryManager.ts';

import type { TournamentSaveState } from './TournamentManager.ts';
import type { CultivationSaveState } from './CultivationManager.ts';
import type { DailyRewardSaveData } from './DailyRewardManager.ts';
import type { LeoThapSaveState } from './LeoThapManager.ts';
import type { WalletSaveState } from './WalletManager.ts';
import { clearAllGameLocalData } from '../utils/guestSession.ts';

export const SAVE_STORAGE_KEY = 'vodichdaotam_save';
export const SAVE_VERSION = 4;

/** Số lần tối đa hiện bảng giới thiệu võ kỹ — dùng chung toàn tài khoản (không theo từng nhân vật). */
export const SKILL_INTRO_MAX_SHOWS = 5;

export interface StageProgress {
  clearedStageIds: string[];
  /** Đã xem hướng dẫn võ kỹ Cửa ải 1. */
  gate1BattleGuideDone?: boolean;
  /** Số lần đã hiện bảng giới thiệu võ kỹ sau thăng cấp (tối đa 5, chung toàn tài khoản). */
  skillIntroShownCount?: number;
  /** Đã trả 500 Tinh Thạch để mở Thiên Tài Trận (lần đầu). */
  thienTaiUnlocked?: boolean;
  /** Số lần vượt hết 21 tầng Hầm ngục. */
  dungeonFullClearCount?: number;
  /** Đã xem hướng dẫn bấm Bản Đồ trên sảnh chính. */
  hubMapGuideDone?: boolean;
  /** Đã hoàn thành hướng dẫn học & trang bị võ kỹ lần đầu lên Nhất Tinh. */
  skillEquipGuideDone?: boolean;
  /** Nhân vật đầu tiên lên Nhất Tinh — duy nhất được xem hướng dẫn trang bị võ kỹ. */
  skillEquipGuideCharacterId?: string;
  /** Chương bản đồ đang xem (theo tiến trình / lựa chọn). */
  activeMapChapterId?: string;
  /** Đã tu luyện Huyết Long Trì (Cổng dịch chuyển — Chương 9). */
  huyetLongTriComplete?: boolean;
}

export interface GameSaveData {
  version: number;
  savedAt: number;
  characters: CharacterData[];
  characterMeta: Record<string, CharacterMeta>;
  partyIds: string[];
  unlockedCompanionIds: string[];
  mainCharacterId: string | null;
  inventory: {
    grid?: Array<InventorySlot | null>;
    slots: InventorySlot[];
    capacity: number;
    tinhThach: number;
    gioiThuy: number;
  };
  stamina: {
    currentStamina: number;
    lastUpdatedAt: number;
  };
  progress: StageProgress;
  tournament?: TournamentSaveState;
  /** ID hiển thị 5 chữ số trên sảnh chính. */
  playerDisplayId?: number;
  /** Tài khoản khách (Chơi Ngay). */
  guestAccountId?: string;
  /** Mã giftcode đã nhận. */
  redeemedGiftcodes?: string[];
  /** Buff tu luyện (Thiền Quy / Thất Sinh). */
  cultivation?: CultivationSaveState;
  /** Quà tặng hàng ngày. */
  dailyReward?: DailyRewardSaveData;
  /** Event Leo Tháp — tham gia theo phiên Thứ 6. */
  leoThap?: LeoThapSaveState;
  /** Ví nạp tiền (VND). */
  wallet?: WalletSaveState;
}

export class SaveManager {
  save(
    characterManager: CharacterManager,
    inventoryManager: InventoryManager,
    staminaManager: StaminaManager,
    progress: StageProgress,
    tournamentManager?: TournamentManager,
    playerDisplayId?: number | null,
    guestAccountId?: string | null,
    redeemedGiftcodes?: string[],
    cultivation?: CultivationSaveState,
    dailyReward?: DailyRewardSaveData,
    leoThap?: LeoThapSaveState,
    wallet?: WalletSaveState,
  ): GameSaveData {
    const characterState = characterManager.exportState();
    const saveData: GameSaveData = {
      version: SAVE_VERSION,
      savedAt: Date.now(),
      characters: characterState.characters,
      characterMeta: characterState.meta,
      partyIds: characterState.partyIds,
      unlockedCompanionIds: characterState.unlockedCompanionIds,
      mainCharacterId: characterState.mainCharacterId,
      inventory: inventoryManager.exportState(),
      stamina: staminaManager.exportState(),
      progress: {
        ...progress,
        clearedStageIds: [...progress.clearedStageIds],
      },
      tournament: tournamentManager?.exportState(),
      playerDisplayId: playerDisplayId ?? undefined,
      guestAccountId: guestAccountId ?? undefined,
      redeemedGiftcodes: redeemedGiftcodes?.length ? [...redeemedGiftcodes] : undefined,
      cultivation: cultivation
        ? {
            thienQuyExpiresAt: cultivation.thienQuyExpiresAt,
            thatSinhExpiresAt: cultivation.thatSinhExpiresAt,
          }
        : undefined,
      dailyReward: dailyReward
        ? {
            nextDay: dailyReward.nextDay,
            lastClaimDate: dailyReward.lastClaimDate,
            totalClaims: dailyReward.totalClaims,
          }
        : undefined,
      leoThap: leoThap
        ? {
            participatedSessions: [...leoThap.participatedSessions],
            bestFloorBySession: { ...leoThap.bestFloorBySession },
          }
        : undefined,
      wallet: wallet
        ? {
            balanceVnd: wallet.balanceVnd,
            transactions: wallet.transactions.map((tx) => ({ ...tx })),
          }
        : undefined,
    };

    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(saveData));
    return saveData;
  }

  load(): GameSaveData | null {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return null;

    try {
      const data = JSON.parse(raw) as GameSaveData;
      if (!data) return null;
      if (data.version === 1 || data.version === 2) {
        return { ...data, version: SAVE_VERSION, wallet: { balanceVnd: 0, transactions: [] } };
      }
      if (data.version === 3) {
        return { ...data, version: SAVE_VERSION, wallet: data.wallet ?? { balanceVnd: 0, transactions: [] } };
      }
      if (data.version !== SAVE_VERSION) {
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  apply(
    saveData: GameSaveData,
    characterManager: CharacterManager,
    inventoryManager: InventoryManager,
    staminaManager: StaminaManager,
    tournamentManager?: TournamentManager,
  ): StageProgress {
    characterManager.importState({
      characters: saveData.characters,
      meta: saveData.characterMeta,
      partyIds: saveData.partyIds,
      unlockedCompanionIds: saveData.unlockedCompanionIds,
      mainCharacterId: saveData.mainCharacterId,
    });

    inventoryManager.importState(saveData.inventory);
    staminaManager.importState(saveData.stamina);

    if (tournamentManager && saveData.tournament) {
      tournamentManager.importState(saveData.tournament);
    }

    characterManager.syncPartyVitals(getItemById);

    return {
      ...saveData.progress,
      clearedStageIds: [...saveData.progress.clearedStageIds],
    };
  }

  loadAndApply(
    characterManager: CharacterManager,
    inventoryManager: InventoryManager,
    staminaManager: StaminaManager,
    tournamentManager?: TournamentManager,
  ): StageProgress | null {
    const saveData = this.load();
    if (!saveData) return null;
    return this.apply(saveData, characterManager, inventoryManager, staminaManager, tournamentManager);
  }

  hasSave(): boolean {
    return localStorage.getItem(SAVE_STORAGE_KEY) !== null;
  }

  deleteSave(): void {
    localStorage.removeItem(SAVE_STORAGE_KEY);
  }

  /** Xóa save và reset toàn bộ dữ liệu game trên máy. */
  wipeAllLocalData(): void {
    clearAllGameLocalData();
  }

  markStageCleared(progress: StageProgress, stageId: string): StageProgress {
    if (progress.clearedStageIds.includes(stageId)) {
      return progress;
    }
    return {
      clearedStageIds: [...progress.clearedStageIds, stageId],
    };
  }

  isStageCleared(progress: StageProgress, stageId: string): boolean {
    return progress.clearedStageIds.includes(stageId);
  }
}
