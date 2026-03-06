import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTelegram } from '@/hooks/useTelegram';
import { useToast } from '@/hooks/use-toast';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const Auth = () => {
  const { isTelegram, ready: tgReady } = useTelegram();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect if already authenticated via Telegram Mini App
  useEffect(() => {
    if (isTelegram && tgReady && user) {
      navigate('/profile', { replace: true });
    }
  }, [isTelegram, tgReady, user, navigate]);

  if (isTelegram && !tgReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Входим через Telegram...</div>
      </div>
    );
  }

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [telegramStep, setTelegramStep] = useState<'idle' | 'waiting_code'>('idle');
  const [telegramCode, setTelegramCode] = useState('');
  const [telegramLoading, setTelegramLoading] = useState(false);
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

  const handleTelegramLogin = () => {
    window.open('https://t.me/TutGoUzBot?start=auth', '_blank');
    setTelegramStep('waiting_code');
  };

  const handleVerifyTelegramCode = async () => {
    if (telegramCode.length !== 6) return;
    setTelegramLoading(true);

    try {
      const res = await supabase.functions.invoke('verify-telegram-code', {
        body: { code: telegramCode },
      });

      if (res.error || res.data?.error) {
        toast({
          title: 'Ошибка',
          description: res.data?.error || 'Не удалось войти',
          variant: 'destructive',
        });
      } else if (res.data?.session) {
        // Set session from the returned tokens
        await supabase.auth.setSession({
          access_token: res.data.session.access_token,
          refresh_token: res.data.session.refresh_token,
        });
        toast({ title: 'Добро пожаловать!' });
        navigate('/profile');
      }
    } catch (err) {
      toast({ title: 'Ошибка', description: 'Ошибка сети', variant: 'destructive' });
    }

    setTelegramLoading(false);
  };

  if (confirmationSent && !isLogin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1 as any)}
          className="absolute top-6 left-4 w-9 h-9 flex items-center justify-center rounded-full glass">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
          <div className="glass rounded-2xl p-8 border border-border">
            <h1 className="text-2xl font-bold font-display text-foreground mb-4">Проверьте почту</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Письмо отправлено! Проверьте почту и перейдите по ссылке для подтверждения аккаунта.
            </p>
            <button
              onClick={() => { setConfirmationSent(false); setEmail(''); setPassword(''); setName(''); }}
              className="text-sm text-primary hover:underline"
            >
              Вернуться к регистрации
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Telegram OTP entry screen
  if (telegramStep === 'waiting_code') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setTelegramStep('idle')}
          className="absolute top-6 left-4 w-9 h-9 flex items-center justify-center rounded-full glass">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
          <div className="glass rounded-2xl p-8 border border-border">
            <Send className="w-10 h-10 text-[#2AABEE] mx-auto mb-4" />
            <h1 className="text-2xl font-bold font-display text-foreground mb-2">Введите код</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Откройте @TutGoUzBot в Telegram и введите полученный 6-значный код
            </p>
            <div className="flex justify-center mb-6">
              <InputOTP maxLength={6} value={telegramCode} onChange={setTelegramCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleVerifyTelegramCode}
              disabled={telegramCode.length !== 6 || telegramLoading}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
            >
              {telegramLoading ? '...' : 'Подтвердить'}
            </motion.button>
            <button
              onClick={handleTelegramLogin}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Отправить код повторно
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

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
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
          >
            {loading ? '...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
          </motion.button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">или</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={googleLoading}
          onClick={async () => {
            setGoogleLoading(true);
            const { error } = await lovable.auth.signInWithOAuth('google', {
              redirect_uri: window.location.origin,
            });
            if (error) {
              toast({ title: 'Ошибка', description: String(error), variant: 'destructive' });
              setGoogleLoading(false);
            }
          }}
          className="w-full py-3 rounded-lg border border-border bg-background text-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-muted transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          {googleLoading ? '...' : 'Войти через Google'}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleTelegramLogin}
          className="w-full mt-3 py-3 rounded-lg border border-border bg-background text-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-muted transition-colors"
        >
          <Send className="w-[18px] h-[18px] text-[#2AABEE]" />
          Войти через Telegram
        </motion.button>

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
