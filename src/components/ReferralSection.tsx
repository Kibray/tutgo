import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Send, Users, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const ReferralSection = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    (supabase.from('profiles') as any)
      .select('referral_code, referral_count')
      .eq('user_id', user.id)
      .single()
      .then(({ data }: any) => {
        if (data?.referral_code) setReferralCode(data.referral_code);
        if (data?.referral_count) setReferralCount(data.referral_count);
      });
  }, [user]);

  if (!referralCode) return null;

  const link = `tutgo.uz/ref/${referralCode}`;
  const fullLink = `https://tutgo.lovable.app/ref/${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    toast.success('Ссылка скопирована');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(
      `━━━━━━━━━━━━━━━━━━━━\n🇺🇿 Попробуй TutGo!\n\nЗаписывайся к лучшим мастерам\nТашкента онлайн:\n✂️ Красота  💊 Медицина\n🌍 Туры     🔧 Сервис\n\n👉 ${fullLink}\n━━━━━━━━━━━━━━━━━━━━`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(fullLink)}&text=${text}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Пригласить друзей</h3>
      </div>

      <div className="bg-secondary/50 rounded-xl px-3 py-2.5 flex items-center gap-2">
        <span className="text-xs text-muted-foreground flex-1 font-mono truncate">{link}</span>
        <button onClick={handleCopy} className="text-primary flex-shrink-0">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 bg-secondary/50 rounded-xl py-2 text-xs font-medium text-foreground flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
        >
          <Copy className="w-3.5 h-3.5" /> Скопировать
        </button>
        <button
          onClick={handleShareTelegram}
          className="flex-1 bg-primary/15 rounded-xl py-2 text-xs font-medium text-primary flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
        >
          <Send className="w-3.5 h-3.5" /> Telegram
        </button>
      </div>

      <div className="text-center pt-1">
        <p className="text-xs text-muted-foreground">
          Вы пригласили <span className="text-foreground font-bold">{referralCount}</span> друзей
        </p>
      </div>
    </motion.div>
  );
};

export default ReferralSection;
