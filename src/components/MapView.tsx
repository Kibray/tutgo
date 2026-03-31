import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { categoryEmoji, formatPrice, getServiceEmoji } from '@/lib/types';
import type { LocationItem } from '@/lib/types';
import { Star, MapPin } from 'lucide-react';

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

const createCategoryIcon = (category: string, isPromoted: boolean, name?: string, subCategory?: string | null, showLabel?: boolean) => {
  const emoji = getServiceEmoji(category, subCategory);
  const size = isPromoted ? 42 : 34;
  const border = isPromoted
    ? 'border: 2px solid hsl(142, 72%, 29%); box-shadow: 0 0 12px hsla(142, 72%, 29%, 0.5);'
    : 'border: 1.5px solid hsla(0,0%,100%,0.15);';
  const label = showLabel && name ? (name.length > 15 ? name.slice(0, 15) + '…' : name) : '';
  const labelHtml = label
    ? `<div style="margin-top:2px;padding:1px 4px;border-radius:4px;background:hsla(220,15%,10%,0.85);color:#fff;font-size:11px;line-height:13px;white-space:nowrap;text-align:center;max-width:80px;overflow:hidden;text-overflow:ellipsis;">${label}</div>`
    : '';
  return L.divIcon({
    html: `<div style="display:flex;flex-direction:column;align-items:center;"><div style="width:${size}px;height:${size}px;border-radius:12px;background:hsla(220,15%,10%,0.92);${border}display:flex;align-items:center;justify-content:center;font-size:${isPromoted ? 20 : 16}px;backdrop-filter:blur(10px);transition:transform 0.15s;">${emoji}</div>${labelHtml}</div>`,
    className: '',
    iconSize: [size, size + (label ? 18 : 0)],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
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

  return (
    <MapContainer center={defaultCenter} zoom={12} className={`w-full h-full ${className}`}
      zoomControl={false} attributionControl={false} style={{ background: 'hsl(220, 15%, 5%)' }}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      <CenterOnLocation center={center || null} />
      <ResizeHandler />
      <ZoomTracker onZoomChange={setZoom} />

      {/* Nearby radius circle */}
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

      {services.map((s) => (
        <Marker key={s.id} position={[s.lat || 41.3111, s.lng || 69.2797]}
          icon={createCategoryIcon(s.business_type, !!s.is_promoted, s.name)}
          eventHandlers={{ click: () => onMarkerClick(s) }}>
          <Popup className="leaflet-popup-custom" maxWidth={240} minWidth={200}>
            <div style={{
              background: 'hsl(220, 15%, 8%)',
              borderRadius: '12px',
              padding: '12px',
              border: '1px solid hsla(0,0%,100%,0.08)',
              minWidth: '180px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: 'hsla(220,15%,15%,1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', flexShrink: 0,
                }}>
                  {getServiceEmoji(s.business_type, s.sub_category)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px', fontWeight: 600, color: 'hsl(0,0%,95%)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{s.name}</div>
                  <div style={{ fontSize: '11px', color: 'hsl(0,0%,55%)', marginTop: '2px' }}>{s.address}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '12px' }}>⭐</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(0,0%,90%)' }}>{s.rating || 0}</span>
                  {(s.review_count || 0) > 0 && (
                    <span style={{ fontSize: '11px', color: 'hsl(0,0%,50%)' }}>· {s.review_count}</span>
                  )}
                </div>
                {(s.price_from || 0) > 0 && (
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(142, 72%, 45%)' }}>
                    от {new Intl.NumberFormat('ru-RU').format(s.price_from!)} {s.currency}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onMarkerClick(s); }}
                style={{
                  width: '100%', padding: '8px', borderRadius: '8px',
                  background: 'hsl(142, 72%, 29%)', color: 'white',
                  fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
                }}
              >
                Подробнее
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;
