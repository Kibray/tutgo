import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Calendar, Users, Wallet, List, UserCog, Package, Percent,
  Hash, Star, Building2, Bell, Plus, ExternalLink, ChevronRight, Clock,
  TrendingUp, CircleDot
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import InstagramConnectCard from '@/components/partner/InstagramConnectCard';
import SkeletonCard from '@/components/SkeletonCard';
import { useSubscription } from '@/hooks/useSubscription';

/* ─── Sidebar items ─── */
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
  { id: '/partner/settings', icon: Building2, label: 'Профиль компании' },
];

/* ─── Component ─── */
const PartnerDashboardDesktop = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { t } = usePreferences();
  const { plan, isEarlyAdopter, daysLeft } = useSubscription();

  // State
  const [locations, setLocations] = useState<any[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [queueTickets, setQueueTickets] = useState<any[]>([]);
  const [weekRevenue, setWeekRevenue] = useState<{ day: string; revenue: number }[]>([]);
  const [topClients, setTopClients] = useState<{ name: string; total: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => new Date(), []);
  const todayStr = format(today, 'yyyy-MM-dd');

  // Load all data
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const uid = user.id;

    const promises = [
      // Locations
      supabase.from('locations').select('*').eq('owner_id', uid).then(({ data }) => {
        setLocations(data || []);
        const avg = (data || []).reduce((s, l) => s + (l.rating || 0), 0) / ((data || []).length || 1);
        setAvgRating(Math.round(avg * 10) / 10);
      }),

      // Today's appointments
      supabase.from('appointments').select('*, services(name, price, currency), staff(full_name), locations!inner(owner_id)')
        .eq('locations.owner_id', uid)
        .gte('start_time', startOfDay(today).toISOString())
        .lte('start_time', endOfDay(today).toISOString())
        .order('start_time')
        .then(({ data }) => setTodayAppointments(data || [])),

      // Last 7 days appointments for revenue chart
      supabase.from('appointments').select('start_time, status, services(price), locations!inner(owner_id)')
        .eq('locations.owner_id', uid)
        .gte('start_time', startOfDay(subDays(today, 6)).toISOString())
        .lte('start_time', endOfDay(today).toISOString())
        .in('status', ['confirmed', 'completed'])
        .then(({ data }) => {
          setAllAppointments(data || []);
          const map: Record<string, number> = {};
          for (let i = 6; i >= 0; i--) {
            const d = format(subDays(today, i), 'dd.MM');
            map[d] = 0;
          }
          (data || []).forEach((a: any) => {
            const d = format(new Date(a.start_time), 'dd.MM');
            if (map[d] !== undefined) map[d] += a.services?.price || 0;
          });
          setWeekRevenue(Object.entries(map).map(([day, revenue]) => ({ day, revenue })));
        }),

      // Unique clients
      supabase.from('appointments').select('client_user_id, client_name, services(price), locations!inner(owner_id)')
        .eq('locations.owner_id', uid)
        .not('client_user_id', 'is', null)
        .then(({ data }) => {
          const clients = new Map<string, { name: string; total: number; count: number }>();
          (data || []).forEach((a: any) => {
            const id = a.client_user_id;
            const prev = clients.get(id) || { name: a.client_name || 'Клиент', total: 0, count: 0 };
            prev.total += a.services?.price || 0;
            prev.count += 1;
            clients.set(id, prev);
          });
          setTotalClients(clients.size);
          setTopClients(
            [...clients.values()].sort((a, b) => b.total - a.total).slice(0, 5)
          );
        }),

      // Queue tickets today
      supabase.from('queue_tickets').select('*, locations!inner(owner_id)')
        .eq('locations.owner_id', uid)
        .eq('queue_date', todayStr)
        .order('ticket_number')
        .then(({ data }) => setQueueTickets(data || [])),
    ];

    Promise.all(promises).finally(() => setLoading(false));
  }, [user]);

  // Queue helpers
  const queueWaiting = queueTickets.filter(t => t.status === 'waiting');
  const queueServing = queueTickets.find(t => t.status === 'serving');
  const queueDone = queueTickets.filter(t => t.status === 'completed').length;
  const queueSkipped = queueTickets.filter(t => t.status === 'skipped').length;

  const handleNextInQueue = async () => {
    if (!locations.length) return;
    // Complete current serving
    if (queueServing) {
      await supabase.from('queue_tickets').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', queueServing.id);
    }
    // Call next waiting
    const next = queueWaiting[0];
    if (next) {
      await supabase.from('queue_tickets').update({ status: 'serving', called_at: new Date().toISOString() }).eq('id', next.id);
    }
    // Reload
    const { data } = await supabase.from('queue_tickets').select('*, locations!inner(owner_id)')
      .eq('locations.owner_id', user!.id)
      .eq('queue_date', todayStr)
      .order('ticket_number');
    setQueueTickets(data || []);
  };

  // Revenue today
  const todayRevenue = todayAppointments
    .filter(a => ['confirmed', 'completed'].includes(a.status))
    .reduce((s, a) => s + (a.services?.price || 0), 0);

  const todayBookingsCount = todayAppointments.length;
  const companyName = locations[0]?.name || 'Мой бизнес';

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    confirmed: 'bg-primary/20 text-primary',
    completed: 'bg-emerald-500/20 text-emerald-400',
    cancelled: 'bg-destructive/20 text-destructive',
  };
  const statusLabels: Record<string, string> = {
    pending: 'Ожидает',
    confirmed: 'Подтв.',
    completed: 'Завершён',
    cancelled: 'Отменён',
  };

  if (todayAppointments.length === 0 && locations.length === 0 && loading) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, #f5e6ee 0%, #e8ecf7 50%, #e0e8f5 100%)' }}>
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </main>
        </div>
      </div>
    );
  }

  const glassCard = "bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(31,38,135,0.08)]";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, #f5e6ee 0%, #e8ecf7 50%, #e0e8f5 100%)' }}>
      {/* ─── Sidebar ─── */}
      <aside className="w-[240px] flex-shrink-0 border-r border-white/40 flex flex-col bg-white/50 backdrop-blur-xl">
        {/* Logo + company */}
        <div className="p-5 border-b border-slate-200/60">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl font-bold font-display text-primary">TutGo</span>
            <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">PRO</span>
          </div>
          <p className="text-sm text-slate-900 font-medium truncate">{companyName}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-slate-500">Онлайн</span>
          </div>
        </div>

        {/* Nav */}
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
                    : 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-slate-200/60">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={() => locations[0] && navigate(`/service/${locations[0].id}`)}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Смотреть страницу
          </Button>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/40 backdrop-blur-xl flex-shrink-0 bg-white/40">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-900">Дашборд</h1>
            <span className="text-sm text-slate-500">{format(today, 'd MMMM yyyy', { locale: ru })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="text-xs">Сегодня</Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')}>
              <Bell className="w-4.5 h-4.5" />
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => navigate('/partner/bookings')}>
              <Plus className="w-4 h-4" />
              Новая запись
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Subscription banner */}
          {isEarlyAdopter && daysLeft !== null && daysLeft > 3 && (
            <div className="rounded-xl bg-green-600/15 border border-green-600/30 p-3">
              <p className="text-sm font-semibold text-green-600">⭐ Ранний доступ — Pro бесплатно ещё {daysLeft} дней</p>
              <p className="text-[11px] text-green-600/70 mt-0.5">Вы среди первых партнёров TutGo</p>
            </div>
          )}
          {isEarlyAdopter && daysLeft !== null && daysLeft > 0 && daysLeft <= 3 && (
            <div className="rounded-xl bg-orange-500/15 border border-orange-500/30 p-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-orange-600">⚠️ Pro заканчивается через {daysLeft} дня</p>
              <a href="https://t.me/tutgo_support" target="_blank" rel="noopener noreferrer"
                className="px-3 py-1 rounded-lg bg-orange-500 text-white text-xs font-bold shrink-0">
                Продлить
              </a>
            </div>
          )}
          {((isEarlyAdopter && daysLeft === 0) || (plan === 'free' && isEarlyAdopter)) && (
            <div className="rounded-xl bg-primary/15 border border-primary/30 p-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-primary">Ваш пробный период закончился</p>
              <a href="https://t.me/tutgo_support" target="_blank" rel="noopener noreferrer"
                className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold shrink-0">
                Подключить Pro
              </a>
            </div>
          )}

          {/* Row 1: Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: Wallet, label: 'Доход сегодня', value: todayRevenue.toLocaleString('ru-RU') + ' сум', color: 'text-primary' },
              { icon: Calendar, label: 'Записей сегодня', value: String(todayBookingsCount), color: 'text-blue-400' },
              { icon: Users, label: 'Клиентов всего', value: String(totalClients), color: 'text-purple-400' },
              { icon: Star, label: 'Рейтинг', value: avgRating ? `${avgRating} ⭐` : '—', color: 'text-yellow-400' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={glassCard}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-slate-100/80 flex items-center justify-center`}>
                        <s.icon className={`w-5 h-5 ${s.color}`} />
                      </div>
                      <TrendingUp className="w-4 h-4 text-slate-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Row 2: Chart + Queue */}
          <div className="grid grid-cols-3 gap-4">
            {/* Revenue chart */}
            <Card className={`col-span-2 ${glassCard}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-900">Доход за 7 дней</CardTitle>
              </CardHeader>
              <CardContent className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weekRevenue}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 72%, 29%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142, 72%, 29%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(220, 15%, 8%)', border: '1px solid hsl(220, 12%, 16%)', borderRadius: 12, color: '#fff', fontSize: 12 }}
                      formatter={(v: number) => [`${v.toLocaleString('ru-RU')} сум`, 'Доход']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(142, 72%, 29%)" fill="url(#revenueGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Queue widget */}
            <Card className={glassCard}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" />
                  Живая очередь
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-3">
                  <p className="text-[11px] text-slate-500 mb-1">Сейчас обслуживается</p>
                  <p className="text-4xl font-bold text-primary font-display">
                    {queueServing ? `№${queueServing.ticket_number}` : '—'}
                  </p>
                  {queueServing && (
                    <p className="text-xs text-slate-500 mt-1">{queueServing.client_name}</p>
                  )}
                </div>

                <Button className="w-full gap-2" onClick={handleNextInQueue} disabled={!queueWaiting.length}>
                  <ChevronRight className="w-4 h-4" />
                  Следующий ({queueWaiting.length})
                </Button>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-100/80 rounded-lg p-2">
                    <p className="text-lg font-bold text-slate-900">{queueDone}</p>
                    <p className="text-[10px] text-slate-500">Обслужено</p>
                  </div>
                  <div className="bg-slate-100/80 rounded-lg p-2">
                    <p className="text-lg font-bold text-slate-900">{queueSkipped}</p>
                    <p className="text-[10px] text-slate-500">Пропущено</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Instagram AI bot connection */}
          <InstagramConnectCard />

          {/* Row 3: Today's appointments + Top clients */}
          <div className="grid grid-cols-3 gap-4">
            {/* Appointments */}
            <Card className={`col-span-2 ${glassCard}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Ближайшие записи
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todayAppointments.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">Нет записей на сегодня</p>
                ) : (
                  <div className="space-y-2 max-h-[260px] overflow-y-auto">
                    {todayAppointments.slice(0, 8).map((appt) => (
                      <div key={appt.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-100/70 hover:bg-slate-100/70 transition-colors">
                        <div className="w-10 text-center">
                          <p className="text-sm font-bold text-slate-900">{format(new Date(appt.start_time), 'HH:mm')}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{appt.client_name || 'Клиент'}</p>
                          <p className="text-xs text-slate-500 truncate">{appt.services?.name || 'Услуга'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-slate-900">{appt.services?.price?.toLocaleString('ru-RU')} {appt.services?.currency}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[appt.status] || 'bg-slate-100/80 text-slate-500'}`}>
                            {statusLabels[appt.status] || appt.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top clients */}
            <Card className={glassCard}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  Топ клиенты
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topClients.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">Пока нет данных</p>
                ) : (
                  <div className="space-y-2">
                    {topClients.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-100/70">
                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{c.name}</p>
                          <p className="text-[11px] text-slate-500">{c.count} визит(ов)</p>
                        </div>
                        <p className="text-xs font-semibold text-slate-900">{c.total.toLocaleString('ru-RU')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PartnerDashboardDesktop;
