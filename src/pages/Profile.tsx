import { motion } from 'framer-motion';
import { User, Settings, Globe, HelpCircle, ChevronRight } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const Profile = () => {
  const menuItems = [
    { icon: User, label: 'Мой профиль', desc: 'Личная информация' },
    { icon: Globe, label: 'Язык', desc: 'Русский, O\'zbek, English' },
    { icon: Settings, label: 'Настройки', desc: 'Уведомления, приватность' },
    { icon: HelpCircle, label: 'Помощь', desc: 'FAQ, связаться с нами' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-foreground">Гость</h1>
            <p className="text-xs text-muted-foreground">Войдите через Telegram</p>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          className="w-full glass rounded-lg p-4 flex items-center gap-3 mb-6"
        >
          <div className="w-10 h-10 rounded-lg bg-[#2AABEE]/20 flex items-center justify-center text-xl">
            ✈️
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">Подключить Telegram</p>
            <p className="text-xs text-muted-foreground">Верификация по номеру телефона</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.button>

        <div className="space-y-2">
          {menuItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-lg p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 glass rounded-lg p-4 flex items-center gap-3 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
            B
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Бизнес-портал</p>
            <p className="text-xs text-muted-foreground">Управление листингами</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.div>

        <p className="text-center text-[10px] text-muted-foreground/50 mt-8">
          TUTGO v1.0 · Сделано в Узбекистане 🇺🇿
        </p>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
