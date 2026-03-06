import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Loader2, X } from 'lucide-react';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface AddressPickerProps {
  address: string;
  lat: number | null;
  lng: number | null;
  onAddressChange: (address: string, lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [41.2995, 69.2401];
const DEFAULT_ZOOM = 12;

const DraggableMarker = ({
  position,
  onDragEnd,
}: {
  position: [number, number];
  onDragEnd: (lat: number, lng: number) => void;
}) => {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const { lat, lng } = marker.getLatLng();
        onDragEnd(lat, lng);
      }
    },
  };

  return <Marker position={position} draggable eventHandlers={eventHandlers} ref={markerRef} />;
};

const MapUpdater = ({ center, zoom }: { center: [number, number]; zoom?: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom ?? map.getZoom(), { duration: 0.6 });
  }, [center[0], center[1]]);
  return null;
};

const ResizeHandler = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

const AddressPicker = ({ address, lat, lng, onAddressChange }: AddressPickerProps) => {
  const [query, setQuery] = useState(address);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showMap, setShowMap] = useState(!!(lat && lng));
  const [markerPos, setMarkerPos] = useState<[number, number]>(
    lat && lng ? [lat, lng] : DEFAULT_CENTER
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Geolocate user on mount
  useEffect(() => {
    if (lat && lng) return; // already have position
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setMarkerPos(newPos);
        },
        () => {/* use default */},
        { timeout: 5000 }
      );
    }
  }, []);

  const searchAddress = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=uz&limit=5&addressdetails=1`
      );
      const data: NominatimResult[] = await res.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(val), 400);
  };

  const handleSelect = (result: NominatimResult) => {
    const newLat = parseFloat(result.lat);
    const newLng = parseFloat(result.lon);
    setQuery(result.display_name);
    setMarkerPos([newLat, newLng]);
    setSuggestions([]);
    setShowMap(true);
    onAddressChange(result.display_name, newLat, newLng);
  };

  const handleMarkerDrag = async (newLat: number, newLng: number) => {
    setMarkerPos([newLat, newLng]);
    // Reverse geocode
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&zoom=18`
      );
      const data = await res.json();
      if (data.display_name) {
        setQuery(data.display_name);
        onAddressChange(data.display_name, newLat, newLng);
      } else {
        onAddressChange(query, newLat, newLng);
      }
    } catch {
      onAddressChange(query, newLat, newLng);
    }
  };

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <div className="flex items-center glass rounded-xl border border-border focus-within:border-primary transition-colors">
          <Search className="w-4 h-4 text-muted-foreground ml-3 flex-shrink-0" />
          <input
            type="text"
            placeholder="Введите адрес в Узбекистане..."
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
          />
          {searching && <Loader2 className="w-4 h-4 text-muted-foreground mr-3 animate-spin flex-shrink-0" />}
          {query && !searching && (
            <button onClick={() => { setQuery(''); setSuggestions([]); }} className="mr-3">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 glass rounded-xl border border-border overflow-hidden shadow-lg">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSelect(s)}
                className="w-full px-3 py-2.5 text-left text-xs text-foreground hover:bg-primary/10 transition-colors flex items-start gap-2 border-b border-border/50 last:border-0"
              >
                <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{s.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mini map */}
      {showMap && (
        <div className="rounded-xl overflow-hidden border border-border" style={{ height: '200px' }}>
          <MapContainer
            center={markerPos}
            zoom={15}
            className="w-full h-full"
            zoomControl={false}
            attributionControl={false}
            style={{ background: 'hsl(220, 15%, 5%)' }}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <DraggableMarker position={markerPos} onDragEnd={handleMarkerDrag} />
            <MapUpdater center={markerPos} zoom={15} />
            <ResizeHandler />
          </MapContainer>
        </div>
      )}

      {showMap && (
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Перетащите маркер для точной позиции
        </p>
      )}
    </div>
  );
};

export default AddressPicker;
