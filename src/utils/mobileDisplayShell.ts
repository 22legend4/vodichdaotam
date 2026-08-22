/**
 * Lớp UI mobile: full màn hình, khóa ngang (Android), nhắc xoay ngang (iOS).
 * Lưu ý: iOS Safari không cho web ép xoay máy hay ẩn hoàn toàn thanh địa chỉ —
 * cách tốt nhất là "Thêm vào Màn hình chính" (PWA).
 */

import { isTouchDevice, isStandalonePwa, isIphone } from './mobileDevice.ts';

const PORTRAIT_OVERLAY_ID = 'vddt-portrait-overlay';
const CONTROLS_ID = 'vddt-mobile-controls';
const TOAST_ID = 'vddt-mobile-toast';

function isPortrait(): boolean {
  return window.matchMedia('(orientation: portrait)').matches;
}

function showToast(message: string, ms = 3200): void {
  let toast = document.getElementById(TOAST_ID);
  if (!toast) {
    toast = document.createElement('div');
    toast.id = TOAST_ID;
    toast.className = 'vddt-mobile-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('visible');
  window.setTimeout(() => toast?.classList.remove('visible'), ms);
}

function updatePortraitOverlay(): void {
  const overlay = document.getElementById(PORTRAIT_OVERLAY_ID);
  if (!overlay) return;
  const show = isTouchDevice() && isPortrait() && !document.fullscreenElement;
  overlay.classList.toggle('visible', show);
}

async function tryLockLandscape(): Promise<boolean> {
  const orientation = screen.orientation as ScreenOrientation & {
    lock?: (type: 'landscape' | 'landscape-primary') => Promise<void>;
  };
  if (!orientation?.lock) return false;
  try {
    await orientation.lock('landscape');
    return true;
  } catch {
    return false;
  }
}

async function enterImmersiveMode(): Promise<void> {
  const root = document.documentElement;
  const request = root.requestFullscreen
    ?? (root as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen;

  if (request) {
    try {
      await request.call(root);
    } catch {
      showToast('Trình duyệt không cho phép full màn hình. Thử "Thêm vào Màn hình chính".');
    }
  } else if (isIphone() && !isStandalonePwa()) {
    showToast('Trên iPhone: bấm Chia sẻ → "Thêm vào Màn hình chính" để chơi full màn hình.');
    return;
  }

  updatePortraitOverlay();

  const locked = await tryLockLandscape();
  if (!locked && isPortrait()) {
    showToast('Xoay ngang điện thoại để chơi (1280×720).');
  }
}

function createPortraitOverlay(): void {
  if (document.getElementById(PORTRAIT_OVERLAY_ID)) return;

  const overlay = document.createElement('div');
  overlay.id = PORTRAIT_OVERLAY_ID;
  overlay.className = 'vddt-portrait-overlay';
  overlay.innerHTML = `
    <div class="vddt-portrait-card">
      <div class="vddt-portrait-icon" aria-hidden="true">📱↻</div>
      <p class="vddt-portrait-title">Xoay ngang để chơi</p>
      <p class="vddt-portrait-hint">Game thiết kế 1280×720 (ngang). Xoay điện thoại sang landscape.</p>
    </div>
  `;
  document.body.appendChild(overlay);
}

function createControlButton(): void {
  if (document.getElementById(CONTROLS_ID)) return;

  const bar = document.createElement('div');
  bar.id = CONTROLS_ID;
  bar.className = 'vddt-mobile-controls';
  bar.innerHTML = `
    <button type="button" class="vddt-mobile-btn" title="Full màn hình & xoay ngang">
      <span class="vddt-mobile-btn-icon" aria-hidden="true">⛶↻</span>
      <span class="vddt-mobile-btn-label">Full ngang</span>
    </button>
  `;

  bar.querySelector('.vddt-mobile-btn')?.addEventListener('click', () => {
    void enterImmersiveMode();
  });

  document.body.appendChild(bar);
}

export function initMobileDisplayShell(): void {
  if (!isTouchDevice()) return;

  createPortraitOverlay();
  createControlButton();
  updatePortraitOverlay();

  window.addEventListener('resize', updatePortraitOverlay);
  window.addEventListener('orientationchange', updatePortraitOverlay);
  document.addEventListener('fullscreenchange', updatePortraitOverlay);

  if (isStandalonePwa()) {
    document.documentElement.classList.add('vddt-standalone');
  }
}
