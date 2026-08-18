import type { MapStageNode } from '../types/game.ts';
import { getItemById } from '../data/itemsData.ts';
import { getNpcById } from '../data/npcsData.ts';

function formatNpcGroup(npcIds: readonly string[]): string {
  const counts = new Map<string, number>();
  for (const id of npcIds) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([id, count]) => `${count} ${getNpcById(id)?.name ?? id}`)
    .join(' + ');
}

export function formatStageEnemies(stage: MapStageNode): string {
  const waves = stage.enemyWaves;
  if (waves && waves.length > 1) {
    return waves
      .map((wave, index) => `Đợt ${index + 1}: ${formatNpcGroup(wave)}`)
      .join(' | ');
  }
  if (stage.enemyNpcIds.length === 0) return '—';
  return formatNpcGroup(stage.enemyNpcIds);
}

export function formatStageBonusRewards(stage: MapStageNode): string {
  const parts: string[] = [];
  if (stage.tinhThachReward && stage.tinhThachReward > 0) {
    parts.push(`${stage.tinhThachReward} Tinh Thạch`);
  }
  for (const grant of stage.itemRewards ?? []) {
    if (grant.quantity <= 0) continue;
    const item = getItemById(grant.itemId);
    parts.push(`${grant.quantity} ${item?.name ?? grant.itemId}`);
  }
  if (stage.bonusRewardLabel) parts.push(stage.bonusRewardLabel);
  if (stage.rewardChoiceIds?.length) parts.push('Chọn 1 vật phẩm');
  return parts.length > 0 ? parts.join(', ') : '—';
}

export function formatTrialStageBlock(stage: MapStageNode, cleared: boolean): string {
  const gate = stage.displayLabel || stage.name;
  const status = cleared ? ' ✓' : '';
  return [
    `Cửa ải: ${gate}${status}`,
    `Đối thủ: ${formatStageEnemies(stage)}`,
    `Kinh nghiệm: ${stage.expReward.toLocaleString('vi-VN')} EXP`,
    `Phần thưởng thêm: ${formatStageBonusRewards(stage)}`,
  ].join('\n');
}

export const TRIAL_DEFEAT_RETAIN_NOTE =
  'Lưu ý: Thua ở ải nào thì kinh nghiệm và phần thưởng của các ải trước đó vẫn được nhận.';
