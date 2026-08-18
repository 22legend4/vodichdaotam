import { getTinhThachPackageById } from '../data/tinhThachShopData.ts';
import type { InventoryManager } from './InventoryManager.ts';

export type WalletTransactionStatus = 'pending' | 'completed';

export type WalletTransactionKind =
  | 'deposit'
  | 'purchase_tinh_thach'
  | 'pending_deposit'
  | 'huyet_long_tri';

export interface WalletTransaction {
  id: string;
  kind: WalletTransactionKind;
  /** Dương = cộng ví, âm = trừ ví. */
  amountVnd: number;
  createdAt: number;
  status: WalletTransactionStatus;
  note?: string;
  packageId?: string;
  tinhThachAmount?: number;
}

export interface WalletSaveState {
  balanceVnd: number;
  transactions: WalletTransaction[];
}

export interface PurchaseTinhThachResult {
  success: boolean;
  message: string;
  tinhThachGranted?: number;
}

function createTxId(): string {
  return `wtx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export class WalletManager {
  private balanceVnd = 0;
  private transactions: WalletTransaction[] = [];

  getBalanceVnd(): number {
    return this.balanceVnd;
  }

  getTransactions(): WalletTransaction[] {
    return this.transactions.map((tx) => ({ ...tx }));
  }

  /** Lịch sử nạp đã cộng vào ví. */
  getCompletedDeposits(): WalletTransaction[] {
    return this.transactions.filter(
      (tx) => tx.kind === 'deposit' && tx.status === 'completed' && tx.amountVnd > 0,
    );
  }

  getPendingDeposits(): WalletTransaction[] {
    return this.transactions.filter(
      (tx) => tx.kind === 'pending_deposit' && tx.status === 'pending',
    );
  }

  /** Người chơi báo đã chuyển khoản — chờ admin duyệt (số tiền có thể = 0 nếu chưa biết). */
  reportPendingDeposit(amountVnd: number, note?: string): WalletTransaction {
    const amount = Math.floor(amountVnd);
    if (amount < 0) {
      throw new Error('Số tiền không hợp lệ.');
    }

    const tx: WalletTransaction = {
      id: createTxId(),
      kind: 'pending_deposit',
      amountVnd: amount,
      createdAt: Date.now(),
      status: 'pending',
      note,
    };
    this.transactions.unshift(tx);
    return { ...tx };
  }

  /**
   * Admin xác nhận nạp tiền (backend gọi sau khi đối soát CK).
   * Nếu có pendingId khớp sẽ chuyển pending → completed.
   */
  approveDeposit(amountVnd: number, note?: string, pendingId?: string): WalletTransaction {
    const amount = Math.floor(amountVnd);
    if (amount <= 0) {
      throw new Error('Số tiền nạp phải lớn hơn 0.');
    }

    if (pendingId) {
      const pending = this.transactions.find((tx) => tx.id === pendingId);
      if (pending && pending.kind === 'pending_deposit' && pending.status === 'pending') {
        pending.status = 'completed';
        pending.kind = 'deposit';
        pending.amountVnd = amount;
        pending.note = note ?? pending.note;
        this.balanceVnd += amount;
        return { ...pending };
      }
    }

    const tx: WalletTransaction = {
      id: createTxId(),
      kind: 'deposit',
      amountVnd: amount,
      createdAt: Date.now(),
      status: 'completed',
      note,
    };
    this.balanceVnd += amount;
    this.transactions.unshift(tx);
    return { ...tx };
  }

  spendVnd(amountVnd: number, kind: WalletTransactionKind, meta?: Partial<WalletTransaction>): boolean {
    const amount = Math.floor(amountVnd);
    if (amount <= 0 || this.balanceVnd < amount) return false;

    this.balanceVnd -= amount;
    this.transactions.unshift({
      id: createTxId(),
      kind,
      amountVnd: -amount,
      createdAt: Date.now(),
      status: 'completed',
      ...meta,
    });
    return true;
  }

  purchaseTinhThachPackage(
    packageId: string,
    inventory: InventoryManager,
  ): PurchaseTinhThachResult {
    const pkg = getTinhThachPackageById(packageId);
    if (!pkg) {
      return { success: false, message: 'Gói không tồn tại.' };
    }
    if (this.balanceVnd < pkg.priceVnd) {
      return {
        success: false,
        message: `Không đủ số dư (cần ${pkg.priceVnd.toLocaleString('vi-VN')} đ).`,
      };
    }

    const paid = this.spendVnd(pkg.priceVnd, 'purchase_tinh_thach', {
      packageId: pkg.id,
      tinhThachAmount: pkg.tinhThachAmount,
      note: `Mua ${pkg.tinhThachAmount.toLocaleString('vi-VN')} Tinh thạch`,
    });
    if (!paid) {
      return { success: false, message: 'Không thể trừ tiền ví.' };
    }

    inventory.addTinhThach(pkg.tinhThachAmount);
    return {
      success: true,
      message: `Đã mua ${pkg.tinhThachAmount.toLocaleString('vi-VN')} Tinh thạch`,
      tinhThachGranted: pkg.tinhThachAmount,
    };
  }

  exportState(): WalletSaveState {
    return {
      balanceVnd: this.balanceVnd,
      transactions: this.transactions.map((tx) => ({ ...tx })),
    };
  }

  importState(state?: WalletSaveState): void {
    this.balanceVnd = Math.max(0, Math.floor(state?.balanceVnd ?? 0));
    this.transactions = Array.isArray(state?.transactions)
      ? state.transactions.map((tx) => ({ ...tx }))
      : [];
  }
}
