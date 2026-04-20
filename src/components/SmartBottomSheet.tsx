import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Search, X, Locate, Loader2, LayoutGrid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ServiceCard from '@/components/ServiceCard';
import CategoryChips from '@/components/CategoryChips';
import { SkeletonList } from '@/components/SkeletonCard';
import { useFavorites } from '@/hooks/useFavorites';
import { usePreferences } from '@/hooks/usePreferences';
import { getServiceEmoji } from '@/lib/types';
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

const ADDRESS_HINT_RE = /\d|улиц|ул\.|кўча|kucha|street|avenue|пр\.|просп/i;

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
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
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
    const isFlick = Math.abs(velocity.y) > 500;
    if (isFlick && velocity.y < 0) {
      if (idx < ORDER.length - 1) setStateWithHaptic(ORDER[idx + 1]);
    } else if (isFlick && velocity.y > 0) {
      if (idx > 0) setStateWithHaptic(ORDER[idx - 1]);
    } else if (!isFlick) {
      if (offset.y < -80 && idx < ORDER.length - 1) setStateWithHaptic(ORDER[idx + 1]);
      if (offset.y > 80 && idx > 0) setStateWithHaptic(ORDER[idx - 1]);
    }
  };

  const handlePeekTap = () => {
    if (state === 'peek') setStateWithHaptic('half');
    else if (state === 'half') setStateWithHaptic('full');
    else setStateWithHaptic('peek');
  };

  // Apply filter pills to locations
  const sortedLocations = useMemo(() => {
    let arr = [...locations];
    if (activeFilter === 'rating') {
      arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (activeFilter === 'price') {
      arr.sort((a, b) => (a.price_from || 0) - (b.price_from || 0));
    } else if (activeFilter === 'nearby') {
      arr.sort((a: any, b: any) => (a._distance ?? 9999) - (b._distance ?? 9999));
    } else if (activeFilter === 'online') {
      arr = arr.filter(l => (l as any).verified);
    } else if (activeFilter === 'open') {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours() + now.getMinutes() / 60;
      arr = arr.filter(l => {
        const wh = (l as any).metadata?.working_hours?.[day];
        if (!wh || !wh.open || !wh.close) return true;
        const [oh, om] = String(wh.open).split(':').map(Number);
        const [ch, cm] = String(wh.close).split(':').map(Number);
        return hour >= (oh + (om || 0) / 60) && hour <= (ch + (cm || 0) / 60);
      });
    }
    return arr;
  }, [locations, activeFilter]);

  // Show address suggestions only if query looks like an address
  // OR if there are no business matches
  const looksLikeAddress = useMemo(() => ADDRESS_HINT_RE.test(query), [query]);
  const showAddressSuggestions = suggestions.length > 0 && (looksLikeAddress || locations.length === 0);

  // Nominatim suggestions — only fetch when query looks like address or no matches
  useEffect(() => {
    if (query.length < 3) { setSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Skip request if we already have business matches and query doesn't look like address
      if (locations.length > 0 && !ADDRESS_HINT_RE.test(query)) {
        setSuggestions([]);
        return;
      }
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=uz&limit=4&format=json`)
        .then(r => r.json())
        .then(data => setSuggestions(Array.isArray(data) ? data : []))
        .catch(() => setSuggestions([]));
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, locations.length]);

  // Keyboard detection for iOS/Android
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      const h = window.innerHeight - vv.height;
      setKeyboardHeight(h > 100 ? h : 0);
    };
    vv.addEventListener('resize', handler);
    return () => vv.removeEventListener('resize', handler);
  }, []);

  const handleClear = () => {
    setQuery('');
    onSearch('');
    setSuggestions([]);
    setActiveFilter(null);
  };

  const handleSuggestionClick = (s: any) => {
    onLocationSelect(parseFloat(s.lat), parseFloat(s.lon), s.display_name);
    setQuery(s.display_name);
    setSuggestions([]);
    setStateWithHaptic('half');
  };

  const showChips = state === 'half' || state === 'full';
  const hasQuery = query.trim().length > 0;
  // When user is searching, always show full vertical list
  const showFullList = hasQuery || state === 'full' || state === 'half';

  return (
    <motion.div
      animate={{ height: HEIGHT_MAP[state] }}
      transition={{ type: 'spring', stiffness: 500, damping: 36, mass: 0.6 }}
      className="absolute left-0 right-0 z-[1000] bg-background/95 rounded-t-2xl border-t border-border flex flex-col"
      style={{ overflow: 'hidden', bottom: `${BOTTOM_NAV_HEIGHT}px` }}
    >
      {/* Drag handle ONLY */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.35}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        className="flex-shrink-0"
        style={{ touchAction: 'none' }}
      >
        {/* Handle */}
        <div
          className="w-full flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
          onClick={handlePeekTap}
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
      </motion.div>

      {/* Non-draggable header content */}
      <div className="flex-shrink-0">
        {/* Category chips */}
        <div className="px-4 pb-2">
          <CategoryChips selected={category} onSelect={onCategorySelect} selectedSub={subcategory} onSubSelect={onSubcategorySelect} />
        </div>

        {/* Search bar */}
        <div className="relative px-4 pb-2">
          <div className="flex items-center gap-2 bg-secondary/60 rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); onSearch(e.target.value); }}
              onFocus={() => { if (state !== 'full') setStateWithHaptic('full'); }}
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

          {showAddressSuggestions && (
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

        {/* Filter pills — always visible when there are results */}
        {showChips && sortedLocations.length > 0 && (
          <div className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-hide">
            {[
              { id: 'nearby', label: '📍 Рядом', requires: nearbyMode },
              { id: 'rating', label: '⭐ Рейтинг', requires: true },
              { id: 'price', label: '💰 Цена', requires: true },
              { id: 'open', label: '🟢 Открыто', requires: true },
              { id: 'online', label: '✅ Онлайн', requires: true },
            ].filter(p => p.requires).map(p => {
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
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ paddingBottom: `${70 + keyboardHeight}px`, overscrollBehavior: 'contain' }}>
        {showFullList ? (
          <div className="space-y-3 pt-1">
            {/* Section header */}
            {!loading && sortedLocations.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {hasQuery ? `Найдено` : (nearbyMode ? 'Рядом' : 'Результаты')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {sortedLocations.length}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-secondary/60 rounded-lg p-0.5">
                  <button
                    onClick={() => { haptic(); setViewMode('cards'); }}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === 'cards' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                    aria-label="Card view"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { haptic(); setViewMode('list'); }}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                    aria-label="List view"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {loading ? <SkeletonList count={4} /> : sortedLocations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Search className="w-10 h-10 text-muted-foreground/40" />
                <span className="text-muted-foreground text-sm">{t('index.nothing_found')}</span>
              </div>
            ) : (
              sortedLocations.slice(0, 30).map((loc: any, i: number) => (
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
        ) : (
          /* Half state: horizontal scroll cards */
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">
                {nearbyMode ? t('index.nearby_me') : t('index.popular_nearby')}
              </span>
              <span className="text-xs text-muted-foreground">
                {sortedLocations.length} {t('index.found')}
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {loading ? (
                <div className="flex gap-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="min-w-[190px] h-[140px] rounded-lg bg-muted animate-pulse flex-shrink-0" />
                  ))}
                </div>
              ) : sortedLocations.length === 0 ? (
                <div className="flex flex-col items-center justify-center w-full py-6 gap-2">
                  <Search className="w-8 h-8 text-muted-foreground/40" />
                  <span className="text-muted-foreground text-xs">{t('index.nothing_found')}</span>
                </div>
              ) : (
                sortedLocations.slice(0, 10).map((loc: any) => (
                  <div
                    key={loc.id}
                    onClick={() => onServiceClick(loc)}
                    className="min-w-[190px] flex-shrink-0 rounded-lg bg-secondary/60 border border-border/50 overflow-hidden cursor-pointer active:scale-[0.97] transition-transform"
                  >
                    {loc.gallery?.[0] ? (
                      <img src={loc.gallery[0]} alt={loc.name} className="w-full h-[90px] object-cover" loading="lazy" />
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
                  </div>
                ))
              )}
            </div>

            {!hasQuery && (
              <div className="pt-3">
                <button
                  onClick={() => { onSearch(''); onCategorySelect('all'); setStateWithHaptic('full'); }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-medium active:scale-[0.98] transition-transform"
                >
                  <span>🔥</span>
                  Доступно сейчас
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default SmartBottomSheet;
