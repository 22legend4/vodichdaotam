import type { CharacterData, RealmLevel } from '../types/game.ts';
import type { InventoryManager } from './InventoryManager.ts';
import {
  BLOODY_ARENA_PRIZE_TIER1,
  HOA_SON_PRIZE_TIER1,
  HOA_SON_PRIZE_TIER2,
} from '../data/eventItems.ts';
import { SPATIAL_RING_ITEM_ID } from './InventoryManager.ts';

export type TournamentId = 'bloody_arena' | 'hoa_son_luan_vo';

export interface TournamentMatch {
  id: string;
  round: number;
  player1Id: string;
  player1Name: string;
  player2Id: string | null;
  player2Name: string | null;
  winnerId: string | null;
  isBye: boolean;
}

export interface TournamentRegistration {
  tournamentId: TournamentId;
  weekKey: string;
  count: number;
}

export interface TournamentSaveState {
  registrations: TournamentRegistration[];
  brackets: Record<string, TournamentMatch[]>;
  lastResults: Record<string, { rank: number; weekKey: string } | undefined>;
}

export interface TournamentConfig {
  id: TournamentId;
  name: string;
  eventHour: number;
  eventDay: number;
  registrationDay: number;
  eligibleRealms: RealmLevel[];
  maxEntriesPerWeek: number;
  maxParticipants: number;
}

export const TOURNAMENT_CONFIGS: Record<TournamentId, TournamentConfig> = {
  bloody_arena: {
    id: 'bloody_arena',
    name: 'Đấu Trường Đẫm Máu',
    eventHour: 22,
    eventDay: 0,
    registrationDay: 6,
    eligibleRealms: ['NhatTinh', 'NhiTinh', 'TamTinh'],
    maxEntriesPerWeek: 5,
    maxParticipants: 256,
  },
  hoa_son_luan_vo: {
    id: 'hoa_son_luan_vo',
    name: 'Hoa Sơn Luận Võ',
    eventHour: 22,
    eventDay: 6,
    registrationDay: 5,
    eligibleRealms: ['VanNhien', 'TienLinh', 'GiapLinh', 'CuLinh'],
    maxEntriesPerWeek: 5,
    maxParticipants: 256,
  },
};

export interface RegisterResult {
  success: boolean;
  message: string;
  registrationCount: number;
}

export class TournamentManager {
  private state: TournamentSaveState = {
    registrations: [],
    brackets: {},
    lastResults: {},
  };

  getState(): TournamentSaveState {
    return structuredClone(this.state);
  }

  importState(state: TournamentSaveState): void {
    this.state = structuredClone(state);
  }

  exportState(): TournamentSaveState {
    return structuredClone(this.state);
  }

  getWeekKey(date = new Date()): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-W${week}`;
  }

  isRealmEligible(tournamentId: TournamentId, realm: RealmLevel): boolean {
    return TOURNAMENT_CONFIGS[tournamentId].eligibleRealms.includes(realm);
  }

  isRegistrationOpen(tournamentId: TournamentId, date = new Date()): boolean {
    const cfg = TOURNAMENT_CONFIGS[tournamentId];
    return date.getDay() === cfg.registrationDay;
  }

  isEventTime(tournamentId: TournamentId, date = new Date()): boolean {
    const cfg = TOURNAMENT_CONFIGS[tournamentId];
    return date.getDay() === cfg.eventDay && date.getHours() >= cfg.eventHour;
  }

  getRegistrationCount(tournamentId: TournamentId, weekKey = this.getWeekKey()): number {
    return (
      this.state.registrations.find(
        (r) => r.tournamentId === tournamentId && r.weekKey === weekKey,
      )?.count ?? 0
    );
  }

  register(tournamentId: TournamentId, player: CharacterData, date = new Date()): RegisterResult {
    const cfg = TOURNAMENT_CONFIGS[tournamentId];
    const weekKey = this.getWeekKey(date);

    if (!this.isRegistrationOpen(tournamentId, date)) {
      return {
        success: false,
        message: `Đăng ký ${cfg.name} chỉ mở vào ${this.dayName(cfg.registrationDay)} 0:00–23:59.`,
        registrationCount: this.getRegistrationCount(tournamentId, weekKey),
      };
    }

    if (!this.isRealmEligible(tournamentId, player.realm)) {
      return {
        success: false,
        message: `Cảnh giới không đủ điều kiện tham gia ${cfg.name}.`,
        registrationCount: this.getRegistrationCount(tournamentId, weekKey),
      };
    }

    const existing = this.state.registrations.find(
      (r) => r.tournamentId === tournamentId && r.weekKey === weekKey,
    );
    const count = existing?.count ?? 0;

    if (count >= cfg.maxEntriesPerWeek) {
      return {
        success: false,
        message: `Đã đăng ký tối đa ${cfg.maxEntriesPerWeek} lần/tuần.`,
        registrationCount: count,
      };
    }

    if (existing) {
      existing.count += 1;
    } else {
      this.state.registrations.push({ tournamentId, weekKey, count: 1 });
    }

    const newCount = count + 1;
    this.generateBracket(tournamentId, weekKey, player);

    return {
      success: true,
      message: `Đăng ký ${cfg.name} thành công (${newCount}/${cfg.maxEntriesPerWeek}).`,
      registrationCount: newCount,
    };
  }

  /** Tạo bracket loại trực tiếp (mock người chơi + bye nếu lẻ). */
  generateBracket(tournamentId: TournamentId, weekKey: string, player: CharacterData): TournamentMatch[] {
    const cfg = TOURNAMENT_CONFIGS[tournamentId];
    const participantCount = Math.min(
      cfg.maxParticipants,
      8 + Math.floor(Math.random() * 24),
    );

    const participants: { id: string; name: string }[] = [{ id: player.id, name: player.name }];
    for (let i = 1; i < participantCount; i++) {
      participants.push({ id: `bot_${i}`, name: `Tu sĩ #${i}` });
    }

    this.shuffle(participants);

    const matches: TournamentMatch[] = [];
    let round = 1;
    let current = [...participants];

    while (current.length > 1) {
      const nextRound: { id: string; name: string }[] = [];
      for (let i = 0; i < current.length; i += 2) {
        const p1 = current[i]!;
        const p2 = current[i + 1];
        const isBye = !p2;
        const winner = isBye ? p1 : Math.random() < 0.5 ? p1 : p2!;

        matches.push({
          id: `${weekKey}_${tournamentId}_r${round}_${i}`,
          round,
          player1Id: p1.id,
          player1Name: p1.name,
          player2Id: p2?.id ?? null,
          player2Name: p2?.name ?? null,
          winnerId: winner.id,
          isBye,
        });
        nextRound.push(winner);
      }
      current = nextRound;
      round += 1;
    }

    this.state.brackets[`${tournamentId}_${weekKey}`] = matches;

    const playerRank = this.calculatePlayerRank(matches, player.id);
    this.state.lastResults[tournamentId] = { rank: playerRank, weekKey };

    return matches;
  }

  getBracket(tournamentId: TournamentId, weekKey = this.getWeekKey()): TournamentMatch[] {
    return this.state.brackets[`${tournamentId}_${weekKey}`] ?? [];
  }

  getLastRank(tournamentId: TournamentId): number | null {
    return this.state.lastResults[tournamentId]?.rank ?? null;
  }

  distributeRewards(
    tournamentId: TournamentId,
    rank: number,
    inventory: InventoryManager,
    chosenItemId?: string,
  ): string[] {
    const messages: string[] = [];

    if (tournamentId === 'bloody_arena') {
      if (rank === 1) {
        for (const itemId of BLOODY_ARENA_PRIZE_TIER1) {
          inventory.addItem(itemId, 1);
        }
        messages.push('Giải 1: Phá Nhược Đao, Thiết Lăng Thương, Mộc Linh Kiếm, Thiết Chấn Táo');
      } else if (rank === 2) {
        inventory.addItem('eq_thanhMocQuan', 1);
        inventory.addItem('eq_thietCuongKhang', 1);
        messages.push('Giải 2: 1 Thanh Mộc Quán, 1 Thiết Cương Khang');
      } else if (rank === 3) {
        inventory.addItem('eq_bichMocKhai', 1);
        messages.push('Giải 3: 1 Bích Mộc Khải');
      } else if (rank >= 4 && rank <= 9) {
        inventory.addItem('eq_nhaiThu', 1);
        messages.push('Hạng 4–9: 1 Nhai Thủ');
      } else if (rank >= 10 && rank <= 19) {
        if (inventory.getCapacity() >= 48) {
          messages.push('Hạng 10–19: Túi đồ đã đủ 48 ngăn — không nhận thêm phần thưởng.');
        } else {
          inventory.addItem(SPATIAL_RING_ITEM_ID, 1);
          messages.push('Hạng 10–19: Nhẫn không gian');
        }
      }
    }

    if (tournamentId === 'hoa_son_luan_vo') {
      if (rank === 1 && chosenItemId && HOA_SON_PRIZE_TIER1.includes(chosenItemId as typeof HOA_SON_PRIZE_TIER1[number])) {
        inventory.addItem(chosenItemId, 1);
        messages.push(`Giải 1: Yêu thú ${chosenItemId}`);
      } else if (rank === 2 && chosenItemId && HOA_SON_PRIZE_TIER2.includes(chosenItemId as typeof HOA_SON_PRIZE_TIER2[number])) {
        inventory.addItem(chosenItemId, 1);
        messages.push(`Giải 2: Yêu thú ${chosenItemId}`);
      } else if (rank === 3) {
        inventory.addItem('med_ngoDongHoangThao', 5);
        messages.push('Giải 3: 5 Ngô Đồng Hoang Thảo');
      } else if (rank >= 4 && rank <= 9) {
        inventory.addItem('med_ngoDongThao', 5);
        messages.push('Hạng 4–9: 5 Ngô Đồng Thảo');
      } else if (rank >= 10 && rank <= 19) {
        inventory.addTinhThach(100);
        messages.push('Hạng 10–19: 100 Tinh Thạch');
      }
    }

    return messages;
  }

  private calculatePlayerRank(matches: TournamentMatch[], playerId: string): number {
    const lastRound = Math.max(...matches.map((m) => m.round), 1);
    const finalMatch = matches.find((m) => m.round === lastRound);
    if (finalMatch?.winnerId === playerId) return 1;
    if (finalMatch && (finalMatch.player1Id === playerId || finalMatch.player2Id === playerId)) return 2;
    return 4 + Math.floor(Math.random() * 16);
  }

  private shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
  }

  private dayName(day: number): string {
    const names = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return names[day] ?? '';
  }
}
