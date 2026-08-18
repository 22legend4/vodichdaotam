/** Công thức Luyện Khí — rèn trang bị từ mảnh / nguyên liệu. */
export interface CraftMaterial {
  itemId: string;
  quantity: number;
}

export interface CraftRecipe {
  id: string;
  resultItemId: string;
  materials: CraftMaterial[];
}

export const CRAFT_RECIPES: CraftRecipe[] = [
  {
    id: 'craft_xichThietDao',
    resultItemId: 'eq_xichThietDao',
    materials: [
      { itemId: 'mat_xichThietThach', quantity: 10 },
      { itemId: 'mat_xichThietKim', quantity: 10 },
    ],
  },
  {
    id: 'craft_voLuongThuong',
    resultItemId: 'eq_voLuongThuong',
    materials: [
      { itemId: 'mat_voLuongKim', quantity: 10 },
      { itemId: 'mat_voLuongThach', quantity: 10 },
    ],
  },
  {
    id: 'craft_tichTaKiem',
    resultItemId: 'eq_tichTaKiem',
    materials: [
      { itemId: 'mat_tichTaThach', quantity: 10 },
      { itemId: 'mat_tichTaKim', quantity: 10 },
    ],
  },
  {
    id: 'craft_voLangThu',
    resultItemId: 'eq_voLangThu',
    materials: [
      { itemId: 'mat_voLangThach', quantity: 10 },
      { itemId: 'mat_voLangKim', quantity: 10 },
    ],
  },
  {
    id: 'craft_thuDinhQuan',
    resultItemId: 'eq_thuDinhQuan',
    materials: [
      { itemId: 'mat_thuDinhThach', quantity: 10 },
      { itemId: 'mat_thuDinhKim', quantity: 10 },
    ],
  },
  {
    id: 'craft_ngoMinhGiap',
    resultItemId: 'eq_ngoMinhGiap',
    materials: [
      { itemId: 'mat_ngoMinhKim', quantity: 10 },
      { itemId: 'mat_ngoMinhThach', quantity: 10 },
    ],
  },
  {
    id: 'craft_thienLyNgoa',
    resultItemId: 'eq_thienLyNgoa',
    materials: [
      { itemId: 'mat_thienLyThach', quantity: 10 },
      { itemId: 'mat_thienLyKim', quantity: 10 },
    ],
  },
  {
    id: 'craft_coChanKhi',
    resultItemId: 'eq_coChanKhi',
    materials: [{ itemId: 'mat_coChanThiet', quantity: 30 }],
  },
  {
    id: 'craft_phongThanKhi',
    resultItemId: 'eq_phongThanKhi',
    materials: [{ itemId: 'mat_phongThanThach', quantity: 20 }],
  },
];

const RECIPES_BY_ID: Record<string, CraftRecipe> = Object.fromEntries(
  CRAFT_RECIPES.map((r) => [r.id, r]),
);

export function getCraftRecipeById(id: string): CraftRecipe | undefined {
  return RECIPES_BY_ID[id];
}

export function getCraftRecipeForResult(resultItemId: string): CraftRecipe | undefined {
  return CRAFT_RECIPES.find((r) => r.resultItemId === resultItemId);
}
