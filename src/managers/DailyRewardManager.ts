import type { InventoryManager } from './InventoryManager.ts';

export type RewardGrant =
  | { kind: 'tinhThach'; amount: number }
  | { kind: 'gioiThuy'; amount: number }
  | { kind: 'item'; itemId: string; quantity: number }
  | { kind: 'expandInventory' };

export interface DailyRewardEntry {
  day: number;
  rewards: RewardGrant[];
}

export interface DailyRewardSaveData {
  /** Ngày tiếp theo sẽ nhận (1–30). */
  nextDay: number;
  /** Ngày cuối nhận quà (YYYY-MM-DD). */
  lastClaimDate: string | null;
  /** Tổng số ngày đã nhận (thống kê). */
  totalClaims: number;
}

export interface ClaimResult {
  success: boolean;
  day: number;
  message: string;
  grants: RewardGrant[];
}

const TT = (amount: number): RewardGrant => ({ kind: 'tinhThach', amount });
const IT = (itemId: string, quantity = 1): RewardGrant => ({ kind: 'item', itemId, quantity });

export const DAILY_REWARD_MAX_DAY = 30;

/** Bảng quà đăng nhập 30 ngày — GDD Quà tặng hàng ngày. */
export const DAILY_REWARDS: DailyRewardEntry[] = [
  { day: 1, rewards: [TT(2)] },
  { day: 2, rewards: [TT(2), IT('eq_tuDienDao'), IT('eq_thanhMocThuong'), IT('eq_thanhPhongKiem'), IT('eq_hoVanTy')] },
  { day: 3, rewards: [TT(2), IT('eq_thanhMocThuong')] },
  { day: 4, rewards: [TT(2), IT('eq_thanhPhongKiem')] },
  { day: 5, rewards: [TT(2), IT('eq_hoVanTy')] },
  { day: 6, rewards: [TT(2), IT('eq_tuDienDao')] },
  { day: 7, rewards: [TT(2), IT('eq_nhaiThu'), IT('eq_thanhLinhY'), IT('eq_hanhVanNgoa')] },
  { day: 8, rewards: [TT(4), IT('eq_nhaiThu'), IT('eq_thanhLinhY'), IT('eq_hanhVanNgoa')] },
  { day: 9, rewards: [TT(6), IT('item_tichLichDan')] },
  { day: 10, rewards: [TT(4), IT('med_chuChiDuoc')] },
  { day: 11, rewards: [TT(4), IT('med_daoTienQua')] },
  { day: 12, rewards: [TT(4), IT('med_cuongSinhDan')] },
  { day: 13, rewards: [TT(4), IT('eq_phaNhuocDao'), IT('eq_thietLangThuong'), IT('eq_mocLinhKiem'), IT('eq_thietChanTac')] },
  { day: 14, rewards: [TT(4), IT('eq_thanhMocQuan'), IT('eq_bichMocKhai'), IT('eq_thietCuongKhang')] },
  { day: 15, rewards: [TT(4), IT('med_boDeQua')] },
  { day: 16, rewards: [TT(4), IT('med_diepKhongQua')] },
  { day: 17, rewards: [TT(4), IT('mat_coChanThiet', 10)] },
  { day: 18, rewards: [TT(10), IT('eq_coChanKhi')] },
  { day: 19, rewards: [TT(4), IT('med_hoiNguyenHuyet')] },
  { day: 20, rewards: [TT(4), IT('med_tieuNguyenDan')] },
  { day: 21, rewards: [TT(4), IT('med_daiNguyenDan')] },
  { day: 22, rewards: [TT(4), IT('med_phucNguyenDan')] },
  { day: 23, rewards: [TT(4), IT('med_daPhucNguyen')] },
  { day: 24, rewards: [TT(4), IT('med_ngoDongHoangThao')] },
  { day: 25, rewards: [TT(4), IT('med_ngoDongThao')] },
  { day: 26, rewards: [TT(4), IT('med_huyetLinhDan')] },
  { day: 27, rewards: [TT(4), IT('med_gioiThuy')] },
  { day: 28, rewards: [TT(4), IT('med_nghenhXuanThao')] },
  { day: 29, rewards: [TT(4), IT('med_haiHoangThao')] },
  { day: 30, rewards: [TT(4), IT('eq_phongThanKhi')] },
];

export class DailyRewardManager {
  private state: DailyRewardSaveData = {
    nextDay: 1,
    lastClaimDate: null,
    totalClaims: 0,
  };

  getState(): DailyRewardSaveData {
    return { ...this.state };
  }

  getTodayKey(date = new Date()): string {
    return date.toISOString().slice(0, 10);
  }

  canClaimToday(date = new Date()): boolean {
    return this.state.lastClaimDate !== this.getTodayKey(date);
  }

  getNextRewardDay(): number {
    return this.state.nextDay;
  }

  getRewardForDay(day: number): DailyRewardEntry | undefined {
    return DAILY_REWARDS.find((r) => r.day === day);
  }

  getAllRewards(): DailyRewardEntry[] {
    return DAILY_REWARDS;
  }

  /** Ngày đã nhận trong chu kỳ hiện tại (theo nextDay). */
  isDayClaimed(day: number): boolean {
    return day < this.state.nextDay;
  }

  canClaimDay(day: number, date = new Date()): boolean {
    return day === this.state.nextDay && this.canClaimToday(date);
  }

  claimDay(day: number, inventory: InventoryManager, date = new Date()): ClaimResult {
    if (!this.canClaimDay(day, date)) {
      if (this.state.lastClaimDate === this.getTodayKey(date)) {
        return { success: false, day, message: 'Hôm nay đã nhận quà.', grants: [] };
      }
      if (day < this.state.nextDay) {
        return { success: false, day, message: 'Quà ngày này đã nhận.', grants: [] };
      }
      return { success: false, day, message: 'Chưa tới ngày nhận quà này.', grants: [] };
    }

    const entry = this.getRewardForDay(day);
    if (!entry) {
      return { success: false, day, message: 'Không có quà cho ngày này.', grants: [] };
    }

    for (const grant of entry.rewards) {
      this.applyGrant(grant, inventory);
    }

    this.state.lastClaimDate = this.getTodayKey(date);
    this.state.totalClaims += 1;
    this.state.nextDay = this.state.nextDay >= DAILY_REWARD_MAX_DAY ? 1 : this.state.nextDay + 1;

    return {
      success: true,
      day: entry.day,
      message: `Nhận quà ngày ${entry.day}`,
      grants: entry.rewards,
    };
  }

  private applyGrant(grant: RewardGrant, inventory: InventoryManager): void {
    switch (grant.kind) {
      case 'tinhThach':
        inventory.addTinhThach(grant.amount);
        break;
      case 'gioiThuy':
        inventory.addGioiThuy(grant.amount);
        break;
      case 'item':
        inventory.addItem(grant.itemId, grant.quantity);
        break;
      case 'expandInventory':
        inventory.addItem('item_nhanKhongGian', 1);
        break;
    }
  }

  exportState(): DailyRewardSaveData {
    return { ...this.state };
  }

  importState(state?: DailyRewardSaveData): void {
    if (!state) {
      this.state = { nextDay: 1, lastClaimDate: null, totalClaims: 0 };
      return;
    }
    this.state = {
      nextDay: Math.min(DAILY_REWARD_MAX_DAY, Math.max(1, state.nextDay ?? 1)),
      lastClaimDate: state.lastClaimDate ?? null,
      totalClaims: Math.max(0, state.totalClaims ?? 0),
    };
  }
}
