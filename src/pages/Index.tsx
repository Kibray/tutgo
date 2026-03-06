import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Locate, ChevronUp, ChevronDown, Bell } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import CategoryChips from '@/components/CategoryChips';
import ServiceCard from '@/components/ServiceCard';
import BottomNav from '@/components/BottomNav';
import BusinessSheet from '@/components/BusinessSheet';
import { SkeletonList } from '@/components/SkeletonCard';
import MapView from '@/components/MapView';
import AiAssistantFab from '@/components/AiAssistantFab';
import { useLocations } from '@/hooks/useLocations';
import { useCategories } from '@/hooks/useCategories';
import { useFavorites } from '@/hooks/useFavorites';
import { useNotifications } from '@/hooks/useNotifications';
import type { LocationItem } from '@/lib/types';

const TASHKENT: [number, number] = [41.3111, 69.2797];

const Index = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [subcategory, setSubcategory] = useState('all');
  const [search, setSearch] = useState('');
  const [listExpanded, setListExpanded] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [sheetService, setSheetService] = useState<LocationItem | null>(null);
  const { categories } = useCategories();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { unreadCount } = useNotifications();

  // Map category UUID to business_type name for filtering
  const selectedCat = categories.find(c => c.id === category);
  const categoryName = selectedCat?.name;
  // We filter by business_type string which matches the category name logic
  const { locations: filtered, loading } = useLocations(
    category === 'all' ? 'all' : (selectedCat ? getBizType(selectedCat.name) : 'all'),
    subcategory,
    search
  );

  const handleCenterOnMe = useCallback(() => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred('light');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMapCenter([pos.coords.latitude, pos.coords.longitude]),
        () => setMapCenter(TASHKENT)
      );
    }
  }, []);

  const isBookable = (s: LocationItem) =>
    ['beauty', 'medical', 'tour', 'service'].includes(s.business_type);

  const handleMarkerClick = (s: LocationItem) => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred('light');
    if (isBookable(s)) {
      navigate(`/service/${s.id}`);
    } else {
      setSheetService(s);
    }
  };

  const handleSearch = (query: string) => setSearch(query);
  const handleSearchSubmit = (query: string) => {
    if (query.trim()) { setSearch(query); setListExpanded(false); }
  };
  const handleCategorySelect = (id: string) => { setCategory(id); setSubcategory('all'); };
  const toggleList = () => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred('light');
    setListExpanded(!listExpanded);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <MapView services={filtered} onMarkerClick={handleMarkerClick} center={mapCenter} />
      </div>

      <div className="absolute top-0 left-0 right-0 z-[1000] px-4 pt-4 pointer-events-none">
        <div className="pointer-events-auto">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold font-display text-foreground drop-shadow-lg">
              TUT<span className="text-gradient-green">GO</span>
            </h1>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/notifications')} className="relative w-9 h-9 rounded-full bg-secondary/80 backdrop-blur-sm flex items-center justify-center">
                <Bell className="w-4.5 h-4.5 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <div className="w-9 h-9 rounded-full bg-secondary/80 backdrop-blur-sm flex items-center justify-center text-sm">🇺🇿</div>
            </div>
          </motion.div>
          <SearchBar onSearch={handleSearch} onSubmit={handleSearchSubmit} />
          <div className="mt-3">
            <CategoryChips selected={category} onSelect={handleCategorySelect} selectedSub={subcategory} onSubSelect={setSubcategory} />
          </div>
        </div>
      </div>

      <button onClick={handleCenterOnMe}
        className="absolute z-[1000] w-10 h-10 glass-strong rounded-full flex items-center justify-center shadow-lg"
        style={{ bottom: listExpanded ? 'calc(50% + 80px + 16px)' : 'calc(80px + 70px + 16px)', right: '16px', transition: 'bottom 0.3s ease' }}>
        <Locate className="w-5 h-5 text-primary" />
      </button>

      <motion.div
        animate={{ height: listExpanded ? '50%' : '80px' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute bottom-0 left-0 right-0 z-[1000] bg-background/95 backdrop-blur-xl rounded-t-2xl border-t border-border"
        style={{ paddingBottom: '70px' }}>
        <button onClick={toggleList} className="w-full flex flex-col items-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mb-2" />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {listExpanded ? (<><ChevronDown className="w-3.5 h-3.5" />Свернуть</>) : (<><ChevronUp className="w-3.5 h-3.5" />{filtered.length} мест найдено</>)}
          </div>
        </button>

        <AnimatePresence>
          {listExpanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="overflow-y-auto px-4 pb-4" style={{ height: 'calc(100% - 50px)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">
                  {category === 'all' ? 'Популярное рядом' : (selectedCat?.name || '')}
                </h2>
                <span className="text-xs text-muted-foreground">{filtered.length} найдено</span>
              </div>
              {loading ? <SkeletonList count={4} /> : (
                <div className="space-y-3">
                  {filtered.map((loc, i) => (
                    <ServiceCard key={loc.id} service={loc} index={i} onClick={() => handleMarkerClick(loc)}
                      isFavorite={isFavorite(loc.id)} onToggleFavorite={toggleFavorite} />
                  ))}
                  {filtered.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground text-sm">Ничего не найдено. Попробуйте другой запрос.</div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!listExpanded && filtered.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 mt-1">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {filtered.slice(0, 8).map((s) => (
                  <motion.div key={s.id} whileTap={{ scale: 0.97 }} onClick={() => handleMarkerClick(s)}
                    className="glass-strong rounded-lg p-3 min-w-[200px] flex-shrink-0 cursor-pointer">
                    <p className="text-xs font-semibold text-foreground truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{s.address}</p>
                    <div className="flex items-center justify-between mt-2">
                      {(s.price_from || 0) > 0 && (
                        <span className="text-xs font-bold text-gradient-green">
                          {new Intl.NumberFormat('ru-RU').format(s.price_from!)} {s.currency}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">⭐ {s.rating}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <BusinessSheet service={sheetService} open={!!sheetService} onClose={() => setSheetService(null)}
        onFullPage={() => { if (sheetService) { navigate(`/service/${sheetService.id}`); setSheetService(null); } }} />
      <AiAssistantFab onShowOnMap={(locs) => {
        if (locs.length === 1 && locs[0].lat && locs[0].lng) {
          setMapCenter([locs[0].lat, locs[0].lng]);
        } else if (locs.length > 0) {
          const first = locs.find(l => l.lat && l.lng);
          if (first) setMapCenter([first.lat!, first.lng!]);
        }
        setListExpanded(false);
      }} />
      <BottomNav />
    </div>
  );
};

const getBizType = (categoryName: string): string => {
  const map: Record<string, string> = {
    'Медицина': 'medical', 'Красота': 'beauty', 'Туры': 'tour',
    'Кофейни': 'cafe', 'Магазины': 'retail', 'Услуги': 'service',
  };
  return map[categoryName] || 'service';
};

export default Index;
