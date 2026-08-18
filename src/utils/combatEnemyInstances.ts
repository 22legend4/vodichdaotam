/** Tạo unitId duy nhất khi cùng loại NPC xuất hiện nhiều lần (vd. 2× npc1). */
export function buildEnemyInstances(
  npcIds: string[],
): { unitId: string; npcId: string }[] {
  const seen = new Map<string, number>();
  return npcIds.slice(0, 5).map((npcId) => {
    const index = seen.get(npcId) ?? 0;
    seen.set(npcId, index + 1);
    return {
      unitId: index === 0 ? npcId : `${npcId}__${index + 1}`,
      npcId,
    };
  });
}
