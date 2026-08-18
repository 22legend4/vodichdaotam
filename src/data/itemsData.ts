import type { ItemData } from '../types/game.ts';
import { EVENT_ITEMS } from './eventItems.ts';
import { attachItemIcon } from './itemIconPaths.ts';
import { EQUIPMENT_CATALOG } from './equipmentCatalog.ts';

const Z = { atk: 0, def: 0, hp: 0, qi: 0 };

function med(
  id: string,
  name: string,
  description: string,
  value: number,
  priceType: ItemData['priceType'] = 'tinhThach',
): ItemData {
  return { id, name, type: 'medicine', bagTab: 'medicine', ...Z, description, value, priceType };
}

function shard(id: string, name: string, description: string): ItemData {
  return { id, name, type: 'material', bagTab: 'shard', ...Z, description, value: 0, priceType: 'tinhThach' };
}

function misc(
  id: string,
  name: string,
  description: string,
  value = 0,
  priceType: ItemData['priceType'] = 'tinhThach',
): ItemData {
  return { id, name, type: 'material', bagTab: 'other', ...Z, description, value, priceType };
}

function beast(
  id: string,
  name: string,
  description: string,
  stats: { atk?: number; def?: number; hp?: number; qi?: number },
  value: number,
  priceType: ItemData['priceType'] = 'tinhThach',
  rarity?: ItemData['rarity'],
  supportSkillId?: string | null,
  iconPath?: string,
): ItemData {
  return {
    id,
    name,
    slot: 'pet',
    type: 'beast',
    bagTab: 'beast',
    atk: stats.atk ?? 0,
    def: stats.def ?? 0,
    hp: stats.hp ?? 0,
    qi: stats.qi ?? 0,
    description,
    value,
    priceType,
    rarity,
    supportSkillId,
    iconPath,
  };
}

/** Dược phẩm — GDD vật phẩm. */
const MEDICINES_DATA: ItemData[] = [
  med(
    'med_chuChiDuoc',
    'Chu Chỉ Dược',
    'Tăng 30 máu cho 1 nhân vật trong lúc chiến đấu.',
    2,
  ),
  med(
    'med_cuongSinhDan',
    'Cường Sinh Đan',
    'Tăng 300 máu cho 1 nhân vật trong lúc chiến đấu.',
    20,
  ),
  med(
    'med_gioiThuy',
    'Giới Thủy',
    'Tăng máu cho tất cả nhân vật phe mình trong lúc chiến đấu. Lượng máu tăng = 20% lượng máu tối đa của nhân vật.',
    500,
  ),
  med(
    'med_nghenhXuanThao',
    'Ngênh Xuân Thảo',
    'Tăng 600 kinh nghiệm.',
    0,
  ),
  med(
    'med_hoiNguyenHuyet',
    'Hồi Nguyên Huyết',
    'Tăng 100 máu cho 1 nhân vật trong lúc chiến đấu.',
    2,
  ),
  med(
    'med_tieuNguyenDan',
    'Tiểu Nguyên Đan',
    'Tăng 50 nguyên khí trong lúc chiến đấu.',
    10,
  ),
  med(
    'med_daiNguyenDan',
    'Đại Nguyên Đan',
    'Tăng 150 nguyên khí trong lúc chiến đấu.',
    30,
  ),
  med(
    'med_phucNguyenDan',
    'Phục Nguyên Đan',
    'Hồi 100% nguyên khí tối đa trong lúc chiến đấu.',
    80,
  ),
  med(
    'med_daPhucNguyen',
    'Đa Phục Nguyên',
    'Hồi 40% nguyên khí tối đa cho cả đội trong lúc chiến đấu.',
    120,
  ),
  med(
    'med_daoTienQua',
    'Đào tiên quả',
    'Tăng 100 máu cho toàn bộ thành viên trong lúc chiến đấu.',
    20,
  ),
  med(
    'med_boDeQua',
    'Bồ Đề Quả',
    'Tăng 300 kinh nghiệm.',
    0,
  ),
  med(
    'med_diepKhongQua',
    'Diệp Không Quả',
    'Tăng 400 kinh nghiệm.',
    0,
  ),
  med(
    'med_duHaQua',
    'Du Ha Quả',
    'Tăng 500 kinh nghiệm.',
    0,
  ),
  med(
    'med_nghanhXuanThao',
    'Ngênh Xuân Thảo',
    'Tăng 600 kinh nghiệm.',
    0,
  ),
  med(
    'med_haiHoangThao',
    'Hải Hoàng Thảo',
    'Tăng 700 kinh nghiệm.',
    0,
  ),
  med(
    'med_hacBachSongHoa',
    'Hắc Bạch Song Hoa',
    'Tăng 800 kinh nghiệm.',
    0,
  ),
  med(
    'med_hacLienVanNam',
    'Hắc Liên vạn năm',
    'Tăng 10.000 kinh nghiệm.',
    0,
  ),
  med(
    'med_hoaCoQua',
    'Hỏa Cơ Quả',
    'Tăng 900 kinh nghiệm.',
    0,
  ),
  med(
    'med_hoaLienThao',
    'Hóa Liên Thảo',
    'Tăng 1.000 kinh nghiệm.',
    0,
  ),
  med(
    'med_daoTienMoc',
    'Đào Tiên Mộc',
    'Hồi phục toàn bộ nguyên khí trong lúc chiến đấu.',
    0,
  ),
  med(
    'med_ngoDongHoangThao',
    'Ngô Đồng Hoang Thảo',
    'Tăng tổng lực công gấp 4 trong 1 lượt đánh.',
    200,
  ),
  med(
    'med_ngoDongThao',
    'Ngô Đồng Thảo',
    'Tăng tổng lực công gấp 2 trong 1 lượt đánh.',
    50,
  ),
  med(
    'med_huyetLinhDan',
    'Huyết Linh Đan',
    'Tăng tổng lực công gấp 4, đồng thời tổng lực thủ giảm 2 lần, trong 1 lượt đánh.',
    50,
  ),
  med(
    'med_huyetKhoiChu',
    'Huyết Khởi Chú',
    'Máu bị giảm 70%. Tăng lực công kích của võ kỹ lên gấp 4 lần ở những lần tấn công tiếp theo.',
    50,
  ),
];

/** Vật phẩm tab Khác. */
const MISC_DATA: ItemData[] = [
  misc(
    'item_chuyenSinhDan',
    'Chuyển sinh đan',
    'Reset nhân vật về level 1, chơi lại từ đầu. Giữ lại được toàn bộ túi đồ. '
    + 'Các nhân vật đồng đội không còn (thu thập đồng đội ở chương 1, như người chơi mới). '
    + 'Nhân vật chính trở về cảnh giới Luyện Thể, được tặng 3 điểm võ kỹ, mở ra võ kỹ ẩn Tứ Phân Quy Nguyên Khí.',
    0,
  ),
  misc(
    'item_nhanKhongGian',
    'Nhẫn không gian',
    'Tăng số ngăn trong Túi đồ, từ 27 lên 54.',
    500,
  ),
  {
    id: 'cur_tinhThach',
    name: 'Tinh thạch',
    type: 'currency',
    bagTab: 'other',
    ...Z,
    description: 'Tiền trong game.',
    value: 1,
    priceType: 'realMoney',
  },
  misc(
    'item_tichLichDan',
    'Tích Lịch Đạn',
    'Dùng để tấn công kẻ địch trong trận chiến. Lực công kích tương đương 70 điểm tấn công.',
    5,
  ),
  misc(
    'item_moTinhThach',
    'Mỏ Tinh thạch',
    'Mỗi giờ tạo ra 1 Tinh thạch, cho dù người chơi không mở game vẫn được nhận tinh thạch.',
    900,
  ),
  misc(
    'item_loiHoaChau',
    'Lôi Hỏa Châu',
    'Dùng để tấn công kẻ địch trong trận chiến. Lực công kích tương đương 90 điểm tấn công.',
    10,
  ),
  misc(
    'item_nhatTienXuyenTam',
    'Nhất Tiễn Xuyên Tâm',
    'Dùng để tấn công kẻ địch trong trận chiến. Lực công kích tương đương 30 điểm tấn công.',
    1,
  ),
  misc(
    'item_nhatTienSongDieu',
    'Nhất Tiễn Song Điêu',
    'Dùng để tấn công 2 kẻ địch trong trận chiến. Lực công kích mỗi kẻ địch tương đương 30 điểm tấn công.',
    5,
  ),
  misc(
    'item_nhiPhao',
    'Nhị Pháo',
    'Dùng để tấn công 2 kẻ địch trong trận chiến. Lực công kích mỗi kẻ địch tương đương 90 điểm tấn công.',
    20,
  ),
  misc(
    'item_mocKhien',
    'Mộc Khiên',
    'Tăng lực thủ của 1 người (bản thân hoặc đồng đội) thêm 200 điểm.',
    15,
  ),
  misc(
    'item_cuThachKhien',
    'Cự Thạch Khiên',
    'Tăng lực thủ của 1 người (bản thân hoặc đồng đội) thêm 400 điểm.',
    30,
  ),
  misc(
    'item_thuongHaiTangDien',
    'Thương Hải Tang Điền',
    'Mình và 1 đối thủ cùng bị mất 200 máu.',
    100,
  ),
  misc(
    'item_pheVo',
    'Phế võ',
    'Xóa bỏ hết võ kỹ, nhân vật thu lại toàn bộ điểm võ kỹ đã dùng.',
    1000,
  ),
  misc(
    'item_thienQuy',
    'Thiền Quy',
    'Tăng gấp đôi kinh nghiệm khi ở trạng thái Tu Luyện. Thời gian tác dụng: 60 phút.',
    60,
  ),
  misc(
    'item_thatSinhThatTuDo',
    'Thất Sinh Thất Tử Đồ',
    'Tăng tốc 7 lần thời gian tu luyện. Thời gian tác dụng: 60 phút.',
    420,
  ),
  misc(
    'item_hoiThe',
    'Hồi thể',
    'Hồi 25 điểm thể lực.',
    5,
  ),
  {
    id: 'cur_gioiThuy',
    name: 'Giọt Giới Thủy',
    type: 'currency',
    bagTab: 'other',
    ...Z,
    description: 'Tiền tệ cao cấp — dùng tại shop và sự kiện.',
    value: 1,
    priceType: 'gioiThuy',
  },
];

/** Mảnh chế tạo — tab Mảnh. */
const SHARDS_DATA: ItemData[] = [
  shard('mat_xichThietThach', 'Xích Thiết Thạch', '10 mảnh Xích Thiết Thạch + 10 mảnh Xích Thiết Kim = 1 Xích Thiết Đao.'),
  shard('mat_xichThietKim', 'Xích Thiết Kim', '10 mảnh Xích Thiết Thạch + 10 mảnh Xích Thiết Kim = 1 Xích Thiết Đao.'),
  shard('mat_voLuongKim', 'Vô Lượng Kim', '10 mảnh Vô Lượng Kim + 10 mảnh Vô Lượng Thạch = 1 Vô Lượng Thương.'),
  shard('mat_voLuongThach', 'Vô Lượng Thạch', '10 mảnh Vô Lượng Kim + 10 mảnh Vô Lượng Thạch = 1 Vô Lượng Thương.'),
  shard('mat_tichTaThach', 'Tịch Tà Thạch', '10 mảnh Tịch Tà Thạch + 10 mảnh Tịch Tà Kim = 1 Tịch Tà Kiếm.'),
  shard('mat_tichTaKim', 'Tịch Tà Kim', '10 mảnh Tịch Tà Thạch + 10 mảnh Tịch Tà Kim = 1 Tịch Tà Kiếm.'),
  shard('mat_voLangThach', 'Vô Lăng Thạch', '10 mảnh Vô Lăng Thạch + 10 mảnh Vô Lăng Kim = 1 Vô Lăng Thủ.'),
  shard('mat_voLangKim', 'Vô Lăng Kim', '10 mảnh Vô Lăng Thạch + 10 mảnh Vô Lăng Kim = 1 Vô Lăng Thủ.'),
  shard('mat_thuDinhThach', 'Thư Đình Thạch', '10 mảnh Thư Đình Thạch + 10 mảnh Thư Đình Kim = 1 Thư Đình Quán.'),
  shard('mat_thuDinhKim', 'Thư Đình Kim', '10 mảnh Thư Đình Thạch + 10 mảnh Thư Đình Kim = 1 Thư Đình Quán.'),
  shard('mat_ngoMinhKim', 'Ngô Minh Kim', '10 mảnh Ngô Minh Kim + 10 mảnh Ngô Minh Thạch = 1 Ngô Minh Giáp.'),
  shard('mat_ngoMinhThach', 'Ngô Minh Thạch', '10 mảnh Ngô Minh Kim + 10 mảnh Ngô Minh Thạch = 1 Ngô Minh Giáp.'),
  shard('mat_thienLyThach', 'Thiên Lý Thạch', '10 mảnh Thiên Lý Thạch + 10 mảnh Thiên Lý Kim = 1 Thiên Lý Ngoa.'),
  shard('mat_thienLyKim', 'Thiên Lý Kim', '10 mảnh Thiên Lý Thạch + 10 mảnh Thiên Lý Kim = 1 Thiên Lý Ngoa.'),
  shard('mat_coChanThiet', 'Cổ Chân Thiết', '30 Cổ Chân Thiết rèn 1 Cổ Chân Khí.'),
  shard('mat_phongThanThach', 'Phong Thần Thạch', '20 Phong Thần Thạch rèn 1 Phong Thần Khí.'),
];

/** Yêu thú — GDD vật phẩm. */
const BEASTS_DATA: ItemData[] = [
  beast('beast_tieuLongNgu', 'Tiểu Long Ngư', 'Tăng 10 lực công cho nhân vật.', { atk: 10 }, 0),
  beast('beast_haoThienKhuyen', 'Hạo Thiên Khuyển', 'Tăng 10 lực thủ cho nhân vật.', { def: 10 }, 0),
  beast('beast_diemPhuong', 'Diêm Phượng', 'Tăng 10 chỉ số máu cho nhân vật.', { hp: 10 }, 0),
  beast('beast_diaNguu', 'Địa Ngưu', 'Tăng 10 nguyên khí cho nhân vật.', { qi: 10 }, 0),
  beast(
    'beast_hacMieu',
    'Hắc Miêu',
    'Giúp nhân vật sống lại, hồi 50% lượng máu tối đa sau khi chết. Mỗi trận đấu có tác dụng 1 lần.',
    {},
    10_000,
  ),
  beast('beast_bachHau', 'Bạch Hầu', 'Tăng 50 lực công cho nhân vật.', { atk: 50 }, 5_000, 'tinhThach', 'vang'),
  beast('beast_xichHuyetMa', 'Xích Huyết Mã', 'Tăng 50 lực thủ cho nhân vật.', { def: 50 }, 5_000, 'tinhThach', 'vang'),
  beast('beast_kimLong', 'Kim Long', 'Tăng 52 chỉ số máu cho nhân vật.', { hp: 52 }, 5_000, 'tinhThach', 'vang'),
  beast('beast_linhMieu', 'Linh Miêu', 'Tăng 50 nguyên khí cho nhân vật.', { qi: 50 }, 5_000, 'tinhThach', 'vang'),
  beast(
    'beast_uCotLang',
    'U Cốt Lang',
    'Giúp nhân vật Giảm 10% sát thương từ đối thủ. Có tác dụng 5 lần ở mỗi trận đấu.',
    {},
    10_000,
  ),
  beast('beast_xichThietHung', 'Xích Thiết Hùng', 'Tăng 82 lực công cho nhân vật.', { atk: 82 }, 10_000),
  beast('beast_thanhMocXa', 'Thanh Mộc Xà', 'Tăng 88 lực thủ cho nhân vật.', { def: 88 }, 10_000),
  beast('beast_songDauHuyetHo', 'Song Đầu Huyết Hổ', 'Tăng 99 chỉ số máu cho nhân vật.', { hp: 99 }, 10_000),
  beast('beast_bichThuyQuy', 'Bích Thủy Quy', 'Tăng 86 chỉ số nguyên khí cho nhân vật.', { qi: 86 }, 10_000),
  beast(
    'beast_uCocMocYeu',
    'U Cốc Mộc Yêu',
    'Giữ chân 1 nhân vật trong team địch, khiến nó không thể tấn công hay phòng thủ. Ngẫu nhiên và chỉ có tác dụng ở lượt đánh đầu tiên.',
    {},
    10_000,
  ),
  beast(
    'beast_hoaChuBao',
    'Hỏa Chu Bào',
    'Khiến 1 kẻ địch ngẫu nhiên bị lửa thiêu đốt trong 3 lượt đánh, mỗi lượt làm giảm 10% máu tối đa.',
    {},
    10_000,
  ),
  beast(
    'beast_cuuViHo',
    'Cửu Vĩ Hồ',
    'Khiến 1 địch thủ tấn công 1 đồng đội khác trong đội của đối thủ (đánh thường). Ngẫu nhiên và chỉ có tác dụng ở lượt đánh đầu tiên.',
    {},
    10_000,
  ),
  beast(
    'beast_suongNhanBang',
    'Sương Nhạn Băng',
    'Tránh thoát đòn tấn công đầu tiên của địch thủ.',
    {},
    10_000,
  ),
  beast('beast_nguTracKimLong', 'Ngũ Trảo Kim Long', 'Tăng 182 lực công cho nhân vật.', { atk: 182 }, 20_000),
  beast('beast_thanhQuy', 'Thanh Quy', 'Tăng 188 lực thủ cho nhân vật.', { def: 188 }, 20_000),
  beast('beast_hoaKyLan', 'Hỏa Kỳ Lân', 'Tăng 180 chỉ số máu cho nhân vật.', { hp: 180 }, 20_000),
];

export const EQUIPMENT_DATA: ItemData[] = EQUIPMENT_CATALOG;

/** @deprecated Dùng item_chuyenSinhDan */
export const LEGACY_CHUYEN_SINH_DAN_ID = 'med_chuyenSinhDan';

export const ITEMS_DATA: ItemData[] = [
  ...EQUIPMENT_DATA,
  ...MEDICINES_DATA,
  ...BEASTS_DATA,
  ...SHARDS_DATA,
  ...MISC_DATA,
  ...EVENT_ITEMS,
].map(attachItemIcon);

export const ITEMS_BY_ID: Record<string, ItemData> = Object.fromEntries(
  ITEMS_DATA.map((item) => [item.id, item]),
);

export function getItemById(id: string): ItemData | undefined {
  return ITEMS_BY_ID[id] ?? (id === LEGACY_CHUYEN_SINH_DAN_ID ? ITEMS_BY_ID.item_chuyenSinhDan : undefined);
}

export function getItemsByType(type: ItemData['type']): ItemData[] {
  return ITEMS_DATA.filter((item) => item.type === type);
}

export function getItemsByRarity(rarity: ItemData['rarity']): ItemData[] {
  return ITEMS_DATA.filter((item) => item.rarity === rarity);
}
