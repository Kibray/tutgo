import React from 'react';

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
  <div style={{ marginBottom: 24 }}>
    <div style={{ fontSize: 17, fontWeight: 700, color: '#111111', marginBottom: 12, letterSpacing: '-0.3px' }}>
      Чем займёмся сегодня?
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 10 }}>
      {SCENARIOS.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s)}
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 14,
            padding: '14px 8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            fontFamily: 'system-ui, sans-serif',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
        >
          <span style={{ fontSize: 24, lineHeight: 1 }}>{s.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{s.label}</span>
        </button>
      ))}
    </div>
  </div>
);

export default DesktopScenarioTiles;
