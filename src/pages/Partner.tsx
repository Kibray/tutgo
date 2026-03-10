import { motion } from 'framer-motion';
import { Calendar, Users, BarChart3, List, UserCog, Building2, ArrowLeft, Store, Percent, Hash, Wallet, Package } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import PartnerDashboardDesktop from '@/components/partner/PartnerDashboardDesktop';

const dashboardItems = [
  { id: 'bookings', icon: Calendar, labelKey: 'partner.journal', route: '/partner/bookings' },
  { id: 'clients', icon: Users, labelKey: 'partner.clients', route: '/partner/clients' },
  { id: 'analytics', icon: BarChart3, labelKey: 'partner.analytics', route: '/partner/analytics' },
  { id: 'services', icon: List, labelKey: 'partner.services', route: '/partner/services' },
  { id: 'staff', icon: UserCog, labelKey: 'partner.staff', route: '/partner/staff' },
  { id: 'company', icon: Building2, labelKey: 'partner.company_profile', route: '/partner/settings' },
  { id: 'deals', icon: Percent, labelKey: 'partner.deals', route: '/partner/deals' },
  { id: 'finance', icon: Wallet, labelKey: 'Финансы', route: '/partner/finance' },
  { id: 'inventory', icon: Package, labelKey: 'Склад', route: '/partner/inventory' },
  { id: 'queue', icon: Hash, labelKey: 'Живая очередь', route: '/partner/queue' },
];

const Partner = () => {
  const { user, isPartner, loading: authLoading } = useAuth();
  const { t } = usePreferences();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">{t('common.loading')}</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 pb-24">
        <Store className="w-12 h-12 text-primary mb-4" />
        <h1 className="text-lg font-bold text-foreground mb-2">{t('partner.panel')}</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">{t('partner.login_prompt')}</p>
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate('/auth')}
          className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
          {t('profile.login')}
        </motion.button>
        <BottomNav />
      </div>
    );
  }

  if (!isPartner) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 pb-24">
        <Store className="w-12 h-12 text-primary mb-4" />
        <h1 className="text-lg font-bold text-foreground mb-2">{t('partner.not_partner')}</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">{t('partner.become_in_profile')}</p>
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate('/profile')}
          className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
          {t('partner.go_profile')}
        </motion.button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold font-display text-foreground flex-1">{t('partner.dashboard')}</h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {dashboardItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => navigate(item.route)}
              className="glass rounded-2xl p-5 flex flex-col items-center gap-3 cursor-pointer active:scale-[0.97] transition-transform"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <p className="text-xs font-semibold text-foreground text-center leading-tight">{t(item.labelKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Partner;
