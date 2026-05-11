import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Phone, KeyRound, MapPin, Calendar, Shield, ChevronRight, UserPlus, Star } from 'lucide-react';
import PhoneCountrySelect, { COUNTRIES, type Country } from '@/components/auth/PhoneCountrySelect';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { useTelegram } from '@/hooks/useTelegram';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useToast } from '@/hooks/use-toast';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Checkbox } from '@/components/ui/checkbox';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
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
  const { signUp, signIn, user, isRecovery, setIsRecovery } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const { t } = usePreferences();
  const { isTelegram, ready: tgReady } = useTelegram();
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as any)?.returnTo;
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const isPartner = searchParams.get('role') === 'partner';

  useEffect(() => {
    if (isTelegram && tgReady && user) {
      navigate('/profile', { replace: true });
    }
  }, [isTelegram, tgReady, user, navigate]);

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: t('common.error'), description: 'Минимум 6 символов', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t('common.error'), description: 'Пароли не совпадают', variant: 'destructive' });
      return;
    }
    setRecoveryLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setRecoveryLoading(false);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
      return;
    }
    setRecoverySuccess(true);
    toast({ title: 'Пароль обновлён', description: 'Вход выполнен' });
    setTimeout(() => {
      setIsRecovery(false);
      navigate('/profile', { replace: true });
    }, 1200);
  };

  if (isTelegram && !tgReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">{t('auth.logging_telegram')}</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && !termsAccepted) {
      toast({ title: t('auth.attention'), description: t('auth.confirm_age_terms'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password, name);

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      if (isLogin) {
        toast({ title: t('auth.welcome') });
        navigate('/profile');
      } else {
        toast({ title: t('auth.check_email'), description: t('auth.email_sent') });
        setConfirmationSent(true);
      }
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
        toast({
          title: t('common.error'),
          description: res.data?.error || 'Failed',
          variant: 'destructive',
        });
      } else if (res.data?.session) {
        await supabase.auth.setSession({
          access_token: res.data.session.access_token,
          refresh_token: res.data.session.refresh_token,
        });
        toast({ title: t('auth.welcome') });
        navigate('/profile');
      }
    } catch (err) {
      toast({ title: t('common.error'), description: 'Network error', variant: 'destructive' });
    }

    setTelegramLoading(false);
  };

  if (isDesktop && !isTelegram && telegramStep === 'idle') {
    return (
      <DesktopAuthLayout
        isLogin={isLogin}
        setIsLogin={setIsLogin}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        name={name}
        setName={setName}
        loading={loading}
        termsAccepted={termsAccepted}
        setTermsAccepted={setTermsAccepted}
        googleLoading={googleLoading}
        setGoogleLoading={setGoogleLoading}
        handleSubmit={handleSubmit}
        handleTelegramLogin={handleTelegramLogin}
        setTelegramStep={setTelegramStep}
        isPartner={isPartner}
        toast={toast}
        t={t}
      />
    );
  }

  if (isRecovery) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
          <div className="glass rounded-2xl p-8 border border-border">
            <KeyRound className="w-10 h-10 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold font-display text-foreground mb-2">Новый пароль</h1>
            <p className="text-sm text-muted-foreground mb-6">Придумайте новый пароль для входа</p>
            {recoverySuccess ? (
              <p className="text-sm text-primary font-medium py-4">Пароль успешно обновлён ✓</p>
            ) : (
              <>
                <input
                  type="password"
                  placeholder="Новый пароль"
                  value={newPassword}
                  minLength={6}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full glass rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors mb-3"
                />
                <input
                  type="password"
                  placeholder="Подтвердите пароль"
                  value={confirmPassword}
                  minLength={6}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full glass rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors mb-5"
                />
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpdatePassword}
                  disabled={recoveryLoading || newPassword.length < 6 || confirmPassword.length < 6}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
                >
                  {recoveryLoading ? '...' : 'Обновить пароль'}
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  if (confirmationSent && !isLogin) {
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

  if (telegramStep === 'phone_input') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setTelegramStep('idle')}
          className="absolute top-6 left-4 w-9 h-9 flex items-center justify-center rounded-full glass">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
          <div className="glass rounded-2xl p-8 border border-border">
            <Phone className="w-10 h-10 text-[#2AABEE] mx-auto mb-4" />
            <h1 className="text-2xl font-bold font-display text-foreground mb-2">Введите номер телефона</h1>
            <p className="text-sm text-muted-foreground mb-6">Мы отправим код подтверждения в Telegram</p>
            <div className="flex gap-2 mb-6">
              <PhoneCountrySelect selected={phoneCountry} onSelect={setPhoneCountry} />
              <input
                type="tel"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="XX XXX XX XX"
                className="flex-1 glass rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handlePhoneLogin}
              disabled={phoneNumber.replace(/\s/g, '').length < 5}
              className="w-full py-3 rounded-lg bg-[#2AABEE] text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Получить код в Telegram
            </motion.button>
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
          {isLogin ? t('auth.login_title') : t('auth.register_title')}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {isLogin ? t('auth.login_subtitle') : t('auth.register_subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder={t('auth.your_name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full glass rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors"
            />
          )}
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
          {!isLogin && (
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <Checkbox checked={termsAccepted} onCheckedChange={(v) => setTermsAccepted(v === true)} className="mt-0.5" />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {isPartner ? (
                    <>
                      Я принимаю{' '}
                      <Link to="/terms-partner" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>Соглашение с партнёрами</Link>
                      {' '}и{' '}
                      <Link to="/privacy" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>Политику конфиденциальности</Link>
                    </>
                  ) : (
                    <>
                      Мне исполнилось 18 лет, и я принимаю{' '}
                      <Link to="/terms" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>Условия использования</Link>
                      {' '}и{' '}
                      <Link to="/privacy" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>Политику конфиденциальности</Link>
                    </>
                  )}
                </span>
              </label>
            </div>
          )}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || (!isLogin && !termsAccepted)}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
          >
            {loading ? '...' : isLogin ? t('btn.sign_in') : t('btn.register')}
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
            const { error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: `${window.location.origin}/profile`,
                queryParams: { access_type: 'offline', prompt: 'consent' },
              },
            });
            if (error) {
              toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
              setGoogleLoading(false);
            }
          }}
          className="w-full py-3 rounded-lg border border-border bg-background text-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-muted transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          {googleLoading ? '...' : t('auth.google_login')}
        </motion.button>

        <div className="mt-3 rounded-lg border border-[#2AABEE33] overflow-hidden">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleTelegramLogin}
            className="w-full py-3 bg-background text-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-muted transition-colors"
          >
            <Send className="w-[18px] h-[18px] text-[#2AABEE]" />
            {t('auth.telegram_login')}
          </motion.button>
          <div className="border-t border-[#2a2a2a]" />
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setTelegramStep('phone_input')}
            className="w-full py-2 bg-background text-xs flex items-center justify-center gap-1.5 hover:bg-muted transition-colors text-[#2AABEE]"
          >
            <Phone className="w-3.5 h-3.5" />
            или по номеру телефона
          </motion.button>
        </div>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-4 text-center text-sm text-muted-foreground"
        >
          {isLogin ? t('auth.no_account') : t('auth.has_account')}
        </button>
      </motion.div>
    </div>
  );
};

export default Auth;

function DesktopAuthLayout(props: any) {
  const {
    isLogin, setIsLogin, email, setEmail, password, setPassword,
    name, setName, loading, termsAccepted, setTermsAccepted,
    googleLoading, setGoogleLoading, handleSubmit,
    handleTelegramLogin, setTelegramStep, isPartner, toast, t,
  } = props;

  const BLUE = '#2563EB';
  const BORDER = '#e5e7eb';
  const MUTED = '#6b7280';

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/profile`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
      setGoogleLoading(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 16,
    border: `1px solid ${BORDER}`, borderRadius: 12,
    padding: '16px 20px', cursor: 'pointer', background: '#fff',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };
  const onCardHover = (e: any, on: boolean) => {
    e.currentTarget.style.borderColor = on ? BLUE : BORDER;
    e.currentTarget.style.boxShadow = on ? '0 4px 14px rgba(37,99,235,0.08)' : 'none';
  };
  const iconCircle = (bg: string, extra: React.CSSProperties = {}): React.CSSProperties => ({
    width: 48, height: 48, borderRadius: 12, background: bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...extra,
  });

  const avatars = [
    { l: 'А', c: '#f59e0b' },
    { l: 'Б', c: '#3b82f6' },
    { l: 'В', c: '#10b981' },
    { l: 'Г', c: '#f87171' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '60% 40%', background: '#fff' }}>
      {/* LEFT */}
      <div style={{
        position: 'relative',
        backgroundImage: "url(https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200)",
        backgroundSize: 'cover', backgroundPosition: 'center',
        display: 'flex', flexDirection: 'column', padding: '40px 56px', color: '#fff', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span style={{ color: '#fff' }}>TUT</span><span style={{ color: BLUE }}>GO</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>Уже есть аккаунт?</span>
            <button onClick={() => setIsLogin(true)} style={{
              padding: '8px 20px', border: '1px solid rgba(255,255,255,0.6)', background: 'transparent',
              color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>Войти</button>
          </div>
        </div>

        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 520 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
            padding: '6px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.4)',
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', fontSize: 13, marginBottom: 24,
          }}>
            <Star size={14} fill="#fff" /> Лучший сервис для бронирования услуг
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.15, margin: 0, marginBottom: 18 }}>
            Красота и забота<br /><span style={{ color: BLUE }}>рядом с вами</span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', margin: 0, marginBottom: 32, lineHeight: 1.55 }}>
            Находите лучшие места, проверяйте свободное время и записывайтесь онлайн
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              { Icon: MapPin, title: 'Удобный поиск', desc: 'Находите лучшие заведения рядом с вами' },
              { Icon: Calendar, title: 'Онлайн-запись', desc: 'Мгновенное подтверждение и напоминания' },
              { Icon: Shield, title: 'Проверенные места', desc: 'Только реальные отзывы и рейтинги' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex' }}>
            {avatars.map((a, i) => (
              <div key={i} style={{
                width: 36, height: 36, borderRadius: '50%', background: a.c, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600, border: '2px solid #fff',
                marginLeft: i > 0 ? -10 : 0,
              }}>{a.l}</div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
            <div style={{ fontWeight: 600 }}>Более 10 000 пользователей</div>
            <div style={{ color: 'rgba(255,255,255,0.7)' }}>доверяют TutGo</div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#fff' }}>
        <div style={{ maxWidth: 440, width: '100%', margin: '0 auto' }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#111', margin: 0, marginBottom: 8, textAlign: 'center' }}>
            Добро пожаловать в TutGo!
          </h2>
          <p style={{ fontSize: 14, color: MUTED, margin: 0, marginBottom: 28, textAlign: 'center' }}>
            Выберите удобный способ для начала работы
          </p>

          {isLogin ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ border: '1px solid #2AABEE33', borderRadius: 12, overflow: 'hidden' }}>
                  <button
                    style={{ width: '100%', padding: '14px 20px', background: 'white', border: 'none', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: '#111827' }}
                    onClick={handleTelegramLogin}
                  >
                    <Send size={18} color="#2AABEE" />
                    Войти через Telegram
                  </button>
                  <button
                    style={{ width: '100%', padding: '10px 20px', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, color: '#2AABEE' }}
                    onClick={() => setTelegramStep('phone_input')}
                  >
                    <Phone size={14} color="#2AABEE" />
                    или по номеру телефона
                  </button>
                </div>

                <div style={cardStyle} onMouseEnter={(e) => onCardHover(e, true)} onMouseLeave={(e) => onCardHover(e, false)}
                  onClick={handleGoogle}>
                  <div style={iconCircle('#fff', { border: `1px solid ${BORDER}` })}>
                    <svg width="22" height="22" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Войти с Google</div>
                    <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>Используйте свой аккаунт Google для быстрого входа</div>
                  </div>
                  <ChevronRight size={18} color="#9ca3af" />
                </div>

                <div style={cardStyle} onMouseEnter={(e) => onCardHover(e, true)} onMouseLeave={(e) => onCardHover(e, false)}
                  onClick={() => toast({ title: 'Скоро', description: 'Apple ID появится позже' })}>
                  <div style={iconCircle('#000')}>
                    <svg viewBox="0 0 24 24" fill="white" width="22" height="22"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Войти с Apple</div>
                    <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>Используйте свой Apple ID для входа в систему</div>
                  </div>
                  <ChevronRight size={18} color="#9ca3af" />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
                <div style={{ flex: 1, height: 1, background: BORDER }} />
                <span style={{ fontSize: 12, color: MUTED }}>или</span>
                <div style={{ flex: 1, height: 1, background: BORDER }} />
              </div>

              <button onClick={() => setIsLogin(false)} style={{
                width: '100%', height: 48, borderRadius: 10, border: `1px solid ${BLUE}`,
                background: '#fff', color: BLUE, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <UserPlus size={18} /> Создать новый аккаунт
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="text" placeholder={t('auth.your_name')} value={name} onChange={(e) => setName(e.target.value)}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                style={{ width: '100%', background: '#f9fafb', border: '1px solid #e5e7eb', color: '#111827', borderRadius: 8, padding: '12px 16px', fontSize: 14, outline: 'none' }} />
              <input type="email" placeholder={t('auth.email')} required value={email} onChange={(e) => setEmail(e.target.value)}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                style={{ width: '100%', background: '#f9fafb', border: '1px solid #e5e7eb', color: '#111827', borderRadius: 8, padding: '12px 16px', fontSize: 14, outline: 'none' }} />
              <input type="password" placeholder={t('auth.password')} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                style={{ width: '100%', background: '#f9fafb', border: '1px solid #e5e7eb', color: '#111827', borderRadius: 8, padding: '12px 16px', fontSize: 14, outline: 'none' }} />
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
                <Checkbox checked={termsAccepted} onCheckedChange={(v) => setTermsAccepted(v === true)} style={{ marginTop: 2 }} />
                <span>
                  {isPartner ? <>Я принимаю <Link to="/terms-partner" style={{ color: BLUE }}>Соглашение с партнёрами</Link> и <Link to="/privacy" style={{ color: BLUE }}>Политику конфиденциальности</Link></>
                    : <>Мне исполнилось 18 лет, и я принимаю <Link to="/terms" style={{ color: BLUE }}>Условия использования</Link> и <Link to="/privacy" style={{ color: BLUE }}>Политику конфиденциальности</Link></>}
                </span>
              </label>
              <button type="submit" disabled={loading || !termsAccepted} style={{
                width: '100%', height: 48, borderRadius: 10, border: 'none', background: BLUE, color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading || !termsAccepted ? 0.5 : 1, marginTop: 4,
              }}>{loading ? '...' : t('btn.register')}</button>
              <button type="button" onClick={() => setIsLogin(true)} style={{
                background: 'none', border: 'none', color: MUTED, fontSize: 13, cursor: 'pointer', marginTop: 4,
              }}>{t('auth.has_account')}</button>
            </form>
          )}

          <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 28, lineHeight: 1.6 }}>
            Продолжая, вы соглашаетесь с нашими{' '}
            <Link to="/terms" style={{ color: BLUE }}>Пользовательским соглашением</Link>{' '}и{' '}
            <Link to="/privacy" style={{ color: BLUE }}>Политикой конфиденциальности</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
