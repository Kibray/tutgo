import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, GeoJSON, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { categoryEmoji, formatPrice, getServiceEmoji } from '@/lib/types';
import type { LocationItem } from '@/lib/types';
import { Star, MapPin } from 'lucide-react';
import { TASHKENT_DISTRICTS_URL, DISTRICT_NAMES } from '@/data/tashkentDistricts';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const markerEmoji: Record<string, string> = {
  medical: '💊',
  beauty: '✂️',
  tour: '🌍',
  cafe: '☕',
  retail: '🛍️',
  service: '🛠️',
  office: '🏢',
  auto: '🚗',
  sport: '⚽',
  education: '📚',
};

const CATEGORY_COLORS: Record<string, string> = {
  medical: '#3B82F6',
  beauty: '#10B981',
  cafe: '#F97316',
  tour: '#22C55E',
  retail: '#A855F7',
  service: '#EAB308',
  office: '#6B7280',
  auto: '#EF4444',
  sport: '#14B8A6',
  education: '#8B5CF6',
};
const getCategoryColor = (cat: string) => CATEGORY_COLORS[cat] || '#6B7280';

const createCategoryIcon = (category: string, isPromoted: boolean, name?: string, subCategory?: string | null, showLabel?: boolean) => {
  const emoji = getServiceEmoji(category, subCategory);
  const size = isPromoted ? 42 : 34;
  const color = getCategoryColor(category);
  const border = isPromoted
    ? `border: 2px solid white; box-shadow: 0 0 16px ${color}99;`
    : 'border: 1.5px solid rgba(255,255,255,0.4);';
  const label = showLabel && name ? (name.length > 15 ? name.slice(0, 15) + '…' : name) : '';
  const labelHtml = label
    ? `<div style="margin-top:2px;padding:1px 4px;border-radius:4px;background:${color}dd;color:#fff;font-size:11px;line-height:13px;white-space:nowrap;text-align:center;max-width:80px;overflow:hidden;text-overflow:ellipsis;">${label}</div>`
    : '';
  return L.divIcon({
    html: `<div style="display:flex;flex-direction:column;align-items:center;"><div style="width:${size}px;height:${size}px;border-radius:12px;background:${color};${border}display:flex;align-items:center;justify-content:center;font-size:${isPromoted ? 20 : 16}px;backdrop-filter:blur(10px);transition:transform 0.15s ease;">${emoji}</div>${labelHtml}</div>`,
    className: '',
    iconSize: [size, size + (label ? 18 : 0)],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
};

const createUserLocationIcon = () => {
  return L.divIcon({
    html: `<div style="position:relative;width:20px;height:20px;display:flex;align-items:center;justify-content:center;">
      <div class="tutgo-user-pulse" style="position:absolute;width:20px;height:20px;border-radius:50%;background:hsl(142,72%,29%);opacity:0.3;"></div>
      <div style="position:relative;width:10px;height:10px;border-radius:50%;background:white;border:2px solid hsl(142,72%,40%);z-index:2;"></div>
    </div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const CenterOnLocation = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 14, { duration: 0.8 }); }, [center, map]);
  return null;
};

const ResizeHandler = () => {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
};

const ZoomTracker = ({ onZoomChange }: { onZoomChange: (z: number) => void }) => {
  const map = useMap();
  useEffect(() => {
    onZoomChange(map.getZoom());
    const handler = () => onZoomChange(map.getZoom());
    map.on('zoomend', handler);
    return () => { map.off('zoomend', handler); };
  }, [map, onZoomChange]);
  return null;
};

// Removed custom zoom controls — using native Leaflet zoomControl with CSS overrides

const MarkerClusterWrapper = ({ children, map }: { children: L.Marker[]; map: L.Map }) => {
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const cluster = (L as any).markerClusterGroup({
      iconCreateFunction: (c: any) => {
        const count = c.getChildCount();
        let size = 34;
        if (count >= 50) size = 54;
        else if (count >= 10) size = 44;
        return L.divIcon({
          html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:hsl(142,72%,29%);border:2px solid hsl(142,72%,45%);color:white;font-weight:600;display:flex;align-items:center;justify-content:center;font-size:${size > 40 ? 14 : 12}px;">${count}</div>`,
          className: '',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    });

    children.forEach(marker => cluster.addLayer(marker));
    map.addLayer(cluster);
    clusterRef.current = cluster;

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }
    };
  }, [children, map]);

  return null;
};

const ClusterLayer = ({ services, onMarkerClick, zoom, isDark }: { services: LocationItem[]; onMarkerClick: (s: LocationItem) => void; zoom: number; isDark: boolean }) => {
  const map = useMap();

  const markers = services.map(s => {
    const icon = createCategoryIcon(s.business_type, !!s.is_promoted, s.name, s.sub_category, zoom >= 14);
    const marker = L.marker([s.lat!, s.lng!], { icon });

    const color = getCategoryColor(s.business_type);
    const bg = isDark ? 'hsl(220,15%,8%)' : '#ffffff';
    const titleColor = isDark ? 'hsl(0,0%,95%)' : 'hsl(220,15%,10%)';
    const subColor = isDark ? 'hsl(0,0%,55%)' : 'hsl(0,0%,45%)';
    const ratingColor = isDark ? 'hsl(0,0%,90%)' : 'hsl(220,15%,15%)';
    const reviewColor = isDark ? 'hsl(0,0%,50%)' : 'hsl(0,0%,55%)';
    const borderColor = isDark ? 'hsla(0,0%,100%,0.08)' : 'rgba(0,0,0,0.08)';
    const iconBg = isDark ? 'hsla(220,15%,15%,1)' : `${color}22`;

    const popupContent = `<div style="background:${bg};border-radius:14px;padding:0;border:1px solid ${borderColor};min-width:200px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.18);">
      <div style="height:4px;background:${color};width:100%;"></div>
      <div style="padding:12px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <div style="width:36px;height:36px;border-radius:10px;background:${iconBg};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${getServiceEmoji(s.business_type, s.sub_category)}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;color:${titleColor};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.name}</div>
            <div style="font-size:11px;color:${subColor};margin-top:2px;">${s.address || ''}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="font-size:12px;">⭐</span>
            <span style="font-size:12px;font-weight:600;color:${ratingColor};">${s.rating || 0}</span>
            ${(s.review_count || 0) > 0 ? `<span style="font-size:11px;color:${reviewColor};">· ${s.review_count}</span>` : ''}
          </div>
          ${(s.price_from || 0) > 0 ? `<span style="font-size:12px;font-weight:700;color:${color};">от ${new Intl.NumberFormat('ru-RU').format(s.price_from!)} ${s.currency}</span>` : ''}
        </div>
        <button class="tutgo-popup-btn" style="width:100%;padding:8px;border-radius:8px;background:${color};color:white;font-size:12px;font-weight:600;border:none;cursor:pointer;">Подробнее</button>
      </div>
    </div>`;

    marker.bindPopup(popupContent, { className: 'leaflet-popup-custom', maxWidth: 240, minWidth: 200 });

    marker.on('click', () => onMarkerClick(s));
    marker.on('mouseover', () => {
      const el = marker.getElement();
      if (el) el.style.transform = el.style.transform.replace(/scale\([^)]*\)/, '') + ' scale(1.2)';
    });
    marker.on('mouseout', () => {
      const el = marker.getElement();
      if (el) el.style.transform = el.style.transform.replace(/scale\([^)]*\)/, '');
    });

    return marker;
  });

  return <MarkerClusterWrapper map={map}>{markers}</MarkerClusterWrapper>;
};

// Inject pulse animation CSS once
const injectPulseCSS = () => {
  if (document.getElementById('tutgo-pulse-css')) return;
  const style = document.createElement('style');
  style.id = 'tutgo-pulse-css';
  style.textContent = `
    @keyframes tutgo-pulse {
      0% { transform: scale(1); opacity: 0.3; }
      100% { transform: scale(2); opacity: 0; }
    }
    .tutgo-user-pulse { animation: tutgo-pulse 2s infinite; }
    .leaflet-control-zoom-in,
    .leaflet-control-zoom-out {
      background: hsl(220,15%,10%) !important;
      border: 1px solid hsl(142,72%,29%) !important;
      color: white !important;
      border-radius: 8px !important;
    }
    .leaflet-control-zoom-in:hover,
    .leaflet-control-zoom-out:hover {
      background: hsl(142,72%,29%) !important;
    }
    .district-label {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      color: hsl(142, 72%, 35%) !important;
      font-size: 10px !important;
      font-weight: 700 !important;
      letter-spacing: 0.8px !important;
      text-transform: uppercase !important;
      pointer-events: none !important;
      white-space: nowrap !important;
      opacity: 0.85 !important;
      text-shadow: 0 1px 2px rgba(255,255,255,0.8), 0 -1px 2px rgba(0,0,0,0.4) !important;
    }
    .district-label::before {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
};

interface MapViewProps {
  services: LocationItem[];
  onMarkerClick: (service: LocationItem) => void;
  center?: [number, number] | null;
  className?: string;
  nearbyMode?: boolean;
  userLocation?: [number, number] | null;
}

const MapView = ({ services, onMarkerClick, center, className = '', nearbyMode, userLocation }: MapViewProps) => {
  const defaultCenter: [number, number] = [41.3111, 69.2797];
  const [zoom, setZoom] = useState(12);
  const [isDark, setIsDark] = useState(true);
  const [districts, setDistricts] = useState<any>(null);

  useEffect(() => { injectPulseCSS(); }, []);

  useEffect(() => {
    fetch(TASHKENT_DISTRICTS_URL)
      .then(r => r.json())
      .then(data => setDistricts(data))
      .catch(() => {});
  }, []);

  const filteredServices = services.filter(s => s.lat && s.lng);

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';

  const mapBg = isDark ? 'hsl(220, 15%, 5%)' : 'hsl(210, 20%, 92%)';

  const themeBtnStyle = (active: boolean): React.CSSProperties => ({
    height: 36,
    padding: '0 16px',
    borderRadius: 20,
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    touchAction: 'manipulation',
    transition: 'all 0.2s',
    background: active ? 'hsl(142,72%,29%)' : 'transparent',
    color: active ? 'white' : 'hsl(142,72%,55%)',
  });

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer center={defaultCenter} zoom={12} className={`w-full h-full ${className}`}
        zoomControl={true} attributionControl={false} style={{ background: mapBg }}>
        <TileLayer url={tileUrl} key={tileUrl} />

        {districts && (
          <GeoJSON
            key={isDark ? 'dark' : 'light'}
            data={districts}
            style={() => ({
              color: isDark ? 'hsl(142, 72%, 40%)' : 'hsl(142, 72%, 25%)',
              fillColor: isDark ? 'hsl(142, 72%, 29%)' : 'hsl(142, 72%, 50%)',
              fillOpacity: 0.04,
              weight: 1.2,
              opacity: 0.6,
              dashArray: '5 5',
            })}
            onEachFeature={(feature, layer) => {
              const engName = feature.properties?.name || '';
              const ruName = DISTRICT_NAMES[engName] || engName;
              layer.bindTooltip(ruName, {
                permanent: true,
                direction: 'center',
                className: 'district-label',
                offset: [0, 0],
              });
            }}
          />
        )}

        <CenterOnLocation center={center || null} />
        <ResizeHandler />
        <ZoomTracker onZoomChange={setZoom} />

        {nearbyMode && userLocation && (
          <Circle
            center={userLocation}
            radius={2000}
            pathOptions={{
              color: 'hsl(142, 72%, 40%)',
              fillColor: 'hsl(142, 72%, 29%)',
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: '6 4',
            }}
          />
        )}

        {userLocation && (
          <Marker
            position={userLocation}
            icon={createUserLocationIcon()}
            interactive={false}
          />
        )}

        <ClusterLayer services={filteredServices} onMarkerClick={onMarkerClick} zoom={zoom} isDark={isDark} />
      </MapContainer>

      <div style={{
        position: 'absolute',
        bottom: 90,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'row',
        gap: 8,
        background: 'hsl(220,15%,8%)',
        border: '1px solid hsl(142,72%,29%)',
        borderRadius: 24,
        padding: 4,
      }}>
        <button style={themeBtnStyle(isDark)} onClick={() => setIsDark(true)}>🌙</button>
        <button style={themeBtnStyle(!isDark)} onClick={() => setIsDark(false)}>☀️</button>
      </div>
    </div>
  );
};

export default MapView;
