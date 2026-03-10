import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bell, CheckCheck, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { usePreferences } from '@/hooks/usePreferences';
import BottomNav from '@/components/BottomNav';

const typeIcon: Record<string, string> = {
  confirmed: '✅',
  cancelled: '❌',
  reminder: '⏰',
  deal: '🔥',
  info: '🔔',
};

const Notifications = () => {
  const navigate = useNavigate();
  const { t, lang } = usePreferences();
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const locale = lang === 'uz' ? 'uz' : lang === 'en' ? 'en' : 'ru';

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <h1 className="text-lg font-bold font-display text-foreground">{t('notifications.title')}</h1>
          </div>
          {unreadCount > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-xs text-primary font-medium"
            >
              <CheckCheck className="w-4 h-4" /> {t('notifications.read_all')}
            </motion.button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">{t('common.loading')}</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <BellOff className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{t('notifications.empty')}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{t('notifications.empty_desc')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {notifications.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => { if (!n.read) markAsRead(n.id); }}
                  className={`glass rounded-xl p-4 cursor-pointer transition-colors ${!n.read ? 'ring-1 ring-primary/20 bg-primary/5' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className="text-xl flex-shrink-0 mt-0.5">
                      {typeIcon[n.type] || '🔔'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`text-sm font-semibold truncate ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {n.title}
                        </h3>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                        {new Date(n.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                        {' · '}
                        {new Date(n.created_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Notifications;
