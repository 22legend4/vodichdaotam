import Phaser from 'phaser';
import { phaserConfig } from './config/phaserConfig.ts';
import { initSaveIntegrity } from './utils/saveIntegrity.ts';
import './style.css';

async function boot(): Promise<void> {
  await initSaveIntegrity();
  const game = new Phaser.Game(phaserConfig);

  if (import.meta.env.DEV) {
    (globalThis as typeof globalThis & { __VDDT_GAME__?: Phaser.Game }).__VDDT_GAME__ = game;
  }
}

void boot();
