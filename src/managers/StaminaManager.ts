import { STAMINA_CONSTANTS } from '../constants/gameRules.ts';

export const STAMINA_PURCHASE_COST = 5;
export const STAMINA_PURCHASE_AMOUNT = 5;
const MS_PER_MINUTE = 60_000;

export class StaminaManager {
  private currentStamina: number = STAMINA_CONSTANTS.MAX_STAMINA;
  private lastUpdatedAt = Date.now();

  constructor(initialStamina?: number, lastUpdatedAt?: number) {
    if (initialStamina !== undefined) {
      this.currentStamina = Math.min(STAMINA_CONSTANTS.MAX_STAMINA, Math.max(0, initialStamina));
    }
    if (lastUpdatedAt !== undefined) {
      this.lastUpdatedAt = lastUpdatedAt;
    }
    this.tick();
  }

  getCurrentStamina(): number {
    this.tick();
    return this.currentStamina;
  }

  getMaxStamina(): number {
    return STAMINA_CONSTANTS.MAX_STAMINA;
  }

  getLastUpdatedAt(): number {
    return this.lastUpdatedAt;
  }

  /** Tính phục hồi theo timestamp (online & offline). */
  tick(now = Date.now()): number {
    const elapsedMs = Math.max(0, now - this.lastUpdatedAt);
    const restoredPoints = Math.floor(
      elapsedMs / MS_PER_MINUTE / STAMINA_CONSTANTS.RESTORE_RATE_PER_MINUTE,
    );

    if (restoredPoints > 0) {
      this.currentStamina = Math.min(
        STAMINA_CONSTANTS.MAX_STAMINA,
        this.currentStamina + restoredPoints,
      );
      this.lastUpdatedAt += restoredPoints * STAMINA_CONSTANTS.RESTORE_RATE_PER_MINUTE * MS_PER_MINUTE;
    }

    return this.currentStamina;
  }

  canEnterStage(staminaCost: number): boolean {
    this.tick();
    return this.currentStamina >= staminaCost;
  }

  /** Tiêu hao thể lực khi vào cửa ải (trừ ngay khi vào, không phụ thuộc thắng/thua). */
  consumeForStage(staminaCost: number): boolean {
    return this.consume(staminaCost);
  }

  consume(amount: number): boolean {
    this.tick();
    if (amount <= 0 || this.currentStamina < amount) return false;
    this.currentStamina -= amount;
    this.lastUpdatedAt = Date.now();
    return true;
  }

  /** Hồi 100% thể lực khi đột phá cảnh giới. */
  restoreFullOnRealmUpgrade(): void {
    this.currentStamina = STAMINA_CONSTANTS.MAX_STAMINA;
    this.lastUpdatedAt = Date.now();
  }

  /** Hồi thêm thể lực (vật phẩm Hồi thể…). */
  addStamina(amount: number): boolean {
    if (amount <= 0) return false;
    this.tick();
    this.currentStamina = Math.min(STAMINA_CONSTANTS.MAX_STAMINA, this.currentStamina + amount);
    this.lastUpdatedAt = Date.now();
    return true;
  }

  /** Mua thể lực: 5 Tinh thạch = 5 thể lực. */
  buyStamina(spendTinhThach: (amount: number) => boolean): boolean {
    this.tick();

    if (!spendTinhThach(STAMINA_PURCHASE_COST)) {
      return false;
    }

    this.currentStamina = Math.min(
      STAMINA_CONSTANTS.MAX_STAMINA,
      this.currentStamina + STAMINA_PURCHASE_AMOUNT,
    );
    this.lastUpdatedAt = Date.now();
    return true;
  }

  exportState(): { currentStamina: number; lastUpdatedAt: number } {
    this.tick();
    return {
      currentStamina: this.currentStamina,
      lastUpdatedAt: this.lastUpdatedAt,
    };
  }

  importState(state: { currentStamina: number; lastUpdatedAt: number }): void {
    this.currentStamina = Math.min(
      STAMINA_CONSTANTS.MAX_STAMINA,
      Math.max(0, state.currentStamina),
    );
    this.lastUpdatedAt = state.lastUpdatedAt;
    this.tick();
  }
}
