import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Hash, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface QueueStatusProps {
  locationId: string;
  locationName: string;
}

const QueueStatus = ({ locationId, locationName }: QueueStatusProps) => {
  const { user } = useAuth();
  const [myTicket, setMyTicket] = useState<any>(null);
  const [stats, setStats] = useState<{ waiting_count: number; current_serving: number | null; last_ticket: number }>({ waiting_count: 0, current_serving: null, last_ticket: 0 });
  const [taking, setTaking] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const loadStats = async () => {
    const { data } = await supabase.rpc('get_queue_stats', { p_location_id: locationId, p_date: today });
    if (data) setStats(data as any);
  };

  const loadMyTicket = async () => {
    if (!user) { setMyTicket(null); return; }
    const { data } = await supabase.from('queue_tickets')
      .select('*')
      .eq('location_id', locationId)
      .eq('queue_date', today)
      .eq('user_id', user.id)
      .in('status', ['waiting', 'serving'])
      .limit(1)
      .maybeSingle();
    setMyTicket(data);
  };

  const reload = () => { loadStats(); loadMyTicket(); };

  useEffect(() => { reload(); }, [locationId, user]);

  useEffect(() => {
    const channel = supabase.channel(`queue-client-${locationId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'queue_tickets',
        filter: `location_id=eq.${locationId}`,
      }, () => reload())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [locationId]);

  const waitingCount = stats.waiting_count;
  const currentServingNum = stats.current_serving;
  const lastTicketNum = stats.last_ticket;

  const handleTakeTicket = async () => {
    if (!user) { toast.error('Войдите чтобы взять талон'); return; }
    if (myTicket) { toast.info('У вас уже есть талон'); return; }

    setTaking(true);
    const newNum = lastTicketNum + 1;

    // Get user display name
    const { data: profile } = await supabase.from('profiles')
      .select('display_name').eq('user_id', user.id).single();

    const { data, error } = await supabase.from('queue_tickets').insert({
      location_id: locationId,
      ticket_number: newNum,
      user_id: user.id,
      client_name: profile?.display_name || 'Клиент',
      queue_date: today,
    }).select().single();

    setTaking(false);
    if (error) { toast.error('Ошибка: ' + error.message); return; }

    toast.success(`Вы взяли талон №${newNum}`);

    // Send Telegram notification
    try {
      const { data: prof } = await supabase.from('profiles')
        .select('telegram_chat_id').eq('user_id', user.id).single();
      if (prof?.telegram_chat_id) {
        await supabase.functions.invoke('telegram-notify', {
          body: {
            type: 'queue.notify',
            chatId: prof.telegram_chat_id,
            text: `🎫 <b>Вы взяли талон №${newNum}</b>\n📍 ${locationName}\n👥 Перед вами: ${waitingCount} чел.\n⏰ Примерное ожидание: ~${waitingCount * 10} мин`,
          },
        });
      }
    } catch {}
  };

  const handleCancel = async () => {
    if (!myTicket) return;
    await supabase.from('queue_tickets').update({ status: 'cancelled' }).eq('id', myTicket.id);
    setMyTicket(null);
    toast('Талон отменён');
  };

  const peopleAhead = myTicket && currentServingNum ? myTicket.ticket_number - currentServingNum - 1 : waitingCount;

  return (
    <div className="glass rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
          <Hash className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Живая очередь</h3>
          <p className="text-[10px] text-muted-foreground">Обновляется в реальном времени</p>
        </div>
      </div>

      {/* Current status */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-primary">
            {currentServingNum ? `№${currentServingNum}` : '—'}
          </p>
          <p className="text-[10px] text-muted-foreground">Вызывают</p>
        </div>
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-foreground">{waitingCount}</p>
          <p className="text-[10px] text-muted-foreground">В очереди</p>
        </div>
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-foreground">~{waitingCount * 10}</p>
          <p className="text-[10px] text-muted-foreground">мин</p>
        </div>
      </div>

      {/* My ticket */}
      {myTicket ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center"
        >
          <p className="text-xs text-muted-foreground mb-1">Ваш талон</p>
          <p className="text-3xl font-bold text-primary font-display">№{myTicket.ticket_number}</p>
          {myTicket.status === 'serving' ? (
            <p className="text-sm font-semibold text-primary mt-2">🔔 Вас вызывают! Подойдите</p>
          ) : (
            <>
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Впереди: {peopleAhead}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~{peopleAhead * 10} мин</span>
              </div>
              {peopleAhead <= 1 && peopleAhead >= 0 && (
                <p className="text-xs font-medium text-primary mt-2">⚡ Вы следующий! Готовьтесь</p>
              )}
            </>
          )}
          <Button variant="ghost" size="sm" onClick={handleCancel} className="mt-3 text-xs text-destructive">
            Отменить талон
          </Button>
        </motion.div>
      ) : (
        <Button onClick={handleTakeTicket} disabled={taking} className="w-full gap-2">
          <Hash className="w-4 h-4" />
          {taking ? 'Выдаём талон...' : 'Взять талон'}
        </Button>
      )}
    </div>
  );
};

export default QueueStatus;
