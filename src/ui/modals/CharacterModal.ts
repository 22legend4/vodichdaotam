import { GAME_WIDTH } from '../../config/gameDimensions.ts';
import { GameState } from '../../state/gameState.ts';
import { getItemById } from '../../data/itemsData.ts';
import { REALM_LABELS } from '../theme.ts';
import { runRealmProgressionFlow } from '../realmBreakthroughFlow.ts';
import { ModalBase } from './ModalBase.ts';

export class CharacterModal extends ModalBase {
  constructor(scene: Phaser.Scene, onClose?: () => void) {
    super(scene, { title: '👤 Nhân Vật', onClose });
    this.build();
  }

  private build(): void {
    const gs = GameState.getInstance();
    const mc = gs.characterManager.getMainCharacter();
    if (!mc) {
      this.addText(GAME_WIDTH / 2, 220, 'Chưa có nhân vật.');
      return;
    }

    gs.syncPartyVitals();
    const stats = gs.characterManager.getComputedStats(mc.id, getItemById);
    const realmLabel = REALM_LABELS[mc.realm] ?? mc.realm;
    const pending = gs.characterManager.getPendingStatPoints(mc.id);

    this.addText(GAME_WIDTH / 2, 200,
      `${mc.name}\nCảnh giới: ${realmLabel}  |  EXP: ${mc.exp}\n` +
      `HP: ${mc.currentHp}/${mc.maxHp}  |  Qi: ${mc.currentQi}/${mc.maxQi}\n` +
      `Công: ${stats?.totalAtk ?? 0}  |  Thủ: ${stats?.totalDef ?? 0}\n` +
      `Điểm tu luyện chờ: ${pending}`,
      '16px',
    );

    if (pending > 0 || gs.characterManager.canBreakthrough(mc.id)) {
      this.addButton(GAME_WIDTH / 2, 380, 240, 44, 'Phân bổ / Đột phá', () => {
        this.close();
        runRealmProgressionFlow(this.scene, mc.id);
      });
    }
  }
}
