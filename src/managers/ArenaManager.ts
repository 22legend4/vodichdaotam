import type { CharacterData, RealmLevel } from '../types/game.ts';
import { REALM_EXP_REQUIREMENTS } from '../constants/gameRules.ts';

export interface ArenaOpponent {
  id: string;
  name: string;
  realm: RealmLevel;
  exp: number;
  /** EXP đặt cược cho thách đấu này. */
  betExp: number;
}

export interface ArenaChallengeResult {
  success: boolean;
  won: boolean;
  betExp: number;
  expChange: number;
  message: string;
}

/** Đối thủ mẫu cùng cảnh giới (offline PvP). */
const MOCK_OPPONENT_NAMES = [
  'Lâm Kiếm Tâm', 'Diệp Vân Phong', 'Hàn Băng', 'Tô Vân Kiếm',
  'Trương Vô Cực', 'Lý Thanh Thanh', 'Mộ Dung Phục', 'Đoàn Dự',
];

export class ArenaManager {
  private postedChallenges: ArenaOpponent[] = [];

  /** Tính EXP tối đa có thể cược mà không tụt cảnh giới. */
  getMaxBetExp(character: CharacterData): number {
    const realmFloor = REALM_EXP_REQUIREMENTS[character.realm];
    return Math.max(0, character.exp - realmFloor);
  }

  canChallengeSameRealm(player: CharacterData, opponent: ArenaOpponent): boolean {
    return player.realm === opponent.realm;
  }

  validateBet(character: CharacterData, betExp: number): { valid: boolean; message: string } {
    if (betExp <= 0) {
      return { valid: false, message: 'Mức cược phải lớn hơn 0.' };
    }
    const max = this.getMaxBetExp(character);
    if (betExp > max) {
      return {
        valid: false,
        message: `Cược tối đa ${max} EXP (tránh tụt cảnh giới).`,
      };
    }
    return { valid: true, message: '' };
  }

  /** Sinh danh sách thách đấu cùng cảnh giới (mock + đã đăng). */
  getChallengesForRealm(realm: RealmLevel, excludePlayerName?: string, count = 8): ArenaOpponent[] {
    const mock = this.getMockChallengesForRealm(realm, count);
    const posted = this.postedChallenges.filter(
      (c) => c.realm === realm && c.name !== excludePlayerName,
    );
    return [...posted, ...mock];
  }

  /** @deprecated Dùng getChallengesForRealm */
  getOpponentsForRealm(realm: RealmLevel, count = 5): ArenaOpponent[] {
    return this.getMockChallengesForRealm(realm, count);
  }

  private getMockChallengesForRealm(realm: RealmLevel, count: number): ArenaOpponent[] {
    const baseExp = REALM_EXP_REQUIREMENTS[realm];
    const betSteps = [100, 200, 350, 500, 750, 1000, 1500, 2000];
    return Array.from({ length: count }, (_, i) => ({
      id: `arena_${realm}_${i}`,
      name: MOCK_OPPONENT_NAMES[i % MOCK_OPPONENT_NAMES.length]!,
      realm,
      exp: baseExp + (i + 1) * 500,
      betExp: betSteps[i % betSteps.length]!,
    }));
  }

  /** Đăng thách đấu lên võ đài (offline — lưu trong phiên). */
  createChallenge(
    player: CharacterData,
    betExp: number,
  ): { success: boolean; message: string } {
    const betCheck = this.validateBet(player, betExp);
    if (!betCheck.valid) {
      return { success: false, message: betCheck.message };
    }

    this.postedChallenges.push({
      id: `arena_post_${player.id}_${Date.now()}`,
      name: player.name,
      realm: player.realm,
      exp: player.exp,
      betExp,
    });

    return {
      success: true,
      message: `Đã tạo thách đấu ${betExp.toLocaleString('vi-VN')} EXP trên võ đài.`,
    };
  }

  /**
   * Giải quyết thách đấu (offline: xác suất dựa trên chênh lệch EXP).
   * Thắng: +betExp | Thua: -betExp
   */
  resolveChallenge(
    player: CharacterData,
    opponent: ArenaOpponent,
    betExp: number,
    playerWins: boolean,
  ): ArenaChallengeResult {
    if (!this.canChallengeSameRealm(player, opponent)) {
      return { success: false, won: false, betExp: 0, expChange: 0, message: 'Chỉ thách đấu cùng cảnh giới!' };
    }

    const betCheck = this.validateBet(player, betExp);
    if (!betCheck.valid) {
      return { success: false, won: false, betExp: 0, expChange: 0, message: betCheck.message };
    }

    const expChange = playerWins ? betExp : -betExp;
    player.exp = Math.max(REALM_EXP_REQUIREMENTS[player.realm], player.exp + expChange);

    return {
      success: true,
      won: playerWins,
      betExp,
      expChange,
      message: playerWins
        ? `Chiến thắng! +${betExp} EXP từ ${opponent.name}.`
        : `Thất bại... -${betExp} EXP.`,
    };
  }

  /** Mô phỏng kết quả trận (tỷ lệ thắng theo EXP). */
  simulateMatch(player: CharacterData, opponent: ArenaOpponent, random = Math.random()): boolean {
    const playerPower = player.exp + player.baseStats.atk * 100;
    const oppPower = opponent.exp + 400;
    const winChance = playerPower / (playerPower + oppPower);
    return random < winChance;
  }
}
