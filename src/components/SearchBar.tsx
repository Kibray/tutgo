import { Search } from 'lucide-react';
import { useState } from 'react';

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState('');

  return (
    <div className="glass rounded-lg px-4 py-3 flex items-center gap-3">
      <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      <input
        type="text"
        placeholder="Search services, salons, tours..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onSearch?.(e.target.value);
        }}
        className="bg-transparent w-full text-foreground placeholder:text-muted-foreground outline-none text-sm"
      />
    </div>
  );
};

export default SearchBar;
