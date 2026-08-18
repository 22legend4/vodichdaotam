import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameDimensions.ts';
import { UI_THEME, clampFontSizePx } from './theme.ts';

export type BattleGuideStep = 'pickSkill' | 'pickTarget' | 'fightNow';

export interface SpotlightSpec {
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'rect' | 'circle';
  /** Bán kính khi shape = circle (mặc định = max(w,h)/2). */
  radius?: number;
}

export interface BattleGuideStepConfig {
  step: BattleGuideStep;
  spotlight: SpotlightSpec;
  instruction: string;
  arrow?: { fromX: number; fromY: number; toX: number; toY: number };
}

const DIM_ALPHA = 0.72;
const HIGHLIGHT_STROKE = 0xfca311;
const INSTRUCTION_COLOR = '#ff4757';
const ARROW_RED = 0xff4757;
const HOLE_PAD = 6;

/** Lớp phủ hướng dẫn trận đấu — làm tối màn hình, chỉ sáng vùng spotlight. */
export class BattleGuideOverlay extends Phaser.GameObjects.Container {
  private dimGfx!: Phaser.GameObjects.Graphics;
  private highlightGfx!: Phaser.GameObjects.Graphics;
  private arrowGfx!: Phaser.GameObjects.Graphics;
  private instructionText!: Phaser.GameObjects.Text;
  private blockZone!: Phaser.GameObjects.Zone;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    this.setDepth(UI_THEME.depth.overlay + 20);
    scene.add.existing(this);

    this.dimGfx = scene.add.graphics();
    this.highlightGfx = scene.add.graphics();
    this.arrowGfx = scene.add.graphics();
    this.instructionText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
      fontFamily: UI_THEME.fontFamilyTitle,
      fontSize: clampFontSizePx('28px'),
      color: INSTRUCTION_COLOR,
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 6,
      align: 'center',
      wordWrap: { width: GAME_WIDTH * 0.55 },
    }).setOrigin(0.5);

    this.blockZone = scene.add.zone(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    this.blockZone.setInteractive();

    this.add([this.dimGfx, this.highlightGfx, this.arrowGfx, this.instructionText, this.blockZone]);
    this.setVisible(false);
  }

  show(config: BattleGuideStepConfig): void {
    this.setVisible(true);
    this.redrawDim(config.spotlight);
    this.redrawHighlight(config.spotlight);
    this.redrawArrow(config.arrow);
    this.layoutInstruction(config);
    this.blockZone.setInteractive({ useHandCursor: false });
  }

  hide(): void {
    this.setVisible(false);
    this.dimGfx.clear();
    this.highlightGfx.clear();
    this.arrowGfx.clear();
    this.blockZone.disableInteractive();
  }

  private layoutInstruction(config: BattleGuideStepConfig): void {
    const { step, spotlight, instruction, arrow } = config;
    if (step === 'pickSkill') {
      const tailX = arrow?.fromX ?? spotlight.x + spotlight.width / 2 + 48;
      const tailY = arrow?.fromY ?? spotlight.y;
      const tailOnRight = arrow ? arrow.fromX >= arrow.toX : true;
      if (tailOnRight) {
        this.instructionText.setOrigin(0, 0.5);
        this.instructionText.setPosition(tailX + 18, tailY);
      } else {
        this.instructionText.setOrigin(1, 0.5);
        this.instructionText.setPosition(tailX - 18, tailY);
      }
      this.instructionText.setWordWrapWidth(280);
    } else if (step === 'pickTarget') {
      this.instructionText.setOrigin(1, 0.5);
      this.instructionText.setPosition(spotlight.x - 120, spotlight.y);
      this.instructionText.setWordWrapWidth(280);
    } else {
      this.instructionText.setOrigin(0.5, 0.5);
      this.instructionText.setPosition(GAME_WIDTH / 2, GAME_HEIGHT * 0.52);
      this.instructionText.setWordWrapWidth(GAME_WIDTH * 0.78);
    }
    this.instructionText.setText(instruction);
  }

  /** Vẽ 4 dải tối quanh vùng sáng — ổn định hơn RenderTexture.erase(). */
  private redrawDim(spot: SpotlightSpec): void {
    this.dimGfx.clear();
    this.dimGfx.fillStyle(0x000000, DIM_ALPHA);

    const halfW =
      spot.shape === 'circle'
        ? (spot.radius ?? Math.max(spot.width, spot.height) / 2) + HOLE_PAD
        : spot.width / 2 + HOLE_PAD;
    const halfH =
      spot.shape === 'circle'
        ? (spot.radius ?? Math.max(spot.width, spot.height) / 2) + HOLE_PAD
        : spot.height / 2 + HOLE_PAD;

    const left = Math.max(0, spot.x - halfW);
    const right = Math.min(GAME_WIDTH, spot.x + halfW);
    const top = Math.max(0, spot.y - halfH);
    const bottom = Math.min(GAME_HEIGHT, spot.y + halfH);

    if (top > 0) {
      this.dimGfx.fillRect(0, 0, GAME_WIDTH, top);
    }
    if (bottom < GAME_HEIGHT) {
      this.dimGfx.fillRect(0, bottom, GAME_WIDTH, GAME_HEIGHT - bottom);
    }
    if (left > 0) {
      this.dimGfx.fillRect(0, top, left, bottom - top);
    }
    if (right < GAME_WIDTH) {
      this.dimGfx.fillRect(right, top, GAME_WIDTH - right, bottom - top);
    }
  }

  private redrawHighlight(spot: SpotlightSpec): void {
    this.highlightGfx.clear();
    this.highlightGfx.lineStyle(4, HIGHLIGHT_STROKE, 1);
    if (spot.shape === 'circle') {
      const r = spot.radius ?? Math.max(spot.width, spot.height) / 2;
      this.highlightGfx.strokeCircle(spot.x, spot.y, r + 4);
    } else {
      this.highlightGfx.strokeRoundedRect(
        spot.x - spot.width / 2,
        spot.y - spot.height / 2,
        spot.width,
        spot.height,
        8,
      );
    }
  }

  private redrawArrow(arrow?: BattleGuideStepConfig['arrow']): void {
    this.arrowGfx.clear();
    if (!arrow) return;

    const { fromX, fromY, toX, toY } = arrow;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const head = 22;
    const wing = 14;
    const tipX = toX;
    const tipY = toY;
    const leftX = tipX - head * Math.cos(angle) + wing * Math.sin(angle);
    const leftY = tipY - head * Math.sin(angle) - wing * Math.cos(angle);
    const rightX = tipX - head * Math.cos(angle) - wing * Math.sin(angle);
    const rightY = tipY - head * Math.sin(angle) + wing * Math.cos(angle);

    this.arrowGfx.lineStyle(12, ARROW_RED, 1);
    this.arrowGfx.beginPath();
    this.arrowGfx.moveTo(fromX, fromY);
    this.arrowGfx.lineTo(toX, toY);
    this.arrowGfx.strokePath();
    this.arrowGfx.fillStyle(ARROW_RED, 1);
    this.arrowGfx.fillTriangle(
      tipX + Math.cos(angle) * 3,
      tipY + Math.sin(angle) * 3,
      leftX + Math.cos(angle) * 2,
      leftY + Math.sin(angle) * 2,
      rightX + Math.cos(angle) * 2,
      rightY + Math.sin(angle) * 2,
    );

    this.arrowGfx.lineStyle(8, 0xffffff, 1);
    this.arrowGfx.beginPath();
    this.arrowGfx.moveTo(fromX, fromY);
    this.arrowGfx.lineTo(toX, toY);
    this.arrowGfx.strokePath();
    this.arrowGfx.fillStyle(0xffffff, 1);
    this.arrowGfx.fillTriangle(tipX, tipY, leftX, leftY, rightX, rightY);
  }
}
