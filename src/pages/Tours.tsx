import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, Star, MapPin, Users, Heart, X, ChevronLeft, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import BottomNav from '@/components/BottomNav';
import { useTours, Tour } from '@/hooks/useTours';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const CATEGORIES = [
  { id: 'all', icon: '🗺️', label: 'Все' },
  { id: 'history', icon: '🏛️', label: 'История' },
  { id: 'nature', icon: '🌿', label: 'Природа' },
  { id: 'relax', icon: '🏖️', label: 'Отдых' },
  { id: 'mountain', icon: '🏔️', label: 'Горы' },
  { id: 'culture', icon: '🎭', label: 'Культура' },
];

const DURATIONS = [
  { id: '1', label: '1 день' },
  { id: '2-3', label: '2–3 дня' },
  { id: '4-5', label: '4–5 дней' },
  { id: '6+', label: '6+' },
];

const INCLUDE_FILTERS = [
  { id: 'авиа', icon: '✈️', label: 'Авиа' },
  { id: 'отель', icon: '🏨', label: 'Отель' },
  { id: 'питание', icon: '🍽️', label: 'Питание' },
  { id: 'гид', icon: '🎤', label: 'Гид' },
  { id: 'трансфер', icon: '🚌', label: 'Трансфер' },
  { id: 'билет', icon: '🎫', label: 'Билеты' },
];

const RATINGS = [4.0, 4.5, 4.8, 4.9];
const GROUPS = [
  { max: 8, label: 'Малая ≤8' },
  { max: 15, label: 'Средняя ≤15' },
  { max: 100, label: 'Большая' },
];

const TourCard = ({ tour, onClick }: { tour: Tour; onClick: () => void }) => {
  const isNew = new Date(tour.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const isHit = tour.rating >= 4.9;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-[200px]">
        <img
          src={tour.photos?.[0] || '/placeholder.svg'}
          alt={tour.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {isHit && <Badge className="bg-orange-500/90 text-white text-xs">🔥 Хит</Badge>}
          {isNew && <Badge className="bg-blue-500/90 text-white text-xs">🆕 Новый</Badge>}
          <Badge className="bg-black/60 text-white text-xs">{tour.duration_days} дней</Badge>
        </div>
        <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <Heart className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="p-4 space-y-2.5">
        <h3 className="font-bold text-base text-foreground font-[Syne] line-clamp-1">{tour.title}</h3>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            {tour.rating}
          </span>
          <span>·</span>
          <span className="flex items-center gap-0.5">
            <MapPin className="w-3.5 h-3.5" />
            {tour.departure_city}
          </span>
          <span>·</span>
          <span className="flex items-center gap-0.5">
            <Users className="w-3.5 h-3.5" />
            до {tour.max_people} чел
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {tour.includes.slice(0, 4).map((inc, i) => (
            <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0.5">
              {inc}
            </Badge>
          ))}
        </div>

        <div className="flex items-end justify-between pt-1">
          <div>
            <span className="text-lg font-bold text-primary">
              {tour.price_per_person.toLocaleString()} сум
            </span>
            <span className="text-xs text-muted-foreground block">за человека</span>
          </div>
          <Button
            size="sm"
            className="bg-gradient-to-r from-primary to-blue-600 text-white text-xs rounded-xl"
          >
            Подробнее →
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const TourListCard = ({ tour, onClick }: { tour: Tour; onClick: () => void }) => {
  const isNew = new Date(tour.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const isHit = tour.rating >= 4.9;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all cursor-pointer flex"
      onClick={onClick}
    >
      <div className="relative w-[140px] h-[140px] shrink-0">
        <img
          src={tour.photos?.[0] || '/placeholder.svg'}
          alt={tour.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isHit && <Badge className="bg-orange-500/90 text-white text-[10px] px-1.5">🔥 Хит</Badge>}
          {isNew && <Badge className="bg-blue-500/90 text-white text-[10px] px-1.5">🆕</Badge>}
        </div>
      </div>

      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div className="space-y-1.5">
          <h3 className="font-bold text-sm text-foreground font-[Syne] line-clamp-1">{tour.title}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              {tour.rating}
            </span>
            <span>·</span>
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {tour.departure_city}
            </span>
            <span>·</span>
            <span>{tour.duration_days} дн.</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {tour.includes.slice(0, 3).map((inc, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                {inc}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-base font-bold text-primary">
              {tour.price_per_person.toLocaleString()} сум
            </span>
            <span className="text-[10px] text-muted-foreground ml-1">/ чел</span>
          </div>
          <Button size="sm" className="bg-gradient-to-r from-primary to-blue-600 text-white text-xs rounded-xl h-7 px-2.5">
            Подробнее →
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const Tours = () => {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter state
  const [priceRange, setPriceRange] = useState([0, 2000000]);
  const [duration, setDuration] = useState<string | null>(null);
  const [includesFilter, setIncludesFilter] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [maxGroup, setMaxGroup] = useState<number | null>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useTours({
    category,
    search: search.length >= 2 ? search : undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 2000000 ? priceRange[1] : undefined,
    duration: duration || undefined,
    minRating: minRating || undefined,
    maxGroup: maxGroup || undefined,
    includes: includesFilter.length > 0 ? includesFilter : undefined,
  });

  const tours = data?.pages.flatMap(p => p.tours) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  const resetFilters = () => {
    setPriceRange([0, 2000000]);
    setDuration(null);
    setIncludesFilter([]);
    setMinRating(null);
    setMaxGroup(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            {!isDesktop && (
              <button onClick={() => navigate(-1)}>
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            <h1 className="text-xl font-bold font-[Syne] text-foreground">🌍 Туры</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen(true)}
            className="border-primary/50 text-primary text-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
            Фильтры
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Куда хотите поехать?"
            className="pl-10 bg-card border-border rounded-xl"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                category === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground border border-border'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-sm text-muted-foreground">{totalCount} туров найдено</p>

        {/* Tour grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[360px] bg-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : tours.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="text-5xl">🔍</div>
            <p className="text-muted-foreground">Туры не найдены</p>
            <Button variant="outline" onClick={() => { resetFilters(); setSearch(''); setCategory('all'); }}>
              Сбросить фильтры
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tours.map(tour => (
                <TourCard key={tour.id} tour={tour} onClick={() => navigate(`/tours/${tour.id}`)} />
              ))}
            </div>
            {hasNextPage && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="rounded-xl"
                >
                  {isFetchingNextPage ? 'Загрузка...' : 'Загрузить ещё'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters Sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Фильтры</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 py-4">
            {/* Price */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                💰 Цена: {priceRange[0].toLocaleString()} – {priceRange[1].toLocaleString()} сум
              </label>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                min={0}
                max={2000000}
                step={50000}
              />
            </div>

            {/* Duration */}
            <div>
              <label className="text-sm font-medium mb-2 block">📅 Длительность</label>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setDuration(duration === d.id ? null : d.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      duration === d.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Includes */}
            <div>
              <label className="text-sm font-medium mb-2 block">📦 Включено</label>
              <div className="grid grid-cols-3 gap-2">
                {INCLUDE_FILTERS.map(inc => (
                  <label key={inc.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={includesFilter.includes(inc.id)}
                      onCheckedChange={checked => {
                        setIncludesFilter(prev =>
                          checked ? [...prev, inc.id] : prev.filter(i => i !== inc.id)
                        );
                      }}
                    />
                    <span>{inc.icon} {inc.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="text-sm font-medium mb-2 block">⭐ Рейтинг</label>
              <div className="flex gap-2">
                {RATINGS.map(r => (
                  <button
                    key={r}
                    onClick={() => setMinRating(minRating === r ? null : r)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      minRating === r ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
                    }`}
                  >
                    {r}+
                  </button>
                ))}
              </div>
            </div>

            {/* Group */}
            <div>
              <label className="text-sm font-medium mb-2 block">👥 Группа</label>
              <div className="flex gap-2">
                {GROUPS.map(g => (
                  <button
                    key={g.max}
                    onClick={() => setMaxGroup(maxGroup === g.max ? null : g.max)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      maxGroup === g.max ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={resetFilters}>
                Сбросить
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-primary to-blue-600" onClick={() => setFiltersOpen(false)}>
                ✅ Показать туры
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {!isDesktop && <BottomNav />}
    </div>
  );
};

export default Tours;
