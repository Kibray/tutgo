import React from 'react';
import DesktopPresetIcon from '@/components/desktop/DesktopPresetIcon';

export type ScenarioPreset = {
  id: string;
  label: string;
  emoji: string;
  /** business_type this preset maps onto in the existing category system. 'all' = no category filter. */
  biz: string | null;
  /** optional existing route to navigate to instead of switching to results */
  route?: string;
  /** optional existing price sort preset */
  price?: 'asc' | 'desc';
  /** true when TutGo has no data model for this scenario yet */
  soon?: boolean;
};

export const SCENARIOS: ScenarioPreset[] = [
  { id: 'relax', label: 'Отдохнуть', emoji: '💆', biz: 'beauty' },
  { id: 'eat', label: 'Поесть', emoji: '🍽️', biz: 'cafe' },
  { id: 'date', label: 'Свидание', emoji: '💞', biz: 'cafe' },
  { id: 'kids', label: 'С детьми', emoji: '🧸', biz: null, soon: true },
  { id: 'active', label: 'Активно', emoji: '🏃', biz: 'fitness' },
  { id: 'fun', label: 'Развлечься', emoji: '🎭', biz: 'entertainment' },
  { id: 'evening', label: 'Вечером', emoji: '🌆', biz: 'cafe' },
  { id: 'cheap', label: 'Недорого', emoji: '💸', biz: 'all', price: 'asc' },
];

interface Props {
  onSelect: (p: ScenarioPreset) => void;
}

const DesktopScenarioTiles: React.FC<Props> = ({ onSelect }) => (
  <section className="mb-6">
    <div className="mb-3 text-lg font-bold text-foreground">
      Чем займёмся сегодня?
    </div>
    <div className="grid grid-cols-4 gap-3 xl:grid-cols-8">
      {SCENARIOS.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s)}
          className="flex min-w-0 flex-col items-center gap-2 rounded-lg border border-border bg-card px-2 py-3 text-card-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <DesktopPresetIcon presetId={s.id} />
          <span className="w-full truncate text-center text-xs font-semibold">{s.label}</span>
        </button>
      ))}
    </div>
  </section>
);

export default DesktopScenarioTiles;
