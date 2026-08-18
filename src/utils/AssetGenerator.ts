import Phaser from 'phaser';
import type { ItemRarity, WeaponType } from '../types/game.ts';
import { BANDIT_NPC_ID } from '../data/npcAppearances.ts';
import { NPC_MAX_INDEX } from '../data/npcsData.ts';
import { isUsableBgTexture, safeGenerate } from './assetCore.ts';
import {
  BG_SIZE,
  drawArenaBackground,
  drawMeditationGrottoBackground,
  drawVillageBackground,
} from './assetDrawBackgrounds.ts';
import {
  drawDialogPanelGfx,
  drawMasterAvatarGfx,
  drawNpcAvatarGfx,
  drawPlayerAvatarGfx,
  drawRarityIconGfx,
  drawStatBarBgGfx,
  drawStatBarFillGfx,
  drawUiButtonGfx,
  drawRoundButtonGfx,
  drawSkillSlotFrameGfx,
  RARITY_COLORS,
  AVATAR_W,
  AVATAR_H,
} from './assetDrawCharacters.ts';
import {
  drawEquipmentIconGfx,
  drawMedicineIconGfx,
  drawPetIconGfx,
  drawSpecialItemIconGfx,
  ITEM_ICON_SIZE,
} from './assetDrawItems.ts';
import {
  drawSkillEffectGfx,
  drawWeaponSwingFx,
  SKILL_FX_IDS,
} from './assetDrawSkills.ts';
import {
  drawHubMetallicButtonGfx,
  drawHubMetallicFrameOnlyGfx,
  drawHubProfileRingGfx,
  drawJadeSpiritDiscGfx,
  JADE_DISC_RADIUS,
  type HubButtonKind,
} from './assetDrawUi.ts';

export { RARITY_COLORS };

export type SceneBackgroundKey =
  | 'village'
  | 'chapter1Arena'
  | 'chapter2Arena'
  | 'chapter3Arena'
  | 'chapter4Arena'
  | 'chapter5Arena'
  | 'chapter6Arena'
  | 'chapter78Arena'
  | 'chapter9Arena'
  | 'arena'
  | 'meditation'
  | 'characterCreation'
  | 'playerRoster'
  | 'teleportGate';

/** Texture keys dùng xuyên suốt game. */
export const ASSET_KEYS = {
  bgVillage: 'bg_village_tieuthon',
  bgChapter1Arena: 'bg_chapter1_arena',
  bgChapter2Map: 'bg_chapter2_map',
  bgChapter2Arena: 'bg_chapter2_arena',
  bgChapter3Map: 'bg_chapter3_map',
  bgChapter3Arena: 'bg_chapter3_arena',
  bgChapter4Map: 'bg_chapter4_map',
  bgChapter4Arena: 'bg_chapter4_arena',
  bgChapter5Map: 'bg_chapter5_map',
  bgChapter5Arena: 'bg_chapter5_arena',
  bgChapter6Map: 'bg_chapter6_map',
  bgChapter6Arena: 'bg_chapter6_arena',
  bgChapter78Map: 'bg_chapter78_map',
  bgChapter78Arena: 'bg_chapter78_arena',
  bgChapter9Map: 'bg_chapter9_map',
  bgChapter9Arena: 'bg_chapter9_arena',
  bgArena: 'bg_arena_minhthanh',
  bgMeditation: 'bg_meditation_grotto',
  bgCharacterCreation: 'bg_character_creation',
  bgPlayerRoster: 'bg_player_roster',
  bgTeleportGate: 'bg_teleport_gate',
  avatarPlayer: (gender: 'nam' | 'nu', weapon: WeaponType) =>
    `avatar_player_${gender}_${weapon}`,
  avatarPlayerMale: 'avatar_player_male_quyen',
  avatarPlayerFemale: 'avatar_player_female_quyen',
  avatarMaster: (gender: 'nam' | 'nu') => `avatar_master_${gender}`,
  npcAvatar: (index: number) => `avatar_npc_${index}`,
  rarityIcon: (rarity: ItemRarity) => `icon_rarity_${rarity}`,
  itemIcon: (id: string) => `icon_item_${id}`,
  eqIcon: (slot: string, weapon: string, rarity: string) => `icon_eq_${slot}_${weapon}_${rarity}`,
  skillFx: (skillId: string) => `fx_skill_${skillId}`,
  weaponFx: (weapon: WeaponType) => `fx_weapon_${weapon}`,
  uiButton: 'ui_btn_xianxia',
  uiButtonHover: 'ui_btn_xianxia_hover',
  uiBarHpFill: 'ui_bar_hp_fill',
  uiBarHpBg: 'ui_bar_hp_bg',
  uiBarQiFill: 'ui_bar_qi_fill',
  uiBarQiBg: 'ui_bar_qi_bg',
  uiDialogPanel: 'ui_dialog_panel',
  uiRoundFight: 'ui_btn_round_fight',
  uiRoundBag: 'ui_btn_round_bag',
  uiRoundSurrender: 'ui_btn_round_surrender',
  uiSkillSlot: 'ui_skill_slot_frame',
  uiBarCompactHpBg: 'ui_bar_compact_hp_bg',
  uiBarCompactHpFill: 'ui_bar_compact_hp_fill',
  uiBarCompactQiBg: 'ui_bar_compact_qi_bg',
  uiBarCompactQiFill: 'ui_bar_compact_qi_fill',
  uiHubButton: (kind: HubButtonKind) => `ui_hub_btn_${kind}`,
  uiHubButtonLarge: (kind: HubButtonKind) => `ui_hub_btn_${kind}_lg`,
  uiHubFrame: 'ui_hub_frame',
  uiHubFrameLarge: 'ui_hub_frame_lg',
  uiJadeDisc: 'ui_jade_disc',
  uiHubProfileRing: 'ui_hub_profile_ring',
  hubPlayerProfile: 'hub_player_profile_avatar',
  uiIconTinhThach: 'ui_icon_tinh_thach',
  uiIconGioiThuy: 'ui_icon_gioi_thuy',
  uiIconFriends: 'ui_icon_friends',
  uiIconShop: 'ui_icon_shop',
} as const;

const HUB_BTN_TEX_SIZE = 168;
const HUB_BTN_LG_TEX_SIZE = 216;
const JADE_DISC_TEX_SIZE = JADE_DISC_RADIUS * 2 + 8;
const HUB_PROFILE_RING_SIZE = 160;
const HUB_ICON_KINDS: HubButtonKind[] = ['settings', 'character', 'inventory', 'shop', 'map'];

const WEAPONS: WeaponType[] = ['quyen', 'kiem', 'dao', 'thuong'];
const RARITIES: ItemRarity[] = ['dong', 'bac', 'vang', 'kimcuong', 'than'];

/** Sinh toàn bộ texture procedural – gọi trong BootScene.create(). */
export function generateAllAssets(scene: Phaser.Scene): void {
  let ok = 0;
  let fail = 0;
  const track = (success: boolean) => {
    if (success) ok += 1;
    else fail += 1;
  };

  if (!scene.textures.exists(ASSET_KEYS.bgVillage)) {
    track(safeGenerate(scene, ASSET_KEYS.bgVillage, BG_SIZE.w, BG_SIZE.h, drawVillageBackground));
  }
  track(safeGenerate(scene, ASSET_KEYS.bgArena, BG_SIZE.w, BG_SIZE.h, drawArenaBackground));
  if (!scene.textures.exists(ASSET_KEYS.bgMeditation)) {
    track(safeGenerate(scene, ASSET_KEYS.bgMeditation, BG_SIZE.w, BG_SIZE.h, drawMeditationGrottoBackground));
  }

  for (const gender of ['nam', 'nu'] as const) {
    for (const weapon of WEAPONS) {
      const key = ASSET_KEYS.avatarPlayer(gender, weapon);
      if (scene.textures.exists(key)) continue;
      track(safeGenerate(scene, key, AVATAR_W, AVATAR_H, (gfx) => {
        drawPlayerAvatarGfx(gfx, AVATAR_W, AVATAR_H, gender, weapon);
      }));
    }
    const masterKey = ASSET_KEYS.avatarMaster(gender);
    if (!scene.textures.exists(masterKey)) {
      track(safeGenerate(scene, masterKey, AVATAR_W, AVATAR_H, (gfx) => {
        drawMasterAvatarGfx(gfx, AVATAR_W, AVATAR_H, gender);
      }));
    }
  }

  for (let i = 1; i <= NPC_MAX_INDEX; i++) {
    const key = ASSET_KEYS.npcAvatar(i);
    if (scene.textures.exists(key)) continue;
    track(safeGenerate(scene, key, AVATAR_W, AVATAR_H, (gfx) => {
      drawNpcAvatarGfx(gfx, AVATAR_W, AVATAR_H, i);
    }));
  }

  RARITIES.forEach((rarity) => {
    track(safeGenerate(scene, ASSET_KEYS.rarityIcon(rarity), 48, 48, (gfx) => {
      drawRarityIconGfx(gfx, 48, rarity);
    }));
  });

  WEAPONS.forEach((weapon) => {
    RARITIES.forEach((rarity) => {
      track(safeGenerate(scene, ASSET_KEYS.eqIcon('weapon', weapon, rarity), ITEM_ICON_SIZE, ITEM_ICON_SIZE, (gfx) => {
        drawEquipmentIconGfx(gfx, 'weapon', weapon, rarity);
      }));
    });
  });
  (['head', 'body', 'feet'] as const).forEach((slot) => {
    RARITIES.forEach((rarity) => {
      track(safeGenerate(scene, ASSET_KEYS.eqIcon(slot, 'none', rarity), ITEM_ICON_SIZE, ITEM_ICON_SIZE, (gfx) => {
        drawEquipmentIconGfx(gfx, slot, null, rarity);
      }));
    });
  });

  const medicineKinds: Array<{ id: string; kind: 'chuChi' | 'cuongSinh' | 'hoiHuyet' | 'generic' }> = [
    { id: 'med_chuChiDuoc', kind: 'chuChi' },
    { id: 'med_cuongSinhDan', kind: 'cuongSinh' },
    { id: 'med_hoiNguyenHuyet', kind: 'hoiHuyet' },
  ];
  medicineKinds.forEach(({ id, kind }) => {
    track(safeGenerate(scene, ASSET_KEYS.itemIcon(id), ITEM_ICON_SIZE, ITEM_ICON_SIZE, (gfx) => {
      drawMedicineIconGfx(gfx, kind);
    }));
  });
  track(safeGenerate(scene, ASSET_KEYS.itemIcon('item_tichLichDan'), ITEM_ICON_SIZE, ITEM_ICON_SIZE, (gfx) => {
    drawSpecialItemIconGfx(gfx, 'tichLich');
  }));
  track(safeGenerate(scene, ASSET_KEYS.itemIcon('item_nhanKhongGian'), ITEM_ICON_SIZE, ITEM_ICON_SIZE, (gfx) => {
    drawSpecialItemIconGfx(gfx, 'nhanKhongGian');
  }));

  const pets: Array<{ id: string; kind: 'longNgu' | 'haoThien' | 'bachHau' | 'kimLong' | 'cuuViHo' }> = [
    { id: 'beast_tieuLongNgu', kind: 'longNgu' },
    { id: 'beast_cuuViHo', kind: 'cuuViHo' },
    { id: 'beast_bachHau', kind: 'bachHau' },
    { id: 'beast_kimLong', kind: 'kimLong' },
    { id: 'beast_haoThienKhuyen', kind: 'haoThien' },
  ];
  pets.forEach(({ id, kind }) => {
    track(safeGenerate(scene, ASSET_KEYS.itemIcon(id), ITEM_ICON_SIZE, ITEM_ICON_SIZE, (gfx) => {
      drawPetIconGfx(gfx, kind);
    }));
  });

  SKILL_FX_IDS.forEach((skillId) => {
    track(safeGenerate(scene, ASSET_KEYS.skillFx(skillId), 96, 96, (gfx) => {
      drawSkillEffectGfx(gfx, 96, 96, skillId);
    }));
  });
  WEAPONS.forEach((weapon) => {
    track(safeGenerate(scene, ASSET_KEYS.weaponFx(weapon), 96, 96, (gfx) => {
      drawWeaponSwingFx(gfx, 96, 96, weapon);
    }));
  });

  track(safeGenerate(scene, ASSET_KEYS.uiButton, 200, 56, (gfx) => drawUiButtonGfx(gfx, 200, 56, false)));
  track(safeGenerate(scene, ASSET_KEYS.uiButtonHover, 200, 56, (gfx) => drawUiButtonGfx(gfx, 200, 56, true)));
  track(safeGenerate(scene, ASSET_KEYS.uiBarHpBg, 120, 12, (gfx) => drawStatBarBgGfx(gfx, 120, 12, 0x4a2020)));
  track(safeGenerate(scene, ASSET_KEYS.uiBarHpFill, 120, 12, (gfx) => drawStatBarFillGfx(gfx, 120, 12, 0xe74c3c)));
  track(safeGenerate(scene, ASSET_KEYS.uiBarQiBg, 120, 12, (gfx) => drawStatBarBgGfx(gfx, 120, 12, 0x1a3050)));
  track(safeGenerate(scene, ASSET_KEYS.uiBarQiFill, 120, 12, (gfx) => drawStatBarFillGfx(gfx, 120, 12, 0x3498db)));
  track(safeGenerate(scene, ASSET_KEYS.uiDialogPanel, 1200, 180, (gfx) => drawDialogPanelGfx(gfx, 1200, 180)));
  track(safeGenerate(scene, ASSET_KEYS.uiRoundFight, 56, 56, (gfx) => drawRoundButtonGfx(gfx, 56, 'fight')));
  track(safeGenerate(scene, ASSET_KEYS.uiRoundBag, 56, 56, (gfx) => drawRoundButtonGfx(gfx, 56, 'bag')));
  track(safeGenerate(scene, ASSET_KEYS.uiRoundSurrender, 56, 56, (gfx) => drawRoundButtonGfx(gfx, 56, 'surrender')));
  track(safeGenerate(scene, ASSET_KEYS.uiSkillSlot, 64, 64, (gfx) => drawSkillSlotFrameGfx(gfx, 64)));
  for (const kind of HUB_ICON_KINDS) {
    track(safeGenerate(scene, ASSET_KEYS.uiHubButton(kind), HUB_BTN_TEX_SIZE, HUB_BTN_TEX_SIZE, (gfx) => {
      drawHubMetallicButtonGfx(gfx, HUB_BTN_TEX_SIZE, kind, false);
    }));
    if (kind === 'map') {
      track(safeGenerate(scene, ASSET_KEYS.uiHubButtonLarge(kind), HUB_BTN_LG_TEX_SIZE, HUB_BTN_LG_TEX_SIZE, (gfx) => {
        drawHubMetallicButtonGfx(gfx, HUB_BTN_LG_TEX_SIZE, kind, true);
      }));
    }
  }
  track(safeGenerate(scene, ASSET_KEYS.uiHubFrame, HUB_BTN_TEX_SIZE, HUB_BTN_TEX_SIZE, (gfx) => {
    drawHubMetallicFrameOnlyGfx(gfx, HUB_BTN_TEX_SIZE, 'inventory', false);
  }));
  track(safeGenerate(scene, ASSET_KEYS.uiHubFrameLarge, HUB_BTN_LG_TEX_SIZE, HUB_BTN_LG_TEX_SIZE, (gfx) => {
    drawHubMetallicFrameOnlyGfx(gfx, HUB_BTN_LG_TEX_SIZE, 'map', true);
  }));
  track(safeGenerate(scene, ASSET_KEYS.uiJadeDisc, JADE_DISC_TEX_SIZE, JADE_DISC_TEX_SIZE, (gfx) => {
    drawJadeSpiritDiscGfx(gfx, JADE_DISC_TEX_SIZE / 2, JADE_DISC_TEX_SIZE / 2, JADE_DISC_RADIUS);
  }));
  track(safeGenerate(scene, ASSET_KEYS.uiHubProfileRing, HUB_PROFILE_RING_SIZE, HUB_PROFILE_RING_SIZE, (gfx) => {
    drawHubProfileRingGfx(gfx, HUB_PROFILE_RING_SIZE);
  }));
  track(safeGenerate(scene, ASSET_KEYS.uiBarCompactHpBg, 80, 8, (gfx) => drawStatBarBgGfx(gfx, 80, 8, 0x4a2020)));
  track(safeGenerate(scene, ASSET_KEYS.uiBarCompactHpFill, 80, 8, (gfx) => drawStatBarFillGfx(gfx, 80, 8, 0xe74c3c)));
  track(safeGenerate(scene, ASSET_KEYS.uiBarCompactQiBg, 80, 6, (gfx) => drawStatBarBgGfx(gfx, 80, 6, 0x1a3050)));
  track(safeGenerate(scene, ASSET_KEYS.uiBarCompactQiFill, 80, 6, (gfx) => drawStatBarFillGfx(gfx, 80, 6, 0x3498db)));

  console.log(`[AssetGenerator] Done: ${ok} ok, ${fail} failed`);
}

/** Thêm nền scene full-screen. */
export function addSceneBackground(
  scene: Phaser.Scene,
  key: SceneBackgroundKey,
  depth = 0,
): Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle {
  const texKey =
    key === 'village' ? ASSET_KEYS.bgVillage
      : key === 'chapter1Arena' ? ASSET_KEYS.bgChapter1Arena
        : key === 'chapter2Arena' ? ASSET_KEYS.bgChapter2Arena
          : key === 'chapter3Arena' ? ASSET_KEYS.bgChapter3Arena
            : key === 'chapter4Arena' ? ASSET_KEYS.bgChapter4Arena
              : key === 'chapter5Arena' ? ASSET_KEYS.bgChapter5Arena
              : key === 'chapter6Arena' ? ASSET_KEYS.bgChapter6Arena
              : key === 'chapter78Arena' ? ASSET_KEYS.bgChapter78Arena
              : key === 'chapter9Arena' ? ASSET_KEYS.bgChapter9Arena
              : key === 'arena' ? ASSET_KEYS.bgArena
                : key === 'characterCreation' ? ASSET_KEYS.bgCharacterCreation
                  : key === 'playerRoster' ? ASSET_KEYS.bgPlayerRoster
                    : key === 'teleportGate' ? ASSET_KEYS.bgTeleportGate
                    : ASSET_KEYS.bgMeditation;
  const { width, height } = scene.scale;

  if (scene.textures.exists(texKey) && isUsableBgTexture(scene, texKey)) {
    return scene.add.image(width / 2, height / 2, texKey).setDepth(depth).setDisplaySize(width, height);
  }
  const fallback =
    key === 'village' ? 0x2d1b0e
      : key === 'chapter1Arena' ? 0x3d2817
        : key === 'chapter2Arena' ? 0x1b263b
          : key === 'chapter3Arena' ? 0x1a3328
            : key === 'chapter4Arena' ? 0x2a1a3d
              : key === 'chapter5Arena' ? 0x331a1a
              : key === 'chapter6Arena' ? 0x1a1a2e
              : key === 'chapter78Arena' ? 0x1a1a2e
              : key === 'chapter9Arena' ? 0x1a1a2e
              : key === 'arena' ? 0x1b263b
                : key === 'characterCreation' ? 0x1a1a2e
                  : key === 'playerRoster' ? 0x1a2248
                    : key === 'teleportGate' ? 0x1a1a2e
                    : 0x0a1628;
  return scene.add.rectangle(width / 2, height / 2, width, height, fallback).setDepth(depth);
}

/** Lấy texture avatar theo unit id. */
export function resolveAvatarKey(
  unitId: string,
  gender?: 'nam' | 'nu',
  weapon?: WeaponType,
  appearanceId?: string,
): string {
  if (appearanceId) {
    const pngKey = `char_${appearanceId}_idle`;
    return pngKey;
  }
  if (unitId.startsWith('npc')) {
    const num = parseInt(unitId.replace('npc', ''), 10);
    if (!Number.isNaN(num) && num >= 1 && num <= NPC_MAX_INDEX) {
      return ASSET_KEYS.npcAvatar(num);
    }
    return ASSET_KEYS.npcAvatar(1);
  }
  const g = gender ?? 'nam';
  const w = weapon ?? 'quyen';
  const key = ASSET_KEYS.avatarPlayer(g, w);
  return key;
}

export function resolveMasterAvatarKey(gender: 'nam' | 'nu'): string {
  return ASSET_KEYS.avatarMaster(gender);
}

export function resolveBanditAvatarKey(): string {
  const num = parseInt(BANDIT_NPC_ID.replace('npc', ''), 10);
  return ASSET_KEYS.npcAvatar(Number.isNaN(num) ? 3 : num);
}

/** Texture hiệu ứng võ kỹ – fallback theo loại skill. */
export function resolveSkillFxKey(skillId: string): string | null {
  const direct = ASSET_KEYS.skillFx(skillId);
  if ((SKILL_FX_IDS as readonly string[]).includes(skillId)) {
    return direct;
  }
  const fallbackMap: Record<string, string> = {
    khongPhaQuyen: 'khongPhaQuyen',
    kiemNhuLai: 'kiemNhuLai',
    nhatKiemDinhGiangSon: 'nhatKiemDinhGiangSon',
    hoanhKhongDao: 'hoanhKhongDao',
    voAnhDao: 'voAnhDao',
    thuongVoHoi: 'thuongVoHoi',
    hoPhongKinh: 'hoPhongKinh',
    thaiDuTruongHa: 'thaiDuTruongHa',
    bachQuyTeGia: 'bachQuyTeGia',
    cuNhatKinh: 'cuNhatKinh',
    hongHaiKinh: 'hongHaiKinh',
    kimCuongBatHoai: 'kimCuongBatHoai',
    cuuLongThangThien: 'cuuLongThangThien',
  };
  const mapped = fallbackMap[skillId];
  return mapped ? ASSET_KEYS.skillFx(mapped) : null;
}

export function resolveRarityKey(rarity?: ItemRarity): string | null {
  if (!rarity) return null;
  return ASSET_KEYS.rarityIcon(rarity);
}

export function resolveItemIconKey(itemId: string): string | null {
  if (itemId === 'cur_tinhThach') return ASSET_KEYS.uiIconTinhThach;
  if (itemId === 'cur_gioiThuy' || itemId === 'med_gioiThuy') return ASSET_KEYS.uiIconGioiThuy;
  return ASSET_KEYS.itemIcon(itemId);
}

export function weaponSwingFxKey(weapon: WeaponType): string {
  return ASSET_KEYS.weaponFx(weapon);
}

/** Vị trí đội hình so-le 5v5 – phe ta trái, phe địch phải (gương). */
export function battleSlotPositions(
  count: number,
  isEnemy: boolean,
  _gameWidth: number,
): { x: number; y: number }[] {
  const allyFormation = [
    { x: 400, y: 340 },
    { x: 400, y: 460 },
    { x: 260, y: 280 },
    { x: 260, y: 400 },
    { x: 260, y: 520 },
  ];
  const enemyFormation = [
    { x: 880, y: 340 },
    { x: 880, y: 460 },
    { x: 1020, y: 280 },
    { x: 1020, y: 400 },
    { x: 1020, y: 520 },
  ];
  const base = isEnemy ? enemyFormation : allyFormation;
  return base.slice(0, count);
}

/** Portrait key cho hội thoại. */
export function resolveDialogPortraitKey(speaker: string, gender?: 'nam' | 'nu'): string | null {
  if (speaker.includes('Cướp') || speaker.includes('cướp')) {
    return resolveBanditAvatarKey();
  }
  if (speaker.includes('Sư Phụ') || speaker.includes('sư phụ')) {
    return resolveMasterAvatarKey(gender ?? 'nam');
  }
  return null;
}
