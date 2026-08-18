import { GAME_WIDTH } from '../../config/gameDimensions.ts';
import { UI_THEME } from '../theme.ts';
import { GameState } from '../../state/gameState.ts';
import { ModalBase } from './ModalBase.ts';
import { TOURNAMENT_CONFIGS } from '../../managers/TournamentManager.ts';
import { HOA_SON_PRIZE_TIER1, HOA_SON_PRIZE_TIER2 } from '../../data/eventItems.ts';
import { getItemById } from '../../data/itemsData.ts';

export class HoaSonLuanVoModal extends ModalBase {
  constructor(scene: Phaser.Scene, onClose?: () => void) {
    const cfg = TOURNAMENT_CONFIGS.hoa_son_luan_vo;
    super(scene, { title: `🏔 ${cfg.name}`, onClose });
    this.build();
  }

  private build(): void {
    const gs = GameState.getInstance();
    const mc = gs.characterManager.getMainCharacter();
    const tm = gs.tournamentManager;
    const cfg = TOURNAMENT_CONFIGS.hoa_son_luan_vo;
    const weekKey = tm.getWeekKey();
    const regCount = tm.getRegistrationCount('hoa_son_luan_vo', weekKey);
    const open = tm.isRegistrationOpen('hoa_son_luan_vo');

    this.addText(GAME_WIDTH / 2, 170,
      `Cảnh giới: Vạn Nhiên / Tiên Linh / Giáp Linh / Cự Linh\nĐăng ký: Thứ 6 (0:00–23:59)  |  Thi đấu: T7 22h\nĐã đăng ký tuần này: ${regCount}/${cfg.maxEntriesPerWeek}`,
      '14px', UI_THEME.colors.textMuted,
    );

    this.addText(GAME_WIDTH / 2, 260, 'Phần thưởng:', '16px', UI_THEME.colors.accentAlt);
    this.addText(GAME_WIDTH / 2, 330,
      'Giải 1 & 2: Chọn yêu thú\nGiải 3: 5 Ngô Đồng Hoang Thảo\nHạng 4–9: 5 Ngô Đồng Thảo  |  Hạng 10–19: 100 Tinh Thạch',
      '13px',
    );

    if (mc) {
      this.addButton(GAME_WIDTH / 2, 420, 300, 48,
        open ? 'Đăng Ký Thi Đấu' : 'Đăng ký đóng (chờ Thứ 6)',
        () => {
          const result = tm.register('hoa_son_luan_vo', mc);
          this.showToast(result.message);
          if (result.success) {
            gs.persist();
            this.close();
            new HoaSonLuanVoModal(this.scene);
          }
        },
      ).setEnabled(open && tm.isRealmEligible('hoa_son_luan_vo', mc.realm));
    }

    const bracket = tm.getBracket('hoa_son_luan_vo', weekKey);
    if (bracket.length > 0) {
      this.addText(GAME_WIDTH / 2, 490, 'Sơ đồ thi đấu:', '15px', UI_THEME.colors.accentAlt);
      const preview = bracket.slice(0, 5).map((m) => {
        const p2 = m.isBye ? 'BYE (vé đặc cách)' : (m.player2Name ?? '?');
        const win = m.winnerId === m.player1Id ? m.player1Name : m.player2Name;
        return `V${m.round}: ${m.player1Name} vs ${p2} → ${win}`;
      }).join('\n');
      this.addText(GAME_WIDTH / 2, 560, preview, '12px', UI_THEME.colors.textMuted);

      const rank = tm.getLastRank('hoa_son_luan_vo');
      if (rank !== null) {
        this.addText(GAME_WIDTH / 2, 610, `Hạng gần nhất: #${rank}`, '14px', UI_THEME.colors.success);
        const prizePool = rank === 1 ? HOA_SON_PRIZE_TIER1 : rank === 2 ? HOA_SON_PRIZE_TIER2 : [];
        if (prizePool.length > 0) {
          prizePool.forEach((id, i) => {
            const item = getItemById(id);
            this.addButton(GAME_WIDTH / 2, 630 + i * 36, 300, 34,
              `Nhận: ${item?.name ?? id}`,
              () => {
                const msgs = tm.distributeRewards('hoa_son_luan_vo', rank, gs.inventoryManager, id);
                gs.persist();
                this.showToast(msgs.join(', ') || 'Đã nhận thưởng!');
              },
            );
          });
        } else if (rank >= 3) {
          this.addButton(GAME_WIDTH / 2, 630, 260, 40, 'Nhận Phần Thưởng', () => {
            const msgs = tm.distributeRewards('hoa_son_luan_vo', rank, gs.inventoryManager);
            gs.persist();
            this.showToast(msgs.join(', ') || 'Đã nhận thưởng!');
          });
        }
      }
    }
  }
}
