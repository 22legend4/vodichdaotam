import { getItemById } from '../data/itemsData.ts';
import type { StageItemReward } from '../constants/gameRules.ts';

export interface TrialRunRewardEntry {
  stageLabel: string;
  exp: number;
  tinhThach: number;
  itemLines: string[];
  bonusLabels: string[];
}

export interface TrialRunRewards {
  entries: TrialRunRewardEntry[];
}

export interface StageRewardSnapshot {
  exp: number;
  tinhThach: number;
  stageLabel?: string;
  itemRewards?: StageItemReward[];
  bonusRewardLabel?: string;
  chosenRewardLabel?: string;
  dungeonBonusRewardLabel?: string;
}

export function createEmptyTrialRunRewards(): TrialRunRewards {
  return { entries: [] };
}

export function appendTrialRunReward(
  current: TrialRunRewards | undefined,
  snapshot: StageRewardSnapshot,
): TrialRunRewards {
  const itemLines: string[] = [];
  for (const grant of snapshot.itemRewards ?? []) {
    if (grant.quantity <= 0) continue;
    const item = getItemById(grant.itemId);
    itemLines.push(`+${grant.quantity} ${item?.name ?? grant.itemId}`);
  }

  const bonusLabels: string[] = [];
  if (snapshot.bonusRewardLabel) bonusLabels.push(snapshot.bonusRewardLabel);
  if (snapshot.chosenRewardLabel) bonusLabels.push(snapshot.chosenRewardLabel);
  if (snapshot.dungeonBonusRewardLabel) bonusLabels.push(snapshot.dungeonBonusRewardLabel);

  const entry: TrialRunRewardEntry = {
    stageLabel: snapshot.stageLabel ?? 'Cửa ải',
    exp: snapshot.exp,
    tinhThach: snapshot.tinhThach,
    itemLines,
    bonusLabels,
  };

  return {
    entries: [...(current?.entries ?? []), entry],
  };
}

function formatEntryLines(entry: TrialRunRewardEntry): string[] {
  const parts: string[] = [];
  if (entry.exp > 0) parts.push(`+${entry.exp.toLocaleString('vi-VN')} EXP`);
  if (entry.tinhThach > 0) parts.push(`+${entry.tinhThach} Tinh thạch`);
  parts.push(...entry.itemLines);
  parts.push(...entry.bonusLabels);
  return parts;
}

/** Nội dung bảng chiến lợi phẩm khi thua chuỗi thử thách. */
export function formatTrialSpoilsBody(rewards: TrialRunRewards): string {
  if (rewards.entries.length === 0) {
    return 'Chưa thu được chiến lợi phẩm nào trong lần này.';
  }

  const lines: string[] = [];
  let totalExp = 0;
  let totalTt = 0;

  for (const entry of rewards.entries) {
    const detail = formatEntryLines(entry);
    lines.push(`• ${entry.stageLabel}: ${detail.length > 0 ? detail.join(', ') : '—'}`);
    totalExp += entry.exp;
    totalTt += entry.tinhThach;
  }

  const totals: string[] = [];
  if (totalExp > 0) totals.push(`${totalExp.toLocaleString('vi-VN')} EXP`);
  if (totalTt > 0) totals.push(`${totalTt} Tinh thạch`);
  if (totals.length > 0) {
    lines.push('');
    lines.push(`Tổng cộng: ${totals.join(', ')}`);
  }

  lines.push('');
  lines.push('Các phần thưởng trên đã được giữ lại.');

  return lines.join('\n');
}
