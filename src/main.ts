import Phaser from 'phaser';
import { phaserConfig } from './config/phaserConfig.ts';
import { initSaveIntegrity } from './utils/saveIntegrity.ts';
import { initMobileDisplayShell } from './utils/mobileDisplayShell.ts';
import { GameState } from './state/gameState.ts';
import './style.css';

async function boot(): Promise<void> {
  await initSaveIntegrity();
  initMobileDisplayShell();
  const game = new Phaser.Game(phaserConfig);

  if (import.meta.env.DEV) {
    (globalThis as typeof globalThis & { __VDDT_GAME__?: Phaser.Game }).__VDDT_GAME__ = game;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void GameState.getInstance().flushSave();
    }
  });
}

void boot();
