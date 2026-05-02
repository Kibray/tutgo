import { useState, useCallback, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Menu } from 'lucide-react';

import BottomNav from '@/components/BottomNav';
import BusinessSheet from '@/components/BusinessSheet';
import MobileSidebar from '@/components/MobileSidebar';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SmartBottomSheet from '@/components/SmartBottomSheet';
import { useLocations } from '@/hooks/useLocations';
import { useCategories } from '@/hooks/useCategories';
import { useFavorites } from '@/hooks/useFavorites';
import { useNotifications } from '@/hooks/useNotifications';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { usePreferences } from '@/hooks/usePreferences';
import type { LocationItem } from '@/lib/types';
import { getBizType } from '@/lib/categories';

const MapView = lazy(() => import('@/components/MapView'));
const AiAssistantFab = lazy(() => import('@/components/AiAssistantFab'));
const OnboardingFlow = lazy(() => import('@/components/onboarding/OnboardingFlow'));
const DesktopIndex = lazy(() => import('@/components/desktop/DesktopIndex'));

const TASHKENT: [number, number] = [41.3111, 69.2797];

const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const Index = () => {
  const isDesktop = useIsDesktop();
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('onboarding_completed');
  });

  const completeOnboarding = useCallback(() => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
  }, []);

  if (isDesktop) return <Suspense fallback={null}><DesktopIndex /></Suspense>;

  if (showOnboarding) {
    return <Suspense fallback={null}><OnboardingFlow onComplete={completeOnboarding} /></Suspense>;
  }

  return <MobileIndex />;
};

const MobileIndex = () => {
  const navigate = useNavigate();
  const { t } = usePreferences();
  const [category, setCategory] = useState('all');
  const [subcategory, setSubcategory] = useState('all');
  const [search, setSearch] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [sheetService, setSheetService] = useState<LocationItem | null>(null);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [geolocating, setGeolocating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const { locations: filtered, allLocations, loading } = useLocations(
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
      .sort((a, b) => a._distance - b._distance);
  }, [filtered, nearbyMode, userLocation]);

  // Stable map dataset: only depends on category/subcategory, NOT search query.
  // Prevents leaflet cluster recompute on every keystroke.
  const mapLocations = useMemo(() => {
    if (!nearbyMode || !userLocation) return allLocations.filter(l => {
      const matchCat = category === 'all' || l.business_type === (selectedCat ? getBizType(selectedCat.name) : 'all');
      const matchSub = !subcategory || subcategory === 'all' || l.sub_category === subcategory;
      return matchCat && matchSub;
    });
    return allLocations
      .filter(l => {
        const matchCat = category === 'all' || l.business_type === (selectedCat ? getBizType(selectedCat.name) : 'all');
        const matchSub = !subcategory || subcategory === 'all' || l.sub_category === subcategory;
        return matchCat && matchSub;
      })
      .map(loc => ({
        ...loc,
        _distance: getDistanceKm(userLocation[0], userLocation[1], loc.lat || 0, loc.lng || 0),
      }));
  }, [allLocations, category, subcategory, nearbyMode, userLocation, selectedCat]);


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
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred('light');
    if (isBookable(s)) {
      navigate(`/service/${s.id}`);
    } else {
      setSheetService(s);
    }
  };

  const handleCategorySelect = (id: string) => { setCategory(id); setSubcategory('all'); };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="w-full h-full bg-background" />}>
          <MapView
            services={mapLocations}
            onMarkerClick={handleMarkerClick}
            center={mapCenter}
            nearbyMode={nearbyMode}
            userLocation={userLocation}
          />
        </Suspense>
      </div>

      <div className="absolute top-0 left-0 right-0 z-[1000] px-4 pt-4 pointer-events-none">
        <div className="pointer-events-auto">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-9 h-9 rounded-full bg-secondary/80 backdrop-blur-sm flex items-center justify-center"
              >
                <Menu className="w-4.5 h-4.5 text-foreground" />
              </button>
              <h1 onClick={() => navigate('/')} className="text-xl font-bold font-display text-foreground drop-shadow-lg cursor-pointer">
                TUT<span className="text-gradient-green">GO</span>
              </h1>
            </div>
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
        </div>
      </div>

      <SmartBottomSheet
        locations={displayLocations}
        loading={loading}
        nearbyMode={nearbyMode}
        userLocation={userLocation}
        category={category}
        onCategorySelect={handleCategorySelect}
        subcategory={subcategory}
        onSubcategorySelect={setSubcategory}
        onSearch={setSearch}
        onGeolocate={handleCenterOnMe}
        geolocating={geolocating}
        onLocationSelect={handleLocationSelect}
        onDisableNearby={handleDisableNearby}
        onServiceClick={handleMarkerClick}
        onToggleFavorite={toggleFavorite}
        isFavorite={isFavorite}
      />

      <BusinessSheet service={sheetService} open={!!sheetService} onClose={() => setSheetService(null)}
        onFullPage={() => { if (sheetService) { navigate(`/service/${sheetService.id}`); setSheetService(null); } }} />
      <Suspense fallback={null}>
        <AiAssistantFab onShowOnMap={(locs) => {
          if (locs.length === 1 && locs[0].lat && locs[0].lng) {
            setMapCenter([locs[0].lat, locs[0].lng]);
          } else if (locs.length > 0) {
            const first = locs.find(l => l.lat && l.lng);
            if (first) setMapCenter([first.lat!, first.lng!]);
          }
        }} />
      </Suspense>
      <MobileSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <BottomNav />
    </div>
  );
};

export default Index;
