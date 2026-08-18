import type Phaser from 'phaser';
import {
  getLeoThapFirstStageId,
  getLeoThapStageById,
  buildLeoThapBattleReward,
  isLeoThapStage,
} from '../data/leoThapData.ts';
import { launchEventBattleFromHub } from '../scenes/battleHubFlow.ts';

/** Bắt đầu Leo Tháp từ tầng 1. */
export function launchLeoThapBattleFromHub(hubScene: Phaser.Scene, stageId = getLeoThapFirstStageId()): void {
  const stage = getLeoThapStageById(stageId);
  if (!stage) return;

  launchEventBattleFromHub(hubScene, {
    stageId: stage.id,
    background: 'chapter6Arena',
    enemyNpcIds: stage.enemyWaves?.[0] ?? stage.enemyNpcIds,
    enemyWaves: stage.enemyWaves,
    currentWaveIndex: 0,
    stageReward: buildLeoThapBattleReward(stage),
  });
}

export function getLeoThapFloorFromStageId(stageId: string): number {
  if (!isLeoThapStage(stageId)) return 0;
  const n = parseInt(stageId.replace('leo_thap_', ''), 10);
  return Number.isFinite(n) ? n : 0;
}
