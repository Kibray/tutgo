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

const DEFAULT_GUIDE_COVER = 'https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?w=800&auto=format&fit=crop&q=80';

interface Props {
  onSelect: (p: ScenarioPreset) => void;
  onCta: () => void;
  photoUrl?: string;
}

const DesktopGuidePanel: React.FC<Props> = ({ onSelect, onCta, photoUrl = DEFAULT_GUIDE_COVER }) => (
  <section className="flex flex-col gap-3 overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
    <div className="relative h-[110px] w-full">
      <img
        src={photoUrl}
        alt="Гид по Ташкенту"
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>

    <div className="flex flex-col gap-3 p-4 pt-2">
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
    </div>
  </section>
);

export default DesktopGuidePanel;
