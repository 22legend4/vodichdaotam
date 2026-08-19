import Phaser from 'phaser';
import { UI_THEME, STATUS_ICONS, clampFontSizePx } from './theme.ts';
import { resolveAvatarKey } from '../utils/AssetGenerator.ts';
import {
  COMBAT_SKILL_IMPACT_MS,
  COMBAT_SKILL_MANIFEST_MS,
  COMBAT_SKILL_TRAVEL_MS,
} from '../constants/combatTiming.ts';
import {
  createSkillCastIcon,
  type SkillCastVisual,
} from '../utils/skillCastIcon.ts';
import { createBasicAttackOrb, showBasicAttackImpactFx } from '../utils/basicAttackFx.ts';
import { AVATAR_W, AVATAR_H } from '../utils/assetDrawCharacters.ts';
import { getSkillById } from '../data/skillsData.ts';
import { createSkillIcon } from '../utils/skillIconAssets.ts';
import {
  BATTLE_DISC_ALLY,
  BATTLE_DISC_ENEMY,
  BATTLE_DISC_GLOW_ALLY,
  BATTLE_DISC_GLOW_ENEMY,
  drawBattleBaguaDiscGfx,
  drawFloatingSwordGfx,
  drawTargetBodyGlowGfx,
} from '../utils/assetDrawUi.ts';

export interface BattleUnitDisplayConfig {
  x: number;
  y: number;
  name: string;
  isEnemy: boolean;
  avatarKey?: string;
  avatarAttackKey?: string | null;
  onClick?: () => void;
}

type SpiritDiscMode = 'none' | 'ally' | 'enemy';

/** Nhân vật 2D đứng trên sàn chiến – không có thẻ HP (đã chuyển lên Top HUD). */
export class BattleUnitDisplay extends Phaser.GameObjects.Container {
  readonly unitId: string;
  private avatar: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  private statusContainer: Phaser.GameObjects.Container;
  private spiritDisc!: Phaser.GameObjects.Container;
  private spiritDiscGfx!: Phaser.GameObjects.Graphics;
  private floatingSword!: Phaser.GameObjects.Container;
  private floatingSwordGfx!: Phaser.GameObjects.Graphics;
  private targetBodyGlow!: Phaser.GameObjects.Container;
  private targetBodyGlowGfx!: Phaser.GameObjects.Graphics;
  private skillOverlay!: Phaser.GameObjects.Container;
  private hitZone!: Phaser.GameObjects.Zone;
  private onClick?: () => void;
  private discRotateTween?: Phaser.Tweens.Tween;
  private bodyGlowPulseTween?: Phaser.Tweens.Tween;
  private swordBobTween?: Phaser.Tweens.Tween;
  private discMode: SpiritDiscMode = 'none';
  private showFloatingSword = false;
  private showBodyGlow = false;
  private readonly spriteH = AVATAR_H;
  private readonly spriteW = AVATAR_W;
  private homeX: number;
  private homeY: number;
  private isEnemy: boolean;
  private idleAvatarKey: string;
  private attackAvatarKey: string | null;
  private readonly avatarDisplayH: number;
  private avatarDisplayW: number;
  private readonly feetY: number;
  private readonly swordY: number;
  private readonly discRadius: number;

  constructor(scene: Phaser.Scene, unitId: string, config: BattleUnitDisplayConfig) {
    super(scene, config.x, config.y);
    this.unitId = unitId;
    this.onClick = config.onClick;
    this.homeX = config.x;
    this.homeY = config.y;
    this.isEnemy = config.isEnemy;

    const accent = config.isEnemy ? 0xc0392b : 0x2980b9;
    const avatarKey = config.avatarKey ?? resolveAvatarKey(unitId);
    this.idleAvatarKey = avatarKey;
    this.attackAvatarKey = config.avatarAttackKey ?? null;
    const isPngChar = avatarKey.startsWith('char_');
    this.avatarDisplayH = isPngChar ? 150 : AVATAR_H;
    this.avatarDisplayW = this.spriteW;
    this.feetY = this.avatarDisplayH / 2 - 6;
    this.swordY = -12 - this.avatarDisplayH * 0.52 - 35;
    this.discRadius = this.spriteW * 0.18;

    this.spiritDisc = scene.add.container(0, 0);
    this.spiritDiscGfx = scene.add.graphics();
    this.spiritDisc.add(this.spiritDiscGfx);
    this.spiritDisc.setVisible(false);
    this.spiritDisc.setAlpha(1);

    this.floatingSword = scene.add.container(0, this.swordY);
    this.floatingSwordGfx = scene.add.graphics();
    drawFloatingSwordGfx(this.floatingSwordGfx);
    this.floatingSword.add(this.floatingSwordGfx);
    this.floatingSword.setVisible(false);

    this.targetBodyGlow = scene.add.container(0, -12);
    this.targetBodyGlowGfx = scene.add.graphics();
    this.targetBodyGlow.add(this.targetBodyGlowGfx);
    this.targetBodyGlow.setVisible(false);

    this.skillOverlay = scene.add.container(0, -12);
    this.skillOverlay.setVisible(true);

    if (scene.textures.exists(avatarKey)) {
      this.avatar = scene.add.image(0, -12, avatarKey);
      this.fitAvatarDisplay(this.avatar as Phaser.GameObjects.Image, avatarKey);
    } else {
      this.avatar = scene.add
        .rectangle(0, -12, this.spriteW, this.spriteH, accent, 0.6);
    }

    this.nameText = scene.add
      .text(0, this.feetY + 4, config.name, {
        fontFamily: UI_THEME.fontFamilyTitle,
        fontSize: clampFontSizePx('12px'),
        color: UI_THEME.colors.text,
        align: 'center',
        stroke: '#0a0a14',
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0);
    if (config.isEnemy) {
      this.nameText.setVisible(false);
    }

    this.statusContainer = scene.add.container(-40, this.feetY + 20);

    this.hitZone = scene.add.zone(0, -10, this.spriteW + 24, this.spriteH + 36);
    if (config.onClick) {
      this.hitZone.setInteractive({ useHandCursor: true });
      this.hitZone.on('pointerdown', () => this.onClick?.());
    }

    this.add([
      this.targetBodyGlow,
      this.avatar,
      this.nameText,
      this.spiritDisc,
      this.statusContainer,
      this.floatingSword,
      this.skillOverlay,
      this.hitZone,
    ]);

    scene.add.existing(this);
  }

  updateStats(_currentHp: number, _maxHp: number, _currentQi: number, _maxQi: number): void {
    /* HP/Qi hiển thị trên BattleTopHud */
  }

  setSelected(_selected: boolean): void {
    /* Vòng linh khí xử lý qua setTurnIndicator / setTargetHighlight */
  }

  /** Phe ta — lượt ra lệnh: đĩa Bát Quái vàng kim bên phải nhân vật. */
  setTurnIndicator(active: boolean): void {
    if (active) {
      if (this.discMode !== 'ally') {
        this.setSpiritDisc('ally', false);
      }
    } else if (this.discMode === 'ally') {
      this.setSpiritDisc('none', false);
    }
  }

  /** Mục tiêu tấn công: vòng sáng (chỉ đồng minh); hỗ trợ đồng minh: đĩa đỏ bên phải. */
  setTargetHighlight(isTarget: boolean, showAttackSword = true): void {
    if (isTarget && showAttackSword) {
      this.setSpiritDisc('none', false);
      this.setTargetBodyGlow(!this.isEnemy);
    } else if (isTarget) {
      this.setTargetBodyGlow(false);
      this.setSpiritDisc('enemy', false);
    } else {
      this.setTargetBodyGlow(false);
      if (this.discMode === 'enemy') {
        this.setSpiritDisc('none', false);
      }
    }
  }

  setDead(): void {
    this.setVisible(false);
    this.setSpiritDisc('none', false);
    this.setTargetBodyGlow(false);
    this.hitZone.disableInteractive();
  }

  setStatusEffects(effects: string[]): void {
    this.statusContainer.removeAll(true);
    effects.forEach((key, i) => {
      const info = STATUS_ICONS[key];
      if (!info) return;
      const badge = this.scene.add
        .text(i * 44, 0, info.label, {
          fontFamily: UI_THEME.fontFamily,
          fontSize: clampFontSizePx('9px'),
          color: info.textColor ?? '#ffffff',
          backgroundColor: info.color,
          padding: { x: 2, y: 1 },
        })
        .setOrigin(0, 0.5);
      this.statusContainer.add(badge);
    });
  }

  /** Icon võ kỹ thủ — giữa thân nhân vật. */
  setSkillOverlayIcons(defenseSkillId?: string): void {
    this.skillOverlay.removeAll(true);

    if (!defenseSkillId) return;

    const skill = getSkillById(defenseSkillId);
    if (!skill) return;
    const icon = createSkillIcon(this.scene, 0, 0, skill, 32, 0x4488ff);
    if (!icon) return;
    icon.setBlendMode(Phaser.BlendModes.ADD);
    this.skillOverlay.add(icon);
    this.bringToTop(this.skillOverlay);
  }

  /** Tâm thân nhân vật (tọa độ world) — điểm phát / nhận hiệu ứng võ kỹ. */
  getBodyCenterWorld(): { x: number; y: number } {
    return { x: this.x, y: this.y - 12 };
  }

  /** Võ kỹ 3 pha: icon PNG có viền — xuất hiện → bay → nổ. */
  launchSkillProjectileTo(
    target: BattleUnitDisplay,
    visual: SkillCastVisual,
    options?: { depthOffset?: number },
    onImpact?: () => void,
  ): void {
    if (!this.scene.textures.exists(visual.iconKey)) {
      onImpact?.();
      return;
    }

    const depth = UI_THEME.depth.units + 8 + (options?.depthOffset ?? 0);
    const manifest = createSkillCastIcon(this.scene, visual.iconKey, visual.borderColor);
    manifest.setPosition(0, -12);
    manifest.setAlpha(0);
    manifest.setDepth(depth);
    this.add(manifest);
    this.bringToTop(manifest);

    this.scene.tweens.add({
      targets: manifest,
      alpha: 1,
      duration: COMBAT_SKILL_MANIFEST_MS,
      ease: 'Cubic.easeOut',
    });

    this.scene.time.delayedCall(COMBAT_SKILL_MANIFEST_MS, () => {
      manifest.destroy();
      this.flySkillCastIconTo(target, visual, depth, onImpact);
    });
  }

  /** Đánh thường — 3 pha: xuất hiện → bay → nổ (cùng timing võ kỹ). */
  launchBasicAttackProjectileTo(
    target: BattleUnitDisplay,
    options?: { depthOffset?: number },
    onImpact?: () => void,
  ): void {
    const depth = UI_THEME.depth.units + 8 + (options?.depthOffset ?? 0);
    const manifest = createBasicAttackOrb(this.scene);
    manifest.setPosition(0, -12);
    manifest.setAlpha(0);
    manifest.setDepth(depth);
    this.add(manifest);
    this.bringToTop(manifest);

    this.scene.tweens.add({
      targets: manifest,
      alpha: 1,
      duration: COMBAT_SKILL_MANIFEST_MS,
      ease: 'Cubic.easeOut',
    });

    this.scene.time.delayedCall(COMBAT_SKILL_MANIFEST_MS, () => {
      manifest.destroy();
      this.flyBasicAttackOrbTo(target, depth, onImpact);
    });
  }

  private flyBasicAttackOrbTo(
    target: BattleUnitDisplay,
    depth: number,
    onImpact?: () => void,
  ): void {
    const from = this.getBodyCenterWorld();
    const to = target.getBodyCenterWorld();
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - 48;

    const projectile = createBasicAttackOrb(this.scene);
    projectile.setPosition(from.x, from.y);
    projectile.setDepth(depth);
    projectile.setAlpha(0.95);

    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: COMBAT_SKILL_TRAVEL_MS,
      ease: 'Cubic.easeIn',
      onUpdate: (tw) => {
        const tVal = tw.getValue() ?? 0;
        const u = 1 - tVal;
        projectile.x = u * u * from.x + 2 * u * tVal * midX + tVal * tVal * to.x;
        projectile.y = u * u * from.y + 2 * u * tVal * midY + tVal * tVal * to.y;
        projectile.setScale(1 + tVal * 0.06);
      },
      onComplete: () => {
        projectile.destroy();
        showBasicAttackImpactFx(this.scene, target, COMBAT_SKILL_IMPACT_MS);
        onImpact?.();
      },
    });
  }

  private flySkillCastIconTo(
    target: BattleUnitDisplay,
    visual: SkillCastVisual,
    depth: number,
    onImpact?: () => void,
  ): void {
    const from = this.getBodyCenterWorld();
    const to = target.getBodyCenterWorld();
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - 48;
    const angle = Phaser.Math.Angle.Between(from.x, from.y, to.x, to.y);

    const projectile = createSkillCastIcon(this.scene, visual.iconKey, visual.borderColor);
    projectile.setPosition(from.x, from.y);
    projectile.setRotation(angle);
    projectile.setDepth(depth);
    projectile.setAlpha(0.95);

    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: COMBAT_SKILL_TRAVEL_MS,
      ease: 'Cubic.easeIn',
      onUpdate: (tw) => {
        const tVal = tw.getValue() ?? 0;
        const u = 1 - tVal;
        projectile.x = u * u * from.x + 2 * u * tVal * midX + tVal * tVal * to.x;
        projectile.y = u * u * from.y + 2 * u * tVal * midY + tVal * tVal * to.y;
        projectile.setScale(1 + tVal * 0.06);
      },
      onComplete: () => {
        projectile.destroy();
        target.showSkillCastFx(visual, COMBAT_SKILL_IMPACT_MS);
        onImpact?.();
      },
    });
  }

  showSkillCastFx(visual: SkillCastVisual, impactMs = COMBAT_SKILL_IMPACT_MS): void {
    if (!this.scene.textures.exists(visual.iconKey)) return;
    const fx = createSkillCastIcon(this.scene, visual.iconKey, visual.borderColor);
    fx.setPosition(0, -12);
    fx.setAlpha(0.95);
    this.add(fx);
    this.bringToTop(fx);
    this.scene.tweens.add({
      targets: fx,
      alpha: 0,
      scale: 1.12,
      duration: impactMs,
      ease: 'Cubic.easeOut',
      onComplete: () => fx.destroy(),
    });
  }

  setInteractiveEnabled(enabled: boolean): void {
    if (enabled && this.onClick) {
      this.hitZone.setInteractive({ useHandCursor: true });
    } else {
      this.hitZone.disableInteractive();
    }
  }

  /** Đứng tại chỗ — đổi idle → attack, gọi onHit khi “trúng”, onComplete sau durationMs. */
  playStationaryAttack(
    target: BattleUnitDisplay | null,
    onHit: () => void,
    onComplete: () => void,
    durationMs = 3000,
    hitAtMs = 450,
  ): void {
    this.scene.tweens.killTweensOf(this);
    this.x = this.homeX;
    this.y = this.homeY;
    this.setScale(1);

    const movingRight = target ? target.x >= this.x : !this.isEnemy;
    if (!this.isEnemy && this.avatar instanceof Phaser.GameObjects.Image) {
      if (this.attackAvatarKey && this.scene.textures.exists(this.attackAvatarKey)) {
        this.avatar.setTexture(this.attackAvatarKey);
        this.fitAvatarDisplay(this.avatar, this.attackAvatarKey);
        this.avatar.setFlipX(!movingRight);
      } else {
        this.avatar.setFlipX(movingRight);
      }
    }

    this.scene.time.delayedCall(hitAtMs, () => {
      onHit();
      target?.playHitFlash();
    });

    this.scene.time.delayedCall(durationMs, () => {
      if (!this.isEnemy && this.avatar instanceof Phaser.GameObjects.Image) {
        this.avatar.setTexture(this.idleAvatarKey);
        this.fitAvatarDisplay(this.avatar, this.idleAvatarKey);
        this.avatar.setFlipX(false);
      }
      this.setScale(1);
      onComplete();
    });
  }

  /** Vị trí trên đầu nhân vật — hiển thị số máu / thông báo. */
  getFloaterPosition(): { x: number; y: number } {
    const headY = -12 - this.avatarDisplayH * 0.52;
    return { x: this.x, y: this.y + headY };
  }

  playHitFlash(): void {
    this.scene.tweens.add({
      targets: this.avatar,
      alpha: 0.35,
      duration: 60,
      yoyo: true,
      repeat: 2,
    });
  }

  /** @deprecated Không di chuyển — dùng playStationaryAttack. */
  playAttackLunge(
    target: BattleUnitDisplay,
    onHit: () => void,
    onComplete: () => void,
  ): void {
    this.playStationaryAttack(target, onHit, onComplete, 3000);
  }

  /** @deprecated Không còn võ kỹ khống chế. */
  setControlBoundVisual(_active: boolean): void {}

  private setTargetBodyGlow(active: boolean): void {
    if (this.showBodyGlow === active) return;
    this.showBodyGlow = active;
    this.bodyGlowPulseTween?.stop();
    this.bodyGlowPulseTween = undefined;

    if (!active) {
      this.targetBodyGlow.setVisible(false);
      this.targetBodyGlowGfx.clear();
      return;
    }

    this.redrawTargetBodyGlow();
    this.targetBodyGlow.setVisible(true);
    this.targetBodyGlow.setAlpha(0.85);
    this.sendToBack(this.targetBodyGlow);

    this.bodyGlowPulseTween = this.scene.tweens.add({
      targets: this.targetBodyGlow,
      alpha: { from: 0.55, to: 1 },
      scaleX: { from: 0.96, to: 1.04 },
      scaleY: { from: 0.96, to: 1.04 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private redrawTargetBodyGlow(): void {
    this.targetBodyGlowGfx.clear();
    drawTargetBodyGlowGfx(this.targetBodyGlowGfx, this.avatarDisplayW, this.avatarDisplayH);
  }

  private setSpiritDisc(mode: SpiritDiscMode, showSword: boolean): void {
    const nextSword = showSword && mode === 'enemy';
    if (this.discMode === mode && this.showFloatingSword === nextSword) {
      return;
    }

    this.discMode = mode;
    this.showFloatingSword = nextSword;
    this.stopDiscAnimations();

    if (mode === 'none') {
      this.spiritDisc.setVisible(false);
      this.floatingSword.setVisible(false);
      return;
    }

    const primary = mode === 'ally' ? BATTLE_DISC_ALLY : BATTLE_DISC_ENEMY;
    const glow = mode === 'ally' ? BATTLE_DISC_GLOW_ALLY : BATTLE_DISC_GLOW_ENEMY;

    this.spiritDiscGfx.clear();
    drawBattleBaguaDiscGfx(
      this.spiritDiscGfx,
      0,
      0,
      this.discRadius,
      primary,
      glow,
    );

    this.spiritDisc.setVisible(true);
    this.spiritDisc.setAlpha(1);
    this.repositionSpiritDisc();
    this.bringSpiritDiscToFront();

    this.discRotateTween = this.scene.tweens.add({
      targets: this.spiritDisc,
      angle: 360,
      duration: 8000,
      repeat: -1,
      ease: 'Linear',
    });

    if (this.showFloatingSword) {
      this.floatingSwordGfx.clear();
      drawFloatingSwordGfx(this.floatingSwordGfx, BATTLE_DISC_ALLY);
      this.floatingSword.setVisible(true);
      this.floatingSword.y = this.swordY;
      this.floatingSword.setAlpha(0.95);
      this.bringToTop(this.floatingSword);

      this.swordBobTween = this.scene.tweens.add({
        targets: this.floatingSword,
        y: this.swordY - 6,
        duration: 750,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      this.floatingSword.setVisible(false);
    }
  }

  /** Đĩa chọn — bên phải thân nhân vật, tránh bị unit khác che ở vùng chân. */
  private repositionSpiritDisc(): void {
    const discX = this.avatarDisplayW * 0.5 + this.discRadius + 10;
    const discY = -12 + this.avatarDisplayH * 0.1;
    this.spiritDisc.setPosition(discX, discY);
  }

  private bringSpiritDiscToFront(): void {
    this.bringToTop(this.spiritDisc);
    this.bringToTop(this.hitZone);
  }

  private stopDiscAnimations(): void {
    this.discRotateTween?.stop();
    this.discRotateTween = undefined;
    this.bodyGlowPulseTween?.stop();
    this.bodyGlowPulseTween = undefined;
    this.swordBobTween?.stop();
    this.swordBobTween = undefined;
    this.spiritDisc.setAngle(0);
  }

  private fitAvatarDisplay(img: Phaser.GameObjects.Image, key: string): void {
    if (!this.scene.textures.exists(key)) return;
    const tex = this.scene.textures.get(key);
    const src = tex.getSourceImage() as { width?: number; height?: number };
    const w = src.width ?? AVATAR_W;
    const h = src.height ?? AVATAR_H;
    const displayH = key.startsWith('char_') ? this.avatarDisplayH : AVATAR_H;
    const aspect = w / h;
    const displayW = displayH * aspect;
    img.setDisplaySize(displayW, displayH);
    this.avatarDisplayW = displayW;
    this.repositionSpiritDisc();
  }

  playHitShake(): void {
    this.playHitFlash();
  }
}
