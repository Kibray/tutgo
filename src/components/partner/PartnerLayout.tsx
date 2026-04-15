import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Calendar, Users, Wallet, List, UserCog, Package, Percent,
  Hash, Building2, ArrowLeft, Globe, UtensilsCrossed, ShoppingBag, ClipboardList, Star
} from 'lucide-react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { usePreferences } from '@/hooks/usePreferences';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import PartnerBottomNav from './PartnerBottomNav';

interface PartnerLayoutProps {
  children: ReactNode;
  title?: string;
  showBackToPartner?: boolean;
  headerRight?: ReactNode;
}

const PartnerLayout = ({ children, title, showBackToPartner = true, headerRight }: PartnerLayoutProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDesktop = useIsDesktop();
  const { t } = usePreferences();
  const { user, isPartner, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
    else if (!loading && user && !isPartner) navigate('/');
  }, [loading, user, isPartner, navigate]);

  if (loading) return null;

  const sidebarItems = [
    { id: '/partner', icon: LayoutDashboard, label: t('partner.dashboard') },
    { id: '/partner/bookings', icon: Calendar, label: t('partner.journal') },
    { id: '/partner/clients', icon: Users, label: t('partner.clients') },
    { id: '/partner/finance', icon: Wallet, label: t('partner.finance') },
    { id: '/partner/services', icon: List, label: t('partner.services') },
    { id: '/partner/staff', icon: UserCog, label: t('partner.staff') },
    { id: '/partner/inventory', icon: Package, label: t('partner.warehouse') },
    { id: '/partner/deals', icon: Percent, label: t('partner.deals') },
    { id: '/partner/queue', icon: Hash, label: t('partner.live_queue') },
    { id: '/partner/menu', icon: UtensilsCrossed, label: t('partner.menu') },
    { id: '/partner/orders', icon: ClipboardList, label: t('partner.orders') },
    { id: '/partner/tables', icon: ShoppingBag, label: t('partner.tables') },
    { id: '/partner/reviews', icon: Star, label: t('partner.reviews') },
    { id: '/partner/settings', icon: Building2, label: t('partner.company_profile') },
  ];

  if (isDesktop) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <aside className="w-[240px] flex-shrink-0 bg-card border-r border-border flex flex-col">
          <div className="p-5 border-b border-border">
            <div onClick={() => navigate('/')} className="flex items-center gap-2 mb-1 cursor-pointer">
              <span className="text-xl font-bold font-display text-primary">TutGo</span>
              <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">PRO</span>
            </div>
          </div>

          <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
            {sidebarItems.map((item) => {
              const active = pathname === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    active
                      ? 'bg-primary/15 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-border space-y-2">
            <div className="flex justify-center">
              <LanguageSwitcher />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
              onClick={() => navigate('/')}
            >
              <Globe className="w-3.5 h-3.5" />
              {t('partner.view_site')}
            </Button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-12 flex items-center gap-3 px-4 border-b border-border shrink-0">
            <button onClick={() => navigate('/partner')} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            {title && <h1 className="text-sm font-semibold text-foreground">{title}</h1>}
          </header>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Mobile layout
  return (
    <div className="min-h-screen bg-background pb-24">
      {title && (
        <div className="px-4 pt-6 pb-2">
          <div className="flex items-center gap-3">
            {showBackToPartner && pathname !== '/partner' && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/partner')}>
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </motion.button>
            )}
            {pathname === '/partner' && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </motion.button>
            )}
            <h1 className="text-lg font-bold font-display text-foreground flex-1">{title}</h1>
            <LanguageSwitcher />
            {headerRight}
          </div>
        </div>
      )}
      {children}
      <PartnerBottomNav />
    </div>
  );
};

export default PartnerLayout;
