import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Phone } from 'lucide-react';
import PhoneCountrySelect, { COUNTRIES, type Country } from '@/components/auth/PhoneCountrySelect';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { useTelegram } from '@/hooks/useTelegram';
import { useToast } from '@/hooks/use-toast';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Checkbox } from '@/components/ui/checkbox';

const AuthPartner = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [telegramStep, setTelegramStep] = useState<'idle' | 'waiting_code' | 'phone_input'>('idle');
  const [telegramCode, setTelegramCode] = useState('');
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState<Country>(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullPhone, setFullPhone] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const { signUp, user } = useAuth();
  const { t } = usePreferences();
  const { isTelegram, ready: tgReady } = useTelegram();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/partner-landing', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast({ title: t('auth.attention'), description: 'Примите соглашение с партнёрами', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, name);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('auth.check_email'), description: t('auth.email_sent') });
      setConfirmationSent(true);
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Ссылка отправлена', description: 'Проверьте вашу почту' });
      setShowReset(false);
    }
  };

  const handleTelegramLogin = () => {
    window.open('https://t.me/TutGoUzBot?start=auth', '_blank');
    setTelegramStep('waiting_code');
  };

  const handlePhoneLogin = () => {
    const full = phoneCountry.dial + phoneNumber.replace(/\s/g, '');
    setFullPhone(full);
    const encoded = btoa(full);
    window.open(`https://t.me/TutGoUzBot?start=auth_${encoded}`, '_blank');
    setTelegramStep('waiting_code');
  };

  const handleVerifyTelegramCode = async () => {
    if (telegramCode.length !== 6) return;
    setTelegramLoading(true);
    try {
      const res = await supabase.functions.invoke('verify-telegram-code', {
        body: { code: telegramCode, ...(fullPhone ? { phone: fullPhone } : {}) },
      });
      if (res.error || res.data?.error) {
        toast({ title: t('common.error'), description: res.data?.error || 'Failed', variant: 'destructive' });
      } else if (res.data?.session) {
        await supabase.auth.setSession({
          access_token: res.data.session.access_token,
          refresh_token: res.data.session.refresh_token,
        });
        toast({ title: t('auth.welcome') });
        navigate('/partner-landing');
      }
    } catch {
      toast({ title: t('common.error'), description: 'Network error', variant: 'destructive' });
    }
    setTelegramLoading(false);
  };

  if (confirmationSent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1 as any)}
          className="absolute top-6 left-4 w-9 h-9 flex items-center justify-center rounded-full glass">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
          <div className="glass rounded-2xl p-8 border border-border">
            <h1 className="text-2xl font-bold font-display text-foreground mb-4">{t('auth.check_email')}</h1>
            <p className="text-sm text-muted-foreground mb-6">{t('auth.email_sent')}</p>
            <button
              onClick={() => { setConfirmationSent(false); setEmail(''); setPassword(''); setName(''); }}
              className="text-sm text-primary hover:underline"
            >
              {t('auth.back_to_register')}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold font-display text-foreground mb-2">{t('auth.enter_code')}</h1>
            <p className="text-sm text-muted-foreground mb-1">{t('auth.code_instruction')}</p>
            {fullPhone && (
              <p className="text-sm font-medium text-foreground mb-5">{fullPhone}</p>
            )}
            {!fullPhone && <div className="mb-6" />}
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
              {telegramLoading ? '...' : t('btn.confirm')}
            </motion.button>
            <button onClick={handleTelegramLogin} className="mt-4 text-sm text-primary hover:underline">
              {t('auth.resend')}
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
          Регистрация бизнеса
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Создайте аккаунт партнёра
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder={t('auth.your_name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full glass rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors"
          />
          <input
            type="email"
            placeholder={t('auth.email')}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full glass rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors"
          />
          <input
            type="password"
            placeholder={t('auth.password')}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full glass rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors"
          />
          <button type="button" onClick={() => setShowReset(true)}
            className="text-xs text-muted-foreground underline mt-1 self-start">
            Забыли пароль?
          </button>

          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <Checkbox checked={termsAccepted} onCheckedChange={(v) => setTermsAccepted(v === true)} className="mt-0.5" />
              <span className="text-xs text-muted-foreground leading-relaxed">
                Я принимаю{' '}
                <Link to="/terms-partner" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>Соглашение с партнёрами</Link>
                {' '}и{' '}
                <Link to="/privacy" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>Политику конфиденциальности</Link>
              </span>
            </label>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !termsAccepted}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
          >
            {loading ? '...' : 'Зарегистрировать бизнес'}
          </motion.button>
        </form>

        {showReset && (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium">Восстановление пароля</p>
            <input
              type="email"
              placeholder="Ваш email"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
            />
            <button onClick={handleResetPassword}
              className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
              Отправить ссылку
            </button>
            <button onClick={() => setShowReset(false)}
              className="w-full py-2 rounded-xl bg-muted text-muted-foreground text-sm">
              Отмена
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">{t('auth.or')}</span>
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
              toast({ title: t('common.error'), description: String(error), variant: 'destructive' });
              setGoogleLoading(false);
            }
          }}
          className="w-full py-3 rounded-lg border border-border bg-background text-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-muted transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          {googleLoading ? '...' : t('auth.google_login')}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleTelegramLogin}
          className="w-full mt-3 py-3 rounded-lg border border-border bg-background text-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-muted transition-colors"
        >
          <Send className="w-[18px] h-[18px] text-[#2AABEE]" />
          {t('auth.telegram_login')}
        </motion.button>

        <button
          onClick={() => navigate('/auth')}
          className="w-full mt-4 text-center text-sm text-muted-foreground"
        >
          Уже есть аккаунт? Войти
        </button>
      </motion.div>
    </div>
  );
};

export default AuthPartner;
