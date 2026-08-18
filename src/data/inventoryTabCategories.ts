import type { ItemData } from '../types/game.ts';

/** Tab phân loại túi đồ (không gồm「Tất cả」). `weapon` = toàn bộ trang bị (vũ khí + giáp). */
export type InventoryTab = 'weapon' | 'shard' | 'medicine' | 'beast' | 'other';

export type InventoryFilter = 'all' | InventoryTab;

/** Trả về tab của vật phẩm; `null` = chỉ hiện ở「Tất cả」. */
export function getItemInventoryTab(item: ItemData): InventoryTab | null {
  if (item.bagTab) return item.bagTab;

  switch (item.type) {
    case 'medicine':
      return 'medicine';
    case 'beast':
      return 'beast';
    case 'currency':
      return 'other';
    case 'material':
      return 'shard';
    case 'equipment':
      if (item.slot === 'pet') return 'beast';
      return 'weapon';
    default:
      return 'other';
  }
}

export function matchesInventoryTab(item: ItemData, filter: InventoryFilter): boolean {
  if (filter === 'all') return true;
  const tab = getItemInventoryTab(item);
  return tab === filter;
}
