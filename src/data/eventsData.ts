/** Sự kiện hiển thị trong màn Sự Kiện (bản offline — không PvP online). */
export type HubEventId = 'leo_thap';

export interface HubEventDefinition {
  id: HubEventId;
  name: string;
  tagline: string;
  description: string;
  schedule: string;
  rewards: string;
}

import { formatLeoThapScheduleLabel } from './leoThapData.ts';

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
];

export function getHubEventById(id: HubEventId): HubEventDefinition | undefined {
  return HUB_EVENTS.find((e) => e.id === id);
}
