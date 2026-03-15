import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowUpDown, ChevronLeft, Bus, Car, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import BottomNav from '@/components/BottomNav';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useDriverTrips, DriverTrip } from '@/hooks/useTransport';

const POPULAR_ROUTES = [
  { from: 'Ташкент', to: 'Самарканд', price: '50K' },
  { from: 'Ташкент', to: 'Бухара', price: '80K' },
  { from: 'Ташкент', to: 'Наманган', price: '45K' },
  { from: 'Ташкент', to: 'Андижан', price: '55K' },
  { from: 'Ташкент', to: 'Нукус', price: '120K' },
  { from: 'Самарканд', to: 'Бухара', price: '40K' },
];

const TRANSPORT_TYPES = [
  { icon: '🚌', label: 'Автобус', price: 'от 30 000 сум' },
  { icon: '🚐', label: 'Минибус', price: 'от 60 000 сум' },
  { icon: '🚙', label: 'Внедорожник', price: 'от 200 000 сум' },
  { icon: '🏎️', label: 'VIP авто', price: 'от 350 000 сум' },
];

const DriverCard = ({ trip }: { trip: DriverTrip }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card rounded-2xl border border-border p-4 space-y-3"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">🧑</div>
      <div className="flex-1">
        <p className="font-semibold text-sm text-foreground">Водитель</p>
        <p className="text-xs text-muted-foreground">⭐ 4.8 · 24 поездки</p>
      </div>
    </div>
    {trip.car_model && (
      <p className="text-xs text-muted-foreground">{trip.car_model} {trip.car_color && `· ${trip.car_color}`}</p>
    )}
    <div className="flex items-center gap-2 text-sm">
      <span className="text-green-400">🟢 {trip.from_city}</span>
      <span className="text-muted-foreground">──→</span>
      <span className="text-red-400">🔴 {trip.to_city}</span>
    </div>
    {trip.departure_datetime && (
      <p className="text-xs text-muted-foreground">
        📅 {format(new Date(trip.departure_datetime), 'd MMMM · HH:mm', { locale: ru })}
      </p>
    )}
    <div className="flex gap-1 flex-wrap">
      <Badge variant="secondary" className="text-[10px]">👥 {trip.available_seats} мест</Badge>
      {trip.amenities?.slice(0, 3).map((a, i) => (
        <Badge key={i} variant="outline" className="text-[10px]">{a}</Badge>
      ))}
    </div>
    <div className="flex items-center justify-between pt-1">
      <span className="text-lg font-bold text-orange-400">{trip.price.toLocaleString()} сум</span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="text-xs">💬 Написать</Button>
        <Button size="sm" className="text-xs bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(200,100%,50%)]">Забронировать →</Button>
      </div>
    </div>
  </motion.div>
);

const Transport = () => {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [travelDate, setTravelDate] = useState<Date>();
  const [passengers, setPassengers] = useState(1);
  const { data: driverTrips = [] } = useDriverTrips();

  const swapCities = () => {
    setFromCity(toCity);
    setToCity(fromCity);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (fromCity) params.set('from', fromCity);
    if (toCity) params.set('to', toCity);
    if (travelDate) params.set('date', format(travelDate, 'yyyy-MM-dd'));
    params.set('passengers', String(passengers));
    navigate(`/transport/results?${params.toString()}`);
  };

  const handlePopularRoute = (from: string, to: string) => {
    setFromCity(from);
    setToCity(to);
  };

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

      <div className={cn("px-4 py-4 space-y-5", isDesktop && "max-w-4xl mx-auto")}>
        <Tabs defaultValue="routes">
          <TabsList className="w-full grid grid-cols-2 bg-muted/50">
            <TabsTrigger value="routes">🚌 Рейсовые</TabsTrigger>
            <TabsTrigger value="drivers">🚗 Водители</TabsTrigger>
          </TabsList>

          <TabsContent value="routes" className="space-y-5 mt-4">
            {/* Search form */}
            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <div className="relative space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-lg">🟢</span>
                  <Input
                    placeholder="Откуда"
                    value={fromCity}
                    onChange={e => setFromCity(e.target.value)}
                    className="border-0 bg-muted/50 focus-visible:ring-1"
                  />
                </div>
                <button
                  onClick={swapCities}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
                >
                  <ArrowUpDown className="w-4 h-4 text-primary" />
                </button>
                <div className="h-px bg-border mx-8" />
                <div className="flex items-center gap-3">
                  <span className="text-red-400 text-lg">🔴</span>
                  <Input
                    placeholder="Куда"
                    value={toCity}
                    onChange={e => setToCity(e.target.value)}
                    className="border-0 bg-muted/50 focus-visible:ring-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal bg-muted/50 border-0">
                      📅 {travelDate ? format(travelDate, 'd MMM', { locale: ru }) : 'Дата'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={travelDate}
                      onSelect={setTravelDate}
                      disabled={(date) => date < new Date()}
                      className="p-3 pointer-events-auto"
                      locale={ru}
                    />
                  </PopoverContent>
                </Popover>

                <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 h-10">
                  <span className="text-sm text-muted-foreground">👥</span>
                  <button onClick={() => setPassengers(Math.max(1, passengers - 1))} className="w-6 h-6 rounded-full bg-background text-foreground flex items-center justify-center text-sm font-bold">−</button>
                  <span className="flex-1 text-center text-sm font-medium text-foreground">{passengers}</span>
                  <button onClick={() => setPassengers(Math.min(10, passengers + 1))} className="w-6 h-6 rounded-full bg-background text-foreground flex items-center justify-center text-sm font-bold">+</button>
                </div>
              </div>

              <Button onClick={handleSearch} className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(200,100%,50%)] text-primary-foreground font-semibold">
                🔍 Найти транспорт
              </Button>
            </div>

            {/* Popular routes */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Популярные маршруты</h3>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {POPULAR_ROUTES.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handlePopularRoute(r.from, r.to)}
                    className="flex-shrink-0 px-3 py-2 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
                  >
                    <p className="text-xs font-medium text-foreground whitespace-nowrap">{r.from}→{r.to}</p>
                    <p className="text-xs text-primary font-bold">{r.price}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Transport types */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Типы транспорта</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {TRANSPORT_TYPES.map((t, i) => (
                  <div key={i} className="flex-shrink-0 w-32 p-3 rounded-2xl bg-card border border-border text-center space-y-1">
                    <span className="text-2xl">{t.icon}</span>
                    <p className="text-sm font-semibold text-foreground">{t.label}</p>
                    <p className="text-[10px] text-primary">{t.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="drivers" className="space-y-4 mt-4">
            {/* Create request block */}
            <div className="rounded-2xl bg-orange-500/10 border border-orange-500/20 p-4 text-center space-y-2">
              <p className="text-sm font-semibold text-orange-400">Укажи маршрут — водители предложат цену!</p>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">+ Создать заявку</Button>
            </div>

            {driverTrips.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-4xl mb-3">🚗</p>
                <p className="text-sm">Пока нет водителей</p>
              </div>
            ) : (
              driverTrips.map(trip => <DriverCard key={trip.id} trip={trip} />)
            )}
          </TabsContent>
        </Tabs>
      </div>

      {!isDesktop && <BottomNav />}
    </div>
  );
};

export default Transport;
