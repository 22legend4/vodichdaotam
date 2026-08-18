import type { BaseStats, CharacterData, EquipmentSlot, ItemData } from '../types/game.ts';
import { getItemById } from '../data/itemsData.ts';

export const SPATIAL_RING_ITEM_ID = 'item_nhanKhongGian';
export const DEFAULT_INVENTORY_CAPACITY = 27;
export const EXPANDED_INVENTORY_CAPACITY = 54;

export interface InventorySlot {
  itemId: string;
  quantity: number;
}

export type MedicineTarget = 'single' | 'team';

export type MedicineEffect =
  | { kind: 'healHp'; amount: number; target: MedicineTarget }
  | { kind: 'healHpPercent'; percent: number; target: MedicineTarget }
  | { kind: 'restoreQi'; amount: number; target: MedicineTarget }
  | { kind: 'restoreQiFull'; target: MedicineTarget }
  | { kind: 'restoreQiPercent'; percent: number; target: MedicineTarget }
  | { kind: 'grantExp'; amount: number; target: 'single' }
  /** Vật phẩm ném — sát thương cố định theo công thức đánh thường. */
  | { kind: 'attackFixed'; atk: number; target: 'enemy' }
  | { kind: 'attackFixedMulti'; atk: number; hitCount: number; target: 'enemy' }
  | { kind: 'buffDef'; amount: number; target: 'single' }
  | { kind: 'sacrificeHpForSkillAtk'; hpLossPercent: number; skillAtkMultiplier: number; target: 'single' }
  | { kind: 'mutualHpLoss'; amount: number; target: 'enemy' };

/** Dược chỉ dùng trong trận — không dùng từ túi đồ hub. */
export const BATTLE_ONLY_MEDICINE_IDS = new Set([
  'med_chuChiDuoc',
  'med_cuongSinhDan',
  'med_gioiThuy',
  'med_hoiNguyenHuyet',
  'med_tieuNguyenDan',
  'med_daiNguyenDan',
  'med_phucNguyenDan',
  'med_daPhucNguyen',
  'med_daoTienQua',
  'med_daoTienMoc',
  'med_ngoDongHoangThao',
  'med_ngoDongThao',
  'med_huyetLinhDan',
  'med_huyetKhoiChu',
]);

/**
 * Hiệu ứng dược phẩm theo GDD.
 * HP/Qi ở đây là giá trị thực tế (actual HP / Qi), không phải chỉ số stat.
 */
export const MEDICINE_EFFECTS: Record<string, MedicineEffect> = {
  med_chuChiDuoc: { kind: 'healHp', amount: 30, target: 'single' },
  med_cuongSinhDan: { kind: 'healHp', amount: 300, target: 'single' },
  med_gioiThuy: { kind: 'healHpPercent', percent: 0.2, target: 'team' },
  med_nghenhXuanThao: { kind: 'grantExp', amount: 600, target: 'single' },
  med_hoiNguyenHuyet: { kind: 'healHp', amount: 100, target: 'single' },
  med_tieuNguyenDan: { kind: 'restoreQi', amount: 50, target: 'single' },
  med_daiNguyenDan: { kind: 'restoreQi', amount: 150, target: 'single' },
  med_phucNguyenDan: { kind: 'restoreQiFull', target: 'single' },
  med_daPhucNguyen: { kind: 'restoreQiPercent', percent: 0.4, target: 'team' },
  med_daoTienQua: { kind: 'healHp', amount: 100, target: 'team' },
  med_daoTienMoc: { kind: 'restoreQiFull', target: 'single' },
  med_boDeQua: { kind: 'grantExp', amount: 300, target: 'single' },
  med_diepKhongQua: { kind: 'grantExp', amount: 400, target: 'single' },
  med_duHaQua: { kind: 'grantExp', amount: 500, target: 'single' },
  med_nghanhXuanThao: { kind: 'grantExp', amount: 600, target: 'single' },
  med_haiHoangThao: { kind: 'grantExp', amount: 700, target: 'single' },
  med_hacBachSongHoa: { kind: 'grantExp', amount: 800, target: 'single' },
  med_hacLienVanNam: { kind: 'grantExp', amount: 10_000, target: 'single' },
  med_hoaCoQua: { kind: 'grantExp', amount: 900, target: 'single' },
  med_hoaLienThao: { kind: 'grantExp', amount: 1000, target: 'single' },
  item_tichLichDan: { kind: 'attackFixed', atk: 70, target: 'enemy' },
  item_loiHoaChau: { kind: 'attackFixed', atk: 90, target: 'enemy' },
  item_nhatTienXuyenTam: { kind: 'attackFixed', atk: 30, target: 'enemy' },
  item_nhatTienSongDieu: { kind: 'attackFixedMulti', atk: 30, hitCount: 2, target: 'enemy' },
  item_nhiPhao: { kind: 'attackFixedMulti', atk: 90, hitCount: 2, target: 'enemy' },
  item_mocKhien: { kind: 'buffDef', amount: 200, target: 'single' },
  item_cuThachKhien: { kind: 'buffDef', amount: 400, target: 'single' },
  med_huyetKhoiChu: { kind: 'sacrificeHpForSkillAtk', hpLossPercent: 0.7, skillAtkMultiplier: 4, target: 'single' },
  item_thuongHaiTangDien: { kind: 'mutualHpLoss', amount: 200, target: 'enemy' },
};

/** Vật phẩm có thể dùng trong trận (dược + đạn/châu tấn công). */
export function isBattleUsableItem(itemId: string): boolean {
  return itemId in MEDICINE_EFFECTS;
}

/** Vật phẩm tác dụng lên cả đội — không cần chọn mục tiêu trong trận. */
export function isBattleTeamItem(itemId: string): boolean {
  const effect = MEDICINE_EFFECTS[itemId];
  return Boolean(effect && 'target' in effect && effect.target === 'team');
}

/** Phe hợp lệ khi chọn mục tiêu dùng vật phẩm trong trận. null = không cần chọn (toàn đội). */
export function getBattleItemTargetSide(itemId: string): 'ally' | 'enemy' | null {
  const effect = MEDICINE_EFFECTS[itemId];
  if (!effect) return null;
  if (effect.kind === 'attackFixed' || effect.kind === 'attackFixedMulti' || effect.kind === 'mutualHpLoss') {
    return 'enemy';
  }
  if ('target' in effect && effect.target === 'team') {
    return null;
  }
  return 'ally';
}

/** Số mục tiêu cần chọn thủ công (0 = tự dùng toàn đội). */
export function getBattleItemTargetCount(itemId: string): number {
  const effect = MEDICINE_EFFECTS[itemId];
  if (!effect) return 0;
  if ('target' in effect && effect.target === 'team') return 0;
  if (effect.kind === 'attackFixedMulti') return effect.hitCount;
  return 1;
}

/** Vật phẩm đã bỏ — không còn trong túi (Chuyển sinh chỉ tại Cổng dịch chuyển). */
const REMOVED_INVENTORY_ITEM_IDS = new Set(['item_chuyenSinhDan', 'med_chuyenSinhDan']);

export interface UseMedicineResult {
  success: boolean;
  message: string;
  expGranted?: number;
}

export interface CharacterManagerLike {
  getCharacter(id: string): CharacterData | undefined;
  getParty(): CharacterData[];
  healCharacter(characterId: string, hpAmount: number): boolean;
  healCharacterFull(characterId: string): boolean;
  healParty(hpAmount: number): void;
  healPartyFull(): void;
  restoreQi(characterId: string, qiAmount: number): boolean;
  restoreQiFull(characterId: string): boolean;
  restoreQiPercent(characterId: string, percent: number): boolean;
  addExp(characterId: string, amount: number): void;
  syncCharacterVitals(
    characterId: string,
    getItemById: (id: string) => ItemData | undefined,
  ): CharacterData | null;
  reincarnate(characterId: string): { success: boolean; message: string };
  resetSkills(characterId: string): { success: boolean; message: string };
}

export class InventoryManager {
  /** Lưới cố định — mỗi index = 1 ô túi đồ. */
  private grid: Array<InventorySlot | null> = [];
  private capacity = DEFAULT_INVENTORY_CAPACITY;
  private tinhThach = 0;
  private gioiThuy = 0;

  private ensureGridSize(): void {
    while (this.grid.length < this.capacity) {
      this.grid.push(null);
    }
    if (this.grid.length > this.capacity) {
      this.grid.length = this.capacity;
    }
  }

  private countOccupied(): number {
    return this.grid.filter((slot) => slot !== null).length;
  }

  private findEmptyIndex(): number {
    return this.grid.findIndex((slot) => slot === null);
  }

  private hasRoomForNewStack(itemId: string): boolean {
    if (this.findSlotIndex(itemId) >= 0) return true;
    return this.findEmptyIndex() >= 0;
  }

  getCapacity(): number {
    return this.capacity;
  }

  getUsedSlots(): number {
    return this.countOccupied();
  }

  getTinhThach(): number {
    return this.tinhThach;
  }

  getGioiThuy(): number {
    return this.gioiThuy;
  }

  /** Danh sách gọn (không null) — dùng trong trận đấu / shop. */
  getSlots(): InventorySlot[] {
    return this.grid
      .filter((slot): slot is InventorySlot => slot !== null)
      .map((slot) => ({ ...slot }));
  }

  /** Lưới đầy đủ theo vị trí ô — dùng UI túi đồ. */
  getGridSlots(): Array<InventorySlot | null> {
    this.ensureGridSize();
    return this.grid.map((slot) => (slot ? { ...slot } : null));
  }

  getGridSlot(index: number): InventorySlot | null {
    this.ensureGridSize();
    const slot = this.grid[index];
    return slot ? { ...slot } : null;
  }

  isExpanded(): boolean {
    return this.capacity >= EXPANDED_INVENTORY_CAPACITY;
  }

  /** Hoán đổi hoặc di chuyển vật phẩm giữa hai ô. */
  swapGridSlots(fromIndex: number, toIndex: number): boolean {
    this.ensureGridSize();
    if (fromIndex === toIndex) return false;
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= this.capacity || toIndex >= this.capacity) {
      return false;
    }

    const fromSlot = this.grid[fromIndex];
    if (!fromSlot) return false;

    const toSlot = this.grid[toIndex];
    this.grid[fromIndex] = toSlot;
    this.grid[toIndex] = fromSlot;
    return true;
  }

  /** Tiêu hao Nhẫn không gian để mở rộng túi 27 → 54 ngăn. */
  useSpatialRing(): { success: boolean; message: string } {
    if (this.capacity >= EXPANDED_INVENTORY_CAPACITY) {
      return { success: false, message: 'Túi đồ đã được mở rộng tối đa (54 ngăn).' };
    }
    if (this.getItemQuantity(SPATIAL_RING_ITEM_ID) <= 0) {
      return { success: false, message: 'Cần vật phẩm Nhẫn không gian.' };
    }
    if (!this.removeItem(SPATIAL_RING_ITEM_ID, 1)) {
      return { success: false, message: 'Không thể sử dụng Nhẫn không gian.' };
    }
    this.capacity = EXPANDED_INVENTORY_CAPACITY;
    this.ensureGridSize();
    return { success: true, message: 'Túi đồ mở rộng lên 54 ngăn!' };
  }

  /** @deprecated Dùng useSpatialRing() — giữ để tương thích phần thưởng cũ. */
  expandCapacity(): boolean {
    if (this.capacity >= EXPANDED_INVENTORY_CAPACITY) return false;
    if (this.getItemQuantity(SPATIAL_RING_ITEM_ID) > 0) {
      return this.useSpatialRing().success;
    }
    this.capacity = EXPANDED_INVENTORY_CAPACITY;
    this.ensureGridSize();
    return true;
  }

  addTinhThach(amount: number): void {
    if (amount > 0) this.tinhThach += amount;
  }

  spendTinhThach(amount: number): boolean {
    if (amount <= 0 || this.tinhThach < amount) return false;
    this.tinhThach -= amount;
    return true;
  }

  addGioiThuy(amount: number): void {
    if (amount > 0) this.gioiThuy += amount;
  }

  spendGioiThuy(amount: number): boolean {
    if (amount <= 0 || this.gioiThuy < amount) return false;
    this.gioiThuy -= amount;
    return true;
  }

  findSlotIndex(itemId: string): number {
    return this.grid.findIndex((slot) => slot?.itemId === itemId);
  }

  getItemQuantity(itemId: string): number {
    const slot = this.grid.find((s) => s?.itemId === itemId);
    return slot?.quantity ?? 0;
  }

  /** Còn chỗ nhận thêm vật phẩm (cùng loại có thể cộng dồn số lượng). */
  hasSpaceForItem(itemId: string): boolean {
    this.ensureGridSize();
    if (this.findSlotIndex(itemId) >= 0) return true;
    return this.findEmptyIndex() >= 0;
  }

  /** Rèn trang bị theo công thức Luyện Khí — tiêu hao nguyên liệu, nhận 1 trang bị. */
  craftItem(recipe: { resultItemId: string; materials: { itemId: string; quantity: number }[] }): {
    success: boolean;
    message: string;
  } {
    const result = getItemById(recipe.resultItemId);
    if (!result) {
      return { success: false, message: 'Trang bị không tồn tại.' };
    }

    for (const mat of recipe.materials) {
      if (this.getItemQuantity(mat.itemId) < mat.quantity) {
        const name = getItemById(mat.itemId)?.name ?? mat.itemId;
        return { success: false, message: `Thiếu nguyên liệu: ${name}.` };
      }
    }

    if (!this.hasSpaceForItem(recipe.resultItemId)) {
      return { success: false, message: 'Túi đầy — không thể nhận trang bị.' };
    }

    for (const mat of recipe.materials) {
      if (!this.removeItem(mat.itemId, mat.quantity)) {
        return { success: false, message: 'Không thể tiêu hao nguyên liệu.' };
      }
    }

    if (!this.addItem(recipe.resultItemId, 1)) {
      for (const mat of recipe.materials) {
        this.addItem(mat.itemId, mat.quantity);
      }
      return { success: false, message: 'Túi đầy.' };
    }

    return { success: true, message: `Rèn thành công: ${result.name}!` };
  }

  addItem(itemId: string, quantity = 1): boolean {
    if (quantity <= 0) return false;

    const item = getItemById(itemId);
    if (!item) return false;

    this.ensureGridSize();

    const existingIndex = this.findSlotIndex(itemId);
    if (existingIndex >= 0) {
      this.grid[existingIndex]!.quantity += quantity;
      return true;
    }

    const emptyIndex = this.findEmptyIndex();
    if (emptyIndex < 0) return false;

    this.grid[emptyIndex] = { itemId, quantity };
    return true;
  }

  removeItem(itemId: string, quantity = 1): boolean {
    if (quantity <= 0) return false;

    const index = this.findSlotIndex(itemId);
    if (index < 0) return false;

    const slot = this.grid[index]!;
    if (slot.quantity < quantity) return false;

    slot.quantity -= quantity;
    if (slot.quantity === 0) {
      this.grid[index] = null;
    }

    return true;
  }

  /** Xóa toàn bộ stack tại một ô lưới (theo chỉ số ô). */
  removeGridSlotStack(index: number): boolean {
    this.ensureGridSize();
    if (index < 0 || index >= this.capacity) return false;
    if (!this.grid[index]) return false;
    this.grid[index] = null;
    return true;
  }

  getEquippedStats(character: CharacterData): BaseStats {
    const stats: BaseStats = { hp: 0, atk: 0, def: 0, qi: 0 };

    for (const itemId of Object.values(character.equipment)) {
      if (!itemId) continue;
      const item = getItemById(itemId);
      if (!item) continue;
      stats.hp += item.hp;
      stats.atk += item.atk;
      stats.def += item.def;
      stats.qi += item.qi;
    }

    return stats;
  }

  equipItem(character: CharacterData, itemId: string): boolean {
    const item = getItemById(itemId);
    if (!item || item.type !== 'equipment' && item.type !== 'beast') return false;
    if (!item.slot) return false;
    if (this.getItemQuantity(itemId) <= 0) return false;

    if (item.slot === 'weapon' && item.weaponType && item.weaponType !== character.weaponType) {
      return false;
    }

    const slot = item.slot as EquipmentSlot;
    const previousItemId = character.equipment[slot];

    if (!this.removeItem(itemId, 1)) return false;

    if (previousItemId) {
      this.addItem(previousItemId, 1);
    }

    character.equipment[slot] = itemId;
    return true;
  }

  unequipItem(character: CharacterData, slot: EquipmentSlot): boolean {
    const itemId = character.equipment[slot];
    if (!itemId) return false;
    if (!this.hasRoomForNewStack(itemId)) {
      return false;
    }

    if (!this.addItem(itemId, 1)) return false;
    character.equipment[slot] = null;
    return true;
  }

  /** Giới Thủy: hồi 100% HP toàn đội, tiêu hao 1 Giới Thủy. */
  useGioiThuyTeamHeal(characterManager: CharacterManagerLike): boolean {
    if (!this.spendGioiThuy(1)) return false;
    characterManager.healPartyFull();
    return true;
  }

  useMedicine(
    itemId: string,
    characterManager: CharacterManagerLike,
    targetCharacterId?: string,
  ): UseMedicineResult {
    const item = getItemById(itemId);
    if (!item || item.type !== 'medicine') {
      return { success: false, message: 'Vật phẩm không phải dược phẩm.' };
    }

    if (this.getItemQuantity(itemId) <= 0) {
      return { success: false, message: 'Không có dược phẩm trong túi.' };
    }

    if (itemId === 'item_thienQuy') {
      return { success: false, message: 'Thiền Quy — dùng tại giao diện Tu Luyện.' };
    }

    if (BATTLE_ONLY_MEDICINE_IDS.has(itemId)) {
      return { success: false, message: 'Chỉ dùng được trong trận chiến.' };
    }

    const effect = MEDICINE_EFFECTS[itemId];
    if (!effect) {
      return { success: false, message: 'Dược phẩm chưa được cấu hình hiệu ứng.' };
    }

    if (effect.target === 'single') {
      if (!targetCharacterId) {
        return { success: false, message: 'Cần chọn nhân vật mục tiêu.' };
      }
      const target = characterManager.getCharacter(targetCharacterId);
      if (!target) {
        return { success: false, message: 'Không tìm thấy nhân vật mục tiêu.' };
      }
    }

    if (!this.removeItem(itemId, 1)) {
      return { success: false, message: 'Không thể tiêu hao dược phẩm.' };
    }

    switch (effect.kind) {
      case 'healHp':
        if (effect.target === 'team') {
          characterManager.healParty(effect.amount);
          return { success: true, message: `Toàn đội hồi ${effect.amount} HP.` };
        }
        characterManager.healCharacter(targetCharacterId!, effect.amount);
        return { success: true, message: `Hồi ${effect.amount} HP.` };

      case 'healHpPercent':
        if (effect.target === 'team') {
          for (const member of characterManager.getParty()) {
            const healAmount = Math.floor(member.maxHp * effect.percent);
            characterManager.healCharacter(member.id, healAmount);
          }
          return { success: true, message: `Toàn đội hồi ${effect.percent * 100}% HP.` };
        }
        {
          const member = characterManager.getCharacter(targetCharacterId!)!;
          const healAmount = Math.floor(member.maxHp * effect.percent);
          characterManager.healCharacter(targetCharacterId!, healAmount);
          return { success: true, message: `Hồi ${effect.percent * 100}% HP.` };
        }

      case 'restoreQi':
        if (effect.target === 'team') {
          for (const member of characterManager.getParty()) {
            characterManager.restoreQi(member.id, effect.amount);
          }
          return { success: true, message: `Toàn đội hồi ${effect.amount} Qi.` };
        }
        characterManager.restoreQi(targetCharacterId!, effect.amount);
        return { success: true, message: `Hồi ${effect.amount} Qi.` };

      case 'restoreQiFull':
        if (effect.target === 'team') {
          for (const member of characterManager.getParty()) {
            characterManager.restoreQiFull(member.id);
          }
          return { success: true, message: 'Toàn đội hồi đầy nguyên khí.' };
        }
        characterManager.restoreQiFull(targetCharacterId!);
        return { success: true, message: 'Hồi đầy nguyên khí.' };

      case 'restoreQiPercent':
        if (effect.target === 'team') {
          for (const member of characterManager.getParty()) {
            characterManager.restoreQiPercent(member.id, effect.percent);
          }
          return { success: true, message: `Toàn đội hồi ${effect.percent * 100}% nguyên khí tối đa.` };
        }
        characterManager.restoreQiPercent(targetCharacterId!, effect.percent);
        return { success: true, message: `Hồi ${effect.percent * 100}% nguyên khí tối đa.` };

      case 'grantExp':
        characterManager.addExp(targetCharacterId!, effect.amount);
        return {
          success: true,
          message: `Nhận ${effect.amount} EXP.`,
          expGranted: effect.amount,
        };

      default:
        this.addItem(itemId, 1);
        return { success: false, message: 'Hiệu ứng dược phẩm không hợp lệ.' };
    }
  }

  exportState(): {
    grid: Array<InventorySlot | null>;
    slots: InventorySlot[];
    capacity: number;
    tinhThach: number;
    gioiThuy: number;
  } {
    this.ensureGridSize();
    return {
      grid: this.grid.map((s) => (s ? { ...s } : null)),
      slots: this.getSlots(),
      capacity: this.capacity,
      tinhThach: this.tinhThach,
      gioiThuy: this.gioiThuy,
    };
  }

  importState(state: {
    grid?: Array<InventorySlot | null>;
    slots: InventorySlot[];
    capacity: number;
    tinhThach: number;
    gioiThuy: number;
  }): void {
    this.capacity = InventoryManager.normalizeCapacity(state.capacity);
    this.tinhThach = state.tinhThach;
    this.gioiThuy = state.gioiThuy;
    this.grid = Array(this.capacity).fill(null);

    if (state.grid && state.grid.length > 0) {
      state.grid.forEach((slot, i) => {
        if (i < this.capacity && slot) {
          const migrated = InventoryManager.migrateItemSlot(slot);
          if (migrated) this.grid[i] = migrated;
        }
      });
    } else {
      state.slots.forEach((slot, i) => {
        if (i < this.capacity) {
          const migrated = InventoryManager.migrateItemSlot(slot);
          if (migrated) this.grid[i] = migrated;
        }
      });
    }

    this.ensureGridSize();
  }

  /** Migrate save cũ (24/48 ngăn) sang 27/54. */
  static normalizeCapacity(cap: number): number {
    if (cap >= 48 || cap >= EXPANDED_INVENTORY_CAPACITY) return EXPANDED_INVENTORY_CAPACITY;
    return DEFAULT_INVENTORY_CAPACITY;
  }

  private static migrateItemSlot(slot: InventorySlot): InventorySlot | null {
    let itemId = slot.itemId;
    if (REMOVED_INVENTORY_ITEM_IDS.has(itemId)) return null;
    if (itemId === 'med_hoiNguyenDan') itemId = 'med_hoiNguyenHuyet';
    if (itemId === 'med_nghanhXuanThao') itemId = 'med_nghenhXuanThao';
    return itemId === slot.itemId ? { ...slot } : { ...slot, itemId };
  }
}
