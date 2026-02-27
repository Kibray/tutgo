import { motion } from 'framer-motion';
import { User, Settings, Globe, HelpCircle, ChevronRight, LogOut, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import BottomNav from '@/components/BottomNav';

const Profile = () => {
  const { user, isPartner, signOut, becomePartner, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const menuItems = [
    { icon: User, label: 'Мой профиль', desc: 'Личная информация' },
    { icon: Globe, label: 'Язык', desc: "Русский, O'zbek, English" },
    { icon: Settings, label: 'Настройки', desc: 'Уведомления, приватность' },
    { icon: HelpCircle, label: 'Помощь', desc: 'FAQ, связаться с нами' },
  ];

  const handleBecomePartner = async () => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred('medium');
    const { error } = await becomePartner();
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '🎉 Вы теперь партнёр!', description: 'Добро пожаловать в бизнес-портал' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Вы вышли из аккаунта' });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-foreground">
              {user ? (user.user_metadata?.display_name || user.email?.split('@')[0]) : 'Гость'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {user ? user.email : 'Войдите для полного доступа'}
            </p>
            {isPartner && (
              <span className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1 font-medium">
                <Store className="w-3 h-3" /> Партнёр
              </span>
            )}
          </div>
        </motion.div>

        {!user ? (
          <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/auth')}
            className="w-full glass rounded-lg p-4 flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-xl">🔑</div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">Войти / Регистрация</p>
              <p className="text-xs text-muted-foreground">Email и пароль</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        ) : !isPartner ? (
          <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.98 }}
            onClick={handleBecomePartner}
            className="w-full glass rounded-lg p-4 flex items-center gap-3 mb-6 ring-1 ring-primary/30">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-xl">🚀</div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">Стать партнёром</p>
              <p className="text-xs text-muted-foreground">Добавьте свой бизнес в TUTGO</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        ) : (
          <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/partner')}
            className="w-full glass rounded-lg p-4 flex items-center gap-3 mb-6 ring-1 ring-primary/30">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">B</div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">Бизнес-портал</p>
              <p className="text-xs text-muted-foreground">Управление листингами</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        )}

        <div className="space-y-2">
          {menuItems.map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
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

        {user && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} whileTap={{ scale: 0.98 }}
            onClick={handleSignOut}
            className="w-full mt-4 glass rounded-lg p-4 flex items-center gap-3 cursor-pointer">
            <LogOut className="w-5 h-5 text-destructive" />
            <p className="text-sm font-medium text-destructive">Выйти</p>
          </motion.button>
        )}

        <p className="text-center text-[10px] text-muted-foreground/50 mt-8">TUTGO v1.0 · Сделано в Узбекистане 🇺🇿</p>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
