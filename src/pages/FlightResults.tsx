import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { cn } from '@/lib/utils';

interface Flight {
  id: string;
  airline: string;
  airlineLogo: string;
  flightNumber: string;
  departTime: string;
  departCode: string;
  arriveTime: string;
  arriveCode: string;
  nextDay?: boolean;
  duration: string;
  stops: number;
  stopCity?: string;
  amenities: string[];
  price: number;
  seatsLeft?: number;
  isCheapest?: boolean;
  isBestPrice?: boolean;
}

const MOCK_FLIGHTS: Flight[] = [
  {
    id: '1',
    airline: 'Uzbekistan Airways',
    airlineLogo: '🇺🇿',
    flightNumber: 'HY005',
    departTime: '08:30',
    departCode: 'TAS',
    arriveTime: '10:00',
    arriveCode: 'DXB',
    duration: '3ч 30мин',
    stops: 0,
    amenities: ['🧳 Багаж 23кг', '🍽️ Питание', '📺 Экран'],
    price: 850000,
  },
  {
    id: '2',
    airline: 'FlyDubai',
    airlineLogo: '🟢',
    flightNumber: 'FZ707',
    departTime: '14:15',
    departCode: 'TAS',
    arriveTime: '16:00',
    arriveCode: 'DXB',
    duration: '3ч 45мин',
    stops: 0,
    amenities: ['🧳 Багаж 20кг'],
    price: 720000,
    seatsLeft: 3,
    isBestPrice: true,
  },
  {
    id: '3',
    airline: 'Qatar Airways',
    airlineLogo: '🟣',
    flightNumber: 'QR343+QR506',
    departTime: '23:55',
    departCode: 'TAS',
    arriveTime: '12:10',
    arriveCode: 'DXB',
    nextDay: true,
    duration: '9ч 15мин',
    stops: 1,
    stopCity: 'DOH',
    amenities: ['🧳 Багаж 30кг', '🍽️ Питание', '🥂 Бизнес'],
    price: 1100000,
  },
  {
    id: '4',
    airline: 'Turkish Airlines',
    airlineLogo: '🔴',
    flightNumber: 'TK325+TK123',
    departTime: '06:00',
    departCode: 'TAS',
    arriveTime: '18:30',
    arriveCode: 'DXB',
    duration: '12ч 30мин',
    stops: 1,
    stopCity: 'IST',
    amenities: ['🧳 Багаж 23кг', '🍽️ Питание'],
    price: 890000,
  },
  {
    id: '5',
    airline: 'Air Arabia',
    airlineLogo: '🟠',
    flightNumber: 'G9411',
    departTime: '22:45',
    departCode: 'TAS',
    arriveTime: '01:00',
    arriveCode: 'DXB',
    nextDay: true,
    duration: '3ч 15мин',
    stops: 0,
    amenities: ['Нет багажа'],
    price: 580000,
    isCheapest: true,
  },
];

const FILTERS = [
  { id: 'all', icon: '✈️', label: 'Все' },
  { id: 'direct', icon: '🚀', label: 'Прямые' },
  { id: 'transfer', icon: '🔄', label: 'С пересадкой' },
  { id: 'morning', icon: '🌅', label: 'Утро' },
  { id: 'day', icon: '☀️', label: 'День' },
  { id: 'evening', icon: '🌆', label: 'Вечер' },
];

const FlightCard = ({ flight }: { flight: Flight }) => {
  const seatsColor = !flight.seatsLeft ? 'text-primary' : flight.seatsLeft <= 5 ? 'text-orange-400' : 'text-primary';

  // Build Aviasales-style link
  const handleSelect = () => {
    const url = `https://www.aviasales.ru/search/${flight.departCode}${flight.arriveCode}1`;
    window.open(url, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-4 space-y-3 relative"
    >
      {flight.isBestPrice && (
        <Badge className="absolute -top-2 right-3 bg-primary text-primary-foreground text-[10px] border-0">Лучшая цена</Badge>
      )}
      {flight.isCheapest && (
        <Badge className="absolute -top-2 right-3 bg-orange-500 text-white text-[10px] border-0">Самый дешёвый</Badge>
      )}

      {/* Airline */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{flight.airlineLogo}</span>
        <span className="text-sm font-medium text-foreground">{flight.airline}</span>
        <span className="text-xs text-muted-foreground">{flight.flightNumber}</span>
      </div>

      {/* Time line */}
      <div className="flex items-center gap-2">
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">{flight.departTime}</p>
          <p className="text-[10px] text-muted-foreground">{flight.departCode}</p>
        </div>
        <div className="flex-1 flex flex-col items-center gap-0.5">
          <div className="w-full flex items-center">
            <div className="h-px flex-1 bg-border" />
            <span className="px-1 text-xs">✈️</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <span className="text-[10px] text-muted-foreground">{flight.duration}</span>
          <span className="text-[10px] text-muted-foreground">
            {flight.stops === 0 ? 'Прямой рейс' : `${flight.stops} пересадка${flight.stopCity ? ` ${flight.stopCity}` : ''}`}
          </span>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-primary">
            {flight.arriveTime}
            {flight.nextDay && <sup className="text-[10px] text-muted-foreground">+1</sup>}
          </p>
          <p className="text-[10px] text-muted-foreground">{flight.arriveCode}</p>
        </div>
      </div>

      {/* Amenities */}
      <div className="flex gap-1 flex-wrap">
        {flight.amenities.map((a, i) => (
          <Badge key={i} variant="outline" className="text-[10px] border-border">{a}</Badge>
        ))}
      </div>

      {/* Price + select */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-lg font-bold text-primary">{flight.price.toLocaleString()} сум</p>
          {flight.seatsLeft && (
            <p className={cn("text-[10px] font-medium", seatsColor)}>
              ⚠️ Осталось {flight.seatsLeft} места
            </p>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleSelect}
          className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(200,100%,50%)] text-primary-foreground"
        >
          Выбрать →
        </Button>
      </div>
    </motion.div>
  );
};

const FlightResults = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDesktop = useIsDesktop();

  const fromCity = searchParams.get('from') || 'Ташкент (TAS)';
  const toCity = searchParams.get('to') || '';
  const departDate = searchParams.get('depart') || '';
  const passengers = searchParams.get('passengers') || '1';
  const flightClass = searchParams.get('class') || 'economy';

  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'price' | 'time'>('price');

  const filtered = useMemo(() => {
    let list = [...MOCK_FLIGHTS];

    if (activeFilter === 'direct') list = list.filter(f => f.stops === 0);
    if (activeFilter === 'transfer') list = list.filter(f => f.stops > 0);
    if (activeFilter === 'morning') list = list.filter(f => parseInt(f.departTime) >= 5 && parseInt(f.departTime) < 12);
    if (activeFilter === 'day') list = list.filter(f => parseInt(f.departTime) >= 12 && parseInt(f.departTime) < 18);
    if (activeFilter === 'evening') list = list.filter(f => parseInt(f.departTime) >= 18 || parseInt(f.departTime) < 5);

    if (sortBy === 'price') list.sort((a, b) => a.price - b.price);
    else list.sort((a, b) => a.departTime.localeCompare(b.departTime));

    return list;
  }, [activeFilter, sortBy]);

  const classLabel = flightClass === 'business' ? 'Бизнес' : flightClass === 'first' ? 'Первый' : 'Эконом';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/flights')} className="p-1.5">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">{fromCity.split('(')[0]?.trim()} → {toCity.split('(')[0]?.trim() || '?'}</p>
            <p className="text-[10px] text-muted-foreground">{departDate || 'Любая дата'} · {passengers} пассажир(ов) · {classLabel}</p>
          </div>
        </div>
      </div>

      <div className={cn("px-4 py-4 space-y-4", isDesktop && "max-w-3xl mx-auto")}>
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                activeFilter === f.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{filtered.length} рейсов найдено</p>
          <div className="flex gap-1">
            <button
              onClick={() => setSortBy('price')}
              className={cn("text-xs px-2 py-1 rounded", sortBy === 'price' ? 'bg-primary/15 text-primary' : 'text-muted-foreground')}
            >
              По цене ↕
            </button>
            <button
              onClick={() => setSortBy('time')}
              className={cn("text-xs px-2 py-1 rounded", sortBy === 'time' ? 'bg-primary/15 text-primary' : 'text-muted-foreground')}
            >
              По времени
            </button>
          </div>
        </div>

        {/* Flight list */}
        <div className="space-y-3">
          {filtered.map(flight => (
            <FlightCard key={flight.id} flight={flight} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm text-muted-foreground">Рейсы не найдены</p>
            <Button variant="outline" className="mt-3" onClick={() => navigate('/flights')}>Изменить поиск</Button>
          </div>
        )}
      </div>

      {!isDesktop && <BottomNav />}
    </div>
  );
};

export default FlightResults;
