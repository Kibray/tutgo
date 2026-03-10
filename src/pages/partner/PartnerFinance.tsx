import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, DollarSign, CalendarDays, CalendarRange, TrendingUp, Crown, Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import PartnerBottomNav from '@/components/partner/PartnerBottomNav';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatPrice } from '@/lib/types';

const PartnerFinance = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [locations, setLocations] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: locs } = await supabase
        .from('locations').select('id').eq('owner_id', user.id);
      const locIds = (locs || []).map(l => l.id);
      setLocations(locs || []);
      if (!locIds.length) { setLoading(false); return; }

      const [apptRes, svcRes] = await Promise.all([
        supabase.from('appointments').select('*')
          .in('location_id', locIds)
          .in('status', ['confirmed', 'completed'])
          .gte('start_time', new Date(Date.now() - 30 * 86400000).toISOString()),
        supabase.from('services').select('*').in('location_id', locIds),
      ]);
      setAppointments(apptRes.data || []);
      setServices(svcRes.data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const serviceMap = useMemo(() => {
    const m: Record<string, any> = {};
    services.forEach(s => { m[s.id] = s; });
    return m;
  }, [services]);

  const getPrice = (appt: any) => {
    if (!appt.service_id) return 0;
    return serviceMap[appt.service_id]?.price || 0;
  };

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  const revenueToday = useMemo(() =>
    appointments.filter(a => a.start_time.startsWith(todayStr)).reduce((s, a) => s + getPrice(a), 0),
    [appointments, serviceMap]);

  const revenueWeek = useMemo(() =>
    appointments.filter(a => new Date(a.start_time) >= weekAgo).reduce((s, a) => s + getPrice(a), 0),
    [appointments, serviceMap]);

  const revenueMonth = useMemo(() =>
    appointments.reduce((s, a) => s + getPrice(a), 0),
    [appointments, serviceMap]);

  const avgCheck = useMemo(() => {
    const withPrice = appointments.filter(a => getPrice(a) > 0);
    return withPrice.length ? Math.round(revenueMonth / withPrice.length) : 0;
  }, [appointments, revenueMonth, serviceMap]);

  // Chart data - last 30 days
  const chartData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      days[d.toISOString().split('T')[0]] = 0;
    }
    appointments.forEach(a => {
      const day = a.start_time.split('T')[0];
      if (days[day] !== undefined) days[day] += getPrice(a);
    });
    return Object.entries(days).map(([date, revenue]) => ({
      date: new Date(date).toLocaleDateString('ru', { day: 'numeric', month: 'short' }),
      revenue,
    }));
  }, [appointments, serviceMap]);

  // Top services
  const topServices = useMemo(() => {
    const map: Record<string, { name: string; revenue: number; count: number }> = {};
    appointments.forEach(a => {
      if (!a.service_id || !serviceMap[a.service_id]) return;
      const svc = serviceMap[a.service_id];
      if (!map[a.service_id]) map[a.service_id] = { name: svc.name, revenue: 0, count: 0 };
      map[a.service_id].revenue += svc.price;
      map[a.service_id].count += 1;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [appointments, serviceMap]);

  // Top clients
  const topClients = useMemo(() => {
    const map: Record<string, { name: string; spent: number; visits: number }> = {};
    appointments.forEach(a => {
      const key = a.client_user_id || a.client_name || 'unknown';
      const name = a.client_name || 'Клиент';
      if (!map[key]) map[key] = { name, spent: 0, visits: 0 };
      map[key].spent += getPrice(a);
      map[key].visits += 1;
    });
    return Object.values(map).sort((a, b) => b.spent - a.spent).slice(0, 5);
  }, [appointments, serviceMap]);

  const stats = [
    { icon: DollarSign, label: 'Сегодня', value: revenueToday, color: 'text-primary' },
    { icon: CalendarDays, label: 'За неделю', value: revenueWeek, color: 'text-primary' },
    { icon: CalendarRange, label: 'За месяц', value: revenueMonth, color: 'text-primary' },
    { icon: TrendingUp, label: 'Средний чек', value: avgCheck, color: 'text-primary' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass rounded-lg px-3 py-2 text-xs border border-border">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-bold text-primary">{formatPrice(payload[0].value)} сум</p>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Загрузка...</div>
  );

  return (
    <div className="min-h-screen bg-background pb-24 overflow-y-auto">
      <div className="px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/partner')}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold font-display text-foreground">Финансы</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <span className="text-[10px] text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-lg font-bold text-foreground">{formatPrice(s.value)} <span className="text-xs font-normal text-muted-foreground">сум</span></p>
            </motion.div>
          ))}
        </div>

        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">📊 Доход за 30 дней</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142, 72%, 29%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(142, 72%, 29%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(220, 10%, 55%)' }} axisLine={false} tickLine={false} interval={6} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(220, 10%, 55%)' }} axisLine={false} tickLine={false} width={40}
                  tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(142, 72%, 29%)" strokeWidth={2}
                  fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Services */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">🏆 Топ услуг по доходу</h3>
          {topServices.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Нет данных</p>
          ) : (
            <div className="space-y-2.5">
              {topServices.map((svc, i) => {
                const maxRev = topServices[0]?.revenue || 1;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-foreground truncate">{svc.name}</p>
                        <p className="text-xs font-bold text-primary ml-2 flex-shrink-0">{formatPrice(svc.revenue)} сум</p>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(svc.revenue / maxRev) * 100}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{svc.count} заказов</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Top Clients */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">👑 Топ клиентов</h3>
          {topClients.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Нет данных</p>
          ) : (
            <div className="space-y-2.5">
              {topClients.map((client, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                    {i === 0 ? <Crown className="w-4 h-4 text-primary" /> :
                      <span className="text-xs font-bold text-primary">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{client.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-primary font-medium">{formatPrice(client.spent)} сум</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Repeat className="w-3 h-3" />{client.visits} визитов
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <PartnerBottomNav />
    </div>
  );
};

export default PartnerFinance;
