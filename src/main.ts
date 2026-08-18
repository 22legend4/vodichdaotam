import Phaser from 'phaser';
import { phaserConfig } from './config/phaserConfig.ts';
import './style.css';

/** Khởi tạo game Phaser – Vô Địch Đạo Tâm. */
const game = new Phaser.Game(phaserConfig);

if (import.meta.env.DEV) {
  (globalThis as typeof globalThis & { __VDDT_GAME__?: Phaser.Game }).__VDDT_GAME__ = game;
}
