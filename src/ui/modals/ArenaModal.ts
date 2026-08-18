import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/gameDimensions.ts';
import { GameState } from '../../state/gameState.ts';
import type { ArenaOpponent } from '../../managers/ArenaManager.ts';
import type { CharacterData } from '../../types/game.ts';
import { ModalBase } from './ModalBase.ts';
import { UI_THEME, REALM_LABELS, uiLabelTextStyle } from '../theme.ts';
import { UIButton } from '../UIButton.ts';
import { soundManager } from '../../utils/SoundManager.ts';

const LEFT_PANEL_W = Math.floor(GAME_WIDTH / 3);
const RIGHT_PANEL_X = LEFT_PANEL_W;
const RIGHT_PANEL_W = GAME_WIDTH - LEFT_PANEL_W;

const PANEL_LEFT = 0x0d1228;
const PANEL_RIGHT = 0x141c38;
const ROW_BG = 0x252d52;
const ROW_BORDER = 0x6b7cad;
const ROW_HOVER = 0x3d4f8a;
const TEXT_GOLD = '#eab308';
const TEXT_MUTED = '#9aa8c4';

const INPUT_GAME_W = Math.min(280, LEFT_PANEL_W - 48);
const INPUT_GAME_H = 44;

function leftPanelCenterX(): number {
  return LEFT_PANEL_W / 2;
}

function rightPanelCenterX(): number {
  return RIGHT_PANEL_X + RIGHT_PANEL_W / 2;
}

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

function formatExp(n: number): string {
  return n.toLocaleString('vi-VN');
}

export class ArenaModal extends ModalBase {
  private betInput: HTMLInputElement | null = null;
  private inputGameY = 0;
  private listContainer!: Phaser.GameObjects.Container;

  private readonly syncInputLayout = (): void => {
    if (!this.betInput) return;
    syncInputToCanvas(
      this.betInput,
      this.scene.game,
      leftPanelCenterX(),
      this.inputGameY,
      INPUT_GAME_W,
      INPUT_GAME_H,
    );
  };

  constructor(scene: Phaser.Scene, onClose?: () => void) {
    super(scene, { title: '⚔ Võ Đài Thách Đấu', fullscreen: true, onClose });
    this.build();
    this.scene.scale.on('resize', this.syncInputLayout);
    this.container.once('destroy', () => this.destroyBetInput());
  }

  close(): void {
    this.destroyBetInput();
    super.close();
  }

  private destroyBetInput(): void {
    this.scene.scale.off('resize', this.syncInputLayout);
    this.betInput?.remove();
    this.betInput = null;
  }

  private build(): void {
    const gs = GameState.getInstance();
    const mc = gs.characterManager.getMainCharacter();

    this.container.add([
      this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, PANEL_RIGHT, 1),
      this.scene.add.rectangle(LEFT_PANEL_W / 2, GAME_HEIGHT / 2, LEFT_PANEL_W, GAME_HEIGHT, PANEL_LEFT, 1),
    ]);

    this.container.add(
      this.scene.add.rectangle(
        RIGHT_PANEL_X + RIGHT_PANEL_W / 2,
        GAME_HEIGHT / 2,
        2,
        GAME_HEIGHT,
        ROW_BORDER,
        0.5,
      ),
    );

    if (!mc) {
      this.container.add(
        this.scene.add.text(rightPanelCenterX(), GAME_HEIGHT / 2, 'Chưa có nhân vật.', {
          ...uiLabelTextStyle(18),
          color: TEXT_MUTED,
        }).setOrigin(0.5),
      );
      this.addCloseButton();
      return;
    }

    const arena = gs.arenaManager;
    const maxBet = arena.getMaxBetExp(mc);
    const realmLabel = REALM_LABELS[mc.realm] ?? mc.realm;

    this.container.add(
      this.scene.add.text(rightPanelCenterX(), 40, '⚔ Võ Đài Thách Đấu', {
        ...uiLabelTextStyle(24, { titleFont: true, bold: true }),
        color: UI_THEME.colors.accentAlt,
      }).setOrigin(0.5),
    );

    this.container.add(
      this.scene.add.text(rightPanelCenterX(), 78, `Thách đấu cùng cảnh giới — ${realmLabel}`, {
        ...uiLabelTextStyle(16),
        color: TEXT_MUTED,
      }).setOrigin(0.5),
    );

    this.buildLeftPanel(mc.exp, maxBet, realmLabel);
    this.buildChallengeList(mc.name, mc.realm);
    this.addCloseButton();
  }

  private buildLeftPanel(playerExp: number, maxBet: number, realmLabel: string): void {
    const cx = leftPanelCenterX();

    this.container.add(
      this.scene.add.text(cx, 48, 'Tạo thách đấu', {
        ...uiLabelTextStyle(22, { titleFont: true, bold: true }),
        color: TEXT_GOLD,
      }).setOrigin(0.5),
    );

    this.container.add(
      this.scene.add.text(cx, 96, `Cảnh giới: ${realmLabel}`, {
        ...uiLabelTextStyle(16),
      }).setOrigin(0.5),
    );

    this.container.add(
      this.scene.add.text(cx, 128, `EXP hiện tại: ${formatExp(playerExp)}`, {
        ...uiLabelTextStyle(16),
      }).setOrigin(0.5),
    );

    this.container.add(
      this.scene.add.text(cx, 160, `Cược tối đa: ${formatExp(maxBet)} EXP`, {
        ...uiLabelTextStyle(15),
        color: TEXT_MUTED,
      }).setOrigin(0.5),
    );

    this.container.add(
      this.scene.add.text(cx, 210, 'Mức cược (EXP)', {
        ...uiLabelTextStyle(17, { bold: true }),
      }).setOrigin(0.5),
    );

    this.inputGameY = 252;
    this.createBetInput(maxBet);

    const createBtn = new UIButton(this.scene, {
      x: cx,
      y: 316,
      width: 220,
      height: 46,
      label: 'Tạo thách đấu',
      onClick: () => this.createChallenge(),
      addToScene: false,
      enabled: maxBet > 0,
    });
    this.container.add(createBtn);

    this.container.add(
      this.scene.add.text(cx, 372, 'Nhập EXP muốn cược và đăng\nlên võ đài để đối thủ nhận.', {
        ...uiLabelTextStyle(14),
        color: TEXT_MUTED,
        align: 'center',
        wordWrap: { width: LEFT_PANEL_W - 40 },
      }).setOrigin(0.5),
    );
  }

  private createBetInput(maxBet: number): void {
    this.betInput = document.createElement('input');
    this.betInput.type = 'number';
    this.betInput.min = '1';
    this.betInput.max = String(Math.max(1, maxBet));
    this.betInput.step = '1';
    this.betInput.inputMode = 'numeric';
    this.betInput.placeholder = 'Nhập EXP cược...';
    this.betInput.autocomplete = 'off';
    this.betInput.value = maxBet > 0 ? String(Math.min(100, maxBet)) : '0';
    this.betInput.style.cssText = `
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
      text-align: center;
    `;

    const app = document.getElementById('app') ?? document.body;
    app.appendChild(this.betInput);
    this.syncInputLayout();
  }

  private parseBetInput(): number {
    const raw = this.betInput?.value?.trim() ?? '';
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  }

  private createChallenge(): void {
    const gs = GameState.getInstance();
    const mc = gs.characterManager.getMainCharacter();
    if (!mc) return;

    soundManager.playUiClick();
    const betExp = this.parseBetInput();
    const result = gs.arenaManager.createChallenge(mc, betExp);
    this.showToast(result.message);
    if (!result.success) return;

    gs.persist();
    this.close();
    new ArenaModal(this.scene);
  }

  private buildChallengeList(playerName: string, realm: ArenaOpponent['realm']): void {
    const gs = GameState.getInstance();
    const mc = gs.characterManager.getMainCharacter();
    if (!mc) return;

    const arena = gs.arenaManager;
    const challenges = arena.getChallengesForRealm(realm, playerName);

    this.listContainer = this.scene.add.container(RIGHT_PANEL_X, 0);
    this.container.add(this.listContainer);

    const listTop = 118;
    const rowH = 56;
    const rowGap = 10;
    const rowW = RIGHT_PANEL_W - 48;
    const rowCx = RIGHT_PANEL_X + RIGHT_PANEL_W / 2;

    if (challenges.length === 0) {
      this.listContainer.add(
        this.scene.add.text(rowCx, listTop + 40, 'Chưa có thách đấu nào.\nHãy tạo thách đấu ở panel trái.', {
          ...uiLabelTextStyle(16),
          color: TEXT_MUTED,
          align: 'center',
          wordWrap: { width: rowW },
        }).setOrigin(0.5, 0),
      );
      return;
    }

    challenges.forEach((opp, i) => {
      const y = listTop + i * (rowH + rowGap) + rowH / 2;
      this.addChallengeRow(rowCx, y, rowW, rowH, opp, mc);
    });
  }

  private addChallengeRow(
    cx: number,
    cy: number,
    width: number,
    height: number,
    opponent: ArenaOpponent,
    player: CharacterData,
  ): void {
    const bg = this.scene.add.rectangle(cx, cy, width, height, ROW_BG, 1)
      .setInteractive({ useHandCursor: true });
    bg.setStrokeStyle(1, ROW_BORDER, 0.75);

    const nameText = this.scene.add.text(cx - width / 2 + 20, cy, opponent.name, {
      ...uiLabelTextStyle(17, { bold: true }),
    }).setOrigin(0, 0.5);

    const betText = this.scene.add.text(cx + width / 2 - 20, cy, `${formatExp(opponent.betExp)} EXP`, {
      ...uiLabelTextStyle(16),
      color: TEXT_GOLD,
    }).setOrigin(1, 0.5);

    bg.on('pointerover', () => bg.setFillStyle(ROW_HOVER, 1));
    bg.on('pointerout', () => bg.setFillStyle(ROW_BG, 1));
    bg.on('pointerup', () => {
      if (opponent.name === player.name) {
        this.showToast('Không thể nhận thách đấu của chính mình!');
        return;
      }
      this.acceptChallenge(player, opponent);
    });

    this.listContainer.add([bg, nameText, betText]);
  }

  private acceptChallenge(player: CharacterData, opponent: ArenaOpponent): void {
    soundManager.playUiClick();
    const gs = GameState.getInstance();
    const arena = gs.arenaManager;
    const betExp = opponent.betExp;

    const betCheck = arena.validateBet(player, betExp);
    if (!betCheck.valid) {
      this.showToast(betCheck.message);
      return;
    }

    const won = arena.simulateMatch(player, opponent);
    const result = arena.resolveChallenge(player, opponent, betExp, won);
    this.showToast(result.message);
    if (!result.success) return;

    gs.persist();
    this.close();
    new ArenaModal(this.scene);
  }

  private addCloseButton(): void {
    const closeBtn = new UIButton(this.scene, {
      x: leftPanelCenterX(),
      y: GAME_HEIGHT - 44,
      width: 140,
      height: 44,
      label: 'Đóng',
      onClick: () => this.close(),
      addToScene: false,
    });
    this.container.add(closeBtn);
  }
}
