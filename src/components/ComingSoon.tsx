import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Bell, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BottomNav from '@/components/BottomNav';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ComingSoonProps {
  icon: string;
  title: string;
  titleUz: string;
  description: string;
  feature: string;
}

const ComingSoon = ({ icon, title, titleUz, description, feature }: ComingSoonProps) => {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [telegram, setTelegram] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNotify = async () => {
    if (!telegram.trim()) {
      toast.error('Введите ваш Telegram');
      return;
    }
    setLoading(true);
    try {
      await supabase.from('waitlist').insert({
        telegram_username: telegram.trim(),
        feature,
      });
      setSubmitted(true);
      toast.success('Вы в списке! Мы сообщим о запуске.');
    } catch {
      toast.error('Ошибка, попробуйте позже');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{icon} {title}</h1>
        </div>
      </div>

      <div className={cn('flex flex-col items-center justify-center px-6 pt-16', isDesktop && 'max-w-lg mx-auto')}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="text-7xl mb-6"
        >
          {icon}
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-2xl font-bold text-foreground text-center"
        >
          {title}
        </motion.h2>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-3 space-y-1 text-center"
        >
          <p className="text-primary font-semibold text-lg">Скоро открытие</p>
          <p className="text-muted-foreground text-sm">Tez kunda</p>
        </motion.div>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-6 text-muted-foreground text-sm text-center leading-relaxed max-w-sm"
        >
          {description}
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-10 w-full max-w-xs"
        >
          {submitted ? (
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-primary/20">
              <CheckCircle className="w-10 h-10 text-primary" />
              <p className="text-foreground font-semibold text-center">Вы в списке!</p>
              <p className="text-muted-foreground text-xs text-center">Мы уведомим вас первым, как только раздел откроется.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                placeholder="@username в Telegram"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                className="bg-card border-border text-center"
              />
              <Button
                onClick={handleNotify}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-semibold gap-2"
              >
                <Bell className="w-4 h-4" />
                Уведомить меня
              </Button>
            </div>
          )}
        </motion.div>
      </div>

      {!isDesktop && <BottomNav />}
    </div>
  );
};

export default ComingSoon;
