import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/gameDimensions.ts';
import { GameState } from '../../state/gameState.ts';
import { ASSET_KEYS } from '../../utils/AssetGenerator.ts';
import { isUsableBgTexture } from '../../utils/characterSpriteAssets.ts';
import { TELEPORT_GATE_ICON_KEYS } from '../../utils/teleportGateAssets.ts';
import { ModalBase } from './ModalBase.ts';
import { UI_THEME, clampFontSizePx } from '../theme.ts';
import { UIButton } from '../UIButton.ts';

const HOAT_TINH_LINH_INTRO =
  'Hỏa Tinh Linh: "Tu sĩ, đây là cơ duyên Chuyển sinh duy nhất tại Cổng dịch chuyển."';

const CHUYEN_SINH_DESC =
  'Chuyển sinh duy nhất một lần tại Cổng dịch chuyển.\n'
  + 'Reset nhân vật về level 1, chơi lại từ ải 1 chương 1. Giữ lại toàn bộ túi đồ.\n'
  + 'Các nhân vật đồng đội không còn (thu thập đồng đội ở chương 1, như người chơi mới). '
  + 'Nhân vật chính trở về cảnh giới Luyện Thể, được tặng 3 điểm võ kỹ, '
  + 'mở ra võ kỹ ẩn \'Tứ Phân Quy Nguyên Khí\'.\n\n'
  + 'Cổng dịch chuyển sẽ biến mất. Nếu không chuyển sinh, bạn vẫn vào Giới Tâm sau khi vượt ải 9. '
  + 'Sau chuyển sinh, phải vượt lại ải 9 chương 9 mới vào được Giới Tâm.';

export interface TeleportGateModalOptions {
  onClose?: () => void;
  /** Sau Chuyển sinh tại cổng — đóng bản đồ, reset về chương 1. */
  onTeleportGateReincarnationComplete: () => void;
}

export class TeleportGateModal extends ModalBase {
  private confirmOverlay?: Phaser.GameObjects.Container;
  private readonly onTeleportGateReincarnationComplete: () => void;

  constructor(scene: Phaser.Scene, options: TeleportGateModalOptions) {
    super(scene, { title: '', fullscreen: true, hideCloseButton: true, onClose: options.onClose });
    this.onTeleportGateReincarnationComplete = options.onTeleportGateReincarnationComplete;
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
    this.addChuyenSinhPanel();

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
    const cy = 220;
    this.container.add(
      this.scene.add.text(cx, cy - 88, 'Hỏa Tinh Linh', {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('20px'),
        color: '#ffd600',
        fontStyle: 'bold',
      }).setOrigin(0.5),
    );
    this.addIcon(cx, cy, TELEPORT_GATE_ICON_KEYS.hoaTinhLinh, 120, true);
  }

  private addChuyenSinhPanel(): void {
    const cx = GAME_WIDTH / 2;
    const iconY = 360;
    this.container.add(
      this.scene.add.text(cx, iconY - 88, 'Chuyển sinh đan', {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('20px'),
        color: '#7ec8ff',
        fontStyle: 'bold',
      }).setOrigin(0.5),
    );

    this.addIcon(cx, iconY, TELEPORT_GATE_ICON_KEYS.chuyenSinhDan, 100, true);

    this.container.add(
      this.scene.add.text(cx, 430, CHUYEN_SINH_DESC, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: clampFontSizePx('13px'),
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 520 },
        lineSpacing: 5,
      }).setOrigin(0.5, 0),
    );

    const alreadyUsed = GameState.getInstance().isTeleportGateReincarnationUsed();
    const useBtn = new UIButton(this.scene, {
      x: cx,
      y: GAME_HEIGHT - 108,
      width: 280,
      height: 50,
      label: alreadyUsed ? 'Đã chuyển sinh' : 'Chuyển sinh',
      color: 0x2980b9,
      flatBackground: true,
      onClick: () => {
        if (alreadyUsed) {
          this.showToast('Bạn đã chuyển sinh tại Cổng dịch chuyển rồi.');
          return;
        }
        this.confirmChuyenSinh();
      },
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

  private confirmChuyenSinh(): void {
    const gs = GameState.getInstance();
    const mc = gs.characterManager.getMainCharacter();
    if (!mc) {
      this.showToast('Chưa có nhân vật chính.');
      return;
    }

    this.showConfirm(
      'Xác nhận Chuyển sinh',
      CHUYEN_SINH_DESC + '\n\nHành động này không thể hoàn tác.',
      () => this.applyTeleportGateReincarnation(mc.id),
    );
  }

  private applyTeleportGateReincarnation(characterId: string): void {
    const gs = GameState.getInstance();
    const result = gs.applyTeleportGateReincarnation(characterId);
    if (!result.success) {
      this.showToast(result.message);
      return;
    }

    this.showToast(result.message);
    this.close();
    this.onTeleportGateReincarnationComplete();
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
