import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, SkipForward, Play, Trash2, Users, Hash, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import PartnerBottomNav from '@/components/partner/PartnerBottomNav';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PartnerQueue = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<string>('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('locations').select('id, name, queue_enabled')
      .eq('owner_id', user.id).eq('queue_enabled', true)
      .then(({ data }) => {
        setBusinesses(data || []);
        if (data?.length) setSelectedBiz(data[0].id);
        setLoading(false);
      });
  }, [user]);

  const today = new Date().toISOString().split('T')[0];

  const loadTickets = async () => {
    if (!selectedBiz) return;
    const { data } = await supabase.from('queue_tickets')
      .select('*')
      .eq('location_id', selectedBiz)
      .eq('queue_date', today)
      .order('ticket_number', { ascending: true });
    setTickets(data || []);
  };

  useEffect(() => { loadTickets(); }, [selectedBiz]);

  // Realtime subscription
  useEffect(() => {
    if (!selectedBiz) return;
    const channel = supabase.channel(`queue-${selectedBiz}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'queue_tickets',
        filter: `location_id=eq.${selectedBiz}`,
      }, () => loadTickets())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedBiz]);

  const waiting = tickets.filter(t => t.status === 'waiting');
  const currentServing = tickets.find(t => t.status === 'serving');

  const handleNext = async () => {
    // Complete current
    if (currentServing) {
      await supabase.from('queue_tickets').update({
        status: 'completed', completed_at: new Date().toISOString(),
      }).eq('id', currentServing.id);
    }
    // Call next waiting
    const next = waiting[0];
    if (next) {
      await supabase.from('queue_tickets').update({
        status: 'serving', called_at: new Date().toISOString(),
      }).eq('id', next.id);

      // Notify via telegram
      notifyQueueClient(next, 'serving');
      // Notify the one after next that they're next
      if (waiting[1]) notifyQueueClient(waiting[1], 'next');

      toast.success(`Вызван талон №${next.ticket_number}`);
    } else {
      toast.info('Очередь пуста');
    }
  };

  const handleSkip = async () => {
    if (currentServing) {
      await supabase.from('queue_tickets').update({
        status: 'skipped', completed_at: new Date().toISOString(),
      }).eq('id', currentServing.id);
      toast('Клиент пропущен');
      // Auto-call next
      handleNext();
    }
  };

  const handleReset = async () => {
    if (!confirm('Сбросить очередь за сегодня?')) return;
    await supabase.from('queue_tickets').delete()
      .eq('location_id', selectedBiz).eq('queue_date', today);
    setTickets([]);
    toast.success('Очередь сброшена');
  };

  const notifyQueueClient = async (ticket: any, type: 'serving' | 'next') => {
    if (!ticket.user_id) return;
    try {
      const { data: profile } = await supabase.from('profiles')
        .select('telegram_chat_id').eq('user_id', ticket.user_id).single();
      if (!profile?.telegram_chat_id) return;

      const text = type === 'serving'
        ? `🔔 <b>Ваш талон №${ticket.ticket_number} вызван!</b>\nПожалуйста, подойдите 🏃`
        : `⏰ <b>Вы следующий!</b> Готовьтесь 🦷\nВаш талон: №${ticket.ticket_number}`;

      await supabase.functions.invoke('telegram-notify', {
        body: { type: 'queue.notify', chatId: profile.telegram_chat_id, text },
      });
    } catch {}
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/partner')}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold font-display text-foreground">Живая очередь</h1>
        </div>

        {businesses.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">Очередь не включена</p>
            <p className="text-xs mt-1">Включите «Живая очередь» в профиле компании</p>
            <Button size="sm" className="mt-4" onClick={() => navigate('/partner/settings')}>
              Перейти в настройки
            </Button>
          </div>
        ) : (
          <>
            {businesses.length > 1 && (
              <select value={selectedBiz} onChange={e => setSelectedBiz(e.target.value)}
                className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground mb-4 outline-none">
                {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}

            {/* Current number display */}
            <div className="glass rounded-2xl p-6 text-center mb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Текущий номер</p>
              <div className="text-5xl font-bold text-primary font-display">
                {currentServing ? `№${currentServing.ticket_number}` : '—'}
              </div>
              {currentServing && (
                <p className="text-sm text-muted-foreground mt-2">
                  {currentServing.client_name || 'Клиент'}
                </p>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="glass rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{waiting.length}</p>
                <p className="text-[10px] text-muted-foreground">В очереди</p>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {tickets.filter(t => t.status === 'completed').length}
                </p>
                <p className="text-[10px] text-muted-foreground">Обслужено</p>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {tickets.filter(t => t.status === 'skipped').length}
                </p>
                <p className="text-[10px] text-muted-foreground">Пропущено</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <Button onClick={handleNext} className="gap-1.5 text-xs" size="sm">
                <Play className="w-4 h-4" /> Следующий
              </Button>
              <Button onClick={handleSkip} variant="secondary" className="gap-1.5 text-xs" size="sm"
                disabled={!currentServing}>
                <SkipForward className="w-4 h-4" /> Пропустить
              </Button>
              <Button onClick={handleReset} variant="destructive" className="gap-1.5 text-xs" size="sm">
                <Trash2 className="w-4 h-4" /> Сбросить
              </Button>
            </div>

            {/* Queue list */}
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Очередь на сегодня ({waiting.length})
            </h3>
            <div className="space-y-2">
              {waiting.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  Очередь пуста
                </div>
              )}
              {waiting.map((ticket, i) => (
                <motion.div key={ticket.id} layout
                  className={`glass rounded-xl p-3 flex items-center gap-3 ${i === 0 ? 'ring-1 ring-primary' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">№{ticket.ticket_number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{ticket.client_name || 'Клиент'}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                      {i === 0 && ' · Следующий'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">~{(i + 1) * 10} мин</span>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default PartnerQueue;
