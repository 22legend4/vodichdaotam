import Phaser from 'phaser';
import type { WeaponType } from '../types/game.ts';
import { GameState } from '../state/gameState.ts';
import { getSkillById } from '../data/skillsData.ts';
import { BANDIT_NPC_ID } from '../data/npcAppearances.ts';
import { WEAPON_DEFAULT_SKILL } from '../systems/combatTypes.ts';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameDimensions.ts';
import { DialogBox, UI_THEME } from '../ui/index.ts';
import {
  addSceneBackground,
  resolveBanditAvatarKey,
  resolveDialogPortraitKey,
  resolveMasterAvatarKey,
} from '../utils/AssetGenerator.ts';
import { resolvePlayerDisplayKey } from '../utils/characterSpriteAssets.ts';
import { AVATAR_W, AVATAR_H } from '../utils/assetDrawCharacters.ts';
import { soundManager } from '../utils/SoundManager.ts';

const TUTORIAL_EXP = 30;
const TUTORIAL_VICTORY_KEY = 'tutorialVictoryPayload';

interface TutorialSceneData {
  gender?: 'nam' | 'nu';
  weapon?: WeaponType;
  phase?: 'intro' | 'master';
  expGained?: number;
}

export class TutorialBattleScene extends Phaser.Scene {
  private dialog!: DialogBox;
  private sceneData: TutorialSceneData = {};

  constructor() {
    super({ key: 'TutorialBattleScene' });
  }

  init(data: TutorialSceneData): void {
    this.sceneData = {
      phase: data.phase ?? 'intro',
      gender: data.gender ?? 'nam',
      weapon: data.weapon ?? 'quyen',
      expGained: data.expGained ?? TUTORIAL_EXP,
    };
  }

  create(): void {
    try {
      addSceneBackground(this, 'village', 0);

      this.dialog = new DialogBox(this, GAME_WIDTH, GAME_HEIGHT);

      if (this.sceneData.phase === 'master') {
        this.showMasterScene();
        return;
      }

      this.add
        .text(GAME_WIDTH / 2, 36, 'Tiều Thôn – Gặp Tên Cướp', {
          fontFamily: UI_THEME.fontFamilyTitle,
          fontSize: '24px',
          color: UI_THEME.colors.accentAlt,
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(UI_THEME.depth.hud);

      this.runBanditDialog();
    } catch (err) {
      console.error('[TutorialBattleScene] create failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `Lỗi tutorial:\n${msg}`, {
        fontFamily: UI_THEME.fontFamily,
        fontSize: '18px',
        color: '#e94560',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 80 },
      }).setOrigin(0.5);
    }
  }

  private runBanditDialog(): void {
    const gs = GameState.getInstance();
    const mc = gs.characterManager.getMainCharacter();
    const mcName = mc?.name ?? 'Tu sĩ';
    const gender = this.sceneData.gender ?? 'nam';

    const playerPortrait = mc
      ? resolvePlayerDisplayKey(this, mc.appearanceId, mc.gender, mc.weaponType)
      : null;

    const lines: { speaker: string; text: string; portrait?: string | null }[] = [
      {
        speaker: 'Tên Cướp',
        text: 'Đường này do ta xây, muốn đi qua phải nộp tiền mãi lộ',
        portrait: resolveBanditAvatarKey(),
      },
      {
        speaker: mcName,
        text: 'Đạo tặc to gan, hãy xem ta trừng trị ngươi',
        portrait: playerPortrait,
      },
    ];

    let index = 0;
    const next = () => {
      if (index >= lines.length) {
        this.dialog.hide();
        this.startTutorialBattle();
        return;
      }
      const line = lines[index]!;
      index += 1;
      const isLast = index >= lines.length;
      this.dialog.show(
        line.speaker,
        line.text,
        isLast ? () => {
          this.dialog.hide();
          this.startTutorialBattle();
        } : next,
        line.portrait ?? resolveDialogPortraitKey(line.speaker, gender),
      );
    };
    next();
  }

  private startTutorialBattle(): void {
    const gs = GameState.getInstance();
    const mc = gs.characterManager.getMainCharacter();
    const weapon = this.sceneData.weapon ?? mc?.weaponType ?? 'quyen';

    if (!mc) {
      console.error('[TutorialBattleScene] Không có nhân vật chính – quay lại tạo NV');
      this.scene.start('CharacterCreationScene');
      return;
    }

    const allySkillIds = {
      [mc.id]: [WEAPON_DEFAULT_SKILL[weapon]],
    };

    this.registry.set(TUTORIAL_VICTORY_KEY, {
      gender: this.sceneData.gender,
      weapon,
      expGained: this.sceneData.expGained ?? TUTORIAL_EXP,
    });

    this.scene.start('BattleScene', {
      mode: 'tutorial',
      background: 'village',
      enemyNpcIds: [BANDIT_NPC_ID],
      allySkillIds,
      tutorial: {
        turn1Hint: "Ấn vào 'Tên cướp', rồi ấn vào 'Chiến luôn'",
        hideSkillSlots: true,
      },
    });
  }

  /** Gọi từ BattleScene khi thắng tutorial (scene này có thể đã stop). */
  static handleTutorialVictory(scene: Phaser.Scene): void {
    const payload = scene.registry.get(TUTORIAL_VICTORY_KEY) as {
      gender?: 'nam' | 'nu';
      weapon?: WeaponType;
      expGained?: number;
    } | undefined;

    const gs = GameState.getInstance();
    gs.characterManager.addExpToParty(payload?.expGained ?? TUTORIAL_EXP);
    gs.persist();

    scene.registry.remove(TUTORIAL_VICTORY_KEY);
    scene.scene.start('TutorialBattleScene', {
      phase: 'master',
      gender: payload?.gender ?? 'nam',
      weapon: payload?.weapon ?? 'quyen',
      expGained: payload?.expGained ?? TUTORIAL_EXP,
    });
  }

  private showMasterScene(): void {
    const gs = GameState.getInstance();
    const gender = this.sceneData.gender ?? 'nam';
    const weapon = this.sceneData.weapon ?? 'quyen';
    const skill = getSkillById(WEAPON_DEFAULT_SKILL[weapon]);

    addSceneBackground(this, 'meditation', 0);

    const masterName = 'Sư Phụ';

    const masterKey = resolveMasterAvatarKey(gender);
    if (this.textures.exists(masterKey)) {
      const img = this.add.image(GAME_WIDTH / 2, 200, masterKey).setDepth(UI_THEME.depth.units);
      const tex = this.textures.get(masterKey);
      const src = tex.getSourceImage() as { width?: number; height?: number };
      const w = src.width ?? AVATAR_W;
      const h = src.height ?? AVATAR_H;
      const displayH = Math.min(AVATAR_H * 2.2, GAME_HEIGHT * 0.45);
      img.setDisplaySize(displayH * (w / h), displayH);
    }

    const messages: { speaker: string; text: string; onContinue?: () => void; itemId?: string }[] = [
      {
        speaker: masterName,
        text: `Con đã đủ năng lực để đi trừ gian diệt ác, ta sẽ truyền cho con võ kỹ gia truyền của môn phái: ${skill?.name ?? 'Võ kỹ cơ bản'}.`,
        onContinue: () => soundManager.playSkillLearn(),
      },
      {
        speaker: masterName,
        text: 'Đây là Chu Chỉ Dược, có tác dụng chữa thương, hãy dùng nó cho tốt.',
        itemId: 'med_chuChiDuoc',
        onContinue: () => {
          gs.inventoryManager.addItem('med_chuChiDuoc', 1);
          soundManager.playItemPickup();
          gs.persist();
        },
      },
      {
        speaker: masterName,
        text: 'Hãy dùng đôi chân của mình, bước lên con đường trở thành cường giả, đứng trên đỉnh thiên hạ, rạng rỡ liệt tổ liệt tông.',
      },
    ];

    let i = 0;
    const finishTutorial = (): void => {
      this.dialog.hide();
      gs.markTutorialComplete();
      gs.persist();
      this.scene.start('MainHubScene');
    };

    const next = (): void => {
      if (i >= messages.length) {
        finishTutorial();
        return;
      }
      const msg = messages[i]!;
      i += 1;
      const isLast = i >= messages.length;
      this.dialog.show(
        msg.speaker,
        msg.text,
        isLast
          ? finishTutorial
          : () => {
              msg.onContinue?.();
              next();
            },
        resolveMasterAvatarKey(gender),
        msg.itemId,
      );
    };
    next();
  }
}
