import Phaser from 'phaser';
import { GameState } from '../state/gameState.ts';
import { generateAllAssets } from '../utils/AssetGenerator.ts';
import { queueCharacterSpriteLoads, purgeBrokenTexture, bakeBattleSurrenderIcon, MAP_STAGE_SWORD_ICON, HUB_MAP_WORLD_ICON, BATTLE_FIGHT_ICON, BATTLE_BAG_ICON, BATTLE_SURRENDER_ICON } from '../utils/characterSpriteAssets.ts';
import { queueNpcSpriteLoads, purgeBrokenNpcPortraits } from '../utils/npcSpriteAssets.ts';
import { queueExternalIconLoads, queueItemIconLoads, queueHubStatIconLoads } from '../utils/iconAssets.ts';
import { queueSkillIconLoads } from '../utils/skillIconAssets.ts';
import { queueTeleportGateIconLoads } from '../utils/teleportGateAssets.ts';
import { ASSET_KEYS } from '../utils/AssetGenerator.ts';
import { logGameFlowReport } from '../utils/GameFlowValidator.ts';
import { soundManager } from '../utils/SoundManager.ts';
import { UI_THEME } from '../ui/theme.ts';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn('[BootScene] Không load được asset:', file.key, file.url);
    });
    queueCharacterSpriteLoads(this);
    queueNpcSpriteLoads(this);
    queueExternalIconLoads(this);
    queueItemIconLoads(this);
    queueHubStatIconLoads(this);
    queueSkillIconLoads(this);
    queueTeleportGateIconLoads(this);
  }

  create(): void {
    this.cleanupDomInputs();

    purgeBrokenTexture(this, ASSET_KEYS.bgMeditation);
    purgeBrokenTexture(this, ASSET_KEYS.bgVillage);
    purgeBrokenTexture(this, ASSET_KEYS.bgChapter1Arena);
    purgeBrokenTexture(this, ASSET_KEYS.bgChapter2Map);
    purgeBrokenTexture(this, ASSET_KEYS.bgChapter2Arena);
    purgeBrokenTexture(this, ASSET_KEYS.bgChapter3Map);
    purgeBrokenTexture(this, ASSET_KEYS.bgChapter3Arena);
    purgeBrokenTexture(this, ASSET_KEYS.bgChapter4Map);
    purgeBrokenTexture(this, ASSET_KEYS.bgChapter4Arena);
    purgeBrokenTexture(this, ASSET_KEYS.bgChapter5Map);
    purgeBrokenTexture(this, ASSET_KEYS.bgChapter5Arena);
    purgeBrokenTexture(this, ASSET_KEYS.bgChapter6Map);
    purgeBrokenTexture(this, ASSET_KEYS.bgChapter6Arena);
    purgeBrokenTexture(this, ASSET_KEYS.bgChapter78Map);
    purgeBrokenTexture(this, ASSET_KEYS.bgChapter78Arena);
    purgeBrokenTexture(this, ASSET_KEYS.bgChapter9Map);
    purgeBrokenTexture(this, ASSET_KEYS.bgChapter9Arena);
    purgeBrokenTexture(this, ASSET_KEYS.bgPlayerRoster);
    purgeBrokenTexture(this, ASSET_KEYS.bgTeleportGate);
    purgeBrokenTexture(this, MAP_STAGE_SWORD_ICON);
    purgeBrokenTexture(this, HUB_MAP_WORLD_ICON);
    purgeBrokenTexture(this, BATTLE_FIGHT_ICON);
    purgeBrokenTexture(this, BATTLE_BAG_ICON);
    purgeBrokenTexture(this, BATTLE_SURRENDER_ICON);
    bakeBattleSurrenderIcon(this);
    purgeBrokenNpcPortraits(this);
    for (const gender of ['nam', 'nu'] as const) {
      for (let slot = 1; slot <= 4; slot += 1) {
        const id = `${gender}_${slot}`;
        purgeBrokenTexture(this, `char_${id}_idle`);
        purgeBrokenTexture(this, `char_${id}_attack`);
      }
    }

    const statusText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Vô Địch Đạo Tâm\nĐang khởi động...', {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: '24px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);

    this.input.once('pointerdown', () => soundManager.unlock());
    this.input.keyboard?.once('keydown', () => soundManager.unlock());

    try {
      generateAllAssets(this);
    } catch (err) {
      console.error('[BootScene] Asset generation failed:', err);
    }

    void (async () => {
      try {
        logGameFlowReport();
        await GameState.getInstance().loadOrCreate();
      } catch (err) {
        console.error('[BootScene] Load save / flow validation failed:', err);
      }

      try {
        this.routeToLogin();
      } catch (err) {
        console.error('[BootScene] Scene routing failed, fallback to LoginScene:', err);
        this.scene.start('LoginScene');
      }

      statusText.destroy();
    })();
  }

  private routeToLogin(): void {
    this.scene.start('LoginScene');
  }

  /** Gỡ input DOM còn sót (tránh hiện sớm trước CharacterCreation). */
  private cleanupDomInputs(): void {
    document.querySelectorAll('input, textarea, select').forEach((el) => el.remove());
  }
}
