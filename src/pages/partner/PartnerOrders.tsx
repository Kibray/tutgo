import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/types';
import PartnerLayout from '@/components/partner/PartnerLayout';

const statusConfig: Record<string, { label: string; color: string; next: string | null; nextLabel: string }> = {
  new: { label: '🆕 Новый', color: 'bg-blue-500/15 text-blue-400 ring-blue-500/30', next: 'preparing', nextLabel: '🔄 Готовим' },
  preparing: { label: '🔄 Готовим', color: 'bg-amber-500/15 text-amber-400 ring-amber-500/30', next: 'ready', nextLabel: '✅ Готово' },
  ready: { label: '✅ Готово', color: 'bg-green-500/15 text-green-400 ring-green-500/30', next: 'served', nextLabel: '🍽️ Подано' },
  served: { label: '🍽️ Подано', color: 'bg-purple-500/15 text-purple-400 ring-purple-500/30', next: null, nextLabel: '' },
  paid: { label: '💰 Оплачен', color: 'bg-muted text-muted-foreground', next: null, nextLabel: '' },
};

const PartnerOrders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: loc } = await supabase.from('locations').select('id').eq('owner_id', user.id).eq('business_type', 'cafe').limit(1).single();
      if (loc) {
        setLocationId(loc.id);
        const { data } = await supabase
          .from('cafe_orders')
          .select('*')
          .eq('location_id', loc.id)
          .in('status', ['new', 'preparing', 'ready', 'served'])
          .order('created_at', { ascending: true });
        setOrders(data || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  // Realtime
  useEffect(() => {
    if (!locationId) return;
    const channel = supabase
      .channel(`kitchen-orders-${locationId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'cafe_orders',
        filter: `location_id=eq.${locationId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [...prev, payload.new]);
          if (soundEnabled) {
            try { new Audio('data:audio/wav;base64,UklGRl9vT19teleXlhEAIAABACAAIAAgBAAEABAADAAIAAgACAAIAAAA').play().catch(() => {}); } catch {}
          }
          toast({ title: '🆕 Новый заказ!', description: `Столик №${(payload.new as any).table_number}` });
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === (payload.new as any).id ? payload.new : o).filter((o: any) => o.status !== 'paid'));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [locationId, soundEnabled]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'served') updates.served_at = new Date().toISOString();
    await supabase.from('cafe_orders').update(updates).eq('id', orderId);
  };

  const getElapsed = (createdAt: string) => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    return diff;
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Загрузка...</div>;

  const activeOrders = orders.filter(o => ['new', 'preparing', 'ready', 'served'].includes(o.status));

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-20 glass-strong px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/partner')} className="w-8 h-8 glass rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <h1 className="text-base font-bold text-foreground">🍳 Кухня</h1>
          <span className="text-xs text-muted-foreground">{activeOrders.length} активных</span>
        </div>
        <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 glass rounded-lg">
          {soundEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>

      <div className="px-4 mt-3 space-y-3">
        {activeOrders.length === 0 && (
          <div className="text-center py-16 space-y-2">
            <p className="text-4xl">🍽️</p>
            <p className="text-sm text-muted-foreground">Нет активных заказов</p>
          </div>
        )}

        {activeOrders.map(order => {
          const config = statusConfig[order.status] || statusConfig.new;
          const elapsed = getElapsed(order.created_at);
          const isLate = elapsed >= 15 && order.status !== 'served';
          const items = (order.items || []) as any[];
          const orderId = order.id?.slice(-4).toUpperCase();

          return (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`glass rounded-xl p-4 space-y-3 ${isLate ? 'ring-2 ring-destructive/50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">🪑 Столик №{order.table_number}</span>
                  <span className="text-[10px] text-muted-foreground">#{orderId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] flex items-center gap-1 ${isLate ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                    <Clock className="w-3 h-3" />{elapsed} мин
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ring-1 ${config.color}`}>{config.label}</span>
                </div>
              </div>

              <div className="space-y-1">
                {items.map((item: any, i: number) => (
                  <div key={i} className="text-xs text-foreground">
                    {item.name} x{item.quantity}
                    {item.modifiers?.length > 0 && (
                      <span className="text-muted-foreground"> ({item.modifiers.map((m: any) => m.option).join(', ')})</span>
                    )}
                  </div>
                ))}
                {order.notes && <p className="text-[10px] text-muted-foreground italic">💬 {order.notes}</p>}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-primary">{formatPrice(order.final_amount || order.total_amount)} {order.currency}</span>
                {config.next && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleStatusChange(order.id, config.next!)}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                  >
                    {config.nextLabel}
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <PartnerBottomNav />
    </div>
  );
};

export default PartnerOrders;
