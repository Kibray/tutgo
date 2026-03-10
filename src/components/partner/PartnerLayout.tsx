import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Calendar, Users, Wallet, List, UserCog, Package, Percent,
  Hash, Building2, ExternalLink, ArrowLeft, Globe, UtensilsCrossed, ShoppingBag, ClipboardList
} from 'lucide-react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { Button } from '@/components/ui/button';
import PartnerBottomNav from './PartnerBottomNav';

const sidebarItems = [
  { id: '/partner', icon: LayoutDashboard, label: 'Дашборд' },
  { id: '/partner/bookings', icon: Calendar, label: 'Журнал записей' },
  { id: '/partner/clients', icon: Users, label: 'Клиентская база' },
  { id: '/partner/finance', icon: Wallet, label: 'Финансы' },
  { id: '/partner/services', icon: List, label: 'Мои услуги' },
  { id: '/partner/staff', icon: UserCog, label: 'Мастера' },
  { id: '/partner/inventory', icon: Package, label: 'Склад' },
  { id: '/partner/deals', icon: Percent, label: 'Акции' },
  { id: '/partner/queue', icon: Hash, label: 'Живая очередь' },
  { id: '/partner/menu', icon: UtensilsCrossed, label: 'Меню' },
  { id: '/partner/orders', icon: ClipboardList, label: 'Заказы кухни' },
  { id: '/partner/tables', icon: ShoppingBag, label: 'Столики' },
  { id: '/partner/settings', icon: Building2, label: 'Профиль компании' },
];

interface PartnerLayoutProps {
  children: ReactNode;
  title?: string;
  /** Show back arrow on mobile header (default: true for sub-pages) */
  showBackToPartner?: boolean;
  /** Custom right-side header content on mobile */
  headerRight?: ReactNode;
}

const PartnerLayout = ({ children, title, showBackToPartner = true, headerRight }: PartnerLayoutProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[240px] flex-shrink-0 bg-card border-r border-border flex flex-col">
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-2 mb-1">
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

          <div className="p-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
              onClick={() => navigate('/')}
            >
              <Globe className="w-3.5 h-3.5" />
              Смотреть сайт
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
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
