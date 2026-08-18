import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/gameDimensions.ts';
import { GameState } from '../../state/gameState.ts';
import {
  WALLET_BANK_QR_TEXTURE_KEY,
  WALLET_QR_DISPLAY_MAX_H,
  WALLET_QR_DISPLAY_MAX_W,
  buildTransferMemo,
} from '../../data/walletConfig.ts';
import { fitTextureDisplaySize } from '../../utils/iconAssets.ts';
import { ModalBase } from './ModalBase.ts';
import { UI_THEME, clampFontSizePx } from '../theme.ts';
import { UIButton } from '../UIButton.ts';
import { soundManager } from '../../utils/SoundManager.ts';
import { formatVnd } from '../../utils/formatVnd.ts';
import type { WalletTransaction } from '../../managers/WalletManager.ts';

const LEFT_PANEL_W = Math.floor(GAME_WIDTH * 0.34 * 0.9);
const CONTENT_W = GAME_WIDTH - LEFT_PANEL_W;
const MIDDLE_PANEL_W = Math.floor(CONTENT_W / 2);
const RIGHT_PANEL_W = CONTENT_W - MIDDLE_PANEL_W;

const PANEL_LEFT = 0x0d1228;
const PANEL_MIDDLE = 0x111827;
const PANEL_RIGHT = 0x141c38;
const DIVIDER = 0x6b7cad;

const TEXT_GOLD = '#eab308';
const TEXT_WHITE = '#ffffff';
const ROW_H = 28;

function panelCenterX(panelLeft: number, panelWidth: number): number {
  return panelLeft + panelWidth / 2;
}

function formatTxTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

function formatDepositLine(tx: WalletTransaction): string {
  const time = formatTxTime(tx.createdAt);
  if (tx.kind === 'pending_deposit' && tx.status === 'pending') {
    const amount = tx.amountVnd > 0 ? formatVnd(tx.amountVnd) : '—';
    return `Chờ duyệt · ${amount} · ${time}`;
  }
  if (tx.kind === 'deposit' && tx.amountVnd > 0) {
    return `+${formatVnd(tx.amountVnd)} · ${time}`;
  }
  if (tx.amountVnd < 0) {
    return `${formatVnd(tx.amountVnd)} · ${tx.note ?? 'Chi tiêu'} · ${time}`;
  }
  return `${formatVnd(tx.amountVnd)} · ${time}`;
}

export class WalletModal extends ModalBase {
  private historyContainer!: Phaser.GameObjects.Container;
  private balanceText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, onClose?: () => void) {
    super(scene, { title: '💰 Ví Nạp Tiền', fullscreen: true, onClose });
    this.build();
  }

  private build(): void {
    this.container.removeAll(true);
    this.prependFullscreenInputBlocker();

    const gs = GameState.getInstance();
    const balance = gs.walletManager.getBalanceVnd();
    const displayId = gs.getPlayerDisplayId();
    const memo = displayId != null ? buildTransferMemo(displayId) : 'VDT [ID tài khoản]';

    const middleLeft = LEFT_PANEL_W;
    const rightLeft = LEFT_PANEL_W + MIDDLE_PANEL_W;
    const leftX = panelCenterX(0, LEFT_PANEL_W);
    const middleX = panelCenterX(middleLeft, MIDDLE_PANEL_W);
    const rightX = panelCenterX(rightLeft, RIGHT_PANEL_W);

    this.container.add([
      this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, PANEL_RIGHT, 1),
      this.scene.add.rectangle(LEFT_PANEL_W / 2, GAME_HEIGHT / 2, LEFT_PANEL_W, GAME_HEIGHT, PANEL_LEFT, 1),
      this.scene.add.rectangle(middleLeft + MIDDLE_PANEL_W / 2, GAME_HEIGHT / 2, MIDDLE_PANEL_W, GAME_HEIGHT, PANEL_MIDDLE, 1),
      this.scene.add.rectangle(rightLeft + RIGHT_PANEL_W / 2, GAME_HEIGHT / 2, RIGHT_PANEL_W, GAME_HEIGHT, PANEL_RIGHT, 1),
      this.scene.add.rectangle(middleLeft, GAME_HEIGHT / 2, 2, GAME_HEIGHT, DIVIDER, 0.45),
      this.scene.add.rectangle(rightLeft, GAME_HEIGHT / 2, 2, GAME_HEIGHT, DIVIDER, 0.45),
    ]);

    this.buildLeftPanel(leftX, balance);
    this.buildMiddlePanel(middleX, memo);
    this.buildRightPanel(rightX);

    const closeBtn = new UIButton(this.scene, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 44,
      width: 140,
      height: 44,
      label: 'Đóng',
      onClick: () => this.close(),
      addToScene: false,
    });
    this.container.add(closeBtn);
  }

  private buildLeftPanel(leftX: number, balance: number): void {
    this.container.add(
      this.scene.add.text(leftX, 36, '💰 Ví của bạn', {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('20px'),
        color: TEXT_GOLD,
        fontStyle: 'bold',
      }).setOrigin(0.5),
    );

    this.balanceText = this.scene.add.text(leftX, 78, formatVnd(balance), {
      fontFamily: UI_THEME.fontFamilyTitle,
      fontSize: clampFontSizePx('26px'),
      color: TEXT_WHITE,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.container.add([
      this.balanceText,
      this.scene.add.text(leftX, 108, 'Số dư khả dụng', {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('14px'),
        color: TEXT_WHITE,
      }).setOrigin(0.5),
      this.scene.add.text(leftX, 148, 'Lịch sử giao dịch', {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('16px'),
        color: TEXT_GOLD,
        fontStyle: 'bold',
      }).setOrigin(0.5),
    ]);

    this.historyContainer = this.scene.add.container(leftX, 168);
    this.container.add(this.historyContainer);
    this.renderHistory();
  }

  private buildMiddlePanel(middleX: number, memo: string): void {
    const centerY = GAME_HEIGHT / 2 - 20;

    this.container.add([
      this.scene.add.text(middleX, centerY - 120, 'Nội dung chuyển khoản (bắt buộc):', {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('15px'),
        color: TEXT_WHITE,
        align: 'center',
        wordWrap: { width: MIDDLE_PANEL_W - 48 },
      }).setOrigin(0.5),
      this.scene.add.text(middleX, centerY - 82, memo, {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('22px'),
        color: TEXT_GOLD,
        fontStyle: 'bold',
      }).setOrigin(0.5),
      this.scene.add.text(middleX, centerY - 30, 'Liên hệ admin nếu chuyển khoản sai nội dung', {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('14px'),
        color: TEXT_GOLD,
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: MIDDLE_PANEL_W - 40 },
      }).setOrigin(0.5),
      this.scene.add.text(middleX, centerY + 38, 'Sau khi CK, admin xác nhận trong 5–30 phút.', {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('14px'),
        color: TEXT_WHITE,
        align: 'center',
        wordWrap: { width: MIDDLE_PANEL_W - 40 },
      }).setOrigin(0.5),
      this.scene.add.text(middleX, centerY + 72, 'Tiền sẽ được cộng vào ví bên trái.', {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('14px'),
        color: TEXT_WHITE,
        align: 'center',
        wordWrap: { width: MIDDLE_PANEL_W - 40 },
      }).setOrigin(0.5),
      this.scene.add.text(middleX, centerY + 106, 'Zalo hỗ trợ: 0879 805 525', {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('14px'),
        color: TEXT_WHITE,
        align: 'center',
        wordWrap: { width: MIDDLE_PANEL_W - 40 },
      }).setOrigin(0.5),
    ]);

    const copyBtn = new UIButton(this.scene, {
      x: middleX,
      y: centerY + 158,
      width: 180,
      height: 44,
      label: 'Copy nội dung',
      onClick: () => this.copyMemo(memo),
      addToScene: false,
    });

    const reportBtn = new UIButton(this.scene, {
      x: middleX,
      y: centerY + 216,
      width: 280,
      height: 44,
      label: 'Tôi đã chuyển khoản',
      singleLine: true,
      onClick: () => this.reportTransfer(),
      addToScene: false,
    });

    this.container.add([copyBtn, reportBtn]);
  }

  private buildRightPanel(rightX: number): void {
    this.container.add(
      this.scene.add.text(rightX, 48, 'Quét mã để chuyển tiền', {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('20px'),
        color: TEXT_GOLD,
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: RIGHT_PANEL_W - 32 },
      }).setOrigin(0.5),
    );

    const qrKey = WALLET_BANK_QR_TEXTURE_KEY;
    const qrAreaTop = 88;
    const qrAreaH = GAME_HEIGHT - qrAreaTop - 72;

    if (this.scene.textures.exists(qrKey)) {
      const { w, h } = fitTextureDisplaySize(
        this.scene,
        qrKey,
        WALLET_QR_DISPLAY_MAX_W,
        Math.min(WALLET_QR_DISPLAY_MAX_H, qrAreaH),
      );
      this.container.add(
        this.scene.add.image(rightX, qrAreaTop + qrAreaH / 2, qrKey).setDisplaySize(w, h),
      );
    } else {
      this.container.add(
        this.scene.add.text(rightX, qrAreaTop + qrAreaH / 2, 'Đang tải QR...', {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('16px'),
          color: TEXT_WHITE,
          align: 'center',
        }).setOrigin(0.5),
      );
    }
  }

  private renderHistory(): void {
    this.historyContainer.removeAll(true);
    const gs = GameState.getInstance();
    const txs = gs.walletManager.getTransactions().slice(0, 12);

    if (txs.length === 0) {
      this.historyContainer.add(
        this.scene.add.text(0, 0, 'Chưa có giao dịch.\nNạp tiền qua chuyển khoản\npanel bên phải.', {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('14px'),
          color: TEXT_WHITE,
          align: 'center',
          wordWrap: { width: LEFT_PANEL_W - 48 },
          lineSpacing: 4,
        }).setOrigin(0.5, 0),
      );
      return;
    }

    txs.forEach((tx, i) => {
      const color = tx.kind === 'pending_deposit' && tx.status === 'pending'
        ? TEXT_GOLD
        : tx.amountVnd >= 0
          ? '#86efac'
          : '#fca5a5';
      this.historyContainer.add(
        this.scene.add.text(0, i * ROW_H, formatDepositLine(tx), {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('13px'),
          color,
          align: 'center',
          wordWrap: { width: LEFT_PANEL_W - 40 },
        }).setOrigin(0.5, 0),
      );
    });
  }

  private copyMemo(memo: string): void {
    soundManager.playUiClick();
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(memo).then(
        () => this.showToast('Đã copy nội dung CK'),
        () => this.showToast(memo),
      );
      return;
    }
    this.showToast(memo);
  }

  private reportTransfer(): void {
    soundManager.playUiClick();
    const gs = GameState.getInstance();
    gs.walletManager.reportPendingDeposit(0, 'Người chơi báo đã CK');
    gs.persist();
    this.renderHistory();
    this.showToast('Đã ghi nhận — chờ admin xác nhận');
  }
}
