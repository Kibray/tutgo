import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { categoryEmoji } from '@/lib/types';
import type { LocationItem } from '@/lib/types';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createCategoryIcon = (category: string, isPromoted: boolean) => {
  const emoji = categoryEmoji[category] || '📍';
  const size = isPromoted ? 38 : 30;
  const border = isPromoted ? 'border: 2px solid hsl(142, 72%, 29%); box-shadow: 0 0 10px hsla(142, 72%, 29%, 0.4);' : 'border: 1px solid hsla(0,0%,100%,0.1);';
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:10px;background:hsla(220,15%,10%,0.9);${border}display:flex;align-items:center;justify-content:center;font-size:${isPromoted ? 18 : 14}px;backdrop-filter:blur(10px);">${emoji}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const CenterOnLocation = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 13, { duration: 0.8 }); }, [center, map]);
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

interface MapViewProps {
  services: LocationItem[];
  onMarkerClick: (service: LocationItem) => void;
  center?: [number, number] | null;
  className?: string;
}

const MapView = ({ services, onMarkerClick, center, className = '' }: MapViewProps) => {
  const defaultCenter: [number, number] = [41.3111, 69.2797];
  return (
    <MapContainer center={defaultCenter} zoom={12} className={`w-full h-full ${className}`}
      zoomControl={false} attributionControl={false} style={{ background: 'hsl(220, 15%, 5%)' }}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      <CenterOnLocation center={center || null} />
      <ResizeHandler />
      {services.map((s) => (
        <Marker key={s.id} position={[s.lat || 41.3111, s.lng || 69.2797]}
          icon={createCategoryIcon(s.business_type, !!s.is_promoted)}
          eventHandlers={{ click: () => onMarkerClick(s) }}>
          <Popup className="leaflet-popup-dark">
            <div className="text-xs font-medium">{s.name}</div>
            <div className="text-[10px] opacity-70">{s.address}</div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;
