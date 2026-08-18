import Phaser from 'phaser';
import type { WeaponType } from '../types/game.ts';
import { GameState } from '../state/gameState.ts';
import { validateCharacterName } from '../managers/CharacterManager.ts';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameDimensions.ts';
import {
  rollRandomCompanionExcluding,
  type CharacterAppearanceId,
  type CharacterGender,
} from '../data/characterAppearances.ts';
import { characterIdleKey } from '../utils/characterSpriteAssets.ts';
import { addSceneBackground } from '../utils/AssetGenerator.ts';
import {
  UI_THEME,
  uiLabelTextStyle,
  WEAPON_LABELS,
  UIButton,
  StatAllocationPanel,
} from '../ui/index.ts';

function syncDomToGame(
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

const LEFT_COL_X = 220;
/** Preview bên phải — tránh chồng panel chỉ số (panel + nút kéo dài ~x794). */
const PREVIEW_X = 1040;
const PREVIEW_Y = 340;
const PREVIEW_FRAME_W = 340;
const PREVIEW_FRAME_H = 520;
const STAT_PANEL_X = 410;
const STAT_PANEL_Y = 130;

export interface CompanionRecruitmentSceneData {
  companionId: string;
  unlockLabel?: string;
}

/** Màn nhận đồng đội sau cửa 1A–1D — hệ thống random ngoại hình/vũ khí, người chơi đặt tên + phân chỉ số. */
export class CompanionRecruitmentScene extends Phaser.Scene {
  private companionId = 'companion_1a';
  private unlockLabel = '1A';
  private rolledGender: CharacterGender = 'nam';
  private rolledWeapon: WeaponType = 'quyen';
  private rolledAppearanceId: CharacterAppearanceId = 'nam_5';
  private allocationValid = false;
  private allocatedStats = { hp: 0, atk: 0, def: 0, qi: 0 };
  private nameInput: HTMLInputElement | null = null;
  private isNameComposing = false;
  private hintText: Phaser.GameObjects.Text | null = null;
  private statPanel!: StatAllocationPanel;
  private confirmBtn!: UIButton;
  private appearancePreview!: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  private submitting = false;

  private readonly syncNameLayout = (): void => {
    if (!this.nameInput) return;
    syncDomToGame(this.nameInput, this.game, LEFT_COL_X, 152, 360, 46);
  };

  constructor() {
    super({ key: 'CompanionRecruitmentScene' });
  }

  init(data: CompanionRecruitmentSceneData): void {
    this.companionId = data.companionId ?? 'companion_1a';
    this.unlockLabel = data.unlockLabel ?? '1A';
    const usedAppearances = GameState.getInstance().characterManager.getUsedCompanionAppearanceIds();
    const roll = rollRandomCompanionExcluding(usedAppearances);
    this.rolledGender = roll.gender;
    this.rolledWeapon = roll.weapon;
    this.rolledAppearanceId = roll.appearanceId;
    this.allocationValid = false;
    this.allocatedStats = { hp: 0, atk: 0, def: 0, qi: 0 };
    this.submitting = false;
  }

  create(): void {
    const gs = GameState.getInstance();
    if (!gs.characterManager.isCompanionUnlocked(this.companionId)
      || gs.characterManager.hasCompanionCharacter(this.companionId)) {
      this.scene.start('MainHubScene', { openMap: true });
      return;
    }

    const hud = UI_THEME.depth.hud;
    addSceneBackground(this, 'characterCreation', UI_THEME.depth.background);

    this.add.text(GAME_WIDTH / 2, 48, `Nhận đồng đội mới — Cửa ${this.unlockLabel}`, {
      ...uiLabelTextStyle(30, { titleFont: true, bold: true }),
    }).setOrigin(0.5).setDepth(hud);

    this.createRandomAssignmentDisplay(hud);
    this.createPreviewPanel(hud);

    this.confirmBtn = new UIButton(this, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 48,
      width: 320,
      height: 50,
      label: 'Nhận đồng đội',
      onClick: () => this.confirmRecruitment(gs),
      enabled: true,
    });
    this.confirmBtn.setDepth(hud);

    this.statPanel = new StatAllocationPanel(this, STAT_PANEL_X, STAT_PANEL_Y, 420);
    this.statPanel.setDepth(hud);
    this.statPanel.onAllocationChange((allocated, valid) => {
      this.allocatedStats = allocated;
      this.allocationValid = valid;
      this.updateConfirmState();
    });

    this.createNameInput(hud);
    this.refreshAppearancePreview();

    this.scale.on('resize', this.syncNameLayout);
    this.events.on('shutdown', () => this.destroyNameInput());
    this.events.on('destroy', () => this.destroyNameInput());

    this.time.delayedCall(50, () => {
      this.syncNameLayout();
      this.nameInput?.focus();
    });
  }

  private createNameInput(depth: number): void {
    this.add.text(LEFT_COL_X, 100, 'Tên đồng đội (tối đa 15 ký tự)', {
      ...uiLabelTextStyle(18),
    }).setOrigin(0.5).setDepth(depth);

    this.nameInput = document.createElement('input');
    this.nameInput.className = 'vddt-name-input';
    this.nameInput.type = 'text';
    this.nameInput.maxLength = 15;
    this.nameInput.placeholder = 'Nhập tên...';
    this.nameInput.autocomplete = 'off';
    this.nameInput.lang = 'vi';
    this.nameInput.setAttribute('aria-label', 'Tên đồng đội');
    this.nameInput.style.cssText = `
      padding: 10px 14px;
      font-size: 17px;
      font-family: ${UI_THEME.fontFamilyTitle};
      border: 2px solid #eab308;
      border-radius: 8px;
      background: rgba(22, 33, 62, 0.92);
      color: #ffffff;
      outline: none;
      box-sizing: border-box;
      pointer-events: auto;
    `;
    this.nameInput.addEventListener('compositionstart', () => {
      this.isNameComposing = true;
    });
    this.nameInput.addEventListener('compositionend', () => {
      this.isNameComposing = false;
      this.updateConfirmState();
    });
    this.nameInput.addEventListener('input', (event) => {
      const inputEvent = event as InputEvent;
      if (inputEvent.isComposing || this.isNameComposing) return;
      this.updateConfirmState();
    });
    this.nameInput.addEventListener('keydown', (event) => event.stopPropagation());
    this.nameInput.addEventListener('keyup', (event) => event.stopPropagation());

    const app = document.getElementById('app') ?? document.body;
    app.appendChild(this.nameInput);
    this.syncNameLayout();

    this.hintText = this.add.text(LEFT_COL_X, 188, '', {
      ...uiLabelTextStyle(16),
    }).setOrigin(0.5).setDepth(depth + 2);
  }

  private createRandomAssignmentDisplay(depth: number): void {
    const genderLabel = this.rolledGender === 'nam' ? 'Nam' : 'Nữ';
    this.add.text(LEFT_COL_X, 240, `Giới tính: ${genderLabel}`, {
      ...uiLabelTextStyle(20),
    }).setOrigin(0.5).setDepth(depth);

    const weaponLabel = WEAPON_LABELS[this.rolledWeapon] ?? this.rolledWeapon;
    this.add.text(LEFT_COL_X, 286, `Vũ khí: ${weaponLabel}`, {
      ...uiLabelTextStyle(20),
      color: '#eab308',
    }).setOrigin(0.5).setDepth(depth);

    const slot = this.rolledAppearanceId.split('_')[1] ?? '?';
    this.add.text(LEFT_COL_X, 332, `Ngoại hình: ${genderLabel} #${slot}`, {
      ...uiLabelTextStyle(17),
      color: UI_THEME.colors.textMuted,
    }).setOrigin(0.5).setDepth(depth);
  }

  private createPreviewPanel(depth: number): void {
    this.add
      .rectangle(PREVIEW_X, PREVIEW_Y, PREVIEW_FRAME_W, PREVIEW_FRAME_H, 0x0f3460, 0.55)
      .setStrokeStyle(3, 0xeab308, 0.85)
      .setDepth(depth);

    this.add.text(PREVIEW_X, PREVIEW_Y - PREVIEW_FRAME_H / 2 - 22, 'Xem trước', {
      ...uiLabelTextStyle(20, { titleFont: true, bold: true }),
    }).setOrigin(0.5).setDepth(depth);

    this.appearancePreview = this.add
      .rectangle(PREVIEW_X, PREVIEW_Y, PREVIEW_FRAME_W - 24, PREVIEW_FRAME_H - 24, 0x1f3460, 0.6)
      .setStrokeStyle(2, 0xeab308)
      .setDepth(depth);
  }

  private refreshAppearancePreview(): void {
    if (this.appearancePreview instanceof Phaser.GameObjects.Image) {
      this.appearancePreview.destroy();
    }
    const key = characterIdleKey(this.rolledAppearanceId);
    if (this.textures.exists(key)) {
      const img = this.add.image(PREVIEW_X, PREVIEW_Y, key).setDepth(UI_THEME.depth.hud + 1);
      const tex = this.textures.get(key);
      const src = tex.getSourceImage() as { width?: number; height?: number };
      const aspect = (src.width ?? 1) / (src.height ?? 1);
      const maxH = PREVIEW_FRAME_H - 40;
      img.setDisplaySize(maxH * aspect, maxH);
      this.appearancePreview = img;
    } else {
      this.appearancePreview = this.add
        .rectangle(PREVIEW_X, PREVIEW_Y, PREVIEW_FRAME_W - 24, PREVIEW_FRAME_H - 24, 0x1f3460, 0.6)
        .setStrokeStyle(2, 0xeab308)
        .setDepth(UI_THEME.depth.hud);
    }
  }

  private updateConfirmState(): void {
    if (!this.confirmBtn) return;
    const nameValid = validateCharacterName(this.nameInput?.value ?? '');
    const ready = nameValid && this.allocationValid;
    this.confirmBtn.setAlpha(ready ? 1 : 0.55);
    if (ready) this.hintText?.setText('');
  }

  private confirmRecruitment(gs: GameState): void {
    if (this.submitting) return;
    const name = (this.nameInput?.value ?? '').trim();
    if (!validateCharacterName(name)) {
      this.hintText?.setText('Vui lòng nhập tên (1–15 ký tự).');
      return;
    }
    if (!this.allocationValid) {
      this.hintText?.setText('Phân bổ đủ 10 điểm chỉ số.');
      return;
    }

    this.submitting = true;
    this.confirmBtn.setEnabled(false);

    try {
      gs.characterManager.createCompanion({
        companionId: this.companionId,
        name,
        gender: this.rolledGender,
        weaponType: this.rolledWeapon,
        appearanceId: this.rolledAppearanceId,
        statAllocation: { ...this.allocatedStats },
      });
      gs.syncPartyVitals();
      gs.persist();
      this.destroyNameInput();
      this.scene.start('MainHubScene', { openMap: true });
    } catch (err) {
      this.submitting = false;
      this.confirmBtn.setEnabled(true);
      this.hintText?.setText(err instanceof Error ? err.message : 'Lỗi tuyển đồng đội');
    }
  }

  private destroyNameInput(): void {
    this.scale.off('resize', this.syncNameLayout);
    this.nameInput?.remove();
    this.nameInput = null;
    this.isNameComposing = false;
  }
}
