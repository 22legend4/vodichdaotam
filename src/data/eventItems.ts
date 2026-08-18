import type { ItemData } from '../types/game.ts';

/** Trang bị / mảnh sự kiện — yêu thú & dược chính nằm trong itemsData.ts. */
export const EVENT_ITEMS: ItemData[] = [
  {
    id: 'mat_thanhMocQuan',
    name: 'Thanh Mộc Quán (mảnh)',
    type: 'material',
    bagTab: 'shard',
    atk: 0,
    def: 0,
    hp: 0,
    qi: 0,
    description: 'Nguyên liệu quý từ giải đấu.',
    value: 200,
    priceType: 'tinhThach',
    rarity: 'bac',
  },
  {
    id: 'eq_maPhongBaKinh',
    name: 'Ma Phong Ba Kính',
    slot: 'body',
    type: 'equipment',
    atk: 2,
    def: 16,
    hp: 10,
    qi: 2,
    description: 'Quà đăng nhập ngày 23–29.',
    value: 600,
    priceType: 'tinhThach',
    rarity: 'vang',
  },
];

export const BLOODY_ARENA_PRIZE_TIER1 = ['eq_phaNhuocDao', 'eq_thietLangThuong', 'eq_mocLinhKiem', 'eq_thietChanTac'] as const;
export const HOA_SON_PRIZE_TIER1 = ['beast_bachHau', 'beast_xichHuyetMa', 'beast_kimLong', 'beast_linhMieu'] as const;
export const HOA_SON_PRIZE_TIER2 = ['beast_tieuLongNgu', 'beast_haoThienKhuyen', 'beast_diemPhuong', 'beast_diaNguu'] as const;

/** Leo Tháp tầng 33 — chọn 1 trong 4 vũ khí kim cương. */
export const LEO_THAP_FLOOR33_WEAPON_CHOICES = [
  'eq_hacLongPhaThienDao',
  'eq_uMocPhaQuanThuong',
  'eq_xichLoiThanKiem',
  'eq_baThienPhaNhuocTao',
] as const;
