import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, BarChart3, List, UserCog, Building2, ArrowLeft, Store, Percent, Hash, Wallet, Package } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import PartnerLayout from '@/components/partner/PartnerLayout';
import PartnerMobileStats from '@/components/partner/PartnerMobileStats';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import PartnerDashboardDesktop from '@/components/partner/PartnerDashboardDesktop';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { startOfDay, endOfDay, format } from 'date-fns';

const dashboardItems = [
  { id: 'bookings', icon: Calendar, labelKey: 'partner.journal', route: '/partner/bookings', badgeKey: 'bookings' },
  { id: 'clients', icon: Users, labelKey: 'partner.clients', route: '/partner/clients', badgeKey: 'clients' },
  { id: 'analytics', icon: BarChart3, labelKey: 'partner.analytics', route: '/partner/analytics', badgeKey: '' },
  { id: 'services', icon: List, labelKey: 'partner.services', route: '/partner/services', badgeKey: 'services' },
  { id: 'staff', icon: UserCog, labelKey: 'partner.staff', route: '/partner/staff', badgeKey: 'staff' },
  { id: 'company', icon: Building2, labelKey: 'partner.company_profile', route: '/partner/settings', badgeKey: '' },
  { id: 'deals', icon: Percent, labelKey: 'partner.deals', route: '/partner/deals', badgeKey: 'deals' },
  { id: 'finance', icon: Wallet, labelKey: 'Финансы', route: '/partner/finance', badgeKey: '' },
  { id: 'inventory', icon: Package, labelKey: 'Склад', route: '/partner/inventory', badgeKey: 'lowStock' },
  { id: 'queue', icon: Hash, labelKey: 'Живая очередь', route: '/partner/queue', badgeKey: 'queue' },
];

const Partner = () => {
  const { user, isPartner, loading: authLoading } = useAuth();
  const { t } = usePreferences();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  const [badges, setBadges] = useState<Record<string, number>>({});
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayBookings, setTodayBookings] = useState(0);
  const [queueWaiting, setQueueWaiting] = useState(0);
  const [avgRating, setAvgRating] = useState(0);

  const today = useMemo(() => new Date(), []);
  const todayStr = format(today, 'yyyy-MM-dd');

  useEffect(() => {
    if (!user || !isPartner || isDesktop) return;
    const uid = user.id;
    const dayStart = startOfDay(today).toISOString();
    const dayEnd = endOfDay(today).toISOString();

    supabase.from('locations').select('id, rating').eq('owner_id', uid).then(({ data }) => {
      const locs = data || [];
      const avg = locs.reduce((s, l) => s + (l.rating || 0), 0) / (locs.length || 1);
      setAvgRating(Math.round(avg * 10) / 10);
    });

    supabase.from('appointments').select('id, services(price), locations!inner(owner_id)')
      .eq('locations.owner_id', uid)
      .gte('start_time', dayStart).lte('start_time', dayEnd)
      .then(({ data }) => {
        const d = data || [];
        setTodayBookings(d.length);
        setTodayRevenue(d.reduce((s, a: any) => s + (a.services?.price || 0), 0));
        setBadges(prev => ({ ...prev, bookings: d.length }));
      });

    supabase.from('queue_tickets').select('id, status, locations!inner(owner_id)')
      .eq('locations.owner_id', uid).eq('queue_date', todayStr).eq('status', 'waiting')
      .then(({ data }) => {
        const count = (data || []).length;
        setQueueWaiting(count);
        setBadges(prev => ({ ...prev, queue: count }));
      });

    supabase.from('appointments').select('client_user_id, locations!inner(owner_id)')
      .eq('locations.owner_id', uid).not('client_user_id', 'is', null)
      .then(({ data }) => {
        const unique = new Set((data || []).map((a: any) => a.client_user_id)).size;
        setBadges(prev => ({ ...prev, clients: unique }));
      });

    supabase.from('services').select('id, locations!inner(owner_id)')
      .eq('locations.owner_id', uid)
      .then(({ data }) => setBadges(prev => ({ ...prev, services: (data || []).length })));

    supabase.from('staff').select('id, locations!inner(owner_id)')
      .eq('locations.owner_id', uid)
      .then(({ data }) => setBadges(prev => ({ ...prev, staff: (data || []).length })));

    supabase.from('deals').select('id, locations!inner(owner_id)')
      .eq('locations.owner_id', uid).eq('is_active', true)
      .then(({ data }) => setBadges(prev => ({ ...prev, deals: (data || []).length })));

    supabase.from('inventory').select('id, quantity, min_stock, locations!inner(owner_id)')
      .eq('locations.owner_id', uid)
      .then(({ data }) => {
        const low = (data || []).filter((i: any) => i.quantity <= i.min_stock).length;
        setBadges(prev => ({ ...prev, lowStock: low }));
      });
  }, [user, isPartner, isDesktop]);

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

  if (isDesktop) return <PartnerDashboardDesktop />;

  return (
    <PartnerLayout title={t('partner.dashboard')} showBackToPartner={false}>
      <div className="px-4">
        {/* Mini stats */}
        <div className="mb-5">
          <PartnerMobileStats
            todayRevenue={todayRevenue}
            todayBookings={todayBookings}
            queueWaiting={queueWaiting}
            avgRating={avgRating}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {dashboardItems.map((item, i) => {
            const badgeValue = item.badgeKey ? badges[item.badgeKey] : undefined;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => navigate(item.route)}
                className="glass rounded-2xl p-5 flex flex-col items-center gap-3 cursor-pointer active:scale-[0.97] transition-transform relative"
              >
                {badgeValue !== undefined && badgeValue > 0 && (
                  <Badge
                    variant={item.badgeKey === 'lowStock' ? 'destructive' : 'default'}
                    className="absolute top-2.5 right-2.5 text-[10px] min-w-[20px] h-5 flex items-center justify-center px-1.5"
                  >
                    {badgeValue}
                  </Badge>
                )}
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-xs font-semibold text-foreground text-center leading-tight">{t(item.labelKey)}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </PartnerLayout>
  );
};

export default Partner;
