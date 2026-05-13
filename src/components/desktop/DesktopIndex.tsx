import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, MapPin, Calendar, Star, ShieldCheck, Clock, CalendarCheck, Filter,
  ChevronDown, ChevronLeft, List, LayoutGrid, Map as MapIcon, Locate, BadgeCheck, Heart,
} from 'lucide-react';
import BusinessSheet from '@/components/BusinessSheet';
const MapView = React.lazy(() => import('@/components/MapView'));
const AiAssistantFab = React.lazy(() => import('@/components/AiAssistantFab'));
import DesktopHeader from '@/components/desktop/DesktopHeader';
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

const PhotoPlaceholder: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <div style={{
    width: '100%', height: '100%',
    background: 'linear-gradient(135deg,#e5e7eb,#f3f4f6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size, color: '#9ca3af',
  }}>📷</div>
);

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
  const [landingCategory, setLandingCategory] = useState('all');

  const { categories } = useCategories();

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
      <div className="min-h-screen bg-background text-foreground font-sans">
        <DesktopHeader
          searchValue={search}
          onSearch={setSearch}
          onSearchSubmit={(q) => { setSearch(q); setView('results'); }}
        />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
          {/* SECTION 1 — Hero + sidebar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 24 }}>
            {/* Hero */}
            <div style={{
              borderRadius: 16,
              overflow: 'hidden',
              background: 'linear-gradient(rgba(0,0,0,0.55),rgba(0,0,0,0.7)), url(https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200) center/cover no-repeat',
              padding: 36, minHeight: 280, color: '#fff',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              position: 'relative',
            }}>
              <div>
                <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, lineHeight: 1.15, color: '#fff' }}>
                  Красота и забота<br />рядом с вами
                </h1>
                <p style={{ marginTop: 14, fontSize: 15, color: 'rgba(255,255,255,0.75)', maxWidth: 480, lineHeight: 1.5 }}>
                  Находите лучшие места, проверяйте свободное время и записывайтесь онлайн
                </p>
              </div>

              {/* Search form */}
              <div style={{
                background: '#fff', borderRadius: 12, padding: 8,
                display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.9fr 0.9fr auto',
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 44, borderRight: `1px solid ${COLORS.border}` }}>
                  <Search size={16} color={COLORS.muted} />
                  <input
                    placeholder="Что ищете?"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setView('results'); }}
                    style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: COLORS.text, background: 'transparent', fontFamily: COLORS.font, minWidth: 0 }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 44, borderRight: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontSize: 14, color: COLORS.muted }}>▦</span>
                  <select
                    value={landingCategory}
                    onChange={(e) => setLandingCategory(e.target.value)}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: 44, color: COLORS.muted, fontSize: 13, borderRight: `1px solid ${COLORS.border}` }}>
                  <MapPin size={14} color={COLORS.accent} /> Где вы?
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: 44, color: COLORS.muted, fontSize: 13 }}>
                  <Calendar size={14} color={COLORS.accent} /> Сегодня
                </div>
                <button
                  onClick={() => setView('results')}
                  style={{
                    background: COLORS.accent, color: '#fff', border: 'none', borderRadius: 8,
                    height: 44, padding: '0 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    whiteSpace: 'nowrap', marginLeft: 8,
                  }}
                >
                  Найти места
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="bg-card border border-border rounded-xl shadow-sm" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 16, alignSelf: 'center',
                  background: COLORS.accentBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  <MapPin size={40} color={COLORS.accent} strokeWidth={2.2} fill={COLORS.accent} />
                </div>
                <div className="text-foreground" style={{ fontSize: 15, fontWeight: 600 }}>Посмотрите места на карте</div>
                <div className="text-muted-foreground" style={{ fontSize: 13, lineHeight: 1.5 }}>
                  Удобный поиск рядом с вами и актуальная информация о свободном времени
                </div>
                <button
                  onClick={() => setView('results')}
                  style={{
                    background: '#fff', color: COLORS.accent, border: `1px solid ${COLORS.accent}`,
                    borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Открыть карту →
                </button>
              </div>

              <div className="bg-card border border-border rounded-xl shadow-sm" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 40, lineHeight: 1 }}>🎁</div>
                <div className="text-foreground" style={{ fontWeight: 700, fontSize: 15 }}>Дарим 10% на первое посещение</div>
                <div className="text-muted-foreground" style={{ fontSize: 13, lineHeight: 1.5 }}>
                  Зарегистрируйтесь и получите скидку на любую услугу в вашем городе
                </div>
                <button
                  onClick={() => navigate('/auth')}
                  style={{
                    background: '#fff', color: COLORS.accent, border: `1px solid ${COLORS.accent}`,
                    borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    marginTop: 4,
                  }}
                >
                  Получить скидку
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2 — Category tabs */}
          <div className="bg-card border border-border rounded-xl shadow-sm" style={{ padding: '0 8px', overflowX: 'auto', marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 0, minWidth: 'fit-content' }}>
              {[{ id: 'all', name: 'Все категории', icon: '🏠' }, ...categories].map((c) => {
                const active = landingCategory === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setLandingCategory(c.id)}
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

          {/* SECTION 3 — Popular + Free + Map */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, marginBottom: 24 }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  {popularEnriched.map((loc, idx) => (
                    <motion.div
                      key={loc.id}
                      whileHover={{ y: -2 }}
                      onClick={() => navigate(`/service/${loc.id}`)}
                      className="bg-card border border-border rounded-xl shadow-sm"
                      style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                    >
                      <div style={{
                        height: 160, position: 'relative', overflow: 'hidden',
                        background: loc.gallery?.[0] ? `url(${loc.gallery[0]}) center/cover no-repeat` : undefined,
                      }}>
                        {!loc.gallery?.[0] && <PhotoPlaceholder />}
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
                      onClick={() => navigate(`/service/${loc.id}`)}
                      className="bg-card border border-border rounded-xl shadow-sm"
                      style={{ padding: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                      <div style={{
                        width: 64, height: 64, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                        background: loc.gallery?.[0] ? `url(${loc.gallery[0]}) center/cover` : undefined,
                      }}>
                        {!loc.gallery?.[0] && <PhotoPlaceholder size={20} />}
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
              <div className="bg-card border border-border rounded-xl shadow-sm" style={{ padding: 16 }}>
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
          <div className="bg-card border border-border rounded-xl shadow-sm" style={{ padding: 28, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
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
        </div>

        <BusinessSheet service={sheetService} open={!!sheetService} onClose={() => setSheetService(null)}
          onFullPage={() => { if (sheetService) { navigate(`/service/${sheetService.id}`); setSheetService(null); } }} />
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
    <div className="min-h-screen bg-background text-foreground font-sans" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <DesktopHeader
        searchValue={search}
        onSearch={setSearch}
        onSearchSubmit={(q) => { setSearch(q); setView('results'); }}
      />

      {/* Sub-header */}
      <div style={{
        background: '#fff', borderBottom: `1px solid ${COLORS.border}`,
        padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <button
          onClick={() => setView('landing')}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: COLORS.text2, fontSize: 13, fontWeight: 500,
          }}
        >
          <ChevronLeft size={16} /> Назад
        </button>

        <div className="text-foreground" style={{ fontSize: 15, fontWeight: 700 }}>
          {search ? `«${search}» — ` : ''}{filtered.length} заведений
        </div>

        <div style={{ display: 'flex', gap: 6, flex: 1, marginLeft: 8, flexWrap: 'wrap' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 5,
            height: 34, padding: '0 12px',
            border: `1px solid ${COLORS.border}`, borderRadius: 8,
            background: '#fff', fontSize: 12, color: COLORS.text2, cursor: 'pointer',
          }}>
            <Filter size={12} /> Фильтры
            <span style={{
              background: COLORS.accent, color: '#fff', borderRadius: 8,
              fontSize: 10, fontWeight: 700, padding: '0 5px', minWidth: 16, height: 16,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>2</span>
          </button>
          {[{ label: 'Цена' }, { label: 'Рейтинг' }].map((f) => (
            <button key={f.label} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              height: 34, padding: '0 12px',
              border: `1px solid ${COLORS.border}`, borderRadius: 8,
              background: '#fff', fontSize: 12, color: COLORS.text2, cursor: 'pointer',
            }}>
              {f.label} <ChevronDown size={12} />
            </button>
          ))}

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

          <button style={{
            display: 'flex', alignItems: 'center', gap: 5,
            height: 34, padding: '0 12px', border: `1px solid ${COLORS.border}`,
            borderRadius: 8, background: '#fff', fontSize: 12, color: COLORS.text2, cursor: 'pointer',
          }}>
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
        {showList && (
          <div style={{
            width: resultsMode === 'list' ? '100%' : 460,
            background: '#fff', borderRight: `1px solid ${COLORS.border}`,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 20px 8px', fontSize: 13, fontWeight: 600, color: COLORS.text2 }}>
              {filtered.length} заведений в Ташкенте
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 16px' }}>
              {loading ? (
                <div className="text-muted-foreground" style={{ padding: 32, textAlign: 'center', fontSize: 14 }}>Загрузка…</div>
              ) : enriched.length === 0 ? (
                <div className="text-muted-foreground" style={{ padding: 32, textAlign: 'center', fontSize: 14 }}>Ничего не найдено</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {enriched.map((loc, idx) => {
                    const active = activeCard === loc.id;
                    return (
                      <motion.div
                        key={loc.id}
                        whileHover={{ y: -1 }}
                        onClick={() => {
                          setActiveCard(loc.id);
                          if (isBookable(loc)) navigate(`/service/${loc.id}`); else setSheetService(loc);
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
                          {!loc.gallery?.[0] && <PhotoPlaceholder size={22} />}
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

                  {enriched.length > 0 && (
                    <button style={{
                      marginTop: 8, width: '100%',
                      background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 8,
                      padding: 10, fontSize: 13, fontWeight: 600, color: COLORS.accent, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}>
                      Показать ещё {Math.max(0, enriched.length - 5)} заведений <ChevronDown size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div style={{
              padding: '10px 20px', borderTop: `1px solid ${COLORS.border}`,
              display: 'flex', gap: 16, fontSize: 11, color: COLORS.muted, flexWrap: 'wrap',
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
      </div>

      <BusinessSheet service={sheetService} open={!!sheetService} onClose={() => setSheetService(null)}
        onFullPage={() => { if (sheetService) { navigate(`/service/${sheetService.id}`); setSheetService(null); } }} />
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
