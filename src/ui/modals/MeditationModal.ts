import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/gameDimensions.ts';
import { CULTIVATION_CONSTANTS } from '../../constants/gameRules.ts';
import { GameState } from '../../state/gameState.ts';
import { getItemById } from '../../data/itemsData.ts';
import { resolveAvatarKey, resolveItemIconKey } from '../../utils/AssetGenerator.ts';
import { AVATAR_W, AVATAR_H } from '../../utils/assetDrawCharacters.ts';
import { UI_THEME, clampFontSizePx } from '../theme.ts';
import { runPartyRealmProgressionFlow } from '../realmBreakthroughFlow.ts';
import { ModalBase } from './ModalBase.ts';
import { soundManager } from '../../utils/SoundManager.ts';

const BG_COLOR = 0x0d1b4a;
const RIGHT_PANEL_W = GAME_WIDTH / 4;
const LEFT_PANEL_W = GAME_WIDTH - RIGHT_PANEL_W;
const RIGHT_X = LEFT_PANEL_W + RIGHT_PANEL_W / 2;
const CONTENT_LEFT = 28;
const LEFT_TEXT_W = LEFT_PANEL_W - 56;
const ITEM_ICON_X = CONTENT_LEFT + 18;
const ITEM_TEXT_X = CONTENT_LEFT + 44;
const ITEM_TEXT_MAX_W = 340;
const ITEM_QTY_X = CONTENT_LEFT + 430;
const ITEM_BTN_X = CONTENT_LEFT + 520;
const INPUT_GAME_W = 200;
const INPUT_GAME_H = 44;
const INPUT_GAME_X = CONTENT_LEFT + INPUT_GAME_W / 2;
const CHAR_DISPLAY_H = 440;
const TICK_MS = 1000;

const RULES_TEXT =
  'Tu luyện 1 phút được 4 kinh nghiệm. Tu luyện 1 phút tiêu tốn 1 tinh thạch. '
  + 'Phải mở game để tu luyện, thoát game không tính.\n'
  + 'Thời gian tu luyện sẽ áp dụng cho cả 5 nhân vật. Tức là bỏ ra 1 tinh thạch để tu luyện trong 1 phút '
  + 'thì cả 5 nhân vật đều nhận được thêm 4 kinh nghiệm.';

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

export class MeditationModal extends ModalBase {
  private minuteInput: HTMLInputElement | null = null;
  private inputGameY = 0;
  private statusText!: Phaser.GameObjects.Text;
  private thienQuyQtyText!: Phaser.GameObjects.Text;
  private thatSinhQtyText!: Phaser.GameObjects.Text;
  private ttHintText!: Phaser.GameObjects.Text;
  private heroContainer!: Phaser.GameObjects.Container;
  private spiritTweens: Phaser.Tweens.Tween[] = [];
  private tickEvent: Phaser.Time.TimerEvent | null = null;
  private cultivating = false;
  private targetMinutes = 0;
  private completedMinutes = 0;
  private minuteProgress = 0;

  private readonly onMinuteInputChange = (): void => {
    this.refreshUi();
  };

  private readonly syncInputLayout = (): void => {
    if (!this.minuteInput) return;
    syncInputToCanvas(
      this.minuteInput,
      this.scene.game,
      INPUT_GAME_X,
      this.inputGameY,
      INPUT_GAME_W,
      INPUT_GAME_H,
    );
  };

  constructor(scene: Phaser.Scene, onClose?: () => void) {
    super(scene, { title: '🧘 Tu Luyện', fullscreen: true, onClose });
    this.build();
    this.scene.scale.on('resize', this.syncInputLayout);
    this.container.once('destroy', () => this.cleanup());
  }

  close(): void {
    this.stopCultivation(this.completedMinutes > 0);
    this.cleanup();
    super.close();
  }

  private cleanup(): void {
    this.scene.scale.off('resize', this.syncInputLayout);
    if (this.minuteInput) {
      this.minuteInput.removeEventListener('input', this.onMinuteInputChange);
      this.minuteInput.removeEventListener('change', this.onMinuteInputChange);
      this.minuteInput.remove();
    }
    this.minuteInput = null;
    for (const tw of this.spiritTweens) tw.stop();
    this.spiritTweens = [];
    this.tickEvent?.remove(false);
    this.tickEvent = null;
  }

  private build(): void {
    this.container.add(
      this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, BG_COLOR),
    );

    this.container.add(
      this.scene.add.text(GAME_WIDTH / 2, 36, '🧘 Tu Luyện', {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('22px'),
        color: UI_THEME.colors.accentAlt,
        fontStyle: 'bold',
      }).setOrigin(0.5),
    );

    this.container.add(
      this.scene.add.text(CONTENT_LEFT, 72, 'Quy tắc tu luyện', {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('16px'),
        color: '#ffd600',
        fontStyle: 'bold',
      }).setOrigin(0, 0),
    );
    this.container.add(
      this.scene.add.text(CONTENT_LEFT, 100, RULES_TEXT, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('14px'),
        color: '#ffffff',
        wordWrap: { width: LEFT_TEXT_W },
        lineSpacing: 8,
      }).setOrigin(0, 0),
    );

    this.inputGameY = 278;
    this.container.add(
      this.scene.add.text(CONTENT_LEFT, 232, 'Nhập thời gian tu luyện (Phút)', {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('17px'),
        color: UI_THEME.colors.accentAlt,
      }).setOrigin(0, 0),
    );
    this.createMinuteInput();

    this.container.add(
      this.scene.add.text(CONTENT_LEFT, 316, '📿 Vật phẩm hỗ trợ', {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('16px'),
        color: UI_THEME.colors.accentAlt,
      }).setOrigin(0, 0),
    );
    this.thienQuyQtyText = this.buildItemRow(
      356,
      CULTIVATION_CONSTANTS.THIEN_QUY_ITEM_ID,
      'x2 kinh nghiệm',
      () => this.activateThienQuy(),
    );
    this.thatSinhQtyText = this.buildItemRow(
      414,
      CULTIVATION_CONSTANTS.THAT_SINH_ITEM_ID,
      'x7 tốc độ (x14 khi dùng cả hai)',
      () => this.activateThatSinh(),
    );

    this.statusText = this.scene.add.text(CONTENT_LEFT, 478, '', {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('15px'),
      color: UI_THEME.colors.text,
      wordWrap: { width: LEFT_TEXT_W },
    }).setOrigin(0, 0);
    this.ttHintText = this.scene.add.text(CONTENT_LEFT, 518, '', {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('13px'),
      color: UI_THEME.colors.textMuted,
    }).setOrigin(0, 0);
    this.container.add([this.statusText, this.ttHintText]);

    this.addButton(CONTENT_LEFT + 110, 568, 220, 44, 'Bắt đầu Tu Luyện', () => this.startCultivation());
    this.addButton(CONTENT_LEFT + 350, 568, 220, 44, 'Dừng Tu Luyện', () => this.stopCultivation(true));
    this.addButton(GAME_WIDTH / 2, GAME_HEIGHT - 48, 140, 44, 'Đóng', () => this.close());

    this.heroContainer = this.scene.add.container(RIGHT_X, GAME_HEIGHT / 2 - 10);
    this.container.add(this.heroContainer);
    this.renderHero();
    this.createSpiritEffects();

    this.refreshUi();
  }

  private createMinuteInput(): void {
    this.minuteInput = document.createElement('input');
    this.minuteInput.type = 'number';
    this.minuteInput.min = '1';
    this.minuteInput.max = '9999';
    this.minuteInput.value = '10';
    this.minuteInput.inputMode = 'numeric';
    this.minuteInput.style.cssText = `
      padding: 10px 14px;
      font-size: 18px;
      font-family: ${UI_THEME.fontFamily};
      border: 2px solid #43518a;
      border-radius: 8px;
      background: rgba(15, 20, 48, 0.95);
      color: #ffffff;
      outline: none;
      box-sizing: border-box;
      text-align: center;
      pointer-events: auto;
    `;
    const app = document.getElementById('app') ?? document.body;
    app.appendChild(this.minuteInput);
    this.minuteInput.addEventListener('input', this.onMinuteInputChange);
    this.minuteInput.addEventListener('change', this.onMinuteInputChange);
    this.syncInputLayout();
  }

  private buildItemRow(
    y: number,
    itemId: string,
    effectLabel: string,
    onUse: () => void,
  ): Phaser.GameObjects.Text {
    const item = getItemById(itemId);
    if (!item) {
      return this.scene.add.text(0, 0, 'x0').setVisible(false);
    }

    const iconKey = resolveItemIconKey(itemId);
    if (iconKey && this.scene.textures.exists(iconKey)) {
      const icon = this.scene.add.image(ITEM_ICON_X, y, iconKey).setDisplaySize(36, 36);
      this.container.add(icon);
    }

    const label = this.scene.add.text(ITEM_TEXT_X, y - 10, item.name, {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('14px'),
      color: UI_THEME.colors.text,
    }).setOrigin(0, 0);
    const sub = this.scene.add.text(ITEM_TEXT_X, y + 10, effectLabel, {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('12px'),
      color: UI_THEME.colors.textMuted,
      wordWrap: { width: ITEM_TEXT_MAX_W },
    }).setOrigin(0, 0);
    this.container.add([label, sub]);

    const qtyText = this.scene.add.text(ITEM_QTY_X, y, '', {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('14px'),
      color: UI_THEME.colors.accentAlt,
    }).setOrigin(0, 0.5);
    qtyText.setName(`qty_${itemId}`);
    this.container.add(qtyText);

    this.addButton(ITEM_BTN_X, y, 100, 36, 'Dùng', onUse);
    return qtyText;
  }

  private renderHero(): void {
    this.heroContainer.removeAll(true);
    const gs = GameState.getInstance();
    const mc = gs.characterManager.getMainCharacter();
    if (!mc) {
      this.heroContainer.add(
        this.scene.add.text(0, 0, 'Chưa có nhân vật', {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('16px'),
          color: UI_THEME.colors.textMuted,
          align: 'center',
        }).setOrigin(0.5),
      );
      return;
    }

    const glow = this.scene.add.ellipse(0, CHAR_DISPLAY_H / 2 - 24, 440, 96, 0xffd700, 0.28);
    this.heroContainer.add(glow);
    const glowTween = this.scene.tweens.add({
      targets: glow,
      alpha: { from: 0.18, to: 0.42 },
      scaleX: { from: 0.95, to: 1.08 },
      scaleY: { from: 0.95, to: 1.08 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.spiritTweens.push(glowTween);

    const avatarKey = resolveAvatarKey(mc.id, mc.gender, mc.weaponType, mc.appearanceId);
    if (this.scene.textures.exists(avatarKey)) {
      const img = this.scene.add.image(0, -16, avatarKey);
      const tex = this.scene.textures.get(avatarKey);
      const src = tex.getSourceImage() as { width?: number; height?: number };
      const aspect = (src.width ?? AVATAR_W) / (src.height ?? AVATAR_H);
      const h = avatarKey.startsWith('char_') ? CHAR_DISPLAY_H : AVATAR_H * 4;
      img.setDisplaySize(h * aspect, h);
      img.setY(-32);
      this.heroContainer.add(img);
    }
  }

  private createSpiritEffects(): void {
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const radius = 140 + (i % 3) * 36;
      const mist = this.scene.add.circle(
        Math.cos(angle) * radius,
        Math.sin(angle) * (radius * 0.55) - 48,
        10 + (i % 4) * 5,
        0xffffff,
        0.12 + (i % 3) * 0.04,
      );
      this.heroContainer.add(mist);

      const orbit = this.scene.tweens.add({
        targets: mist,
        x: {
          getEnd: () => mist.x + Phaser.Math.Between(-72, 72),
          getStart: () => mist.x,
        },
        y: {
          getEnd: () => mist.y + Phaser.Math.Between(-56, 56),
          getStart: () => mist.y,
        },
        alpha: { from: 0.06, to: 0.28 },
        duration: 1800 + i * 180,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.spiritTweens.push(orbit);
    }
  }

  private getInputMinutes(): number {
    const raw = parseInt(this.minuteInput?.value ?? '1', 10);
    if (!Number.isFinite(raw) || raw < 1) return 1;
    return Math.min(9999, raw);
  }

  private activateThienQuy(): void {
    const gs = GameState.getInstance();
    const result = gs.cultivationManager.activateThienQuy(gs.inventoryManager);
    this.showToast(result.message);
    if (result.success) {
      soundManager.playItemPickup();
      gs.persist();
    }
    this.refreshUi();
  }

  private activateThatSinh(): void {
    const gs = GameState.getInstance();
    const result = gs.cultivationManager.activateThatSinh(gs.inventoryManager);
    this.showToast(result.message);
    if (result.success) {
      soundManager.playItemPickup();
      gs.persist();
    }
    this.refreshUi();
  }

  private startCultivation(): void {
    if (this.cultivating) {
      this.showToast('Đang tu luyện...');
      return;
    }
    const gs = GameState.getInstance();
    if (!gs.characterManager.getMainCharacter()) {
      this.showToast('Chưa có nhân vật.');
      return;
    }
    if (gs.characterManager.getParty().length === 0) {
      this.showToast('Không có đội hình.');
      return;
    }

    this.targetMinutes = this.getInputMinutes();
    this.completedMinutes = 0;
    this.minuteProgress = 0;
    this.cultivating = true;
    if (this.minuteInput) this.minuteInput.disabled = true;

    this.tickEvent?.remove(false);
    this.tickEvent = this.scene.time.addEvent({
      delay: TICK_MS,
      loop: true,
      callback: () => this.onCultivationTick(),
    });
    this.refreshUi();
    this.showToast(`Bắt đầu tu luyện ${this.targetMinutes} phút.`);
  }

  private onCultivationTick(): void {
    if (!this.cultivating) return;

    const gs = GameState.getInstance();
    const speed = gs.cultivationManager.getSpeedMultiplier();
    this.minuteProgress += speed / 60;

    while (this.minuteProgress >= 1 && this.cultivating) {
      this.minuteProgress -= 1;
      if (!this.processOneCultivationMinute(gs)) {
        this.stopCultivation(true);
        return;
      }
    }

    this.refreshUi();

    if (this.completedMinutes >= this.targetMinutes) {
      this.showToast('Hoàn thành tu luyện!');
      this.stopCultivation(true);
    }
  }

  private processOneCultivationMinute(gs: GameState): boolean {
    if (!gs.inventoryManager.spendTinhThach(CULTIVATION_CONSTANTS.TT_PER_MINUTE)) {
      this.showToast('Hết Tinh Thạch — dừng tu luyện.');
      return false;
    }

    const expGain = CULTIVATION_CONSTANTS.EXP_PER_MINUTE * gs.cultivationManager.getExpMultiplier();
    for (const char of gs.characterManager.getParty()) {
      gs.characterManager.addExp(char.id, expGain);
    }
    this.completedMinutes += 1;
    gs.persist();
    return true;
  }

  private stopCultivation(runProgression: boolean): void {
    const hadSession = this.cultivating || this.completedMinutes > 0;
    if (!hadSession && !runProgression) return;

    this.cultivating = false;
    this.tickEvent?.remove(false);
    this.tickEvent = null;
    if (this.minuteInput) this.minuteInput.disabled = false;

    if (runProgression && this.completedMinutes > 0) {
      runPartyRealmProgressionFlow(this.scene, () => {
        this.refreshUi();
      });
      return;
    }

    this.refreshUi();
  }

  private refreshUi(): void {
    const gs = GameState.getInstance();
    const cm = gs.cultivationManager;

    const thienQty = gs.inventoryManager.getItemQuantity(CULTIVATION_CONSTANTS.THIEN_QUY_ITEM_ID);
    const thatQty = gs.inventoryManager.getItemQuantity(CULTIVATION_CONSTANTS.THAT_SINH_ITEM_ID);
    this.thienQuyQtyText.setText(`x${thienQty}`);
    this.thatSinhQtyText.setText(`x${thatQty}`);

    const tt = gs.inventoryManager.getTinhThach();
    const speed = cm.getSpeedMultiplier();
    const expMult = cm.getExpMultiplier();
    const expPerMin = CULTIVATION_CONSTANTS.EXP_PER_MINUTE * expMult;

    if (this.cultivating) {
      const pct = Math.min(100, Math.floor((this.completedMinutes / this.targetMinutes) * 100));
      this.statusText.setText(
        `Đang tu luyện: ${this.completedMinutes}/${this.targetMinutes} phút (${pct}%)\n`
        + `Tốc độ x${speed} · +${expPerMin} EXP/phút/đồng đội`,
      );
    } else if (this.completedMinutes > 0) {
      this.statusText.setText(`Đã tu luyện ${this.completedMinutes} phút trong phiên này.`);
    } else {
      this.statusText.setText('Sẵn sàng tu luyện.');
    }

    const plannedMinutes = this.cultivating ? this.targetMinutes : this.getInputMinutes();
    const remaining = Math.max(0, plannedMinutes - this.completedMinutes);
    this.ttHintText.setText(
      `Tinh thạch: ${tt.toLocaleString()} · Cần ~${remaining} TT để hoàn thành`,
    );
  }
}
