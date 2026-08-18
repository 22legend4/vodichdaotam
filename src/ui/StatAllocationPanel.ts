import Phaser from 'phaser';
import type { BaseStats } from '../types/game.ts';
import { DEFAULT_BASE_STATS, INITIAL_FREE_STAT_POINTS } from '../constants/gameRules.ts';
import { STAT_LABELS, uiLabelTextStyle, clampFontSizePx } from './theme.ts';
import { UIButton } from './UIButton.ts';

type StatKey = keyof BaseStats;

function formatStatValue(n: number): string {
  return n.toLocaleString('vi-VN');
}

function statValueFontSize(base: number): number {
  if (base >= 1_000_000_000) return 13;
  if (base >= 1_000_000) return 15;
  if (base >= 100_000) return 16;
  return 18;
}

export class StatAllocationPanel extends Phaser.GameObjects.Container {
  private allocated: BaseStats = { hp: 0, atk: 0, def: 0, qi: 0 };
  private baseTexts = new Map<StatKey, Phaser.GameObjects.Text>();
  private addedTexts = new Map<StatKey, Phaser.GameObjects.Text>();
  private remainingText: Phaser.GameObjects.Text;
  private onChange?: (allocated: BaseStats, valid: boolean) => void;
  private readonly pointBudget: number;
  private readonly displayBase: BaseStats;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    pointBudget = INITIAL_FREE_STAT_POINTS,
    currentStats?: BaseStats,
  ) {
    super(scene, x, y);
    this.pointBudget = pointBudget;
    this.displayBase = currentStats ?? DEFAULT_BASE_STATS;

    const title = scene.add.text(0, 0, `Phân bổ ${pointBudget} điểm chỉ số`, {
      ...uiLabelTextStyle(20, { titleFont: true, bold: true }),
    });

    this.remainingText = scene.add.text(0, 30, this.remainingLabel(), {
      ...uiLabelTextStyle(17),
    });

    const minusX = width - 92;
    const plusX = width - 42;
    const addedX = minusX - 52;
    const baseX = 108;

    const keys: StatKey[] = ['hp', 'atk', 'def', 'qi'];
    keys.forEach((key, index) => {
      const rowY = 70 + index * 56;
      const base = this.displayBase[key];

      const label = scene.add.text(0, rowY, STAT_LABELS[key] ?? key, {
        ...uiLabelTextStyle(18),
      });

      const baseText = scene.add.text(baseX, rowY, formatStatValue(base), {
        ...uiLabelTextStyle(statValueFontSize(base)),
      });
      this.baseTexts.set(key, baseText);

      const addedText = scene.add.text(addedX, rowY, this.addedLabel(key), {
        ...uiLabelTextStyle(17, { bold: true }),
        color: '#eab308',
      }).setOrigin(1, 0);
      this.addedTexts.set(key, addedText);

      const minusBtn = new UIButton(scene, {
        x: minusX,
        y: rowY + 12,
        width: 44,
        height: 36,
        label: '−',
        onClick: () => this.adjust(key, -1),
        addToScene: false,
      });

      const plusBtn = new UIButton(scene, {
        x: plusX,
        y: rowY + 12,
        width: 44,
        height: 36,
        label: '+',
        onClick: () => this.adjust(key, 1),
        addToScene: false,
      });

      this.add([label, baseText, addedText, minusBtn, plusBtn]);
    });

    this.add([title, this.remainingText]);
    scene.add.existing(this);
    // Trạng thái ban đầu: 0 điểm đã phân, chưa hợp lệ — parent gọi onAllocationChange sau khi sẵn sàng.
  }

  onAllocationChange(callback: (allocated: BaseStats, valid: boolean) => void): void {
    this.onChange = callback;
    // Không gọi notifyChange() ở đây — callback có thể chưa sẵn sàng (confirmBtn chưa tạo).
  }

  getAllocated(): BaseStats {
    return { ...this.allocated };
  }

  private addedLabel(key: StatKey): string {
    return `+${this.allocated[key]}`;
  }

  private remaining(): number {
    return this.pointBudget - (this.allocated.hp + this.allocated.atk + this.allocated.def + this.allocated.qi);
  }

  private remainingLabel(): string {
    return `Điểm còn lại: ${this.remaining()} / ${this.pointBudget}`;
  }

  private refreshRow(key: StatKey): void {
    const base = this.displayBase[key];
    const baseText = this.baseTexts.get(key);
    if (baseText) {
      baseText.setText(formatStatValue(base));
      baseText.setFontSize(clampFontSizePx(statValueFontSize(base)));
    }
    this.addedTexts.get(key)?.setText(this.addedLabel(key));
  }

  private adjust(key: StatKey, delta: number): void {
    if (delta > 0 && this.remaining() <= 0) return;
    if (delta < 0 && this.allocated[key] <= 0) return;
    this.allocated[key] += delta;
    this.refreshRow(key);
    this.remainingText.setText(this.remainingLabel());
    this.notifyChange();
  }

  private notifyChange(): void {
    this.onChange?.({ ...this.allocated }, this.remaining() === 0);
  }
}
