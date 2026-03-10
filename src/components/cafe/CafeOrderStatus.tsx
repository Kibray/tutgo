import { motion } from 'framer-motion';
import { Check, Loader2, ChefHat, UtensilsCrossed, CreditCard } from 'lucide-react';
import { formatPrice } from '@/lib/types';

interface Props {
  order: any;
  currency: string;
  onPayClick: () => void;
}

const statusSteps = [
  { key: 'new', label: 'Принят', icon: Check, emoji: '✅' },
  { key: 'preparing', label: 'Готовится', icon: Loader2, emoji: '🔄' },
  { key: 'ready', label: 'Готово', icon: ChefHat, emoji: '✅' },
  { key: 'served', label: 'Подано', icon: UtensilsCrossed, emoji: '🍽️' },
];

const CafeOrderStatus = ({ order, currency, onPayClick }: Props) => {
  const currentIndex = statusSteps.findIndex(s => s.key === order.status);
  const orderId = order.id?.slice(-4).toUpperCase();
  const items = (order.items || []) as any[];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Заказ #{orderId}</h3>
        <span className="text-xs text-muted-foreground">
          {new Date(order.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1">
        {statusSteps.map((step, i) => {
          const isActive = i <= currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              } ${isCurrent ? 'ring-2 ring-primary/50 scale-110' : ''}`}>
                {step.emoji}
              </div>
              <span className={`text-[9px] font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
              {i < statusSteps.length - 1 && (
                <div className={`absolute h-0.5 w-full ${isActive ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Items */}
      <div className="space-y-1.5">
        {items.map((item: any, i: number) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-foreground">
              {item.name} x{item.quantity}
              {item.modifiers?.length > 0 && (
                <span className="text-muted-foreground"> ({item.modifiers.map((m: any) => m.option).join(', ')})</span>
              )}
            </span>
            <span className="text-muted-foreground">{formatPrice((item.price + (item.modifiers?.reduce((s: number, m: any) => s + (m.priceAdd || 0), 0) || 0)) * item.quantity)} {currency}</span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm font-bold text-foreground">Итого</span>
          <span className="text-sm font-bold text-primary">{formatPrice(order.final_amount || order.total_amount)} {currency}</span>
        </div>
      </div>

      {/* Pay button */}
      {order.status === 'served' && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onPayClick}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm glow-green flex items-center justify-center gap-2"
        >
          <CreditCard className="w-4 h-4" />Оплатить
        </motion.button>
      )}
    </motion.div>
  );
};

export default CafeOrderStatus;
