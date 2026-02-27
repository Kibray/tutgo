import { Search } from 'lucide-react';
import { useState } from 'react';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  onSubmit?: (query: string) => void;
}

const SearchBar = ({ onSearch, onSubmit }: SearchBarProps) => {
  const [query, setQuery] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      onSubmit?.(query);
    }
  };

  return (
    <div className="glass rounded-lg px-4 py-3 flex items-center gap-3">
      <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      <input
        type="text"
        placeholder="Поиск услуг, салонов, туров..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onSearch?.(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        className="bg-transparent w-full text-foreground placeholder:text-muted-foreground outline-none text-sm"
      />
    </div>
  );
};

export default SearchBar;
