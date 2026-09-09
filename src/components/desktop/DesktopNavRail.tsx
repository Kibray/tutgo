import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Globe, Dumbbell, Tag, CalendarCheck, Heart, Users, Star, Plus,
} from 'lucide-react';

/**
 * Desktop-only navigation rail for the desktop home page.
 * Not used anywhere in the mobile tree — mobile keeps BottomNav / MobileSidebar.
 */

const PRIMARY = [
  { to: '/', icon: Home, label: 'Главная' },
  { to: '/tours', icon: Globe, label: 'Туры' },
  { to: '/sport', icon: Dumbbell, label: 'Спорт' },
  { to: '/deals', icon: Tag, label: 'Акции' },
];

const SECONDARY = [
  { to: '/bookings', icon: CalendarCheck, label: 'Мои записи' },
  { to: '/favorites', icon: Heart, label: 'Избранное' },
  { to: '/queue', icon: Users, label: 'Живая очередь' },
  { to: '/reviews', icon: Star, label: 'Отзывы' },
];

const ACCENT = '#2563EB';
const BORDER = '#e8eaee';
const TEXT2 = '#4b5563';

const DesktopNavRail = ({ activeOverride }: { activeOverride?: string }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const renderItem = (item: { to: string; icon: any; label: string }) => {
    const active = (activeOverride ?? pathname) === item.to;
    const Icon = item.icon;
    return (
      <button
        key={item.to}
        onClick={() => navigate(item.to)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          height: 40,
          padding: '0 12px',
          borderRadius: 10,
          border: 'none',
          cursor: 'pointer',
          background: active ? '#eff6ff' : 'transparent',
          color: active ? ACCENT : TEXT2,
          fontSize: 13.5,
          fontWeight: active ? 600 : 500,
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'left',
          transition: 'background 0.15s ease, color 0.15s ease',
        }}
        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#f4f5f7'; }}
        onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
      >
        <Icon size={17} strokeWidth={2} />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <aside
      style={{
        width: 224,
        flexShrink: 0,
        position: 'sticky',
        top: 76,
        alignSelf: 'flex-start',
        background: '#ffffff',
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
      }}
    >
      {PRIMARY.map(renderItem)}
      <div style={{ height: 1, background: BORDER, margin: '8px 6px' }} />
      {SECONDARY.map(renderItem)}
      <div style={{ height: 1, background: BORDER, margin: '8px 6px' }} />
      <button
        onClick={() => navigate('/partner-landing')}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          height: 40,
          borderRadius: 10,
          border: 'none',
          cursor: 'pointer',
          background: ACCENT,
          color: '#fff',
          fontSize: 13.5,
          fontWeight: 600,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <Plus size={16} /> Добавить бизнес
      </button>
    </aside>
  );
};

export default DesktopNavRail;
