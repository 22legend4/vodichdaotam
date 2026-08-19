/**
 * URL tới file trong public/ — tương thích Vercel (`/`) và itch.io (`./`).
 * Luôn truyền path dạng `assets/...` (không có slash đầu).
 */
export function publicAssetUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  const normalized = path.replace(/^\//, '');
  return `${base}${normalized}`;
}

export function publicIconsUrl(relativePath: string): string {
  return publicAssetUrl(`assets/icons/${relativePath.replace(/^\//, '')}`);
}
