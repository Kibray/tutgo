import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const ReferralRedirect = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) { navigate('/', { replace: true }); return; }

    // Save referral code
    localStorage.setItem('tutgo_referral', code);

    // Track click
    (supabase.from as any)('referral_clicks').insert({
      referral_type: 'user',
      referral_code: code,
    }).then(() => {});

    // Get referrer name
    const fetchReferrer = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('referral_code' as any, code)
        .single();

      if (data?.display_name) {
        setReferrerName(data.display_name);
      }
      setLoading(false);

      // Redirect after delay
      setTimeout(() => navigate('/', { replace: true }), 3000);
    };

    fetchReferrer();
  }, [code, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm"
      >
        <div className="text-5xl mb-4">🇺🇿</div>
        <h1 className="text-xl font-bold text-foreground mb-2">Добро пожаловать в TutGo!</h1>
        {referrerName && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl px-4 py-3 mb-4"
          >
            <p className="text-sm text-muted-foreground">
              Вас пригласил <span className="text-foreground font-semibold">{referrerName}</span> 🎉
            </p>
          </motion.div>
        )}
        <p className="text-sm text-muted-foreground">
          Записывайся к лучшим мастерам Ташкента онлайн
        </p>
        <div className="flex justify-center gap-3 mt-4 text-lg">
          <span>✂️ Красота</span>
          <span>💊 Медицина</span>
          <span>🌍 Туры</span>
          <span>🔧 Сервис</span>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-6">Перенаправление на главную...</p>
      </motion.div>
    </div>
  );
};

export default ReferralRedirect;
