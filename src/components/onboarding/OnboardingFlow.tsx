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

/* ─── Illustrations (inline SVG) ─── */
const MapIllustration = () => (
  <div className="relative w-full max-w-[320px] h-[220px] mx-auto">
    <svg viewBox="0 0 320 220" fill="none" className="w-full h-full">
      <rect width="320" height="220" rx="16" fill="#0d1520" />
      <path d="M0 80 Q80 60 160 90 T320 70 V220 H0Z" fill="#111b2a" opacity="0.6" />
      <path d="M40 140 Q120 110 200 130 T320 120 V220 H0Z" fill="#0f1825" opacity="0.4" />
      {/* Roads */}
      <line x1="60" y1="40" x2="260" y2="180" stroke="#1a2940" strokeWidth="2" />
      <line x1="30" y1="140" x2="290" y2="60" stroke="#1a2940" strokeWidth="2" />
      <line x1="160" y1="20" x2="160" y2="200" stroke="#1a2940" strokeWidth="1.5" />
    </svg>
    {/* Pins */}
    {[
      { x: '25%', y: '30%', color: ACCENT_GREEN, label: '💇' },
      { x: '55%', y: '50%', color: ACCENT_BLUE, label: '☕' },
      { x: '75%', y: '35%', color: '#ff6b6b', label: '🏥' },
    ].map((pin, i) => (
      <motion.div key={i} className="absolute flex flex-col items-center"
        style={{ left: pin.x, top: pin.y, transform: 'translate(-50%,-100%)' }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-lg"
          style={{ background: pin.color }}>{pin.label}</div>
        <div className="w-2 h-2 rounded-full mt-0.5" style={{ background: pin.color, opacity: 0.5 }} />
      </motion.div>
    ))}
    {/* Badge */}
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
      className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-[11px] font-semibold text-black"
      style={{ background: ACCENT_GREEN }}>
      🟢 247 компаний онлайн
    </motion.div>
    {/* Search bar */}
    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[85%] h-9 rounded-xl bg-[#111b2a] border border-[#1a2940] flex items-center px-3 gap-2 text-[11px] text-gray-400">
      🔍 Услуги рядом со мной <span className="ml-auto text-[10px]">📍 Ташкент</span>
    </div>
  </div>
);

const BookingIllustration = () => {
  const [selectedSlot, setSelectedSlot] = useState(2);
  return (
    <div className="w-full max-w-[280px] mx-auto rounded-2xl p-4" style={{ background: '#0d1520', border: '1px solid #1a2940' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full" style={{ background: GRADIENT }} />
        <div>
          <p className="text-white text-sm font-semibold">Студия Silk</p>
          <p className="text-gray-400 text-[11px]">⭐ 4.9 · 128 отзывов</p>
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        {['09:00', '10:00', '11:00', '13:00'].map((t, i) => (
          <motion.button key={t}
            animate={i === selectedSlot ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            onClick={() => setSelectedSlot(i)}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
            style={{
              background: i === selectedSlot ? ACCENT_GREEN : '#111b2a',
              color: i === selectedSlot ? '#000' : '#9ca3af',
              border: `1px solid ${i === selectedSlot ? ACCENT_GREEN : '#1a2940'}`,
            }}>
            {t} {i === selectedSlot && '✅'}
          </motion.button>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold" style={{ color: ACCENT_GREEN }}>80 000 сум</span>
        <div className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-black" style={{ background: ACCENT_GREEN }}>
          ✅ Записаться на 11:00
        </div>
      </div>
    </div>
  );
};

const TelegramIllustration = ({ message }: { message: string }) => (
  <div className="w-full max-w-[280px] mx-auto">
    <div className="rounded-2xl p-4 relative" style={{ background: '#0d1520', border: '1px solid #1a2940' }}>
      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: '#2AABEE' }}>
        ✈️
      </div>
      <p className="text-[10px] text-gray-500 mb-2">@TutGoUzBot</p>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="rounded-xl p-3 text-[12px] text-white leading-relaxed whitespace-pre-line"
        style={{ background: '#111b2a' }}>
        {message}
      </motion.div>
      <div className="flex gap-2 mt-3">
        <div className="flex-1 py-1.5 rounded-lg text-[10px] font-medium text-center" style={{ background: '#111b2a', color: ACCENT_BLUE, border: '1px solid #1a2940' }}>
          🗺️ Маршрут
        </div>
        <div className="flex-1 py-1.5 rounded-lg text-[10px] font-medium text-center" style={{ background: '#111b2a', color: '#ff6b6b', border: '1px solid #1a2940' }}>
          ❌ Отменить
        </div>
      </div>
    </div>
  </div>
);

const FeaturesGrid = ({ items }: { items: { emoji: string; title: string; sub: string; color: string }[] }) => (
  <div className="grid grid-cols-2 gap-3 w-full max-w-[300px] mx-auto">
    {items.map((item, i) => (
      <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.15 }}
        className="rounded-xl p-3 text-center" style={{ background: `${item.color}15`, border: `1px solid ${item.color}30` }}>
        <div className="text-2xl mb-1">{item.emoji}</div>
        <p className="text-white text-[11px] font-semibold">{item.title}</p>
        <p className="text-[10px]" style={{ color: item.color }}>{item.sub}</p>
      </motion.div>
    ))}
  </div>
);

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

  const slides = role === 'business' ? businessSlides : clientSlides;
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
            <div className="mb-8">{currentSlide.illustration}</div>
            <h2 className="text-xl font-bold text-white text-center mb-2">{currentSlide.title}</h2>
            <p className="text-gray-400 text-sm text-center max-w-xs">{currentSlide.text}</p>
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
