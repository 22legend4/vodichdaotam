export interface GiftcodeReward {
  tinhThach?: number;
  gioiThuy?: number;
  items?: { itemId: string; quantity: number }[];
}

export interface GiftcodeDef {
  /** Mã không phân biệt hoa thường. */
  code: string;
  rewards: GiftcodeReward;
  description: string;
}

export const GIFTCODE_DEFINITIONS: GiftcodeDef[] = [
  {
    code: 'VODICH2026',
    rewards: { tinhThach: 100 },
    description: '100 Tinh Thạch',
  },
  {
    code: 'TANTHU',
    rewards: {
      tinhThach: 50,
      items: [{ itemId: 'med_hoiNguyenHuyet', quantity: 2 }],
    },
    description: '50 Tinh Thạch + 2 Hồi Nguyên Huyết',
  },
  {
    code: 'DAOTAM',
    rewards: { tinhThach: 30, gioiThuy: 1 },
    description: '30 Tinh Thạch + 1 Giọt Giới Thủy',
  },
  {
    code: '10000',
    rewards: {
      items: [{ itemId: 'med_hacLienVanNam', quantity: 1 }],
    },
    description: '1 Hắc Liên vạn năm',
  },
  {
    code: 'TT2000',
    rewards: { tinhThach: 2000 },
    description: '2000 Tinh Thạch',
  },
  {
    code: 'NHANKG',
    rewards: {
      items: [{ itemId: 'item_nhanKhongGian', quantity: 1 }],
    },
    description: '1 Nhẫn không gian',
  },
];

const CODE_MAP = new Map(
  GIFTCODE_DEFINITIONS.map((def) => [def.code.toUpperCase(), def]),
);

export function findGiftcode(code: string): GiftcodeDef | undefined {
  return CODE_MAP.get(code.trim().toUpperCase());
}
