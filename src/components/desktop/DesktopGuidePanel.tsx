import React from 'react';
import { Compass } from 'lucide-react';
import type { ScenarioPreset } from '@/components/desktop/DesktopScenarioTiles';
import DesktopPresetIcon from '@/components/desktop/DesktopPresetIcon';
import { Button } from '@/components/ui/button';

export const GUIDE_SHORTCUTS: ScenarioPreset[] = [
  { id: 'g-eat', label: 'Поесть', emoji: '🍽️', biz: 'cafe' },
  { id: 'g-sights', label: 'Достопримечательности', emoji: '🕌', biz: null, soon: true },
  { id: 'g-sport', label: 'Спорт', emoji: '🏅', biz: 'fitness', route: '/sport' },
  { id: 'g-fun', label: 'Развлечения', emoji: '🎡', biz: 'entertainment' },
  { id: 'g-parks', label: 'Парки', emoji: '🌳', biz: null, soon: true },
  { id: 'g-shop', label: 'Шопинг', emoji: '🛍️', biz: 'retail' },
  { id: 'g-kids', label: 'С детьми', emoji: '🧸', biz: null, soon: true },
  { id: 'g-evening', label: 'Вечером', emoji: '🌆', biz: 'cafe' },
];

interface Props {
  onSelect: (p: ScenarioPreset) => void;
  onCta: () => void;
}

const DesktopGuidePanel: React.FC<Props> = ({ onSelect, onCta }) => (
  <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
    <div className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Compass size={18} strokeWidth={1.8} />
      </span>
      <div className="text-sm font-bold">Гид по Ташкенту</div>
    </div>
    <div className="text-xs leading-5 text-muted-foreground">
      Открывайте город по настроению — от завтрака до вечерней прогулки
    </div>

    <div className="grid grid-cols-2 gap-2">
      {GUIDE_SHORTCUTS.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s)}
          className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-background px-2 py-2 text-left transition hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <DesktopPresetIcon presetId={s.id} compact />
          <span className="min-w-0 truncate text-xs font-semibold">{s.label}</span>
        </button>
      ))}
    </div>

    <Button onClick={onCta} className="h-10 w-full rounded-lg text-xs">
      Куда пойти сегодня? →
    </Button>
  </section>
);

export default DesktopGuidePanel;
