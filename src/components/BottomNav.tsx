import { Home, Tag, Calendar, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const tabs = [
  { id: '/', icon: Home, label: 'Главная' },
  { id: '/deals', icon: Tag, label: 'Акции' },
  { id: '/bookings', icon: Calendar, label: 'Записи' },
  { id: '/profile', icon: User, label: 'Профиль' },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleTap = (id: string) => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.selectionChanged();
    navigate(id);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-strong safe-bottom z-50">
      <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTap(tab.id)}
              className="flex flex-col items-center gap-0.5 px-4 py-1.5 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-0.5 w-8 h-0.5 bg-primary rounded-full glow-green-sm"
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
