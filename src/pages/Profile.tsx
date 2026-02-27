import { motion } from 'framer-motion';
import { User, Settings, Globe, HelpCircle, ChevronRight, LogOut, Key, Briefcase, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { useToast } from '@/hooks/use-toast';
import BottomNav from '@/components/BottomNav';

const Profile = () => {
  const { user, isPartner, signOut } = useAuth();
  const { t } = usePreferences();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({ title: t('profile.signed_out') });
  };

  const menuItems = [
    { icon: Globe, label: t('profile.language'), desc: t('profile.lang_options'), route: '/settings' },
    { icon: Settings, label: t('profile.settings'), desc: t('profile.settings_desc'), route: '/settings' },
    { icon: HelpCircle, label: t('profile.help'), desc: t('profile.help_desc'), route: '/help' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        {/* Avatar & name */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
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

        {/* Top entry points */}
        <div className="space-y-2 mb-4">
          {!user ? (
            <>
              {/* Sign in / Sign up */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate('/auth')}
                className="glass rounded-lg p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{t('profile.login')}</p>
                  <p className="text-xs text-muted-foreground">{t('profile.login_desc')}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.div>

              {/* Business login */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                onClick={() => navigate('/partner-landing')}
                className="glass rounded-lg p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform">
                <div className="w-10 h-10 rounded-lg bg-accent/60 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{t('profile.business_login')}</p>
                  <p className="text-xs text-muted-foreground">{t('profile.business_login_desc')}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </>
          ) : (
            <>
              {/* My profile (logged in) */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate('/edit-profile')}
                className="glass rounded-lg p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform">
                <User className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{t('profile.my_profile')}</p>
                  <p className="text-xs text-muted-foreground">{t('profile.personal_info')}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.div>

              {/* Business portal for partners */}
              {isPartner && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  onClick={() => navigate('/partner')}
                  className="glass rounded-lg p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform ring-1 ring-primary/20">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{t('profile.business_portal')}</p>
                    <p className="text-xs text-muted-foreground">{t('profile.manage_listings')}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Menu items */}
        <div className="space-y-2">
          {menuItems.map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => navigate(item.route)}
              className="glass rounded-lg p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform">
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          ))}
        </div>

        {/* Sign out */}
        {user && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} whileTap={{ scale: 0.98 }}
            onClick={handleSignOut}
            className="w-full mt-4 glass rounded-lg p-4 flex items-center gap-3 cursor-pointer">
            <LogOut className="w-5 h-5 text-destructive" />
            <p className="text-sm font-medium text-destructive">{t('profile.sign_out')}</p>
          </motion.button>
        )}

        <p className="text-center text-[10px] text-muted-foreground/50 mt-8">{t('profile.version')}</p>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
