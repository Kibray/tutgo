import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Locate, ChevronUp, ChevronDown, Plus, Minus } from 'lucide-react';
import CategoryChips from '@/components/CategoryChips';
import ServiceCard from '@/components/ServiceCard';
import { SkeletonList } from '@/components/SkeletonCard';
import BusinessSheet from '@/components/BusinessSheet';
const MapView = React.lazy(() => import('@/components/MapView'));
const AiAssistantFab = React.lazy(() => import('@/components/AiAssistantFab'));
import DesktopHeader from '@/components/desktop/DesktopHeader';
import DesktopSidebar from '@/components/desktop/DesktopSidebar';
import { useLocations } from '@/hooks/useLocations';
import { useCategories } from '@/hooks/useCategories';
import { useFavorites } from '@/hooks/useFavorites';
import type { LocationItem } from '@/lib/types';
import { getBizType } from '@/lib/categories';

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


const DesktopIndex = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [subcategory, setSubcategory] = useState('all');
  const [search, setSearch] = useState('');
  const [drawerExpanded, setDrawerExpanded] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [sheetService, setSheetService] = useState<LocationItem | null>(null);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [geolocating, setGeolocating] = useState(false);
  const { categories } = useCategories();
  const { isFavorite, toggleFavorite } = useFavorites();

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
    setGeolocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          setMapCenter(loc);
          setNearbyMode(true);
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
  }, []);

  const isBookable = (s: LocationItem) =>
    ['beauty', 'medical', 'tour', 'service'].includes(s.business_type);

  const handleMarkerClick = (s: LocationItem) => {
    if (isBookable(s)) {
      navigate(`/service/${s.id}`);
    } else {
      setSheetService(s);
    }
  };

  const handleSearch = (query: string) => setSearch(query);
  const handleSearchSubmit = (query: string) => {
    if (query.trim()) setSearch(query);
  };
  const handleCategorySelect = (id: string) => { setCategory(id); setSubcategory('all'); };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <DesktopHeader
        onSearch={handleSearch}
        onSearchSubmit={handleSearchSubmit}
        onLocationSelect={handleLocationSelect}
        onGeolocate={handleCenterOnMe}
        geolocating={geolocating}
      />

      <div className="flex flex-1 overflow-hidden">
        <DesktopSidebar />

        {/* Map area */}
        <div className="flex-1 relative">
          {/* Map */}
          <div className="absolute inset-0">
            <React.Suspense fallback={null}>
              <MapView
                services={mapLocations}
                onMarkerClick={handleMarkerClick}
                center={mapCenter}
                nearbyMode={nearbyMode}
                userLocation={userLocation}
              />
            </React.Suspense>
          </div>

          {/* Floating categories over map */}
          <div className="absolute top-0 left-0 right-0 z-[1000] px-4 pt-3 pointer-events-none">
            <div className="pointer-events-auto">
              <CategoryChips selected={category} onSelect={handleCategorySelect} selectedSub={subcategory} onSubSelect={setSubcategory} />
            </div>
          </div>

          {/* Online indicator */}
          <div className="absolute top-3 left-4 z-[1000] mt-14">
            <div className="flex items-center gap-1.5 bg-card shadow-md rounded-full px-3 py-1.5 border border-border/50">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground font-medium">Онлайн</span>
            </div>
          </div>

          {/* Right controls: zoom + geolocation */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-2">
            <button className="w-9 h-9 bg-card shadow-md rounded-lg border border-border/50 flex items-center justify-center hover:bg-card transition-colors">
              <Plus className="w-4 h-4 text-foreground" />
            </button>
            <button className="w-9 h-9 bg-card shadow-md rounded-lg border border-border/50 flex items-center justify-center hover:bg-card transition-colors">
              <Minus className="w-4 h-4 text-foreground" />
            </button>
            <div className="h-px" />
            {nearbyMode && (
              <button
                onClick={handleDisableNearby}
                className="w-9 h-9 bg-card shadow-md rounded-lg border border-border/50 flex items-center justify-center hover:bg-card transition-colors"
              >
                <span className="text-xs">✕</span>
              </button>
            )}
            <button
              onClick={handleCenterOnMe}
              className={`w-9 h-9 bg-card shadow-md rounded-lg border border-border/50 flex items-center justify-center hover:bg-card transition-colors ${nearbyMode ? 'ring-2 ring-primary bg-primary/20' : ''}`}
            >
              <Locate className="w-4 h-4 text-primary" />
            </button>
          </div>

          {/* Bottom drawer */}
          <motion.div
            animate={{ height: drawerExpanded ? '280px' : '48px' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute bottom-0 left-0 right-0 z-[1000] bg-card rounded-t-xl border-t border-border overflow-hidden"
          >
            <button
              onClick={() => setDrawerExpanded(!drawerExpanded)}
              className="w-full flex items-center justify-center gap-2 h-12 hover:bg-secondary/30 transition-colors"
            >
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              <span className="text-xs text-muted-foreground font-medium ml-2">
                {drawerExpanded ? (
                  <span className="flex items-center gap-1"><ChevronDown className="w-3.5 h-3.5" />Свернуть</span>
                ) : (
                  <span className="flex items-center gap-1"><ChevronUp className="w-3.5 h-3.5" />{displayLocations.length} мест найдено · Развернуть</span>
                )}
              </span>
            </button>

            <AnimatePresence>
              {drawerExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 pb-4 overflow-x-auto"
                  style={{ height: 'calc(100% - 48px)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-foreground">
                      {nearbyMode ? 'Рядом со мной' : category === 'all' ? 'Популярное рядом' : (selectedCat?.name || '')}

                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {displayLocations.length} найдено
                      {nearbyMode && ' · до 2 км'}
                    </span>
                  </div>
                  {loading ? <SkeletonList count={4} /> : (
                    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                      {displayLocations.map((loc: any, i: number) => (
                        <div key={loc.id} className="min-w-[280px] max-w-[320px] flex-shrink-0 relative">
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
                        <div className="text-center py-8 text-muted-foreground text-sm w-full">
                          {nearbyMode ? 'Нет мест в радиусе 2 км.' : 'Ничего не найдено.'}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <BusinessSheet service={sheetService} open={!!sheetService} onClose={() => setSheetService(null)}
        onFullPage={() => { if (sheetService) { navigate(`/service/${sheetService.id}`); setSheetService(null); } }} />
      <React.Suspense fallback={null}>
        <AiAssistantFab onShowOnMap={(locs) => {
          if (locs.length === 1 && locs[0].lat && locs[0].lng) {
            setMapCenter([locs[0].lat, locs[0].lng]);
          } else if (locs.length > 0) {
            const first = locs.find(l => l.lat && l.lng);
            if (first) setMapCenter([first.lat!, first.lng!]);
          }
        }} />
      </React.Suspense>
    </div>
  );
};

export default DesktopIndex;
