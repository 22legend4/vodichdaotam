import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/gameDimensions.ts';
import { GameState } from '../../state/gameState.ts';
import { UI_THEME, clampFontSizePx } from '../theme.ts';
import { UIButton } from '../UIButton.ts';
import { ModalBase } from './ModalBase.ts';
import { soundManager } from '../../utils/SoundManager.ts';

const HUB_BTN = 0xc97a4a;
const DANGER_BTN = 0xc0392b;
const INPUT_GAME_W = 360;
const INPUT_GAME_H = 44;

function syncInputToCanvas(
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
}

export class SettingsModal extends ModalBase {
  private giftcodeInput: HTMLInputElement | null = null;
  private statusText!: Phaser.GameObjects.Text;
  private confirmContainer: Phaser.GameObjects.Container | null = null;
  private inputGameY = 0;

  private readonly syncInputLayout = (): void => {
    if (!this.giftcodeInput) return;
    syncInputToCanvas(
      this.giftcodeInput,
      this.scene.game,
      GAME_WIDTH / 2,
      this.inputGameY,
      INPUT_GAME_W,
      INPUT_GAME_H,
    );
  };

  constructor(scene: Phaser.Scene, onClose?: () => void) {
    super(scene, { title: 'Cài Đặt', height: GAME_HEIGHT - 120, onClose });
    this.build();
    this.scene.scale.on('resize', this.syncInputLayout);
    this.container.once('destroy', () => this.destroyGiftcodeInput());
  }

  close(): void {
    this.confirmContainer?.destroy(true);
    this.destroyGiftcodeInput();
    super.close();
  }

  private build(): void {
    const gs = GameState.getInstance();
    const panelTop = GAME_HEIGHT / 2 - (GAME_HEIGHT - 120) / 2;

    const giftTitleY = panelTop + 88;
    this.inputGameY = panelTop + 168;
    const redeemBtnY = this.inputGameY + INPUT_GAME_H / 2 + 12 + 22;
    const statusY = redeemBtnY + 38;
    const accountY = statusY + 52;
    const deleteTitleY = accountY + 58;
    const deleteHintY = deleteTitleY + 30;
    const resetBtnY = deleteHintY + 44;

    this.addText(GAME_WIDTH / 2, giftTitleY, '🎁 Giftcode', '18px', UI_THEME.colors.accentAlt);

    this.createGiftcodeInput();

    this.addButton(GAME_WIDTH / 2, redeemBtnY, 200, 44, 'Nhận thưởng', () => {
      this.redeemGiftcode();
    });

    this.statusText = this.scene.add.text(GAME_WIDTH / 2, statusY, '', {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('14px'),
      color: UI_THEME.colors.success,
      align: 'center',
      wordWrap: { width: GAME_WIDTH - 100 },
    }).setOrigin(0.5, 0);
    this.container.add(this.statusText);

    const accountId = gs.getPlayerDisplayId();
    this.addText(
      GAME_WIDTH / 2,
      accountY,
      `Tài khoản Khách\nID: ${accountId ?? '—'}`,
      '14px',
      UI_THEME.colors.textMuted,
    );

    this.addText(GAME_WIDTH / 2, deleteTitleY, '⚠ Xóa tài khoản', '18px', '#e94560');
    this.addText(
      GAME_WIDTH / 2,
      deleteHintY,
      'Xóa toàn bộ dữ liệu trên máy và bắt đầu lại',
      '13px',
      UI_THEME.colors.textMuted,
    );

    const resetBtn = new UIButton(this.scene, {
      x: GAME_WIDTH / 2,
      y: resetBtnY,
      width: 280,
      height: 48,
      label: 'Xóa tài khoản',
      color: DANGER_BTN,
      onClick: () => this.showResetConfirm(),
      addToScene: false,
    });
    this.container.add(resetBtn);
  }

  private createGiftcodeInput(): void {
    this.giftcodeInput = document.createElement('input');
    this.giftcodeInput.type = 'text';
    this.giftcodeInput.maxLength = 32;
    this.giftcodeInput.placeholder = 'Nhập mã giftcode...';
    this.giftcodeInput.autocomplete = 'off';
    this.giftcodeInput.spellcheck = false;
    this.giftcodeInput.style.cssText = `
      padding: 10px 14px;
      font-size: 16px;
      font-family: ${UI_THEME.fontFamily};
      border: 2px solid #43518a;
      border-radius: 8px;
      background: rgba(15, 20, 48, 0.95);
      color: #ffffff;
      outline: none;
      box-sizing: border-box;
      pointer-events: auto;
      text-transform: uppercase;
    `;

    const app = document.getElementById('app') ?? document.body;
    app.appendChild(this.giftcodeInput);
    this.syncInputLayout();
  }

  private destroyGiftcodeInput(): void {
    this.scene.scale.off('resize', this.syncInputLayout);
    this.giftcodeInput?.remove();
    this.giftcodeInput = null;
  }

  private redeemGiftcode(): void {
    const code = this.giftcodeInput?.value ?? '';
    const gs = GameState.getInstance();
    const result = gs.giftcodeManager.redeem(code, gs.inventoryManager);

    if (result.success) {
      soundManager.playItemPickup();
      gs.persist();
      this.statusText.setColor(UI_THEME.colors.success);
      if (this.giftcodeInput) this.giftcodeInput.value = '';
    } else {
      this.statusText.setColor('#e94560');
    }
    this.statusText.setText(result.message);
  }

  private showResetConfirm(): void {
    this.confirmContainer?.destroy(true);

    const overlay = this.scene.add.container(0, 0).setDepth(UI_THEME.depth.overlay + 2);
    const dim = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55);
    const panel = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 480, 180, 0x16213e, 1);
    panel.setStrokeStyle(2, DANGER_BTN);

    const message = this.scene.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 32,
      'Xóa toàn bộ dữ liệu game trên máy?\nHành động này không thể hoàn tác.',
      {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('16px'),
        color: UI_THEME.colors.text,
        align: 'center',
      },
    ).setOrigin(0.5);

    const yesBtn = new UIButton(this.scene, {
      x: GAME_WIDTH / 2 - 100,
      y: GAME_HEIGHT / 2 + 40,
      width: 160,
      height: 44,
      label: 'Xóa & Reset',
      color: DANGER_BTN,
      onClick: () => this.performReset(),
      addToScene: false,
    });

    const noBtn = new UIButton(this.scene, {
      x: GAME_WIDTH / 2 + 100,
      y: GAME_HEIGHT / 2 + 40,
      width: 140,
      height: 44,
      label: 'Hủy',
      color: HUB_BTN,
      onClick: () => {
        overlay.destroy(true);
        this.confirmContainer = null;
      },
      addToScene: false,
    });

    overlay.add([dim, panel, message, yesBtn, noBtn]);
    this.confirmContainer = overlay;
    this.container.add(overlay);
  }

  private performReset(): void {
    soundManager.playUiClick();
    const gs = GameState.getInstance();
    gs.saveManager.wipeAllLocalData();
    GameState.resetInstance();
    this.destroyGiftcodeInput();
    this.confirmContainer?.destroy(true);
    this.container.destroy(true);
    document.querySelectorAll('input, textarea, select').forEach((el) => el.remove());
    this.scene.scene.start('LoginScene');
  }
}
