import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene.ts';
import { LoginScene } from '../scenes/LoginScene.ts';
import { CharacterCreationScene } from '../scenes/CharacterCreationScene.ts';
import { CompanionRecruitmentScene } from '../scenes/CompanionRecruitmentScene.ts';
import { TutorialBattleScene } from '../scenes/TutorialBattleScene.ts';
import { BattleScene } from '../scenes/BattleScene.ts';
import { MainHubScene } from '../scenes/MainHubScene.ts';
import { GAME_WIDTH, GAME_HEIGHT } from './gameDimensions.ts';

export { GAME_WIDTH, GAME_HEIGHT } from './gameDimensions.ts';

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'app',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  dom: {
    createContainer: true,
    pointerEvents: 'none',
  },
  scene: [
    BootScene,
    LoginScene,
    CharacterCreationScene,
    CompanionRecruitmentScene,
    TutorialBattleScene,
    BattleScene,
    MainHubScene,
  ],
};
