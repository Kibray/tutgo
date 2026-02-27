import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { services, formatPrice } from '@/lib/mock-data';

const Bookings = () => {
  const upcoming = services.slice(0, 2).map((s, i) => ({
    ...s,
    date: new Date(Date.now() + (i + 1) * 86400000),
    time: i === 0 ? '14:00' : '10:30',
    status: 'confirmed' as const,
  }));

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <h1 className="text-lg font-bold font-display text-foreground mb-1">Мои записи</h1>
        <p className="text-xs text-muted-foreground mb-6">Управляйте бронированиями</p>

        <h2 className="text-sm font-semibold text-foreground mb-3">Предстоящие</h2>
        <div className="space-y-3 mb-6">
          {upcoming.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{b.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.businessName}</p>
                </div>
                <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-primary/15 text-primary">
                  Подтверждено
                </span>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {b.date.toLocaleDateString('ru', { month: 'short', day: 'numeric' })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {b.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {b.city}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-sm font-bold text-gradient-green">
                  {formatPrice(b.price)} {b.currency}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </motion.div>
          ))}
        </div>

        <h2 className="text-sm font-semibold text-foreground mb-3">Прошедшие</h2>
        <div className="glass rounded-lg p-6 text-center">
          <p className="text-xs text-muted-foreground">Прошедших записей пока нет</p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Bookings;
