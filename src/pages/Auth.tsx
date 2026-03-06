import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password, name);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      if (isLogin) {
        toast({ title: 'Добро пожаловать!' });
        navigate('/profile');
      } else {
        const confirmMessage = 'Письмо отправлено! Проверьте почту и перейдите по ссылке для подтверждения аккаунта.';
        toast({ title: 'Проверьте почту', description: confirmMessage });
        setConfirmationSent(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative">
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1 as any)}
        className="absolute top-6 left-4 w-9 h-9 flex items-center justify-center rounded-full glass">
        <ArrowLeft className="w-5 h-5 text-foreground" />
      </motion.button>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <h1 className="text-2xl font-bold font-display text-foreground text-center mb-2">
          {isLogin ? 'Вход в TUTGO' : 'Регистрация'}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {isLogin ? 'Войдите, чтобы управлять записями' : 'Создайте аккаунт за секунду'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full glass rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full glass rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors"
          />
          <input
            type="password"
            placeholder="Пароль"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full glass rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors"
          />
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-primary text-accent-foreground font-semibold text-sm disabled:opacity-50"
          >
            {loading ? '...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
          </motion.button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-4 text-center text-sm text-muted-foreground"
        >
          {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </motion.div>
    </div>
  );
};

export default Auth;
