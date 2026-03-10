import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/types';
import type { CartItem } from '@/hooks/useCart';
import DateChip from '@/components/DateChip';

interface Props {
  locationId: string;
  locationName: string;
  currency: string;
  cartItems: CartItem[];
  cartTotal: number;
}

const timeSlots = (() => {
  const slots: string[] = [];
  for (let h = 10; h <= 22; h++) {
    for (const m of ['00', '30']) {
      slots.push(`${h.toString().padStart(2, '0')}:${m}`);
    }
  }
  return slots;
})();

const ReservationTab = ({ locationId, locationName, currency, cartItems, cartTotal }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [guests, setGuests] = useState(2);
  const [notes, setNotes] = useState('');
  const [includePreorder, setIncludePreorder] = useState(cartItems.length > 0);
  const [submitting, setSubmitting] = useState(false);

  const dates = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; }),
  []);

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: 'Войдите в аккаунт', description: 'Для бронирования нужна авторизация', variant: 'destructive' });
      return;
    }
    if (!selectedTime) {
      toast({ title: 'Выберите время', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred('medium');

    const { data: profile } = await supabase.from('profiles').select('display_name, phone').eq('user_id', user.id).single();

    const date = dates[selectedDate];
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

    const preOrder = includePreorder ? cartItems.map(i => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      modifiers: i.modifiers,
    })) : [];

    const { error } = await supabase.from('table_reservations').insert({
      location_id: locationId,
      client_id: user.id,
      client_name: profile?.display_name || 'Гость',
      client_phone: profile?.phone || null,
      date: dateStr,
      time: selectedTime,
      guests_count: guests,
      pre_order: preOrder,
      total_amount: includePreorder ? cartTotal : 0,
      currency,
      notes: notes || null,
      status: 'pending',
    } as any);

    setSubmitting(false);
    if (error) {
      toast({ title: 'Ошибка бронирования', description: 'Попробуйте позже', variant: 'destructive' });
    } else {
      toast({ title: '✅ Столик забронирован!', description: `${locationName} · ${dateStr} в ${selectedTime}` });
      tg?.HapticFeedback?.notificationOccurred('success');
      setSelectedTime(null);
      setNotes('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Guests */}
      <div className="glass rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />Количество гостей
        </h3>
        <div className="flex items-center gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <button
              key={n}
              onClick={() => setGuests(n)}
              className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                guests === n ? 'bg-primary text-primary-foreground' : 'glass text-foreground'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">📅 Дата</h3>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
          {dates.map((date, i) => <DateChip key={i} date={date} active={selectedDate === i} onClick={() => setSelectedDate(i)} />)}
        </div>
      </div>

      {/* Time */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">⏰ Время</h3>
        <div className="grid grid-cols-4 gap-2">
          {timeSlots.map(slot => (
            <motion.button
              key={slot}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedTime(slot)}
              className={`py-2.5 rounded-md text-xs font-medium transition-colors ${
                selectedTime === slot ? 'bg-primary text-primary-foreground glow-green-sm' : 'glass text-foreground'
              }`}
            >
              {slot}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Pre-order from cart */}
      {cartItems.length > 0 && (
        <div className="glass rounded-lg p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includePreorder}
              onChange={e => setIncludePreorder(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-primary"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Включить предзаказ из корзины</p>
              <p className="text-xs text-muted-foreground">{cartItems.length} блюд · {formatPrice(cartTotal)} {currency}</p>
            </div>
          </label>
        </div>
      )}

      {/* Notes */}
      <div className="glass rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />Комментарий
        </h3>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Особые пожелания, день рождения, аллергии..."
          className="w-full bg-secondary rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none h-20 border-none outline-none"
        />
      </div>

      {/* Summary */}
      {selectedTime && (
        <div className="glass rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">📋 Итого</h3>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Дата</span>
              <span className="text-foreground">{dates[selectedDate].toLocaleDateString('ru', { day: 'numeric', month: 'long' })}</span>
            </div>
            <div className="flex justify-between">
              <span>Время</span>
              <span className="text-foreground">{selectedTime}</span>
            </div>
            <div className="flex justify-between">
              <span>Гостей</span>
              <span className="text-foreground">{guests}</span>
            </div>
            {includePreorder && cartTotal > 0 && (
              <div className="flex justify-between pt-1 border-t border-border">
                <span>Предзаказ</span>
                <span className="text-primary font-bold">{formatPrice(cartTotal)} {currency}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={!selectedTime || submitting}
        className={`w-full py-3.5 rounded-lg font-semibold text-sm transition-all ${
          selectedTime && !submitting ? 'bg-primary text-primary-foreground glow-green' : 'bg-muted text-muted-foreground cursor-not-allowed'
        }`}
      >
        {submitting ? 'Бронирую...' : '🍽️ Забронировать столик'}
      </motion.button>
    </div>
  );
};

export default ReservationTab;
