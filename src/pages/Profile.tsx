import { motion } from 'framer-motion';
import LegalFooter from '@/components/LegalFooter';
import { User, Settings, Globe, HelpCircle, ChevronRight, LogOut, Key, Briefcase, Store, BookOpen, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import TelegramLinkBlock from '@/components/TelegramLinkBlock';
import ReferralSection from '@/components/ReferralSection';

const Profile = () => {
  const { user, isPartner, signOut, becomePartner } = useAuth();
  const { t } = usePreferences();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({ title: t('profile.signed_out') });
  };

  const handleBecomePartner = async () => {
    if (!user) { navigate('/auth'); return; }
    const { error } = await becomePartner();
    if (!error) {
      toast({ title: t('profile.partner_success'), description: t('profile.partner_welcome') });
    }
  };

  const systemItems = [
    { icon: Globe, label: t('profile.language'), desc: t('profile.lang_options'), route: '/settings' },
    { icon: Settings, label: t('profile.settings'), desc: t('profile.settings_desc'), route: '/settings' },
    { icon: HelpCircle, label: t('profile.help'), desc: t('profile.help_desc'), route: '/help' },
    { icon: Lightbulb, label: t('profile.how_it_works'), desc: t('profile.how_it_works_desc'), route: '/how-it-works' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-foreground">
              {user ? (user.user_metadata?.display_name || user.email?.split('@')[0]) : t('profile.guest')}
            </h1>
            <p className="text-xs text-muted-foreground">
              {user ? user.email : t('profile.login_full')}
            </p>
            {isPartner && (
              <span className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1 font-medium">
                <Store className="w-3 h-3" /> {t('profile.partner_badge')}
              </span>
            )}
          </div>
        </motion.div>

        {user && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}
            onClick={telegramConnected ? undefined : handleConnectTelegram}
            className={`glass rounded-xl p-3.5 flex items-center gap-3 mb-4 ${telegramConnected ? '' : 'cursor-pointer active:scale-[0.98]'} transition-transform`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${telegramConnected ? 'bg-primary/15' : 'bg-blue-500/15'}`}>
              <Send className={`w-4 h-4 ${telegramConnected ? 'text-primary' : 'text-blue-500'}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {telegramConnected ? t('profile.telegram_connected') : t('profile.connect_telegram')}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {telegramConnected ? t('profile.tg_connected_desc') : t('profile.tg_connect_desc')}
              </p>
            </div>
            {!telegramConnected && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            onClick={() => user ? navigate('/bookings') : navigate('/auth')}
            className="glass rounded-2xl p-5 flex flex-col items-center gap-3 cursor-pointer active:scale-[0.97] transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-foreground leading-tight">{t('profile.personal_cabinet')}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t('profile.personal_cabinet_desc')}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            onClick={() => {
              if (!user) { navigate('/auth'); return; }
              if (isPartner) { navigate('/partner'); return; }
              navigate('/partner-landing');
            }}
            className="glass rounded-2xl p-5 flex flex-col items-center gap-3 cursor-pointer active:scale-[0.97] transition-transform ring-1 ring-primary/10"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-foreground leading-tight">{t('profile.business_portal')}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t('profile.business_portal_desc')}</p>
            </div>
          </motion.div>
        </div>

        {user && (
          <div className="mt-4">
            <ReferralSection />
          </div>
        )}

        <div className="space-y-2">
          {systemItems.map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.04 }}
              onClick={() => navigate(item.route)}
              className="glass rounded-xl p-3.5 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform">
              <item.icon className="w-4.5 h-4.5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          ))}
        </div>

        {user && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} whileTap={{ scale: 0.98 }}
            onClick={handleSignOut}
            className="w-full mt-4 glass rounded-xl p-3.5 flex items-center gap-3 cursor-pointer">
            <LogOut className="w-4.5 h-4.5 text-destructive" />
            <p className="text-sm font-medium text-destructive">{t('profile.sign_out')}</p>
          </motion.button>
        )}

        <p className="text-center text-[10px] text-muted-foreground/50 mt-8">{t('profile.version')}</p>
        <LegalFooter />
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
