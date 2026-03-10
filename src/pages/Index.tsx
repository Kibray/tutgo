import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLocations } from '@/hooks/useLocations';
import { useCategories } from '@/hooks/useCategories';
import { useFavorites } from '@/hooks/useFavorites';
import { useNotifications } from '@/hooks/useNotifications';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { usePreferences } from '@/hooks/usePreferences';
import DesktopIndex from '@/components/desktop/DesktopIndex';
import type { LocationItem } from '@/lib/types';

const TASHKENT: [number, number] = [41.3111, 69.2797];
const NEARBY_RADIUS_KM = 2;

const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (km: number): string => {
  if (km < 1) return `${Math.round(km * 1000)} м`;
  return `${km.toFixed(1)} км`;
};

const Index = () => {
  const isDesktop = useIsDesktop();

  if (isDesktop) return <DesktopIndex />;

  return <MobileIndex />;
};

const MobileIndex = () => {
  const navigate = useNavigate();
  const { t } = usePreferences();
  const [category, setCategory] = useState('all');
  const [subcategory, setSubcategory] = useState('all');
  const [search, setSearch] = useState('');
  const [listExpanded, setListExpanded] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [sheetService, setSheetService] = useState<LocationItem | null>(null);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [geolocating, setGeolocating] = useState(false);
  const { categories } = useCategories();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { unreadCount } = useNotifications();

  const autoGeolocated = useRef(false);
  useEffect(() => {
    if (autoGeolocated.current) return;
    autoGeolocated.current = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          setMapCenter(loc);
          setNearbyMode(true);
        },
        () => setMapCenter(TASHKENT),
        { timeout: 5000 }
      );
    } else {
      setMapCenter(TASHKENT);
    }
  }, []);

  const selectedCat = categories.find(c => c.id === category);
  const { locations: filtered, loading } = useLocations(
    category === 'all' ? 'all' : (selectedCat ? getBizType(selectedCat.name) : 'all'),
    subcategory,
    search
  );

  const displayLocations = useMemo(() => {
    if (!nearbyMode || !userLocation) return filtered;
    return filtered
      .map(loc => ({
        ...loc,
        _distance: getDistanceKm(userLocation[0], userLocation[1], loc.lat || 0, loc.lng || 0),
      }))
      .filter(loc => loc._distance <= NEARBY_RADIUS_KM)
      .sort((a, b) => a._distance - b._distance);
  }, [filtered, nearbyMode, userLocation]);

  const mapLocations = nearbyMode ? displayLocations : filtered;

  const handleCenterOnMe = useCallback(() => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred('light');
    setGeolocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          setMapCenter(loc);
          setNearbyMode(true);
          setListExpanded(true);
          setGeolocating(false);
        },
        () => { setMapCenter(TASHKENT); setGeolocating(false); },
        { timeout: 5000 }
      );
    } else {
      setGeolocating(false);
    }
  }, []);

  const handleDisableNearby = useCallback(() => {
    setNearbyMode(false);
    setUserLocation(null);
  }, []);

  const handleLocationSelect = useCallback((lat: number, lng: number, _address: string) => {
    setMapCenter([lat, lng]);
    setListExpanded(false);
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
        <MapView
          services={mapLocations}
          onMarkerClick={handleMarkerClick}
          center={mapCenter}
          nearbyMode={nearbyMode}
          userLocation={userLocation}
        />
      </div>

      <div className="absolute top-0 left-0 right-0 z-[1000] px-4 pt-4 pointer-events-none">
        <div className="pointer-events-auto">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold font-display text-foreground drop-shadow-lg">
              TUT<span className="text-gradient-green">GO</span>
            </h1>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <button onClick={() => navigate('/notifications')} className="relative w-9 h-9 rounded-full bg-secondary/80 backdrop-blur-sm flex items-center justify-center">
                <Bell className="w-4.5 h-4.5 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </motion.div>
          <SearchBar onSearch={handleSearch} onSubmit={handleSearchSubmit} onLocationSelect={handleLocationSelect} onGeolocate={handleCenterOnMe} geolocating={geolocating} />
          <div className="mt-3">
            <CategoryChips selected={category} onSelect={handleCategorySelect} selectedSub={subcategory} onSubSelect={setSubcategory} />
          </div>
        </div>
      </div>

      <div className="absolute z-[1000] flex flex-col gap-2"
        style={{ bottom: listExpanded ? 'calc(50% + 80px + 16px)' : 'calc(80px + 70px + 16px)', right: '16px', transition: 'bottom 0.3s ease' }}>
        {nearbyMode && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleDisableNearby}
            className="w-10 h-10 glass-strong rounded-full flex items-center justify-center shadow-lg ring-1 ring-primary/30"
          >
            <span className="text-xs">✕</span>
          </motion.button>
        )}
        <button onClick={handleCenterOnMe}
          className={`w-10 h-10 glass-strong rounded-full flex items-center justify-center shadow-lg transition-colors ${nearbyMode ? 'ring-2 ring-primary bg-primary/20' : ''}`}>
          <Locate className="w-5 h-5 text-primary" />
        </button>
      </div>

      <motion.div
        animate={{ height: listExpanded ? '50%' : '80px' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute bottom-0 left-0 right-0 z-[1000] bg-background/95 backdrop-blur-xl rounded-t-2xl border-t border-border"
        style={{ paddingBottom: '70px' }}>
        <button onClick={toggleList} className="w-full flex flex-col items-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mb-2" />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {listExpanded ? (<><ChevronDown className="w-3.5 h-3.5" />{t('index.collapse')}</>) : (<><ChevronUp className="w-3.5 h-3.5" />{displayLocations.length} {t('index.places_found')}</>)}
          </div>
        </button>

        <AnimatePresence>
          {listExpanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="overflow-y-auto px-4 pb-4" style={{ height: 'calc(100% - 50px)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">
                  {nearbyMode ? t('index.nearby_me') : category === 'all' ? t('index.popular_nearby') : (selectedCat?.name || '')}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {displayLocations.length} {t('index.found')}
                  {nearbyMode && ' · до 2 км'}
                </span>
              </div>
              {loading ? <SkeletonList count={4} /> : (
                <div className="space-y-3">
                  {displayLocations.map((loc: any, i: number) => (
                    <div key={loc.id} className="relative">
                      <ServiceCard service={loc} index={i} onClick={() => handleMarkerClick(loc)}
                        isFavorite={isFavorite(loc.id)} onToggleFavorite={toggleFavorite} />
                      {nearbyMode && loc._distance != null && (
                        <div className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                          {formatDistance(loc._distance)}
                        </div>
                      )}
                    </div>
                  ))}
                  {displayLocations.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      {nearbyMode ? t('index.nothing_nearby') : t('index.nothing_found')}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!listExpanded && displayLocations.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 mt-1">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {displayLocations.slice(0, 8).map((s: any) => (
                  <motion.div key={s.id} whileTap={{ scale: 0.97 }} onClick={() => handleMarkerClick(s)}
                    className="glass-strong rounded-lg p-3 min-w-[200px] flex-shrink-0 cursor-pointer">
                    <p className="text-xs font-semibold text-foreground truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{s.address}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        {(s.price_from || 0) > 0 && (
                          <span className="text-xs font-bold text-gradient-green">
                            {new Intl.NumberFormat('ru-RU').format(s.price_from!)} {s.currency}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">⭐ {s.rating}</span>
                        {nearbyMode && s._distance != null && (
                          <span className="text-[10px] text-primary font-medium">{formatDistance(s._distance)}</span>
                        )}
                      </div>
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
    'Еда и напитки': 'cafe', 'Магазины': 'retail', 'Услуги': 'service',
  };
  return map[categoryName] || 'service';
};

export default Index;
