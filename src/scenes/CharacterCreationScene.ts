import Phaser from 'phaser';
import type { WeaponType } from '../types/game.ts';
import { GameState } from '../state/gameState.ts';
import { validateCharacterName } from '../managers/CharacterManager.ts';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameDimensions.ts';
import {
  defaultAppearanceForGender,
  getCreatorAppearancesForGender,
  isAppearanceAvailable,
  isCreatorAppearance,
  type CharacterAppearanceId,
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
import {
  addDomInputFocusZone,
  syncDomInputToGame,
  wireDomTextInput,
} from '../utils/domInputOverlay.ts';

/** Cột trái — tên, giới tính, 4 thumbnail, vũ khí. */
const LEFT_COL_X = 220;
const NAME_INPUT_W = 360;
const NAME_INPUT_H = 46;
const NAME_INPUT_Y = 152;
/** Preview lớn bên phải (cao gấp 4 lần bản cũ ~130px). */
const PREVIEW_X = 1040;
const PREVIEW_Y = 340;
const PREVIEW_DISPLAY_H = 520;
const PREVIEW_FRAME_W = 340;
const PREVIEW_FRAME_H = 560;
/** Panel chỉ số — trái hơn, tránh chồng khung preview (preview bắt đầu ~x870). */
const STAT_PANEL_X = 410;
/** Nhãn cột trái (+2px so với 18px cũ). */
const LEFT_SECTION_LABEL_PX = 20;
const APPEARANCE_GRID_Y = 362;
const STAT_PANEL_Y = 130;

export class CharacterCreationScene extends Phaser.Scene {
  private selectedGender: 'nam' | 'nu' = 'nam';
  private selectedAppearanceId: CharacterAppearanceId = 'nam_1';
  private selectedWeapon: WeaponType = 'quyen';
  private allocationValid = false;
  private allocatedStats = { hp: 0, atk: 0, def: 0, qi: 0 };
  private nameInput: HTMLInputElement | null = null;
  private nameMirrorText: Phaser.GameObjects.Text | null = null;
  private nameFocusZone: Phaser.GameObjects.Zone | null = null;
  private unwiredNameInput: (() => void) | null = null;
  private isNameComposing = false;
  private hintText: Phaser.GameObjects.Text | null = null;
  private statPanel!: StatAllocationPanel;
  private confirmBtn!: UIButton;
  private genderBtns: UIButton[] = [];
  private weaponBtns: Map<WeaponType, UIButton> = new Map();
  private appearanceSlots = new Phaser.GameObjects.Group(this);
  private appearancePreview!: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  private submitting = false;
  private readonly syncNameLayout = (): void => {
    if (!this.nameInput) return;
    syncDomInputToGame(this.nameInput, this.game, LEFT_COL_X, NAME_INPUT_Y, NAME_INPUT_W, NAME_INPUT_H);
  };

  constructor() {
    super({ key: 'CharacterCreationScene' });
  }

  create(): void {
    try {
      this.buildUi();
    } catch (err) {
      console.error('[CharacterCreationScene] create failed:', err);
      this.showFatalError(err);
    }
  }

  private buildUi(): void {
    const gs = GameState.getInstance();
    const hud = UI_THEME.depth.hud;

    addSceneBackground(this, 'characterCreation', UI_THEME.depth.background);

    this.add
      .text(GAME_WIDTH / 2, 48, 'Tạo Nhân Vật', {
        ...uiLabelTextStyle(32, { titleFont: true, bold: true }),
      })
      .setOrigin(0.5)
      .setDepth(hud);

    this.createGenderSelector(hud);
    this.createPreviewPanel(hud);
    this.createAppearanceSelector(hud);
    this.createWeaponSelector(hud);

    this.confirmBtn = new UIButton(this, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 48,
      width: 300,
      height: 50,
      label: 'Bắt Đầu Tu Luyện',
      onClick: () => this.confirmCreation(gs),
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
    this.refreshGenderHighlight();
    this.refreshWeaponHighlight();
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
    this.add.text(LEFT_COL_X, 100, 'Tên nhân vật (tối đa 15 ký tự)', {
      ...uiLabelTextStyle(LEFT_SECTION_LABEL_PX),
    }).setOrigin(0.5).setDepth(depth);

    this.nameMirrorText = this.add.text(LEFT_COL_X, NAME_INPUT_Y, 'Nhập tên tiếng Việt...', {
      fontFamily: UI_THEME.fontFamilyTitle,
      fontSize: '17px',
      color: UI_THEME.colors.textMuted,
    }).setOrigin(0.5).setDepth(depth + 1);

    this.nameInput = document.createElement('input');
    this.nameInput.className = 'vddt-name-input';
    this.nameInput.type = 'text';
    this.nameInput.maxLength = 15;
    this.nameInput.placeholder = 'Nhập tên tiếng Việt...';
    this.nameInput.autocomplete = 'off';
    this.nameInput.lang = 'vi';
    this.nameInput.setAttribute('inputmode', 'text');
    this.nameInput.setAttribute('aria-label', 'Tên nhân vật');
    this.nameInput.style.cssText = `
      padding: 10px 14px;
      font-size: 17px;
      font-family: ${UI_THEME.fontFamilyTitle};
      border: 2px solid #e94560;
      border-radius: 8px;
      background: rgba(22, 33, 62, 0.92);
      color: #ffffff;
      caret-color: #ffffff;
      outline: none;
      box-sizing: border-box;
      pointer-events: auto;
    `;
    this.unwiredNameInput = wireDomTextInput(this, this.nameInput);
    this.nameInput.addEventListener('compositionstart', () => {
      this.isNameComposing = true;
    });
    this.nameInput.addEventListener('compositionend', () => {
      this.isNameComposing = false;
      this.refreshNameMirror();
      this.updateConfirmState();
    });
    this.nameInput.addEventListener('input', (event) => {
      const inputEvent = event as InputEvent;
      if (inputEvent.isComposing || this.isNameComposing) return;
      this.refreshNameMirror();
      this.updateConfirmState();
    });
    this.nameInput.addEventListener('focus', () => {
      if (this.nameMirrorText) this.nameMirrorText.setAlpha(0.15);
    });
    this.nameInput.addEventListener('blur', () => {
      this.refreshNameMirror();
    });

    const app = document.getElementById('app') ?? document.body;
    app.appendChild(this.nameInput);
    this.syncNameLayout();

    this.nameFocusZone = addDomInputFocusZone(
      this,
      LEFT_COL_X,
      NAME_INPUT_Y,
      NAME_INPUT_W,
      NAME_INPUT_H,
      this.nameInput,
      depth + 3,
    );

    this.hintText = this.add.text(LEFT_COL_X, 188, '', {
      ...uiLabelTextStyle(17),
    }).setOrigin(0.5).setDepth(depth + 2);
  }

  private refreshNameMirror(): void {
    if (!this.nameMirrorText || !this.nameInput) return;
    const v = this.nameInput.value.trim();
    if (v.length > 0) {
      this.nameMirrorText.setText(v);
      this.nameMirrorText.setColor(UI_THEME.colors.text);
      this.nameMirrorText.setAlpha(this.nameInput === document.activeElement ? 0.15 : 1);
    } else {
      this.nameMirrorText.setText('Nhập tên tiếng Việt...');
      this.nameMirrorText.setColor(UI_THEME.colors.textMuted);
      this.nameMirrorText.setAlpha(1);
    }
  }

  private createAppearanceSelector(depth: number): void {
    this.add.text(LEFT_COL_X, 298, 'Hình nhân vật (1 – 4)', {
      ...uiLabelTextStyle(LEFT_SECTION_LABEL_PX),
    }).setOrigin(0.5).setDepth(depth);

    this.rebuildAppearanceGrid(depth);
  }

  private createPreviewPanel(depth: number): void {
    this.add
      .rectangle(PREVIEW_X, PREVIEW_Y, PREVIEW_FRAME_W, PREVIEW_FRAME_H, 0x0f3460, 0.55)
      .setStrokeStyle(3, parseInt(UI_THEME.colors.accentAlt.replace('#', ''), 16), 0.85)
      .setDepth(depth);

    this.add
      .text(PREVIEW_X, PREVIEW_Y - PREVIEW_FRAME_H / 2 - 22, 'Xem trước', {
        ...uiLabelTextStyle(20, { titleFont: true, bold: true }),
      })
      .setOrigin(0.5)
      .setDepth(depth);

    this.appearancePreview = this.add
      .rectangle(PREVIEW_X, PREVIEW_Y, PREVIEW_FRAME_W - 24, PREVIEW_FRAME_H - 24, 0x1f3460, 0.6)
      .setStrokeStyle(2, parseInt(UI_THEME.colors.accentAlt.replace('#', ''), 16))
      .setDepth(depth);
  }

  private rebuildAppearanceGrid(depth: number): void {
    this.appearanceSlots.clear(true, true);

    const apps = getCreatorAppearancesForGender(this.selectedGender);
    apps.forEach((app, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = LEFT_COL_X - 117 + col * 78;
      const y = APPEARANCE_GRID_Y + row * 88;
      const available = isAppearanceAvailable(app);
      const selected = app.id === this.selectedAppearanceId;

      const bg = this.add.rectangle(x, y, 68, 76, selected ? 0x1a508b : 0x0f3460, available ? 0.95 : 0.5)
        .setStrokeStyle(selected ? 3 : 1, selected ? 0xfca311 : 0x555577)
        .setDepth(depth);

      if (available) {
        const key = characterIdleKey(app.id);
        if (this.textures.exists(key)) {
          const thumb = this.add.image(x, y - 4, key).setDepth(depth + 1);
          const tex = this.textures.get(key);
          const src = tex.getSourceImage() as { width?: number; height?: number };
          const aspect = (src.width ?? 1) / (src.height ?? 1);
          thumb.setDisplaySize(58 * aspect, 58);
          this.appearanceSlots.add(thumb);
        }
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => {
          this.selectedAppearanceId = app.id;
          this.rebuildAppearanceGrid(depth);
          this.refreshAppearancePreview();
        });
      } else {
        this.appearanceSlots.add(
          this.add.text(x, y, '🔒', { fontSize: '22px' }).setOrigin(0.5).setDepth(depth + 1),
        );
      }

      this.appearanceSlots.add(bg);
    });
  }

  private refreshAppearancePreview(): void {
    this.appearancePreview?.destroy();
    const key = characterIdleKey(this.selectedAppearanceId);
    const depth = UI_THEME.depth.hud + 1;
    if (this.textures.exists(key)) {
      const img = this.add.image(PREVIEW_X, PREVIEW_Y, key).setDepth(depth);
      const tex = this.textures.get(key);
      const src = tex.getSourceImage() as { width?: number; height?: number };
      const aspect = (src.width ?? 1) / (src.height ?? 1);
      img.setDisplaySize(PREVIEW_DISPLAY_H * aspect, PREVIEW_DISPLAY_H);
      this.appearancePreview = img;
    } else {
      this.appearancePreview = this.add
        .rectangle(PREVIEW_X, PREVIEW_Y, PREVIEW_FRAME_W - 24, PREVIEW_FRAME_H - 24, 0x1f3460, 0.6)
        .setStrokeStyle(2, parseInt(UI_THEME.colors.accentAlt.replace('#', ''), 16))
        .setDepth(depth);
    }
  }

  private createGenderSelector(depth: number): void {
    this.add.text(LEFT_COL_X, 200, 'Giới tính', {
      ...uiLabelTextStyle(LEFT_SECTION_LABEL_PX),
    }).setOrigin(0.5).setDepth(depth);

    this.genderBtns = [
      new UIButton(this, {
        x: LEFT_COL_X - 80,
        y: 248,
        width: 140,
        height: 44,
        label: 'Nam',
        onClick: () => {
          this.selectedGender = 'nam';
          this.refreshGenderHighlight();
        },
      }),
      new UIButton(this, {
        x: LEFT_COL_X + 80,
        y: 248,
        width: 140,
        height: 44,
        label: 'Nữ',
        onClick: () => {
          this.selectedGender = 'nu';
          this.refreshGenderHighlight();
        },
      }),
    ];
    this.genderBtns.forEach((b) => b.setDepth(depth));
  }

  private createWeaponSelector(depth: number): void {
    this.add.text(LEFT_COL_X, 510, 'Vũ khí', {
      ...uiLabelTextStyle(LEFT_SECTION_LABEL_PX),
    }).setOrigin(0.5).setDepth(depth);

    const weapons: WeaponType[] = ['quyen', 'kiem', 'dao', 'thuong'];
    weapons.forEach((weapon, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const btn = new UIButton(this, {
        x: LEFT_COL_X - 80 + col * 160,
        y: 558 + row * 52,
        width: 150,
        height: 42,
        label: WEAPON_LABELS[weapon] ?? weapon,
        onClick: () => {
          this.selectedWeapon = weapon;
          this.refreshWeaponHighlight();
        },
      });
      btn.setDepth(depth);
      this.weaponBtns.set(weapon, btn);
    });
  }

  private refreshGenderHighlight(): void {
    this.genderBtns.forEach((btn, i) => {
      const g = i === 0 ? 'nam' : 'nu';
      btn.setLabel(g === this.selectedGender ? `▶ ${g === 'nam' ? 'Nam' : 'Nữ'}` : (g === 'nam' ? 'Nam' : 'Nữ'));
    });
    this.selectedAppearanceId = defaultAppearanceForGender(this.selectedGender);
    this.rebuildAppearanceGrid(UI_THEME.depth.hud);
    this.refreshAppearancePreview();
  }

  private refreshWeaponHighlight(): void {
    for (const [weapon, btn] of this.weaponBtns) {
      const label = WEAPON_LABELS[weapon] ?? weapon;
      btn.setLabel(weapon === this.selectedWeapon ? `▶ ${label}` : label);
    }
  }

  private updateConfirmState(): void {
    if (!this.confirmBtn) return;
    const nameValid = validateCharacterName(this.nameInput?.value ?? '');
    const ready = nameValid && this.allocationValid;
    this.confirmBtn.setAlpha(ready ? 1 : 0.55);
    if (ready) {
      this.hintText?.setText('');
    }
  }

  private showHint(msg: string): void {
    this.hintText?.setText(msg);
  }

  private confirmCreation(gs: GameState): void {
    if (this.submitting) return;

    const name = (this.nameInput?.value ?? '').trim();
    if (!validateCharacterName(name)) {
      this.showHint('Vui lòng nhập tên nhân vật (1–15 ký tự).');
      this.nameInput?.focus();
      return;
    }
    if (!this.allocationValid) {
      this.showHint('Phân bổ đủ 10 điểm chỉ số trước khi bắt đầu.');
      return;
    }
    const appearance = getCreatorAppearancesForGender(this.selectedGender)
      .find((a) => a.id === this.selectedAppearanceId);
    if (!appearance || !isAppearanceAvailable(appearance) || !isCreatorAppearance(appearance)) {
      this.showHint('Hãy chọn một trong 4 hình nhân vật.');
      return;
    }

    this.submitting = true;
    this.confirmBtn.setEnabled(false);

    try {
      if (!gs.hasMainCharacter()) {
        gs.characterManager.createMainCharacter({
          name,
          gender: this.selectedGender,
          appearanceId: this.selectedAppearanceId,
          weaponType: this.selectedWeapon,
          statAllocation: { ...this.allocatedStats },
        });
        gs.assignPlayerDisplayId();
        gs.syncPartyVitals();
        gs.persist();
      }

      this.destroyNameInput();
      this.scene.start('TutorialBattleScene', {
        gender: this.selectedGender,
        weapon: this.selectedWeapon,
      });
    } catch (err) {
      this.submitting = false;
      this.confirmBtn.setEnabled(true);
      const msg = err instanceof Error ? err.message : 'Lỗi tạo nhân vật';
      this.showHint(msg);
      console.error('[CharacterCreationScene] confirmCreation failed:', err);
    }
  }

  private showFatalError(err: unknown): void {
    const msg = err instanceof Error ? err.message : String(err);
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e)
      .setDepth(0);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `Lỗi màn hình tạo NV:\n${msg}`, {
      fontFamily: UI_THEME.fontFamily,
      fontSize: '18px',
      color: '#e94560',
      align: 'center',
      wordWrap: { width: GAME_WIDTH - 80 },
    }).setOrigin(0.5).setDepth(1);
  }

  private destroyNameInput(): void {
    this.scale.off('resize', this.syncNameLayout);
    this.unwiredNameInput?.();
    this.unwiredNameInput = null;
    this.nameFocusZone?.destroy();
    this.nameFocusZone = null;
    this.nameInput?.remove();
    this.nameInput = null;
    this.nameMirrorText?.destroy();
    this.nameMirrorText = null;
  }
}
