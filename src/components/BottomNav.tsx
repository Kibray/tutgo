import { Home, Tag, Calendar, User, Briefcase } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';

const BottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isPartner } = useAuth();
  const { t } = usePreferences();

  const tabs = [
    { id: '/', icon: Home, label: t('nav.home') },
    { id: '/deals', icon: Tag, label: t('nav.deals') },
    { id: isPartner ? '/partner' : '/partner-landing', icon: Briefcase, label: t('nav.business') },
    { id: '/bookings', icon: Calendar, label: t('nav.bookings') },
    { id: '/profile', icon: User, label: t('nav.profile') },
  ];

  const handleTap = (id: string) => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.selectionChanged();
    navigate(id);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[2000] safe-bottom bg-background/60 backdrop-blur-xl border-t border-border/50 rounded-t-[20px]">
      <div className="flex items-center justify-around py-2.5 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTap(tab.id)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 relative"
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
