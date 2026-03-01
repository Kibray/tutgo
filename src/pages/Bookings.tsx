import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/types';

const Bookings = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from('appointments')
        .select('*, locations(*), services(*), staff(*)')
        .eq('client_user_id', user.id)
        .order('start_time', { ascending: true });
      setAppointments(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const upcoming = appointments.filter(a => new Date(a.start_time) >= new Date() && a.status !== 'cancelled');
  const past = appointments.filter(a => new Date(a.start_time) < new Date() || a.status === 'completed');

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <h1 className="text-lg font-bold font-display text-foreground mb-1">Мои записи</h1>
        <p className="text-xs text-muted-foreground mb-6">Управляйте бронированиями</p>

        <h2 className="text-sm font-semibold text-foreground mb-3">Предстоящие</h2>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Загрузка...</div>
        ) : upcoming.length === 0 ? (
          <div className="glass rounded-lg p-6 text-center mb-6">
            <p className="text-xs text-muted-foreground">Нет предстоящих записей</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {upcoming.map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="glass rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{b.services?.name || b.locations?.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{b.locations?.name}</p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-primary/15 text-primary capitalize">{b.status}</span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(b.start_time).toLocaleDateString('ru', { month: 'short', day: 'numeric' })}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(b.start_time).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.locations?.city}</span>
                </div>
                {b.services?.price > 0 && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-sm font-bold text-gradient-green">{formatPrice(b.services.price)} {b.services.currency}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        <h2 className="text-sm font-semibold text-foreground mb-3">Прошедшие</h2>
        {past.length === 0 ? (
          <div className="glass rounded-lg p-6 text-center">
            <p className="text-xs text-muted-foreground">Прошедших записей пока нет</p>
          </div>
        ) : (
          <div className="space-y-3">
            {past.map((b) => (
              <div key={b.id} className="glass rounded-lg p-4 opacity-60">
                <h3 className="text-sm font-semibold text-foreground">{b.services?.name || b.locations?.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{new Date(b.start_time).toLocaleDateString('ru')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Bookings;
