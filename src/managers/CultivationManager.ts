import { CULTIVATION_CONSTANTS } from '../constants/gameRules.ts';
import type { InventoryManager } from './InventoryManager.ts';

const MS_PER_MINUTE = 60_000;
const BUFF_DURATION_MS = CULTIVATION_CONSTANTS.BUFF_DURATION_MINUTES * MS_PER_MINUTE;

export interface CultivationSaveState {
  thienQuyExpiresAt: number;
  thatSinhExpiresAt: number;
}

export class CultivationManager {
  private thienQuyExpiresAt = 0;
  private thatSinhExpiresAt = 0;

  /** Thiền Quy: x2 kinh nghiệm khi tu luyện. */
  isThienQuyActive(now = Date.now()): boolean {
    return now < this.thienQuyExpiresAt;
  }

  /** Thất Sinh Thất Tử Đồ: x7 tốc độ tu luyện. */
  isThatSinhActive(now = Date.now()): boolean {
    return now < this.thatSinhExpiresAt;
  }

  getExpMultiplier(now = Date.now()): number {
    return this.isThienQuyActive(now) ? CULTIVATION_CONSTANTS.THIEN_QUY_EXP_MULT : 1;
  }

  getSpeedMultiplier(now = Date.now()): number {
    if (!this.isThatSinhActive(now)) return 1;
    if (this.isThienQuyActive(now)) return CULTIVATION_CONSTANTS.COMBINED_SPEED_MULT;
    return CULTIVATION_CONSTANTS.THAT_SINH_SPEED_MULT;
  }

  getBuffRemainingMs(kind: 'thienQuy' | 'thatSinh', now = Date.now()): number {
    const expires = kind === 'thienQuy' ? this.thienQuyExpiresAt : this.thatSinhExpiresAt;
    return Math.max(0, expires - now);
  }

  formatBuffRemaining(kind: 'thienQuy' | 'thatSinh', now = Date.now()): string {
    const ms = this.getBuffRemainingMs(kind, now);
    if (ms <= 0) return '—';
    const totalSec = Math.ceil(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }

  activateThienQuy(inventory: InventoryManager, now = Date.now()): { success: boolean; message: string } {
    if (inventory.getItemQuantity(CULTIVATION_CONSTANTS.THIEN_QUY_ITEM_ID) <= 0) {
      return { success: false, message: 'Không có Thiền Quy trong túi.' };
    }
    if (!inventory.removeItem(CULTIVATION_CONSTANTS.THIEN_QUY_ITEM_ID, 1)) {
      return { success: false, message: 'Không thể sử dụng Thiền Quy.' };
    }
    const base = this.isThienQuyActive(now) ? this.thienQuyExpiresAt : now;
    this.thienQuyExpiresAt = base + BUFF_DURATION_MS;
    return { success: true, message: 'Thiền Quy kích hoạt — x2 kinh nghiệm (60 phút).' };
  }

  activateThatSinh(inventory: InventoryManager, now = Date.now()): { success: boolean; message: string } {
    if (inventory.getItemQuantity(CULTIVATION_CONSTANTS.THAT_SINH_ITEM_ID) <= 0) {
      return { success: false, message: 'Không có Thất Sinh Thất Tử Đồ trong túi.' };
    }
    if (!inventory.removeItem(CULTIVATION_CONSTANTS.THAT_SINH_ITEM_ID, 1)) {
      return { success: false, message: 'Không thể sử dụng Thất Sinh Thất Tử Đồ.' };
    }
    const base = this.isThatSinhActive(now) ? this.thatSinhExpiresAt : now;
    this.thatSinhExpiresAt = base + BUFF_DURATION_MS;
    return { success: true, message: 'Thất Sinh kích hoạt — x7 tốc độ tu luyện (60 phút).' };
  }

  exportState(): CultivationSaveState {
    return {
      thienQuyExpiresAt: this.thienQuyExpiresAt,
      thatSinhExpiresAt: this.thatSinhExpiresAt,
    };
  }

  importState(state?: CultivationSaveState): void {
    this.thienQuyExpiresAt = state?.thienQuyExpiresAt ?? 0;
    this.thatSinhExpiresAt = state?.thatSinhExpiresAt ?? 0;
  }
}
