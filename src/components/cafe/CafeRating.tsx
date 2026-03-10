import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  order: any;
  onClose: () => void;
}

const CafeRating = ({ order, onClose }: Props) => {
  const { toast } = useToast();
  const items = (order.items || []) as any[];
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleRate = (index: number, rating: number) => {
    setRatings(prev => ({ ...prev, [index]: rating }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const inserts = items.map((item: any, i: number) => ({
      order_id: order.id,
      item_id: item.item_id || null,
      item_name: item.name,
      rating: ratings[i] || 5,
    })).filter(r => ratings[r.rating] !== undefined || true);

    await supabase.from('cafe_order_ratings').insert(inserts as any);
    setSubmitting(false);
    toast({ title: '⭐ Спасибо за оценку!' });
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.notificationOccurred('success');
    onClose();
  };

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
        className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-card rounded-t-2xl overflow-y-auto p-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-foreground">⭐ Оцените блюда</h3>
          <button onClick={onClose} className="p-1"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="space-y-4">
          {items.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              {item.photo_url && (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  <img src={item.photo_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => handleRate(i, star)}>
                      <Star className={`w-5 h-5 transition-colors ${
                        star <= (ratings[i] || 0) ? 'text-primary fill-primary' : 'text-muted'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full mt-6 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm glow-green"
        >
          {submitting ? 'Отправка...' : 'Отправить оценку'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default CafeRating;
