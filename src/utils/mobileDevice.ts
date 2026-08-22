/** iPhone (Safari, Chrome, Firefox… — đều WebKit trên iOS). */
export function isIphone(): boolean {
  return /iPhone/i.test(navigator.userAgent);
}

export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function isStandalonePwa(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Có nên hiện hướng dẫn "Thêm vào Màn hình chính" trên iPhone. */
export function shouldShowIosAddToHomeHint(): boolean {
  return isIphone() && !isStandalonePwa();
}
