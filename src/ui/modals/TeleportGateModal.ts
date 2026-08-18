import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/gameDimensions.ts';
import { GameState } from '../../state/gameState.ts';
import { resolveChuyenSinhDanItemId } from '../../managers/InventoryManager.ts';
import { HUYET_LONG_TRI_COST_VND } from '../../data/chapter9Stages.ts';
import { ASSET_KEYS } from '../../utils/AssetGenerator.ts';
import { isUsableBgTexture } from '../../utils/characterSpriteAssets.ts';
import { TELEPORT_GATE_ICON_KEYS } from '../../utils/teleportGateAssets.ts';
import { ModalBase } from './ModalBase.ts';
import { UI_THEME, clampFontSizePx } from '../theme.ts';
import { UIButton } from '../UIButton.ts';

const HOAT_TINH_LINH_INTRO =
  'Hỏa Tinh Linh: "Tu sĩ, hãy lựa chọn một trong hai phương án"';

const HUYET_LONG_TRI_DESC =
  'Tu luyện trong \'Huyết Long Trì\', rèn luyện nhục thân. '
  + 'Chi phí: 1.000.000 đ.\n\n'
  + 'Được tặng thêm 3 điểm võ kỹ và mở ra võ kỹ ẩn \'Tứ Phân Quy Nguyên Khí\'. '
  + 'Lưu ý: Người chơi hãy sử dụng vật phẩm \'Phế Võ\' mua trong cửa hàng để thu hồi các điểm võ kỹ đã sử dụng. Người chơi sẽ có đủ 36 điểm võ kỹ để mua Tứ Phân Quy Nguyên Khí. Mở ải \'Giới Tâm\' ';

const CHUYEN_SINH_DAN_DESC =
  'Reset nhân vật về level 1, chơi lại từ đầu. Giữ lại được toàn bộ túi đồ.\n'
  + 'Các nhân vật đồng đội không còn (thu thập đồng đội ở chương 1, như người chơi mới). '
  + 'Nhân vật chính trở về cảnh giới Luyện Thể, được tặng 3 điểm võ kỹ, '
  + 'mở ra võ kỹ ẩn \'Tứ Phân Quy Nguyên Khí\'.';

export interface TeleportGateModalOptions {
  onClose?: () => void;
  /** Sau khi hoàn thành tu luyện Huyết Long Trì — mở giao diện Võ Kỹ. */
  onHuyetLongTriComplete: () => void;
}

export class TeleportGateModal extends ModalBase {
  private confirmOverlay?: Phaser.GameObjects.Container;
  private readonly onHuyetLongTriComplete: () => void;

  constructor(scene: Phaser.Scene, options: TeleportGateModalOptions) {
    super(scene, { title: '', fullscreen: true, hideCloseButton: true, onClose: options.onClose });
    this.onHuyetLongTriComplete = options.onHuyetLongTriComplete;
    this.build();
  }

  close(): void {
    this.confirmOverlay?.destroy(true);
    this.confirmOverlay = undefined;
    super.close();
  }

  private build(): void {
    this.addBackground();

    this.container.add(
      this.scene.add.text(GAME_WIDTH / 2, 44, 'Cổng dịch chuyển', {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('28px'),
        color: UI_THEME.colors.accentAlt,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5),
    );

    this.container.add(
      this.scene.add.text(GAME_WIDTH / 2, 88, HOAT_TINH_LINH_INTRO, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('14px'),
        color: '#ffd600',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 80 },
        lineSpacing: 6,
      }).setOrigin(0.5, 0),
    );

    this.addCenterSpirit();
    this.addHuyetLongTriPanel();
    this.addChuyenSinhDanPanel();

    const backBtn = new UIButton(this.scene, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 44,
      width: 160,
      height: 44,
      label: 'Quay lại',
      onClick: () => this.close(),
      addToScene: false,
    });
    this.container.add(backBtn);
  }

  /** Nền full màn — public/assets/bg/cong-dich-chuyen.jpg (trong container, che bản đồ phía dưới). */
  private addBackground(): void {
    const texKey = ASSET_KEYS.bgTeleportGate;
    const bg = this.scene.textures.exists(texKey) && isUsableBgTexture(this.scene, texKey)
      ? this.scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, texKey)
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      : this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e);
    this.container.addAt(bg, 0);
  }

  private addCenterSpirit(): void {
    const cx = GAME_WIDTH / 2;
    const cy = 248;
    this.container.add(
      this.scene.add.text(cx, cy - 88, 'Hỏa Tinh Linh', {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('20px'),
        color: '#ffd600',
        fontStyle: 'bold',
      }).setOrigin(0.5),
    );
    this.addIcon(cx, cy, TELEPORT_GATE_ICON_KEYS.hoaTinhLinh, 140, true);
  }

  private addHuyetLongTriPanel(): void {
    const cx = 300;
    const iconY = 248;
    this.container.add(
      this.scene.add.text(cx, iconY - 88, 'Lựa chọn 1 — Huyết Long Trì', {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('18px'),
        color: '#ff6b6b',
        fontStyle: 'bold',
      }).setOrigin(0.5),
    );
    this.addIcon(cx, iconY, TELEPORT_GATE_ICON_KEYS.huyetLongTri, 120);

    this.container.add(
      this.scene.add.text(cx, 330, HUYET_LONG_TRI_DESC, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('13px'),
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 360 },
        lineSpacing: 5,
      }).setOrigin(0.5, 0),
    );

    const gs = GameState.getInstance();
    const alreadyDone = gs.isHuyetLongTriComplete();
    const trainBtn = new UIButton(this.scene, {
      x: cx,
      y: GAME_HEIGHT - 108,
      width: 200,
      height: 42,
      label: alreadyDone ? 'Đã tu luyện' : 'Tu luyện',
      color: 0xc0392b,
      flatBackground: true,
      onClick: () => {
        if (alreadyDone) {
          this.showToast('Bạn đã tu luyện Huyết Long Trì rồi.');
          return;
        }
        this.confirmHuyetLongTri();
      },
      addToScene: false,
    });
    this.container.add(trainBtn);
  }

  private addChuyenSinhDanPanel(): void {
    const cx = GAME_WIDTH - 300;
    const iconY = 248;
    this.container.add(
      this.scene.add.text(cx, iconY - 88, 'Lựa chọn 2 — Chuyển sinh đan', {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('18px'),
        color: '#7ec8ff',
        fontStyle: 'bold',
      }).setOrigin(0.5),
    );

    this.addIcon(cx, iconY, TELEPORT_GATE_ICON_KEYS.chuyenSinhDan, 120, true);

    this.container.add(
      this.scene.add.text(cx, 330, CHUYEN_SINH_DAN_DESC, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('13px'),
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 360 },
        lineSpacing: 5,
      }).setOrigin(0.5, 0),
    );

    const useBtn = new UIButton(this.scene, {
      x: cx,
      y: GAME_HEIGHT - 108,
      width: 280,
      height: 50,
      label: 'Ăn Chuyển sinh đan',
      color: 0x2980b9,
      flatBackground: true,
      onClick: () => this.confirmChuyenSinhDan(),
      addToScene: false,
    });
    this.container.add(useBtn);
  }

  private addIcon(x: number, y: number, key: string, maxSize: number, preserveAspect = false): void {
    if (this.scene.textures.exists(key)) {
      const img = this.scene.add.image(x, y, key).setOrigin(0.5);
      if (preserveAspect) {
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        img.setScale(scale);
      } else {
        img.setDisplaySize(maxSize, maxSize);
      }
      this.container.add(img);
      return;
    }
    this.container.add(
      this.scene.add.rectangle(x, y, maxSize, maxSize, 0x333355, 0.6).setStrokeStyle(2, 0xffffff, 0.4),
    );
  }

  private confirmHuyetLongTri(): void {
    this.showConfirm(
      'Tu luyện Huyết Long Trì',
      `Sử dụng ${HUYET_LONG_TRI_COST_VND.toLocaleString('vi-VN')} đ để tu luyện Huyết Long Trì?`,
      () => this.startHuyetLongTri(),
    );
  }

  private confirmChuyenSinhDan(): void {
    const gs = GameState.getInstance();
    const mc = gs.characterManager.getMainCharacter();
    if (!mc) {
      this.showToast('Chưa có nhân vật chính.');
      return;
    }
    const qty = resolveChuyenSinhDanItemId(gs.inventoryManager);
    if (!qty) {
      this.showToast('Không có Chuyển sinh đan trong túi.');
      return;
    }

    this.showConfirm(
      'Xác nhận dùng Chuyển sinh đan',
      CHUYEN_SINH_DAN_DESC + '\n\nHành động này không thể hoàn tác.',
      () => this.useChuyenSinhDan(mc.id),
    );
  }

  private startHuyetLongTri(): void {
    const gs = GameState.getInstance();
    const mc = gs.characterManager.getMainCharacter();
    if (!mc) {
      this.showToast('Chưa có nhân vật chính.');
      return;
    }

    const result = gs.completeHuyetLongTriTraining(mc.id);
    if (!result.success) {
      this.showToast(result.message);
      return;
    }

    gs.syncPartyVitals();
    gs.persist();
    this.showToast(result.message);
    this.close();
    this.onHuyetLongTriComplete();
  }

  private useChuyenSinhDan(characterId: string): void {
    const gs = GameState.getInstance();
    const consumeId = resolveChuyenSinhDanItemId(gs.inventoryManager);
    if (!consumeId || !gs.inventoryManager.removeItem(consumeId, 1)) {
      this.showToast('Không thể dùng Chuyển sinh đan.');
      return;
    }

    const result = gs.applyReincarnation(characterId);
    if (!result.success) {
      gs.inventoryManager.addItem(consumeId, 1);
      this.showToast(result.message);
      return;
    }

    this.showToast(result.message);
    this.close();
  }

  private showConfirm(title: string, body: string, onConfirm: () => void): void {
    this.confirmOverlay?.destroy(true);
    const overlay = this.scene.add.container(0, 0).setDepth(UI_THEME.depth.overlay + 50);

    overlay.add(
      this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72),
    );

    overlay.add(
      this.scene.add.text(GAME_WIDTH / 2, 140, title, {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('22px'),
        color: UI_THEME.colors.accentAlt,
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 80 },
      }).setOrigin(0.5, 0),
    );

    overlay.add(
      this.scene.add.text(GAME_WIDTH / 2, 200, body, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('15px'),
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 100 },
        lineSpacing: 6,
      }).setOrigin(0.5, 0),
    );

    const confirmBtn = new UIButton(this.scene, {
      x: GAME_WIDTH / 2 - 110,
      y: GAME_HEIGHT - 120,
      width: 160,
      height: 44,
      label: 'Xác nhận',
      flatBackground: true,
      onClick: () => {
        overlay.destroy(true);
        this.confirmOverlay = undefined;
        onConfirm();
      },
      addToScene: false,
    });
    overlay.add(confirmBtn);

    const cancelBtn = new UIButton(this.scene, {
      x: GAME_WIDTH / 2 + 110,
      y: GAME_HEIGHT - 120,
      width: 160,
      height: 44,
      label: 'Hủy',
      flatBackground: true,
      onClick: () => {
        overlay.destroy(true);
        this.confirmOverlay = undefined;
      },
      addToScene: false,
    });
    overlay.add(cancelBtn);

    this.confirmOverlay = overlay;
    this.container.add(overlay);
  }
}
