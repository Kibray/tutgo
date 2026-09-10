import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, MapPin, Calendar, Star, ShieldCheck, Clock, CalendarCheck, Filter,
  ChevronDown, ChevronLeft, ChevronRight, List, LayoutGrid, Map as MapIcon, Locate, BadgeCheck, Heart, X,
  CloudSun, Gift, Layers3, Newspaper, Sparkles, HeartPulse, Coffee, Plane, ShoppingBag, Building2,
} from 'lucide-react';
import BusinessSheet from '@/components/BusinessSheet';
const MapView = React.lazy(() => import('@/components/MapView'));
const AiAssistantFab = React.lazy(() => import('@/components/AiAssistantFab'));
import DesktopHeader from '@/components/desktop/DesktopHeader';
import DesktopNavRail from '@/components/desktop/DesktopNavRail';
import DesktopScenarioTiles, { type ScenarioPreset } from '@/components/desktop/DesktopScenarioTiles';
import DesktopGuidePanel from '@/components/desktop/DesktopGuidePanel';
import { Button } from '@/components/ui/button';

import { useLocations } from '@/hooks/useLocations';
import { useCategories } from '@/hooks/useCategories';
import type { LocationItem } from '@/lib/types';
import { getBizType } from '@/lib/categories';

const TASHKENT: [number, number] = [41.3111, 69.2797];

const COLORS = {
  bg: '#f9fafb',
  card: '#ffffff',
  border: '#e5e7eb',
  accent: '#2563EB',
  accentBg: '#eff6ff',
  text: '#111111',
  text2: '#374151',
  muted: '#6b7280',
  green: '#10b981',
  shadow: '0 1px 3px rgba(0,0,0,0.06)',
  font: 'system-ui, sans-serif',
};

const card: React.CSSProperties = {
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 12,
  boxShadow: COLORS.shadow,
};

const formatDistance = (km: number) => km < 1 ? `${Math.round(km * 1000)} м` : `${km.toFixed(1)} км`;
const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const TIME_PILLS = ['14:00', '15:30', '17:00'];

const PLACEHOLDER_BY_TYPE: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  beauty: { icon: Sparkles, bg: 'linear-gradient(135deg,#fce7f3,#fdf2f8)', color: '#db2777' },
  medical: { icon: HeartPulse, bg: 'linear-gradient(135deg,#fee2e2,#fef2f2)', color: '#dc2626' },
  cafe: { icon: Coffee, bg: 'linear-gradient(135deg,#ffedd5,#fff7ed)', color: '#ea580c' },
  tour: { icon: Plane, bg: 'linear-gradient(135deg,#dbeafe,#eff6ff)', color: '#2563eb' },
  retail: { icon: ShoppingBag, bg: 'linear-gradient(135deg,#f3e8ff,#faf5ff)', color: '#9333ea' },
};

const PhotoPlaceholder: React.FC<{ size?: number; business_type?: string }> = ({ size = 32, business_type }) => {
  const config = (business_type && PLACEHOLDER_BY_TYPE[business_type]) || { icon: Building2, bg: 'linear-gradient(135deg,#e5e7eb,#f3f4f6)', color: '#6b7280' };
  const Icon = config.icon;
  return (
    <div style={{
      width: '100%', height: '100%',
      background: config.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={size} color={config.color} strokeWidth={1.5} />
    </div>
  );
};

const TimePill: React.FC<{ t: string; muted?: boolean }> = ({ t, muted }) => (
  <span style={{
    fontSize: 11, padding: '3px 8px', borderRadius: 6,
    background: muted ? '#f3f4f6' : COLORS.accentBg,
    color: muted ? COLORS.muted : COLORS.accent,
    border: muted ? `1px solid ${COLORS.border}` : `1px solid ${COLORS.accent}33`,
    fontWeight: 600, whiteSpace: 'nowrap',
  }}>{t}</span>
);

const DesktopIndex = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<'landing' | 'results'>('landing');
  const [category, setCategory] = useState('all');
  const [subcategory] = useState('all');
  const [search, setSearch] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [geolocating, setGeolocating] = useState(false);
  const [sheetService, setSheetService] = useState<LocationItem | null>(null);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [resultsMode, setResultsMode] = useState<'list' | 'split' | 'map'>('split');
  const [openNow, setOpenNow] = useState(false);
  // landingCategory removed — uses shared `category` state

  const HERO_IMAGE = 'https://images.unsplash.com/photo-1516571137133-19eb1f8c9b90?w=1600&auto=format&fit=crop&q=80';

  // Filter bar state
  const [priceSort, setPriceSort] = useState<'asc' | 'desc' | null>(null);
  const [ratingMin, setRatingMin] = useState<number | null>(null);
  const [showPriceMenu, setShowPriceMenu] = useState(false);
  const [showRatingMenu, setShowRatingMenu] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const priceMenuRef = useRef<HTMLDivElement | null>(null);
  const ratingMenuRef = useRef<HTMLDivElement | null>(null);
  const tabsScrollRef = useRef<HTMLDivElement | null>(null);
  const [tabsScroll, setTabsScroll] = useState({ showLeft: false, showRight: false });

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (priceMenuRef.current && !priceMenuRef.current.contains(e.target as Node)) setShowPriceMenu(false);
      if (ratingMenuRef.current && !ratingMenuRef.current.contains(e.target as Node)) setShowRatingMenu(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const updateTabsScroll = useCallback(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    setTabsScroll({
      showLeft: el.scrollLeft > 4,
      showRight: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateTabsScroll();
    const onResize = () => updateTabsScroll();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [updateTabsScroll]);


  const activeFilterCount = (priceSort ? 1 : 0) + (ratingMin ? 1 : 0);

  // Scenario / guide presets: a thin layer over the EXISTING category+search state.
  // When TutGo has no data model for a scenario yet, we show an honest empty state.
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  const { categories } = useCategories();

  useEffect(() => {
    updateTabsScroll();
  }, [categories, updateTabsScroll]);

  const applyPreset = useCallback((p: ScenarioPreset) => {
    if (p.route) { navigate(p.route); return; }
    if (p.soon) { setComingSoon(p.label); setView('results'); return; }
    const cat = p.biz && p.biz !== 'all'
      ? categories.find((c) => getBizType(c.name) === p.biz)
      : null;
    if (p.biz && p.biz !== 'all' && !cat) { setComingSoon(p.label); setView('results'); return; }
    setComingSoon(null);
    setSearch('');
    setCategory(cat ? cat.id : 'all');
    setPriceSort(p.price ?? null);
    setView('results');
  }, [categories, navigate]);

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
        },
        () => setMapCenter(TASHKENT),
        { timeout: 5000 }
      );
    } else {
      setMapCenter(TASHKENT);
    }
  }, []);

  const selectedCat = categories.find((c) => c.id === category);
  const { locations: filtered, loading } = useLocations(
    category === 'all' ? 'all' : (selectedCat ? getBizType(selectedCat.name) : 'all'),
    subcategory,
    search
  );

  const { locations: allLocations } = useLocations('all', 'all', '');

  const popular = useMemo(
    () => [...allLocations].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4),
    [allLocations]
  );
  const freeNow = useMemo(
    () => [...allLocations].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(4, 8),
    [allLocations]
  );

  const enriched = useMemo(() => {
    if (!userLocation) return filtered.map((l) => ({ ...l, _distance: null as number | null }));
    return filtered.map((l) => ({
      ...l,
      _distance: l.lat && l.lng ? getDistanceKm(userLocation[0], userLocation[1], l.lat, l.lng) : null,
    }));
  }, [filtered, userLocation]);

  // Apply filter-bar filters to LIST only (map keeps all `filtered`).
  const displayList = useMemo(() => {
    let list = enriched;
    if (ratingMin != null) list = list.filter((l) => (l.rating || 0) >= ratingMin);
    if (priceSort) {
      list = [...list].sort((a, b) => {
        const ap = a.price_from ?? Number.POSITIVE_INFINITY;
        const bp = b.price_from ?? Number.POSITIVE_INFINITY;
        return priceSort === 'asc' ? ap - bp : bp - ap;
      });
    }
    return list;
  }, [enriched, ratingMin, priceSort]);

  const popularEnriched = useMemo(() => {
    if (!userLocation) return popular.map((l) => ({ ...l, _distance: null as number | null }));
    return popular.map((l) => ({
      ...l,
      _distance: l.lat && l.lng ? getDistanceKm(userLocation[0], userLocation[1], l.lat, l.lng) : null,
    }));
  }, [popular, userLocation]);

  const handleCenterOnMe = useCallback(() => {
    setGeolocating(true);
    if (!navigator.geolocation) { setGeolocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        setMapCenter(loc);
        setGeolocating(false);
      },
      () => { setMapCenter(TASHKENT); setGeolocating(false); },
      { timeout: 5000 }
    );
  }, []);

  const isBookable = (s: LocationItem) =>
    ['beauty', 'medical', 'tour', 'service'].includes(s.business_type);

  // ============ LANDING VIEW ============
  if (view === 'landing') {
    return (
      <div className="min-h-screen text-foreground font-sans" style={{ background: '#f7f8fa' }}>
        <DesktopHeader
          searchValue={search}
          onSearch={setSearch}
          onSearchSubmit={(q) => { setSearch(q); setView('results'); }}
        />

        <div style={{ maxWidth: 1440, margin: '0 auto', padding: 24, display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <DesktopNavRail activeOverride="/" />
          <div style={{ flex: 1, minWidth: 0 }}>
          <div className="desktop-home-layout">
            <main style={{ minWidth: 0 }}>
            {/* SECTION 1 — Hero */}
            <div className="desktop-hero rounded-lg border border-border" style={{
              overflow: 'hidden',
              padding: '24px 28px', color: 'hsl(var(--primary-foreground))',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              position: 'relative',
            }}>
              {/* Static hero image */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `url(${HERO_IMAGE})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  zIndex: 0,
                }}
              />
              {/* Bottom gradient overlay for search readability */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0) 100%)',
                  zIndex: 0,
                }}
              />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: 0, color: 'hsl(var(--primary-foreground))' }}>
                  Всё, что нужно — рядом
                </h1>
                <p style={{ marginTop: 10, fontSize: 15, color: 'rgba(255,255,255,0.82)', maxWidth: 420, lineHeight: 1.5 }}>
                  Поиск услуг, интересных мест и событий в Ташкенте
                </p>
              </div>


              {/* Search form */}
              <div className="desktop-hero-search rounded-lg bg-card p-1.5" style={{ alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 40, borderRight: `1px solid ${COLORS.border}` }}>
                  <Search size={16} color={COLORS.muted} />
                  <input
                    placeholder="Что ищете?"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setView('results'); }}
                    style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: COLORS.text, background: 'transparent', fontFamily: COLORS.font, minWidth: 0 }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 40, borderRight: `1px solid ${COLORS.border}` }}>
                  <LayoutGrid size={15} color={COLORS.muted} />
                  <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setView('results'); }}
                    style={{
                      border: 'none', outline: 'none', fontSize: 13, color: COLORS.text2,
                      background: 'transparent', width: '100%', cursor: 'pointer', fontFamily: COLORS.font,
                    }}
                  >
                    <option value="all">Категория</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="desktop-search-optional" style={{ alignItems: 'center', gap: 6, padding: '0 12px', height: 40, color: COLORS.muted, fontSize: 13, borderRight: `1px solid ${COLORS.border}` }}>
                  <MapPin size={14} color={COLORS.accent} /> Где вы?
                </div>
                <div className="desktop-search-optional" style={{ alignItems: 'center', gap: 6, padding: '0 12px', height: 40, color: COLORS.muted, fontSize: 13 }}>
                  <Calendar size={14} color={COLORS.accent} /> Сегодня
                </div>
                <Button
                  onClick={() => setView('results')}
                  className="ml-2 h-10 rounded-lg px-4 text-sm"
                >
                  Найти места
                </Button>
              </div>
              </div>
            </div>

          {/* SECTION 2 — Category tabs */}
          <div className="relative mb-6">
            {tabsScroll.showLeft && (
              <button
                type="button"
                aria-label="Прокрутить категории влево"
                onClick={() => { const el = tabsScrollRef.current; if (el) el.scrollBy({ left: -el.clientWidth * 0.75, behavior: 'smooth' }); }}
                className="absolute left-1 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md ring-1 ring-border transition hover:bg-white"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <div
              ref={tabsScrollRef}
              onScroll={updateTabsScroll}
              className="overflow-x-auto rounded-lg border border-border bg-card px-2 shadow-sm scrollbar-hide"
            >
              <div style={{ display: 'flex', gap: 0, minWidth: 'fit-content' }}>
                {[{ id: 'all', name: 'Все категории', icon: '🏠' }, ...categories].map((c) => {
                  const active = category === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => c.name === 'Туры' ? navigate('/tours') : c.name === 'Спорт' ? navigate('/sport') : (setCategory(c.id), setView('results'))}
                      style={{
                        background: 'transparent', border: 'none',
                        padding: '14px 16px', cursor: 'pointer',
                        fontSize: 13, fontWeight: active ? 700 : 500,
                        color: active ? COLORS.accent : COLORS.text2,
                        borderBottom: active ? `2px solid ${COLORS.accent}` : '2px solid transparent',
                        whiteSpace: 'nowrap', fontFamily: COLORS.font,
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <span>{c.icon}</span> {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
            {tabsScroll.showRight && (
              <button
                type="button"
                aria-label="Прокрутить категории вправо"
                onClick={() => { const el = tabsScrollRef.current; if (el) el.scrollBy({ left: el.clientWidth * 0.75, behavior: 'smooth' }); }}
                className="absolute right-1 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md ring-1 ring-border transition hover:bg-white"
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          {/* SECTION 1.5 — Scenario presets (thin layer over existing category/search state) */}
          <div className="mb-6"><DesktopScenarioTiles onSelect={applyPreset} /></div>

          {/* SECTION 3 — Popular + Free + Map */}
          <div className="desktop-discovery-grid mb-6">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Popular */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h2 className="text-foreground" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Популярно сейчас 🔥</h2>
                  <button
                    onClick={() => setView('results')}
                    style={{ background: 'none', border: 'none', color: COLORS.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >Смотреть все</button>
                </div>
                <div className="desktop-popular-grid">
                  {popularEnriched.map((loc, idx) => (
                    <motion.div
                      key={loc.id}
                      whileHover={{ y: -2 }}
                      onClick={() => navigate(loc.business_type === 'tour' ? `/tours/${loc.id}` : `/service/${loc.id}`)}
                      className="border border-border rounded-xl shadow-sm"
                      style={{ background: '#ffffff', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                    >
                      <div style={{
                        height: 160, position: 'relative', overflow: 'hidden',
                        background: loc.gallery?.[0] ? `url(${loc.gallery[0]}) center/cover no-repeat` : undefined,
                      }}>
                        {!loc.gallery?.[0] && <PhotoPlaceholder business_type={loc.business_type} />}
                        {(loc.is_promoted || idx === 0) && (
                          <div style={{
                            position: 'absolute', top: 8, left: 8,
                            background: COLORS.accent, color: '#fff',
                            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                          }}>Популярное</div>
                        )}
                        {loc._distance != null && (
                          <div style={{
                            position: 'absolute', bottom: 6, left: 6,
                            background: 'rgba(0,0,0,0.65)', color: '#fff',
                            fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 6,
                            display: 'flex', alignItems: 'center', gap: 3,
                          }}><MapPin size={10} /> {formatDistance(loc._distance)}</div>
                        )}
                        <div
                          onClick={(e) => { e.stopPropagation(); }}
                          style={{
                            position: 'absolute', top: 8, right: 8,
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                          }}>
                          <Heart size={14} color={COLORS.text2} />
                        </div>
                      </div>
                      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className="text-foreground" style={{ fontWeight: 700, fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.name}</span>
                          {loc.verified && <BadgeCheck size={14} color={COLORS.accent} />}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: COLORS.text2 }}>
                          <Star size={12} fill="#f59e0b" color="#f59e0b" />
                          <span style={{ fontWeight: 600 }}>{loc.rating?.toFixed(1) || 'Новое'}</span>
                          <span className="text-muted-foreground">({loc.review_count || 0})</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.sub_category || loc.city || ''}</span>
                        </div>
                        {loc.price_from ? (
                          <div className="text-foreground" style={{ fontSize: 14, fontWeight: 700 }}>
                            от {loc.price_from.toLocaleString('ru-RU')} сум
                          </div>
                        ) : null}
                        <div style={{ fontSize: 12, color: COLORS.green, fontWeight: 600 }}>Открыто до 23:00</div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                          {TIME_PILLS.map((t) => <TimePill key={t} t={t} />)}
                          <TimePill t="+3" muted />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Free time */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h2 className="text-foreground" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Свободное время сегодня</h2>
                  <button
                    onClick={() => setView('results')}
                    style={{ background: 'none', border: 'none', color: COLORS.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >Смотреть все</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {freeNow.map((loc) => (
                    <motion.div
                      key={loc.id}
                      whileHover={{ y: -1 }}
                      onClick={() => navigate(loc.business_type === 'tour' ? `/tours/${loc.id}` : `/service/${loc.id}`)}
                      className="border border-border rounded-xl shadow-sm"
                      style={{ background: '#ffffff', padding: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                      <div style={{
                        width: 64, height: 64, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                        background: loc.gallery?.[0] ? `url(${loc.gallery[0]}) center/cover` : undefined,
                      }}>
                        {!loc.gallery?.[0] && <PhotoPlaceholder size={20} business_type={loc.business_type} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="text-foreground" style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.name}</div>
                        <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                          {TIME_PILLS.map((t) => <TimePill key={t} t={t} />)}
                          <TimePill t="+2" muted />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right map sidebar */}
            <div>
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div className="text-foreground" style={{ fontSize: 14, fontWeight: 700 }}>Места рядом с вами</div>
                  <button
                    onClick={() => setView('results')}
                    style={{ background: 'none', border: 'none', color: COLORS.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >Смотреть на карте →</button>
                </div>
                <div style={{ height: 200, borderRadius: 8, overflow: 'hidden', border: `1px solid ${COLORS.border}` }}>
                  <React.Suspense fallback={<div style={{ background: '#f3f4f6', width: '100%', height: '100%' }} />}>
                    <MapView services={allLocations.slice(0, 50)} onMarkerClick={() => setView('results')} center={mapCenter} userLocation={userLocation} nearbyMode={false} />
                  </React.Suspense>
                </div>
                <div className="text-muted-foreground" style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 12, flexWrap: 'wrap' }}>
                  <span>🟢 Есть места</span>
                  <span>🟡 Скоро освободится</span>
                  <span>🔴 Нет мест</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4 — Trust strip */}
          <div className="mb-10 grid grid-cols-2 gap-6 rounded-lg border border-border bg-card p-7 shadow-sm xl:grid-cols-4">
            {[
              { icon: <ShieldCheck size={20} />, title: 'Проверенные заведения', sub: 'Только реальные отзывы и рейтинги' },
              { icon: <CalendarCheck size={20} />, title: 'Онлайн-запись', sub: 'Мгновенное подтверждение и напоминания' },
              { icon: <Clock size={20} />, title: 'Актуальное расписание', sub: 'Только актуальное свободное время в реальном времени' },
              { icon: <Search size={20} />, title: 'Удобный поиск', sub: 'Фильтры, карта и многое другое для вашего комфорта' },
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: COLORS.accentBg, color: COLORS.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{t.icon}</div>
                <div>
                  <div className="text-foreground" style={{ fontSize: 14, fontWeight: 700 }}>{t.title}</div>
                  <div className="text-muted-foreground" style={{ fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>{t.sub}</div>
                </div>
              </div>
            ))}
          </div>
          </main>

          {/* Desktop city-guide sidebar; independent from hero height. */}
          <aside className="flex flex-col gap-4">
            <DesktopGuidePanel
              onSelect={applyPreset}
              onCta={() => applyPreset({ id: 'today', label: 'Куда пойти сегодня', emoji: '✨', biz: 'all' })}
            />

            <section className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"><Newspaper size={18} strokeWidth={1.8} /></span>
                <div className="text-sm font-bold">Интересное</div>
              </div>
              <p className="m-0 text-xs leading-5 text-muted-foreground">Подборки появятся здесь после добавления реальных материалов.</p>
            </section>

            <section className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"><Gift size={18} strokeWidth={1.8} /></span>
                <div className="text-sm font-bold">Дарим 10% на первое посещение</div>
              </div>
              <p className="mb-3 mt-0 text-xs leading-5 text-muted-foreground">Зарегистрируйтесь и получите скидку на любую услугу в вашем городе</p>
              <Button variant="outline" size="sm" onClick={() => navigate('/auth')} className="rounded-lg border-primary text-primary hover:bg-primary/5">Получить скидку</Button>
            </section>

            <section className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"><Layers3 size={18} strokeWidth={1.8} /></span>
                <div className="text-sm font-bold">Посмотрите места на карте</div>
              </div>
              <p className="mb-3 mt-0 text-xs leading-5 text-muted-foreground">Удобный поиск рядом с вами и актуальная информация о свободном времени</p>
              <Button variant="outline" size="sm" onClick={() => setView('results')} className="rounded-lg border-primary text-primary hover:bg-primary/5">Открыть карту →</Button>
            </section>

            <section className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"><CloudSun size={18} strokeWidth={1.8} /></span>
              <div>
                <div className="text-sm font-bold">Погода в Ташкенте</div>
                <div className="mt-1 text-xs text-muted-foreground">Данные пока недоступны</div>
              </div>
            </section>
          </aside>
          </div>
          </div>
        </div>


        <BusinessSheet service={sheetService} open={!!sheetService} onClose={() => setSheetService(null)}
          onFullPage={() => { if (sheetService) { navigate(sheetService.business_type === 'tour' ? `/tours/${sheetService.id}` : `/service/${sheetService.id}`); setSheetService(null); } }} />
        <React.Suspense fallback={null}>
          <AiAssistantFab onShowOnMap={(locs) => {
            const first = locs.find((l) => l.lat && l.lng);
            if (first) setMapCenter([first.lat!, first.lng!]);
          }} />
        </React.Suspense>
      </div>
    );
  }

  // ============ RESULTS VIEW ============
  const showList = resultsMode === 'list' || resultsMode === 'split';
  const showMap = resultsMode === 'map' || resultsMode === 'split';

  return (
    <div className="min-h-screen text-foreground font-sans" style={{ background: '#f7f8fa', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <DesktopHeader
        searchValue={search}
        onSearch={setSearch}
        onSearchSubmit={(q) => { setSearch(q); setView('results'); }}
        onLogoClick={() => setView('landing')}
      />

      {/* Sub-header */}
      <div style={{
        background: '#fff', borderBottom: `1px solid ${COLORS.border}`,
        padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <button
          onClick={() => { setComingSoon(null); setView('landing'); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: COLORS.text2, fontSize: 13, fontWeight: 500,
          }}
        >
          <ChevronLeft size={16} /> Назад
        </button>

        <div className="text-foreground" style={{ fontSize: 15, fontWeight: 700 }}>
          {comingSoon ? comingSoon : <>{search ? `«${search}» — ` : ''}{filtered.length} заведений</>}
        </div>

        <div style={{ display: comingSoon ? 'none' : 'flex', gap: 6, flex: 1, marginLeft: 8, flexWrap: 'wrap', position: 'relative', zIndex: 9998 }}>
          <button
            onClick={() => setShowMoreFilters(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              height: 34, padding: '0 12px',
              border: `1px solid ${COLORS.border}`, borderRadius: 8,
              background: '#fff', fontSize: 12, color: COLORS.text2, cursor: 'pointer',
            }}
          >
            <Filter size={12} /> Фильтры
            {activeFilterCount > 0 && (
              <span style={{
                background: COLORS.accent, color: '#fff', borderRadius: 8,
                fontSize: 10, fontWeight: 700, padding: '0 5px', minWidth: 16, height: 16,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>{activeFilterCount}</span>
            )}
          </button>

          <div ref={priceMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowPriceMenu((v) => !v); setShowRatingMenu(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                height: 34, padding: '0 12px',
                border: `1px solid ${priceSort ? COLORS.accent : COLORS.border}`, borderRadius: 8,
                background: priceSort ? COLORS.accentBg : '#fff',
                fontSize: 12, color: priceSort ? COLORS.accent : COLORS.text2, cursor: 'pointer',
                fontWeight: priceSort ? 600 : 400,
              }}
            >
              Цена{priceSort === 'asc' ? ' ↑' : priceSort === 'desc' ? ' ↓' : ''} <ChevronDown size={12} />
            </button>
            {showPriceMenu && (
              <div style={{
                position: 'absolute', top: 38, left: 0, zIndex: 9999,
                background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 200, padding: 4,
              }}>
                {[
                  { v: 'asc' as const, label: 'Сначала дешевле' },
                  { v: 'desc' as const, label: 'Сначала дороже' },
                ].map((o) => (
                  <button
                    key={o.v}
                    onClick={() => { setPriceSort(o.v); setShowPriceMenu(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '8px 10px', border: 'none', background: priceSort === o.v ? COLORS.accentBg : 'transparent',
                      color: priceSort === o.v ? COLORS.accent : COLORS.text2,
                      fontSize: 13, cursor: 'pointer', borderRadius: 6, fontWeight: priceSort === o.v ? 600 : 400,
                    }}
                  >{o.label}</button>
                ))}
                <button
                  onClick={() => { setPriceSort(null); setShowPriceMenu(false); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 10px', border: 'none', background: 'transparent',
                    color: COLORS.muted, fontSize: 13, cursor: 'pointer', borderRadius: 6,
                    borderTop: `1px solid ${COLORS.border}`, marginTop: 4,
                  }}
                >Сбросить</button>
              </div>
            )}
          </div>

          <div ref={ratingMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowRatingMenu((v) => !v); setShowPriceMenu(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                height: 34, padding: '0 12px',
                border: `1px solid ${ratingMin ? COLORS.accent : COLORS.border}`, borderRadius: 8,
                background: ratingMin ? COLORS.accentBg : '#fff',
                fontSize: 12, color: ratingMin ? COLORS.accent : COLORS.text2, cursor: 'pointer',
                fontWeight: ratingMin ? 600 : 400,
              }}
            >
              Рейтинг{ratingMin ? ` ${ratingMin}+` : ''} <ChevronDown size={12} />
            </button>
            {showRatingMenu && (
              <div style={{
                position: 'absolute', top: 38, left: 0, zIndex: 9999,
                background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 180, padding: 4,
              }}>
                {[4.0, 4.5].map((v) => (
                  <button
                    key={v}
                    onClick={() => { setRatingMin(v); setShowRatingMenu(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '8px 10px', border: 'none', background: ratingMin === v ? COLORS.accentBg : 'transparent',
                      color: ratingMin === v ? COLORS.accent : COLORS.text2,
                      fontSize: 13, cursor: 'pointer', borderRadius: 6, fontWeight: ratingMin === v ? 600 : 400,
                    }}
                  >От {v.toFixed(1)} ★</button>
                ))}
                <button
                  onClick={() => { setRatingMin(null); setShowRatingMenu(false); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 10px', border: 'none', background: 'transparent',
                    color: COLORS.muted, fontSize: 13, cursor: 'pointer', borderRadius: 6,
                    borderTop: `1px solid ${COLORS.border}`, marginTop: 4,
                  }}
                >Сбросить</button>
              </div>
            )}
          </div>

          <button
            onClick={() => setOpenNow(!openNow)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 34, padding: '0 12px',
              border: `1px solid ${openNow ? COLORS.accent : COLORS.border}`, borderRadius: 8,
              background: openNow ? COLORS.accentBg : '#fff',
              fontSize: 12, color: openNow ? COLORS.accent : COLORS.text2, cursor: 'pointer', fontWeight: 600,
            }}
          >
            Открыто сейчас
            <span style={{
              width: 28, height: 16, borderRadius: 8,
              background: openNow ? COLORS.accent : '#d1d5db',
              position: 'relative', transition: 'background 0.15s',
            }}>
              <span style={{
                position: 'absolute', top: 3, left: openNow ? 13 : 3,
                width: 10, height: 10, borderRadius: '50%', background: '#fff',
                transition: 'left 0.15s',
              }} />
            </span>
          </button>

          <button
            onClick={() => setShowMoreFilters(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              height: 34, padding: '0 12px', border: `1px solid ${COLORS.border}`,
              borderRadius: 8, background: '#fff', fontSize: 12, color: COLORS.text2, cursor: 'pointer',
            }}
          >
            Ещё фильтры <ChevronDown size={12} />
          </button>
        </div>

        {/* View switch */}
        <div style={{
          marginLeft: 'auto', display: 'flex',
          border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden',
        }}>
          {[
            { mode: 'list' as const, icon: <List size={14} />, label: 'Список' },
            { mode: 'split' as const, icon: <LayoutGrid size={14} />, label: 'Список + карта' },
            { mode: 'map' as const, icon: <MapIcon size={14} />, label: 'Только карта' },
          ].map((v, i, arr) => {
            const active = resultsMode === v.mode;
            return (
              <button
                key={v.mode}
                onClick={() => setResultsMode(v.mode)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  height: 34, padding: '0 14px',
                  background: active ? COLORS.accentBg : '#fff',
                  color: active ? COLORS.accent : COLORS.muted,
                  border: 'none',
                  borderRight: i < arr.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {v.icon} {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {comingSoon ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <div className="border border-border rounded-xl shadow-sm" style={{
              background: '#fff', padding: '40px 36px', maxWidth: 520, textAlign: 'center',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🧭</div>
              <div className="text-foreground" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                «{comingSoon}» — скоро
              </div>
              <div className="text-muted-foreground" style={{ fontSize: 14, lineHeight: 1.6 }}>
                Этот раздел гида пока готовится. Мы добавим сюда реальные места, как только они появятся в TutGo.
              </div>
              <button
                onClick={() => { setComingSoon(null); setView('landing'); }}
                style={{
                  marginTop: 20, background: COLORS.accent, color: '#fff', border: 'none',
                  borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Вернуться на главную
              </button>
            </div>
          </div>
        ) : (<>
        {showList && (
          <div style={{
            width: resultsMode === 'list' ? '100%' : 460,
            background: '#fff', borderRight: `1px solid ${COLORS.border}`,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 20px 8px', fontSize: 13, fontWeight: 600, color: COLORS.text2 }}>
              {displayList.length} заведений в Ташкенте
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 16px' }}>
              {loading ? (
                <div className="text-muted-foreground" style={{ padding: 32, textAlign: 'center', fontSize: 14 }}>Загрузка…</div>
              ) : displayList.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 34, marginBottom: 10 }}>🗺️</div>
                  <div className="text-foreground" style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                    Пока нет мест в этой категории
                  </div>
                  <div className="text-muted-foreground" style={{ fontSize: 13, lineHeight: 1.55 }}>
                    Мы добавим их, как только партнёры появятся в этом разделе
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {displayList.map((loc, idx) => {
                    const active = activeCard === loc.id;
                    return (
                      <motion.div
                        key={loc.id}
                        whileHover={{ y: -1 }}
                        onClick={() => {
                          setActiveCard(loc.id);
                          if (isBookable(loc)) navigate(loc.business_type === 'tour' ? `/tours/${loc.id}` : `/service/${loc.id}`); else setSheetService(loc);
                        }}
                        style={{
                          display: 'flex', gap: 12, padding: 10,
                          background: active ? COLORS.accentBg : '#fff',
                          border: active ? `2px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
                          borderRadius: 10, cursor: 'pointer',
                          boxShadow: COLORS.shadow,
                          transition: 'box-shadow 0.15s',
                        }}
                      >
                        <div style={{
                          position: 'relative', width: 120, height: 90, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                          background: loc.gallery?.[0] ? `url(${loc.gallery[0]}) center/cover no-repeat` : undefined,
                        }}>
                          {!loc.gallery?.[0] && <PhotoPlaceholder size={22} business_type={loc.business_type} />}
                          {(loc.is_promoted || idx === 0) && (
                            <div style={{
                              position: 'absolute', top: 6, left: 6,
                              background: COLORS.accent, color: '#fff',
                              fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
                            }}>Популярное</div>
                          )}
                          {loc._distance != null && (
                            <div style={{
                              position: 'absolute', bottom: 4, left: 4,
                              background: 'rgba(0,0,0,0.65)', color: '#fff',
                              fontSize: 10, padding: '2px 6px', borderRadius: 5, fontWeight: 600,
                              display: 'flex', alignItems: 'center', gap: 3,
                            }}><MapPin size={9} /> {formatDistance(loc._distance)}</div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span className="text-foreground" style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{loc.name}</span>
                            {loc.verified && <BadgeCheck size={14} color={COLORS.accent} />}
                            <Heart size={14} color={COLORS.muted} style={{ cursor: 'pointer' }} onClick={(e) => e.stopPropagation()} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: COLORS.text2 }}>
                            <Star size={12} fill="#f59e0b" color="#f59e0b" />
                            <span style={{ fontWeight: 600 }}>{loc.rating?.toFixed(1) || 'Новое'}</span>
                            <span className="text-muted-foreground">({loc.review_count || 0})</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.address || loc.city || ''}</span>
                          </div>
                          <div className="text-foreground" style={{ fontSize: 14, fontWeight: 700 }}>
                            {loc.price_from ? `от ${loc.price_from.toLocaleString('ru-RU')} сум` : ''}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, color: COLORS.green, fontWeight: 600 }}>Открыто до 23:00</span>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {TIME_PILLS.map((t) => <TimePill key={t} t={t} />)}
                              <TimePill t="+3" muted />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {displayList.length > 0 && (
                    <button style={{
                      marginTop: 8, width: '100%',
                      background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 8,
                      padding: 10, fontSize: 13, fontWeight: 600, color: COLORS.accent, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}>
                      Показать ещё {Math.max(0, displayList.length - 5)} заведений <ChevronDown size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="text-muted-foreground" style={{
              padding: '10px 20px', borderTop: `1px solid ${COLORS.border}`,
              display: 'flex', gap: 16, fontSize: 11, flexWrap: 'wrap',
            }}>
              <span>🟢 Есть места</span>
              <span>🟡 Скоро освободится</span>
              <span>🔴 Нет мест</span>
            </div>
          </div>
        )}

        {showMap && (
          <div style={{ flex: 1, position: 'relative' }}>
            <React.Suspense fallback={<div style={{ background: '#f3f4f6', width: '100%', height: '100%' }} />}>
              <MapView
                services={filtered}
                onMarkerClick={(s: LocationItem) => setActiveCard(s.id)}
                center={mapCenter}
                userLocation={userLocation}
                nearbyMode={false}
              />
            </React.Suspense>

            <button
              onClick={handleCenterOnMe}
              disabled={geolocating}
              style={{
                position: 'absolute', bottom: 24, right: 24, zIndex: 1000,
                width: 44, height: 44, borderRadius: 12,
                background: '#fff', border: `1px solid ${COLORS.border}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Locate size={18} color={COLORS.accent} />
            </button>
          </div>
        )}
        </>)}
      </div>

      <BusinessSheet service={sheetService} open={!!sheetService} onClose={() => setSheetService(null)}
        onFullPage={() => { if (sheetService) { navigate(sheetService.business_type === 'tour' ? `/tours/${sheetService.id}` : `/service/${sheetService.id}`); setSheetService(null); } }} />

      {showMoreFilters && (
        <div
          onClick={() => setShowMoreFilters(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 14, width: 460, maxWidth: '92vw',
              padding: 24, boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
              display: 'flex', flexDirection: 'column', gap: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.text }}>Все фильтры</div>
              <button
                onClick={() => setShowMoreFilters(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: COLORS.muted }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text2 }}>Сортировка по цене</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { v: null, label: 'Любая' },
                  { v: 'asc' as const, label: 'Сначала дешевле' },
                  { v: 'desc' as const, label: 'Сначала дороже' },
                ].map((o) => {
                  const active = priceSort === o.v;
                  return (
                    <button
                      key={String(o.v)}
                      onClick={() => setPriceSort(o.v)}
                      style={{
                        height: 34, padding: '0 14px', borderRadius: 8,
                        border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
                        background: active ? COLORS.accentBg : '#fff',
                        color: active ? COLORS.accent : COLORS.text2,
                        fontSize: 13, fontWeight: active ? 600 : 500, cursor: 'pointer',
                      }}
                    >{o.label}</button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text2 }}>Минимальный рейтинг</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { v: null, label: 'Любой' },
                  { v: 4.0, label: 'От 4.0 ★' },
                  { v: 4.5, label: 'От 4.5 ★' },
                ].map((o) => {
                  const active = ratingMin === o.v;
                  return (
                    <button
                      key={String(o.v)}
                      onClick={() => setRatingMin(o.v as number | null)}
                      style={{
                        height: 34, padding: '0 14px', borderRadius: 8,
                        border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
                        background: active ? COLORS.accentBg : '#fff',
                        color: active ? COLORS.accent : COLORS.text2,
                        fontSize: 13, fontWeight: active ? 600 : 500, cursor: 'pointer',
                      }}
                    >{o.label}</button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => { setPriceSort(null); setRatingMin(null); }}
                style={{
                  height: 38, padding: '0 16px', borderRadius: 8,
                  border: `1px solid ${COLORS.border}`, background: '#fff',
                  color: COLORS.text2, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >Сбросить всё</button>
              <button
                onClick={() => setShowMoreFilters(false)}
                style={{
                  height: 38, padding: '0 20px', borderRadius: 8,
                  border: 'none', background: COLORS.accent,
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >Применить</button>
            </div>
          </div>
        </div>
      )}

      <React.Suspense fallback={null}>
        <AiAssistantFab onShowOnMap={(locs) => {
          const first = locs.find((l) => l.lat && l.lng);
          if (first) setMapCenter([first.lat!, first.lng!]);
        }} />
      </React.Suspense>
    </div>
  );
};

export default DesktopIndex;
