import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/gameDimensions.ts';
import { getStageById } from '../../data/chaptersData.ts';
import { GameState } from '../../state/gameState.ts';
import type { MapStageNode } from '../../types/game.ts';
import { formatTrialStageBlock, TRIAL_DEFEAT_RETAIN_NOTE } from '../../utils/trialStageDisplay.ts';
import { UI_THEME, clampFontSizePx } from '../theme.ts';
import { ModalBase } from './ModalBase.ts';

const SCROLL_W = GAME_WIDTH - 56;
const SCROLL_LEFT = (GAME_WIDTH - SCROLL_W) / 2;
const TITLE_Y = 48;
const NOTE_Y = 102;
const SCROLL_TOP = 132;
const FOOTER_H = 88;
const SCROLL_HEIGHT = GAME_HEIGHT - SCROLL_TOP - FOOTER_H;

export class TrialHubInfoModal extends ModalBase {
  private scrollY = 0;
  private maxScroll = 0;
  private contentText!: Phaser.GameObjects.Text;
  private scrollPanStart = { y: 0, scrollY: 0 };
  private scrollPanDragging = false;
  private scrollTeardown: (() => void)[] = [];
  private readonly hub: MapStageNode;
  private readonly onFight: () => void;

  constructor(
    scene: Phaser.Scene,
    hub: MapStageNode,
    onFight: () => void,
    onClose?: () => void,
  ) {
    super(scene, { title: hub.name, fullscreen: true, hideCloseButton: true, onClose });
    this.hub = hub;
    this.onFight = onFight;
    this.container.setDepth(UI_THEME.depth.overlay + 20);
    this.build();
  }

  close(): void {
    for (const off of this.scrollTeardown) off();
    this.scrollTeardown = [];
    super.close();
  }

  private build(): void {
    this.container.add(
      this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0f1628, 0.98),
    );

    this.container.add(
      this.scene.add.text(GAME_WIDTH / 2, TITLE_Y, this.hub.name, {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('24px'),
        color: UI_THEME.colors.accentAlt,
        fontStyle: 'bold',
      }).setOrigin(0.5),
    );

    this.addText(GAME_WIDTH / 2, NOTE_Y, TRIAL_DEFEAT_RETAIN_NOTE, '14px', UI_THEME.colors.accentAlt);

    const maskGfx = this.scene.add.graphics();
    maskGfx.fillStyle(0xffffff);
    maskGfx.fillRect(SCROLL_LEFT, SCROLL_TOP, SCROLL_W, SCROLL_HEIGHT);
    maskGfx.setVisible(false);

    const scrollPanel = this.scene.add.container(GAME_WIDTH / 2, SCROLL_TOP);
    scrollPanel.setMask(maskGfx.createGeometryMask());

    scrollPanel.add(
      this.scene.add
        .rectangle(0, SCROLL_HEIGHT / 2, SCROLL_W, SCROLL_HEIGHT, 0x0f3460, 0.72)
        .setOrigin(0.5)
        .setStrokeStyle(1, 0x2a4a7a, 0.9),
    );

    const clearedIds = GameState.getInstance().progress.clearedStageIds;
    const battleIds = this.hub.trialBattleIds ?? [];
    const blocks: string[] = [];

    for (const stageId of battleIds) {
      const stage = getStageById(stageId);
      if (!stage) continue;
      blocks.push(formatTrialStageBlock(stage, clearedIds.includes(stageId)));
    }

    this.contentText = this.scene.add.text(0, 12, blocks.join('\n\n'), {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('13px'),
      color: UI_THEME.colors.text,
      align: 'left',
      wordWrap: { width: SCROLL_W - 24 },
      lineSpacing: 4,
    }).setOrigin(0.5, 0);
    scrollPanel.add(this.contentText);

    this.maxScroll = Math.max(0, this.contentText.height + 24 - SCROLL_HEIGHT);
    this.applyScroll();

    this.container.add([maskGfx, scrollPanel]);
    this.setupScrollInput();

    this.addButton(GAME_WIDTH / 2 - 120, GAME_HEIGHT - 52, 200, 46, 'Chiến đấu ▶', () => {
      this.close();
      this.onFight();
    });

    this.addButton(GAME_WIDTH / 2 + 120, GAME_HEIGHT - 52, 140, 46, 'Đóng', () => {
      this.close();
    });
  }

  private setupScrollInput(): void {
    const inScrollArea = (p: Phaser.Input.Pointer) =>
      p.x >= SCROLL_LEFT && p.x <= SCROLL_LEFT + SCROLL_W
      && p.y >= SCROLL_TOP && p.y <= SCROLL_TOP + SCROLL_HEIGHT;

    const onDown = (p: Phaser.Input.Pointer) => {
      if (!inScrollArea(p)) return;
      this.scrollPanDragging = true;
      this.scrollPanStart = { y: p.y, scrollY: this.scrollY };
    };

    const onMove = (p: Phaser.Input.Pointer) => {
      if (!this.scrollPanDragging || !p.isDown || this.maxScroll <= 0) return;
      const dy = p.y - this.scrollPanStart.y;
      this.scrollY = Phaser.Math.Clamp(this.scrollPanStart.scrollY + dy, -this.maxScroll, 0);
      this.applyScroll();
    };

    const onUp = () => {
      this.scrollPanDragging = false;
    };

    this.scene.input.on('pointerdown', onDown);
    this.scene.input.on('pointermove', onMove);
    this.scene.input.on('pointerup', onUp);
    this.scrollTeardown.push(
      () => this.scene.input.off('pointerdown', onDown),
      () => this.scene.input.off('pointermove', onMove),
      () => this.scene.input.off('pointerup', onUp),
    );
  }

  private applyScroll(): void {
    this.contentText.y = 12 + this.scrollY;
  }
}
