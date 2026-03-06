import { Search, MapPin, Loader2, X } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface SearchBarProps {
  onSearch?: (query: string) => void;
  onSubmit?: (query: string) => void;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  onGeolocate?: () => void;
  geolocating?: boolean;
}

const SearchBar = ({ onSearch, onSubmit, onLocationSelect, onGeolocate, geolocating }: SearchBarProps) => {
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
    onSearch?.(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchNominatim(val), 400);
  };

  const handleSelect = (result: NominatimResult) => {
    const shortName = result.display_name.split(',').slice(0, 2).join(',').trim();
    setQuery(shortName);
    setSuggestions([]);
    onSearch?.(shortName);
    onLocationSelect?.(parseFloat(result.lat), parseFloat(result.lon), result.display_name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      setSuggestions([]);
      onSubmit?.(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onSearch?.('');
  };

  return (
    <div className="relative">
      <div className="glass rounded-lg px-3 py-2.5 flex items-center gap-2">
        <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
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
          className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center transition-colors hover:bg-primary/30 active:bg-primary/40"
        >
          {geolocating ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : (
            <MapPin className="w-4 h-4 text-primary" />
          )}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="absolute z-[2000] w-full mt-1 glass rounded-xl border border-border overflow-hidden shadow-lg">
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
  );
};

export default SearchBar;
