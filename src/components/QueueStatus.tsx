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
  const [tickets, setTickets] = useState<any[]>([]);
  const [myTicket, setMyTicket] = useState<any>(null);
  const [taking, setTaking] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const loadTickets = async () => {
    const { data } = await supabase.from('queue_tickets')
      .select('*')
      .eq('location_id', locationId)
      .eq('queue_date', today)
      .order('ticket_number', { ascending: true });
    const all = data || [];
    setTickets(all);
    if (user) {
      const mine = all.find(t => t.user_id === user.id && ['waiting', 'serving'].includes(t.status));
      setMyTicket(mine || null);
    }
  };

  useEffect(() => { loadTickets(); }, [locationId, user]);

  // Realtime
  useEffect(() => {
    const channel = supabase.channel(`queue-client-${locationId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'queue_tickets',
        filter: `location_id=eq.${locationId}`,
      }, () => loadTickets())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [locationId]);

  const waiting = tickets.filter(t => t.status === 'waiting');
  const currentServing = tickets.find(t => t.status === 'serving');
  const lastTicketNum = tickets.length > 0 ? Math.max(...tickets.map(t => t.ticket_number)) : 0;

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
            text: `🎫 <b>Вы взяли талон №${newNum}</b>\n📍 ${locationName}\n👥 Перед вами: ${waiting.length} чел.\n⏰ Примерное ожидание: ~${waiting.length * 10} мин`,
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

  const myPosition = myTicket ? waiting.findIndex(t => t.id === myTicket.id) : -1;
  const peopleAhead = myPosition >= 0 ? myPosition : waiting.length;

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
            {currentServing ? `№${currentServing.ticket_number}` : '—'}
          </p>
          <p className="text-[10px] text-muted-foreground">Вызывают</p>
        </div>
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-foreground">{waiting.length}</p>
          <p className="text-[10px] text-muted-foreground">В очереди</p>
        </div>
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-foreground">~{waiting.length * 10}</p>
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
