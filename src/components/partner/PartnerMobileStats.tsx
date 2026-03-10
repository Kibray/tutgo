import { motion } from 'framer-motion';
import { Wallet, Calendar, Hash, Star } from 'lucide-react';

interface Props {
  todayRevenue: number;
  todayBookings: number;
  queueWaiting: number;
  avgRating: number;
}

const stats = [
  { key: 'revenue', icon: Wallet, label: 'Доход', prefix: '', suffix: ' сум', color: 'text-emerald-400' },
  { key: 'bookings', icon: Calendar, label: 'Записей', prefix: '', suffix: '', color: 'text-blue-400' },
  { key: 'queue', icon: Hash, label: 'В очереди', prefix: '', suffix: '', color: 'text-amber-400' },
  { key: 'rating', icon: Star, label: 'Рейтинг', prefix: '', suffix: '', color: 'text-yellow-400' },
] as const;

const PartnerMobileStats = ({ todayRevenue, todayBookings, queueWaiting, avgRating }: Props) => {
  const values: Record<string, string> = {
    revenue: todayRevenue.toLocaleString('ru'),
    bookings: String(todayBookings),
    queue: String(queueWaiting),
    rating: avgRating > 0 ? avgRating.toFixed(1) : '—',
  };

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass rounded-xl px-3.5 py-3 min-w-[120px] flex-shrink-0"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
            <span className="text-[10px] text-muted-foreground font-medium">{s.label}</span>
          </div>
          <p className="text-base font-bold text-foreground leading-tight">
            {s.prefix}{values[s.key]}{s.suffix}
          </p>
        </motion.div>
      ))}
    </div>
  );
};

export default PartnerMobileStats;
