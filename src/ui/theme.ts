/** Theme & typography – Inter (body/stats/dialogue), Noto Serif (titles/names). */
export const UI_MIN_FONT_PX = 17;
export const UI_FONT_MIN = '17px';

/** Kích thước chữ UI — không nhỏ hơn {@link UI_MIN_FONT_PX}px. */
export function uiFont(px: number): string {
  return `${Math.max(UI_MIN_FONT_PX, px)}px`;
}

/** Chuẩn hóa chuỗi fontSize Phaser (vd. `'14px'`) lên tối thiểu 17px. */
export function clampFontSizePx(size: string | number): string {
  if (typeof size === 'number') return uiFont(size);
  const n = parseInt(size, 10);
  return uiFont(Number.isNaN(n) ? UI_MIN_FONT_PX : n);
}

/** Nhãn/chữ ngoài nút — trắng, viền đen (đọc rõ trên nền ảnh sáng). */
export function uiLabelTextStyle(
  fontSizePx: number,
  options?: { titleFont?: boolean; bold?: boolean },
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: options?.titleFont ? UI_THEME.fontFamilyTitle : UI_THEME.fontFamily,
    fontSize: uiFont(fontSizePx),
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 4,
    ...(options?.bold ? { fontStyle: 'bold' as const } : {}),
  };
}

export const UI_THEME = {
  /** Lời thoại, chỉ số, nút, chat. */
  fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
  /** Tên nhân vật, tiêu đề màn/modal. */
  fontFamilyTitle: '"Noto Serif", "Times New Roman", serif',
  colors: {
    bgDark: '#1a1a2e',
    bgPanel: '#16213e',
    bgPanelLight: '#1f3460',
    accent: '#e94560',
    accentAlt: '#fca311',
    text: '#ffffff',
    textMuted: '#ffffff',
    hp: '#e74c3c',
    hpBg: '#4a2020',
    qi: '#3498db',
    qiBg: '#1a3050',
    success: '#2ecc71',
    damage: '#ff6b6b',
    heal: '#51cf66',
    buff: '#ffd43b',
    control: '#9775fa',
    void: '#868e96',
    button: '#0f3460',
    buttonHover: '#1a508b',
    buttonDisabled: '#333355',
  },
  depth: {
    background: 0,
    units: 10,
    hud: 100,
    dialog: 200,
    overlay: 300,
  },
} as const;

export const WEAPON_LABELS: Record<string, string> = {
  quyen: 'Quyền',
  kiem: 'Kiếm',
  dao: 'Đao',
  thuong: 'Thương',
};

export const REALM_LABELS: Record<string, string> = {
  LuyenThe: 'Luyện Thể',
  NhatTinh: 'Nhất Tinh',
  NhiTinh: 'Nhị Tinh',
  TamTinh: 'Tam Tinh',
  VanNhien: 'Vạn Nhiên',
  TienLinh: 'Tiên Linh',
  GiapLinh: 'Giáp Linh',
  CuLinh: 'Cự Linh',
  Hoang: 'Hoang',
  Huyen: 'Huyền',
  Dia: 'Địa',
  Thien: 'Thiên',
};

export const STAT_LABELS: Record<string, string> = {
  hp: 'Máu',
  atk: 'Công',
  def: 'Thủ',
  qi: 'Nguyên khí',
};

export const STATUS_ICONS: Record<string, { label: string; color: string; textColor?: string }> = {
  controlled: { label: 'Định', color: '#9775fa' },
  pendingControl: { label: 'Sắp định', color: '#b197fc' },
  controlImmune: { label: 'M.Khống', color: '#ffd43b', textColor: '#000000' },
  stealthed: { label: 'Ẩn', color: '#868e96' },
  void: { label: 'Hư Không', color: '#74c0fc' },
  protected: { label: 'Khổ', color: '#ff922b' },
};
