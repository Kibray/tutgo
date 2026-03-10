import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const GREEN = '#00ff87';
const BLUE = '#00c6ff';
const PINK = '#f472b6';
const SKY = '#60a5fa';
const ORANGE = '#fb923c';

/* ─── Shared Phone Mockup ─── */
const PhoneMockup = ({ children }: { children: React.ReactNode }) => (
  <div className="relative w-[240px] h-[480px] rounded-[28px] overflow-hidden flex-shrink-0"
    style={{ background: '#0a0f1a', border: '2px solid #1a2940', boxShadow: '0 0 60px rgba(0,200,255,0.08)' }}>
    {/* Notch */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 rounded-b-xl z-10" style={{ background: '#060810' }} />
    <div className="w-full h-full overflow-hidden">
      {children}
    </div>
  </div>
);

/* ─── Floating Badge ─── */
const Badge = ({ text, color, position, delay = 0 }: {
  text: string; color: string;
  position: 'top-right' | 'bottom-left' | 'top-left' | 'bottom-right' | 'right' | 'left';
  delay?: number;
}) => {
  const pos: Record<string, string> = {
    'top-right': '-top-2 -right-4 lg:-right-12',
    'bottom-left': '-bottom-2 -left-4 lg:-left-12',
    'top-left': '-top-2 -left-4 lg:-left-12',
    'bottom-right': '-bottom-2 -right-4 lg:-right-12',
    'right': 'top-1/3 -right-4 lg:-right-14',
    'left': 'bottom-1/3 -left-4 lg:-left-14',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 + delay, type: 'spring', stiffness: 200 }}
      className={`absolute ${pos[position]} z-20`}>
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, delay }}
        className="px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap shadow-lg"
        style={{ background: `${color}20`, border: `1px solid ${color}50`, color, backdropFilter: 'blur(8px)' }}>
        {text}
      </motion.div>
    </motion.div>
  );
};

/* ─── Gradient Text ─── */
const GradientText = ({ children, from, to }: { children: React.ReactNode; from: string; to: string }) => (
  <span style={{ background: `linear-gradient(135deg, ${from}, ${to})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
    {children}
  </span>
);

/* ─── Feature List ─── */
const FeatureList = ({ items, color }: { items: string[]; color: string }) => (
  <div className="space-y-2 mt-4">
    {items.map((item, i) => (
      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.1 }}
        className="flex items-center gap-2 text-[13px] text-gray-300">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
        {item}
      </motion.div>
    ))}
  </div>
);

/* ═══════════════════════════════════════ */
/* SLIDE 1 — Tours 🌍                     */
/* ═══════════════════════════════════════ */
const ToursPhone = () => {
  const [selectedDate, setSelectedDate] = useState(1);
  return (
    <div className="h-full flex flex-col text-[11px]">
      {/* Header */}
      <div className="pt-7 px-3 pb-3" style={{ background: 'linear-gradient(180deg, #0a2a1a 0%, #0a0f1a 100%)' }}>
        <div className="text-lg mb-0.5">🏔️</div>
        <p className="text-white font-bold text-[13px]">Туры по Узбекистану</p>
        <p className="text-gray-400 text-[10px]">⭐ 4.9 · 12 направлений</p>
      </div>
      {/* Tours list */}
      <div className="px-3 py-2 space-y-2 flex-1">
        <div className="rounded-xl p-2.5" style={{ background: `${GREEN}15`, border: `1px solid ${GREEN}40` }}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white font-semibold text-[11px]">🏔️ Самарканд 3 дня</p>
              <p style={{ color: GREEN }} className="font-bold text-[12px]">890 000 сум</p>
            </div>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: GREEN }}>✅</div>
          </div>
        </div>
        <div className="rounded-xl p-2.5" style={{ background: '#111b2a', border: '1px solid #1a2940' }}>
          <p className="text-white font-semibold text-[11px]">🏛️ Бухара 2 дня</p>
          <p className="text-gray-400 text-[12px]">650 000 сум</p>
        </div>
        {/* Date picker */}
        <div className="flex gap-1.5 mt-3">
          {['Пн10', 'Вт11', 'Ср12', 'Чт13'].map((d, i) => (
            <button key={d} onClick={() => setSelectedDate(i)}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all"
              style={{
                background: i === selectedDate ? GREEN : '#111b2a',
                color: i === selectedDate ? '#000' : '#9ca3af',
                border: `1px solid ${i === selectedDate ? GREEN : '#1a2940'}`,
              }}>{d}</button>
          ))}
        </div>
        {/* Book button */}
        <button className="w-full py-2 rounded-xl text-[11px] font-bold text-black mt-2" style={{ background: GREEN }}>
          ✅ Забронировать
        </button>
      </div>
    </div>
  );
};

export const ToursSlide = () => (
  <div className="relative">
    <PhoneMockup><ToursPhone /></PhoneMockup>
    <Badge text="🌍 12 туров" color={GREEN} position="top-right" />
    <Badge text="✅ Гид включён" color={GREEN} position="bottom-left" delay={0.2} />
  </div>
);

export const ToursText = () => (
  <div>
    <h2 className="text-xl lg:text-2xl font-bold text-white mb-2">
      Бронируй туры онлайн <GradientText from={GREEN} to={BLUE}>за 1 клик</GradientText>
    </h2>
    <p className="text-gray-400 text-sm leading-relaxed mb-1">
      Выбери направление, дату и количество гостей. Никаких звонков туроператорам!
    </p>
    <FeatureList color={GREEN} items={[
      '12 направлений по Узбекистану',
      'Авиа + отель + гид в одном пакете',
      'Мгновенное подтверждение',
      'Отмена за 48 часов бесплатно',
    ]} />
  </div>
);

/* ═══════════════════════════════════════ */
/* SLIDE 2 — Barbershop 💈                */
/* ═══════════════════════════════════════ */
const BarberPhone = () => {
  const [selectedSlot, setSelectedSlot] = useState(2);
  return (
    <div className="h-full flex flex-col text-[11px]">
      <div className="pt-7 px-3 pb-3" style={{ background: 'linear-gradient(180deg, #2a0a1a 0%, #0a0f1a 100%)' }}>
        <div className="text-lg mb-0.5">💈</div>
        <p className="text-white font-bold text-[13px]">Barbershop Kings</p>
        <p className="text-gray-400 text-[10px]">⭐ 5.0 · 0.8 км</p>
      </div>
      <div className="px-3 py-2 flex-1">
        {/* Categories */}
        <div className="flex gap-1.5 mb-2">
          {[{ e: '💈', t: 'Барбершоп', active: true }, { e: '💆', t: 'СПА' }, { e: '💅', t: 'Ногти' }].map((c) => (
            <div key={c.t} className="px-2 py-1 rounded-lg text-[9px] font-medium"
              style={{ background: c.active ? `${PINK}30` : '#111b2a', color: c.active ? PINK : '#9ca3af', border: `1px solid ${c.active ? `${PINK}60` : '#1a2940'}` }}>
              {c.e} {c.t} {c.active && '✅'}
            </div>
          ))}
        </div>
        {/* Masters */}
        <div className="space-y-1.5 mb-2">
          <div className="rounded-xl p-2" style={{ background: `${PINK}15`, border: `1px solid ${PINK}40` }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px]" style={{ background: '#2a0a1a' }}>👨‍🦱</div>
              <div className="flex-1">
                <p className="text-white font-semibold text-[10px]">Бахром · <span className="text-yellow-400">⭐⭐⭐⭐⭐</span></p>
                <p className="text-gray-400 text-[9px]">Стрижка + борода</p>
              </div>
              <p style={{ color: PINK }} className="font-bold text-[10px]">120 000</p>
            </div>
          </div>
          <div className="rounded-xl p-2" style={{ background: '#111b2a', border: '1px solid #1a2940' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px]" style={{ background: '#111b2a' }}>👨‍💼</div>
              <div className="flex-1">
                <p className="text-white font-semibold text-[10px]">Санжар · <span className="text-yellow-400">⭐⭐⭐⭐</span></p>
                <p className="text-gray-400 text-[9px]">Стрижка</p>
              </div>
              <p className="text-gray-400 font-bold text-[10px]">80 000</p>
            </div>
          </div>
        </div>
        {/* Slots */}
        <div className="flex gap-1.5 mb-2">
          {['10:00', '11:00', '14:00', '15:00'].map((t, i) => (
            <button key={t} onClick={() => setSelectedSlot(i)}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all"
              style={{
                background: i === selectedSlot ? PINK : '#111b2a',
                color: i === selectedSlot ? '#000' : '#9ca3af',
                border: `1px solid ${i === selectedSlot ? PINK : '#1a2940'}`,
              }}>{t} {i === selectedSlot && '✅'}</button>
          ))}
        </div>
        <button className="w-full py-2 rounded-xl text-[11px] font-bold text-black" style={{ background: PINK }}>
          ✅ Записаться
        </button>
      </div>
    </div>
  );
};

export const BarberSlide = () => (
  <div className="relative">
    <PhoneMockup><BarberPhone /></PhoneMockup>
    <Badge text="💈 Топ мастера" color={PINK} position="right" />
    <Badge text="⏱ 14:00 свободно" color={PINK} position="left" delay={0.2} />
  </div>
);

export const BarberText = () => (
  <div>
    <h2 className="text-xl lg:text-2xl font-bold text-white mb-2">
      <GradientText from={PINK} to="#a855f7">Барбершопы, СПА и салоны красоты</GradientText>
    </h2>
    <p className="text-gray-400 text-sm leading-relaxed mb-1">
      Выбери мастера, посмотри отзывы и запишись на удобное время. Без очередей!
    </p>
    <FeatureList color={PINK} items={[
      'Барбершопы, салоны, СПА, массаж',
      'Рейтинг и отзывы каждого мастера',
      'Фото работ мастера перед записью',
      'Напоминание за 1 час в Telegram',
    ]} />
  </div>
);

/* ═══════════════════════════════════════ */
/* SLIDE 3 — Dental 🦷                    */
/* ═══════════════════════════════════════ */
const DentalPhone = () => {
  const [selectedSlot, setSelectedSlot] = useState(2);
  return (
    <div className="h-full flex flex-col text-[11px]">
      <div className="pt-7 px-3 pb-3" style={{ background: 'linear-gradient(180deg, #0a1a2a 0%, #0a0f1a 100%)' }}>
        <div className="text-lg mb-0.5">🦷</div>
        <p className="text-white font-bold text-[13px]">Dental Pro Clinic</p>
        <p className="text-gray-400 text-[10px]">⭐ 4.9 · 200+ отзывов</p>
      </div>
      <div className="px-3 py-2 flex-1">
        {/* Services */}
        <div className="space-y-1.5 mb-2">
          {[
            { e: '🦷', n: 'Чистка зубов', p: '150 000', active: false },
            { e: '😁', n: 'Отбеливание', p: '350 000', active: true },
            { e: '🔧', n: 'Лечение кариеса', p: '200 000', active: false },
          ].map((s) => (
            <div key={s.n} className="rounded-xl p-2 flex items-center justify-between"
              style={{ background: s.active ? `${SKY}15` : '#111b2a', border: `1px solid ${s.active ? `${SKY}40` : '#1a2940'}` }}>
              <span className="text-white text-[10px]">{s.e} {s.n}</span>
              <span className="text-[10px] font-bold" style={{ color: s.active ? SKY : '#9ca3af' }}>{s.p}{s.active && ' ✅'}</span>
            </div>
          ))}
        </div>
        {/* Doctor */}
        <div className="rounded-xl p-2 mb-2 flex items-center gap-2" style={{ background: '#111b2a', border: '1px solid #1a2940' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: '#0a1a2a' }}>👨‍⚕️</div>
          <div>
            <p className="text-white font-semibold text-[10px]">Dr. Камолов <span className="text-yellow-400">⭐⭐⭐⭐⭐</span></p>
            <p className="text-gray-400 text-[9px]">Стоматолог · 10 лет опыта</p>
          </div>
        </div>
        {/* Slots */}
        <div className="flex gap-1.5 mb-2">
          {['09:00', '10:00', '11:00', '13:00'].map((t, i) => (
            <button key={t} onClick={() => setSelectedSlot(i)}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all"
              style={{
                background: i === selectedSlot ? SKY : '#111b2a',
                color: i === selectedSlot ? '#000' : '#9ca3af',
                border: `1px solid ${i === selectedSlot ? SKY : '#1a2940'}`,
              }}>{t} {i === selectedSlot && '✅'}</button>
          ))}
        </div>
        <button className="w-full py-2 rounded-xl text-[11px] font-bold text-black" style={{ background: SKY }}>
          ✅ Записаться к врачу
        </button>
      </div>
    </div>
  );
};

export const DentalSlide = () => (
  <div className="relative">
    <PhoneMockup><DentalPhone /></PhoneMockup>
    <Badge text="🦷 20+ врачей" color={SKY} position="top-right" />
    <Badge text="🏥 Онлайн запись" color={SKY} position="bottom-left" delay={0.2} />
  </div>
);

export const DentalText = () => (
  <div>
    <h2 className="text-xl lg:text-2xl font-bold text-white mb-2">
      <GradientText from={SKY} to={BLUE}>Врачи и стоматология онлайн</GradientText>
    </h2>
    <p className="text-gray-400 text-sm leading-relaxed mb-1">
      Запишись к врачу без звонков. Выбери специалиста и подтверди запись за 30 секунд!
    </p>
    <FeatureList color={SKY} items={[
      'Стоматология, терапевты, педиатры',
      'Фото и отзывы каждого врача',
      'Онлайн запись 24/7',
      'Напоминание о визите в Telegram',
    ]} />
  </div>
);

/* ═══════════════════════════════════════ */
/* SLIDE 4 — Café ☕                       */
/* ═══════════════════════════════════════ */
const CafePhone = () => {
  const [qty, setQty] = useState(2);
  return (
    <div className="h-full flex flex-col text-[11px]">
      <div className="pt-7 px-3 pb-3" style={{ background: 'linear-gradient(180deg, #1a140a 0%, #0a0f1a 100%)' }}>
        <div className="text-lg mb-0.5">☕</div>
        <p className="text-white font-bold text-[13px]">Café Milano · Столик №5</p>
        <p className="text-gray-400 text-[10px]">⭐ 4.9 · 42 блюда</p>
      </div>
      <div className="px-3 py-2 flex-1">
        {/* Categories */}
        <div className="flex gap-1.5 mb-2">
          {[{ e: '☕', t: 'Напитки', active: true }, { e: '🥗', t: 'Салаты' }, { e: '🍕', t: 'Пицца' }].map((c) => (
            <div key={c.t} className="px-2 py-1 rounded-lg text-[9px] font-medium"
              style={{ background: c.active ? `${ORANGE}30` : '#111b2a', color: c.active ? ORANGE : '#9ca3af', border: `1px solid ${c.active ? `${ORANGE}60` : '#1a2940'}` }}>
              {c.e} {c.t} {c.active && '✅'}
            </div>
          ))}
        </div>
        {/* Items */}
        <div className="space-y-1.5 mb-2">
          <div className="rounded-xl p-2" style={{ background: `${ORANGE}15`, border: `1px solid ${ORANGE}40` }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-semibold text-[10px]">☕ Капучино</p>
                <p className="text-gray-500 text-[9px]">250мл · 120ккал</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-5 h-5 rounded text-[10px] flex items-center justify-center" style={{ background: '#1a2940', color: '#9ca3af' }}>−</button>
                <span className="text-white text-[10px] w-4 text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-5 h-5 rounded text-[10px] flex items-center justify-center" style={{ background: ORANGE, color: '#000' }}>+</button>
              </div>
            </div>
            <p style={{ color: ORANGE }} className="font-bold text-[10px] mt-0.5">25 000 сум</p>
          </div>
          <div className="rounded-xl p-2" style={{ background: '#111b2a', border: '1px solid #1a2940' }}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white font-semibold text-[10px]">🍵 Чай "Ташкент"</p>
                <p className="text-gray-500 text-[9px]">Фирменный рецепт</p>
              </div>
              <span className="text-gray-400 text-[10px]">18 000</span>
            </div>
          </div>
          <div className="rounded-xl p-2" style={{ background: '#111b2a', border: '1px solid #1a2940' }}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white font-semibold text-[10px]">🍰 Чизкейк</p>
                <p className="text-gray-500 text-[9px]">150г · 380ккал</p>
              </div>
              <span className="text-gray-400 text-[10px]">45 000</span>
            </div>
          </div>
        </div>
        {/* Cart */}
        <div className="rounded-xl p-2 flex items-center justify-between" style={{ background: ORANGE, color: '#000' }}>
          <span className="text-[10px] font-bold">🛒 {qty} блюда · {(25000 * qty).toLocaleString()} сум</span>
          <span className="text-[10px] font-bold">Заказать →</span>
        </div>
      </div>
    </div>
  );
};

export const CafeSlide = () => (
  <div className="relative">
    <PhoneMockup><CafePhone /></PhoneMockup>
    <Badge text="🍽️ QR меню" color={ORANGE} position="right" />
    <Badge text="📲 Без официанта" color={ORANGE} position="left" delay={0.2} />
  </div>
);

export const CafeText = () => (
  <div>
    <h2 className="text-xl lg:text-2xl font-bold text-white mb-2">
      <GradientText from={ORANGE} to="#f59e0b">Меню прямо на столике</GradientText>
    </h2>
    <p className="text-gray-400 text-sm leading-relaxed mb-1">
      Сканируй QR код на столике — меню открывается на телефоне. Заказывай без официанта!
    </p>
    <FeatureList color={ORANGE} items={[
      'QR меню на каждом столике',
      'История и рецепт каждого блюда',
      'Статус заказа в реальном времени',
      'Бронирование столика заранее',
    ]} />
  </div>
);

/* ═══════════════════════════════════════ */
/* SLIDE 5 — Telegram ✈️                   */
/* ═══════════════════════════════════════ */
const TelegramPhone = () => (
  <div className="h-full flex flex-col text-[11px]">
    {/* Chat header */}
    <div className="pt-7 px-3 pb-2 flex items-center gap-2" style={{ background: '#0d1520' }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: '#2AABEE' }}>✈️</div>
      <div>
        <p className="text-white font-bold text-[12px]">@TutGoUzBot</p>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: GREEN }} />
          <span className="text-[9px]" style={{ color: GREEN }}>онлайн</span>
        </div>
      </div>
    </div>
    <div className="flex-1 px-3 py-2 space-y-2">
      {/* Message 1 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="rounded-xl p-2.5 text-[10px] text-white leading-relaxed whitespace-pre-line"
        style={{ background: '#111b2a', border: `1px solid ${GREEN}40` }}>
        {`✅ Запись подтверждена!\n✂️ Barbershop Kings\n📅 12 марта · 14:00\n👨‍🦱 Мастер: Бахром\n💰 120 000 сум`}
        <div className="flex gap-1.5 mt-2">
          <div className="flex-1 py-1 rounded-lg text-center text-[9px] font-medium" style={{ background: `${BLUE}20`, color: BLUE, border: `1px solid ${BLUE}40` }}>🗺️ Маршрут</div>
          <div className="flex-1 py-1 rounded-lg text-center text-[9px] font-medium" style={{ background: '#1a0a0a', color: '#f87171', border: '1px solid #7f1d1d' }}>❌ Отменить</div>
        </div>
      </motion.div>
      {/* Message 2 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="rounded-xl p-2.5 text-[10px] text-white leading-relaxed whitespace-pre-line"
        style={{ background: '#111b2a', border: `1px solid ${BLUE}40` }}>
        {`⏰ Напоминание!\nЧерез 1 час ваша запись:\n✂️ Barbershop Kings · 14:00\n📍 Юнусабад, ул. Темура 5`}
      </motion.div>
    </div>
  </div>
);

export const TelegramClientSlide = () => (
  <div className="relative">
    <PhoneMockup><TelegramPhone /></PhoneMockup>
    {/* Telegram logo */}
    <motion.div
      animate={{ rotate: [-3, 3, -3] }}
      transition={{ repeat: Infinity, duration: 3 }}
      className="absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-xl z-20"
      style={{ background: '#2AABEE', boxShadow: '0 4px 20px rgba(42,171,238,0.4)' }}>
      ✈️
    </motion.div>
    <Badge text="🔔 Мгновенно" color={GREEN} position="bottom-left" delay={0.3} />
  </div>
);

export const TelegramClientText = () => (
  <div>
    <h2 className="text-xl lg:text-2xl font-bold text-white mb-2">
      <GradientText from={GREEN} to={BLUE}>Всё приходит в Telegram</GradientText>
    </h2>
    <p className="text-gray-400 text-sm leading-relaxed mb-1">
      Подтверждение, напоминание за час и ссылка на маршрут — всё в одном чате с @TutGoUzBot!
    </p>
    <FeatureList color={BLUE} items={[
      'Подтверждение сразу после записи',
      'Напоминание за 1 час',
      'Ссылка на Google Maps и Яндекс',
      'Отмена записи прямо из чата',
    ]} />
  </div>
);
