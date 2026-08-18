import type { ItemData, ItemRarity, WeaponType } from '../types/game.ts';
import { formatEquipmentEffect } from '../utils/equipmentDisplay.ts';

type EqSlot = 'weapon' | 'head' | 'body' | 'feet';

interface EqEntry {
  id: string;
  name: string;
  slot: EqSlot;
  weaponType?: WeaponType;
  rarity: ItemRarity;
  atk?: number;
  def?: number;
  hp?: number;
  qi?: number;
  /** Giá Cửa hàng (Tinh thạch). 0 = không bán / drop NPC / Giới Tâm. */
  value?: number;
  priceType?: ItemData['priceType'];
}

/** Danh sách trang bị GDD — chỉ số cố định theo bảng vũ khí. */
const EQ_ENTRIES: EqEntry[] = [
  // --- Thập thánh khí (14) — drop NPC ---
  { id: 'eq_tuDienDao', name: 'Tử Điện Đao', slot: 'weapon', weaponType: 'dao', rarity: 'dong', atk: 5 },
  { id: 'eq_thanhMocThuong', name: 'Thanh Mộc Thương', slot: 'weapon', weaponType: 'thuong', rarity: 'dong', atk: 5 },
  { id: 'eq_thanhPhongKiem', name: 'Thanh Phong Kiếm', slot: 'weapon', weaponType: 'kiem', rarity: 'dong', atk: 5 },
  { id: 'eq_hoVanTy', name: 'Hộ Vân Tý', slot: 'weapon', weaponType: 'quyen', rarity: 'dong', atk: 5 },
  { id: 'eq_nhaiThu', name: 'Nhai Thủ', slot: 'head', rarity: 'dong', hp: 10 },
  { id: 'eq_thanhLinhY', name: 'Thanh Linh Y', slot: 'body', rarity: 'dong', def: 3 },
  { id: 'eq_hanhVanNgoa', name: 'Hành Vân Ngoa', slot: 'feet', rarity: 'dong', def: 3 },
  { id: 'eq_phaNhuocDao', name: 'Phá Nhược Đao', slot: 'weapon', weaponType: 'dao', rarity: 'dong', atk: 15 },
  { id: 'eq_thietLangThuong', name: 'Thiết Lăng Thương', slot: 'weapon', weaponType: 'thuong', rarity: 'dong', atk: 14 },
  { id: 'eq_mocLinhKiem', name: 'Mộc Linh Kiếm', slot: 'weapon', weaponType: 'kiem', rarity: 'dong', atk: 16 },
  { id: 'eq_thietChanTac', name: 'Thiết Chấn Táo', slot: 'weapon', weaponType: 'quyen', rarity: 'dong', atk: 15 },
  { id: 'eq_thanhMocQuan', name: 'Thanh Mộc Quán', slot: 'head', rarity: 'dong', hp: 22 },
  { id: 'eq_bichMocKhai', name: 'Bích Mộc Khải', slot: 'body', rarity: 'dong', def: 8 },
  { id: 'eq_thietCuongKhang', name: 'Thiết Cương Khang', slot: 'feet', rarity: 'dong', def: 7 },

  // --- Bách thánh khí (22) ---
  { id: 'eq_thienSinhNha', name: 'Thiên Sinh Nha', slot: 'weapon', weaponType: 'dao', rarity: 'bac', atk: 25 },
  { id: 'eq_diaLongThuong', name: 'Địa Long Thương', slot: 'weapon', weaponType: 'thuong', rarity: 'bac', atk: 26 },
  { id: 'eq_tinhVanKiem', name: 'Tinh Vân Kiếm', slot: 'weapon', weaponType: 'kiem', rarity: 'bac', atk: 27 },
  { id: 'eq_khaiPhongSao', name: 'Khai Phong Sáo', slot: 'weapon', weaponType: 'quyen', rarity: 'bac', atk: 26 },
  { id: 'eq_thanhNguyetQuan', name: 'Thanh Nguyệt Quán', slot: 'head', rarity: 'bac', hp: 30 },
  { id: 'eq_vanCuongGiap', name: 'Văn Cương Giáp', slot: 'body', rarity: 'bac', def: 12 },
  { id: 'eq_truyPhongNgoa', name: 'Truy Phong Ngoa', slot: 'feet', rarity: 'bac', def: 11 },
  { id: 'eq_khuyenDaXoa', name: 'Khuyến Dạ Xoa', slot: 'weapon', weaponType: 'dao', rarity: 'bac', atk: 40, value: 1000 },
  { id: 'eq_phongNguyetThuong', name: 'Phong Nguyệt Thương', slot: 'weapon', weaponType: 'thuong', rarity: 'bac', atk: 39, value: 1000 },
  { id: 'eq_tuHaKiem', name: 'Tử Hà Kiếm', slot: 'weapon', weaponType: 'kiem', rarity: 'bac', atk: 38, value: 1000 },
  { id: 'eq_longLanQuyenTao', name: 'Long Lân Quyền Táo', slot: 'weapon', weaponType: 'quyen', rarity: 'bac', atk: 38, value: 1000 },
  { id: 'eq_linhHuDinh', name: 'Linh Hư Đỉnh', slot: 'head', rarity: 'bac', hp: 44, value: 1000 },
  { id: 'eq_tuHaBao', name: 'Tử Hà Bào', slot: 'body', rarity: 'bac', def: 19, value: 1000 },
  { id: 'eq_langKhongNgoa', name: 'Lăng Không Ngoa', slot: 'feet', rarity: 'bac', def: 21, value: 1000 },
  { id: 'eq_xichThietDao', name: 'Xích Thiết Đao', slot: 'weapon', weaponType: 'dao', rarity: 'bac', atk: 35 },
  { id: 'eq_voLuongThuong', name: 'Vô Lượng Thương', slot: 'weapon', weaponType: 'thuong', rarity: 'bac', atk: 36 },
  { id: 'eq_tichTaKiem', name: 'Tịch Tà Kiếm', slot: 'weapon', weaponType: 'kiem', rarity: 'bac', atk: 36 },
  { id: 'eq_voLangThu', name: 'Vô Lăng Thủ', slot: 'weapon', weaponType: 'quyen', rarity: 'bac', atk: 34 },
  { id: 'eq_thuDinhQuan', name: 'Thư Đình Quán', slot: 'head', rarity: 'bac', hp: 50 },
  { id: 'eq_ngoMinhGiap', name: 'Ngô Minh Giáp', slot: 'body', rarity: 'bac', def: 18 },
  { id: 'eq_thienLyNgoa', name: 'Thiên Lý Ngoa', slot: 'feet', rarity: 'bac', def: 16 },
  { id: 'eq_coChanKhi', name: 'Cổ Chân Khí', slot: 'weapon', rarity: 'bac', atk: 36 },

  // --- Thiên thánh khí (22) ---
  { id: 'eq_phongThanKhi', name: 'Phong Thần Khí', slot: 'weapon', rarity: 'vang', atk: 95 },
  { id: 'eq_tranMaDao', name: 'Trảm Ma Đao', slot: 'weapon', weaponType: 'dao', rarity: 'vang', atk: 66, value: 1500 },
  { id: 'eq_phaKhongThuong', name: 'Phá Không Thương', slot: 'weapon', weaponType: 'thuong', rarity: 'vang', atk: 67, value: 1500 },
  { id: 'eq_langSuongKiem', name: 'Lăng Sương Kiếm', slot: 'weapon', weaponType: 'kiem', rarity: 'vang', atk: 68, value: 1500 },
  { id: 'eq_kimCuongThu', name: 'Kim Cang Thủ', slot: 'weapon', weaponType: 'quyen', rarity: 'vang', atk: 69, value: 1500 },
  { id: 'eq_tuKimDinhQuan', name: 'Tử Kim Đính Quán', slot: 'head', rarity: 'vang', hp: 80, value: 1500 },
  { id: 'eq_cuLinhKhai', name: 'Cự Linh Khải', slot: 'body', rarity: 'vang', def: 32, value: 1500 },
  { id: 'eq_thanhVanHoCuoc', name: 'Thanh Vân Hộ Cước', slot: 'feet', rarity: 'vang', def: 31, value: 1500 },
  { id: 'eq_cuongPhongDao', name: 'Cuồng Phong Đao', slot: 'weapon', weaponType: 'dao', rarity: 'vang', atk: 90, value: 3000 },
  { id: 'eq_xichLoiThuong', name: 'Xích Lôi Thương', slot: 'weapon', weaponType: 'thuong', rarity: 'vang', atk: 90, value: 3000 },
  { id: 'eq_thaiBachKiem', name: 'Thái Bạch Kiếm', slot: 'weapon', weaponType: 'kiem', rarity: 'vang', atk: 90, value: 3000 },
  { id: 'eq_loiMocTy', name: 'Lôi Mộc Tý', slot: 'weapon', weaponType: 'quyen', rarity: 'vang', atk: 90, value: 3000 },
  { id: 'eq_thachCuongKhang', name: 'Thạch Cương Khang', slot: 'head', rarity: 'vang', hp: 110, value: 3000 },
  { id: 'eq_bachHoKhai', name: 'Bạch Hổ Khải', slot: 'body', rarity: 'vang', def: 49, value: 3000 },
  { id: 'eq_tiMaNgoa', name: 'Tị Ma Ngoa', slot: 'feet', rarity: 'vang', def: 55, value: 3000 },
  { id: 'eq_xichNguyetHuyetDao', name: 'Xích Nguyệt Huyết Đao', slot: 'weapon', weaponType: 'dao', rarity: 'vang', atk: 120 },
  { id: 'eq_baVuongKinhThuong', name: 'Bá Vương Kình Thương', slot: 'weapon', weaponType: 'thuong', rarity: 'vang', atk: 120 },
  { id: 'eq_cuuTieuTienKiem', name: 'Cửu Tiêu Tiên Kiếm', slot: 'weapon', weaponType: 'kiem', rarity: 'vang', atk: 120 },
  { id: 'eq_cuuTrongThienThu', name: 'Cửu Trọng Thiên Thủ', slot: 'weapon', weaponType: 'quyen', rarity: 'vang', atk: 120 },
  { id: 'eq_cuuLongThienQuan', name: 'Cửu Long Thiên Quán', slot: 'head', rarity: 'vang', hp: 150 },
  { id: 'eq_thienCamNgheThuong', name: 'Thiên Cấm Nghê Thường', slot: 'body', rarity: 'vang', def: 66 },
  { id: 'eq_cuuTieuDoNgoa', name: 'Cửu Tiêu Độ Ngoa', slot: 'feet', rarity: 'vang', def: 69 },

  // --- Bán thần khí — Cửa hàng (Tinh thạch) ---
  { id: 'eq_cuuNhaiTanDao', name: 'Cửu Nhai Tàn Đao', slot: 'weapon', weaponType: 'dao', rarity: 'kimcuong', atk: 155, value: 6000 },
  { id: 'eq_cuuTieuNganThuong', name: 'Cửu Tiêu Ngân Thương', slot: 'weapon', weaponType: 'thuong', rarity: 'kimcuong', atk: 155, value: 6000 },
  { id: 'eq_huKhongTranThienKiem', name: 'Hư Không Trảm Thiên Kiếm', slot: 'weapon', weaponType: 'kiem', rarity: 'kimcuong', atk: 155, value: 6000 },
  { id: 'eq_voCucThanThu', name: 'Vô Cực Thần Thủ', slot: 'weapon', weaponType: 'quyen', rarity: 'kimcuong', atk: 155, value: 6000 },
  { id: 'eq_hoaThanNgocDinh', name: 'Hóa Thần Ngọc Đính', slot: 'head', rarity: 'kimcuong', hp: 200, value: 6000 },
  { id: 'eq_thaiHuThanGiap', name: 'Thái Hư Thần Giáp', slot: 'body', rarity: 'kimcuong', def: 80, value: 6000 },
  { id: 'eq_diaLongQuaiCuoc', name: 'Địa Long Quải Cước', slot: 'feet', rarity: 'kimcuong', def: 88, value: 6000 },
  { id: 'eq_hacLongPhaThienDao', name: 'Hắc Long Phá Thiên Đao', slot: 'weapon', weaponType: 'dao', rarity: 'kimcuong', atk: 190, value: 9000 },
  { id: 'eq_uMocPhaQuanThuong', name: 'U Mộc Phá Quân Thương', slot: 'weapon', weaponType: 'thuong', rarity: 'kimcuong', atk: 192, value: 9000 },
  { id: 'eq_xichLoiThanKiem', name: 'Xích Lôi Thần Kiếm', slot: 'weapon', weaponType: 'kiem', rarity: 'kimcuong', atk: 198, value: 9000 },
  { id: 'eq_baThienPhaNhuocTao', name: 'Bá Thiên Phá Nhược Táo', slot: 'weapon', weaponType: 'quyen', rarity: 'kimcuong', atk: 199, value: 9000 },
  { id: 'eq_thaiHuBaoDinh', name: 'Thái Hư Bảo Đỉnh', slot: 'head', rarity: 'kimcuong', hp: 222, value: 9000 },
  { id: 'eq_honNguyenKimCuongKhai', name: 'Hỗn Nguyên Kim Cương Khải', slot: 'body', rarity: 'kimcuong', def: 120, value: 9000 },
  { id: 'eq_hoaNguyetHuNgoa', name: 'Hóa Nguyệt Hư Ngoa', slot: 'feet', rarity: 'kimcuong', def: 111, value: 9000 },

  // --- Bán thần khí — Giới Tâm ---
  { id: 'eq_thienHoa', name: 'Thiên Hỏa', slot: 'weapon', rarity: 'kimcuong', atk: 333, priceType: 'gioiThuy' },
  { id: 'eq_honNguyenThienCucQuan', name: 'Hỗn Nguyên Thiên Cực Quán', slot: 'head', rarity: 'kimcuong', hp: 300, priceType: 'gioiThuy' },
  { id: 'eq_cuuThienHuyenNuBao', name: 'Cửu Thiên Huyền Nữ Bào', slot: 'body', rarity: 'kimcuong', def: 300, priceType: 'gioiThuy' },
  { id: 'eq_honNguyenThauThienNgoa', name: 'Hỗn Nguyên Thấu Thiên Ngoa', slot: 'feet', rarity: 'kimcuong', def: 310, priceType: 'gioiThuy' },
];

function buildEquipmentItem(entry: EqEntry): ItemData {
  const atk = entry.atk ?? 0;
  const def = entry.def ?? 0;
  const hp = entry.hp ?? 0;
  const qi = entry.qi ?? 0;
  return {
    id: entry.id,
    name: entry.name,
    slot: entry.slot,
    weaponType: entry.weaponType,
    type: 'equipment',
    atk,
    def,
    hp,
    qi,
    description: formatEquipmentEffect({ atk, def, hp, qi }),
    value: entry.value ?? 0,
    priceType: entry.priceType ?? 'tinhThach',
    rarity: entry.rarity,
  };
}

/** Trang bị có giá Tinh thạch tại Cửa hàng. */
export const SHOP_EQUIPMENT_IDS: readonly string[] = EQ_ENTRIES
  .filter((e) => (e.value ?? 0) > 0)
  .map((e) => e.id);

export const EQUIPMENT_CATALOG: ItemData[] = EQ_ENTRIES.map(buildEquipmentItem);
