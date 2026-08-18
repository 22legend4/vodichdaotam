import type { ItemData } from '../types/game.ts';

/** Loại trang bị hiển thị cho người chơi (cột「Loại」). */
export function formatEquipmentTypeLabel(item: ItemData): string {
  if (item.type !== 'equipment') return '';

  switch (item.slot) {
    case 'head':
      return 'Giáp đầu';
    case 'body':
      return 'Giáp thân';
    case 'feet':
      return 'Giáp chân';
    case 'weapon':
      if (!item.weaponType) return 'Đa năng';
      switch (item.weaponType) {
        case 'dao':
          return 'Đao';
        case 'thuong':
          return 'Thương';
        case 'kiem':
          return 'Kiếm';
        case 'quyen':
          return 'Găng tay';
        default:
          return 'Đa năng';
      }
    default:
      return '';
  }
}

/** Cột「công dụng」— chỉ số hiển thị cho người chơi (vd: 88 thủ, 190 công). */
export function formatEquipmentEffect(
  item: Pick<ItemData, 'atk' | 'def' | 'hp' | 'qi'>,
): string {
  const parts: string[] = [];
  if (item.atk > 0) parts.push(`${item.atk} công`);
  if (item.def > 0) parts.push(`${item.def} thủ`);
  if (item.hp > 0) parts.push(`${item.hp} chỉ số máu`);
  if (item.qi > 0) parts.push(`${item.qi} nguyên khí`);
  return parts.join(', ');
}

/** Mô tả hiển thị — trang bị dùng công dụng; yêu thú ưu tiên mô tả trang bị (không dùng chỉ số NPC). */
export function formatItemDisplayDescription(item: ItemData): string {
  if (item.type === 'equipment') {
    return formatEquipmentEffect(item) || item.description?.trim() || 'Không có mô tả.';
  }
  if (item.type === 'beast') {
    const desc = item.description?.trim();
    if (desc) return desc;
    const stats = formatEquipmentEffect(item);
    if (stats) return stats;
  }
  return item.description?.trim() || 'Không có mô tả.';
}
