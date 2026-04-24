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

const SMART_BLOCKS = [
  { id: 'barbershop', emoji: '💈', label: 'Барбершопы', filter: { business_type: 'beauty', sub_category: 'barbershop' } },
  { id: 'salon', emoji: '✂️', label: 'Салоны красоты', filter: { business_type: 'beauty', sub_category: 'salon' } },
  { id: 'deals', emoji: '🔥', label: 'Акции', filter: { is_promoted: true } },
  { id: 'new', emoji: '🆕', label: 'Новые места', filter: { sort: 'new' } },
  { id: 'top', emoji: '⭐', label: 'Топ рейтинг', filter: { sort: 'rating' } },
  { id: 'games', emoji: '⚽', label: 'Игры сегодня', filter: { type: 'games' } },
];

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
  const [visibleCount, setVisibleCount] = useState(5);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);

  const STORAGE_KEY = 'tutgo_smart_blocks';
  const ALL_BLOCK_IDS = SMART_BLOCKS.map(b => b.id);
  const [enabledBlocks, setEnabledBlocks] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return ALL_BLOCK_IDS;
  });
  const [showBlockEditor, setShowBlockEditor] = useState(false);

  const toggleBlock = (id: string) => {
    setEnabledBlocks(prev => {
      const next = prev.includes(id)
        ? prev.filter(b => b !== id)
        : [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

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

  const blockFilteredLocations = useMemo(() => {
    if (!activeBlock) return sortedLocations;
    const block = SMART_BLOCKS.find(b => b.id === activeBlock);
    if (!block) return sortedLocations;

    if (block.id === 'barbershop')
      return sortedLocations.filter((l: any) => l.sub_category === 'barbershop');
    if (block.id === 'salon')
      return sortedLocations.filter((l: any) => l.sub_category === 'salon' || l.sub_category === 'spa');
    if (block.id === 'deals')
      return sortedLocations.filter((l: any) => l.is_promoted === true);
    if (block.id === 'new')
      return [...sortedLocations].sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 20);
    if (block.id === 'top')
      return [...sortedLocations].sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0)).slice(0, 20);
    return sortedLocations;
  }, [activeBlock, sortedLocations]);

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

  useEffect(() => { setVisibleCount(5); }, [category, subcategory, query]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
    setSuggestions([]);
    setActiveFilter(null);
    setActiveBlock(null);
  };

  const handleSuggestionClick = (s: any) => {
    onLocationSelect(parseFloat(s.lat), parseFloat(s.lon), s.display_name);
    setQuery(s.display_name);
    setSuggestions([]);
    setStateWithHaptic('half');
  };

  const hasQuery = query.trim().length > 0;
  const showChips = state === 'half' || state === 'full';
  const showFullList = hasQuery || state === 'full' || !!activeBlock;

  return (
    <motion.div
      animate={{ height: HEIGHT_MAP[state] }}
      transition={{ type: 'spring', stiffness: 500, damping: 36, mass: 0.6 }}
      className="absolute left-0 right-0 z-[1000] bg-[#1a1c23]/98 backdrop-blur-xl rounded-t-2xl border-t border-white/5 flex flex-col"
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
                    {blockFilteredLocations.length}
                  </span>
                  {activeBlock && (
                    <button
                      onClick={() => { setActiveBlock(null); setStateWithHaptic('half'); }}
                      className="text-xs text-primary flex items-center gap-1"
                    >
                      {SMART_BLOCKS.find(b => b.id === activeBlock)?.emoji}{' '}
                      {SMART_BLOCKS.find(b => b.id === activeBlock)?.label}
                      <span className="ml-1 text-muted-foreground">✕</span>
                    </button>
                  )}
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

            {loading ? <SkeletonList count={4} /> : blockFilteredLocations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Search className="w-10 h-10 text-muted-foreground/40" />
                <span className="text-muted-foreground text-sm">{t('index.nothing_found')}</span>
              </div>
            ) : (
              blockFilteredLocations.slice(0, visibleCount).map((loc: any, i: number) => (
                <div key={loc.id} className="relative">
                  <ServiceCard
                    service={loc}
                    index={i}
                    onClick={() => onServiceClick(loc)}
                    isFavorite={isFavorite(loc.id)}
                    onToggleFavorite={onToggleFavorite}
                    compact={!activeBlock && !hasQuery && viewMode === 'list'}
                    gallery2gis={!!(activeBlock || hasQuery)}
                  />
                  {nearbyMode && loc._distance != null && (
                    <div className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm z-10">
                      {formatDistance(loc._distance)}
                    </div>
                  )}
                </div>
              ))
            )}
            {!loading && blockFilteredLocations.length > visibleCount && (
              <button
                onClick={() => setVisibleCount(prev => prev + 10)}
                className="w-full py-3 rounded-xl bg-secondary/60 border border-border/50 text-sm text-muted-foreground font-medium active:scale-[0.98] transition-transform"
              >
                Показать ещё ({blockFilteredLocations.length - visibleCount} мест)
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                Быстрый выбор
              </span>
              <button
                onClick={() => setShowBlockEditor(true)}
                className="text-xs text-primary flex items-center gap-1"
              >
                ✏️ Настроить
              </button>
            </div>
            {/* Smart Blocks grid */}
            <div className="grid grid-cols-3 gap-2">
              {SMART_BLOCKS.filter(b => enabledBlocks.includes(b.id)).map((block) => {
                const isActive = activeBlock === block.id;
                return (
                  <motion.button
                    key={block.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      haptic();
                      setActiveBlock(isActive ? null : block.id);
                      if (!isActive) setStateWithHaptic('full');
                    }}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-colors ${
                      isActive
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'bg-secondary/60 border-border/50 text-foreground'
                    }`}
                  >
                    <span className="text-2xl">{block.emoji}</span>
                    <span className="text-[11px] font-medium text-center leading-tight">
                      {block.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {showBlockEditor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] flex flex-col justify-end"
          onClick={() => setShowBlockEditor(false)}
        >
          <motion.div
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-t-3xl border-t border-border"
            style={{ maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header - fixed */}
            <div className="flex items-center justify-between p-5 pb-3 flex-shrink-0">
              <h3 className="font-semibold text-base">Мои блоки</h3>
              <button
                onClick={() => setShowBlockEditor(false)}
                className="bg-primary text-white text-sm font-medium px-4 py-1.5 rounded-full"
              >
                Готово
              </button>
            </div>
            <p className="text-xs text-muted-foreground px-5 pb-3 flex-shrink-0">
              Выбери что показывать на главном экране
            </p>
            {/* Scrollable list */}
            <div className="overflow-y-auto flex-1 px-5 pb-8 space-y-2">
              {SMART_BLOCKS.map(block => {
                const isEnabled = enabledBlocks.includes(block.id);
                return (
                  <button
                    key={block.id}
                    onClick={() => toggleBlock(block.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      isEnabled
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-secondary/50 border-border/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{block.emoji}</span>
                      <span className="text-sm font-medium">{block.label}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isEnabled
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    }`}>
                      {isEnabled && (
                        <span className="text-white text-[10px] font-bold">✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SmartBottomSheet;
