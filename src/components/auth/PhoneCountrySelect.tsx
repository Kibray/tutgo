import { useState, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface Country {
  code: string;
  dial: string;
  flag: string;
  name: string;
}

export const COUNTRIES: Country[] = [
  { code: 'UZ', dial: '+998', flag: '🇺🇿', name: 'Узбекистан' },
  { code: 'RU', dial: '+7', flag: '🇷🇺', name: 'Россия' },
  { code: 'KZ', dial: '+7', flag: '🇰🇿', name: 'Казахстан' },
  { code: 'KG', dial: '+996', flag: '🇰🇬', name: 'Кыргызстан' },
  { code: 'TJ', dial: '+992', flag: '🇹🇯', name: 'Таджикистан' },
  { code: 'TM', dial: '+993', flag: '🇹🇲', name: 'Туркменистан' },
  { code: 'AZ', dial: '+994', flag: '🇦🇿', name: 'Азербайджан' },
  { code: 'GE', dial: '+995', flag: '🇬🇪', name: 'Грузия' },
  { code: 'AM', dial: '+374', flag: '🇦🇲', name: 'Армения' },
  { code: 'BY', dial: '+375', flag: '🇧🇾', name: 'Беларусь' },
  { code: 'UA', dial: '+380', flag: '🇺🇦', name: 'Украина' },
  { code: 'MD', dial: '+373', flag: '🇲🇩', name: 'Молдова' },
  { code: 'LV', dial: '+371', flag: '🇱🇻', name: 'Латвия' },
  { code: 'LT', dial: '+370', flag: '🇱🇹', name: 'Литва' },
  { code: 'EE', dial: '+372', flag: '🇪🇪', name: 'Эстония' },
  { code: 'PL', dial: '+48', flag: '🇵🇱', name: 'Польша' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Германия' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'Франция' },
  { code: 'IT', dial: '+39', flag: '🇮🇹', name: 'Италия' },
  { code: 'ES', dial: '+34', flag: '🇪🇸', name: 'Испания' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'Великобритания' },
  { code: 'NL', dial: '+31', flag: '🇳🇱', name: 'Нидерланды' },
  { code: 'CZ', dial: '+420', flag: '🇨🇿', name: 'Чехия' },
  { code: 'AT', dial: '+43', flag: '🇦🇹', name: 'Австрия' },
  { code: 'CH', dial: '+41', flag: '🇨🇭', name: 'Швейцария' },
  { code: 'SE', dial: '+46', flag: '🇸🇪', name: 'Швеция' },
  { code: 'NO', dial: '+47', flag: '🇳🇴', name: 'Норвегия' },
  { code: 'FI', dial: '+358', flag: '🇫🇮', name: 'Финляндия' },
  { code: 'DK', dial: '+45', flag: '🇩🇰', name: 'Дания' },
  { code: 'PT', dial: '+351', flag: '🇵🇹', name: 'Португалия' },
  { code: 'GR', dial: '+30', flag: '🇬🇷', name: 'Греция' },
  { code: 'TR', dial: '+90', flag: '🇹🇷', name: 'Турция' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'ОАЭ' },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'США' },
  { code: 'IL', dial: '+972', flag: '🇮🇱', name: 'Израиль' },
];

interface Props {
  selected: Country;
  onSelect: (c: Country) => void;
}

const PhoneCountrySelect = ({ selected, onSelect }: Props) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return COUNTRIES;
    const q = search.toLowerCase();
    return COUNTRIES.filter(
      c => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 glass rounded-lg px-3 py-3 text-sm border border-border hover:border-primary transition-colors min-w-[100px]"
        >
          <span className="text-base">{selected.flag}</span>
          <span className="text-foreground font-medium">{selected.dial}</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="flex items-center gap-2 px-2 pb-2 border-b border-border mb-1">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск страны..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
        <div className="max-h-52 overflow-y-auto">
          {filtered.map(c => (
            <button
              key={c.code}
              type="button"
              onClick={() => { onSelect(c); setOpen(false); setSearch(''); }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors ${
                c.code === selected.code ? 'bg-muted font-medium' : ''
              }`}
            >
              <span>{c.flag}</span>
              <span className="text-foreground">{c.name}</span>
              <span className="text-muted-foreground ml-auto">{c.dial}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">Ничего не найдено</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PhoneCountrySelect;
