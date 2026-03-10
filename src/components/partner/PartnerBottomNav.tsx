import { Home, Calendar, Hash, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePreferences } from '@/hooks/usePreferences';

const PartnerBottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = usePreferences();

  const tabs = [
    { id: '/partner', icon: Home, label: t('partner.nav_home') },
    { id: '/partner/bookings', icon: Calendar, label: t('partner.nav_bookings') },
    { id: '/partner/queue', icon: Hash, label: t('partner.nav_queue') },
    { id: '/partner/settings', icon: User, label: t('partner.nav_profile') },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[2000] safe-bottom bg-background/60 backdrop-blur-xl border-t border-border/50 rounded-t-[20px]">
      <div className="flex items-center justify-around py-2.5 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.id)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="partner-nav-indicator"
                  className="absolute -top-0.5 w-8 h-0.5 bg-primary rounded-full"
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
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

export default PartnerBottomNav;
