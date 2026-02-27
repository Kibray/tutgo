import { motion } from 'framer-motion';
import { ArrowLeft, Moon, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '@/hooks/usePreferences';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Lang, LANG_LABELS } from '@/lib/i18n';
import BottomNav from '@/components/BottomNav';

const Settings = () => {
  const navigate = useNavigate();
  const { t, lang, setLang, darkMode, setDarkMode, notifications, setNotifications } = usePreferences();
  const { toast } = useToast();

  const handleLang = (l: Lang) => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.selectionChanged();
    setLang(l);
    toast({ title: t('settings.saved') });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold font-display text-foreground">{t('settings.title')}</h1>
        </div>

        <div className="space-y-3">
          {/* Dark Mode */}
          <div className="glass rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">{t('settings.dark_mode')}</p>
                <p className="text-xs text-muted-foreground">{t('settings.dark_mode_desc')}</p>
              </div>
            </div>
            <Switch checked={darkMode} onCheckedChange={(v) => { setDarkMode(v); toast({ title: t('settings.saved') }); }} />
          </div>

          {/* Notifications */}
          <div className="glass rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">{t('settings.notifications')}</p>
                <p className="text-xs text-muted-foreground">{t('settings.notifications_desc')}</p>
              </div>
            </div>
            <Switch checked={notifications} onCheckedChange={(v) => { setNotifications(v); toast({ title: t('settings.saved') }); }} />
          </div>

          {/* Language */}
          <div className="glass rounded-lg p-4">
            <p className="text-sm font-medium text-foreground mb-3">{t('settings.language')}</p>
            <div className="flex gap-2">
              {(['ru', 'uz', 'en'] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => handleLang(l)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    lang === l ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground'
                  }`}
                >
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Settings;
