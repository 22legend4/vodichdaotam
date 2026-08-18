import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameDimensions.ts';
import { UI_THEME, clampFontSizePx, uiLabelTextStyle } from './theme.ts';
import { ASSET_KEYS } from '../utils/AssetGenerator.ts';
import { createBattleRoundButton } from './battleRoundButton.ts';
import { BATTLE_SURRENDER_ICON_RED } from '../utils/characterSpriteAssets.ts';
import { CountdownTimer } from './CountdownTimer.ts';
import {
  COMMAND_MENU_FIGHT_X,
  COMMAND_MENU_FIGHT_Y,
  COMMAND_MENU_ROUND_SIZE,
} from './CommandMenu.ts';

const ALLY_BAR_W = 100;
const ALLY_HP_H = 22;
const ALLY_QI_H = 18;
const ENEMY_BAR_W = 120;
const ENEMY_HP_H = 26;
const ENEMY_QI_H = 18;
const BAR_VALUE_GAP = 4;
const TOP_HUD_BTN_GAP = 18;

interface UnitSlot {
  unitId: string;
  index: number;
  barW: number;
  hpH: number;
  qiH: number;
  hpBg: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
  hpFill: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
  qiBg?: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
  qiFill?: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
  hpText: Phaser.GameObjects.Text;
  qiText?: Phaser.GameObjects.Text;
  highlight?: Phaser.GameObjects.Rectangle;
}

function addTrayInnerGlow(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  const r = Math.min(3, Math.max(1, h / 2 - 1));
  const top = y - h / 2;
  g.fillStyle(0xffffff, 0.22);
  g.fillRoundedRect(x + 2, top + 2, w - 4, Math.max(1, h * 0.42), Math.max(1, r - 1));
  g.lineStyle(1, 0xffffff, 0.58);
  g.strokeRoundedRect(x + 1, top + 1, w - 2, h - 2, r);
  return g;
}

function makeCompactBar(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  isHp: boolean,
): {
  bg: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
  fill: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
  trayGlow: Phaser.GameObjects.Graphics;
} {
  const bgKey = isHp ? ASSET_KEYS.uiBarCompactHpBg : ASSET_KEYS.uiBarCompactQiBg;
  const fillKey = isHp ? ASSET_KEYS.uiBarCompactHpFill : ASSET_KEYS.uiBarCompactQiFill;
  const fallbackBg = isHp ? 0x4a2020 : 0x1a3050;
  const fallbackFill = isHp ? 0xe74c3c : 0x3498db;
  const trayGlow = addTrayInnerGlow(scene, x, y, w, h);

  if (scene.textures.exists(bgKey) && scene.textures.exists(fillKey)) {
    return {
      bg: scene.add.image(x, y, bgKey).setOrigin(0, 0.5).setDisplaySize(w, h),
      fill: scene.add.image(x + 1, y, fillKey).setOrigin(0, 0.5).setDisplaySize(w - 2, h - 2),
      trayGlow,
    };
  }
  return {
    bg: scene.add.rectangle(x, y, w, h, fallbackBg).setOrigin(0, 0.5),
    fill: scene.add.rectangle(x + 1, y, w - 2, h - 2, fallbackFill).setOrigin(0, 0.5),
    trayGlow,
  };
}

function setBarRatio(
  fill: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image,
  w: number,
  h: number,
  ratio: number,
): void {
  const clamped = Phaser.Math.Clamp(ratio, 0, 1);
  const fw = Math.max(0, (w - 2) * clamped);
  if (fill instanceof Phaser.GameObjects.Image) {
    fill.setDisplaySize(fw, h - 2);
  } else {
    fill.width = fw;
  }
}

function formatBarValue(current: number, max: number): string {
  return `${Math.floor(current)}/${max}`;
}

function makeBarValueText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
): Phaser.GameObjects.Text {
  return scene.add.text(x + w / 2, y, '', {
    fontFamily: UI_THEME.fontFamily,
    fontSize: clampFontSizePx(h >= 20 ? '11px' : '10px'),
    color: '#ffffff',
    fontStyle: 'bold',
    stroke: '#0a0a14',
    strokeThickness: 2,
  }).setOrigin(0.5);
}

export class BattleTopHud extends Phaser.GameObjects.Container {
  readonly countdown: CountdownTimer;
  private allySlots = new Map<string, UnitSlot>();
  private enemySlots = new Map<string, UnitSlot>();
  private turnLabel: Phaser.GameObjects.Text;
  private guideBanner: Phaser.GameObjects.Text;
  private waveCountLabel: Phaser.GameObjects.Text;
  private onSurrender?: () => void;

  constructor(scene: Phaser.Scene, onSurrender: () => void) {
    super(scene, 0, 0);
    this.onSurrender = onSurrender;
    this.setDepth(UI_THEME.depth.hud);
    scene.add.existing(this);

    this.add(scene.add.text(12, 8, 'Phe Ta', {
      fontFamily: UI_THEME.fontFamilyTitle,
      fontSize: clampFontSizePx('13px'),
      color: '#74b9ff',
      fontStyle: 'bold',
    }));

    this.add(scene.add.text(GAME_WIDTH - 12, 8, 'Phe Địch', {
      fontFamily: UI_THEME.fontFamilyTitle,
      fontSize: clampFontSizePx('13px'),
      color: '#ff6b6b',
      fontStyle: 'bold',
    }).setOrigin(1, 0));

    this.turnLabel = scene.add.text(GAME_WIDTH / 2, 10, 'Lượt 1', {
      ...uiLabelTextStyle(15),
    }).setOrigin(0.5, 0);
    this.add(this.turnLabel);

    this.guideBanner = scene.add.text(GAME_WIDTH / 2, 130, '', {
      fontFamily: UI_THEME.fontFamily,
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#0a0a14',
      strokeThickness: 4,
      align: 'center',
      wordWrap: { width: GAME_WIDTH - 160 },
      lineSpacing: 10,
    }).setOrigin(0.5, 0).setVisible(false);
    this.add(this.guideBanner);

    const fightR = COMMAND_MENU_ROUND_SIZE / 2;
    const timerR = fightR;
    const timerX = COMMAND_MENU_FIGHT_X + fightR + TOP_HUD_BTN_GAP + timerR + 20;
    const timerY = COMMAND_MENU_FIGHT_Y;
    this.countdown = new CountdownTimer(this.scene, timerX, timerY, { addToScene: false, showLabel: false });
    this.add(this.countdown);

    const surrenderR = COMMAND_MENU_ROUND_SIZE / 2;
    const surrenderX = timerX + timerR + TOP_HUD_BTN_GAP + surrenderR + 40;
    const surrenderY = timerY;
    const surrenderBtn = createBattleRoundButton(
      this.scene,
      surrenderX,
      surrenderY,
      COMMAND_MENU_ROUND_SIZE,
      'surrender',
      BATTLE_SURRENDER_ICON_RED,
      () => this.onSurrender?.(),
      0xffffff,
      Phaser.BlendModes.NORMAL,
    );
    this.add(surrenderBtn);
    this.add(this.scene.add.text(surrenderX, surrenderY + surrenderR + 8, 'Nhận Thua', {
      ...uiLabelTextStyle(13),
    }).setOrigin(0.5, 0));

    this.waveCountLabel = scene.add.text(surrenderX + surrenderR + 50, surrenderY, '', {
      ...uiLabelTextStyle(14),
      color: '#ffffff',
    }).setOrigin(0, 0.5).setVisible(false);
    this.add(this.waveCountLabel);
  }

  /** Hiển thị tổng số đợt tấn công. */
  setAttackWaveCount(totalWaves: number): void {
    if (totalWaves < 1) {
      this.waveCountLabel.setVisible(false);
      return;
    }
    this.waveCountLabel.setText(`${totalWaves} đợt tấn công`);
    this.waveCountLabel.setVisible(true);
  }

  bindAllies(unitIds: string[]): void {
    this.allySlots.clear();
    const colW = ALLY_BAR_W + 8;
    const startX = 14;
    const baseY = 32;
    const hpY = baseY + 22;
    const qiY = hpY + ALLY_HP_H / 2 + BAR_VALUE_GAP + ALLY_QI_H / 2;
    const highlightH = ALLY_HP_H + BAR_VALUE_GAP + ALLY_QI_H + 8;

    unitIds.slice(0, 5).forEach((id, i) => {
      const x = startX + i * colW;

      const hp = makeCompactBar(this.scene, x, hpY, ALLY_BAR_W, ALLY_HP_H, true);
      const qi = makeCompactBar(this.scene, x, qiY, ALLY_BAR_W, ALLY_QI_H, false);
      const hpText = makeBarValueText(this.scene, x, hpY, ALLY_BAR_W, ALLY_HP_H);
      const qiText = makeBarValueText(this.scene, x, qiY, ALLY_BAR_W, ALLY_QI_H);
      const highlight = this.scene.add.rectangle(
        x + ALLY_BAR_W / 2,
        (hpY + qiY) / 2,
        ALLY_BAR_W + 8,
        highlightH,
        0xfca311,
        0,
      ).setStrokeStyle(2, 0xfca311, 0);

      this.add([
        hp.bg, hp.trayGlow, hp.fill, qi.bg, qi.trayGlow, qi.fill, hpText, qiText, highlight,
      ]);
      this.allySlots.set(id, {
        unitId: id,
        index: i,
        barW: ALLY_BAR_W,
        hpH: ALLY_HP_H,
        qiH: ALLY_QI_H,
        hpBg: hp.bg,
        hpFill: hp.fill,
        qiBg: qi.bg,
        qiFill: qi.fill,
        hpText,
        qiText,
        highlight,
      });
    });
  }

  bindEnemies(unitIds: string[]): void {
    this.enemySlots.clear();
    const barW = ENEMY_BAR_W;
    const baseX = GAME_WIDTH - 16 - barW;
    const baseY = 28;
    const rowH = ENEMY_HP_H + BAR_VALUE_GAP + ENEMY_QI_H;
    const rowGap = 8;

    unitIds.slice(0, 5).forEach((id, i) => {
      const rowTop = baseY + i * (rowH + rowGap);
      const hpY = rowTop + ENEMY_HP_H / 2;
      const qiY = rowTop + ENEMY_HP_H + BAR_VALUE_GAP + ENEMY_QI_H / 2;
      const hp = makeCompactBar(this.scene, baseX, hpY, barW, ENEMY_HP_H, true);
      const qi = makeCompactBar(this.scene, baseX, qiY, barW, ENEMY_QI_H, false);
      const hpText = makeBarValueText(this.scene, baseX, hpY, barW, ENEMY_HP_H);
      const qiText = makeBarValueText(this.scene, baseX, qiY, barW, ENEMY_QI_H);
      const highlight = this.scene.add.rectangle(
        baseX + barW / 2,
        rowTop + rowH / 2,
        barW + 4,
        rowH + 4,
        0xff6b6b,
        0,
      ).setStrokeStyle(2, 0xff6b6b, 0);

      this.add([
        hp.bg, hp.trayGlow, hp.fill, qi.bg, qi.trayGlow, qi.fill, hpText, qiText, highlight,
      ]);
      this.enemySlots.set(id, {
        unitId: id,
        index: i,
        barW,
        hpH: ENEMY_HP_H,
        qiH: ENEMY_QI_H,
        hpBg: hp.bg,
        hpFill: hp.fill,
        qiBg: qi.bg,
        qiFill: qi.fill,
        hpText,
        qiText,
        highlight,
      });
    });
  }

  updateUnit(
    unitId: string,
    currentHp: number,
    maxHp: number,
    currentQi: number,
    maxQi: number,
    isAlly: boolean,
  ): void {
    const slot = isAlly ? this.allySlots.get(unitId) : this.enemySlots.get(unitId);
    if (!slot) return;

    const hpRatio = maxHp > 0 ? currentHp / maxHp : 0;
    setBarRatio(slot.hpFill, slot.barW, slot.hpH, hpRatio);
    slot.hpText.setText(formatBarValue(currentHp, maxHp));

    if (slot.qiFill && slot.qiBg && slot.qiText) {
      const qiRatio = maxQi > 0 ? currentQi / maxQi : 0;
      setBarRatio(slot.qiFill, slot.barW, slot.qiH, qiRatio);
      const showQi = maxQi > 0;
      slot.qiBg.setVisible(showQi);
      slot.qiFill.setVisible(showQi);
      slot.qiText.setVisible(showQi);
      slot.qiText.setText(formatBarValue(currentQi, maxQi));
    }
  }

  setActiveUnit(unitId: string | null): void {
    for (const slot of this.allySlots.values()) {
      slot.highlight?.setStrokeStyle(2, 0xfca311, unitId === slot.unitId ? 1 : 0);
    }
    for (const slot of this.enemySlots.values()) {
      slot.highlight?.setStrokeStyle(2, 0xff6b6b, unitId === slot.unitId ? 1 : 0);
    }
  }

  setTurn(turn: number): void {
    this.turnLabel.setText(`Lượt ${turn}`);
  }

  setGuide(text: string, large = false): void {
    if (large && text) {
      this.guideBanner.setText(text);
      this.guideBanner.setVisible(true);
      this.countdown.setHint('');
    } else {
      this.guideBanner.setVisible(false);
      this.countdown.setHint(text);
    }
  }
}
