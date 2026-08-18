import Phaser from 'phaser';
import { UI_THEME, uiLabelTextStyle } from './theme.ts';
import { COMMAND_MENU_ROUND_SIZE } from './CommandMenu.ts';

export interface CountdownTimerOptions {
  addToScene?: boolean;
  /** Hiện chữ「Thời gian trận đấu」phía trên nút. */
  showLabel?: boolean;
  /** Bán kính vòng tròn đếm ngược. */
  radius?: number;
}

export class CountdownTimer extends Phaser.GameObjects.Container {
  private ring: Phaser.GameObjects.Arc;
  private timeText: Phaser.GameObjects.Text;
  private labelText: Phaser.GameObjects.Text;
  private hintText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    options: CountdownTimerOptions | boolean = true,
  ) {
    super(scene, x, y);
    this.setDepth(UI_THEME.depth.hud);

    const opts: CountdownTimerOptions = typeof options === 'boolean'
      ? { addToScene: options }
      : options;
    const radius = opts.radius ?? COMMAND_MENU_ROUND_SIZE / 2;

    this.ring = scene.add
      .circle(0, 0, radius, parseInt(UI_THEME.colors.bgPanelLight.replace('#', ''), 16), 0.92)
      .setStrokeStyle(4, parseInt(UI_THEME.colors.accentAlt.replace('#', ''), 16));

    this.timeText = scene.add
      .text(0, -2, '30', {
        ...uiLabelTextStyle(26, { bold: true }),
      })
      .setOrigin(0.5);

    this.labelText = scene.add
      .text(0, -radius - 22, 'Thời gian\ntrận đấu', {
        ...uiLabelTextStyle(13),
        align: 'center',
      })
      .setOrigin(0.5)
      .setVisible(opts.showLabel !== false);

    this.hintText = scene.add
      .text(-200, radius + 12, '', {
        ...uiLabelTextStyle(13),
        wordWrap: { width: 240 },
        align: 'right',
      })
      .setOrigin(1, 0);

    this.add([this.ring, this.timeText, this.labelText, this.hintText]);
    if (opts.addToScene !== false) {
      scene.add.existing(this);
    }
  }

  setSeconds(seconds: number): void {
    this.timeText.setText(String(Math.ceil(seconds)));
    this.timeText.setColor(seconds <= 5 ? UI_THEME.colors.accent : '#ffffff');
  }

  setLabel(label: string): void {
    this.labelText.setText(label);
  }

  setHint(text: string): void {
    this.hintText.setText(text);
  }
}
