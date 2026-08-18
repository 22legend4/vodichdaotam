import Phaser from 'phaser';
import { GameState } from '../state/gameState.ts';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameDimensions.ts';
import { addSceneBackground } from '../utils/AssetGenerator.ts';
import { ensureGuestSession } from '../utils/guestSession.ts';
import { generatePlayerDisplayId } from '../utils/playerDisplayId.ts';
import { UI_THEME, UIButton, uiLabelTextStyle } from '../ui/index.ts';
import { soundManager } from '../utils/SoundManager.ts';

/** Màn đăng nhập — Chơi Ngay (tài khoản khách, save localStorage). */
export class LoginScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoginScene' });
  }

  create(): void {
    addSceneBackground(this, 'characterCreation', UI_THEME.depth.background);

    this.add.text(GAME_WIDTH / 2, 120, 'Vô Địch Đạo Tâm', {
      ...uiLabelTextStyle(42, { titleFont: true, bold: true }),
      color: '#eab308',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 178, 'Tu luyện đạo tâm — Vô địch thiên hạ', {
      ...uiLabelTextStyle(22),
    }).setOrigin(0.5);



    new UIButton(this, {
      x: GAME_WIDTH / 2,
      y: 360,
      width: 320,
      height: 56,
      label: 'Vào Game',
      color: 0xc97a4a,
      onClick: () => this.onPlayNow(),
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 48, 'Tận hưởng niềm vui chơi game', {
      ...uiLabelTextStyle(14),
    }).setOrigin(0.5);

    this.input.once('pointerdown', () => soundManager.unlock());
    this.input.keyboard?.once('keydown', () => soundManager.unlock());
  }

  private onPlayNow(): void {
    soundManager.playUiClick();
    const gs = GameState.getInstance();
    // ID chỉ được tạo/lấy khi bấm Chơi Ngay — không hiển thị trước trên màn mở đầu.
    const session = ensureGuestSession(() => {
      const existing = gs.getPlayerDisplayId();
      return existing ?? generatePlayerDisplayId();
    });

    gs.applyGuestSession(session);
    gs.persist();

    this.routeAfterLogin(gs);
  }

  private routeAfterLogin(gs: GameState): void {
    if (!gs.hasMainCharacter()) {
      this.scene.start('CharacterCreationScene');
      return;
    }

    if (!gs.isTutorialComplete()) {
      const mc = gs.characterManager.getMainCharacter();
      if (!mc) {
        this.scene.start('CharacterCreationScene');
        return;
      }
      this.scene.start('TutorialBattleScene', {
        gender: mc.gender,
        weapon: mc.weaponType,
        phase: 'intro',
      });
      return;
    }

    this.scene.start('MainHubScene');
  }
}
