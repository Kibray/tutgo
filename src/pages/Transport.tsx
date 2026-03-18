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

const CITIES = ['Ташкент', 'Самарканд', 'Бухара', 'Хива', 'Навои', 'Фергана', 'Нукус', 'Термез'];

const FILTER_TYPES = [
  { id: 'all', icon: '🚌', label: 'Все' },
  { id: 'bus', icon: '🚌', label: 'Автобус' },
  { id: 'minibus', icon: '🚐', label: 'Минибус' },
  { id: 'suv', icon: '🚙', label: 'Внедорожник' },
];

const MOCK_ROUTES = [
  { id: '1', type: 'bus', icon: '🚌', name: 'Silk Road Express', from: 'Ташкент', to: 'Самарканд', depart: '07:00', arrive: '11:30', duration: '4ч 30мин', price: 85000, seats: 12, amenities: ['🧊 Кондиционер', '📶 Wi-Fi', '🔌 Розетка'] },
  { id: '2', type: 'minibus', icon: '🚐', name: 'Fast Travel', from: 'Ташкент', to: 'Самарканд', depart: '08:30', arrive: '12:00', duration: '3ч 30мин', price: 120000, seats: 4, amenities: ['🧊 Кондиционер', '💺 Комфорт'] },
  { id: '3', type: 'suv', icon: '🚙', name: 'Premium Drive', from: 'Ташкент', to: 'Бухара', depart: '06:00', arrive: '12:30', duration: '6ч 30мин', price: 200000, seats: 2, amenities: ['🧊 Кондиционер', '💺 Кожа', '🎵 Музыка'] },
  { id: '4', type: 'bus', icon: '🚌', name: 'Регион-Транс', from: 'Самарканд', to: 'Бухара', depart: '09:00', arrive: '13:00', duration: '4ч', price: 65000, seats: 18, amenities: ['🧊 Кондиционер'] },
  { id: '5', type: 'minibus', icon: '🚐', name: 'Comfort Line', from: 'Ташкент', to: 'Фергана', depart: '07:30', arrive: '12:00', duration: '4ч 30мин', price: 95000, seats: 6, amenities: ['🧊 Кондиционер', '📶 Wi-Fi'] },
];

const comingSoonToast = () => toast('🚧 Скоро будет доступно', { description: 'Раздел в разработке — следите за обновлениями!' });

const Transport = () => {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [from, setFrom] = useState('Ташкент');
  const [to, setTo] = useState('Самарканд');
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = MOCK_ROUTES.filter(r => activeFilter === 'all' || r.type === activeFilter);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">🚌 Транспорт</h1>
        </div>
      </div>

      <ComingSoonBanner feature="transport" />

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
                <select
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full h-10 pl-16 pr-3 rounded-xl bg-muted border border-border text-sm text-foreground appearance-none cursor-not-allowed opacity-70"
                  disabled
                >
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Куда</span>
                <select
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full h-10 pl-16 pr-3 rounded-xl bg-muted border border-border text-sm text-foreground appearance-none cursor-not-allowed opacity-70"
                  disabled
                >
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={comingSoonToast}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>
          <Button onClick={comingSoonToast} className="w-full gap-2 opacity-80" disabled>
            <Search className="w-4 h-4" /> Найти рейсы
          </Button>
        </motion.div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_TYPES.map(f => (
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

        <p className="text-xs text-muted-foreground">{filtered.length} рейсов</p>

        {/* Route cards */}
        <div className="space-y-3">
          {filtered.map((route, i) => (
            <motion.div
              key={route.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{route.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{route.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{route.type === 'suv' ? 'Внедорожник' : route.type === 'minibus' ? 'Минибус' : 'Автобус'}</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-primary">{route.price.toLocaleString()} сум</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{route.depart}</p>
                  <p className="text-[10px] text-muted-foreground">{route.from}</p>
                </div>
                <div className="flex-1 flex items-center gap-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] text-muted-foreground px-1">{route.duration}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{route.arrive}</p>
                  <p className="text-[10px] text-muted-foreground">{route.to}</p>
                </div>
              </div>

              <div className="flex gap-1 flex-wrap">
                {route.amenities.map((a, j) => (
                  <Badge key={j} variant="outline" className="text-[10px] border-border">{a}</Badge>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-green-400">✅ {route.seats} мест свободно</span>
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

export default Transport;
