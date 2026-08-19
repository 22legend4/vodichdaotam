import { NPCS_DATA } from './npcsData.ts';
import { publicAssetUrl } from '../utils/publicAssetUrl.ts';

export interface NpcAppearanceDef {
  npcId: string;
  /** Một ảnh duy nhất trong public/ — NPC địch không có pose tấn công. null = avatar vẽ procedural. */
  portraitFile: string | null;
}

/** NPC dùng làm Tên Cướp (tutorial + hội thoại). */
export const BANDIT_NPC_ID = 'npc3';

/** npc1–8: npc{N}.png — npc9–36: npc {N}.png (theo thư mục public/assets/npcs). */
function defaultHumanNpcPortraitPath(index: number): string | null {
  if (index >= 1 && index <= 8) return publicAssetUrl(`assets/npcs/npc${index}.png`);
  if (index >= 9 && index <= 36) return publicAssetUrl(`assets/npcs/npc ${index}.png`);
  return null;
}

/** Yêu thú — Chương 5 Yêu Vực (tên file riêng). */
const BEAST_NPC_PORTRAIT_FILES: Partial<Record<string, string>> = {
  npc37: publicAssetUrl('assets/npcs/Tieu Long Ngu.png'),
  npc38: publicAssetUrl('assets/npcs/Hao Thien Khuyen.png'),
  npc39: publicAssetUrl('assets/npcs/Diem-Phuong.png'),
  npc40: publicAssetUrl('assets/npcs/Dia Nguu.png'),
  npc41: publicAssetUrl('assets/npcs/Bach Hau.png'),
  npc42: publicAssetUrl('assets/npcs/Xich Huyet Ma.png'),
  npc43: publicAssetUrl('assets/npcs/Kim Long.png'),
  npc44: publicAssetUrl('assets/npcs/Linh Mieu.png'),
  npc45: publicAssetUrl('assets/npcs/U Cot Lang.png'),
  npc46: publicAssetUrl('assets/npcs/Hac Mieu.png'),
};

/** NPC đặc biệt — không thuộc dải npc1–36 hay Yêu vực. */
const SPECIAL_NPC_PORTRAIT_FILES: Partial<Record<string, string>> = {
  npc47: publicAssetUrl('assets/npcs/am-nha.png'),
};

function buildNpcPortraitFiles(): Partial<Record<string, string>> {
  const map: Partial<Record<string, string>> = {
    ...BEAST_NPC_PORTRAIT_FILES,
    ...SPECIAL_NPC_PORTRAIT_FILES,
  };
  for (let i = 1; i <= 36; i++) {
    const id = `npc${i}`;
    if (!map[id]) {
      const path = defaultHumanNpcPortraitPath(i);
      if (path) map[id] = path;
    }
  }
  return map;
}

/** Map npcId → đường dẫn PNG. */
const NPC_PORTRAIT_FILES = buildNpcPortraitFiles();

/** NPC địch (không phải người chơi / đồng đội) — mỗi npc một ảnh tĩnh. */
export const NPC_APPEARANCES: NpcAppearanceDef[] = NPCS_DATA.map((npc) => ({
  npcId: npc.id,
  portraitFile: NPC_PORTRAIT_FILES[npc.id] ?? null,
}));

export function getNpcAppearance(npcId: string): NpcAppearanceDef | undefined {
  return NPC_APPEARANCES.find((a) => a.npcId === npcId);
}

export function hasNpcPortrait(npcId: string): boolean {
  return getNpcAppearance(npcId)?.portraitFile != null;
}
