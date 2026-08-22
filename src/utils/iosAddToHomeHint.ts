import { shouldShowIosAddToHomeHint } from './mobileDevice.ts';

const HINT_ID = 'vddt-ios-install-hint';

export function mountIosAddToHomeHint(): void {
  if (!shouldShowIosAddToHomeHint()) return;
  if (document.getElementById(HINT_ID)) return;

  const hint = document.createElement('div');
  hint.id = HINT_ID;
  hint.className = 'vddt-ios-install-hint';
  hint.innerHTML = `
    <p class="vddt-ios-install-title">Chơi full màn hình trên iPhone</p>
    <ol class="vddt-ios-install-steps">
      <li>Bấm <strong>Chia sẻ</strong> <span aria-hidden="true">(↑)</span> trên thanh trình duyệt</li>
      <li>Chọn <strong>Thêm vào Màn hình chính</strong></li>
      <li>Mở game từ icon — <strong>xoay ngang</strong> để chơi</li>
    </ol>
  `;
  document.body.appendChild(hint);
}

export function unmountIosAddToHomeHint(): void {
  document.getElementById(HINT_ID)?.remove();
}
