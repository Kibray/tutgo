import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ArrowUpDown, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import BottomNav from '@/components/BottomNav';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const POPULAR_DIRECTIONS = [
  { from: 'TAS', fromCity: 'Ташкент', to: 'DXB', toCity: 'Дубай', emoji: '🏙️', price: '850 000', duration: '3ч 30мин' },
  { from: 'TAS', fromCity: 'Ташкент', to: 'MOW', toCity: 'Москва', emoji: '🏛️', price: '1 200 000', duration: '4ч 50мин' },
  { from: 'TAS', fromCity: 'Ташкент', to: 'IST', toCity: 'Стамбул', emoji: '🕌', price: '950 000', duration: '5ч 10мин' },
  { from: 'TAS', fromCity: 'Ташкент', to: 'FRA', toCity: 'Франкфурт', emoji: '🇩🇪', price: '2 100 000', duration: '8ч 20мин' },
  { from: 'TAS', fromCity: 'Ташкент', to: 'ICN', toCity: 'Сеул', emoji: '🇰🇷', price: '1 800 000', duration: '9ч 00мин' },
];

const TRAIN_ROUTES = [
  { type: '🚄', name: 'Afrosiyob', from: 'Ташкент', to: 'Самарканд', duration: '2ч 10мин' },
  { type: '🚄', name: 'Afrosiyob', from: 'Ташкент', to: 'Бухара', duration: '5ч 30мин' },
  { type: '🚂', name: 'UTY', from: 'Ташкент', to: 'Андижан', duration: '4ч 20мин' },
  { type: '🚂', name: 'UTY', from: 'Ташкент', to: 'Наманган', duration: '3ч 40мин' },
  { type: '🚂', name: 'UTY', from: 'Ташкент', to: 'Нукус', duration: '16ч 00мин' },
];

const TRAIN_FEATURES = [
  'Поиск по маршруту и дате',
  'Выбор вагона и места (плацкарт/купе/СВ)',
  'Онлайн оплата через Payme/Click',
  'Электронный билет в Telegram',
  'Отслеживание поезда на карте',
];

const Flights = () => {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { toast } = useToast();

  const [fromCity, setFromCity] = useState('Ташкент (TAS)');
  const [toCity, setToCity] = useState('');
  const [departDate, setDepartDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [passengers, setPassengers] = useState(1);
  const [flightClass, setFlightClass] = useState('economy');
  const [showNotify, setShowNotify] = useState(false);
  const [tgUsername, setTgUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const swapCities = () => {
    setFromCity(toCity);
    setToCity(fromCity);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set('from', fromCity);
    params.set('to', toCity);
    if (departDate) params.set('depart', format(departDate, 'yyyy-MM-dd'));
    if (returnDate) params.set('return', format(returnDate, 'yyyy-MM-dd'));
    params.set('passengers', String(passengers));
    params.set('class', flightClass);
    navigate(`/flights/results?${params.toString()}`);
  };

  const handlePopularClick = (dir: typeof POPULAR_DIRECTIONS[0]) => {
    const params = new URLSearchParams();
    params.set('from', `${dir.fromCity} (${dir.from})`);
    params.set('to', `${dir.toCity} (${dir.to})`);
    params.set('passengers', '1');
    params.set('class', 'economy');
    navigate(`/flights/results?${params.toString()}`);
  };

  const handleNotifySubmit = async () => {
    if (!tgUsername.trim()) return;
    setSubmitting(true);
    try {
      await supabase.from('waitlist').insert({ telegram_username: tgUsername.trim(), feature: 'trains' } as any);
      setShowNotify(false);
      setTgUsername('');
      toast({ title: '✅ Готово!', description: 'Уведомим тебя в Telegram' });
    } catch {
      toast({ title: 'Ошибка', variant: 'destructive' });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground">TUTGO</h1>
          </div>
          <span className="text-sm font-medium text-muted-foreground">✈️ Билеты</span>
        </div>
      </div>

      <div className={cn("px-4 py-4 space-y-5", isDesktop && "max-w-4xl mx-auto")}>
        <Tabs defaultValue="flights">
          <TabsList className="w-full grid grid-cols-2 bg-muted/50">
            <TabsTrigger value="flights">✈️ Авиабилеты</TabsTrigger>
            <TabsTrigger value="trains" className="relative">
              🚂 Поезда
              <Badge className="absolute -top-1 -right-1 bg-orange-500 text-[9px] px-1 py-0 text-white border-0">Скоро</Badge>
            </TabsTrigger>
          </TabsList>

          {/* ===== FLIGHTS TAB ===== */}
          <TabsContent value="flights" className="space-y-5 mt-4">
            {/* Search form */}
            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <div className="relative space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🟢</span>
                  <Input
                    placeholder="Откуда"
                    value={fromCity}
                    onChange={e => setFromCity(e.target.value)}
                    className="border-0 bg-muted/50 focus-visible:ring-1"
                  />
                </div>
                <button
                  onClick={swapCities}
                  className="absolute right-3 top-6 z-10 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
                >
                  <ArrowUpDown className="w-4 h-4 text-primary" />
                </button>
                <div className="h-px bg-border mx-8" />
                <div className="flex items-center gap-3">
                  <span className="text-lg">🔴</span>
                  <Input
                    placeholder="Выберите город..."
                    value={toCity}
                    onChange={e => setToCity(e.target.value)}
                    className="border-0 bg-muted/50 focus-visible:ring-1"
                  />
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal bg-muted/50 border-0 text-sm">
                      📅 {departDate ? format(departDate, 'd MMM', { locale: ru }) : 'Туда'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={departDate} onSelect={setDepartDate} disabled={d => d < new Date()} className="p-3 pointer-events-auto" locale={ru} />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal bg-muted/50 border-0 text-sm">
                      📅 {returnDate ? format(returnDate, 'd MMM', { locale: ru }) : 'Обратно'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={returnDate} onSelect={setReturnDate} disabled={d => d < new Date()} className="p-3 pointer-events-auto" locale={ru} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 h-10">
                <span className="text-sm text-muted-foreground">👥</span>
                <button onClick={() => setPassengers(Math.max(1, passengers - 1))} className="w-6 h-6 rounded-full bg-background text-foreground flex items-center justify-center text-sm font-bold">−</button>
                <span className="flex-1 text-center text-sm font-medium text-foreground">{passengers} пассажир(ов)</span>
                <button onClick={() => setPassengers(Math.min(9, passengers + 1))} className="w-6 h-6 rounded-full bg-background text-foreground flex items-center justify-center text-sm font-bold">+</button>
              </div>

              {/* Class select */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'economy', icon: '💺', label: 'Эконом' },
                  { id: 'business', icon: '🥂', label: 'Бизнес' },
                  { id: 'first', icon: '👑', label: 'Первый' },
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => setFlightClass(c.id)}
                    className={cn(
                      "py-2 rounded-lg text-xs font-medium transition-colors",
                      flightClass === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'
                    )}
                  >
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>

              <Button onClick={handleSearch} className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(200,100%,50%)] text-primary-foreground font-semibold">
                ✈️ Найти билеты
              </Button>
            </div>

            {/* Popular directions */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Популярные направления</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {POPULAR_DIRECTIONS.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => handlePopularClick(d)}
                    className="flex-shrink-0 w-36 p-3 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors text-left space-y-1"
                  >
                    <span className="text-2xl">{d.emoji}</span>
                    <p className="text-xs font-semibold text-foreground">{d.from} → {d.to}</p>
                    <p className="text-xs text-primary font-bold">{d.price} сум</p>
                    <p className="text-[10px] text-muted-foreground">{d.duration}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Trains coming soon block */}
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚂</span>
                <h3 className="font-semibold text-foreground">Поезда скоро!</h3>
              </div>
              <p className="text-sm text-muted-foreground">Бронирование на Afrosiyob и UTY появится совсем скоро</p>
              <Button variant="outline" className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10" onClick={() => setShowNotify(true)}>
                🔔 Уведомить меня
              </Button>
            </div>
          </TabsContent>

          {/* ===== TRAINS TAB ===== */}
          <TabsContent value="trains" className="space-y-5 mt-4">
            {/* Animated train hero */}
            <div className="rounded-2xl bg-gradient-to-b from-blue-950/50 to-background border border-border p-6 text-center space-y-4 overflow-hidden relative">
              <Badge className="bg-orange-500 text-white border-0">Скоро!</Badge>
              <motion.div
                animate={{ x: [-5, 5, -5] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="text-6xl"
              >
                🚄
              </motion.div>
              <div className="w-full h-1 bg-muted-foreground/20 rounded-full relative">
                <div className="absolute inset-0 flex justify-between items-center px-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                  ))}
                </div>
              </div>
              <h2 className="text-lg font-bold text-foreground">Билеты на поезда Узбекистана</h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Мы работаем над интеграцией с Uzbekiston Temir Yullari (UTY).
                Скоро вы сможете бронировать все поезда страны прямо в TutGo!
              </p>
            </div>

            {/* Locked train routes */}
            <div className="space-y-2">
              {TRAIN_ROUTES.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50 opacity-60">
                  <span className="text-xl">🔒</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{r.type} {r.name} · {r.from} → {r.to}</p>
                    <p className="text-[10px] text-muted-foreground">{r.duration}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Expected features */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Ожидаемые функции</h3>
              {TRAIN_FEATURES.map((f, i) => (
                <p key={i} className="text-sm text-muted-foreground/60">⏳ {f}</p>
              ))}
            </div>

            {/* Notify button */}
            <Button
              variant="outline"
              className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
              onClick={() => setShowNotify(true)}
            >
              🔔 Уведомить когда появится
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      {/* Notify modal */}
      <Sheet open={showNotify} onOpenChange={setShowNotify}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-center">
              <span className="text-3xl block mb-2">🔔</span>
              Уведомить меня!
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground text-center">
              Оставь свой Telegram — напишем как только поезда появятся в TutGo!
            </p>
            <Input
              placeholder="@telegram_username"
              value={tgUsername}
              onChange={e => setTgUsername(e.target.value)}
              className="bg-muted/50"
            />
            <Button
              className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(200,100%,50%)] text-primary-foreground"
              onClick={handleNotifySubmit}
              disabled={submitting || !tgUsername.trim()}
            >
              {submitting ? '...' : '✅ Подписаться'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {!isDesktop && <BottomNav />}
    </div>
  );
};

export default Flights;
