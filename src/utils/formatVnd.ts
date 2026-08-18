/** Định dạng số tiền VND — đơn vị UI: đ */
export function formatVnd(amount: number): string {
  return `${Math.max(0, Math.floor(amount)).toLocaleString('vi-VN')} đ`;
}
