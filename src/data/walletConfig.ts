/** Thông tin chuyển khoản Techcombank — VietQR. */
export const WALLET_BANK_CONFIG = {
  bankName: 'Techcombank',
  accountNumber: '1903 1553 8966 69',
  accountHolder: 'NGUYEN PHUC LINH',
  qrImagePath: '/assets/ui/bank-qr.png',
  transferMemoPrefix: 'VDT',
} as const;

export const WALLET_BANK_QR_TEXTURE_KEY = 'wallet_bank_qr';

/**
 * Khung hiển thị QR trên panel phải (px logic game 1280×720).
 * Ảnh nguồn nên lớn hơn 2× khung này để nét trên màn Retina.
 */
export const WALLET_QR_DISPLAY_MAX_W = 380;
export const WALLET_QR_DISPLAY_MAX_H = 520;

/**
 * Gợi ý kích thước file PNG gửi lại:
 *
 * **Chỉ mã QR (vuông, khuyên dùng cho panel phải):** 1024×1024 px (PNG, nền trắng hoặc trong suốt).
 *
 * **Thẻ VietQR full (logo + QR + napas):** 1200×1600 px (tỷ lệ 3:4) hoặc tối thiểu 600×800 px.
 *
 * Tránh ảnh screenshot nhỏ (<400 px cạnh dài) — sẽ bị vỡ khi phóng to.
 */
export const WALLET_QR_ASSET_RECOMMENDED = {
  qrOnly: { width: 1024, height: 1024, note: 'Chỉ mã QR — nét nhất trên panel phải' },
  fullCard: { width: 1200, height: 1600, note: 'Thẻ VietQR đầy đủ (Techcombank + VietQR)' },
} as const;

export function buildTransferMemo(playerDisplayId: number): string {
  return `${WALLET_BANK_CONFIG.transferMemoPrefix} ${playerDisplayId}`;
}
