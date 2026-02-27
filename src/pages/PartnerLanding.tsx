import { motion } from 'framer-motion';
import { MapPin, MessageCircle, BarChart3, Image, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { useToast } from '@/hooks/use-toast';
import BottomNav from '@/components/BottomNav';

const benefits = [
  { icon: MapPin, key: 'partner_landing.benefit1' },
  { icon: MessageCircle, key: 'partner_landing.benefit2' },
  { icon: Image, key: 'partner_landing.benefit3' },
  { icon: BarChart3, key: 'partner_landing.benefit4' },
];

const PartnerLanding = () => {
  const navigate = useNavigate();
  const { user, becomePartner } = useAuth();
  const { t } = usePreferences();
  const { toast } = useToast();

  const handleCta = async () => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred('medium');

    if (!user) {
      toast({ title: t('partner_landing.login_first') });
      navigate('/auth');
      return;
    }

    const { error } = await becomePartner();
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('profile.partner_success'), description: t('profile.partner_welcome') });
      navigate('/partner');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚀</span>
          </div>
          <h1 className="text-xl font-bold font-display text-foreground mb-2">{t('partner_landing.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('partner_landing.subtitle')}</p>
        </motion.div>

        <div className="space-y-3 mb-8">
          {benefits.map((b, i) => (
            <motion.div key={b.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="glass rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                <b.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">{t(b.key)}</p>
            </motion.div>
          ))}
        </div>

        <motion.button whileTap={{ scale: 0.98 }}
          onClick={handleCta}
          className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm glow-green">
          {t('partner_landing.cta')}
        </motion.button>
      </div>
      <BottomNav />
    </div>
  );
};

export default PartnerLanding;
