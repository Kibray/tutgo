import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Clock, Users, Building2, BarChart3, Calendar, Diamond } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [applications, setApplications] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [stats, setStats] = useState({ locations: 0, users: 0, appointments: 0, revenue: 0 });
  const [tab, setTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [enterpriseNoteId, setEnterpriseNoteId] = useState<string | null>(null);
  const [enterpriseNote, setEnterpriseNote] = useState('');

  useEffect(() => {
    if (!user) { setAdminChecked(true); return; }
    supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }).then(({ data }) => {
      setIsAdmin(!!data);
      setAdminChecked(true);
    });
  }, [user]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    loadData();
  }, [user, isAdmin]);

  useEffect(() => {
    if (tab === 'subscriptions' && isAdmin) {
      loadSubscriptions();
    }
  }, [tab, isAdmin]);

  const loadData = async () => {
    const { data: apps } = await supabase
      .from('partner_applications')
      .select('*')
      .order('created_at', { ascending: false });
    setApplications(apps || []);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setAllProfiles(profiles || []);

    const { count: locCount } = await supabase.from('locations').select('*', { count: 'exact', head: true });
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: aptCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true });

    setStats({
      locations: locCount || 0,
      users: userCount || 0,
      appointments: aptCount || 0,
      revenue: 0,
    });
  };

  const loadSubscriptions = async () => {
    setSubLoading(true);
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (subs && subs.length > 0) {
      const userIds = subs.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, phone')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      setSubscriptions(subs.map(s => ({
        ...s,
        display_name: profileMap.get(s.user_id)?.display_name || 'Партнёр',
        phone: profileMap.get(s.user_id)?.phone || '—',
      })));
    } else {
      setSubscriptions([]);
    }
    setSubLoading(false);
  };

  const handleSubAction = async (userId: string, plan: string, trialDays?: number, notes?: string) => {
    setActionLoading(userId);
    try {
      const update: any = { plan, updated_at: new Date().toISOString() };
      if (plan === 'pro' && trialDays) {
        update.trial_ends_at = new Date(Date.now() + trialDays * 86400000).toISOString();
        update.current_period_end = update.trial_ends_at;
      }
      if (plan === 'free') {
        update.trial_ends_at = null;
        update.current_period_end = null;
      }
      if (plan === 'enterprise' && notes !== undefined) {
        update.notes = notes;
      }
      await supabase.from('subscriptions').update(update).eq('user_id', userId);
      toast({ title: `План изменён на ${plan}` });
      setEnterpriseNoteId(null);
      setEnterpriseNote('');
      loadSubscriptions();
    } catch (err: any) {
      toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = async (appId: string, action: 'approved' | 'rejected') => {
    setActionLoading(appId);
    try {
      const app = applications.find(a => a.id === appId);
      if (!app) return;

      await supabase
        .from('partner_applications')
        .update({ status: action })
        .eq('id', appId);

      if (action === 'approved') {
        const { data: locations } = await supabase
          .from('locations')
          .select('id')
          .eq('owner_id', app.user_id)
          .eq('name', app.company_name);

        if (locations && locations.length > 0) {
          await supabase
            .from('locations')
            .update({ verified: true })
            .eq('id', locations[0].id);
        }

        await supabase.from('notifications').insert({
          user_id: app.user_id,
          title: '🎉 Компания подтверждена!',
          body: `Ваша компания "${app.company_name}" подтверждена на TutGo!`,
          type: 'info',
        });

        const { data: profile } = await supabase
          .from('profiles')
          .select('telegram_chat_id')
          .eq('user_id', app.user_id)
          .single();

        if (profile?.telegram_chat_id) {
          await supabase.functions.invoke('telegram-notify', {
            body: {
              type: 'queue.notify',
              chatId: profile.telegram_chat_id,
              text: `🎉 <b>Ваша компания подтверждена на TutGo!</b>\n\n🏢 ${app.company_name}\n\nТеперь клиенты могут найти вас на tutgo.uz`,
            },
          });
        }
      } else {
        await supabase.from('notifications').insert({
          user_id: app.user_id,
          title: '❌ Заявка отклонена',
          body: 'К сожалению ваша заявка не прошла проверку. Напишите нам: info@tutgo.uz',
          type: 'info',
        });

        const { data: locations } = await supabase
          .from('locations')
          .select('id')
          .eq('owner_id', app.user_id)
          .eq('name', app.company_name);

        if (locations && locations.length > 0) {
          await supabase
            .from('locations')
            .update({ verified: false, is_promoted: false })
            .eq('id', locations[0].id);
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('telegram_chat_id')
          .eq('user_id', app.user_id)
          .single();

        if (profile?.telegram_chat_id) {
          await supabase.functions.invoke('telegram-notify', {
            body: {
              type: 'queue.notify',
              chatId: profile.telegram_chat_id,
              text: `❌ <b>К сожалению ваша заявка не прошла проверку.</b>\n\nНапишите нам: info@tutgo.uz`,
            },
          });
        }
      }

      toast({ title: action === 'approved' ? '✅ Одобрено' : '❌ Заблокировано' });
      loadData();
    } catch (err: any) {
      toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || !adminChecked) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Загрузка...</div>;

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <h1 className="text-lg font-bold text-foreground mb-2">🔒 Доступ запрещён</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">Эта страница доступна только администратору</p>
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate('/')}
          className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
          На главную
        </motion.button>
      </div>
    );
  }

  const pending = applications.filter(a => a.status === 'pending');
  const approved = applications.filter(a => a.status === 'approved');
  const rejected = applications.filter(a => a.status === 'rejected');

  const now = new Date();
  const totalPartners = subscriptions.length;
  const activePro = subscriptions.filter(s => s.plan === 'pro' && (!s.trial_ends_at || new Date(s.trial_ends_at) > now)).length;
  const expired = subscriptions.filter(s => s.trial_ends_at && new Date(s.trial_ends_at) < now).length;

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold font-display text-foreground">🛡️ Админ-панель</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Building2, label: 'Компании', value: stats.locations, color: 'text-primary' },
            { icon: Users, label: 'Пользователи', value: stats.users, color: 'text-blue-500' },
            { icon: Calendar, label: 'Записи', value: stats.appointments, color: 'text-green-500' },
            { icon: Clock, label: 'На проверке', value: pending.length, color: 'text-yellow-500' },
          ].map((s, i) => (
            <div key={i} className="glass rounded-xl p-4 flex flex-col items-center gap-2">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full grid grid-cols-5 mb-4">
            <TabsTrigger value="pending" className="text-xs">
              📋 Заявки {pending.length > 0 && `(${pending.length})`}
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs">✅ Партнёры</TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs">❌ Блок</TabsTrigger>
            <TabsTrigger value="users" className="text-xs">👥 Юзеры</TabsTrigger>
            <TabsTrigger value="subscriptions" className="text-xs">💎 Подписки</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <ApplicationList apps={pending} onAction={handleAction} actionLoading={actionLoading} showActions />
          </TabsContent>
          <TabsContent value="approved">
            <ApplicationList apps={approved} onAction={handleAction} actionLoading={actionLoading} />
          </TabsContent>
          <TabsContent value="rejected">
            <ApplicationList apps={rejected} onAction={handleAction} actionLoading={actionLoading} />
          </TabsContent>
          <TabsContent value="users">
            <div className="space-y-2">
              {allProfiles.map(p => (
                <div key={p.id} className="glass rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.display_name || 'Пользователь'}</p>
                    <p className="text-[10px] text-muted-foreground">{p.phone || '—'} · {new Date(p.created_at).toLocaleDateString('ru-RU')}</p>
                  </div>
                  {p.telegram_chat_id && <Badge variant="secondary" className="text-[9px]">TG</Badge>}
                </div>
              ))}
              {allProfiles.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Нет пользователей</p>}
            </div>
          </TabsContent>
          <TabsContent value="subscriptions">
            {/* Counters */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="glass rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-foreground">{totalPartners}</p>
                <p className="text-[10px] text-muted-foreground">Всего</p>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-green-500">{activePro}</p>
                <p className="text-[10px] text-muted-foreground">Активных Pro</p>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-red-500">{expired}</p>
                <p className="text-[10px] text-muted-foreground">Истёкших</p>
              </div>
            </div>

            {subLoading ? (
              <p className="text-center text-sm text-muted-foreground py-8">Загрузка...</p>
            ) : subscriptions.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Нет подписок</p>
            ) : (
              <div className="space-y-3">
                {subscriptions.map(sub => {
                  const trialDate = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null;
                  const isExpired = trialDate && trialDate < now;

                  return (
                    <div key={sub.id} className="glass rounded-xl p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-foreground">{sub.display_name}</p>
                          <p className="text-[10px] text-muted-foreground">{sub.phone}</p>
                        </div>
                        <div className="flex gap-1 flex-wrap justify-end">
                          <Badge
                            variant={sub.plan === 'pro' ? 'default' : sub.plan === 'enterprise' ? 'default' : 'secondary'}
                            className={
                              sub.plan === 'pro' ? 'bg-green-600 text-white' :
                              sub.plan === 'enterprise' ? 'bg-yellow-500 text-black' : ''
                            }
                          >
                            {sub.plan.toUpperCase()}
                          </Badge>
                          {sub.is_early_adopter && (
                            <Badge variant="secondary" className="text-[9px]">⭐ Ранний доступ</Badge>
                          )}
                        </div>
                      </div>

                      {trialDate && (
                        <p className={`text-xs ${isExpired ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {isExpired
                            ? `Истёк ${trialDate.toLocaleDateString('ru-RU')}`
                            : `Pro до ${trialDate.toLocaleDateString('ru-RU')}`
                          }
                        </p>
                      )}

                      {sub.notes && (
                        <p className="text-[10px] text-muted-foreground">📝 {sub.notes}</p>
                      )}

                      {enterpriseNoteId === sub.user_id ? (
                        <div className="flex gap-2 pt-1">
                          <Input
                            value={enterpriseNote}
                            onChange={e => setEnterpriseNote(e.target.value)}
                            placeholder="Заметка..."
                            className="h-8 text-xs flex-1"
                          />
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSubAction(sub.user_id, 'enterprise', undefined, enterpriseNote)}
                            disabled={actionLoading === sub.user_id}
                            className="px-3 py-1 rounded-lg bg-yellow-500 text-black text-xs font-bold disabled:opacity-50"
                          >
                            ОК
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setEnterpriseNoteId(null); setEnterpriseNote(''); }}
                            className="px-3 py-1 rounded-lg bg-muted text-muted-foreground text-xs"
                          >
                            ✕
                          </motion.button>
                        </div>
                      ) : (
                        <div className="flex gap-2 pt-1 flex-wrap">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSubAction(sub.user_id, 'pro', 30)}
                            disabled={actionLoading === sub.user_id}
                            className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-[10px] font-bold disabled:opacity-50"
                          >
                            → Pro (30 дней)
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSubAction(sub.user_id, 'free')}
                            disabled={actionLoading === sub.user_id}
                            className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-[10px] font-bold disabled:opacity-50"
                          >
                            → Free
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setEnterpriseNoteId(sub.user_id); setEnterpriseNote(sub.notes || ''); }}
                            disabled={actionLoading === sub.user_id}
                            className="px-3 py-1.5 rounded-lg bg-yellow-500 text-black text-[10px] font-bold disabled:opacity-50"
                          >
                            → Enterprise
                          </motion.button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const ApplicationList = ({ apps, onAction, actionLoading, showActions }: {
  apps: any[];
  onAction: (id: string, action: 'approved' | 'rejected') => void;
  actionLoading: string | null;
  showActions?: boolean;
}) => {
  if (apps.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-8">Пусто</p>;
  }

  return (
    <div className="space-y-3">
      {apps.map(app => (
        <div key={app.id} className="glass rounded-xl p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">{app.company_name}</p>
              <p className="text-xs text-muted-foreground">{app.category}</p>
            </div>
            <Badge variant={app.status === 'pending' ? 'secondary' : app.status === 'approved' ? 'default' : 'destructive'}>
              {app.status === 'pending' ? '⏳' : app.status === 'approved' ? '✅' : '❌'} {app.status}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>📞 {app.phone}</p>
            <p>📍 {app.address}</p>
            {app.description && <p>📝 {app.description}</p>}
            {app.instagram && <p>📸 {app.instagram}</p>}
            <p>📅 {new Date(app.created_at).toLocaleString('ru-RU')}</p>
          </div>
          {showActions && (
            <div className="flex gap-2 pt-1">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onAction(app.id, 'approved')}
                disabled={actionLoading === app.id}
                className="flex-1 py-2 rounded-lg bg-green-600 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Одобрить
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onAction(app.id, 'rejected')}
                disabled={actionLoading === app.id}
                className="flex-1 py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" /> Блокировать
              </motion.button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Admin;
