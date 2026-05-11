import { Home, Tag, Calendar, Heart, Users, Star, MessageSquare, Plus, Globe, Bus, Plane, Hotel } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const menuItems = [
  { id: '/', icon: Home, label: 'Главная' },
  { id: '/map', icon: Map, label: 'Карта', isMapActive: true },
  { id: '/tours', icon: Globe, label: 'Туры' },
  { id: '/transport', icon: Bus, label: 'Транспорт' },
  { id: '/flights', icon: Plane, label: 'Билеты' },
  { id: '/stay', icon: Hotel, label: 'Жильё' },
  { id: '/deals', icon: Tag, label: 'Акции' },
  { id: '/bookings', icon: Calendar, label: 'Мои записи' },
  { id: '/favorites', icon: Heart, label: 'Избранное' },
];

const secondaryItems = [
  { id: '/queue', icon: Users, label: 'Живая очередь' },
  { id: '/reviews', icon: Star, label: 'Отзывы' },
  { id: '/friends', icon: MessageSquare, label: 'Друзья' },
];

const DesktopSidebar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (id: string, item?: any) => {
    if (item?.isMapActive && pathname === '/') return true;
    return pathname === id;
  };

  return (
    <aside className="w-[220px] flex-shrink-0 bg-card/95 backdrop-blur-xl border-r border-border flex flex-col h-full">
      <nav className="flex-1 py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const active = isActive(item.id, item);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === '/map' || item.id === '/') navigate('/');
                else navigate(item.id);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{item.label}</span>
              {active && (
                <motion.div
                  layoutId="desktop-nav"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                />
              )}
            </button>
          );
        })}

        <div className="h-px bg-border my-3" />

        {secondaryItems.map((item) => {
          const active = pathname === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={() => navigate('/partner-landing')}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить бизнес
        </button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
