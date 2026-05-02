import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, MapPin, Calendar, Star, Gift, ShieldCheck, Clock, CalendarCheck, Filter,
  ChevronDown, ChevronLeft, List, LayoutGrid, Map as MapIcon, Locate, BadgeCheck,
} from 'lucide-react';
import BusinessSheet from '@/components/BusinessSheet';
const MapView = React.lazy(() => import('@/components/MapView'));
const AiAssistantFab = React.lazy(() => import('@/components/AiAssistantFab'));
import DesktopHeader from '@/components/desktop/DesktopHeader';
import { useLocations } from '@/hooks/useLocations';
import { useCategories } from '@/hooks/useCategories';
import { useFavorites } from '@/hooks/useFavorites';
import type { LocationItem } from '@/lib/types';
import { getBizType } from '@/lib/categories';

const TASHKENT: [number, number] = [41.3111, 69.2797];

const COLORS = {
  bg: '#f9fafb',
  card: '#fff',
  border: '#e5e7eb',
  accent: '#2563EB',
  accentBg: '#eff6ff',
  text: '#111',
  text2: '#374151',
  muted: '#6b7280',
  shadow: '0 1px 3px rgba(0,0,0,0.06)',
  font: 'system-ui, sans-serif',
};

const card = {
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

  const landingSelectedCat = categories.find((c) => c.id === landingCategory);
  const { locations: landingFiltered } = useLocations(
    landingCategory === 'all' ? 'all' : (landingSelectedCat ? getBizType(landingSelectedCat.name) : 'all'),
    'all',
    ''
  );

  const enriched = useMemo(() => {
    if (!userLocation) return filtered.map((l) => ({ ...l, _distance: null as number | null }));
    return filtered.map((l) => ({
      ...l,
      _distance: l.lat && l.lng ? getDistanceKm(userLocation[0], userLocation[1], l.lat, l.lng) : null,
    }));
  }, [filtered, userLocation]);

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

  const handleMarkerClick = (s: LocationItem) => {
    setActiveCard(s.id);
    if (view === 'landing') {
      if (isBookable(s)) navigate(`/service/${s.id}`); else setSheetService(s);
    }
  };

  // ============ LANDING VIEW ============
  if (view === 'landing') {
    const popular = landingFiltered.slice(0, 4);
    const freeNow = landingFiltered.slice(4, 10);

    return (
      <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: COLORS.font, color: COLORS.text }}>
        <DesktopHeader
          searchValue={search}
          onSearch={setSearch}
          onSearchSubmit={(q) => { setSearch(q); setView('results'); }}
        />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
          {/* Section 1 — Hero + sidebar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
            {/* Hero */}
            <div
              style={{
                borderRadius: 16,
                background: 'linear-gradient(135deg, #0f172a, #1e40af)',
                padding: 36,
                minHeight: 280,
                color: '#fff',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}
            >
              <div>
                <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, lineHeight: 1.15 }}>
                  Красота и забота рядом с вами
                </h1>
                <p style={{ marginTop: 12, fontSize: 15, color: 'rgba(255,255,255,0.7)', maxWidth: 520 }}>
                  Найдите лучшие места, проверяйте свободное время и записывайтесь онлайн
                </p>
              </div>

              {/* Search form */}
              <div
                style={{
                  marginTop: 24,
                  background: '#fff',
                  borderRadius: 12,
                  padding: 8,
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1fr 0.9fr 0.9fr auto',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', borderRight: `1px solid ${COLORS.border}` }}>
                  <Search size={16} color={COLORS.muted} />
                  <input
                    placeholder="Что ищете?"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setView('results'); }}
                    style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: COLORS.text, height: 40, fontFamily: COLORS.font, background: 'transparent' }}
                  />
                </div>
                <select
                  value={landingCategory}
                  onChange={(e) => setLandingCategory(e.target.value)}
                  style={{
                    border: 'none', outline: 'none', height: 40, fontSize: 14, color: COLORS.text2,
                    background: 'transparent', padding: '0 8px', borderRight: `1px solid ${COLORS.border}`, cursor: 'pointer',
                  }}
                >
                  <option value="all">Все категории</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', color: COLORS.text2, fontSize: 14, borderRight: `1px solid ${COLORS.border}` }}>
                  <MapPin size={14} color={COLORS.accent} /> Ташкент
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', color: COLORS.text2, fontSize: 14 }}>
                  <Calendar size={14} color={COLORS.accent} /> Сегодня
                </div>
                <button
                  onClick={() => setView('results')}
                  style={{
                    background: COLORS.accent, color: '#fff', border: 'none', borderRadius: 8,
                    height: 40, padding: '0 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  Найти места
                </button>
              </div>
            </div>

            {/* Sidebar — 2 cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Посмотрите места на карте</div>
                <div style={{ height: 110, borderRadius: 8, overflow: 'hidden', border: `1px solid ${COLORS.border}` }}>
                  <React.Suspense fallback={<div style={{ background: '#f3f4f6', width: '100%', height: '100%' }} />}>
                    <MapView services={landingFiltered.slice(0, 30)} onMarkerClick={() => setView('results')} center={mapCenter} userLocation={userLocation} nearbyMode={false} />
                  </React.Suspense>
                </div>
                <button
                  onClick={() => setView('results')}
                  style={{
                    background: '#fff', color: COLORS.accent, border: `1px solid ${COLORS.accent}`,
                    borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Открыть карту →
                </button>
              </div>

              <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 24 }}>🎁</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Дарим 10% на первое посещение</div>
                <div style={{ fontSize: 13, color: COLORS.muted }}>Зарегистрируйтесь и получите промокод на первую запись</div>
                <button
                  onClick={() => navigate('/auth')}
                  style={{
                    background: '#fff', color: COLORS.accent, border: `1px solid ${COLORS.accent}`,
                    borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 4,
                  }}
                >
                  Получить скидку
                </button>
              </div>
            </div>
          </div>

          {/* Section 2 — Category tabs */}
          <div style={{ ...card, marginTop: 24, padding: '0 8px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 4, minWidth: 'fit-content' }}>
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
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c.name} {c.icon}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3 — Content + map sidebar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, marginTop: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px' }}>Популярно сейчас 🔥</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  {popular.map((loc) => (
                    <div
                      key={loc.id}
                      onClick={() => navigate(`/service/${loc.id}`)}
                      style={{ ...card, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                    >
                      <div style={{
                        height: 160, background: loc.gallery?.[0] ? `url(${loc.gallery[0]}) center/cover` : '#e5e7eb',
                      }} />
                      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: COLORS.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.name}</span>
                          {loc.verified && <BadgeCheck size={14} color={COLORS.accent} />}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: COLORS.text2 }}>
                          <Star size={12} fill="#f59e0b" color="#f59e0b" /> {loc.rating?.toFixed(1) || '—'}
                          <span style={{ color: COLORS.muted }}>({loc.review_count || 0})</span>
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {loc.address || '—'}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>
                          {loc.price_from ? `от ${loc.price_from.toLocaleString('ru-RU')} сум` : ''}
                        </div>
                        <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Открыто до 23:00</div>
                      </div>
                    </div>
                  ))}
                  {popular.length === 0 && !loading && (
                    <div style={{ gridColumn: '1 / -1', color: COLORS.muted, fontSize: 13, padding: 24, textAlign: 'center' }}>
                      Ничего не найдено
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px' }}>Свободное время сегодня</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {freeNow.map((loc) => (
                    <div
                      key={loc.id}
                      onClick={() => navigate(`/service/${loc.id}`)}
                      style={{ ...card, padding: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                      <div style={{
                        width: 52, height: 52, borderRadius: 8, flexShrink: 0,
                        background: loc.gallery?.[0] ? `url(${loc.gallery[0]}) center/cover` : '#e5e7eb',
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.name}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          {['14:00', '15:30', '17:00'].map((t) => (
                            <span key={t} style={{
                              fontSize: 11, padding: '2px 8px', borderRadius: 6,
                              background: COLORS.accentBg, color: COLORS.accent,
                              border: `1px solid ${COLORS.accent}40`, fontWeight: 600,
                            }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column — map sidebar */}
            <div>
              <div style={{ ...card, padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Места рядом с вами</div>
                <div style={{ height: 200, borderRadius: 8, overflow: 'hidden', border: `1px solid ${COLORS.border}` }}>
                  <React.Suspense fallback={<div style={{ background: '#f3f4f6', width: '100%', height: '100%' }} />}>
                    <MapView services={landingFiltered.slice(0, 50)} onMarkerClick={() => setView('results')} center={mapCenter} userLocation={userLocation} nearbyMode={false} />
                  </React.Suspense>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 12, color: COLORS.text2 }}>
                  <span>🟢 Свободно</span>
                  <span>🟡 Скоро</span>
                  <span>🔴 Занято</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 — Trust strip */}
          <div style={{ ...card, marginTop: 24, padding: '24px 28px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {[
              { icon: <ShieldCheck size={18} />, title: 'Проверенные заведения', sub: 'Только верифицированные партнёры' },
              { icon: <CalendarCheck size={18} />, title: 'Онлайн-запись', sub: 'Бронируйте за пару секунд' },
              { icon: <Clock size={18} />, title: 'Актуальное расписание', sub: 'Реальное свободное время' },
              { icon: <Search size={18} />, title: 'Удобный поиск', sub: 'Категории, фильтры и карта' },
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: COLORS.accentBg, color: COLORS.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{t.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{t.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ height: 40 }} />
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: COLORS.bg, fontFamily: COLORS.font, color: COLORS.text }}>
      <DesktopHeader
        searchValue={search}
        onSearch={setSearch}
        onSearchSubmit={setSearch}
      />

      {/* Sub-header */}
      <div style={{
        background: '#fff', borderBottom: `1px solid ${COLORS.border}`,
        padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
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

        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>
          {search ? `«${search}»` : selectedCat?.name || 'Все места'} — {filtered.length}
        </div>

        <div style={{ display: 'flex', gap: 6, marginLeft: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Фильтры', icon: <Filter size={12} /> },
            { label: 'Цена', drop: true },
            { label: 'Рейтинг', drop: true },
          ].map((f) => (
            <button
              key={f.label}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                height: 32, padding: '0 12px',
                border: `1px solid ${COLORS.border}`, borderRadius: 8,
                background: '#fff', fontSize: 12, color: COLORS.text2, cursor: 'pointer',
              }}
            >
              {f.icon} {f.label} {f.drop && <ChevronDown size={12} />}
            </button>
          ))}

          <button
            onClick={() => setOpenNow(!openNow)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 32, padding: '0 12px',
              border: `1px solid ${openNow ? COLORS.accent : COLORS.border}`, borderRadius: 8,
              background: openNow ? COLORS.accentBg : '#fff',
              fontSize: 12, color: openNow ? COLORS.accent : COLORS.text2, cursor: 'pointer', fontWeight: 600,
            }}
          >
            Открыто сейчас
            <span style={{
              width: 22, height: 12, borderRadius: 6,
              background: openNow ? COLORS.accent : '#d1d5db',
              position: 'relative', transition: 'background 0.2s',
            }}>
              <span style={{
                position: 'absolute', top: 1, left: openNow ? 11 : 1,
                width: 10, height: 10, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s',
              }} />
            </span>
          </button>

          <button
            style={{
              height: 32, padding: '0 12px', border: `1px solid ${COLORS.border}`,
              borderRadius: 8, background: '#fff', fontSize: 12, color: COLORS.text2, cursor: 'pointer',
            }}
          >
            Ещё фильтры
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
          ].map((v) => {
            const active = resultsMode === v.mode;
            return (
              <button
                key={v.mode}
                onClick={() => setResultsMode(v.mode)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  height: 32, padding: '0 12px',
                  background: active ? COLORS.accentBg : '#fff',
                  color: active ? COLORS.accent : COLORS.text2,
                  border: 'none', borderRight: `1px solid ${COLORS.border}`,
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
        {/* Left list panel */}
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
                <div style={{ padding: 24, textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>Загрузка…</div>
              ) : enriched.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>Ничего не найдено</div>
              ) : (
                <div style={{
                  display: resultsMode === 'list' ? 'grid' : 'flex',
                  gridTemplateColumns: resultsMode === 'list' ? 'repeat(auto-fill, minmax(420px, 1fr))' : undefined,
                  flexDirection: resultsMode === 'list' ? undefined : 'column',
                  gap: 10,
                }}>
                  {enriched.map((loc) => {
                    const active = activeCard === loc.id;
                    return (
                      <motion.div
                        key={loc.id}
                        whileHover={{ y: -1 }}
                        onClick={() => { setActiveCard(loc.id); navigate(`/service/${loc.id}`); }}
                        style={{
                          display: 'flex', gap: 12, padding: 10,
                          background: active ? COLORS.accentBg : '#fff',
                          border: active ? `2px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
                          borderRadius: 10, cursor: 'pointer',
                          boxShadow: COLORS.shadow,
                        }}
                      >
                        <div style={{
                          position: 'relative',
                          width: 120, height: 90, borderRadius: 8, flexShrink: 0,
                          background: loc.gallery?.[0] ? `url(${loc.gallery[0]}) center/cover` : '#e5e7eb',
                        }}>
                          {loc._distance != null && (
                            <div style={{
                              position: 'absolute', bottom: 4, left: 4,
                              background: 'rgba(17,17,17,0.75)', color: '#fff',
                              fontSize: 10, padding: '2px 6px', borderRadius: 6, fontWeight: 600,
                            }}>{formatDistance(loc._distance)}</div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{loc.name}</span>
                            {loc.verified && <BadgeCheck size={14} color={COLORS.accent} />}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: COLORS.text2 }}>
                            <Star size={12} fill="#f59e0b" color="#f59e0b" /> {loc.rating?.toFixed(1) || '—'}
                            <span style={{ color: COLORS.muted }}>({loc.review_count || 0})</span>
                            <span style={{ color: COLORS.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {loc.address || '—'}</span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>
                            {loc.price_from ? `от ${loc.price_from.toLocaleString('ru-RU')} сум` : ''}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>Открыто до 23:00</span>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {['14:00', '15:30', '17:00'].map((t) => (
                                <span key={t} style={{
                                  fontSize: 10, padding: '1px 6px', borderRadius: 5,
                                  background: COLORS.accentBg, color: COLORS.accent,
                                  border: `1px solid ${COLORS.accent}40`, fontWeight: 600,
                                }}>{t}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {enriched.length > 0 && (
                <button style={{
                  marginTop: 16, width: '100%',
                  background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 8,
                  padding: '10px', fontSize: 13, fontWeight: 600, color: COLORS.text2, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                  Показать ещё <ChevronDown size={14} />
                </button>
              )}
            </div>

            <div style={{
              padding: '10px 20px', borderTop: `1px solid ${COLORS.border}`,
              display: 'flex', gap: 14, fontSize: 11, color: COLORS.muted,
            }}>
              <span>🟢 Свободно</span>
              <span>🟡 Скоро</span>
              <span>🔴 Занято</span>
            </div>
          </div>
        )}

        {/* Map panel */}
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
