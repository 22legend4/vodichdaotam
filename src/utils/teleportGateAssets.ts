import type Phaser from 'phaser';
import { publicAssetUrl } from './publicAssetUrl.ts';

export const TELEPORT_GATE_ICON_KEYS = {
  chuyenSinhDan: 'icon_chuyen_sinh_dan',
} as const;

export function queueTeleportGateIconLoads(scene: Phaser.Scene): void {
  scene.load.image(TELEPORT_GATE_ICON_KEYS.chuyenSinhDan, publicAssetUrl('assets/icons/chuyen-sinh-dan.png'));
}
