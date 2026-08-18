import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/gameDimensions.ts';
import { GameState } from '../../state/gameState.ts';
import type { CharacterData } from '../../types/game.ts';
import {
  getSkillById,
  getSkillTreeNodes,
  getSkillTreePosition,
  BATTLE_SKILL_SLOT_COUNT,
} from '../../data/skillsData.ts';
import { UI_THEME, clampFontSizePx, UIButton, BattleGuideOverlay } from '../index.ts';
import { ModalBase } from './ModalBase.ts';
import { createSkillIcon } from '../../utils/skillIconAssets.ts';

const BG_COLOR = 0x0d1b4a;
const LINE_COLOR = 0xffd600;
/** Võ kỹ đã học — vàng chanh. */
const LEARNED_COLOR = 0xfff700;
const LEARNED_COLOR_HEX = '#fff700';
const NODE_SIZE = 78;
const DETAIL_ICON_FRAME = 120;
const DETAIL_ICON_SIZE = 108;
/** Khoảng cách icon + stats so với tên võ kỹ (tên giữ nguyên y0). */
const DETAIL_BODY_OFFSET = 44;
const ACCENT_ORANGE = 0xef6c00;
const ACCENT_ORANGE_HEX = '#ef6c00';
/** ~65% màn hình cho cây võ kỹ, ~35% cho panel chi tiết. */
const PANEL_X = Math.floor(GAME_WIDTH * 0.65);
const LEFT_W = PANEL_X;
const PANEL_W = GAME_WIDTH - PANEL_X;
/** Căn giữa cây trong vùng trái. */
const TREE_CENTER_X = (88 + 526) / 2;
const TREE_OFFSET_X = LEFT_W / 2 - TREE_CENTER_X;
const TREE_OFFSET_Y = 72;
const LOADOUT_SLOT_SIZE = 52;
const LOADOUT_GAP = 10;
const LOADOUT_REMOVE_GAP = 6;
/** Vùng header trái — tên NV + 4 ô võ kỹ trận đấu. */
const HEADER_Y = 40;
const CHAR_NAME_X = 24;
const CHAR_NAV_BTN_W = 56;
const CHAR_NAV_BTN_GAP = 8;
/** Text + 4 ô võ kỹ trận đấu — hạ xuống tránh tràn mép trên. */
const LOADOUT_SECTION_Y = HEADER_Y + 40;
const LOADOUT_BLOCK_W =
  BATTLE_SKILL_SLOT_COUNT * LOADOUT_SLOT_SIZE + (BATTLE_SKILL_SLOT_COUNT - 1) * LOADOUT_GAP;
const LOADOUT_START_X = LEFT_W - 28 - LOADOUT_BLOCK_W + LOADOUT_SLOT_SIZE / 2;
const LOADOUT_TITLE_FONT_PX = 15;
const SKILL_POINTS_FONT_PX = 19;
const SKILL_POINTS_ABOVE_ROOT_GAP = 32;
const GUIDE_DEPTH = UI_THEME.depth.overlay + 25;

export type SkillModalGuidePhase =
  | 'pickSkill'
  | 'learnSkill'
  | 'pickLoadoutSlot'
  | 'assignSkill'
  | 'confirmLoadout';

export interface SkillModalGuideConfig {
  characterId: string;
  targetSkillId: string;
  loadoutSlotIndex: number;
  onComplete: () => void;
}

/** Màn võ kỹ full màn hình — cây kỹ năng trái + panel chi tiết phải. */
export class SkillModal extends ModalBase {
  private selectedCharId: string | null = null;
  private selectedSkillId: string | null = null;
  /** Ô trận đấu đang chọn để gán võ kỹ (0–3). */
  private selectedLoadoutSlot: number | null = null;
  private treeContainer!: Phaser.GameObjects.Container;
  private detailContainer!: Phaser.GameObjects.Container;
  private loadoutContainer!: Phaser.GameObjects.Container;
  private charLabel!: Phaser.GameObjects.Text;
  private guide?: SkillModalGuideConfig;
  private guidePhase: SkillModalGuidePhase | null = null;
  private guideOverlay?: BattleGuideOverlay;
  private guideDoneBtn?: Phaser.GameObjects.Container;
  private introNoticeOverlay?: Phaser.GameObjects.Container;
  private liftedGuideRefs: {
    obj: Phaser.GameObjects.GameObject;
    parent: Phaser.GameObjects.Container;
    localX: number;
    localY: number;
  }[] = [];
  private treeNodeWraps = new Map<string, Phaser.GameObjects.Container>();
  private loadoutSlotWraps = new Map<number, Phaser.GameObjects.Container>();
  private learnBtnRef?: Phaser.GameObjects.GameObject;

  constructor(
    scene: Phaser.Scene,
    onClose?: () => void,
    guide?: SkillModalGuideConfig,
    introNotice?: string,
  ) {
    super(scene, { title: '', fullscreen: true, onClose });
    this.guide = guide;
    if (guide) {
      this.selectedCharId = guide.characterId;
      this.selectedSkillId = guide.targetSkillId;
      this.guidePhase = 'pickSkill';
    }
    this.build();
    if (introNotice) {
      this.showIntroNotice(introNotice);
    }
  }

  private build(): void {
    this.container.add(
      this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, BG_COLOR),
    );

    this.container.add(
      this.scene.add
        .rectangle(PANEL_X, GAME_HEIGHT / 2, 2, GAME_HEIGHT - 32, LINE_COLOR)
        .setOrigin(0, 0.5),
    );

    const gs = GameState.getInstance();
    const party = gs.characterManager.getParty();
    this.selectedCharId = party[0]?.id ?? null;

    this.charLabel = this.scene.add.text(CHAR_NAME_X, HEADER_Y, '', {
      fontFamily: UI_THEME.fontFamilyTitle,
      fontSize: clampFontSizePx('18px'),
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: ACCENT_ORANGE_HEX,
      padding: { x: 20, y: 8 },
    }).setOrigin(0, 0.5);
    this.container.add(this.charLabel);

    this.loadoutContainer = this.scene.add.container(0, 0);
    this.container.add(this.loadoutContainer);

    if (party.length > 1) {
      const navY = HEADER_Y + 44;
      const prevCenterX = CHAR_NAME_X + CHAR_NAV_BTN_W / 2;
      const nextCenterX = CHAR_NAME_X + CHAR_NAV_BTN_W + CHAR_NAV_BTN_GAP + CHAR_NAV_BTN_W / 2;
      const prevBtn = new UIButton(this.scene, {
        x: prevCenterX,
        y: navY,
        width: CHAR_NAV_BTN_W,
        height: 36,
        label: '◀',
        color: ACCENT_ORANGE,
        flatBackground: true,
        onClick: () => this.cycleCharacter(-1),
        addToScene: false,
      });
      const nextBtn = new UIButton(this.scene, {
        x: nextCenterX,
        y: navY,
        width: CHAR_NAV_BTN_W,
        height: 36,
        label: '▶',
        color: ACCENT_ORANGE,
        flatBackground: true,
        onClick: () => this.cycleCharacter(1),
        addToScene: false,
      });
      this.container.add([prevBtn, nextBtn]);
    }

    this.treeContainer = this.scene.add.container(TREE_OFFSET_X, TREE_OFFSET_Y);
    this.detailContainer = this.scene.add.container(PANEL_X, 0);
    this.container.add([this.treeContainer, this.detailContainer]);

    this.container.add(
      this.createOutlineButton(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 48,
        112,
        40,
        'Đóng',
        () => this.close(),
        LINE_COLOR,
        '#ffffff',
      ),
    );

    this.refresh();
  }

  private createOutlineButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void,
    borderColor: number = ACCENT_ORANGE,
    textColor: string = ACCENT_ORANGE_HEX,
  ): Phaser.GameObjects.Container {
    const wrap = this.scene.add.container(x, y);
    const bg = this.scene.add
      .rectangle(0, 0, width, height)
      .setFillStyle(0x000000, 0)
      .setStrokeStyle(2, borderColor);
    const text = this.scene.add.text(0, 0, label, {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('18px'),
      color: textColor,
    }).setOrigin(0.5);
    const hit = this.scene.add
      .rectangle(0, 0, width, height, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerup', onClick);
    wrap.add([bg, text, hit]);
    return wrap;
  }

  private cycleCharacter(delta: number): void {
    const gs = GameState.getInstance();
    const party = gs.characterManager.getParty();
    if (party.length <= 1) return;
    const idx = party.findIndex((c) => c.id === this.selectedCharId);
    const next = (idx + delta + party.length) % party.length;
    this.selectedCharId = party[next]!.id;
    this.selectedSkillId = null;
    this.selectedLoadoutSlot = null;
    this.refresh();
  }

  private getSelectedCharacter(): CharacterData | null {
    if (!this.selectedCharId) return null;
    return GameState.getInstance().characterManager.getCharacter(this.selectedCharId) ?? null;
  }

  private ensureDefaultSkillSelection(char: CharacterData): void {
    if (this.selectedSkillId) return;
    const gs = GameState.getInstance();
    const nodes = getSkillTreeNodes(char.weaponType, {
      rebirthUnlocked: gs.characterManager.hasReincarnated(char.id),
    });
    this.selectedSkillId = nodes[0]?.skillId ?? null;
  }

  private refresh(): void {
    const char = this.getSelectedCharacter();
    if (!char) return;

    this.ensureDefaultSkillSelection(char);
    this.charLabel.setText(char.name);

    this.renderLoadout(char);
    this.renderTree(char);
    this.renderDetail(char);
    if (this.guidePhase) {
      this.scene.time.delayedCall(50, () => this.updateGuideOverlay());
    }
  }

  private renderLoadout(char: CharacterData): void {
    this.loadoutContainer.removeAll(true);
    this.loadoutSlotWraps.clear();
    const gs = GameState.getInstance();
    const loadout = gs.characterManager.getBattleSkillLoadout(char.id);
    const learned = new Set(gs.characterManager.getLearnedSkillIds(char.id));

    this.loadoutContainer.add(
      this.scene.add.text(
        LOADOUT_START_X + LOADOUT_BLOCK_W / 2 - LOADOUT_SLOT_SIZE / 2,
        LOADOUT_SECTION_Y - 30,
        'Chọn võ kỹ trận đấu',
        {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx(`${LOADOUT_TITLE_FONT_PX}px`),
          color: '#ffffff',
        },
      ).setOrigin(0.5, 1),
    );

    for (let i = 0; i < BATTLE_SKILL_SLOT_COUNT; i += 1) {
      const x = LOADOUT_START_X + i * (LOADOUT_SLOT_SIZE + LOADOUT_GAP);
      const y = LOADOUT_SECTION_Y;
      const skillId = loadout[i];
      const skill = skillId ? getSkillById(skillId) : undefined;
      const slotSelected = this.selectedLoadoutSlot === i;

      const wrap = this.scene.add.container(x, y);
      const border = this.scene.add.rectangle(0, 0, LOADOUT_SLOT_SIZE, LOADOUT_SLOT_SIZE)
        .setStrokeStyle(slotSelected ? 3 : 2, slotSelected ? 0xffffff : LINE_COLOR)
        .setFillStyle(0x000000, skill ? 0.35 : 0.12);
      wrap.add(border);

      if (skill) {
        const icon = createSkillIcon(
          this.scene,
          0,
          0,
          skill,
          LOADOUT_SLOT_SIZE - 8,
          learned.has(skill.id) ? LEARNED_COLOR : undefined,
        );
        if (icon) {
          icon.setBlendMode(Phaser.BlendModes.NORMAL);
          wrap.add(icon);
        }
      } else {
        wrap.add(
          this.scene.add.text(0, 0, `${i + 1}`, {
            fontFamily: UI_THEME.fontFamily,
            fontSize: clampFontSizePx('16px'),
            color: '#666666',
          }).setOrigin(0.5),
        );
      }

      const slotHit = this.scene.add.rectangle(0, 0, LOADOUT_SLOT_SIZE, LOADOUT_SLOT_SIZE, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      slotHit.on('pointerup', () => {
        if (this.guidePhase === 'pickLoadoutSlot' && i !== this.guide!.loadoutSlotIndex) return;
        if (this.guidePhase && this.guidePhase !== 'pickLoadoutSlot') return;

        if (this.selectedLoadoutSlot === i) {
          this.selectedLoadoutSlot = null;
          this.refresh();
          return;
        }
        this.selectedLoadoutSlot = i;
        this.refresh();

        if (this.guidePhase === 'pickLoadoutSlot' && i === this.guide!.loadoutSlotIndex) {
          this.advanceGuide('assignSkill');
        }
      });
      wrap.add(slotHit);
      this.loadoutSlotWraps.set(i, wrap);

      const removeY = y + LOADOUT_SLOT_SIZE / 2 + LOADOUT_REMOVE_GAP + 10;
      const removeBtn = this.createOutlineButton(
        x,
        removeY,
        24,
        24,
        '×',
        () => {
          if (skill) this.clearLoadoutSlot(char.id, i);
        },
        skill ? ACCENT_ORANGE : 0x555555,
        skill ? ACCENT_ORANGE_HEX : '#666666',
      );
      if (!skill) removeBtn.setAlpha(0.35);

      this.loadoutContainer.add([wrap, removeBtn]);
    }
  }

  private clearLoadoutSlot(characterId: string, slotIndex: number): void {
    const gs = GameState.getInstance();
    const result = gs.characterManager.setBattleLoadoutSkill(characterId, slotIndex, null);
    if (result.success) {
      gs.persist();
      this.showToast(result.message);
      this.refresh();
    }
  }

  private tryAssignLoadoutSkill(characterId: string, skillId: string, learned: boolean): void {
    if (this.selectedLoadoutSlot === null) return;
    if (!learned) {
      this.showToast('Chưa học võ kỹ này.');
      return;
    }

    const gs = GameState.getInstance();
    const result = gs.characterManager.setBattleLoadoutSkill(
      characterId,
      this.selectedLoadoutSlot,
      skillId,
    );
    this.showToast(result.message);
    if (result.success) {
      gs.persist();
      this.selectedLoadoutSlot = null;
      this.selectedSkillId = skillId;
      this.refresh();
      if (this.guidePhase === 'assignSkill' && skillId === this.guide?.targetSkillId) {
        this.advanceGuide('confirmLoadout');
      }
    }
  }

  private renderTree(char: CharacterData): void {
    this.treeContainer.removeAll(true);
    this.treeNodeWraps.clear();
    const gs = GameState.getInstance();
    const skillPoints = gs.characterManager.getSkillPoints(char.id);
    const learned = new Set(gs.characterManager.getLearnedSkillIds(char.id));
    const nodes = getSkillTreeNodes(char.weaponType, {
      rebirthUnlocked: gs.characterManager.hasReincarnated(char.id),
    });
    const posById = new Map<string, { x: number; y: number }>();

    const rootPos = getSkillTreePosition('weapon', 0);
    this.treeContainer.add(
      this.scene.add.text(
        rootPos.x,
        rootPos.y - NODE_SIZE / 2 - SKILL_POINTS_ABOVE_ROOT_GAP,
        `Điểm võ kỹ: ${skillPoints}`,
        {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx(`${SKILL_POINTS_FONT_PX}px`),
          color: '#ffffff',
          align: 'center',
        },
      ).setOrigin(0.5, 1),
    );

    for (const node of nodes) {
      posById.set(node.skillId, getSkillTreePosition(node.branch, node.row));
    }

    const lines = this.scene.add.graphics();
    lines.lineStyle(2, LINE_COLOR, 1);
    for (const node of nodes) {
      if (!node.parentSkillId) continue;
      const from = posById.get(node.parentSkillId);
      const to = posById.get(node.skillId);
      if (!from || !to) continue;
      lines.beginPath();
      lines.moveTo(from.x, from.y);
      lines.lineTo(from.x, (from.y + to.y) / 2);
      lines.lineTo(to.x, (from.y + to.y) / 2);
      lines.lineTo(to.x, to.y);
      lines.strokePath();
    }
    this.treeContainer.add(lines);

    const seen = new Set<string>();
    for (const node of nodes) {
      if (seen.has(node.skillId)) continue;
      seen.add(node.skillId);
      const skill = getSkillById(node.skillId);
      if (!skill) continue;
      const pos = posById.get(node.skillId)!;
      this.addTreeNode(pos.x, pos.y, skill.id, learned.has(skill.id), char.id);
    }
  }

  private addTreeNode(x: number, y: number, skillId: string, learned: boolean, characterId: string): void {
    const skill = getSkillById(skillId);
    if (!skill) return;

    const wrap = this.scene.add.container(x, y);
    const selected = this.selectedLoadoutSlot === null && this.selectedSkillId === skillId;
    const border = this.scene.add.rectangle(0, 0, NODE_SIZE, NODE_SIZE)
      .setStrokeStyle(selected ? 3 : 2, selected ? 0xffffff : LINE_COLOR)
      .setFillStyle(0x000000, learned ? 0.35 : 0.15);
    wrap.add(border);

    const icon = createSkillIcon(this.scene, 0, 0, skill, NODE_SIZE - 10, learned ? LEARNED_COLOR : undefined);
    if (icon) {
      icon.setBlendMode(Phaser.BlendModes.NORMAL);
      wrap.add(icon);
    }

    const hit = this.scene.add.rectangle(0, 0, NODE_SIZE, NODE_SIZE, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerup', () => {
      if (this.guidePhase === 'pickSkill' && skillId !== this.guide?.targetSkillId) return;
      if (this.guidePhase === 'assignSkill' && skillId !== this.guide?.targetSkillId) return;
      if (this.guidePhase === 'learnSkill' || this.guidePhase === 'pickLoadoutSlot' || this.guidePhase === 'confirmLoadout') {
        return;
      }

      if (this.selectedLoadoutSlot !== null) {
        this.tryAssignLoadoutSkill(characterId, skillId, learned);
        return;
      }
      this.selectedSkillId = skillId;
      this.refresh();

      if (this.guidePhase === 'pickSkill' && skillId === this.guide?.targetSkillId) {
        this.advanceGuide('learnSkill');
      }
    });
    wrap.add(hit);
    this.treeContainer.add(wrap);
    this.treeNodeWraps.set(skillId, wrap);
  }

  private renderDetail(char: CharacterData): void {
    this.detailContainer.removeAll(true);

    const cx = PANEL_W / 2;
    const gs = GameState.getInstance();

    if (this.selectedLoadoutSlot !== null) {
      this.detailContainer.add(
        this.scene.add.text(cx, 72, `Đang chọn cho ô ${this.selectedLoadoutSlot + 1}`, {
          fontFamily: UI_THEME.fontFamilyTitle,
          fontSize: clampFontSizePx('18px'),
          color: ACCENT_ORANGE_HEX,
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: PANEL_W - 28 },
        }).setOrigin(0.5, 0),
      );
      this.detailContainer.add(
        this.scene.add.text(cx, 112, 'Ấn vào võ kỹ đã học trên cây để gán vào ô này. Ấn lại ô để hủy chọn.', {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('15px'),
          color: '#ffffff',
          align: 'center',
          wordWrap: { width: PANEL_W - 32 },
          lineSpacing: 6,
        }).setOrigin(0.5, 0),
      );
      return;
    }

    if (!this.selectedSkillId) {
      this.detailContainer.add(
        this.scene.add.text(cx, GAME_HEIGHT / 2, 'Chọn võ kỹ trên cây', {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('16px'),
          color: '#ffffff',
          align: 'center',
          wordWrap: { width: PANEL_W - 32 },
        }).setOrigin(0.5),
      );
      return;
    }

    const skill = getSkillById(this.selectedSkillId);
    if (!skill) return;

    const learned = gs.characterManager.getLearnedSkillIds(char.id).includes(skill.id);
    const y0 = 52;

    this.detailContainer.add(
      this.scene.add.text(cx, y0, skill.name, {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('20px'),
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: PANEL_W - 28 },
      }).setOrigin(0.5, 0),
    );

    const iconWrap = this.scene.add.container(cx, y0 + 72 + DETAIL_BODY_OFFSET);
    iconWrap.add(
      this.scene.add.rectangle(0, 0, DETAIL_ICON_FRAME, DETAIL_ICON_FRAME)
        .setStrokeStyle(2, LINE_COLOR)
        .setFillStyle(0x000000, 0.2),
    );
    const bigIcon = createSkillIcon(this.scene, 0, 0, skill, DETAIL_ICON_SIZE, learned ? LEARNED_COLOR : undefined);
    if (bigIcon) {
      bigIcon.setBlendMode(Phaser.BlendModes.NORMAL);
      iconWrap.add(bigIcon);
    }
    this.detailContainer.add(iconWrap);

    const lines: string[] = [];
    lines.push(skill.skillPointCost > 0 ? `Điểm võ kỹ -${skill.skillPointCost}` : 'Điểm võ kỹ -0 (cơ bản)');
    if (skill.type === 'chung') lines.push('Loại: Chung');
    if (skill.atkBonus > 0) lines.push(`Công +${skill.atkBonus}`);
    if (skill.defBonus > 0) lines.push(`Thủ +${skill.defBonus}`);
    lines.push(`Nguyên khí tiêu hao: ${skill.qiCost}`);

    this.detailContainer.add(
      this.scene.add.text(cx, y0 + 148 + DETAIL_BODY_OFFSET, lines.join('\n'), {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('16px'),
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: PANEL_W - 28 },
        lineSpacing: 8,
      }).setOrigin(0.5, 0),
    );

    if (skill.category === 'control' || skill.category === 'special' || skill.category === 'defense') {
      this.detailContainer.add(
        this.scene.add.text(cx, y0 + 230 + DETAIL_BODY_OFFSET, skill.description, {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('14px'),
          color: '#ffffff',
          align: 'center',
          wordWrap: { width: PANEL_W - 28 },
          lineSpacing: 4,
        }).setOrigin(0.5, 0),
      );
    }

    if (learned) {
      this.detailContainer.add(
        this.scene.add.text(cx, GAME_HEIGHT - 148, 'Đã học', {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('18px'),
          color: LEARNED_COLOR_HEX,
          fontStyle: 'bold',
        }).setOrigin(0.5),
      );
      return;
    }

    if (skill.skillPointCost === 0) {
      this.detailContainer.add(
        this.scene.add.text(cx, GAME_HEIGHT - 148, 'Võ kỹ cơ bản — tự có', {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('14px'),
          color: '#aaaaaa',
        }).setOrigin(0.5),
      );
      return;
    }

    const learnBtn = new UIButton(this.scene, {
      x: cx,
      y: GAME_HEIGHT - 148,
      width: 150,
      height: 40,
      label: 'Học võ kỹ',
      color: ACCENT_ORANGE,
      flatBackground: true,
      onClick: () => {
        if (this.guidePhase && this.guidePhase !== 'learnSkill') return;
        this.tryLearn(char.id, skill.id);
      },
      addToScene: false,
    });
    this.learnBtnRef = learnBtn;
    this.detailContainer.add(learnBtn);
  }

  private tryLearn(characterId: string, skillId: string): void {
    const gs = GameState.getInstance();
    const result = gs.characterManager.learnSkill(characterId, skillId);
    this.showToast(result.message);
    if (result.success) {
      gs.persist();
      this.refresh();
      if (this.guidePhase === 'learnSkill' && skillId === this.guide?.targetSkillId) {
        this.advanceGuide('pickLoadoutSlot');
      }
    }
  }

  private advanceGuide(next: SkillModalGuidePhase): void {
    this.guidePhase = next;
    this.clearGuideOverlay();
    this.refresh();
  }

  private clearGuideOverlay(): void {
    this.guideOverlay?.hide();
    this.guideOverlay?.destroy();
    this.guideOverlay = undefined;
    this.guideDoneBtn?.destroy(true);
    this.guideDoneBtn = undefined;
    this.restoreLiftedGuideObjects();
  }

  private liftForGuide(obj: Phaser.GameObjects.Container, parent: Phaser.GameObjects.Container): void {
    const localX = obj.x;
    const localY = obj.y;
    const matrix = obj.getWorldTransformMatrix();
    parent.remove(obj, false);
    this.scene.add.existing(obj);
    obj.setPosition(matrix.tx, matrix.ty);
    obj.setDepth(GUIDE_DEPTH + 10);
    this.liftedGuideRefs.push({ obj, parent, localX, localY });
  }

  private restoreLiftedGuideObjects(): void {
    for (const ref of this.liftedGuideRefs) {
      const obj = ref.obj as Phaser.GameObjects.Container;
      obj.removeFromDisplayList();
      ref.parent.add(obj);
      obj.setPosition(ref.localX, ref.localY);
      obj.setDepth(0);
    }
    this.liftedGuideRefs = [];
  }

  private updateGuideOverlay(): void {
    if (!this.guidePhase || !this.guide) return;

    this.clearGuideOverlay();
    this.guideOverlay = new BattleGuideOverlay(this.scene);
    this.guideOverlay.setDepth(GUIDE_DEPTH + 5);

    const phase = this.guidePhase;
    if (phase === 'pickSkill') {
      const center = this.getTreeNodeWorldCenter(this.guide.targetSkillId);
      const wrap = this.treeNodeWraps.get(this.guide.targetSkillId);
      if (!center || !wrap) return;
      this.guideOverlay.show({
        step: 'pickSkill',
        spotlight: { x: center.x, y: center.y, width: NODE_SIZE + 12, height: NODE_SIZE + 12, shape: 'rect' },
        instruction: 'Chọn võ kỹ mới để học.',
        arrow: { fromX: center.x + 180, fromY: center.y - 40, toX: center.x + NODE_SIZE / 2 + 8, toY: center.y - 8 },
      });
      this.liftForGuide(wrap, this.treeContainer);
      return;
    }

    if (phase === 'learnSkill') {
      const cx = PANEL_X + PANEL_W / 2;
      const cy = GAME_HEIGHT - 148;
      this.guideOverlay.show({
        step: 'pickTarget',
        spotlight: { x: cx, y: cy, width: 170, height: 52, shape: 'rect' },
        instruction: 'Ấn "Học võ kỹ" để học.',
        arrow: { fromX: cx - 200, fromY: cy - 90, toX: cx - 85, toY: cy - 8 },
      });
      if (this.learnBtnRef) {
        this.liftForGuide(this.learnBtnRef as Phaser.GameObjects.Container, this.detailContainer);
      }
      return;
    }

    if (phase === 'pickLoadoutSlot') {
      const center = this.getLoadoutSlotWorldCenter(this.guide.loadoutSlotIndex);
      const wrap = this.loadoutSlotWraps.get(this.guide.loadoutSlotIndex);
      if (!center || !wrap) return;
      this.guideOverlay.show({
        step: 'pickTarget',
        spotlight: { x: center.x, y: center.y, width: LOADOUT_SLOT_SIZE + 16, height: LOADOUT_SLOT_SIZE + 16, shape: 'rect' },
        instruction: 'Ấn vào ô trống để chọn võ kỹ vào trận.',
        arrow: { fromX: center.x + 160, fromY: center.y + 80, toX: center.x + LOADOUT_SLOT_SIZE / 2 + 6, toY: center.y + LOADOUT_SLOT_SIZE / 2 + 6 },
      });
      this.liftForGuide(wrap, this.loadoutContainer);
      return;
    }

    if (phase === 'assignSkill') {
      const center = this.getTreeNodeWorldCenter(this.guide.targetSkillId);
      const wrap = this.treeNodeWraps.get(this.guide.targetSkillId);
      if (!center || !wrap) return;
      this.guideOverlay.show({
        step: 'pickSkill',
        spotlight: { x: center.x, y: center.y, width: NODE_SIZE + 12, height: NODE_SIZE + 12, shape: 'rect' },
        instruction: 'Ấn vào võ kỹ vừa học để trang bị.',
        arrow: { fromX: center.x + 200, fromY: center.y + 20, toX: center.x + NODE_SIZE / 2 + 8, toY: center.y + 8 },
      });
      this.liftForGuide(wrap, this.treeContainer);
      return;
    }

    if (phase === 'confirmLoadout') {
      const center = this.getLoadoutSlotWorldCenter(this.guide.loadoutSlotIndex);
      const wrap = this.loadoutSlotWraps.get(this.guide.loadoutSlotIndex);
      if (!center || !wrap) return;
      this.guideOverlay.show({
        step: 'fightNow',
        spotlight: { x: center.x, y: center.y, width: LOADOUT_SLOT_SIZE + 20, height: LOADOUT_SLOT_SIZE + 20, shape: 'rect' },
        instruction: 'Võ kỹ hiện ở ô này là xong.',
        arrow: { fromX: center.x + 150, fromY: center.y + 70, toX: center.x + LOADOUT_SLOT_SIZE / 2 + 4, toY: center.y + LOADOUT_SLOT_SIZE / 2 + 4 },
      });
      this.liftForGuide(wrap, this.loadoutContainer);

      this.guideDoneBtn = this.createOutlineButton(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 48,
        140,
        44,
        'Đã hiểu',
        () => this.completeGuide(),
        ACCENT_ORANGE,
        ACCENT_ORANGE_HEX,
      );
      this.guideDoneBtn.setDepth(GUIDE_DEPTH + 10);
    }
  }

  private getTreeNodeWorldCenter(skillId: string): { x: number; y: number } | null {
    const char = this.getSelectedCharacter();
    if (!char) return null;
    const nodes = getSkillTreeNodes(char.weaponType, {
      rebirthUnlocked: GameState.getInstance().characterManager.hasReincarnated(char.id),
    });
    const node = nodes.find((n) => n.skillId === skillId);
    if (!node) return null;
    const pos = getSkillTreePosition(node.branch, node.row);
    const matrix = this.treeContainer.getWorldTransformMatrix();
    return { x: matrix.tx + pos.x, y: matrix.ty + pos.y };
  }

  private getLoadoutSlotWorldCenter(slotIndex: number): { x: number; y: number } | null {
    const x = LOADOUT_START_X + slotIndex * (LOADOUT_SLOT_SIZE + LOADOUT_GAP);
    const y = LOADOUT_SECTION_Y;
    const matrix = this.loadoutContainer.getWorldTransformMatrix();
    return { x: matrix.tx + x, y: matrix.ty + y };
  }

  private completeGuide(): void {
    this.clearGuideOverlay();
    this.guidePhase = null;
    const done = this.guide?.onComplete;
    this.guide = undefined;
    done?.();
  }

  private showIntroNotice(message: string): void {
    this.introNoticeOverlay?.destroy(true);
    const overlay = this.scene.add.container(0, 0).setDepth(GUIDE_DEPTH + 20);

    overlay.add(
      this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72),
    );

    overlay.add(
      this.scene.add.text(GAME_WIDTH / 2, 120, 'Hướng dẫn võ kỹ', {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('22px'),
        color: UI_THEME.colors.accentAlt,
        fontStyle: 'bold',
      }).setOrigin(0.5, 0),
    );

    overlay.add(
      this.scene.add.text(GAME_WIDTH / 2, 180, message, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('15px'),
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 100 },
        lineSpacing: 8,
      }).setOrigin(0.5, 0),
    );

    const okBtn = new UIButton(this.scene, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 120,
      width: 160,
      height: 44,
      label: 'Đã hiểu',
      color: ACCENT_ORANGE,
      flatBackground: true,
      onClick: () => {
        overlay.destroy(true);
        this.introNoticeOverlay = undefined;
      },
      addToScene: false,
    });
    overlay.add(okBtn);

    this.introNoticeOverlay = overlay;
    this.container.add(overlay);
  }

  close(): void {
    this.introNoticeOverlay?.destroy(true);
    this.introNoticeOverlay = undefined;
    this.clearGuideOverlay();
    super.close();
  }
}
