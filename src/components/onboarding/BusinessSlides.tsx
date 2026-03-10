import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const ACCENT_GREEN = '#00ff87';
const ACCENT_BLUE = '#00c6ff';
const ACCENT_ORANGE = '#f59e0b';
const ACCENT_YELLOW = '#facc15';
const ACCENT_PURPLE = '#a78bfa';
const ACCENT_PINK = '#f43f5e';

/* ─── Animated Counter ─── */
const Counter = ({ end, duration = 1.5, prefix = '', suffix = '', color }: {
  end: number; duration?: number; prefix?: string; suffix?: string; color: string;
}) => {
  const [val, setVal] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    const startTime = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * end));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [end, duration]);
  return <span style={{ color }}>{prefix}{val.toLocaleString('ru-RU')}{suffix}</span>;
};

/* ─── SLIDE 1: Dashboard ─── */
export const DashboardSlide = () => {
  const stats = [
    { icon: '💰', label: 'Доход сегодня', end: 1250000, suffix: ' сум', color: ACCENT_GREEN, glow: 'rgba(0,255,135,0.25)' },
    { icon: '📅', label: 'Записей', end: 12, suffix: '', color: ACCENT_BLUE, glow: 'rgba(0,198,255,0.25)' },
    { icon: '🎟️', label: 'В очереди', end: 5, suffix: '', color: ACCENT_ORANGE, glow: 'rgba(245,158,11,0.25)' },
    { icon: '⭐', label: 'Рейтинг', end: 49, suffix: '', color: ACCENT_YELLOW, glow: 'rgba(250,204,21,0.25)' },
  ];
  const bars = [30, 45, 38, 55, 42, 60, 82];
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="w-full max-w-[380px] mx-auto relative">
      {/* Ambient glow */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full blur-[100px] opacity-30"
        style={{ background: `radial-gradient(circle, ${ACCENT_GREEN}, transparent)` }} />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
        {stats.map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.12, type: 'spring', stiffness: 200, damping: 20 }}
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: '#0d1520' }}>
            {/* Top colored line */}
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: s.color, boxShadow: `0 0 12px ${s.glow}` }} />
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-bold tracking-tight">
              {s.label === 'Рейтинг'
                ? <span style={{ color: s.color }}>4.9</span>
                : <Counter end={s.end} suffix={s.suffix} color={s.color} />
              }
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="rounded-2xl p-4 relative overflow-hidden" style={{ background: '#0d1520' }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${ACCENT_GREEN}, ${ACCENT_BLUE})` }} />
        <p className="text-[11px] text-gray-500 mb-3">Доход за 7 дней</p>
        <div className="flex items-end gap-2 h-28">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                className="w-full rounded-md relative"
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 0.8 + i * 0.08, type: 'spring', stiffness: 150, damping: 15 }}
                style={{
                  background: i === 6
                    ? `linear-gradient(180deg, ${ACCENT_GREEN}, ${ACCENT_GREEN}88)`
                    : '#1a2940',
                  boxShadow: i === 6 ? `0 0 20px ${ACCENT_GREEN}40` : 'none',
                }}
              />
              <span className="text-[9px] text-gray-600">{days[i]}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Floating badges */}
      <motion.div
        initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2, type: 'spring' }}
        className="absolute -left-2 top-[38%] z-20 px-3 py-1.5 rounded-full text-[11px] font-bold text-black"
        style={{ background: ACCENT_GREEN, boxShadow: `0 4px 20px ${ACCENT_GREEN}50` }}>
        🔥 +23% за неделю
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.4, type: 'spring' }}
        className="absolute -right-2 top-[30%] z-20 px-3 py-1.5 rounded-full text-[11px] font-bold"
        style={{ background: '#0d1520', border: `1px solid ${ACCENT_BLUE}`, color: ACCENT_BLUE, boxShadow: `0 4px 20px ${ACCENT_BLUE}30` }}>
        👥 340 клиентов
      </motion.div>
    </div>
  );
};

/* ─── SLIDE 2: Features Grid ─── */
export const FeaturesSlide = () => {
  const features = [
    { icon: '📅', title: 'Журнал записей', sub: 'Все записи в одном месте', color: ACCENT_GREEN },
    { icon: '👥', title: 'Клиентская база', sub: 'CRM — 340 клиентов', color: ACCENT_BLUE },
    { icon: '💰', title: 'Финансы', sub: 'Доход и аналитика', color: ACCENT_ORANGE },
    { icon: '🍽️', title: 'QR Меню для кафе', sub: '42 блюда, заказ со стола', color: ACCENT_PURPLE },
    { icon: '🎟️', title: 'Живая очередь', sub: 'Без ожидания в очереди', color: ACCENT_PINK },
    { icon: '📦', title: 'Склад', sub: 'Учёт товаров и остатков', color: ACCENT_YELLOW },
  ];

  return (
    <div className="w-full max-w-[340px] mx-auto relative">
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[250px] h-[180px] rounded-full blur-[90px] opacity-20"
        style={{ background: `radial-gradient(circle, ${ACCENT_BLUE}, transparent)` }} />
      <div className="grid grid-cols-2 gap-3 relative z-10">
        {features.map((f, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 40, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.1, type: 'spring', stiffness: 180, damping: 18 }}
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: '#0d1520' }}>
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: f.color, boxShadow: `0 0 10px ${f.color}40` }} />
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-2"
              style={{ background: `${f.color}18` }}>
              {f.icon}
            </div>
            <p className="text-white text-[13px] font-semibold leading-tight">{f.title}</p>
            <p className="text-[11px] mt-0.5" style={{ color: `${f.color}cc` }}>{f.sub}</p>
          </motion.div>
        ))}
      </div>
      {/* Bottom banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, type: 'spring' }}
        className="mt-4 py-3 rounded-2xl text-center text-[13px] font-bold text-black relative z-10"
        style={{ background: `linear-gradient(135deg, ${ACCENT_GREEN}, ${ACCENT_BLUE})`, boxShadow: `0 4px 30px ${ACCENT_GREEN}30` }}>
        🎉 Всё бесплатно для вашего бизнеса!
      </motion.div>
    </div>
  );
};

/* ─── SLIDE 3: Telegram Phone ─── */
export const TelegramSlide = () => (
  <div className="w-full max-w-[320px] mx-auto relative">
    {/* Ambient glow */}
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[250px] h-[200px] rounded-full blur-[100px] opacity-20"
      style={{ background: `radial-gradient(circle, #2AABEE, transparent)` }} />

    {/* Phone frame */}
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 150, damping: 20 }}
      className="rounded-[28px] p-1 relative z-10"
      style={{ background: 'linear-gradient(160deg, #1a2940, #0d1520)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
      <div className="rounded-[24px] overflow-hidden" style={{ background: '#0c1018' }}>
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ background: '#111b2a', borderBottom: '1px solid #1a2940' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: '#2AABEE' }}>T</div>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold">TutGo Bot</p>
            <p className="text-[10px] text-gray-500">@TutGoUzBot · онлайн</p>
          </div>
          {/* Telegram logo */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#2AABEE', boxShadow: '0 4px 20px rgba(42,171,238,0.4)' }}>
            <span className="text-sm">✈️</span>
          </motion.div>
        </div>

        {/* Messages */}
        <div className="px-4 py-4 space-y-3 min-h-[240px]">
          {/* Main notification */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: '#111b2a' }}>
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full" style={{ background: ACCENT_GREEN }} />
            <p className="text-white text-[13px] leading-relaxed pl-2 whitespace-pre-line">
              {"🔔 Новая запись!\n\n👤 Алишер К.\n📅 12 марта · 14:00\n🔧 Стрижка\n💰 150 000 сум"}
            </p>
            {/* Action buttons */}
            <div className="flex gap-2 mt-3 pl-2">
              <div className="flex-1 py-2 rounded-xl text-[11px] font-semibold text-center text-black"
                style={{ background: ACCENT_GREEN }}>
                ✅ Подтвердить
              </div>
              <div className="flex-1 py-2 rounded-xl text-[11px] font-semibold text-center"
                style={{ background: '#1a2940', color: '#ff6b6b' }}>
                ❌ Отменить
              </div>
            </div>
          </motion.div>

          {/* Second notification */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1.0, type: 'spring', stiffness: 200, damping: 20 }}
            className="rounded-2xl px-4 py-3"
            style={{ background: '#111b2a' }}>
            <p className="text-[12px]" style={{ color: ACCENT_BLUE }}>
              ⏰ Напоминание клиенту отправлено
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5">Алишер К. · за 1 час до записи</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  </div>
);
