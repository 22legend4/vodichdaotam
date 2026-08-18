import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/gameDimensions.ts';
import { REALM_EXP_REQUIREMENTS } from '../../constants/gameRules.ts';
import { GameState } from '../../state/gameState.ts';
import type { BaseStats, CharacterData, RealmLevel } from '../../types/game.ts';
import { REALM_ORDER, validateCharacterName } from '../../managers/CharacterManager.ts';
import { UI_THEME, WEAPON_LABELS, REALM_LABELS, clampFontSizePx, UIButton } from '../index.ts';
import { ModalBase } from './ModalBase.ts';
import { ASSET_KEYS, resolveAvatarKey } from '../../utils/AssetGenerator.ts';
import { isUsableBgTexture } from '../../utils/characterSpriteAssets.ts';
import { resolvePlayerDisplayKey } from '../../utils/characterSpriteAssets.ts';
import { AVATAR_H, AVATAR_W } from '../../utils/assetDrawCharacters.ts';
import { iconPathTextureKey, ROSTER_RENAME_PEN_ICON_PATH } from '../../utils/iconAssets.ts';

const HUB_BTN = 0xc97a4a;
const NAME_TEXT_COLOR = '#9ae66e';
const ROSTER_CHAR_H = 300;
const TEXT_STROKE = '#000000';
const TEXT_STROKE_W = 3;
const INFO_LINE_GAP = 4;
const PEN_ICON_SIZE = 18;
const RENAME_INPUT_W = 200;
const RENAME_INPUT_H = 36;

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

function formatExpNumber(n: number): string {
  return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatExpCap(n: number): string {
  if (n >= 1_000_000) return `${Math.round(n / 100_000) / 10}M`;
  if (n >= 1_000) return `${Math.round(n / 100) / 10}k`;
  return formatExpNumber(n);
}

function nextRealmExpRequirement(realm: RealmLevel): number {
  const idx = REALM_ORDER.indexOf(realm);
  if (idx < 0 || idx >= REALM_ORDER.length - 1) {
    return REALM_EXP_REQUIREMENTS.Thien;
  }
  return REALM_EXP_REQUIREMENTS[REALM_ORDER[idx + 1]!];
}

/** Chỉ số cơ bản — không tính trang bị / yêu thú. */
function getBaseOnlyStats(char: CharacterData): BaseStats {
  return { ...char.baseStats };
}

/** Màn xem đội hình — ảnh, tên, cảnh giới, vũ khí, EXP, chỉ số cơ bản. */
export class PlayerRosterModal extends ModalBase {
  private editingCharId: string | null = null;
  private nameInput: HTMLInputElement | null = null;
  private renameDoneBtn: UIButton | null = null;
  private activeNameText: Phaser.GameObjects.Text | null = null;
  private activeNameRow: Phaser.GameObjects.Container | null = null;
  private activePenIcon: Phaser.GameObjects.Image | Phaser.GameObjects.Text | null = null;
  private readonly syncRenameLayout = (): void => {
    if (!this.nameInput || this.editingCharId === null) return;
    const slotX = this.activeNameRow?.parentContainer?.x ?? GAME_WIDTH / 2;
    const nameY = this.activeNameRow?.y ?? 0;
    syncDomToGame(this.nameInput, this.scene.game, slotX, nameY, RENAME_INPUT_W, RENAME_INPUT_H);
  };

  constructor(scene: Phaser.Scene, onClose?: () => void) {
    super(scene, { title: '', fullscreen: true, onClose });
    this.build();
    this.scene.scale.on('resize', this.syncRenameLayout);
  }

  close(): void {
    this.cleanupRenameUi();
    this.scene.scale.off('resize', this.syncRenameLayout);
    super.close();
  }

  private build(): void {
    this.addBackground();

    const gs = GameState.getInstance();
    gs.syncPartyVitals();
    const party = gs.characterManager.getParty();
    const playerId = gs.getPlayerDisplayId();

    const idLabel = this.scene.add.text(GAME_WIDTH / 2, 36, `ID: ${playerId ?? '—'}`, {
      fontFamily: UI_THEME.fontFamilyTitle,
      fontSize: clampFontSizePx('22px'),
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: TEXT_STROKE,
      strokeThickness: TEXT_STROKE_W,
    }).setOrigin(0.5);
    this.container.add(idLabel);

    const slotCount = Math.max(party.length, 1);
    const slotW = GAME_WIDTH / slotCount;
    const avatarCenterY = GAME_HEIGHT * 0.36;

    if (party.length === 0) {
      this.container.add(
        this.scene.add.text(GAME_WIDTH / 2, avatarCenterY, 'Chưa có nhân vật trong đội.', {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('18px'),
          color: '#ffffff',
          stroke: TEXT_STROKE,
          strokeThickness: TEXT_STROKE_W,
        }).setOrigin(0.5),
      );
    } else {
      party.forEach((char, index) => {
        this.addCharacterSlot(char, slotW * (index + 0.5), avatarCenterY);
      });
    }

    const closeBtn = new UIButton(this.scene, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 44,
      width: 140,
      height: 44,
      label: 'Đóng',
      color: HUB_BTN,
      onClick: () => this.close(),
      addToScene: false,
    });
    this.container.add(closeBtn);
  }

  /** Nền full màn — public/assets/bg/bg-player.jpg */
  private addBackground(): void {
    const texKey = ASSET_KEYS.bgPlayerRoster;
    if (this.scene.textures.exists(texKey) && isUsableBgTexture(this.scene, texKey)) {
      this.container.add(
        this.scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, texKey)
          .setDisplaySize(GAME_WIDTH, GAME_HEIGHT),
      );
      return;
    }
    this.container.add(
      this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a2248),
    );
  }

  private addCharacterSlot(char: CharacterData, x: number, avatarCenterY: number): void {
    const slot = this.scene.add.container(x, 0);
    this.container.add(slot);

    const avatarKey = resolvePlayerDisplayKey(this.scene, char.appearanceId, char.gender, char.weaponType)
      ?? resolveAvatarKey(char.id, char.gender, char.weaponType, char.appearanceId);

    const avatarCy = avatarCenterY;
    let avatarHalfH = ROSTER_CHAR_H / 2;

    if (this.scene.textures.exists(avatarKey)) {
      const img = this.scene.add.image(0, avatarCy, avatarKey);
      const tex = this.scene.textures.get(avatarKey);
      const src = tex.getSourceImage() as { width?: number; height?: number };
      const aspect = (src.width ?? AVATAR_W) / (src.height ?? AVATAR_H);
      const h = avatarKey.startsWith('char_') ? ROSTER_CHAR_H : AVATAR_H * 2.2;
      img.setDisplaySize(h * aspect, h);
      avatarHalfH = h / 2;
      slot.add(img);
    } else {
      avatarHalfH = AVATAR_H * 2 / 2;
      slot.add(
        this.scene.add.rectangle(0, avatarCy, AVATAR_W * 1.8, AVATAR_H * 2, 0x2980b9, 0.45)
          .setStrokeStyle(2, 0xffffff, 0.35),
      );
    }

    const feetY = avatarCy + avatarHalfH;
    const panelTop = feetY + 10;

    const nameY = panelTop + 18;
    const nameRow = this.scene.add.container(0, nameY);
    slot.add(nameRow);

    const nameDisplay = this.truncateName(char.name, 14);
    const nameText = this.scene.add.text(0, 0, nameDisplay, {
      fontFamily: UI_THEME.fontFamilyTitle,
      fontSize: clampFontSizePx('14px'),
      color: NAME_TEXT_COLOR,
      fontStyle: 'bold',
      stroke: TEXT_STROKE,
      strokeThickness: TEXT_STROKE_W,
    }).setOrigin(0, 0.5);

    const penKey = iconPathTextureKey(ROSTER_RENAME_PEN_ICON_PATH);
    let penIcon: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
    if (this.scene.textures.exists(penKey)) {
      penIcon = this.scene.add.image(0, 0, penKey).setDisplaySize(PEN_ICON_SIZE, PEN_ICON_SIZE);
    } else {
      penIcon = this.scene.add.text(0, 0, '✎', {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('16px'),
        color: '#ffffff',
        stroke: TEXT_STROKE,
        strokeThickness: TEXT_STROKE_W,
      }).setOrigin(0, 0.5);
    }

    this.layoutNameRow(nameRow, nameText, penIcon);
    nameRow.add([nameText, penIcon]);

    const beginRename = (): void => {
      this.startRename(char, nameText, nameRow, penIcon);
    };
    nameText.setInteractive({ useHandCursor: true }).on('pointerdown', beginRename);
    if (penIcon instanceof Phaser.GameObjects.Image) {
      penIcon.setInteractive({ useHandCursor: true }).on('pointerdown', beginRename);
    } else {
      penIcon.setInteractive({ useHandCursor: true }).on('pointerdown', beginRename);
    }

    const realmLabel = REALM_LABELS[char.realm] ?? char.realm;
    const weaponLabel = WEAPON_LABELS[char.weaponType] ?? char.weaponType;
    const stats = getBaseOnlyStats(char);
    const expCap = nextRealmExpRequirement(char.realm);
    let lineY = nameY + 18;

    const infoLines = [
      `${formatExpNumber(char.exp)} / ${formatExpCap(expCap)}`,
      realmLabel,
      `Vũ khí: ${weaponLabel}`,
      `Chỉ số công: ${stats.atk}`,
      `Chỉ số thủ: ${stats.def}`,
      `Chỉ số máu: ${stats.hp}`,
      `Nguyên khí: ${stats.qi}`,
    ];

    for (const line of infoLines) {
      lineY += INFO_LINE_GAP;
      const text = this.scene.add.text(0, lineY, line, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('12px'),
        color: '#f5f5f5',
        stroke: TEXT_STROKE,
        strokeThickness: TEXT_STROKE_W,
        align: 'center',
      }).setOrigin(0.5, 0);
      slot.add(text);
      lineY += text.height;
    }
  }

  private layoutNameRow(
    nameRow: Phaser.GameObjects.Container,
    nameText: Phaser.GameObjects.Text,
    penIcon: Phaser.GameObjects.Image | Phaser.GameObjects.Text,
  ): void {
    const gap = 6;
    const penW = penIcon instanceof Phaser.GameObjects.Image ? PEN_ICON_SIZE : penIcon.width;
    const totalW = nameText.width + gap + penW;
    nameText.setPosition(-totalW / 2, 0);
    penIcon.setPosition(-totalW / 2 + nameText.width + gap, 0);
    if (penIcon instanceof Phaser.GameObjects.Image) {
      penIcon.setOrigin(0, 0.5);
    }
    nameRow.setSize(totalW, Math.max(nameText.height, penW));
  }

  private startRename(
    char: CharacterData,
    nameText: Phaser.GameObjects.Text,
    nameRow: Phaser.GameObjects.Container,
    penIcon: Phaser.GameObjects.Image | Phaser.GameObjects.Text,
  ): void {
    if (this.editingCharId !== null && this.editingCharId !== char.id) {
      this.cancelRename();
    }
    if (this.editingCharId === char.id) return;

    this.editingCharId = char.id;
    this.activeNameText = nameText;
    this.activeNameRow = nameRow;
    this.activePenIcon = penIcon;
    nameText.setVisible(false);
    penIcon.setVisible(false);

    const app = document.getElementById('app');
    if (!app) return;

    this.nameInput = document.createElement('input');
    this.nameInput.className = 'vddt-name-input';
    this.nameInput.type = 'text';
    this.nameInput.maxLength = 15;
    this.nameInput.value = char.name.trim();
    this.nameInput.autocomplete = 'off';
    this.nameInput.lang = 'vi';
    this.nameInput.setAttribute('aria-label', 'Tên nhân vật');
    this.nameInput.style.cssText = `
      box-sizing: border-box;
      padding: 6px 10px;
      font-family: ${UI_THEME.fontFamilyTitle}, sans-serif;
      font-size: 14px;
      font-weight: bold;
      color: ${NAME_TEXT_COLOR};
      background: rgba(0, 0, 0, 0.55);
      border: 1px solid rgba(154, 230, 110, 0.65);
      border-radius: 6px;
      outline: none;
      text-align: center;
    `;
    this.nameInput.addEventListener('keydown', (event) => event.stopPropagation());
    this.nameInput.addEventListener('keyup', (event) => event.stopPropagation());
    app.appendChild(this.nameInput);

    const slotX = nameRow.parentContainer?.x ?? GAME_WIDTH / 2;
    const doneY = nameRow.y + 40;
    this.renameDoneBtn = new UIButton(this.scene, {
      x: slotX,
      y: doneY,
      width: 120,
      height: 36,
      label: 'Đã xong',
      color: HUB_BTN,
      onClick: () => this.confirmRename(char.id),
      addToScene: false,
    });
    this.container.add(this.renameDoneBtn);

    this.syncRenameLayout();
    this.scene.time.delayedCall(50, () => {
      this.syncRenameLayout();
      this.nameInput?.focus();
      this.nameInput?.select();
    });
  }

  private confirmRename(charId: string): void {
    const raw = this.nameInput?.value ?? '';
    if (!validateCharacterName(raw)) {
      this.showToast('Tên nhân vật phải từ 1–15 ký tự.');
      return;
    }

    const gs = GameState.getInstance();
    const result = gs.characterManager.renameCharacter(charId, raw);
    if (!result.success) {
      this.showToast(result.message);
      return;
    }

    gs.persist();
    const trimmed = raw.trim();
    if (this.activeNameText) {
      this.activeNameText.setText(this.truncateName(trimmed, 14));
      if (this.activePenIcon) {
        this.layoutNameRow(this.activeNameRow!, this.activeNameText, this.activePenIcon);
      }
    }
    this.finishRename();
  }

  private cancelRename(): void {
    this.finishRename();
  }

  private finishRename(): void {
    this.activeNameText?.setVisible(true);
    this.activePenIcon?.setVisible(true);
    this.activeNameText = null;
    this.activeNameRow = null;
    this.activePenIcon = null;
    this.editingCharId = null;

    this.nameInput?.remove();
    this.nameInput = null;

    this.renameDoneBtn?.destroy();
    this.renameDoneBtn = null;
  }

  private cleanupRenameUi(): void {
    this.finishRename();
  }

  private truncateName(name: string, maxLen: number): string {
    const trimmed = name.trim();
    if (trimmed.length <= maxLen) return trimmed;
    return `${trimmed.slice(0, maxLen)}…`;
  }
}
