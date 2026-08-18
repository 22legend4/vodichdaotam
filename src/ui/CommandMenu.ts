import Phaser from 'phaser';
import type { SkillData } from '../types/game.ts';
import type { CombatUnit } from '../systems/combatTypes.ts';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameDimensions.ts';
import { UI_THEME, clampFontSizePx, uiLabelTextStyle } from './theme.ts';
import { ASSET_KEYS } from '../utils/AssetGenerator.ts';
import { createSkillIcon } from '../utils/skillIconAssets.ts';
import { BATTLE_FIGHT_ICON, BATTLE_BAG_ICON } from '../utils/characterSpriteAssets.ts';
import { createBattleRoundButton } from './battleRoundButton.ts';
import { soundManager } from '../utils/SoundManager.ts';

const FIGHT_CENTER_X = GAME_WIDTH / 2;
/** Dưới nhãn "Lượt N" (~y=10, cao ~24px) + khoảng cách. */
const FIGHT_CENTER_Y = 72;
const FIGHT_LABEL_GAP = 8;

const LONG_PRESS_MS = 300;
const SLOT_SIZE = 64;
const SLOT_GAP = 10;
const ROUND_SIZE = 56;
const ROUND_GAP = 18;
const MARGIN_R = 16;
const MARGIN_B = 16;
const KEY_CODES = ['A', 'S', 'D', 'F'] as const;

export const COMMAND_MENU_SLOT_SIZE = SLOT_SIZE;
export const COMMAND_MENU_FIGHT_X = FIGHT_CENTER_X;
export const COMMAND_MENU_FIGHT_Y = FIGHT_CENTER_Y;
export const COMMAND_MENU_ROUND_SIZE = ROUND_SIZE;

/** Tọa độ tâm 4 ô võ kỹ (a,s,d,f từ trên xuống) – cột sát mép phải, neo đáy. */
export function skillSlotCenters(): { x: number; y: number }[] {
  const cx = GAME_WIDTH - MARGIN_R - SLOT_SIZE / 2;
  const bottomCy = GAME_HEIGHT - MARGIN_B - SLOT_SIZE / 2;
  const step = SLOT_SIZE + SLOT_GAP;
  return [0, 1, 2, 3].map((i) => ({
    x: cx,
    y: bottomCy - (3 - i) * step,
  }));
}

export interface CommandMenuCallbacks {
  onSkillSelect: (skillId: string, category: 'damage' | 'defense') => void;
  onItem: () => void;
  onFightNow: () => void;
}

interface SkillSlotState {
  skill: SkillData | null;
  container: Phaser.GameObjects.Container;
  zone: Phaser.GameObjects.Zone;
  borderRing: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  pressTimer?: Phaser.Time.TimerEvent;
  longPressFired: boolean;
  slotX: number;
  slotY: number;
}

const SLOT_BORDER_DEFAULT = 0xfca311;
const SLOT_BORDER_SELECTED = 0x2ecc71;

export class CommandMenu extends Phaser.GameObjects.Container {
  private slots: SkillSlotState[] = [];
  private tooltip!: Phaser.GameObjects.Container;
  private fightBtn!: Phaser.GameObjects.Container;
  private bagBtn!: Phaser.GameObjects.Container;
  private fightLabel!: Phaser.GameObjects.Text;
  private _enabled = true;
  private _fightEnabled = true;
  private skillFilter: 'all' | 'damage' | 'defense' = 'all';
  private skillsHidden = false;
  private selectedSkillId: string | null = null;
  private keyHandlers: Phaser.Input.Keyboard.Key[] = [];

  constructor(scene: Phaser.Scene, callbacks: CommandMenuCallbacks) {
    super(scene, 0, 0);
    this.setDepth(UI_THEME.depth.hud + 1);
    scene.add.existing(this);

    const centers = skillSlotCenters();
    this.tooltip = scene.add.container(0, 0).setVisible(false).setDepth(UI_THEME.depth.overlay + 2);
    this.add(this.tooltip);

    centers.forEach((pos, i) => {
      const slot = this.createSkillSlot(scene, pos.x, pos.y, i, callbacks);
      this.slots.push(slot);
      this.add(slot.container);
    });

    const bagPos = centers[3]!;
    const roundX = bagPos.x - SLOT_SIZE / 2 - ROUND_GAP - ROUND_SIZE / 2;

    this.fightBtn = createBattleRoundButton(
      scene,
      FIGHT_CENTER_X,
      FIGHT_CENTER_Y,
      ROUND_SIZE,
      'fight',
      BATTLE_FIGHT_ICON,
      () => {
        if (!this._enabled || !this._fightEnabled) return;
        soundManager.playUiClick();
        callbacks.onFightNow();
      },
    );
    this.bagBtn = createBattleRoundButton(
      scene,
      roundX,
      bagPos.y,
      ROUND_SIZE,
      'bag',
      BATTLE_BAG_ICON,
      () => {
        if (!this._enabled) return;
        soundManager.playUiClick();
        callbacks.onItem();
      },
    );
    this.add([this.fightBtn, this.bagBtn]);

    this.fightLabel = scene.add.text(
      FIGHT_CENTER_X,
      FIGHT_CENTER_Y + ROUND_SIZE / 2 + FIGHT_LABEL_GAP,
      'Chiến luôn',
      { ...uiLabelTextStyle(13) },
    ).setOrigin(0.5, 0);
    this.add(this.fightLabel);

    this.add(scene.add.text(roundX, bagPos.y - ROUND_SIZE / 2 - 14, 'Túi đồ', {
      ...uiLabelTextStyle(13),
    }).setOrigin(0.5, 1));

    if (scene.input.keyboard) {
      KEY_CODES.forEach((code, i) => {
        const key = scene.input.keyboard!.addKey(code);
        key.on('down', () => this.triggerSlot(i, callbacks));
        this.keyHandlers.push(key);
      });
    }
  }

  private createSkillSlot(
    scene: Phaser.Scene,
    x: number,
    y: number,
    _index: number,
    callbacks: CommandMenuCallbacks,
  ): SkillSlotState {
    const container = scene.add.container(x, y);
    const frameKey = ASSET_KEYS.uiSkillSlot;
    if (scene.textures.exists(frameKey)) {
      container.add(scene.add.image(0, 0, frameKey));
    } else {
      container.add(scene.add.rectangle(0, 0, SLOT_SIZE, SLOT_SIZE, 0x0f3460).setStrokeStyle(2, 0xfca311));
    }

    const icon = scene.add.rectangle(0, 0, 48, 48, 0x333355, 0.5);
    container.add(icon);

    const borderRing = scene.add
      .rectangle(0, 0, SLOT_SIZE + 2, SLOT_SIZE + 2)
      .setStrokeStyle(2, SLOT_BORDER_DEFAULT)
      .setFillStyle(0x000000, 0);
    container.add(borderRing);

    const zone = scene.add.zone(0, 0, SLOT_SIZE + 8, SLOT_SIZE + 8);
    zone.setInteractive({ useHandCursor: true });

    const state: SkillSlotState = {
      skill: null,
      container,
      zone,
      borderRing,
      icon,
      longPressFired: false,
      slotX: x,
      slotY: y,
    };

    zone.on('pointerdown', () => {
      if (!this._enabled || !state.skill) return;
      state.longPressFired = false;
      state.pressTimer = scene.time.delayedCall(LONG_PRESS_MS, () => {
        state.longPressFired = true;
        if (state.skill) this.showTooltip(state.skill, x, y);
      });
    });

    zone.on('pointerup', () => {
      state.pressTimer?.destroy();
      state.pressTimer = undefined;
      this.hideTooltip();
      if (!this._enabled || !state.skill || state.longPressFired) return;
      soundManager.playUiClick();
      callbacks.onSkillSelect(state.skill.id, state.skill.category);
    });

    zone.on('pointerout', () => {
      state.pressTimer?.destroy();
      state.pressTimer = undefined;
      this.hideTooltip();
      state.longPressFired = false;
    });

    container.add(zone);
    container.bringToTop(borderRing);
    container.bringToTop(zone);
    return state;
  }

  private showTooltip(skill: SkillData, slotX: number, slotY: number): void {
    this.tooltip.removeAll(true);
    const qi = skill.qiCost ?? 0;
    const atk = skill.atkBonus ?? 0;
    const def = skill.defBonus ?? 0;
    const statLine = atk > 0 ? `Công: +${atk}` : def > 0 ? `Thủ: +${def}` : 'Đặc biệt';

    const bg = this.scene.add.rectangle(0, 0, 200, 88, 0x16213e, 0.97).setStrokeStyle(2, 0xfca311);
    const title = this.scene.add.text(0, -28, skill.name, {
      fontFamily: UI_THEME.fontFamilyTitle,
      fontSize: clampFontSizePx('15px'),
      color: UI_THEME.colors.accentAlt,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const qiLine = this.scene.add.text(0, -4, `Qi: ${qi}`, {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('13px'),
      color: UI_THEME.colors.text,
    }).setOrigin(0.5);
    const stat = this.scene.add.text(0, 18, statLine, {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('13px'),
      color: UI_THEME.colors.textMuted,
    }).setOrigin(0.5);

    this.tooltip.add([bg, title, qiLine, stat]);
    this.tooltip.setPosition(slotX - 118, slotY);
    this.tooltip.setVisible(true);
  }

  private hideTooltip(): void {
    this.tooltip.setVisible(false);
  }

  private triggerSlot(index: number, callbacks: CommandMenuCallbacks): void {
    if (!this._enabled) return;
    const state = this.slots[index];
    if (!state?.skill) return;
    soundManager.playUiClick();
    callbacks.onSkillSelect(state.skill.id, state.skill.category);
  }

  bindUnit(unit: CombatUnit | null, getSkillById: (id: string) => SkillData | undefined): void {
    this.hideTooltip();

    if (this.skillsHidden) {
      this.slots.forEach((slot) => {
        slot.skill = null;
        slot.container.setVisible(false);
        zoneEnable(slot.zone, false);
      });
      return;
    }

    const skills = (unit?.skillIds ?? [])
      .map((id) => getSkillById(id))
      .filter((s): s is SkillData => !!s)
      .filter((s) => {
        if (this.skillFilter === 'damage') return s.category === 'damage';
        if (this.skillFilter === 'defense') return s.category === 'defense';
        return true;
      })
      .slice(0, 4);

    this.slots.forEach((slot, i) => {
      const skill = skills[i] ?? null;
      slot.skill = skill;
      slot.container.setAlpha(skill ? 1 : 0.35);
      zoneEnable(slot.zone, !!skill && this._enabled);

      slot.icon.destroy();
      if (skill) {
        const skillIcon = createSkillIcon(this.scene, 0, 0, skill, 48);
        if (skillIcon) {
          skillIcon.setBlendMode(Phaser.BlendModes.NORMAL);
          slot.icon = skillIcon;
        } else {
          slot.icon = this.scene.add.rectangle(0, 0, 48, 48, 0x1a508b, 0.8);
        }
      } else {
        slot.icon = this.scene.add.rectangle(0, 0, 48, 48, 0x333355, 0.35);
      }
      slot.container.addAt(slot.icon, 1);
    });
    this.refreshSkillSelectionHighlight();
  }

  /** Viền xanh lá cho ô võ kỹ đang chọn trong lượt. */
  setSelectedSkillId(skillId: string | null): void {
    this.selectedSkillId = skillId;
    this.refreshSkillSelectionHighlight();
  }

  private refreshSkillSelectionHighlight(): void {
    for (const slot of this.slots) {
      const selected = !!slot.skill && slot.skill.id === this.selectedSkillId;
      slot.borderRing.setStrokeStyle(selected ? 3 : 2, selected ? SLOT_BORDER_SELECTED : SLOT_BORDER_DEFAULT);
    }
  }

  setSkillFilter(filter: 'all' | 'damage' | 'defense'): void {
    this.skillFilter = filter;
  }

  /** Ẩn 4 ô võ kỹ (tutorial chưa học võ kỹ). Nút Chiến Luôn / Túi đồ vẫn hiện. */
  setSkillsHidden(hidden: boolean): void {
    this.skillsHidden = hidden;
    if (hidden) {
      this.slots.forEach((slot) => {
        slot.skill = null;
        slot.container.setVisible(false);
        zoneEnable(slot.zone, false);
      });
    } else {
      this.slots.forEach((slot) => slot.container.setVisible(true));
    }
  }

  setHint(_text: string): void {
    /* Hint trên BattleTopHud */
  }

  setFightNowEnabled(enabled: boolean): void {
    this._fightEnabled = enabled;
    this.fightBtn.setAlpha(enabled ? 1 : 0.4);
    this.fightLabel.setAlpha(enabled ? 1 : 0.4);
  }

  /** Chỉ bật một ô võ kỹ (null = khôi phục theo trạng thái menu). */
  setOnlySlotEnabled(index: number | null): void {
    this.slots.forEach((slot, i) => {
      const on = index === null
        ? !!slot.skill && this._enabled
        : index === i && !!slot.skill && this._enabled;
      zoneEnable(slot.zone, on);
      slot.container.setAlpha(on ? 1 : (slot.skill ? 0.25 : 0.35));
    });
  }

  getSlotContainer(index: number): Phaser.GameObjects.Container | null {
    return this.slots[index]?.container ?? null;
  }

  getFightButton(): Phaser.GameObjects.Container {
    return this.fightBtn;
  }

  getFightLabel(): Phaser.GameObjects.Text {
    return this.fightLabel;
  }

  setAuxButtonsEnabled(fight: boolean, bag: boolean): void {
    const fightCircle = this.fightBtn.getAt(0) as Phaser.GameObjects.Shape | undefined;
    const bagCircle = this.bagBtn.getAt(0) as Phaser.GameObjects.Shape | undefined;
    this.fightBtn.setAlpha(fight && this._fightEnabled ? 1 : 0.25);
    this.bagBtn.setAlpha(bag ? 1 : 0.25);
    this.fightLabel.setAlpha(fight && this._fightEnabled ? 1 : 0.25);
    if (fightCircle) {
      if (fight && this._enabled && this._fightEnabled) {
        fightCircle.setInteractive({ useHandCursor: true });
      } else {
        fightCircle.disableInteractive();
      }
    }
    if (bagCircle) {
      if (bag && this._enabled) {
        bagCircle.setInteractive({ useHandCursor: true });
      } else {
        bagCircle.disableInteractive();
      }
    }
  }

  setMenuEnabled(enabled: boolean): void {
    this._enabled = enabled;
    this.setAlpha(enabled ? 1 : 0.55);
    this.slots.forEach((s) => zoneEnable(s.zone, enabled && !!s.skill));
    this.setAuxButtonsEnabled(enabled && this._fightEnabled, enabled);
  }

  destroy(fromScene?: boolean): void {
    this.keyHandlers.forEach((k) => k.removeAllListeners());
    super.destroy(fromScene);
  }
}

function zoneEnable(zone: Phaser.GameObjects.Zone, on: boolean): void {
  if (on) {
    zone.setInteractive({ useHandCursor: true });
  } else {
    zone.disableInteractive();
  }
}
