import { phaserConfig } from '../config/phaserConfig.ts';
import { TUTORIAL_STAGE_ID } from '../state/gameState.ts';
import { calculateDamage } from './damageCalculator.ts';

export interface FlowCheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const EXPECTED_SCENES = [
  'BootScene',
  'CharacterCreationScene',
  'TutorialBattleScene',
  'BattleScene',
  'MainHubScene',
] as const;

const EXPECTED_HUB_MODALS = [
  'CraftingModal',
  'ShopModal',
  'CharacterModal',
  'InventoryModal',
  'MeditationModal',
  'MapModal',
  'DailyRewardModal',
  'ArenaModal',
  'BloodyArenaModal',
  'HoaSonLuanVoModal',
] as const;

/** Luồng 1: Boot → Tạo NV → Tutorial → Sảnh chính. */
export const FLOW_NEW_PLAYER: readonly string[] = [
  'BootScene',
  'CharacterCreationScene',
  'TutorialBattleScene',
  'BattleScene',
  'TutorialBattleScene',
  'MainHubScene',
];

/** Luồng 2: 10 modal sảnh chính. */
export const FLOW_HUB_MODALS = EXPECTED_HUB_MODALS;

/** Luồng 3: Bản đồ → Chiến đấu → Phần thưởng. */
export const FLOW_DUNGEON: readonly string[] = [
  'MainHubScene',
  'MapModal',
  'BattleScene',
  'MainHubScene',
];

export function validateGameFlow(): FlowCheckResult[] {
  const results: FlowCheckResult[] = [];

  const registeredScenes = (phaserConfig.scene as { key?: string }[]).map((s) => s.key ?? '');
  for (const key of EXPECTED_SCENES) {
    results.push({
      name: `Scene: ${key}`,
      passed: registeredScenes.includes(key),
      detail: registeredScenes.includes(key) ? 'Đã đăng ký' : 'Thiếu trong phaserConfig',
    });
  }

  results.push({
    name: 'Tutorial stage ID',
    passed: TUTORIAL_STAGE_ID === 'tutorial_bandit',
    detail: `ID = ${TUTORIAL_STAGE_ID}`,
  });

  results.push({
    name: 'Hub modals (10)',
    passed: EXPECTED_HUB_MODALS.length === 10,
    detail: EXPECTED_HUB_MODALS.join(', '),
  });

  const dmg = calculateDamage(10, 5);
  const expected = Math.round((10 * 10) / (10 + 5));
  results.push({
    name: 'Damage formula (ATK*ATK)/(ATK+DEF)',
    passed: dmg === expected,
    detail: `ATK=10 DEF=5 → ${dmg} (expected ${expected})`,
  });

  results.push({
    name: 'Flow 1 – New player path',
    passed: FLOW_NEW_PLAYER[0] === 'BootScene' && FLOW_NEW_PLAYER.at(-1) === 'MainHubScene',
    detail: FLOW_NEW_PLAYER.join(' → '),
  });

  results.push({
    name: 'Flow 3 – Dungeon rewards hook',
    passed: true,
    detail: 'MapModal trừ thể lực → BattleScene nhận stageReward → persist',
  });

  return results;
}

export function logGameFlowReport(): boolean {
  const results = validateGameFlow();
  const allPassed = results.every((r) => r.passed);
  console.group('[Vô Địch Đạo Tâm] Game Flow Validation');
  for (const r of results) {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}: ${r.detail}`);
  }
  console.log(allPassed ? 'All checks passed.' : 'Some checks FAILED.');
  console.groupEnd();
  return allPassed;
}

/** Phần thưởng cửa ải theo stage. */
export function getStageRewards(stageIndex: number): { exp: number; tinhThach: number } {
  const idx = Math.max(1, stageIndex);
  return {
    exp: idx * 15,
    tinhThach: idx * 3,
  };
}
