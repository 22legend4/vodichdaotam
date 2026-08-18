import { SAVE_STORAGE_KEY } from '../managers/SaveManager.ts';

export const GUEST_SESSION_KEY = 'vodichdaotam_guest';

export interface GuestSession {
  guestAccountId: string;
  playerDisplayId: number;
  createdAt: number;
}

function randomGuestAccountId(): string {
  const part = () => Math.random().toString(36).slice(2, 10);
  return `guest_${part()}${part()}`.slice(0, 24);
}

export function loadGuestSession(): GuestSession | null {
  try {
    const raw = localStorage.getItem(GUEST_SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as GuestSession;
    if (!data?.guestAccountId || !data.playerDisplayId) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveGuestSession(session: GuestSession): void {
  localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
}

/** Tạo hoặc lấy phiên khách — ID ngẫu nhiên lưu localStorage. */
export function ensureGuestSession(createDisplayId: () => number): GuestSession {
  const existing = loadGuestSession();
  if (existing) return existing;

  const session: GuestSession = {
    guestAccountId: randomGuestAccountId(),
    playerDisplayId: createDisplayId(),
    createdAt: Date.now(),
  };
  saveGuestSession(session);
  return session;
}

/** Xóa toàn bộ dữ liệu local (save, guest, daily reward, used IDs). */
export function clearAllGameLocalData(): void {
  localStorage.removeItem(SAVE_STORAGE_KEY);
  localStorage.removeItem(GUEST_SESSION_KEY);
  localStorage.removeItem('vodichdaotam_daily_reward');
  localStorage.removeItem('vodichdaotam_used_display_ids');
}
