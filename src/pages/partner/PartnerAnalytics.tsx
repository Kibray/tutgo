import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, CalendarDays, TrendingUp, BarChart3, Users, Award, Clock } from 'lucide-react';
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
  const [staff, setStaff] = useState<any[]>([]);

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

      const [apptRes, svcRes, staffRes] = await Promise.all([
        supabase.from('appointments').select('*')
          .in('location_id', locIds)
          .in('status', ['confirmed', 'completed'])
          .gte('start_time', monthStart.toISOString()),
        supabase.from('services').select('id, price').in('location_id', locIds),
        supabase.from('staff').select('id, full_name').in('location_id', locIds),
      ]);
      setAppointments(apptRes.data || []);
      setServices(svcRes.data || []);
      setStaff(staffRes.data || []);
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

  const chartData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toISOString().split('T')[0]] = 0;
    }
    appointments.forEach(a => {
      const day = a.start_time?.split('T')[0];
      if (day && days[day] !== undefined) days[day]++;
    });
    return Object.entries(days).map(([date, count]) => ({
      date: date.slice(5),
      count,
    }));
  }, [appointments]);

  const stats = [
    { icon: CalendarCheck, label: t('partner.stat_bookings'), value: String(bookingsMonth) },
    { icon: CalendarDays, label: 'Сегодня', value: String(bookingsToday) },
    { icon: TrendingUp, label: 'Доход (мес.)', value: `${formatPrice(revenueMonth)}` },
    { icon: BarChart3, label: t('partner.stat_listings'), value: String(bizCount) },
  ];

  const retention = useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.forEach(a => {
      if (a.client_user_id) counts[a.client_user_id] = (counts[a.client_user_id] || 0) + 1;
    });
    const ids = Object.keys(counts);
    const returning = ids.filter(id => counts[id] > 1).length;
    return { returning, total: ids.length };
  }, [appointments]);

  const topStaff = useMemo(() => {
    const revBy: Record<string, number> = {};
    appointments.forEach(a => {
      if (!a.staff_id) return;
      revBy[a.staff_id] = (revBy[a.staff_id] || 0) + (serviceMap[a.service_id] || 0);
    });
    const nameMap: Record<string, string> = {};
    staff.forEach(s => { nameMap[s.id] = s.full_name; });
    return Object.entries(revBy)
      .map(([id, revenue]) => ({ id, name: nameMap[id] || '—', revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);
  }, [appointments, serviceMap, staff]);

  const peakHours = useMemo(() => {
    const byHour: Record<number, number> = {};
    appointments.forEach(a => {
      if (!a.start_time) return;
      const h = new Date(a.start_time).getHours();
      byHour[h] = (byHour[h] || 0) + 1;
    });
    return Object.entries(byHour)
      .map(([hour, count]) => ({ hour: Number(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [appointments]);

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
        <div className="mt-4">
          <p className="text-sm font-medium text-foreground mb-2">Динамика за 30 дней</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))"
                fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-4 mt-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Возвращаемость клиентов</p>
          </div>
          {loading ? (
            <div className="w-40 h-5 rounded bg-muted animate-pulse" />
          ) : (
            <p className="text-base font-semibold text-foreground">
              {retention.returning} из {retention.total} клиентов вернулись
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="glass rounded-2xl p-4 mt-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Топ сотрудников по доходу</p>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map(i => <div key={i} className="w-full h-5 rounded bg-muted animate-pulse" />)}
            </div>
          ) : topStaff.length ? (
            <div className="space-y-2">
              {topStaff.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{i + 1}. {s.name}</span>
                  <span className="text-muted-foreground">{formatPrice(s.revenue)} сум</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Нет данных</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="glass rounded-2xl p-4 mt-4 mb-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Часы пик</p>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map(i => <div key={i} className="w-full h-5 rounded bg-muted animate-pulse" />)}
            </div>
          ) : peakHours.length ? (
            <div className="space-y-2">
              {peakHours.map(h => (
                <p key={h.hour} className="text-sm text-foreground">
                  {String(h.hour).padStart(2, '0')}:00 — {h.count} записей
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Нет данных</p>
          )}
        </motion.div>
      </div>
    </PartnerLayout>
  );
};

export default PartnerAnalytics;
