import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/gameDimensions.ts';
import { GameState } from '../../state/gameState.ts';
import {
  HUB_EVENTS,
  getHubEventById,
  type HubEventId,
} from '../../data/eventsData.ts';
import { LEO_THAP_BATTLE_IDS } from '../../data/leoThapData.ts';
import { launchLeoThapBattleFromHub } from '../../scenes/leoThapBattleFlow.ts';
import { UI_THEME, clampFontSizePx, UIButton } from '../index.ts';
import { ModalBase } from './ModalBase.ts';

const BG_COLOR = 0x0d1b4a;
const LINE_COLOR = 0xffd600;
const ACCENT_ORANGE = 0xef6c00;
const ACCENT_ORANGE_HEX = '#ef6c00';
const LIST_ITEM_H = 56;
const LIST_PAD = 12;
const PANEL_X = Math.floor(GAME_WIDTH * 0.38) - 50;
const LEFT_W = PANEL_X;
const PANEL_W = GAME_WIDTH - PANEL_X;

/** Màn sự kiện — danh sách trái + chi tiết phải. */
export class EventsModal extends ModalBase {
  private selectedEventId: HubEventId = 'leo_thap';
  private listContainer!: Phaser.GameObjects.Container;
  private detailContainer!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, onClose?: () => void) {
    super(scene, { title: '', fullscreen: true, onClose });
    this.build();
  }

  private build(): void {
    this.container.add(
      this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, BG_COLOR),
    );

    this.container.add(
      this.scene.add.text(GAME_WIDTH / 2, 36, 'Sự Kiện', {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('22px'),
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5),
    );

    this.container.add(
      this.scene.add
        .rectangle(PANEL_X, GAME_HEIGHT / 2, 2, GAME_HEIGHT - 48, LINE_COLOR)
        .setOrigin(0, 0.5),
    );

    this.listContainer = this.scene.add.container(0, 0);
    this.detailContainer = this.scene.add.container(PANEL_X, 0);
    this.container.add([this.listContainer, this.detailContainer]);

    this.container.add(
      this.createOutlineButton(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 44,
        112,
        40,
        'Đóng',
        () => this.close(),
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
  ): Phaser.GameObjects.Container {
    const wrap = this.scene.add.container(x, y);
    const bg = this.scene.add
      .rectangle(0, 0, width, height)
      .setFillStyle(0x000000, 0)
      .setStrokeStyle(2, LINE_COLOR);
    const text = this.scene.add.text(0, 0, label, {
      fontFamily: UI_THEME.fontFamily,
      fontSize: clampFontSizePx('18px'),
      color: '#ffffff',
    }).setOrigin(0.5);
    const hit = this.scene.add
      .rectangle(0, 0, width, height, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerup', onClick);
    wrap.add([bg, text, hit]);
    return wrap;
  }

  private refresh(): void {
    this.renderList();
    this.renderDetail();
  }

  private renderList(): void {
    this.listContainer.removeAll(true);

    const listTop = 88;
    const listW = LEFT_W - LIST_PAD * 2;

    this.listContainer.add(
      this.scene.add.text(LIST_PAD, listTop - 8, 'Danh sách', {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('15px'),
        color: '#cccccc',
      }).setOrigin(0, 1),
    );

    HUB_EVENTS.forEach((event, i) => {
      const y = listTop + i * (LIST_ITEM_H + 8) + LIST_ITEM_H / 2;
      const selected = this.selectedEventId === event.id;
      const row = this.scene.add.container(LIST_PAD + listW / 2, y);

      const bg = this.scene.add
        .rectangle(0, 0, listW, LIST_ITEM_H, selected ? ACCENT_ORANGE : 0x0f3460, selected ? 0.95 : 0.75)
        .setStrokeStyle(2, selected ? LINE_COLOR : 0x334466);

      const name = this.scene.add.text(-listW / 2 + 14, 0, event.name, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('15px'),
        color: '#ffffff',
        fontStyle: selected ? 'bold' : 'normal',
        wordWrap: { width: listW - 28 },
      }).setOrigin(0, 0.5);

      const hit = this.scene.add
        .rectangle(0, 0, listW, LIST_ITEM_H, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => {
        this.selectedEventId = event.id;
        this.refresh();
      });

      row.add([bg, name, hit]);
      this.listContainer.add(row);
    });
  }

  private renderDetail(): void {
    this.detailContainer.removeAll(true);

    const event = getHubEventById(this.selectedEventId);
    if (!event) return;

    const cx = PANEL_W / 2;
    let y = 72;

    this.detailContainer.add(
      this.scene.add.text(cx, y, event.name, {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('22px'),
        color: ACCENT_ORANGE_HEX,
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: PANEL_W - 40 },
      }).setOrigin(0.5, 0),
    );
    y += 40;

    this.detailContainer.add(
      this.scene.add.text(cx, y, event.tagline, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('15px'),
        color: '#dddddd',
        align: 'center',
        wordWrap: { width: PANEL_W - 40 },
      }).setOrigin(0.5, 0),
    );
    y += 36;

    const blocks: { title: string; body: string }[] = [
      { title: 'Mô tả', body: event.description },
      { title: 'Thời gian', body: event.schedule },
      { title: 'Phần thưởng', body: event.rewards },
    ];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]!;
      if (i === 1) y -= 30;
      this.detailContainer.add(
        this.scene.add.text(28, y, block.title, {
          fontFamily: UI_THEME.fontFamilyTitle,
          fontSize: clampFontSizePx('16px'),
          color: '#ffd600',
          fontStyle: 'bold',
        }).setOrigin(0, 0),
      );
      y += 24;
      this.detailContainer.add(
        this.scene.add.text(28, y, block.body, {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('14px'),
          color: '#ffffff',
          wordWrap: { width: PANEL_W - 56 },
          lineSpacing: 6,
        }).setOrigin(0, 0),
      );
      y += Math.ceil(block.body.length / 42) * 20 + 28;
    }

    y = Math.max(y, GAME_HEIGHT - 250);
    this.renderDetailActions(event.id, cx, y);
  }

  private renderDetailActions(eventId: HubEventId, cx: number, y: number): void {
    if (eventId === 'leo_thap') {
      this.renderLeoThapActions(cx, y);
    }
  }

  private renderLeoThapActions(cx: number, y: number): void {
    const gs = GameState.getInstance();
    const mgr = gs.leoThapManager;
    const active = mgr.isEventActive();
    const participated = mgr.hasParticipatedThisSession();
    const bestFloor = mgr.getBestFloorThisSession();
    const joinCheck = mgr.canJoin();

    const statusColor = active
      ? (participated ? UI_THEME.colors.textMuted : UI_THEME.colors.success)
      : '#f39c12';

    const statusText = active
      ? (participated
        ? `Đã tham gia tuần này${bestFloor > 0 ? ` — cao nhất: Tầng ${bestFloor}/${LEO_THAP_BATTLE_IDS.length}` : ''}`
        : 'Đang mở — tham gia ngay!')
      : `Chưa mở · ${mgr.getScheduleLabel()}`;

    this.detailContainer.add(
      this.scene.add.text(cx, y, statusText, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('14px'),
        color: statusColor,
        align: 'center',
        wordWrap: { width: PANEL_W - 40 },
      }).setOrigin(0.5, 0),
    );

    const btn = new UIButton(this.scene, {
      x: cx,
      y: y + 52,
      width: 260,
      height: 44,
      label: 'Tham gia',
      color: ACCENT_ORANGE,
      flatBackground: true,
      onClick: () => {
        const check = mgr.canJoin();
        if (!check.success) {
          this.showToast(check.message);
          return;
        }
        mgr.markParticipated();
        gs.persist();
        this.close();
        launchLeoThapBattleFromHub(this.scene);
      },
      addToScene: false,
    });
    btn.setEnabled(joinCheck.success);
    this.detailContainer.add(btn);

    if (!active) {
      this.detailContainer.add(
        this.scene.add.text(cx, y + 108, 'Không cần đăng ký trước — vào đúng giờ là tham gia được.', {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('13px'),
          color: UI_THEME.colors.textMuted,
          align: 'center',
          wordWrap: { width: PANEL_W - 40 },
        }).setOrigin(0.5, 0),
      );
    }
  }
}
