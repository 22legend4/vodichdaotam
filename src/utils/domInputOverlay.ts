import type Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameDimensions.ts';

/** Căn input HTML theo canvas Phaser (FIT scale). */
export function syncDomInputToGame(
  el: HTMLElement,
  game: Phaser.Game,
  gameX: number,
  gameY: number,
  gameW: number,
  gameH: number,
): void {
  const canvas = game.canvas;
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / GAME_WIDTH, rect.height / GAME_HEIGHT);
  const offsetX = rect.left + (rect.width - GAME_WIDTH * scale) / 2;
  const offsetY = rect.top + (rect.height - GAME_HEIGHT * scale) / 2;

  el.style.position = 'fixed';
  el.style.left = `${offsetX + (gameX - gameW / 2) * scale}px`;
  el.style.top = `${offsetY + (gameY - gameH / 2) * scale}px`;
  el.style.width = `${gameW * scale}px`;
  el.style.height = `${gameH * scale}px`;
  el.style.zIndex = '10000';
  el.style.pointerEvents = 'auto';
}

/** Tránh Phaser/itch.io nuốt phím khi gõ tên — tắt keyboard plugin lúc focus input. */
export function wireDomTextInput(scene: Phaser.Scene, input: HTMLInputElement): () => void {
  const stopBubble = (event: Event): void => {
    event.stopPropagation();
  };

  const onFocus = (): void => {
    if (scene.input.keyboard) scene.input.keyboard.enabled = false;
  };
  const onBlur = (): void => {
    if (scene.input.keyboard) scene.input.keyboard.enabled = true;
  };

  input.addEventListener('keydown', stopBubble);
  input.addEventListener('keyup', stopBubble);
  input.addEventListener('keypress', stopBubble);
  input.addEventListener('compositionend', stopBubble);
  input.addEventListener('focus', onFocus);
  input.addEventListener('blur', onBlur);

  return () => {
    input.removeEventListener('keydown', stopBubble);
    input.removeEventListener('keyup', stopBubble);
    input.removeEventListener('keypress', stopBubble);
    input.removeEventListener('compositionend', stopBubble);
    input.removeEventListener('focus', onFocus);
    input.removeEventListener('blur', onBlur);
    if (scene.input.keyboard) scene.input.keyboard.enabled = true;
  };
}

/** Vùng bấm trên canvas → focus input (itch thường chặn autofocus iframe). */
export function addDomInputFocusZone(
  scene: Phaser.Scene,
  gameX: number,
  gameY: number,
  gameW: number,
  gameH: number,
  input: HTMLInputElement,
  depth: number,
): Phaser.GameObjects.Zone {
  const zone = scene.add.zone(gameX, gameY, gameW, gameH).setDepth(depth).setInteractive({ useHandCursor: true });
  zone.on('pointerdown', () => {
    input.focus();
  });
  return zone;
}
