import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '@/hooks/usePreferences';
import { DashboardSlide, FeaturesSlide, TelegramSlide } from './BusinessSlides';
import {
  ToursSlide, ToursText,
  BarberSlide, BarberText,
  DentalSlide, DentalText,
  CafeSlide, CafeText,
  TelegramClientSlide, TelegramClientText,
} from './ClientSlides';

type Role = 'client' | 'business' | null;

interface Props {
  onComplete: () => void;
  forceRole?: Role;
  isPreview?: boolean;
}

const ONBOARDING_BG = '#060810';
const ACCENT_GREEN = '#00ff87';
const ACCENT_BLUE = '#00c6ff';
const GRADIENT = `linear-gradient(135deg, ${ACCENT_GREEN}, ${ACCENT_BLUE})`;

/* ─── slide variants ─── */
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

/* (Client illustrations moved to ClientSlides.tsx) */

/* ─── Main component ─── */
const OnboardingFlow = ({ onComplete, forceRole, isPreview }: Props) => {
  const navigate = useNavigate();
  const { t } = usePreferences();
  const [role, setRole] = useState<Role>(forceRole || null);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const clientSlides = [
    { phone: <ToursSlide />, text: <ToursText />, isFinal: false },
    { phone: <BarberSlide />, text: <BarberText />, isFinal: false },
    { phone: <DentalSlide />, text: <DentalText />, isFinal: false },
    { phone: <CafeSlide />, text: <CafeText />, isFinal: false },
    { phone: <TelegramClientSlide />, text: <TelegramClientText />, isFinal: true },
  ];

  const businessSlides = [
    {
      illustration: <DashboardSlide />,
      title: 'Управляй бизнесом с телефона',
      text: 'Доход, записи, очередь и рейтинг — всё в одном месте!',
    },
    {
      illustration: <FeaturesSlide />,
      title: 'Полный бизнес инструмент бесплатно!',
      text: 'CRM, склад, QR меню, живая очередь, аналитика — всё включено!',
    },
    {
      illustration: <TelegramSlide />,
      title: 'Записи прямо в Telegram',
      text: 'Новая запись — мгновенное уведомление. Подтверди одним нажатием!',
      isFinal: true,
    },
  ];

  const isClient = role === 'client';
  const slides = isClient ? clientSlides : businessSlides;
  const totalSteps = slides.length;

  const next = useCallback(() => {
    if (step < totalSteps - 1) { setDirection(1); setStep(s => s + 1); }
  }, [step, totalSteps]);

  const prev = useCallback(() => {
    if (step > 0) { setDirection(-1); setStep(s => s - 1); }
    else { setRole(null); }
  }, [step]);

  const finish = useCallback(() => {
    onComplete();
    if (role === 'business') navigate('/partner-landing');
  }, [onComplete, role, navigate]);

  const skip = useCallback(() => { onComplete(); }, [onComplete]);

  /* ─── Role Selection Screen ─── */
  if (!role) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6"
        style={{ background: ONBOARDING_BG }}>
        {/* Logo */}
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-bold text-white mb-1">
            TUT<span style={{ background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GO</span>
          </h1>
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-white text-lg font-semibold mt-4 text-center">
          Добро пожаловать в TutGo!
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-gray-400 text-sm text-center mt-1 mb-8">
          Сервис поиска и онлайн-бронирования услуг Узбекистана
        </motion.p>

        <div className="w-full max-w-sm space-y-3">
          {[
            { id: 'client' as Role, icon: '👤', title: 'Я клиент', desc: 'Ищу услуги и хочу записаться' },
            { id: 'business' as Role, icon: '🏢', title: 'Я владелец бизнеса', desc: 'Хочу привлечь клиентов' },
          ].map((opt, i) => (
            <motion.button key={opt.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setRole(opt.id); setStep(0); setDirection(1); }}
              className="w-full rounded-2xl p-5 flex items-center gap-4 text-left transition-all"
              style={{ background: '#0d1520', border: '1px solid #1a2940' }}>
              <span className="text-3xl">{opt.icon}</span>
              <div>
                <p className="text-white font-semibold">{opt.title}</p>
                <p className="text-gray-400 text-sm">{opt.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {!isPreview && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            onClick={skip} className="mt-8 text-gray-500 text-sm">
            Пропустить
          </motion.button>
        )}
      </motion.div>
    );
  }

  const currentSlide = slides[step];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col" style={{ background: ONBOARDING_BG }}>
      {/* Top bar: dots + skip */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <div key={i} className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 24 : 8,
                background: i === step ? ACCENT_GREEN : '#1a2940',
              }} />
          ))}
        </div>
        {!isPreview && (
          <button onClick={skip} className="text-gray-500 text-sm">Пропустить</button>
        )}
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={step} custom={direction}
            variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="w-full flex flex-col items-center">
            {isClient ? (
              /* Client: phone + text side by side on desktop, stacked on mobile */
              <div className="w-full max-w-3xl flex flex-col lg:flex-row items-center gap-6 lg:gap-12">
                <div className="flex-shrink-0">
                  {(currentSlide as any).phone}
                </div>
                <div className="flex-1 text-center lg:text-left">
                  {(currentSlide as any).text}
                </div>
              </div>
            ) : (
              /* Business: centered illustration + title + text */
              <>
                <div className="mb-8">{'illustration' in currentSlide && (currentSlide as any).illustration}</div>
                <h2 className="text-xl font-bold text-white text-center mb-2">{'title' in currentSlide && (currentSlide as any).title}</h2>
                <p className="text-gray-400 text-sm text-center max-w-xs">{'text' in currentSlide && typeof (currentSlide as any).text === 'string' && (currentSlide as any).text}</p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="px-6 pb-8 flex items-center gap-3">
        <button onClick={prev}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-400 text-lg"
          style={{ background: '#0d1520', border: '1px solid #1a2940' }}>
          ←
        </button>
        <button onClick={currentSlide.isFinal ? finish : next}
          className="flex-1 h-12 rounded-xl font-semibold text-sm text-black"
          style={{ background: GRADIENT }}>
          {currentSlide.isFinal
            ? (role === 'business' ? '🚀 Добавить бизнес!' : '🚀 Начать!')
            : 'Далее →'}
        </button>
      </div>
    </motion.div>
  );
};

export default OnboardingFlow;
