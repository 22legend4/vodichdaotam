import type { InventoryManager } from './InventoryManager.ts';
import { findGiftcode } from '../data/giftcodesData.ts';

export interface GiftcodeRedeemResult {
  success: boolean;
  message: string;
}

export class GiftcodeManager {
  private redeemedCodes = new Set<string>();

  redeem(code: string, inventory: InventoryManager): GiftcodeRedeemResult {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      return { success: false, message: 'Vui lòng nhập mã giftcode.' };
    }

    if (this.redeemedCodes.has(normalized)) {
      return { success: false, message: 'Mã này đã được sử dụng trên tài khoản.' };
    }

    const def = findGiftcode(normalized);
    if (!def) {
      return { success: false, message: 'Mã giftcode không hợp lệ.' };
    }

    if (def.rewards.tinhThach) {
      inventory.addTinhThach(def.rewards.tinhThach);
    }
    if (def.rewards.gioiThuy) {
      inventory.addGioiThuy(def.rewards.gioiThuy);
    }
    for (const item of def.rewards.items ?? []) {
      if (!inventory.addItem(item.itemId, item.quantity)) {
        return { success: false, message: 'Túi đầy — không thể nhận vật phẩm.' };
      }
    }

    this.redeemedCodes.add(normalized);
    return {
      success: true,
      message: `Nhận thưởng: ${def.description}`,
    };
  }

  exportState(): string[] {
    return [...this.redeemedCodes];
  }

  importState(codes: string[] | undefined): void {
    this.redeemedCodes = new Set(codes ?? []);
  }
}
