import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface Props {
  order: any;
  currency: string;
  onClose: () => void;
  onPaid: () => void;
}

const paymentMethods = [
  { id: 'cash', label: 'Наличные', icon: '💵', color: 'bg-green-500/15 text-green-400' },
  { id: 'card', label: 'Карта', icon: '💳', color: 'bg-blue-500/15 text-blue-400' },
];

const CafePayment = ({ order, currency, onClose, onPaid }: Props) => {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    if (!selected) return;
    setProcessing(true);

    const { error } = await supabase
      .from('cafe_orders')
      .update({
        payment_method: selected,
        status: 'paid',
        paid_at: new Date().toISOString(),
      } as any)
      .eq('id', order.id);

    setProcessing(false);
    if (error) {
      toast({ title: 'Ошибка оплаты', variant: 'destructive' });
    } else {
      const tg = (window as any).Telegram?.WebApp;
      tg?.HapticFeedback?.notificationOccurred('success');
      toast({ title: '✅ Оплата принята!' });
      onPaid();
    }
  };

  const orderId = order.id?.slice(-4).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl p-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-foreground">Способ оплаты #{orderId}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Выберите — официант проведёт оплату</p>
          </div>
          <button onClick={onClose} className="p-1"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="text-center mb-6">
          <span className="text-3xl font-bold text-foreground">{formatPrice(order.final_amount || order.total_amount)}</span>
          <span className="text-lg text-muted-foreground ml-1">{currency}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {paymentMethods.map(pm => (
            <motion.button
              key={pm.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelected(pm.id)}
              className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                selected === pm.id ? 'ring-2 ring-primary bg-primary/10' : 'glass'
              }`}
            >
              <span className="text-2xl">{pm.icon}</span>
              <span className="text-sm font-medium text-foreground">{pm.label}</span>
            </motion.button>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handlePay}
          disabled={!selected || processing}
          className={`w-full py-3.5 rounded-lg font-semibold text-sm transition-all ${
            selected && !processing ? 'bg-primary text-primary-foreground glow-green' : 'bg-muted text-muted-foreground'
          }`}
        >
          {processing ? 'Обработка...' : 'Подтвердить оплату'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default CafePayment;
