import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Moon, Bell, CheckCircle, Clock, XCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '@/hooks/usePreferences';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Lang, LANG_LABELS } from '@/lib/i18n';
import BottomNav from '@/components/BottomNav';

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang, setLang, darkMode, setDarkMode, notifications, setNotifications } = usePreferences();
  const { toast } = useToast();

  const [notifyConfirmed, setNotifyConfirmed] = useState(true);
  const [notifyReminder, setNotifyReminder] = useState(true);
  const [notifyCancelled, setNotifyCancelled] = useState(true);
  const [notifyDeals, setNotifyDeals] = useState(true);

  // Load granular prefs
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles')
      .select('notify_confirmed, notify_reminder, notify_cancelled, notify_deals')
      .eq('user_id', user.id)
      .single()
      .then(({ data }: any) => {
        if (data) {
          setNotifyConfirmed(data.notify_confirmed ?? true);
          setNotifyReminder(data.notify_reminder ?? true);
          setNotifyCancelled(data.notify_cancelled ?? true);
          setNotifyDeals(data.notify_deals ?? true);
        }
      });
  }, [user]);

  const saveNotifyPref = async (field: string, value: boolean) => {
    if (!user) return;
    await supabase.from('profiles').update({ [field]: value }).eq('user_id', user.id);
    toast({ title: t('settings.saved') });
  };

  const handleLang = (l: Lang) => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.selectionChanged();
    setLang(l);
    toast({ title: t('settings.saved') });
  };

  const notificationItems = [
    {
      icon: CheckCircle,
      label: 'Запись подтверждена',
      desc: 'Когда бизнес подтвердил запись',
      checked: notifyConfirmed,
      onChange: (v: boolean) => { setNotifyConfirmed(v); saveNotifyPref('notify_confirmed', v); },
    },
    {
      icon: Clock,
      label: 'Напоминание за 1 час',
      desc: 'Напоминание о предстоящей записи',
      checked: notifyReminder,
      onChange: (v: boolean) => { setNotifyReminder(v); saveNotifyPref('notify_reminder', v); },
    },
    {
      icon: XCircle,
      label: 'Запись отменена',
      desc: 'Уведомление об отмене записи',
      checked: notifyCancelled,
      onChange: (v: boolean) => { setNotifyCancelled(v); saveNotifyPref('notify_cancelled', v); },
    },
    {
      icon: Sparkles,
      label: 'Новые акции рядом',
      desc: 'Акции от компаний поблизости',
      checked: notifyDeals,
      onChange: (v: boolean) => { setNotifyDeals(v); saveNotifyPref('notify_deals', v); },
    },
  ];

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

          {/* Master Notifications Toggle */}
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

          {/* Granular Notification Settings */}
          {notifications && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass rounded-lg overflow-hidden"
            >
              <div className="px-4 pt-3 pb-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Типы уведомлений</p>
              </div>
              {notificationItems.map((item, i) => (
                <div key={i} className={`px-4 py-3 flex items-center justify-between ${i < notificationItems.length - 1 ? 'border-b border-border/50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Switch checked={item.checked} onCheckedChange={item.onChange} />
                </div>
              ))}
            </motion.div>
          )}

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
