import type { SkillData, WeaponType } from '../types/game.ts';

/** Võ kỹ đã gỡ — lọc khỏi save cũ. */
export const REMOVED_SKILL_IDS = [
  'mienKhong',
  'troi',
  'dinh',
  'phong',
  'phatAn',
  'thieuKhong',
  'thoatKhong',
  'voKhong',
] as const;

export function isRemovedSkill(skillId: string): boolean {
  return (REMOVED_SKILL_IDS as readonly string[]).includes(skillId);
}

function dmg(
  id: string,
  name: string,
  type: SkillData['type'],
  atk: number,
  qi: number,
  cost: number,
  icon: string,
): SkillData {
  return {
    id,
    name,
    type,
    atkBonus: atk,
    defBonus: 0,
    qiCost: qi,
    category: 'damage',
    skillPointCost: cost,
    iconPath: icon,
    description: `Tăng ${atk} công khi tấn công.`,
  };
}

function def(
  id: string,
  name: string,
  defBonus: number,
  qi: number,
  cost: number,
  icon: string,
): SkillData {
  return {
    id,
    name,
    type: 'dodon',
    atkBonus: 0,
    defBonus,
    qiCost: qi,
    category: 'defense',
    skillPointCost: cost,
    iconPath: icon,
    description: `Tăng phòng thủ cho 5 nhân vật (cả 5 nhân vật đều tăng ${defBonus} thủ trong lượt đánh). Trong trận: ấn võ kỹ thủ là kích hoạt ngay — icon hiện trên cả 5 nhân vật.`,
  };
}

export const SKILLS_DATA: SkillData[] = [
  // --- Cơ bản (0 điểm) ---
  dmg('khongPhaQuyen', 'Không Phá Quyền', 'quyen', 2, 1, 0, 'lorc/fist.png'),
  dmg('kiemNhuLai', 'Kiếm Như Lai', 'kiem', 2, 1, 0, 'lorc/relic-blade.png'),
  dmg('hoanhKhongDao', 'Hoành Không Đao', 'dao', 2, 1, 0, 'lorc/croc-sword.png'),
  dmg('thuongVoHoi', 'Thương Vô Hối', 'thuong', 2, 1, 0, 'lorc/barbed-spear.png'),

  // --- 3 điểm ---
  dmg('nhatNguyetNhuKhong', 'Nhật Nguyệt Như Không', 'quyen', 12, 3, 3, 'lorc/mailed-fist.png'),
  dmg('nhatKiemDinhGiangSon', 'Nhất Kiếm Định Giang Sơn', 'kiem', 12, 3, 3, 'lorc/pointy-sword.png'),
  dmg('sonThuyVoTinh', 'Sơn Thủy Vô Tình', 'dao', 12, 3, 3, 'lorc/curvy-knife.png'),
  dmg('tueNguyet', 'Tuế Nguyệt', 'thuong', 12, 3, 3, 'lorc/barbed-arrow.png'),
  def('thaiDuTruongHa', 'Thái Du Trường Hà', 12, 3, 3, 'sbed/shield.png'),

  // --- 7 điểm ---
  dmg('quyenVoThanh', 'Quyền Vô Thanh', 'quyen', 31, 12, 7, 'lorc/boxing-glove.png'),
  dmg('cuuLongThangThien', 'Cửu Long Thăng Thiên', 'kiem', 31, 12, 7, 'lorc/sword-clash.png'),
  dmg('voAnhDao', 'Vô Ảnh Đao', 'dao', 31, 12, 7, 'lorc/crossed-sabres.png'),
  dmg('thachPhaThuong', 'Thạch Phá Thương', 'thuong', 31, 12, 7, 'lorc/spear-hook.png'),
  def('bachQuyTeGia', 'Bách Quy Tề Gia', 31, 12, 7, 'delapouite/shield-opposition.png'),

  // --- 9 điểm ---
  dmg('baoQuyen', 'Bạo Quyền', 'quyen', 68, 30, 9, 'lorc/hypersonic-bolt.png'),
  dmg('minhKiem', 'Minh Kiếm', 'kiem', 68, 30, 9, 'lorc/all-for-one.png'),
  dmg('baDao', 'Bá Đao', 'dao', 68, 30, 9, 'lorc/barbed-nails.png'),
  dmg('macThuong', 'Mạc Thương', 'thuong', 68, 30, 9, 'lorc/fishhook-fork.png'),
  def('hongHaiKinh', 'Hồng Hải Kình', 68, 30, 9, 'lorc/shield-echoes.png'),

  // --- 11 điểm ---
  dmg('thienQuyen', 'Thiên Quyền', 'quyen', 150, 100, 11, 'lorc/mushroom-cloud.png'),
  dmg('vanKiemQuyTong', 'Vạn Kiếm Quy Tông', 'kiem', 150, 100, 11, 'lorc/sword-array.png'),
  dmg('vanDaoTrieuBai', 'Vạn Đao Triều Bái', 'dao', 150, 100, 11, 'lorc/saber-slash.png'),
  dmg('thuongVoDich', 'Thương Vô Địch', 'thuong', 150, 100, 11, 'lorc/spears.png'),
  def('kimCuongBatHoai', 'Kim Cương Bất Hoại', 150, 100, 11, 'lorc/shield-bounces.png'),

  // --- Chuyển sinh (36 điểm, chỉ sau Chuyển sinh tại Cổng dịch chuyển) ---
  dmg('tuPhanQuyNguyenKhi', 'Tứ Phân Quy Nguyên Khí', 'chung', 333, 200, 36, 'lorc/black-hole-bolas.png'),
];

export const SKILLS_BY_ID: Record<string, SkillData> = Object.fromEntries(
  SKILLS_DATA.map((s) => [s.id, s]),
);

/** Võ kỹ chỉ hiện sau khi chuyển sinh tại Cổng dịch chuyển. */
export const REBIRTH_SKILL_ID = 'tuPhanQuyNguyenKhi';

export function getSkillById(id: string): SkillData | undefined {
  return SKILLS_BY_ID[id];
}

export function getSkillByName(name: string): SkillData | undefined {
  return SKILLS_DATA.find((s) => s.name === name);
}

/** Võ kỹ mặc định theo vũ khí (0 điểm). */
export const WEAPON_BASIC_SKILL: Record<WeaponType, string> = {
  quyen: 'khongPhaQuyen',
  kiem: 'kiemNhuLai',
  dao: 'hoanhKhongDao',
  thuong: 'thuongVoHoi',
};

export function getBasicSkillForWeapon(weapon: WeaponType): SkillData {
  return SKILLS_BY_ID[WEAPON_BASIC_SKILL[weapon]]!;
}

export function getSkillsForWeapon(weapon: WeaponType): SkillData[] {
  return SKILLS_DATA.filter((s) => s.type === weapon);
}

export function isWeaponSkill(skill: SkillData, weapon: WeaponType): boolean {
  return skill.type === weapon;
}

export function canLearnSkill(
  skill: SkillData,
  weapon: WeaponType,
  learnedIds: readonly string[],
  availablePoints: number,
  hasReincarnated = false,
): { ok: boolean; reason?: string } {
  if (learnedIds.includes(skill.id)) {
    return { ok: false, reason: 'Đã học võ kỹ này.' };
  }
  if (skill.id === REBIRTH_SKILL_ID && !hasReincarnated) {
    return { ok: false, reason: 'Cần chuyển sinh tại Cổng dịch chuyển trước.' };
  }
  if (availablePoints < skill.skillPointCost) {
    return { ok: false, reason: `Cần ${skill.skillPointCost} điểm võ kỹ.` };
  }
  if (skill.category === 'damage' && skill.type !== 'chung' && skill.type !== weapon) {
    return { ok: false, reason: 'Võ kỹ tấn công không khớp vũ khí.' };
  }
  return { ok: true };
}

/** Võ kỹ mang vào trận — ưu tiên cao tier, tối đa 4 ô. */
export const BATTLE_SKILL_SLOT_COUNT = 4;

export function buildBattleSkillIds(learnedIds: readonly string[], weapon: WeaponType): string[] {
  const learned = learnedIds
    .map((id) => SKILLS_BY_ID[id])
    .filter((s): s is SkillData => !!s);

  const pickBest = (filter: (s: SkillData) => boolean): SkillData | undefined =>
    learned.filter(filter).sort((a, b) => b.skillPointCost - a.skillPointCost)[0];

  const slots: SkillData[] = [];
  const weaponSkill = pickBest((s) => s.type === weapon || s.type === 'chung');
  const defense = pickBest((s) => s.category === 'defense');

  for (const s of [weaponSkill, defense]) {
    if (s && !slots.some((x) => x.id === s.id)) slots.push(s);
  }

  for (const s of learned.sort((a, b) => b.skillPointCost - a.skillPointCost)) {
    if (slots.length >= 4) break;
    if (!slots.some((x) => x.id === s.id)) slots.push(s);
  }

  return slots.map((s) => s.id);
}

/** Lấy võ kỹ trận đấu từ ô người chơi chọn; fallback tự động nếu chưa chọn. */
export function resolveBattleSkillIdsFromLoadout(
  learnedIds: readonly string[],
  weapon: WeaponType,
  loadout: readonly (string | null)[] | undefined,
): string[] {
  const learnedSet = new Set(learnedIds);
  const picked: string[] = [];
  if (loadout) {
    for (const skillId of loadout) {
      if (!skillId || !learnedSet.has(skillId) || isRemovedSkill(skillId)) continue;
      if (!picked.includes(skillId)) picked.push(skillId);
    }
  }
  if (picked.length > 0) return picked.slice(0, BATTLE_SKILL_SLOT_COUNT);
  return buildBattleSkillIds(learnedIds, weapon);
}

export type SkillTreeBranch = 'weapon' | 'defense' | 'rebirth';

export interface SkillTreeNode {
  skillId: string;
  branch: SkillTreeBranch;
  /** Hàng trong cây (0 = gốc). */
  row: number;
  parentSkillId?: string;
}

export interface SkillTreeOptions {
  /** Đã mở nhánh võ kỹ chuyển sinh (Chuyển sinh tại cổng). */
  rebirthUnlocked?: boolean;
}

/** Cấu trúc cây võ kỹ — nhánh vũ khí và phòng thủ. */
export function getSkillTreeNodes(weapon: WeaponType, options?: SkillTreeOptions): SkillTreeNode[] {
  const w = WEAPON_BASIC_SKILL[weapon];
  const weaponChain = [
    w,
    { quyen: 'nhatNguyetNhuKhong', kiem: 'nhatKiemDinhGiangSon', dao: 'sonThuyVoTinh', thuong: 'tueNguyet' }[weapon]!,
    { quyen: 'quyenVoThanh', kiem: 'cuuLongThangThien', dao: 'voAnhDao', thuong: 'thachPhaThuong' }[weapon]!,
    { quyen: 'baoQuyen', kiem: 'minhKiem', dao: 'baDao', thuong: 'macThuong' }[weapon]!,
    { quyen: 'thienQuyen', kiem: 'vanKiemQuyTong', dao: 'vanDaoTrieuBai', thuong: 'thuongVoDich' }[weapon]!,
  ];

  const defenseChain = ['thaiDuTruongHa', 'bachQuyTeGia', 'hongHaiKinh', 'kimCuongBatHoai'];

  const nodes: SkillTreeNode[] = [];

  weaponChain.forEach((id, row) => {
    nodes.push({
      skillId: id,
      branch: 'weapon',
      row,
      parentSkillId: row > 0 ? weaponChain[row - 1] : undefined,
    });
  });

  defenseChain.forEach((id, i) => {
    const row = i + 1;
    nodes.push({
      skillId: id,
      branch: 'defense',
      row,
      parentSkillId: row === 1 ? w : defenseChain[i - 1],
    });
  });

  if (options?.rebirthUnlocked) {
    nodes.push({
      skillId: REBIRTH_SKILL_ID,
      branch: 'rebirth',
      row: 0,
    });
  }

  return nodes;
}

/** Võ kỹ nhánh vũ khí hàng 1 — mua bằng điểm võ kỹ lần đầu. */
export function getFirstPurchasableWeaponSkill(weapon: WeaponType): string {
  return {
    quyen: 'nhatNguyetNhuKhong',
    kiem: 'nhatKiemDinhGiangSon',
    dao: 'sonThuyVoTinh',
    thuong: 'tueNguyet',
  }[weapon];
}

export function getSkillTreePosition(branch: SkillTreeBranch, row: number): { x: number; y: number } {
  if (branch === 'rebirth') {
    return { x: 307, y: 548 };
  }
  const yByRow = [68, 166, 264, 362, 460];
  const weaponCol = 120;
  const defenseCol = 380;
  const col = branch === 'weapon' ? weaponCol : defenseCol;
  const x = branch === 'weapon' && row === 0 ? (weaponCol + defenseCol) / 2 : col;
  return { x, y: yByRow[row] ?? 68 };
}

/** Cộng dồn công/thủ thụ động từ võ kỹ đã học. */
export function sumLearnedSkillStats(skillIds: string[]): { atk: number; def: number } {
  let atk = 0;
  let def = 0;
  for (const id of skillIds) {
    const skill = getSkillById(id);
    if (!skill) continue;
    atk += skill.atkBonus;
    def += skill.defBonus;
  }
  return { atk, def };
}
