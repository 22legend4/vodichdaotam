import {
  getLeoThapSessionKey,
  isLeoThapEventActive,
  formatLeoThapScheduleLabel,
} from '../data/leoThapData.ts';

export interface LeoThapSaveState {
  /** Các phiên (Thứ 6) đã tham gia — mỗi phiên chỉ 1 lần. */
  participatedSessions: string[];
  /** Tầng cao nhất đã vượt theo phiên (thống kê). */
  bestFloorBySession: Record<string, number>;
}

export interface LeoThapJoinResult {
  success: boolean;
  message: string;
}

export class LeoThapManager {
  private state: LeoThapSaveState = {
    participatedSessions: [],
    bestFloorBySession: {},
  };

  importState(state?: LeoThapSaveState): void {
    if (!state) return;
    this.state = {
      participatedSessions: [...(state.participatedSessions ?? [])],
      bestFloorBySession: { ...(state.bestFloorBySession ?? {}) },
    };
  }

  exportState(): LeoThapSaveState {
    return structuredClone(this.state);
  }

  getScheduleLabel(): string {
    return formatLeoThapScheduleLabel();
  }

  isEventActive(date = new Date()): boolean {
    return isLeoThapEventActive(date);
  }

  getCurrentSessionKey(date = new Date()): string {
    return getLeoThapSessionKey(date);
  }

  hasParticipatedThisSession(date = new Date()): boolean {
    const key = getLeoThapSessionKey(date);
    return this.state.participatedSessions.includes(key);
  }

  getBestFloorThisSession(date = new Date()): number {
    const key = getLeoThapSessionKey(date);
    return this.state.bestFloorBySession[key] ?? 0;
  }

  /** Ghi nhận tham gia — gọi khi bấm Tham gia. */
  markParticipated(date = new Date()): void {
    const key = getLeoThapSessionKey(date);
    if (this.state.participatedSessions.includes(key)) return;
    this.state.participatedSessions.push(key);
  }

  /** Cập nhật tầng cao nhất đã vượt trong phiên hiện tại. */
  recordFloorCleared(floor: number, date = new Date()): void {
    const key = getLeoThapSessionKey(date);
    const prev = this.state.bestFloorBySession[key] ?? 0;
    if (floor > prev) {
      this.state.bestFloorBySession[key] = floor;
    }
  }

  canJoin(date = new Date()): LeoThapJoinResult {
    if (!isLeoThapEventActive(date)) {
      return {
        success: false,
        message: `Leo Tháp chưa mở. ${formatLeoThapScheduleLabel()}.`,
      };
    }
    if (this.hasParticipatedThisSession(date)) {
      return {
        success: false,
        message: 'Bạn đã tham gia Leo Tháp tuần này. Hẹn gặp lại vào Thứ 6 tới!',
      };
    }
    return { success: true, message: 'Bắt đầu leo tháp!' };
  }
}
