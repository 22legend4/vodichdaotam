/** Gói mua Tinh thạch bằng tiền ví (VND). */
export interface TinhThachPackage {
  id: string;
  priceVnd: number;
  tinhThachAmount: number;
}

export const TINH_THACH_PACKAGES: readonly TinhThachPackage[] = [
  { id: 'tt_pkg_100k', priceVnd: 100_000, tinhThachAmount: 300 },
  { id: 'tt_pkg_500k', priceVnd: 500_000, tinhThachAmount: 2_000 },
  { id: 'tt_pkg_1m', priceVnd: 1_000_000, tinhThachAmount: 5_000 },
  { id: 'tt_pkg_5m', priceVnd: 5_000_000, tinhThachAmount: 30_000 },
] as const;

export function getTinhThachPackageById(id: string): TinhThachPackage | undefined {
  return TINH_THACH_PACKAGES.find((pkg) => pkg.id === id);
}
