import type { NpcData } from '../types/game.ts';

/** Võ kỹ bổ trợ bị động "Miễn khống" — chỉ bản thân, suốt trận; tách khỏi Thiếu Khống (chủ động). */
const MIEN_KHONG = 'mienKhong';

function npc(
  index: number,
  atk: number,
  def: number,
  hp: number,
  maxQi: number,
  mainSkillId: string | null = null,
  supportSkillId: string | null = null,
  name?: string,
): NpcData {
  return {
    id: `npc${index}`,
    name: name ?? `Npc ${index}`,
    atk,
    def,
    hp,
    maxQi,
    mainSkillId,
    supportSkillId,
  };
}

/**
 * NPC địch — công / phòng / máu (stat) / nguyên khí / võ kỹ bổ trợ bị động.
 * NPC chỉ Đánh Thường; võ kỹ bổ trợ (Miễn khống…) tự kích hoạt suốt trận.
 */
export const NPCS_DATA: NpcData[] = [
  npc(1, 3, 3, 1, 10),
  npc(2, 3, 3, 7, 10),
  npc(3, 3, 3, 10, 10),
  npc(4, 7, 3, 10, 10),
  npc(5, 4, 5, 12, 10),
  npc(6, 6, 8, 14, 10),
  npc(7, 9, 8, 16, 10),
  npc(8, 12, 9, 18, 20, null, MIEN_KHONG),
  npc(9, 15, 15, 22, 20),
  npc(10, 20, 20, 24, 20),
  npc(11, 25, 30, 26, 20),
  npc(12, 30, 40, 33, 20, null, MIEN_KHONG),
  npc(13, 30, 45, 33, 20),
  npc(14, 40, 50, 33, 20),
  npc(15, 50, 50, 33, 20),
  npc(16, 70, 88, 40, 20, null, MIEN_KHONG),
  npc(17, 80, 99, 50, 20),
  npc(18, 100, 122, 50, 20),
  npc(19, 120, 122, 50, 20),
  npc(20, 150, 160, 100, 20, null, MIEN_KHONG),
  npc(21, 180, 222, 150, 20),
  npc(22, 222, 255, 150, 20),
  npc(23, 250, 300, 150, 20),
  npc(24, 333, 333, 200, 60, null, MIEN_KHONG),
  npc(25, 350, 350, 200, 60),
  npc(26, 400, 400, 200, 60),
  npc(27, 450, 400, 200, 60),
  npc(28, 500, 500, 250, 60, null, MIEN_KHONG),
  npc(29, 600, 500, 300, 150, null, MIEN_KHONG),
  npc(30, 600, 600, 350, 150, null, MIEN_KHONG),
  npc(31, 800, 600, 400, 200, null, MIEN_KHONG),
  npc(32, 800, 800, 500, 200, null, MIEN_KHONG),
  npc(33, 1000, 1000, 1000, 500, null, MIEN_KHONG),
  npc(34, 1100, 1100, 1100, 500, null, MIEN_KHONG),
  npc(35, 1200, 1100, 1100, 500, null, MIEN_KHONG),
  npc(36, 1200, 1200, 1200, 500, null, MIEN_KHONG),
  // Yêu thú — NPC địch (GDD)
  npc(37, 222, 100, 100, 60, null, MIEN_KHONG, 'Tiểu Long Ngư'),
  npc(38, 150, 150, 150, 60, null, MIEN_KHONG, 'Hạo Thiên Khuyển'),
  npc(39, 200, 200, 200, 60, null, MIEN_KHONG, 'Diêm Phượng'),
  npc(40, 150, 250, 250, 100, null, MIEN_KHONG, 'Địa Ngưu'),
  npc(41, 350, 350, 500, 150, null, MIEN_KHONG, 'Bạch Hầu'),
  npc(42, 400, 400, 400, 150, null, MIEN_KHONG, 'Xích Huyết Mã'),
  npc(43, 450, 350, 400, 200, null, MIEN_KHONG, 'Kim Long'),
  npc(44, 420, 300, 350, 200, null, MIEN_KHONG, 'Linh Miêu'),
  npc(45, 500, 500, 500, 200, null, MIEN_KHONG, 'U Cốt Lang'),
  npc(46, 600, 500, 500, 200, null, MIEN_KHONG, 'Hắc Miêu'),
  npc(47, 2000, 3000, 5000, 5000, null, MIEN_KHONG, 'Âm nha'),
];

/** Số NPC địch tối đa (npc1 … npcN). */
export const NPC_MAX_INDEX = NPCS_DATA.length > 0
  ? Math.max(...NPCS_DATA.map((n) => parseInt(n.id.replace('npc', ''), 10)))
  : 0;

export const NPCS_BY_ID: Record<string, NpcData> = Object.fromEntries(
  NPCS_DATA.map((entry) => [entry.id, entry]),
);

export function getNpcById(id: string): NpcData | undefined {
  return NPCS_BY_ID[id];
}
