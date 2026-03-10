import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, MousePointerClick, CalendarCheck, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { supabase } from '@/integrations/supabase/client';
import PartnerLayout from '@/components/partner/PartnerLayout';

const PartnerAnalytics = () => {
  const { user } = useAuth();
  const { t } = usePreferences();
  const [bizCount, setBizCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from('locations').select('id', { count: 'exact', head: true }).eq('owner_id', user.id)
      .then(({ count }) => setBizCount(count || 0));
  }, [user]);

  const stats = [
    { icon: Eye, label: t('partner.stat_views'), value: '—' },
    { icon: MousePointerClick, label: t('partner.stat_clicks'), value: '—' },
    { icon: CalendarCheck, label: t('partner.stat_bookings'), value: '—' },
    { icon: TrendingUp, label: t('partner.stat_listings'), value: String(bizCount) },
  ];

  return (
    <PartnerLayout title={t('partner.analytics')}>
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="glass rounded-2xl p-4 flex flex-col items-center gap-2">
              <s.icon className="w-5 h-5 text-primary" />
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground text-center">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">{t('partner.analytics_coming')}</p>
      </div>
    </PartnerLayout>
  );
};

export default PartnerAnalytics;
