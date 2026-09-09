import React from 'react';
import { Compass } from 'lucide-react';
import type { ScenarioPreset } from '@/components/desktop/DesktopScenarioTiles';

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
  <div
    className="border border-border rounded-xl shadow-sm"
    style={{ background: '#ffffff', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Compass size={18} color="#2563EB" />
      <div className="text-foreground" style={{ fontSize: 15, fontWeight: 700 }}>Гид по Ташкенту</div>
    </div>
    <div className="text-muted-foreground" style={{ fontSize: 13, lineHeight: 1.5, marginTop: -6 }}>
      Открывайте город по настроению — от завтрака до вечерней прогулки
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {GUIDE_SHORTCUTS.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10,
            padding: '10px 10px', cursor: 'pointer', textAlign: 'left',
            fontFamily: 'system-ui, sans-serif', minWidth: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
        >
          <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{s.emoji}</span>
          <span style={{
            fontSize: 12, fontWeight: 600, color: '#374151',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{s.label}</span>
        </button>
      ))}
    </div>

    <button
      onClick={onCta}
      style={{
        background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10,
        padding: '11px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
      }}
    >
      Куда пойти сегодня? →
    </button>
  </div>
);

export default DesktopGuidePanel;
