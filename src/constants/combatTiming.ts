/** GDD: Thời gian ra chiêu — cả hai phe đồng thời (ms). */
export const COMBAT_CAST_DURATION_MS = 3000;

/** Pha 1: võ kỹ xuất hiện trên người ra chiêu. */
export const COMBAT_SKILL_MANIFEST_MS = 450;

/** Pha 2: võ kỹ bay từ người ra chiêu tới địch. */
export const COMBAT_SKILL_TRAVEL_MS = 1000;

/** Pha 3: hiệu ứng nổ trên thân địch. */
export const COMBAT_SKILL_IMPACT_MS = 1000;

/** Thời điểm sát thương / số bay lên — hết pha bay, bắt đầu pha nổ. */
export const COMBAT_DAMAGE_REVEAL_MS =
  COMBAT_SKILL_MANIFEST_MS + COMBAT_SKILL_TRAVEL_MS;
