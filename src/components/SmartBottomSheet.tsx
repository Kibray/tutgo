import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Search, X, Locate, Loader2, LayoutGrid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ServiceCard from '@/components/ServiceCard';
import CategoryChips from '@/components/CategoryChips';
import { SkeletonList } from '@/components/SkeletonCard';
import { useFavorites } from '@/hooks/useFavorites';
import { usePreferences } from '@/hooks/usePreferences';
import { formatPrice, getServiceEmoji } from '@/lib/types';
import type { LocationItem } from '@/lib/types';

type SheetState = 'peek' | 'half' | 'full';

const BOTTOM_NAV_HEIGHT = 64;

const HEIGHT_MAP: Record<SheetState, string> = {
  peek: `${BOTTOM_NAV_HEIGHT + 160}px`,
  half: '52vh',
  full: '91vh',
};

const formatDistance = (km: number): string => {
  if (km < 1) return `${Math.round(km * 1000)} м`;
  return `${km.toFixed(1)} км`;
};

interface SmartBottomSheetProps {
  locations: LocationItem[];
  loading: boolean;
  nearbyMode: boolean;
  userLocation: [number, number] | null;
  category: string;
  onCategorySelect: (id: string) => void;
  subcategory: string;
  onSubcategorySelect: (id: string) => void;
  onSearch: (q: string) => void;
  onGeolocate: () => void;
  geolocating: boolean;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  onDisableNearby: () => void;
  onServiceClick: (s: LocationItem) => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

const SmartBottomSheet = ({
  locations, loading, nearbyMode, userLocation, category,
  onCategorySelect, subcategory, onSubcategorySelect,
  onSearch, onGeolocate, geolocating, onLocationSelect,
  onDisableNearby, onServiceClick, onToggleFavorite, isFavorite,
}: SmartBottomSheetProps) => {
  const { t } = usePreferences();
  const navigate = useNavigate();
  const { favoriteIds } = useFavorites();
  const [state, setState] = useState<SheetState>('half');
  const [query, setQuery] = useState('');
  const [mapDark, setMapDark] = useState(() => localStorage.getItem('tutgo_map_dark') !== 'false');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const haptic = () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback?.impactOccurred) {
      tg.HapticFeedback.impactOccurred('light');
    } else {
      navigator.vibrate?.(8);
    }
  };

  const setStateWithHaptic = useCallback((s: SheetState) => {
    setState(s);
    haptic();
  }, []);

  const ORDER: SheetState[] = ['peek', 'half', 'full'];

  const handleDragEnd = (_: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const idx = ORDER.indexOf(state);
    if (offset.y < -50 || velocity.y < -300) {
      if (idx < ORDER.length - 1) setStateWithHaptic(ORDER[idx + 1]);
    } else if (offset.y > 50 || velocity.y > 300) {
      // Never go below peek — always keep search visible
      if (idx > 0) setStateWithHaptic(ORDER[idx - 1]);
    }
  };

  // Tap on handle or search bar in peek to expand
  const handlePeekTap = () => {
    if (state === 'peek') setStateWithHaptic('half');
  };

  // Nominatim suggestions
  useEffect(() => {
    if (query.length < 3) { setSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=uz&limit=4&format=json`)
        .then(r => r.json())
        .then(data => setSuggestions(Array.isArray(data) ? data : []))
        .catch(() => setSuggestions([]));
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
    setSuggestions([]);
  };

  const handleSuggestionClick = (s: any) => {
    onLocationSelect(parseFloat(s.lat), parseFloat(s.lon), s.display_name);
    setQuery(s.display_name);
    setSuggestions([]);
    setStateWithHaptic('half');
  };

  const showChips = state === 'half' || state === 'full';

  return (
    <motion.div
      drag={state !== 'peek' ? 'y' : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.15}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      animate={{ height: HEIGHT_MAP[state], y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="absolute left-0 right-0 z-[1000] bg-background/95 backdrop-blur-xl rounded-t-2xl border-t border-border"
      style={{ touchAction: 'none', overflow: 'hidden', bottom: `${BOTTOM_NAV_HEIGHT}px` }}
    >
      {/* Handle */}
      <div
        className="w-full flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
        onClick={handlePeekTap}
      >
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
      </div>

      {/* Category chips */}
      {(state === 'half' || state === 'full') && (
        <div className="px-4 pb-2">
          <CategoryChips selected={category} onSelect={onCategorySelect} selectedSub={subcategory} onSubSelect={onSubcategorySelect} />
        </div>
      )}

      {/* Search bar */}
      <div className="relative px-4 pb-2">
        <div className="flex items-center gap-2 bg-secondary/60 backdrop-blur-sm rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); onSearch(e.target.value); }}
            onFocus={() => { setStateWithHaptic('full'); }}
            onKeyDown={e => e.key === 'Escape' && setStateWithHaptic('half')}
            placeholder={t('index.search_placeholder')}
            className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
          />
          {query.length > 0 && (
            <button onClick={handleClear} className="p-0.5">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button onClick={onGeolocate} className="p-1">
            {geolocating ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : (
              <Locate className="w-4 h-4 text-primary" />
            )}
          </button>
        </div>

        {/* Nominatim suggestions */}
        {suggestions.length > 0 && (
          <div className="absolute left-4 right-4 bottom-full mb-1 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-10">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s)}
                className="w-full text-left px-3 py-2.5 text-xs text-foreground hover:bg-secondary/60 border-b border-border/50 last:border-0 truncate"
              >
                📍 {s.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick chips */}
      {showChips && (
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => {
              const next = !mapDark;
              setMapDark(next);
              localStorage.setItem('tutgo_map_dark', String(next));
              window.dispatchEvent(new Event('storage'));
            }}
            className="flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full bg-secondary text-foreground border border-border/50"
          >
            {mapDark ? '🌙' : '☀️'}
          </button>
          {nearbyMode && (
            <button
              onClick={onDisableNearby}
              className="flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full bg-primary/15 text-primary border border-primary/30"
            >
              📍 {t('index.near_you')}
            </button>
          )}
          {favoriteIds.size > 0 && (
            <button
              onClick={() => navigate('/profile')}
              className="flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full bg-secondary text-foreground border border-border/50"
            >
              ★ {t('nav.favorites')} · {favoriteIds.size}
            </button>
          )}
          <button
            onClick={() => navigate('/bookings')}
            className="flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full bg-secondary text-foreground border border-border/50"
          >
            {t('nav.bookings')}
          </button>
        </div>
      )}

      {!query && (
        <div className="px-4 pb-3">
          <button
            onClick={() => { onSearch(''); onCategorySelect('all'); setStateWithHaptic('full'); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-medium active:scale-[0.98] transition-transform"
          >
            <span>🔥</span>
            Find available in 30 minutes
          </button>
        </div>
      )}

      {/* Content */}
      <div className="overflow-y-auto px-4 pb-4" style={{ height: 'calc(100% - 220px)', paddingBottom: '70px' }}>
        {state === 'half' && (
          /* Horizontal scroll cards */
          <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">
              {nearbyMode ? t('index.nearby_me') : t('index.popular_nearby')}
            </span>
            <span className="text-xs text-muted-foreground">
              {locations.length} {t('index.found')}
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {loading ? (
              <div className="flex gap-3">
                {[1,2,3].map(i => (
                  <div key={i} className="min-w-[190px] h-[140px] rounded-lg bg-muted animate-pulse flex-shrink-0" />
                ))}
              </div>
            ) : locations.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full py-6 gap-2">
                <Search className="w-8 h-8 text-muted-foreground/40" />
                <span className="text-muted-foreground text-xs">{t('index.nothing_found')}</span>
              </div>
            ) : (
              locations.slice(0, 10).map((loc: any) => (
                <motion.div
                  key={loc.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onServiceClick(loc)}
                  className="min-w-[190px] flex-shrink-0 rounded-lg bg-secondary/60 border border-border/50 overflow-hidden cursor-pointer"
                >
                  {loc.gallery?.[0] ? (
                    <img src={loc.gallery[0]} alt={loc.name} className="w-full h-[90px] object-cover" />
                  ) : (
                    <div className="w-full h-[90px] bg-muted flex items-center justify-center text-2xl">
                      {getServiceEmoji(loc.business_type, loc.sub_category)}
                    </div>
                  )}
                  <div className="p-2 relative">
                    <p className="text-xs font-semibold text-foreground truncate">{loc.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">⭐ {loc.rating || 0}</span>
                      {(loc.price_from || 0) > 0 && (
                        <span className="text-[10px] font-bold text-primary">
                          от {new Intl.NumberFormat('ru-RU').format(loc.price_from!)}
                        </span>
                      )}
                    </div>
                    {nearbyMode && loc._distance != null && (
                      <span className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {formatDistance(loc._distance)}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
          </>
        )}

        {state === 'full' && (
          <div className="space-y-3">
            {/* Filter pills — only when searching */}
            {query.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                {[
                  { id: 'nearby', label: '📍 Nearby' },
                  { id: 'rating', label: '⭐ Rating' },
                  { id: 'price', label: '💰 Price' },
                  { id: 'open', label: '🟢 Open now' },
                  { id: 'online', label: '✅ Online' },
                ].map(p => {
                  const active = activeFilter === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => { haptic(); setActiveFilter(active ? null : p.id); }}
                      className={`flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
                        active
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary text-foreground border-border/50'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Section header */}
            {!loading && locations.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {nearbyMode ? 'Nearby' : 'Results'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {locations.length}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-secondary/60 rounded-lg p-0.5">
                  <button
                    onClick={() => { haptic(); setViewMode('cards'); }}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === 'cards' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground'
                    }`}
                    aria-label="Card view"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { haptic(); setViewMode('list'); }}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === 'list' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground'
                    }`}
                    aria-label="List view"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {loading ? <SkeletonList count={4} /> : locations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Search className="w-10 h-10 text-muted-foreground/40" />
                <span className="text-muted-foreground text-sm">{t('index.nothing_found')}</span>
              </div>
            ) : (
              locations.map((loc: any, i: number) => (
                <div key={loc.id} className="relative">
                  <ServiceCard
                    service={loc}
                    index={i}
                    onClick={() => onServiceClick(loc)}
                    isFavorite={isFavorite(loc.id)}
                    onToggleFavorite={onToggleFavorite}
                    compact={viewMode === 'list'}
                  />
                  {nearbyMode && loc._distance != null && (
                    <div className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm z-10">
                      {formatDistance(loc._distance)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SmartBottomSheet;
