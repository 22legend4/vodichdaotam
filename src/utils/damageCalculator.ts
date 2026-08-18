/** 1 điểm chỉ số HP = 1 HP thực tế. */
export const HP_STAT_RATIO = 1;

export function calculateMaxHp(hpStat: number): number {
  return hpStat * HP_STAT_RATIO;
}

/**
 * Damage = (Total_ATK²) / (Total_ATK + Total_DEF)
 * Luôn tối thiểu 1 sát thương; làm tròn theo quy tắc toán học (0,5 trở lên → lên).
 */
export function calculateDamage(totalAtk: number, totalDef: number): number {
  if (totalAtk <= 0) {
    return 1;
  }

  const denominator = totalAtk + Math.max(0, totalDef);
  if (denominator <= 0) {
    return 1;
  }

  return Math.max(1, Math.round((totalAtk * totalAtk) / denominator));
}

export class DamageCalculator {
  static calculateMaxHp = calculateMaxHp;
  static calculateDamage = calculateDamage;
}
