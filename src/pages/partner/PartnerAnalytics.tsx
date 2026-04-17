import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, CalendarDays, TrendingUp, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { supabase } from '@/integrations/supabase/client';
import PartnerLayout from '@/components/partner/PartnerLayout';
import { formatPrice } from '@/lib/types';

const PartnerAnalytics = () => {
  const { user } = useAuth();
  const { t } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [bizCount, setBizCount] = useState(0);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: locs, count } = await supabase
        .from('locations').select('id', { count: 'exact' }).eq('owner_id', user.id);
      const locIds = (locs || []).map(l => l.id);
      setBizCount(count || 0);
      if (!locIds.length) { setLoading(false); return; }

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [apptRes, svcRes] = await Promise.all([
        supabase.from('appointments').select('*')
          .in('location_id', locIds)
          .in('status', ['pending', 'confirmed', 'completed'])
          .gte('start_time', monthStart.toISOString()),
        supabase.from('services').select('id, price').in('location_id', locIds),
      ]);
      setAppointments(apptRes.data || []);
      setServices(svcRes.data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const serviceMap = useMemo(() => {
    const m: Record<string, number> = {};
    services.forEach(s => { m[s.id] = s.price || 0; });
    return m;
  }, [services]);

  const todayStr = new Date().toISOString().split('T')[0];

  const bookingsMonth = appointments.length;
  const bookingsToday = useMemo(() =>
    appointments.filter(a => a.start_time?.startsWith(todayStr)).length,
  [appointments, todayStr]);

  const revenueMonth = useMemo(() =>
    appointments
      .filter(a => ['confirmed', 'completed'].includes(a.status))
      .reduce((sum, a) => sum + (serviceMap[a.service_id] || 0), 0),
  [appointments, serviceMap]);

  const stats = [
    { icon: CalendarCheck, label: t('partner.stat_bookings'), value: String(bookingsMonth) },
    { icon: CalendarDays, label: 'Сегодня', value: String(bookingsToday) },
    { icon: TrendingUp, label: 'Доход (мес.)', value: `${formatPrice(revenueMonth)}` },
    { icon: BarChart3, label: t('partner.stat_listings'), value: String(bizCount) },
  ];

  return (
    <PartnerLayout title={t('partner.analytics')}>
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="glass rounded-2xl p-4 flex flex-col items-center gap-2">
              {loading ? (
                <>
                  <div className="w-5 h-5 rounded bg-muted animate-pulse" />
                  <div className="w-12 h-6 rounded bg-muted animate-pulse" />
                  <div className="w-16 h-3 rounded bg-muted animate-pulse" />
                </>
              ) : (
                <>
                  <s.icon className="w-5 h-5 text-primary" />
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground text-center">{s.label}</p>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </PartnerLayout>
  );
};

export default PartnerAnalytics;
