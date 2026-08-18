import type { SkillData, WeaponType } from '../types/game.ts';

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

function ctrl(
  id: string,
  name: string,
  qi: number,
  cost: number,
  icon: string,
  effect: string,
  description: string,
): SkillData {
  return {
    id,
    name,
    type: 'control',
    atkBonus: 0,
    defBonus: 0,
    qiCost: qi,
    category: 'control',
    skillPointCost: cost,
    iconPath: icon,
    effect,
    description,
  };
}

function spec(
  id: string,
  name: string,
  type: 'immunity' | 'breakControl',
  qi: number,
  cost: number,
  icon: string,
  effect: string,
  description: string,
): SkillData {
  return {
    id,
    name,
    type,
    atkBonus: 0,
    defBonus: 0,
    qiCost: qi,
    category: 'special',
    skillPointCost: cost,
    iconPath: icon,
    effect,
    description,
  };
}

/** 30 võ kỹ theo GDD — thay thế toàn bộ dữ liệu cũ. */
export const SKILLS_DATA: SkillData[] = [
  // --- Cơ bản (0 điểm) ---
  dmg('khongPhaQuyen', 'Không Phá Quyền', 'quyen', 2, 1, 0, 'lorc/fist.png'),
  dmg('kiemNhuLai', 'Kiếm Như Lai', 'kiem', 2, 1, 0, 'lorc/relic-blade.png'),
  dmg('hoanhKhongDao', 'Hoành Không Đao', 'dao', 2, 1, 0, 'lorc/croc-sword.png'),
  dmg('thuongVoHoi', 'Thương Vô Hối', 'thuong', 2, 1, 0, 'lorc/barbed-spear.png'),

  /** Võ kỹ bổ trợ bị động NPC — không học được, không tốn Qi, không thay võ kỹ chủ động. */
  spec(
    'mienKhong',
    'Miễn Khống',
    'immunity',
    0,
    0,
    'lorc/back-pain.png',
    'passiveSelfControlImmunity',
    'Bị động suốt trận: bản thân miễn nhiễm võ kỹ khống chế. Vẫn dùng võ kỹ chủ động để tấn công hoặc phòng thủ.',
  ),

  // --- 3 điểm ---
  dmg('nhatNguyetNhuKhong', 'Nhật Nguyệt Như Không', 'quyen', 12, 3, 3, 'lorc/mailed-fist.png'),
  dmg('nhatKiemDinhGiangSon', 'Nhất Kiếm Định Giang Sơn', 'kiem', 12, 3, 3, 'lorc/pointy-sword.png'),
  dmg('sonThuyVoTinh', 'Sơn Thủy Vô Tình', 'dao', 12, 3, 3, 'lorc/curvy-knife.png'),
  dmg('tueNguyet', 'Tuế Nguyệt', 'thuong', 12, 3, 3, 'lorc/barbed-arrow.png'),
  def('thaiDuTruongHa', 'Thái Du Trường Hà', 12, 3, 3, 'sbed/shield.png'),
  ctrl(
    'troi',
    'Trói',
    3,
    3,
    'lorc/bandaged.png',
    'bindOneOne',
    'Cố định 1 đối thủ trong 1 lượt đánh, khiến nhân vật đó không thể tấn công thường và không thể sử dụng võ kỹ.',
  ),

  // --- 7 điểm ---
  dmg('quyenVoThanh', 'Quyền Vô Thanh', 'quyen', 31, 12, 7, 'lorc/boxing-glove.png'),
  dmg('cuuLongThangThien', 'Cửu Long Thăng Thiên', 'kiem', 31, 12, 7, 'lorc/sword-clash.png'),
  dmg('voAnhDao', 'Vô Ảnh Đao', 'dao', 31, 12, 7, 'lorc/crossed-sabres.png'),
  dmg('thachPhaThuong', 'Thạch Phá Thương', 'thuong', 31, 12, 7, 'lorc/spear-hook.png'),
  def('bachQuyTeGia', 'Bách Quy Tề Gia', 31, 12, 7, 'delapouite/shield-opposition.png'),
  ctrl(
    'dinh',
    'Định',
    12,
    6,
    'lorc/dead-eye.png',
    'bindTwoTwo',
    'Cố định 2 đối thủ trong 2 lượt đánh, khiến 2 nhân vật đó không thể tấn công thường và không thể sử dụng võ kỹ.',
  ),
  spec(
    'thieuKhong',
    'Thiếu Khống',
    'immunity',
    12,
    4,
    'lorc/back-pain.png',
    'immunityTwoTwo',
    'Giúp 2 thành viên không bị ảnh hưởng bởi võ kỹ khống chế của đối thủ trong 2 lượt (Không có tác dụng giải khống chế).',
  ),

  // --- 9 điểm ---
  dmg('baoQuyen', 'Bạo Quyền', 'quyen', 68, 30, 9, 'lorc/hypersonic-bolt.png'),
  dmg('minhKiem', 'Minh Kiếm', 'kiem', 68, 30, 9, 'lorc/all-for-one.png'),
  dmg('baDao', 'Bá Đao', 'dao', 68, 30, 9, 'lorc/barbed-nails.png'),
  dmg('macThuong', 'Mạc Thương', 'thuong', 68, 30, 9, 'lorc/fishhook-fork.png'),
  def('hongHaiKinh', 'Hồng Hải Kình', 68, 30, 9, 'lorc/shield-echoes.png'),
  ctrl(
    'phong',
    'Phong',
    30,
    8,
    'lorc/eye-shield.png',
    'bindThreeThree',
    'Cố định 3 đối thủ trong 3 lượt đánh, khiến 3 nhân vật đó không thể tấn công thường và không thể sử dụng võ kỹ.',
  ),
  spec(
    'thoatKhong',
    'Thoát Khống',
    'breakControl',
    30,
    5,
    'lorc/aura.png',
    'breakControlTeam',
    'Giúp cả đội thoát khỏi võ kỹ khống chế của đối thủ.',
  ),

  // --- 11 điểm ---
  dmg('thienQuyen', 'Thiên Quyền', 'quyen', 150, 100, 11, 'lorc/mushroom-cloud.png'),
  dmg('vanKiemQuyTong', 'Vạn Kiếm Quy Tông', 'kiem', 150, 100, 11, 'lorc/sword-array.png'),
  dmg('vanDaoTrieuBai', 'Vạn Đao Triều Bái', 'dao', 150, 100, 11, 'lorc/saber-slash.png'),
  dmg('thuongVoDich', 'Thương Vô Địch', 'thuong', 150, 100, 11, 'lorc/spears.png'),
  def('kimCuongBatHoai', 'Kim Cương Bất Hoại', 150, 100, 11, 'lorc/shield-bounces.png'),
  ctrl(
    'phatAn',
    'Phật Ấn',
    100,
    7,
    'lorc/eyeball.png',
    'bindThreeFive',
    'Cố định 5 đối thủ trong 3 lượt đánh, khiến 5 nhân vật đó không thể tấn công thường và không thể sử dụng võ kỹ.',
  ),
  spec(
    'voKhong',
    'Vô Khống',
    'immunity',
    100,
    7,
    'lorc/atomic-slashes.png',
    'immunityTeamThree',
    'Khiến cả đội không bị ảnh hưởng bởi võ kỹ khống chế của đối thủ trong 3 lượt (Không có tác dụng giải khống chế).',
  ),

  // --- Chuyển sinh (36 điểm, chỉ sau khi dùng Chuyển sinh đan) ---
  dmg('tuPhanQuyNguyenKhi', 'Tứ Phân Quy Nguyên Khí', 'chung', 333, 200, 36, 'lorc/black-hole-bolas.png'),
];

export const SKILLS_BY_ID: Record<string, SkillData> = Object.fromEntries(
  SKILLS_DATA.map((s) => [s.id, s]),
);

/** Võ kỹ chỉ hiện sau khi nhân vật dùng Chuyển sinh đan. */
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
    return { ok: false, reason: 'Cần dùng Chuyển sinh đan trước.' };
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
  const control = pickBest((s) => s.category === 'control');
  const support = pickBest((s) => s.category === 'special');

  for (const s of [weaponSkill, defense, control, support]) {
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
      if (!skillId || !learnedSet.has(skillId)) continue;
      if (!picked.includes(skillId)) picked.push(skillId);
    }
  }
  if (picked.length > 0) return picked.slice(0, BATTLE_SKILL_SLOT_COUNT);
  return buildBattleSkillIds(learnedIds, weapon);
}

export type SkillTreeBranch = 'weapon' | 'defense' | 'control' | 'immunity' | 'rebirth';

export interface SkillTreeNode {
  skillId: string;
  branch: SkillTreeBranch;
  /** Hàng trong cây (0 = gốc). */
  row: number;
  parentSkillId?: string;
}

export interface SkillTreeOptions {
  /** Nhân vật đã dùng Chuyển sinh đan — hiện thêm Tứ Phân Quy Nguyên Khí. */
  rebirthUnlocked?: boolean;
}

/** Cấu trúc cây võ kỹ — nhánh trái theo vũ khí, giữa đỡ đòn, phải khống chế / miễn. */
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
  const controlChain = ['troi', 'dinh', 'phong', 'phatAn'];
  const immunityChain = ['thieuKhong', 'thoatKhong', 'voKhong'];

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

  nodes.push({ skillId: 'troi', branch: 'control', row: 1, parentSkillId: w });

  controlChain.slice(1).forEach((id, i) => {
    const row = i + 2;
    nodes.push({
      skillId: id,
      branch: 'control',
      row,
      parentSkillId: controlChain[i]!,
    });
  });

  immunityChain.forEach((id, i) => {
    const row = i + 2;
    nodes.push({
      skillId: id,
      branch: 'immunity',
      row,
      parentSkillId: i === 0 ? 'troi' : immunityChain[i - 1],
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
  const col =
    branch === 'weapon' ? 88 :
    branch === 'defense' ? 230 :
    branch === 'control' ? 378 : 526;
  /** Gốc cây (võ kỹ cơ bản) thẳng cột phòng thủ. */
  const x = branch === 'weapon' && row === 0 ? 230 : col;
  return { x, y: yByRow[row] ?? 68 };
}

export function isSpecialSkill(skill: SkillData): boolean {
  return skill.category === 'control' || skill.category === 'special';
}

export function getSkillEffectId(skill: SkillData): string | undefined {
  return skill.effect;
}

/** Số địch cần khống chế theo hiệu ứng bind. */
export function getBindTargetCount(effect: string | undefined): number {
  switch (effect) {
    case 'bindOneOne':
      return 1;
    case 'bindTwoTwo':
      return 2;
    case 'bindThreeThree':
      return 3;
    case 'bindThreeFive':
      return 5;
    default:
      return 0;
  }
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
