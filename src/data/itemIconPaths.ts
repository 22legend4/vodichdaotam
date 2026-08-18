import type { ItemData, ItemRarity } from '../types/game.ts';

/** Đường dẫn PNG (relative public/assets/icons/) theo đề xuất icon Game-icons. */
export const ITEM_ICON_PATHS: Record<string, string> = {
  // --- Dược phẩm ---
  med_chuyenSinhDan: 'delapouite/upgrade.png',
  item_chuyenSinhDan: 'delapouite/upgrade.png',
  med_chuChiDuoc: 'lorc/pill.png',
  med_cuongSinhDan: 'delapouite/health-potion.png',
  med_nghenhXuanThao: 'delapouite/grass.png',
  med_hoiNguyenHuyet: 'lorc/potion-ball.png',
  med_tieuNguyenDan: 'lorc/potion-ball.png',
  med_daiNguyenDan: 'lorc/potion-ball.png',
  med_phucNguyenDan: 'lorc/potion-ball.png',
  med_daPhucNguyen: 'lorc/potion-ball.png',
  med_boDeQua: 'delapouite/peach.png',
  item_thienQuy: 'delapouite/tortoise.png',
  item_pheVo: 'sbed/cancel.png',
  med_daoTienQua: 'delapouite/peach.png',
  med_diepKhongQua: 'lorc/fruiting.png',
  med_duHaQua: 'delapouite/plum.png',
  med_nghanhXuanThao: 'delapouite/grass.png',
  med_haiHoangThao: 'delapouite/algae.png',
  med_hacBachSongHoa: 'lorc/lotus-flower.png',
  med_hacLienVanNam: 'lorc/lotus-flower.png',
  med_hoaCoQua: 'delapouite/fire-flower.png',
  med_hoaLienThao: 'delapouite/plant-roots.png',
  med_daoTienMoc: 'delapouite/peach.png',
  med_ngoDongHoangThao: 'delapouite/bamboo.png',
  med_ngoDongThao: 'delapouite/plant-roots.png',
  med_huyetLinhDan: 'lorc/bleeding-heart.png',
  med_huyetKhoiChu: 'lorc/bloody-sword.png',
  med_gioiThuy: 'delapouite/waterskin.png',

  // --- Mảnh chế tạo ---
  mat_xichThietThach: 'delapouite/stone-pile.png',
  mat_xichThietKim: 'delapouite/melting-metal.png',
  mat_voLuongKim: 'delapouite/gold-nuggets.png',
  mat_voLuongThach: 'delapouite/stone-pile.png',
  mat_tichTaThach: 'delapouite/stone-pile.png',
  mat_tichTaKim: 'delapouite/melting-metal.png',
  mat_voLangThach: 'delapouite/stone-pile.png',
  mat_voLangKim: 'delapouite/gold-nuggets.png',
  mat_thuDinhThach: 'delapouite/i-brick.png',
  mat_thuDinhKim: 'delapouite/gold-nuggets.png',
  mat_ngoMinhKim: 'delapouite/gold-nuggets.png',
  mat_ngoMinhThach: 'delapouite/stone-pile.png',
  mat_thienLyThach: 'delapouite/stone-pile.png',
  mat_thienLyKim: 'delapouite/melting-metal.png',
  mat_coChanThiet: 'delapouite/melting-metal.png',
  mat_thanhMocQuan: 'delapouite/i-brick.png',
  mat_phongThanThach: 'delapouite/sandstorm.png',

  // --- Khác ---
  item_nhanKhongGian: 'lorc/transportation-rings.png',
  item_tichLichDan: 'lorc/fireball.png',
  item_moTinhThach: 'lorc/crystal-shine.png',
  item_loiHoaChau: 'lorc/lightning-bow.png',
  item_nhatTienXuyenTam: 'delapouite/plain-arrow.png',
  item_nhatTienSongDieu: 'lorc/arrow-cluster.png',
  item_nhiPhao: 'lorc/firework-rocket.png',
  item_mocKhien: 'delapouite/tribal-shield.png',
  item_cuThachKhien: 'lorc/cracked-shield.png',
  item_thuongHaiTangDien: 'lorc/wave-strike.png',
  item_thatSinhThatTuDo: 'lorc/scroll-unfurled.png',
  item_hoiThe: 'lorc/muscle-up.png',

  // --- Tiền tệ ---
  // cur_tinhThach / cur_gioiThuy — dùng PNG public/assets/ui/, không map icon game-icons

  // --- Yêu thú ---
  beast_tieuLongNgu: 'lorc/sea-dragon.png',
  beast_haoThienKhuyen: 'lorc/wolf-head.png',
  beast_diemPhuong: 'lorc/condor-emblem.png',
  beast_diaNguu: 'delapouite/buffalo-head.png',
  beast_hacMieu: 'delapouite/flying-fox.png',
  beast_bachHau: 'lorc/monkey.png',
  beast_xichHuyetMa: 'delapouite/horse-head.png',
  beast_kimLong: 'lorc/dragon-head.png',
  beast_linhMieu: 'delapouite/flying-fox.png',
  beast_uCotLang: 'lorc/wolf-head.png',
  beast_xichThietHung: 'delapouite/bear-head.png',
  beast_thanhMocXa: 'lorc/snake.png',
  beast_songDauHuyetHo: 'delapouite/tiger-head.png',
  beast_bichThuyQuy: 'delapouite/sea-turtle.png',
  beast_uCocMocYeu: 'cathelineau/tree-face.png',
  beast_hoaChuBao: 'lorc/lizardman.png',
  beast_cuuViHo: 'delapouite/fox-tail.png',
  beast_suongNhanBang: 'lorc/snowflake-1.png',
  beast_nguTracKimLong: 'lorc/dragon-head.png',
  beast_thanhQuy: 'delapouite/sea-turtle.png',
  beast_hoaKyLan: 'lorc/dragon-spiral.png',
};

/** Màu riêng cho vật phẩm dùng chung icon — ADD blend. */
export const ITEM_ICON_TINTS: Record<string, number> = {
  med_chuChiDuoc: 0x88ff88,
  med_cuongSinhDan: 0xff5555,
  med_hoiNguyenHuyet: 0x44ccff,
  med_tieuNguyenDan: 0x3399ff,
  med_daiNguyenDan: 0x2266dd,
  med_phucNguyenDan: 0x1155cc,
  med_daPhucNguyen: 0x5588ff,
  med_nghenhXuanThao: 0x66ff88,
  med_nghanhXuanThao: 0x44cc66,
  med_gioiThuy: 0x44ddff,
  med_hacLienVanNam: 0x9933ff,
  item_mocKhien: 0x8b6914,
  item_nhiPhao: 0xff6633,
  item_cuThachKhien: 0x8899aa,
  item_thuongHaiTangDien: 0x4488cc,
  med_huyetKhoiChu: 0xcc2244,
  cur_tinhThach: 0xffee66,
  beast_kimLong: 0xffcc00,
  beast_cuuViHo: 0xff9944,
};

const RARITY_TINTS: Record<ItemRarity, number> = {
  dong: 0xcd7f32,
  bac: 0xd8d8d8,
  vang: 0xffd700,
  kimcuong: 0x66eeff,
  than: 0xcc88ff,
};

/** Bảng màu dự phòng — phân biệt item còn lại qua hash id. */
const FALLBACK_TINT_PALETTE: readonly number[] = [
  0xff6666, 0xff9944, 0xffcc44, 0xaaff66, 0x44ffaa,
  0x44ddff, 0x6688ff, 0xaa66ff, 0xff66cc, 0xff8866,
  0x66ffcc, 0x88ff44, 0xdd88ff, 0xffaa88, 0x88ccff,
  0xccff88, 0xff88aa, 0x88ffee, 0xeeff88, 0xccaa66,
];

function hashItemId(itemId: string): number {
  let hash = 0;
  for (let i = 0; i < itemId.length; i += 1) {
    hash = (Math.imul(31, hash) + itemId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

type EquipIconCategory = 'dao' | 'thuong' | 'kiem' | 'quyen' | 'head' | 'body' | 'feet';

/** Nhiều biến thể PNG cho cùng loại — chọn theo hash item id. */
const EQUIP_ICON_VARIANTS: Record<EquipIconCategory, readonly string[]> = {
  dao: [
    'lorc/saber-slash.png',
    'lorc/crescent-blade.png',
    'lorc/thunder-blade.png',
    'lorc/relic-blade.png',
    'lorc/dripping-blade.png',
    'lorc/bat-blade.png',
  ],
  thuong: [
    'lorc/spear-hook.png',
    'lorc/spears.png',
  ],
  kiem: [
    'lorc/broadsword.png',
    'lorc/sword-hilt.png',
    'lorc/sparkling-sabre.png',
    'lorc/crossed-sabres.png',
    'lorc/lightning-saber.png',
    'delapouite/ancient-sword.png',
  ],
  quyen: [
    'delapouite/gauntlet.png',
    'lorc/fist.png',
    'lorc/mailed-fist.png',
    'lorc/thor-fist.png',
  ],
  head: [
    'lorc/hood.png',
    'delapouite/samurai-helmet.png',
    'delapouite/centurion-helmet.png',
    'delapouite/robin-hood-hat.png',
  ],
  body: [
    'delapouite/abdominal-armor.png',
    'delapouite/chest-armor.png',
    'delapouite/leather-armor.png',
    'delapouite/belt-armor.png',
  ],
  feet: [
    'lorc/boots.png',
    'lorc/steeltoe-boots.png',
  ],
};

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, value));
}

/** Biến thể màu nhẹ quanh tint gốc — phân biệt item cùng icon + cùng phẩm. */
function varyTint(base: number, hash: number): number {
  const shift = (hash % 7) - 3;
  const r = clampChannel(((base >> 16) & 0xff) + shift * 10);
  const g = clampChannel(((base >> 8) & 0xff) + ((hash >> 3) % 5 - 2) * 8);
  const b = clampChannel((base & 0xff) + ((hash >> 5) % 5 - 2) * 10);
  return (r << 16) | (g << 8) | b;
}

function resolveEquipmentIconCategory(item: ItemData): EquipIconCategory | null {
  if (item.type !== 'equipment') return null;

  if (item.slot === 'weapon' && item.weaponType) {
    return item.weaponType;
  }

  if (item.slot === 'head' || item.slot === 'body' || item.slot === 'feet') {
    return item.slot;
  }

  const name = item.name;
  if (name.includes('Đao')) return 'dao';
  if (name.includes('Thương')) return 'thuong';
  if (name.includes('Kiếm')) return 'kiem';
  if (name.includes('Găng') || name.includes('Táo') || name.includes('Thủ')) return 'quyen';
  if (name.includes('Quán') || name.includes('Đỉnh') || name.includes('Nha')) return 'head';
  if (name.includes('Khải') || name.includes('Bào') || name.includes('Giáp') || name.includes('Y')) return 'body';
  if (name.includes('Ngoa') || name.includes('Khang') || name.includes('Cước')) return 'feet';
  if (name.includes('Khí') || name.includes('Hỏa')) return 'quyen';

  return null;
}

function resolveEquipmentIconPath(item: ItemData): string | undefined {
  const category = resolveEquipmentIconCategory(item);
  if (!category) return undefined;
  const variants = EQUIP_ICON_VARIANTS[category];
  const index = hashItemId(item.id) % variants.length;
  return variants[index];
}

/** Màu hiển thị icon — mỗi vật phẩm khác nhau dù dùng chung PNG. */
export function resolveItemIconTint(item: ItemData): number {
  const explicit = ITEM_ICON_TINTS[item.id];
  if (explicit !== undefined) return explicit;

  const hash = hashItemId(item.id);

  if (item.type === 'equipment' && item.rarity) {
    return varyTint(RARITY_TINTS[item.rarity], hash);
  }

  if (item.type === 'currency') {
    return item.id === 'cur_gioiThuy' ? 0x44ddff : 0xffee88;
  }

  return FALLBACK_TINT_PALETTE[hash % FALLBACK_TINT_PALETTE.length]!;
}

export function resolveItemIconPath(item: ItemData): string | undefined {
  if (item.iconPath) return item.iconPath;
  const mapped = ITEM_ICON_PATHS[item.id];
  if (mapped) return mapped;

  if (item.type === 'equipment') {
    return resolveEquipmentIconPath(item);
  }

  return undefined;
}

export function attachItemIcon(item: ItemData): ItemData {
  const iconPath = resolveItemIconPath(item);
  return iconPath ? { ...item, iconPath } : item;
}
