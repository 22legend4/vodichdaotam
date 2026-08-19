import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/gameDimensions.ts';
import { GameState } from '../../state/gameState.ts';
import {
  CHAPTERS_DATA,
  getChapterById,
  getChapterEdges,
  getStageAccessState,
  getStageLockReason,
  canEnterStageBattle,
  getStageReplayBlockReason,
  getStageById,
  getNextTrialBattleId,
  isNguLoiComplete,
  isThienKieuComplete,
  isThienTaiComplete,
  isReplayableDungeonHub,
  CH2_NGU_LOI_HUB_ID,
  CH2_THIEN_TAI_HUB_ID,
  CH3_DUNGEON_HUB_ID,
  CH3_THIEN_KIEU_HUB_ID,
  CH6_DUNGEON_HUB_ID,
  THIEN_TAI_TINH_THACH_COST,
  CH9_TELEPORT_HUB_ID,
  CH9_GIOI_TAM_HUB_ID,
  CH9_GATE_9_ID,
  type StageAccessState,
} from '../../data/chaptersData.ts';
import { DEV_UNLOCK_CH9_SPECIAL_HUBS } from '../../data/chapter9Stages.ts';
import type { MapStageNode } from '../../types/game.ts';
import { getStageStaminaCost } from '../../constants/gameRules.ts';
import { ModalBase } from './ModalBase.ts';
import { UI_THEME, clampFontSizePx, uiFont } from '../theme.ts';
import { UIButton } from '../UIButton.ts';
import { soundManager } from '../../utils/SoundManager.ts';
import { launchMapBattleFromHub } from '../../scenes/battleHubFlow.ts';
import { TrialHubInfoModal } from './TrialHubInfoModal.ts';
import { TeleportGateModal } from './TeleportGateModal.ts';
import { ASSET_KEYS, type SceneBackgroundKey } from '../../utils/AssetGenerator.ts';
import { MAP_STAGE_SWORD_ICON, isUsableBgTexture } from '../../utils/characterSpriteAssets.ts';

const CHAPTER_1_ID = 'chapter_1';
const CHAPTER_2_ID = 'chapter_2';
const CHAPTER_3_ID = 'chapter_3';
const CHAPTER_4_ID = 'chapter_4';
const CHAPTER_5_ID = 'chapter_5';
const CHAPTER_6_ID = 'chapter_6';
const CHAPTER_7_ID = 'chapter_7';
const CHAPTER_8_ID = 'chapter_8';
const CHAPTER_9_ID = 'chapter_9';

const CHAPTER_MAP_BG_KEYS: Record<string, string> = {
  [CHAPTER_1_ID]: ASSET_KEYS.bgVillage,
  [CHAPTER_2_ID]: ASSET_KEYS.bgChapter2Map,
  [CHAPTER_3_ID]: ASSET_KEYS.bgChapter3Map,
  [CHAPTER_4_ID]: ASSET_KEYS.bgChapter4Map,
  [CHAPTER_5_ID]: ASSET_KEYS.bgChapter5Map,
  [CHAPTER_6_ID]: ASSET_KEYS.bgChapter6Map,
  [CHAPTER_7_ID]: ASSET_KEYS.bgChapter78Map,
  [CHAPTER_8_ID]: ASSET_KEYS.bgChapter78Map,
  [CHAPTER_9_ID]: ASSET_KEYS.bgChapter9Map,
};

function battleBackgroundForChapter(chapterId: string): SceneBackgroundKey {
  if (chapterId === CHAPTER_9_ID) return 'chapter9Arena';
  if (chapterId === CHAPTER_8_ID || chapterId === CHAPTER_7_ID) return 'chapter78Arena';
  if (chapterId === CHAPTER_6_ID) return 'chapter6Arena';
  if (chapterId === CHAPTER_5_ID) return 'chapter5Arena';
  if (chapterId === CHAPTER_4_ID) return 'chapter4Arena';
  if (chapterId === CHAPTER_3_ID) return 'chapter3Arena';
  if (chapterId === CHAPTER_2_ID) return 'chapter2Arena';
  if (chapterId === CHAPTER_1_ID) return 'chapter1Arena';
  return 'village';
}

const NODE_GAP = 40;
const NODE_R = 40;
/** Tâm hai nút kề nhau = đường kính + 40px khe hở. */
const CELL = 2 * NODE_R + NODE_GAP;

const ROPE_COLORS: Record<StageAccessState, { body: number; alpha: number }> = {
  locked: { body: 0x6a5a48, alpha: 0.5 },
  available: { body: 0xd4a035, alpha: 0.95 },
  cleared: { body: 0x3d9b5c, alpha: 0.95 },
};

/** Vẽ sợi dây nối giữa hai cửa ải (từ mép nút → mép nút). */
function drawStageRope(
  g: Phaser.GameObjects.Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  nodeR: number,
  state: StageAccessState,
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;

  const ux = dx / dist;
  const uy = dy / dist;
  const sx = x1 + ux * nodeR;
  const sy = y1 + uy * nodeR;
  const ex = x2 - ux * nodeR;
  const ey = y2 - uy * nodeR;

  const { body, alpha } = ROPE_COLORS[state];

  g.lineStyle(9, 0x2a1810, alpha * 0.85);
  g.beginPath();
  g.moveTo(sx, sy);
  g.lineTo(ex, ey);
  g.strokePath();

  g.lineStyle(5, body, alpha);
  g.beginPath();
  g.moveTo(sx, sy);
  g.lineTo(ex, ey);
  g.strokePath();

  g.lineStyle(2, 0xffe8b0, alpha * 0.4);
  g.beginPath();
  g.moveTo(sx - uy * 2, sy + ux * 2);
  g.lineTo(ex - uy * 2, ey + ux * 2);
  g.strokePath();
}

const MAP_HEADER_Y = 36;
const MAP_TAB_Y = 78;
const CHAPTER_PICKER_W = 520;
const CHAPTER_PICKER_H = 40;
const MAP_CLOSE_Y = GAME_HEIGHT - 44;
const MAP_CONTENT_TOP = 120;
const MAP_CONTENT_BOTTOM = 88;

const NODE_COLORS: Record<StageAccessState, { fill: number; stroke: number }> = {
  locked: { fill: 0x444455, stroke: 0x666677 },
  available: { fill: 0x1a508b, stroke: 0xfca311 },
  cleared: { fill: 0x1a6b3a, stroke: 0x2ecc71 },
};

/** Không vẽ dây nối tới các nút đặc biệt Chương 2. */
const HIDDEN_ROPE_TARGET_IDS = new Set([
  'ch2_ngu_loi', 'ch2_thien_tai', CH3_DUNGEON_HUB_ID, CH3_THIEN_KIEU_HUB_ID, CH6_DUNGEON_HUB_ID,
]);
const CH2_START_ID = 'ch2_start';
const CH2_NGU_LOI_ID = 'ch2_ngu_loi';
const NGU_LOI_GAP_FROM_START_PX = 50;
const HUB_HIT_R = 52;
const HUB_STAR_FONT_PX = 80;
const CH9_HUB_LABEL_COLOR = '#fff700';

const CH9_TEXT_HUB_IDS = new Set([CH9_TELEPORT_HUB_ID, CH9_GIOI_TAM_HUB_ID]);

const CH9_TOP_GATE_OFFSET_Y = 20;
const CH9_BOTTOM_GATE_OFFSET_Y = -20;
const CH9_TOP_GATE_IDS = new Set([
  'ch9_gate_1', 'ch9_gate_2', 'ch9_gate_3', 'ch9_gate_4', 'ch9_gate_5',
]);
const CH9_BOTTOM_GATE_IDS = new Set(['ch9_gate_7', 'ch9_gate_8', CH9_GATE_9_ID]);

export interface MapModalOptions {
  onClose?: () => void;
  /** Hiện hướng dẫn đóng bản đồ (bước 2 hướng dẫn võ kỹ). */
  skillEquipGuide?: boolean;
  onCloseButtonReady?: (
    btn: Phaser.GameObjects.GameObject,
    parent: Phaser.GameObjects.Container,
    localX: number,
    localY: number,
  ) => void;
}

export class MapModal extends ModalBase {
  private activeChapterId = CHAPTERS_DATA[0]!.id;
  private chapterPickerOpen = false;
  private mapRoot!: Phaser.GameObjects.Container;
  private glowTweens: Phaser.Tweens.Tween[] = [];
  private confirmContainer: Phaser.GameObjects.Container | null = null;
  private mapPanX = 0;
  private mapPanY = 0;
  private mapPanDragging = false;
  private mapPanMoved = false;
  private mapPanStart = { x: 0, y: 0, panX: 0, panY: 0 };
  private mapPanLimits = { x: 0, y: 0 };
  private mapCenterY = 0;
  private mapPanTeardown: (() => void)[] = [];
  private mapPanSuspended = false;
  private skillEquipGuide = false;
  private onCloseButtonReady?: MapModalOptions['onCloseButtonReady'];
  private guideCloseReadySent = false;
  private teleportGateModal?: TeleportGateModal;

  constructor(scene: Phaser.Scene, onCloseOrOptions?: (() => void) | MapModalOptions) {
    const options: MapModalOptions =
      typeof onCloseOrOptions === 'function'
        ? { onClose: onCloseOrOptions }
        : (onCloseOrOptions ?? {});
    super(scene, { title: '🗺 Bản Đồ', fullscreen: true, onClose: options.onClose });
    this.skillEquipGuide = options.skillEquipGuide === true;
    this.onCloseButtonReady = options.onCloseButtonReady;
    const savedChapterId = GameState.getInstance().getActiveMapChapterId();
    if (getChapterById(savedChapterId)) {
      this.activeChapterId = savedChapterId;
    }
    this.build();
  }

  private build(): void {
    this.clearGlows();
    this.confirmContainer?.destroy(true);
    this.confirmContainer = null;
    this.teardownMapPan();
    this.mapPanX = 0;
    this.mapPanY = 0;
    this.container.removeAll(true);
    this.prependFullscreenInputBlocker();

    const panelX = GAME_WIDTH / 2;
    const panelY = GAME_HEIGHT / 2;

    const panelBgParts: Phaser.GameObjects.GameObject[] = [
      this.scene.add.rectangle(panelX, panelY, GAME_WIDTH, GAME_HEIGHT, 0x0f1628, 1),
    ];
    const mapBgKey = CHAPTER_MAP_BG_KEYS[this.activeChapterId];
    const useChapterMapBg = mapBgKey && isUsableBgTexture(this.scene, mapBgKey);

    if (useChapterMapBg) {
      panelBgParts.push(
        this.scene.add
          .image(panelX, panelY, mapBgKey)
          .setDisplaySize(GAME_WIDTH, GAME_HEIGHT),
        this.scene.add.rectangle(panelX, panelY, GAME_WIDTH, GAME_HEIGHT, 0x0a1628, 0.28),
      );
    }

    const title = this.scene.add.text(GAME_WIDTH / 2, MAP_HEADER_Y, '🗺 Bản Đồ', {
      fontFamily: UI_THEME.fontFamilyTitle,
      fontSize: '22px',
      color: UI_THEME.colors.accentAlt,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const closeBtn = new UIButton(this.scene, {
      x: GAME_WIDTH / 2,
      y: MAP_CLOSE_Y,
      width: 140,
      height: 44,
      label: 'Đóng',
      onClick: () => this.close(),
      addToScene: false,
    });

    const chapterPickerParts = this.buildChapterPicker();

    this.container.add(panelBgParts);

    const mapAreaH = GAME_HEIGHT - MAP_CONTENT_TOP - MAP_CONTENT_BOTTOM;
    this.mapCenterY = MAP_CONTENT_TOP + mapAreaH / 2;
    this.mapRoot = this.scene.add.container(GAME_WIDTH / 2, this.mapCenterY);
    this.container.add(this.mapRoot);

    const maskGfx = this.scene.add.graphics();
    maskGfx.fillStyle(0xffffff, 1);
    maskGfx.fillRect(0, MAP_CONTENT_TOP, GAME_WIDTH, mapAreaH);
    const mapMask = maskGfx.createGeometryMask();
    this.mapRoot.setMask(mapMask);
    maskGfx.setVisible(false);
    this.container.add(maskGfx);

    this.renderChapterMap(getChapterById(this.activeChapterId)!.stages);

    this.container.add([title, ...chapterPickerParts, closeBtn]);

    if (this.skillEquipGuide && !this.guideCloseReadySent) {
      this.guideCloseReadySent = true;
      this.onCloseButtonReady?.(closeBtn, this.container, GAME_WIDTH / 2, MAP_CLOSE_Y);
    }
  }

  /** Nút chọn chương — mặc định chỉ hiện chương đang xem; ấn để mở danh sách. */
  private buildChapterPicker(): Phaser.GameObjects.GameObject[] {
    const parts: Phaser.GameObjects.GameObject[] = [];
    const active = getChapterById(this.activeChapterId)!;
    const chevron = this.chapterPickerOpen ? '▲' : '▼';

    if (this.chapterPickerOpen) {
      const blocker = this.scene.add
        .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.15)
        .setInteractive({ useHandCursor: false });
      blocker.on('pointerdown', () => {
        this.chapterPickerOpen = false;
        this.build();
      });
      parts.push(blocker);
    }

    const toggleBtn = new UIButton(this.scene, {
      x: GAME_WIDTH / 2,
      y: MAP_TAB_Y,
      width: CHAPTER_PICKER_W,
      height: CHAPTER_PICKER_H,
      label: `${active.name}  ${chevron}`,
      selected: true,
      flatBackground: true,
      singleLine: true,
      textPaddingX: 16,
      onClick: () => {
        soundManager.playUiClick();
        this.chapterPickerOpen = !this.chapterPickerOpen;
        this.build();
      },
      addToScene: false,
    });
    parts.push(toggleBtn);

    if (!this.chapterPickerOpen) return parts;

    const itemH = CHAPTER_PICKER_H - 4;
    const listPad = 6;
    const listH = CHAPTERS_DATA.length * itemH + listPad * 2;
    const listTop = MAP_TAB_Y + CHAPTER_PICKER_H / 2 + 4;
    const listCenterY = listTop + listH / 2;

    parts.push(
      this.scene.add
        .rectangle(GAME_WIDTH / 2, listCenterY, CHAPTER_PICKER_W + 8, listH, 0x0f3460, 0.98)
        .setStrokeStyle(2, 0xfca311),
    );

    CHAPTERS_DATA.forEach((ch, i) => {
      const itemY = listTop + listPad + itemH / 2 + i * itemH;
      parts.push(
        new UIButton(this.scene, {
          x: GAME_WIDTH / 2,
          y: itemY,
          width: CHAPTER_PICKER_W - 16,
          height: itemH,
          label: ch.name,
          selected: ch.id === this.activeChapterId,
          flatBackground: true,
          singleLine: true,
          textPaddingX: 16,
          onClick: () => {
            soundManager.playUiClick();
            this.activeChapterId = ch.id;
            GameState.getInstance().setActiveMapChapter(ch.id);
            this.chapterPickerOpen = false;
            this.build();
          },
          addToScene: false,
        }),
      );
    });

    return parts;
  }

  private setupMapPan(contentHalfW: number, contentHalfH: number): void {
    this.teardownMapPan();

    const mapAreaH = GAME_HEIGHT - MAP_CONTENT_TOP - MAP_CONTENT_BOTTOM;
    const halfViewW = GAME_WIDTH / 2 - 16;
    const halfViewH = mapAreaH / 2;
    this.mapPanLimits = {
      x: Math.max(0, contentHalfW - halfViewW),
      y: Math.max(0, contentHalfH - halfViewH),
    };

    const inViewport = (p: Phaser.Input.Pointer) =>
      p.y >= MAP_CONTENT_TOP && p.y <= GAME_HEIGHT - MAP_CONTENT_BOTTOM;

    const onDown = (p: Phaser.Input.Pointer) => {
      if (this.mapPanSuspended || !inViewport(p)) return;
      this.mapPanDragging = true;
      this.mapPanMoved = false;
      this.mapPanStart = { x: p.x, y: p.y, panX: this.mapPanX, panY: this.mapPanY };
    };

    const onMove = (p: Phaser.Input.Pointer) => {
      if (this.mapPanSuspended || !this.mapPanDragging || !p.isDown) return;
      const dx = p.x - this.mapPanStart.x;
      const dy = p.y - this.mapPanStart.y;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) this.mapPanMoved = true;
      if (!this.mapPanMoved) return;
      this.mapPanX = Phaser.Math.Clamp(
        this.mapPanStart.panX + dx,
        -this.mapPanLimits.x,
        this.mapPanLimits.x,
      );
      this.mapPanY = Phaser.Math.Clamp(
        this.mapPanStart.panY + dy,
        -this.mapPanLimits.y,
        this.mapPanLimits.y,
      );
      this.applyMapPan();
    };

    const onUp = () => {
      this.mapPanDragging = false;
    };

    this.scene.input.on('pointerdown', onDown);
    this.scene.input.on('pointermove', onMove);
    this.scene.input.on('pointerup', onUp);
    this.mapPanTeardown.push(
      () => this.scene.input.off('pointerdown', onDown),
      () => this.scene.input.off('pointermove', onMove),
      () => this.scene.input.off('pointerup', onUp),
    );
  }

  private applyMapPan(): void {
    this.mapRoot.setPosition(GAME_WIDTH / 2 + this.mapPanX, this.mapCenterY + this.mapPanY);
  }

  private teardownMapPan(): void {
    for (const off of this.mapPanTeardown) off();
    this.mapPanTeardown = [];
  }

  private suspendMapPan(): void {
    this.mapPanSuspended = true;
    this.mapPanDragging = false;
  }

  private resumeMapPan(): void {
    this.mapPanSuspended = false;
  }

  private renderChapterMap(stages: MapStageNode[]): void {
    if (stages.length === 0) return;

    const visibleStages = stages.filter((s) => {
      if (s.mapHidden) return false;
      if (s.id === CH9_TELEPORT_HUB_ID && GameState.getInstance().isTeleportGateChoiceMade()) {
        return false;
      }
      return true;
    });
    if (visibleStages.length === 0) return;

    const gs = GameState.getInstance();
    const cleared = gs.progress.clearedStageIds;
    const tutorialOk = gs.isTutorialComplete();
    const tinhThach = gs.inventoryManager.getTinhThach();
    const teleportGateReincarnationUsed = gs.isTeleportGateReincarnationUsed();

    const minX = Math.min(...visibleStages.map((s) => s.gridX));
    const maxX = Math.max(...visibleStages.map((s) => s.gridX));
    const minY = Math.min(...visibleStages.map((s) => s.gridY));
    const maxY = Math.max(...visibleStages.map((s) => s.gridY));

    const toPx = (gx: number, gy: number) => ({
      x: (gx - minX - (maxX - minX) / 2) * CELL,
      y: (gy - minY - (maxY - minY) / 2) * CELL,
    });

    const contentHalfW = ((maxX - minX) * CELL) / 2 + NODE_R + 18;
    const contentHalfH = ((maxY - minY) * CELL) / 2 + NODE_R + 18;
    this.setupMapPan(contentHalfW, contentHalfH);

    const stageMap = new Map(visibleStages.map((s) => [s.id, s]));
    const edges = getChapterEdges(this.activeChapterId).filter(
      (e) => !HIDDEN_ROPE_TARGET_IDS.has(e.toId) && stageMap.has(e.fromId) && stageMap.has(e.toId),
    );

    const lines = this.scene.add.graphics();
    lines.setDepth(-1);
    this.mapRoot.add(lines);

    for (const edge of edges) {
      const from = stageMap.get(edge.fromId);
      const to = stageMap.get(edge.toId);
      if (!from || !to) continue;
      const p1 = this.resolveNodePos(from, stageMap, toPx);
      const p2 = this.resolveNodePos(to, stageMap, toPx);
      const toState = getStageAccessState(
        to, cleared, tutorialOk, tinhThach, teleportGateReincarnationUsed,
      );
      drawStageRope(lines, p1.x, p1.y, p2.x, p2.y, NODE_R, toState);
    }

    for (const node of visibleStages) {
      const state = getStageAccessState(
        node, cleared, tutorialOk, tinhThach, teleportGateReincarnationUsed,
      );
      const pos = this.resolveNodePos(node, stageMap, toPx);
      this.drawNode(node, pos.x, pos.y, state);
    }
  }

  /** Vị trí hiển thị nút — Ngũ Lôi Chiến cách Start 50px (không dùng lưới). */
  private resolveNodePos(
    node: MapStageNode,
    stageMap: Map<string, MapStageNode>,
    toPx: (gx: number, gy: number) => { x: number; y: number },
  ): { x: number; y: number } {
    const pos = toPx(node.gridX, node.gridY);
    if (node.id === CH2_NGU_LOI_ID) {
      const start = stageMap.get(CH2_START_ID);
      if (start) {
        const startPos = toPx(start.gridX, start.gridY);
        return {
          x: startPos.x,
          y: startPos.y + NODE_R + NGU_LOI_GAP_FROM_START_PX + NODE_R,
        };
      }
    }
    if (CH9_TOP_GATE_IDS.has(node.id)) {
      return { x: pos.x, y: pos.y + CH9_TOP_GATE_OFFSET_Y };
    }
    if (CH9_BOTTOM_GATE_IDS.has(node.id)) {
      return { x: pos.x, y: pos.y + CH9_BOTTOM_GATE_OFFSET_Y };
    }
    return pos;
  }

  private drawNode(node: MapStageNode, x: number, y: number, state: StageAccessState): void {
    const colors = NODE_COLORS[state];
    const r = NODE_R;
    const hitR = node.id === CH2_START_ID || node.isHub ? HUB_HIT_R : r;
    const iconSize = r * 1.14;
    const isCh9TextHub = CH9_TEXT_HUB_IDS.has(node.id);
    const showStarIcon = node.id === CH2_START_ID || (node.isHub && !isCh9TextHub);

    const nodeContainer = this.scene.add.container(x, y);

    if (state === 'available' && !node.isHub && !node.trialBattleIds?.length) {
      const glow = this.scene.add.circle(0, 0, r + 8, 0xfca311, 0.25);
      nodeContainer.add(glow);
      const tween = this.scene.tweens.add({
        targets: glow,
        alpha: { from: 0.2, to: 0.7 },
        scale: { from: 1, to: 1.2 },
        duration: 900,
        yoyo: true,
        repeat: -1,
      });
      this.glowTweens.push(tween);
    }

    if (state === 'available' && node.trialBattleIds?.length) {
      const glowColor = node.type === 'thunderTrial' ? 0xf0d040 : 0xc77dff;
      const glow = this.scene.add.circle(0, 0, r + 8, glowColor, 0.22);
      nodeContainer.add(glow);
      const tween = this.scene.tweens.add({
        targets: glow,
        alpha: { from: 0.15, to: 0.55 },
        scale: { from: 1, to: 1.15 },
        duration: 900,
        yoyo: true,
        repeat: -1,
      });
      this.glowTweens.push(tween);
    }

    const hitArea = this.scene.add.circle(0, 0, hitR, 0x000000, 0);
    hitArea.setStrokeStyle(state === 'available' ? 4 : 3, colors.stroke, state === 'locked' ? 0.55 : 1);
    nodeContainer.add(hitArea);

    const hasStageIcon = !showStarIcon && !isCh9TextHub && this.scene.textures.exists(MAP_STAGE_SWORD_ICON);
    let hubStar: Phaser.GameObjects.Text | undefined;
    let hubCenterLabel: Phaser.GameObjects.Text | undefined;

    if (showStarIcon) {
      hubStar = this.scene.add.text(0, 0, '★', {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx(`${HUB_STAR_FONT_PX}px`),
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5);
      nodeContainer.add(hubStar);
    } else if (isCh9TextHub) {
      const labelLines = node.displayLabel;
      hubCenterLabel = this.scene.add.text(0, 0, labelLines, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx(labelLines.length > 10 ? '10px' : '12px'),
        color: CH9_HUB_LABEL_COLOR,
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: hitR * 1.75 },
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5);
      nodeContainer.add(hubCenterLabel);
    } else if (hasStageIcon) {
      const icon = this.scene.add
        .image(0, -4, MAP_STAGE_SWORD_ICON)
        .setDisplaySize(iconSize, iconSize)
        .setOrigin(0.5);
      icon.setBlendMode(Phaser.BlendModes.ADD);
      if (state === 'locked') {
        icon.setTint(0x888888).setAlpha(0.55);
      } else if (state === 'cleared') {
        icon.setTint(0xc8ffd0);
      } else {
        icon.setTint(0xfff4a3);
      }
      nodeContainer.add(icon);
    }

    const mapLabel = node.displayLabel;
    const labelBelowNode = !isCh9TextHub && mapLabel.length > 6;
    const fontSize = uiFont(labelBelowNode ? 11 : (mapLabel.length > 2 ? 13 : 16));
    const labelY = labelBelowNode ? r + 14 : (hasStageIcon ? r * 0.42 : 0);
    if (!showStarIcon && !isCh9TextHub) {
      const labelText = this.scene.add.text(0, labelY, mapLabel, {
        fontFamily: UI_THEME.fontFamily,
        fontSize,
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center',
        wordWrap: labelBelowNode ? { width: 128 } : undefined,
      }).setOrigin(0.5, 0);
      nodeContainer.add(labelText);
    }

    if (state === 'locked') {
      const lock = this.scene.add.text(0, -r - 10, '🔒', { fontSize: clampFontSizePx('14px') }).setOrigin(0.5);
      nodeContainer.add(lock);
    }

    if (state === 'cleared' && !showStarIcon && !isCh9TextHub) {
      const check = this.scene.add.text(r - 4, -r + 4, '✓', {
        fontSize: clampFontSizePx('12px'), color: '#2ecc71', fontStyle: 'bold',
      }).setOrigin(1, 0);
      nodeContainer.add(check);
    }

    if (node.type === 'companionUnlock') {
      const badge = this.scene.add.text(-r + 2, r - 2, '👤', { fontSize: clampFontSizePx('10px') }).setOrigin(0, 1);
      nodeContainer.add(badge);
    }
    if (node.type === 'arena') {
      const badge = this.scene.add.text(-r + 2, r - 2, '⚔', { fontSize: clampFontSizePx('10px') }).setOrigin(0, 1);
      nodeContainer.add(badge);
    }
    if (node.type === 'dungeon') {
      const badge = this.scene.add.text(-r + 2, r - 2, '🏴', { fontSize: clampFontSizePx('10px') }).setOrigin(0, 1);
      nodeContainer.add(badge);
    }
    if (node.type === 'thunderTrial') {
      const badge = this.scene.add.text(-r + 2, r - 2, '⚡', { fontSize: clampFontSizePx('10px') }).setOrigin(0, 1);
      nodeContainer.add(badge);
    }
    if (node.type === 'special') {
      const badge = this.scene.add.text(-r + 2, r - 2, '☯', { fontSize: clampFontSizePx('10px') }).setOrigin(0, 1);
      nodeContainer.add(badge);
    }

    const bindNodeClick = (target: Phaser.GameObjects.GameObject, handler: () => void): void => {
      target.setInteractive({ useHandCursor: true });
      target.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (this.mapPanMoved || pointer.getDistance() > 10) return;
        handler();
      });
    };

    if (node.trialBattleIds?.length) {
      bindNodeClick(hitArea, () => this.handleTrialHubClick(node, state));
    } else if (node.isHub) {
      const onHubClick = () => {
        if (state === 'locked') {
          const gs = GameState.getInstance();
          const reason = getStageLockReason(
            node,
            gs.progress.clearedStageIds,
            gs.isTutorialComplete(),
            gs.inventoryManager.getTinhThach(),
            gs.isTeleportGateReincarnationUsed(),
          );
          this.showToast(reason || 'Cửa ải chưa mở khóa');
          return;
        }
        if (state === 'cleared') {
          const gs = GameState.getInstance();
          const replayReason = getStageReplayBlockReason(node, gs.progress.clearedStageIds);
          if (replayReason) {
            this.showToast(replayReason);
            return;
          }
        }
        if (node.id === CH9_TELEPORT_HUB_ID) {
          const gsHub = GameState.getInstance();
          if (gsHub.isTeleportGateChoiceMade()) {
            this.showToast('Bạn đã Chuyển sinh rồi.');
            return;
          }
          const cleared = gsHub.progress.clearedStageIds;
          if (!DEV_UNLOCK_CH9_SPECIAL_HUBS && !cleared.includes(CH9_GATE_9_ID)) {
            this.showToast('Vượt qua Cửa ải 9 trước');
            return;
          }
          this.openTeleportGate();
          return;
        }
        if (node.enemyNpcIds.length > 0 || (node.enemyWaves?.length ?? 0) > 0) {
          this.startBattle(node);
          return;
        }
        this.showToast('Start là điểm xuất phát — chọn nhánh võ đài (1.1, 2.1, 3.1, 4.1) để vào trận.');
      };
      bindNodeClick(hitArea, onHubClick);
      if (hubStar) bindNodeClick(hubStar, onHubClick);
      if (hubCenterLabel) bindNodeClick(hubCenterLabel, onHubClick);
    } else if (state === 'available' || (state === 'cleared' && canEnterStageBattle(node, GameState.getInstance().progress.clearedStageIds))) {
      bindNodeClick(hitArea, () => this.startBattle(node));
      if (hubStar) bindNodeClick(hubStar, () => this.startBattle(node));
    } else if (state === 'locked') {
      bindNodeClick(hitArea, () => {
        const gs = GameState.getInstance();
        const reason = getStageLockReason(
          node, gs.progress.clearedStageIds, gs.isTutorialComplete(), gs.inventoryManager.getTinhThach(),
          gs.isTeleportGateReincarnationUsed(),
        );
        this.showToast(reason || 'Cửa ải chưa mở khóa');
      });
    } else if (state === 'cleared') {
      bindNodeClick(hitArea, () => {
        const gs = GameState.getInstance();
        this.showToast(getStageReplayBlockReason(node, gs.progress.clearedStageIds));
      });
      if (hubStar) {
        bindNodeClick(hubStar, () => {
          const gs = GameState.getInstance();
          this.showToast(getStageReplayBlockReason(node, gs.progress.clearedStageIds));
        });
      }
    }

    this.mapRoot.add(nodeContainer);
  }

  private handleTrialHubClick(node: MapStageNode, state: StageAccessState): void {
    if (state === 'locked') {
      const gs = GameState.getInstance();
      const reason = getStageLockReason(
        node, gs.progress.clearedStageIds, gs.isTutorialComplete(), gs.inventoryManager.getTinhThach(),
        gs.isTeleportGateReincarnationUsed(),
      );
      this.showToast(reason || 'Cửa ải chưa mở khóa');
      return;
    }

    if (node.id === CH2_NGU_LOI_HUB_ID && isNguLoiComplete(GameState.getInstance().progress.clearedStageIds)) {
      this.showToast('Đã hoàn thành Ngũ Lôi Chiến — không thể chơi lại');
      return;
    }

    if (node.id === CH2_THIEN_TAI_HUB_ID && isThienTaiComplete(GameState.getInstance().progress.clearedStageIds)) {
      this.showToast('Đã hoàn thành Thiên Tài Trận — không thể chơi lại');
      return;
    }

    if (node.id === CH3_THIEN_KIEU_HUB_ID && isThienKieuComplete(GameState.getInstance().progress.clearedStageIds)) {
      this.showToast('Đã hoàn thành Thiên kiêu chi tử — không thể chơi lại');
      return;
    }

    const launch = () => {
      const battleNode = this.resolveTrialBattleNode(node);
      if (!battleNode) {
        this.showToast('Không tìm thấy trận đấu');
        return;
      }
      this.startBattle(battleNode);
    };

    const openTrialHub = () => {
      this.suspendMapPan();
      new TrialHubInfoModal(this.scene, node, launch, () => this.resumeMapPan());
    };

    if (node.id === CH2_THIEN_TAI_HUB_ID && !GameState.getInstance().isThienTaiUnlocked()) {
      this.suspendMapPan();
      this.showConfirmDialog(
        'Bạn muốn dùng 500 tinh thạch để mở Trận không?',
        () => {
          const gs = GameState.getInstance();
          if (!gs.inventoryManager.spendTinhThach(THIEN_TAI_TINH_THACH_COST)) {
            this.showToast(`Cần ${THIEN_TAI_TINH_THACH_COST.toLocaleString()} Tinh Thạch`);
            this.resumeMapPan();
            return;
          }
          gs.unlockThienTai();
          openTrialHub();
        },
        () => this.resumeMapPan(),
      );
      return;
    }

    openTrialHub();
  }

  private resolveTrialBattleNode(hub: MapStageNode): MapStageNode | undefined {
    const ids = hub.trialBattleIds;
    if (!ids?.length) return undefined;
    if (isReplayableDungeonHub(hub)) {
      const cleared = GameState.getInstance().progress.clearedStageIds;
      const nextId = getNextTrialBattleId(ids, cleared, true);
      return getStageById(nextId);
    }
    const cleared = GameState.getInstance().progress.clearedStageIds;
    const nextId = getNextTrialBattleId(ids, cleared, false);
    return getStageById(nextId);
  }

  private showConfirmDialog(message: string, onYes: () => void, onNo: () => void): void {
    this.confirmContainer?.destroy(true);

    const overlay = this.scene.add.container(0, 0).setDepth(UI_THEME.depth.overlay + 3);
    const dim = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55);
    const panel = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 520, 200, 0x16213e, 1);
    panel.setStrokeStyle(2, 0xfca311, 1);

    const messageText = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 36, message, {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('17px'),
      color: UI_THEME.colors.text,
      align: 'center',
      wordWrap: { width: 460 },
    }).setOrigin(0.5);

    const yesBtn = new UIButton(this.scene, {
      x: GAME_WIDTH / 2 - 100,
      y: GAME_HEIGHT / 2 + 44,
      width: 140,
      height: 44,
      label: 'Có',
      onClick: () => {
        overlay.destroy(true);
        this.confirmContainer = null;
        soundManager.playUiClick();
        onYes();
      },
      addToScene: false,
    });

    const noBtn = new UIButton(this.scene, {
      x: GAME_WIDTH / 2 + 100,
      y: GAME_HEIGHT / 2 + 44,
      width: 140,
      height: 44,
      label: 'Không',
      onClick: () => {
        overlay.destroy(true);
        this.confirmContainer = null;
        soundManager.playUiClick();
        onNo();
      },
      addToScene: false,
    });

    overlay.add([dim, panel, messageText, yesBtn, noBtn]);
    this.confirmContainer = overlay;
    this.container.add(overlay);
  }

  private startBattle(node: MapStageNode): void {
    const gs = GameState.getInstance();
    if (!canEnterStageBattle(node, gs.progress.clearedStageIds)) {
      this.showToast(getStageReplayBlockReason(node, gs.progress.clearedStageIds));
      return;
    }
    gs.setActiveMapChapter(node.chapterId);
    const staminaCost = getStageStaminaCost(node);
    if (!gs.staminaManager.consumeForStage(staminaCost)) {
      this.showToast(`Không đủ thể lực! (cần ${staminaCost})`);
      return;
    }
    gs.persist();
    soundManager.playUiClick();

    this.close();
    launchMapBattleFromHub(this.scene, {
      stageId: node.id,
      battleGuide: node.id === 'ch1_gate_1' && !gs.isGate1BattleGuideDone()
        ? 'gate1'
        : undefined,
      background: battleBackgroundForChapter(node.chapterId),
      unlockCompanion: node.unlockCompanion,
      unlockCompanionId: node.unlockCompanionId,
      enemyNpcIds: node.enemyWaves?.[0] ?? node.enemyNpcIds,
      enemyWaves: node.enemyWaves,
      currentWaveIndex: 0,
      stageReward: {
        exp: node.expReward,
        tinhThach: node.tinhThachReward ?? 0,
        itemRewards: node.itemRewards,
        bonusRewardLabel: node.bonusRewardLabel,
        stageLabel: node.name,
      },
    });
  }

  private openTeleportGate(): void {
    this.suspendMapPan();
    this.teleportGateModal?.close();
    this.teleportGateModal = new TeleportGateModal(this.scene, {
      onClose: () => {
        this.teleportGateModal = undefined;
        this.resumeMapPan();
      },
      onTeleportGateReincarnationComplete: () => {
        this.teleportGateModal = undefined;
        GameState.getInstance().setActiveMapChapter('chapter_1');
        this.activeChapterId = 'chapter_1';
        this.close();
      },
    });
  }

  private clearGlows(): void {
    for (const t of this.glowTweens) t.destroy();
    this.glowTweens = [];
  }

  close(): void {
    this.clearGlows();
    this.teleportGateModal?.close();
    this.teleportGateModal = undefined;
    this.confirmContainer?.destroy(true);
    this.confirmContainer = null;
    this.teardownMapPan();
    super.close();
  }
}
