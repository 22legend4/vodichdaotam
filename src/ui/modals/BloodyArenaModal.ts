import { GAME_WIDTH } from '../../config/gameDimensions.ts';
import { UI_THEME } from '../theme.ts';
import { GameState } from '../../state/gameState.ts';
import { ModalBase } from './ModalBase.ts';
import { TOURNAMENT_CONFIGS } from '../../managers/TournamentManager.ts';

export class BloodyArenaModal extends ModalBase {
  constructor(scene: Phaser.Scene, onClose?: () => void) {
    const cfg = TOURNAMENT_CONFIGS.bloody_arena;
    super(scene, { title: `🩸 ${cfg.name}`, onClose });
    this.build();
  }

  private build(): void {
    const gs = GameState.getInstance();
    const mc = gs.characterManager.getMainCharacter();
    const tm = gs.tournamentManager;
    const cfg = TOURNAMENT_CONFIGS.bloody_arena;
    const weekKey = tm.getWeekKey();
    const regCount = tm.getRegistrationCount('bloody_arena', weekKey);
    const open = tm.isRegistrationOpen('bloody_arena');

    this.addText(GAME_WIDTH / 2, 170,
      `Cảnh giới: Nhất/Nhị/Tam Tinh\nĐăng ký: Thứ 7 (0:00–23:59)  |  Thi đấu: CN 22h\nĐã đăng ký tuần này: ${regCount}/${cfg.maxEntriesPerWeek}`,
      '14px', UI_THEME.colors.textMuted,
    );

    this.addText(GAME_WIDTH / 2, 260, 'Phần thưởng:', '16px', UI_THEME.colors.accentAlt);
    this.addText(GAME_WIDTH / 2, 320,
      'Giải 1: Phá Nhược Đao + Thiết Lăng Thương + Mộc Linh Kiếm + Thiết Chấn Táo\n' +
      'Giải 2: 1 Thanh Mộc Quán + 1 Thiết Cương Khang  |  Giải 3: 1 Bích Mộc Khải\n' +
      'Hạng 4–9: 1 Nhai Thủ  |  Hạng 10–19: Nhẫn không gian (túi chưa đủ 48 ngăn)',
      '13px',
    );

    if (mc) {
      this.addButton(GAME_WIDTH / 2, 430, 300, 48,
        open ? 'Đăng Ký Thi Đấu' : 'Đăng ký đóng (chờ Thứ 7)',
        () => {
          const result = tm.register('bloody_arena', mc);
          this.showToast(result.message);
          if (result.success) {
            gs.persist();
            this.close();
            new BloodyArenaModal(this.scene);
          }
        },
      ).setEnabled(open && tm.isRealmEligible('bloody_arena', mc.realm));
    }

    const bracket = tm.getBracket('bloody_arena', weekKey);
    if (bracket.length > 0) {
      this.addText(GAME_WIDTH / 2, 500, 'Sơ đồ thi đấu (vòng loại trực tiếp):', '15px', UI_THEME.colors.accentAlt);
      const preview = bracket.slice(0, 6).map((m) => {
        const p2 = m.isBye ? 'BYE' : (m.player2Name ?? '?');
        const win = m.winnerId === m.player1Id ? m.player1Name : m.player2Name;
        return `V${m.round}: ${m.player1Name} vs ${p2} → ${win}`;
      }).join('\n');
      this.addText(GAME_WIDTH / 2, 580, preview, '12px', UI_THEME.colors.textMuted);

      const rank = tm.getLastRank('bloody_arena');
      if (rank !== null) {
        this.addText(GAME_WIDTH / 2, 620, `Hạng gần nhất: #${rank}`, '14px', UI_THEME.colors.success);
        if (rank === 1 || rank >= 2) {
          this.addButton(GAME_WIDTH / 2, 640, 260, 40, 'Nhận Phần Thưởng', () => {
            const msgs = tm.distributeRewards('bloody_arena', rank, gs.inventoryManager);
            gs.persist();
            this.showToast(msgs.join(', ') || 'Đã nhận thưởng!');
          });
        }
      }
    }
  }
}
