import { Search, Heart, Bell, ChevronDown, MapPin, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

interface DesktopHeaderProps {
  searchValue?: string;
  onSearch?: (q: string) => void;
  onSearchSubmit?: (q: string) => void;
  onLogoClick?: () => void;
}

const DesktopHeader = ({ searchValue = '', onSearch, onSearchSubmit, onLogoClick }: DesktopHeaderProps) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [query, setQuery] = useState(searchValue);

  useEffect(() => { setQuery(searchValue); }, [searchValue]);

  const submit = () => {
    onSearchSubmit?.(query.trim());
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        height: 68,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'saturate(180%) blur(8px)',
        borderBottom: '1px solid #e8eaee',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 28px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Logo */}
      <div
        onClick={() => { if (onLogoClick) onLogoClick(); else navigate('/'); }}
        style={{ fontWeight: 800, fontSize: 22, cursor: 'pointer', userSelect: 'none', color: '#0f172a', letterSpacing: '-0.6px' }}
      >
        TUT<span style={{ color: '#2563EB' }}>GO</span>
      </div>


      {/* Location */}
      <button
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          height: 36, padding: '0 12px',
          border: '1px solid #e8eaee', borderRadius: 8,
          background: '#fff', fontSize: 13, color: '#374151', cursor: 'pointer',
        }}
      >
        <MapPin size={14} color="#2563EB" />
        Ташкент
        <ChevronDown size={14} color="#6b7280" />
      </button>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 640, display: 'flex', alignItems: 'center' }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          height: 40, padding: '0 12px',
          border: '1px solid #e8eaee', borderRight: 'none',
          borderRadius: '12px 0 0 12px', background: '#f9fafb',
        }}>
          <Search size={16} color="#6b7280" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); onSearch?.(e.target.value); }}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="Поиск услуг, мест и категорий"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 14, color: '#111', fontFamily: 'system-ui, sans-serif',
            }}
          />
        </div>
        <button
          onClick={submit}
          style={{
            height: 40, padding: '0 22px',
            background: '#2563EB', color: '#fff',
            border: 'none', borderRadius: '0 12px 12px 0',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Найти
        </button>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
        <button
          onClick={() => navigate('/bookings')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 36, padding: '0 12px', borderRadius: 8,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#374151', fontSize: 13,
          }}
        >
          <Heart size={16} />
          Избранное
        </button>

        <button
          onClick={() => navigate('/notifications')}
          style={{
            position: 'relative',
            display: 'flex', alignItems: 'center', gap: 6,
            height: 36, padding: '0 12px', borderRadius: 8,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#374151', fontSize: 13,
          }}
        >
          <Bell size={16} />
          Уведомления
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 2, left: 20,
              minWidth: 16, height: 16, padding: '0 3px',
              background: '#ef4444', color: '#fff',
              borderRadius: 8, fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>

        <button
          onClick={() => navigate('/profile')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            height: 36, padding: '0 10px 0 4px', borderRadius: 18,
            background: '#f9fafb', border: '1px solid #e8eaee', cursor: 'pointer',
            color: '#111', fontSize: 13, fontWeight: 500,
          }}
        >
          <span style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#eff6ff', color: '#2563EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={14} />
          </span>
          Мой профиль
          <ChevronDown size={14} color="#6b7280" />
        </button>
      </div>
    </header>
  );
};

export default DesktopHeader;
