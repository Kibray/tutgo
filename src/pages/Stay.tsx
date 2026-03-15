import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, ChevronLeft, Star, MapPin, Users, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { format, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import BottomNav from '@/components/BottomNav';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useStays, Stay } from '@/hooks/useStays';

const CATEGORIES = [
  { id: 'hotel', icon: '🏨', label: 'Гостиницы' },
  { id: 'sanatorium', icon: '🌿', label: 'Санатории' },
  { id: 'dacha', icon: '🏡', label: 'Дачи' },
  { id: 'resort', icon: '🏖️', label: 'Зоны отдыха' },
  { id: 'glamping', icon: '🏕️', label: 'Глэмпинг' },
  { id: 'hostel', icon: '🛏️', label: 'Хостелы' },
];

const AMENITY_OPTIONS = [
  { id: 'Бассейн', icon: '🏊', label: 'Бассейн' },
  { id: 'Питание', icon: '🍽️', label: 'Питание' },
  { id: 'Парковка', icon: '🅿️', label: 'Парковка' },
  { id: 'Wi-Fi', icon: '📶', label: 'Wi-Fi' },
  { id: 'Кондиционер', icon: '❄️', label: 'Кондиционер' },
  { id: 'Мангал', icon: '🔥', label: 'Мангал' },
];

const StayCard = ({ stay, onClick }: { stay: Stay; onClick: () => void }) => {
  const isNew = (Date.now() - new Date(stay.created_at).getTime()) < 14 * 86400000;
  const categoryLabel = CATEGORIES.find(c => c.id === stay.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border overflow-hidden cursor-pointer hover:border-primary/30 transition-colors"
      onClick={onClick}
    >
      <div className="relative h-[170px]">
        <img
          src={stay.photos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
          alt={stay.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 flex gap-1">
          {stay.rating >= 4.9 && <Badge className="bg-red-500/90 text-white text-[10px]">🔥 Хит</Badge>}
          {isNew && <Badge className="bg-blue-500/90 text-white text-[10px]">🆕 Новинка</Badge>}
          {stay.reviews_count > 100 && <Badge className="bg-yellow-500/90 text-white text-[10px]">⭐ Топ выбор</Badge>}
        </div>
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="bg-black/60 text-white text-[10px] backdrop-blur-sm">
            {categoryLabel?.icon} {categoryLabel?.label}
          </Badge>
        </div>
        <button className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <Heart className="w-4 h-4 text-white" />
        </button>
      </div>
      <div className="p-3 space-y-2">
        <h3 className="font-bold text-sm text-foreground line-clamp-1" style={{ fontFamily: 'Syne, sans-serif' }}>{stay.name}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{stay.rating}</span>
          <span>·</span>
          <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{stay.city}</span>
          <span>·</span>
          <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />до {stay.max_guests}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {stay.amenities?.slice(0, 4).map(a => (
            <Badge key={a} variant="outline" className="text-[10px] px-1.5 py-0 border-border/50">{a}</Badge>
          ))}
        </div>
        <div className="flex items-end justify-between pt-1">
          <div>
            <span className="text-lg font-bold text-primary">{stay.price_per_night?.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground ml-1">сум/ночь</span>
          </div>
          <Button size="sm" variant="ghost" className="text-xs text-primary h-7 px-2">Подробнее →</Button>
        </div>
      </div>
    </motion.div>
  );
};

const StayCatalog = () => {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(2);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'rating'>('rating');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1500000]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const filters = useMemo(() => ({
    city: city || undefined,
    category: activeCategory || undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 1500000 ? priceRange[1] : undefined,
    minRating: minRating || undefined,
    amenities: selectedAmenities.length ? selectedAmenities : undefined,
    sortBy,
  }), [city, activeCategory, priceRange, minRating, selectedAmenities, sortBy]);

  const { data: stays = [], isLoading } = useStays(filters);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach(c => { counts[c.id] = 0; });
    stays.forEach(s => { if (counts[s.category] !== undefined) counts[s.category]++; });
    return counts;
  }, [stays]);

  const resetFilters = () => {
    setActiveCategory(null);
    setPriceRange([0, 1500000]);
    setMinRating(null);
    setSelectedAmenities([]);
    setCity('');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)}><ChevronLeft className="w-5 h-5 text-foreground" /></button>
          <h1 className="text-lg font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>🏨 Жильё</h1>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal className="w-3.5 h-3.5" /> Фильтры
        </Button>
      </div>

      <div className="px-4 space-y-5 mt-4">
        {/* Search Form */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">📍</span>
            <Input
              placeholder="Куда едете?"
              value={city}
              onChange={e => setCity(e.target.value)}
              className="pl-9 bg-secondary/50 border-0 h-11"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-11 justify-start text-left text-xs", !checkIn && "text-muted-foreground")}>
                  📅 {checkIn ? format(checkIn, 'dd MMM', { locale: ru }) : 'Заезд'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} disabled={d => d < new Date()} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-11 justify-start text-left text-xs", !checkOut && "text-muted-foreground")}>
                  📅 {checkOut ? format(checkOut, 'dd MMM', { locale: ru }) : 'Выезд'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} disabled={d => d < (checkIn || new Date())} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 h-11">
            <span className="text-sm text-muted-foreground">👥 Гостей</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center text-sm">−</button>
              <span className="text-sm font-semibold w-4 text-center">{guests}</span>
              <button onClick={() => setGuests(Math.min(20, guests + 1))} className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center text-sm">+</button>
            </div>
          </div>
          <Button className="w-full h-11 text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #00ff87, #00c6ff)' }}>
            <Search className="w-4 h-4 mr-2" /> Найти жильё
          </Button>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors text-center",
                activeCategory === cat.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/30"
              )}
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-[11px] font-medium text-foreground">{cat.label}</span>
              <span className="text-[10px] text-muted-foreground">{categoryCounts[cat.id] || 0} объектов</span>
            </button>
          ))}
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{stays.length} объектов найдено</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="text-xs bg-secondary/50 border border-border rounded-lg px-2 py-1.5 text-foreground"
          >
            <option value="rating">По рейтингу</option>
            <option value="price_asc">Цена ↑</option>
            <option value="price_desc">Цена ↓</option>
          </select>
        </div>

        {/* Stay cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-2xl border border-border h-[300px] animate-pulse" />
            ))}
          </div>
        ) : stays.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <span className="text-4xl">🔍</span>
            <p className="text-muted-foreground text-sm">Ничего не найдено</p>
            <Button variant="outline" size="sm" onClick={resetFilters}>Сбросить фильтры</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stays.map(stay => (
              <StayCard key={stay.id} stay={stay} onClick={() => navigate(`/stay/${stay.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Filters Sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] overflow-y-auto">
          <SheetHeader><SheetTitle>⚙️ Фильтры</SheetTitle></SheetHeader>
          <div className="space-y-5 py-4">
            {/* Price */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">💰 Цена за ночь</p>
              <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={1500000} step={10000} className="mt-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{priceRange[0].toLocaleString()} сум</span>
                <span>{priceRange[1].toLocaleString()} сум</span>
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">⭐ Рейтинг</p>
              <div className="flex gap-2">
                {[4.0, 4.5, 4.8, 4.9].map(r => (
                  <Button
                    key={r}
                    size="sm"
                    variant={minRating === r ? "default" : "outline"}
                    className="text-xs h-8"
                    onClick={() => setMinRating(minRating === r ? null : r)}
                  >
                    {r}+
                  </Button>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">✨ Удобства</p>
              <div className="grid grid-cols-2 gap-2">
                {AMENITY_OPTIONS.map(a => (
                  <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={selectedAmenities.includes(a.id)}
                      onCheckedChange={checked => {
                        setSelectedAmenities(prev => checked ? [...prev, a.id] : prev.filter(x => x !== a.id));
                      }}
                    />
                    <span>{a.icon} {a.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={resetFilters}>Сбросить</Button>
              <Button className="flex-1" onClick={() => setFiltersOpen(false)}>✅ Показать</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {!isDesktop && <BottomNav />}
    </div>
  );
};

export default StayCatalog;
