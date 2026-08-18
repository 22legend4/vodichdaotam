import type Phaser from 'phaser';
import type { BattleSceneData } from './BattleScene.ts';
import type { MainHubScene } from './MainHubScene.ts';

const HUB_KEY = 'MainHubScene';
const BATTLE_KEY = 'BattleScene';

function isHubParked(hub: Phaser.Scene): boolean {
  return hub.scene.isSleeping() || hub.scene.isPaused();
}

function wakeHub(hub: Phaser.Scene): void {
  if (hub.scene.isPaused()) hub.scene.resume();
  if (hub.scene.isSleeping()) hub.scene.wake();
}

/** Vào trận từ bản đồ — giữ MainHub trong memory (sleep), không destroy. */
export function launchMapBattleFromHub(hubScene: Phaser.Scene, data: BattleSceneData): void {
  hubScene.scene.launch(BATTLE_KEY, { ...data, returnToMap: true });
  hubScene.scene.sleep(HUB_KEY);
  hubScene.scene.bringToTop(BATTLE_KEY);
}

/** Vào trận sự kiện (Leo Tháp) — quay lại màn Sự Kiện sau trận. */
export function launchEventBattleFromHub(hubScene: Phaser.Scene, data: BattleSceneData): void {
  hubScene.scene.launch(BATTLE_KEY, { ...data, returnToEvents: true });
  hubScene.scene.sleep(HUB_KEY);
  hubScene.scene.bringToTop(BATTLE_KEY);
}

/** Thoát trận bản đồ — stop Battle, wake Hub, thăng cấp + mở lại MapModal. */
export function returnToHubMapAfterBattle(battleScene: Phaser.Scene, mapChapterId?: string): void {
  const hub = battleScene.scene.get(HUB_KEY) as MainHubScene | undefined;
  battleScene.scene.stop(BATTLE_KEY);
  if (hub && isHubParked(hub)) {
    wakeHub(hub);
    hub.resumeFromMapBattle(mapChapterId);
    return;
  }
  battleScene.scene.start(HUB_KEY, { openMap: true, mapChapterId });
}

/** Thoát trận sự kiện — wake Hub và mở lại EventsModal. */
export function returnToHubEventsAfterBattle(battleScene: Phaser.Scene): void {
  const hub = battleScene.scene.get(HUB_KEY) as MainHubScene | undefined;
  battleScene.scene.stop(BATTLE_KEY);
  if (hub && isHubParked(hub)) {
    wakeHub(hub);
    hub.resumeFromEventBattle();
    return;
  }
  battleScene.scene.start(HUB_KEY, { openEvents: true });
}

/** Dọn Hub đang sleep/pause trước khi chuyển sang scene khác (vd. nhận đồng đội). */
export function stopPausedHubIfAny(scenePlugin: Phaser.Scenes.ScenePlugin): void {
  const hub = scenePlugin.get(HUB_KEY);
  if (hub && isHubParked(hub)) {
    scenePlugin.stop(HUB_KEY);
  }
}
