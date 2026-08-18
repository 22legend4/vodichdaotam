/** Sự kiện hiển thị trong màn Sự Kiện (quà hàng ngày mở từ sảnh chính). */
export type HubEventId = 'bloody_arena' | 'hoa_son_luan_vo' | 'leo_thap';

export interface HubEventDefinition {
  id: HubEventId;
  name: string;
  tagline: string;
  description: string;
  schedule: string;
  rewards: string;
}

import { formatLeoThapScheduleLabel } from './leoThapData.ts';

/** Sự kiện PvP online — tạm khóa đến khi có server VPS. */
export const LOCKED_HUB_EVENT_IDS: ReadonlySet<HubEventId> = new Set([
  'bloody_arena',
  'hoa_son_luan_vo',
]);

export function isHubEventLocked(id: HubEventId): boolean {
  return LOCKED_HUB_EVENT_IDS.has(id);
}

export const HUB_EVENTS: HubEventDefinition[] = [
  {
    id: 'leo_thap',
    name: 'Leo Tháp',
    tagline: 'Leo tháp 36 tầng — thưởng tầng cao nhất',
    description:
      'Sự kiện dành cho mọi người chơi, không cần đăng ký trước. Đúng giờ mở cửa, ấn Tham gia để đánh NPC và vượt ải. '
      + 'Mỗi lần tổ chức, mỗi người chỉ được tham gia một lần; tuần sau có thể tham gia lại. '
      + 'Khi thua hoặc hoàn thành, chỉ nhận phần thưởng của tầng cao nhất đã vượt (không cộng dồn các tầng trước).',
    schedule: formatLeoThapScheduleLabel(),
    rewards:
      'Tầng 1–10: 5–50 Tinh thạch (mỗi tầng +5)\n'
      + 'Tầng 11: 5 Thiền Quy · 12: 5 Hóa Liên Thảo · 13: Hắc Liên vạn năm\n'
      + 'Tầng 14–15: Cổ Chân Khí, Phong Thần Khí\n'
      + 'Tầng 16–32: yêu thú (Hắc Miêu → Hỏa Kỳ Lân)\n'
      + 'Tầng 33: chọn 1 vũ khí kim cương (Đao / Thương / Kiếm / Táo)\n'
      + 'Tầng 34: Thái Hư Bảo Đỉnh · 35: Hỗn Nguyên Kim Cương Khải · 36: Hóa Nguyệt Hư Ngoa',
  },
  {
    id: 'bloody_arena',
    name: 'Đấu Trường Đẫm Máu',
    tagline: 'PvP loại trực tiếp — tranh tài hàng tuần',
    description:
      'Giải đấu PvP dành cho tu sĩ Nhất/Nhị/Tam Tinh. Thi đấu vòng loại trực tiếp vào Chủ Nhật.',
    schedule: '- Đăng ký: Thứ 7 (0:00–23:59)\n- Thi đấu: 22h Chủ Nhật',
    rewards:
      '- Giải 1: cả 4 vũ khí: Phá Nhược Đao, Thiết Lăng Thương, Mộc Linh Kiếm, Thiết Chấn Táo\n- Giải 2: Thanh Mộc Quán + Thiết Cương Khang  \n- Giải 3: Bích Mộc Khải\n' +
      '- Hạng 4–9: Nhai Thủ  \n- Hạng 10–19: Nhẫn không gian (Nếu chưa từng sử dụng)',
  },
  {
    id: 'hoa_son_luan_vo',
    name: 'Hoa Sơn Luận Võ',
    tagline: 'Đấu trường cao cấp — Vạn Nhiên trở lên',
    description:
      'Giải PvP dành cho tu sĩ Vạn Nhiên, Tiên Linh, Giáp Linh, Cự Linh. Thi đấu loại trực tiếp.',
    schedule: '- Đăng ký: Thứ 6 (0:00–23:59) \n- Thi đấu: 22h Thứ 7',
    rewards:
      '- Giải 1: được lựa chọn 1 trong 4 yêu thú: Bạch Hầu, Xích Huyết Mã, Kim Long, Linh Miêu\n- Giải nhì: được lựa chọn 1 trong 4 yêu thú: Tiểu Long Ngư, Hạo Thiên Khuyển, Diêm Phượng, Địa Ngưu\n- Giải ba: 5 cây Ngô Đồng Hoang Thảo\n- Người xếp hạng từ 9 - 4: 5 cây  Ngô Đồng Thảo\n- Người xếp hạng từ 19 - 10: 100 tinh thạch ',
  },
];

export function getHubEventById(id: HubEventId): HubEventDefinition | undefined {
  return HUB_EVENTS.find((e) => e.id === id);
}
