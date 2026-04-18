import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ComingSoonBannerProps {
  feature: string;
}

const ComingSoonBanner = ({ feature }: ComingSoonBannerProps) => {
  const [dismissed, setDismissed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [telegram, setTelegram] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNotify = async () => {
    if (!telegram.trim()) return;
    setLoading(true);
    try {
      await supabase.from('waitlist').insert({ telegram_username: telegram.trim(), feature });
      setSubmitted(true);
      toast.success('Вы в списке! Мы сообщим о запуске.');
    } catch {
      toast.error('Ошибка, попробуйте позже');
    } finally {
      setLoading(false);
    }
  };

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="mx-4 mt-3 rounded-2xl bg-primary/10 border border-primary/20 p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">🚧</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary">Скоро · Tez kunda</p>
            <p className="text-[10px] text-muted-foreground">Раздел в разработке — интерфейс готов, запуск скоро</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              Представленные данные являются демонстрационными и не являются публичной офертой.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!submitted && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[10px] text-primary hover:bg-primary/10"
              onClick={() => setShowForm(!showForm)}
            >
              <Bell className="w-3 h-3 mr-1" />
              Уведомить
            </Button>
          )}
          <button onClick={() => setDismissed(true)} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && !submitted && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="@username в Telegram"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                className="h-8 text-xs bg-card border-border"
              />
              <Button size="sm" className="h-8 text-xs px-3" onClick={handleNotify} disabled={loading}>
                OK
              </Button>
            </div>
          </motion.div>
        )}
        {submitted && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] text-primary mt-1.5"
          >
            ✅ Вы в списке — уведомим первым!
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ComingSoonBanner;
