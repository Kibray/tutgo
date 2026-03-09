import { Bell, Search, MapPin, Loader2, X, Globe, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useCallback } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface DesktopHeaderProps {
  onSearch: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  onGeolocate: () => void;
  geolocating: boolean;
}

const DesktopHeader = ({ onSearch, onSearchSubmit, onLocationSelect, onGeolocate, geolocating }: DesktopHeaderProps) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const searchNominatim = useCallback(async (q: string) => {
    if (q.trim().length < 3) { setSuggestions([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=uz&limit=5&addressdetails=1&accept-language=ru,uz`
      );
      const data: NominatimResult[] = await res.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    onSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchNominatim(val), 400);
  };

  const handleSelect = (result: NominatimResult) => {
    const shortName = result.display_name.split(',').slice(0, 2).join(',').trim();
    setQuery(shortName);
    setSuggestions([]);
    onSearch(shortName);
    onLocationSelect(parseFloat(result.lat), parseFloat(result.lon), result.display_name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      setSuggestions([]);
      onSearchSubmit(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onSearch('');
  };

  return (
    <header className="h-14 bg-card/95 backdrop-blur-xl border-b border-border flex items-center px-6 gap-6 z-[1100] relative">
      {/* Logo */}
      <h1 className="text-xl font-bold font-display text-foreground whitespace-nowrap select-none">
        TUT<span className="text-gradient-green">GO</span>
      </h1>

      {/* Search */}
      <div className="flex-1 max-w-2xl mx-auto relative">
        <div className="flex items-center gap-2 bg-secondary/60 rounded-lg px-3 py-2 border border-border/50">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Поиск услуг, адресов, мест..."
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent w-full text-foreground placeholder:text-muted-foreground outline-none text-sm"
          />
          {searching && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin flex-shrink-0" />}
          {query && !searching && (
            <button onClick={handleClear} className="flex-shrink-0">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={onGeolocate}
            disabled={geolocating}
            className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30"
          >
            {geolocating ? (
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
            ) : (
              <MapPin className="w-3.5 h-3.5 text-primary" />
            )}
          </button>
        </div>

        {suggestions.length > 0 && (
          <div className="absolute z-[2000] w-full mt-1 bg-card rounded-xl border border-border overflow-hidden shadow-xl">
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

      {/* Right section */}
      <div className="flex items-center gap-3">
        <button className="w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center text-sm hover:bg-secondary transition-colors">
          🇺🇿
        </button>
        <button
          onClick={() => navigate('/notifications')}
          className="relative w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <Bell className="w-4 h-4 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  );
};

export default DesktopHeader;
