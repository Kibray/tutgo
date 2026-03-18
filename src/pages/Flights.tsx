import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Search, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';
import ComingSoonBanner from '@/components/ComingSoonBanner';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const AIRPORTS = ['Ташкент (TAS)', 'Самарканд (SKD)', 'Бухара (BHK)', 'Навои (NVI)', 'Фергана (FEG)', 'Дубай (DXB)', 'Стамбул (IST)', 'Москва (SVO)'];

const FILTERS = [
  { id: 'all', icon: '✈️', label: 'Все' },
  { id: 'direct', icon: '🚀', label: 'Прямые' },
  { id: 'transfer', icon: '🔄', label: 'С пересадкой' },
  { id: 'morning', icon: '🌅', label: 'Утро' },
  { id: 'evening', icon: '🌆', label: 'Вечер' },
];

const MOCK_FLIGHTS = [
  { id: '1', airline: 'Uzbekistan Airways', logo: '🇺🇿', flight: 'HY005', depart: '08:30', from: 'TAS', arrive: '10:00', to: 'DXB', duration: '3ч 30мин', stops: 0, amenities: ['🧳 Багаж 23кг', '🍽️ Питание', '📺 Экран'], price: 850000, tag: null },
  { id: '2', airline: 'FlyDubai', logo: '🟢', flight: 'FZ707', depart: '14:15', from: 'TAS', arrive: '16:00', to: 'DXB', duration: '3ч 45мин', stops: 0, amenities: ['🧳 Багаж 20кг'], price: 720000, seats: 3, tag: 'Лучшая цена' },
  { id: '3', airline: 'Qatar Airways', logo: '🟣', flight: 'QR343', depart: '23:55', from: 'TAS', arrive: '12:10', to: 'DXB', duration: '9ч 15мин', stops: 1, stopCity: 'DOH', amenities: ['🧳 Багаж 30кг', '🍽️ Питание', '🥂 Бизнес'], price: 1100000, nextDay: true, tag: null },
  { id: '4', airline: 'Turkish Airlines', logo: '🔴', flight: 'TK325', depart: '06:00', from: 'TAS', arrive: '18:30', to: 'DXB', duration: '12ч 30мин', stops: 1, stopCity: 'IST', amenities: ['🧳 Багаж 23кг', '🍽️ Питание'], price: 890000, tag: null },
  { id: '5', airline: 'Air Arabia', logo: '🟠', flight: 'G9411', depart: '22:45', from: 'TAS', arrive: '01:00', to: 'DXB', duration: '3ч 15мин', stops: 0, amenities: ['Нет багажа'], price: 580000, nextDay: true, tag: 'Самый дешёвый' },
];

const comingSoonToast = () => toast('🚧 Скоро будет доступно', { description: 'Раздел в разработке — следите за обновлениями!' });

const Flights = () => {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = MOCK_FLIGHTS.filter(f => {
    if (activeFilter === 'direct') return f.stops === 0;
    if (activeFilter === 'transfer') return f.stops > 0;
    if (activeFilter === 'morning') return parseInt(f.depart) >= 5 && parseInt(f.depart) < 12;
    if (activeFilter === 'evening') return parseInt(f.depart) >= 18 || parseInt(f.depart) < 5;
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">✈️ Авиабилеты</h1>
        </div>
      </div>

      <ComingSoonBanner feature="flights" />

      <div className={cn('px-4 py-4 space-y-4', isDesktop && 'max-w-3xl mx-auto')}>
        {/* Search form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Откуда</span>
                <select className="w-full h-10 pl-16 pr-3 rounded-xl bg-muted border border-border text-sm text-foreground appearance-none cursor-not-allowed opacity-70" disabled>
                  {AIRPORTS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Куда</span>
                <select className="w-full h-10 pl-16 pr-3 rounded-xl bg-muted border border-border text-sm text-foreground appearance-none cursor-not-allowed opacity-70" disabled defaultValue="Дубай (DXB)">
                  {AIRPORTS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button onClick={comingSoonToast} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground opacity-70">📅 Дата вылета</div>
            <div className="flex-1 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground opacity-70">👥 1 пассажир</div>
          </div>
          <Button onClick={comingSoonToast} className="w-full gap-2 opacity-80" disabled>
            <Search className="w-4 h-4" /> Найти билеты
          </Button>
        </motion.div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                activeFilter === f.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">{filtered.length} рейсов найдено</p>

        {/* Flight cards */}
        <div className="space-y-3">
          {filtered.map((flight, i) => (
            <motion.div
              key={flight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border p-4 space-y-3 relative"
            >
              {flight.tag && (
                <Badge className={cn(
                  "absolute -top-2 right-3 text-[10px] border-0",
                  flight.tag === 'Лучшая цена' ? 'bg-primary text-primary-foreground' : 'bg-orange-500 text-white'
                )}>
                  {flight.tag}
                </Badge>
              )}

              <div className="flex items-center gap-2">
                <span className="text-lg">{flight.logo}</span>
                <span className="text-sm font-medium text-foreground">{flight.airline}</span>
                <span className="text-xs text-muted-foreground">{flight.flight}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-center">
                  <p className="text-xl font-bold text-foreground">{flight.depart}</p>
                  <p className="text-[10px] text-muted-foreground">{flight.from}</p>
                </div>
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex items-center">
                    <div className="h-px flex-1 bg-border" />
                    <span className="px-1 text-xs">✈️</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{flight.duration}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {flight.stops === 0 ? 'Прямой рейс' : `${flight.stops} пересадка${(flight as any).stopCity ? ` ${(flight as any).stopCity}` : ''}`}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-primary">
                    {flight.arrive}
                    {(flight as any).nextDay && <sup className="text-[10px] text-muted-foreground">+1</sup>}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{flight.to}</p>
                </div>
              </div>

              <div className="flex gap-1 flex-wrap">
                {flight.amenities.map((a, j) => (
                  <Badge key={j} variant="outline" className="text-[10px] border-border">{a}</Badge>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-lg font-bold text-primary">{flight.price.toLocaleString()} сум</p>
                  {(flight as any).seats && (
                    <p className="text-[10px] text-orange-400">⚠️ Осталось {(flight as any).seats} места</p>
                  )}
                </div>
                <Button size="sm" onClick={comingSoonToast} className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(200,100%,50%)] text-primary-foreground opacity-80">
                  Выбрать →
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {!isDesktop && <BottomNav />}
    </div>
  );
};

export default Flights;
