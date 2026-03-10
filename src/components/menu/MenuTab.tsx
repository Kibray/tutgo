import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Flame, Leaf } from 'lucide-react';
import type { MenuItem, MenuCategory, MenuCombo } from '@/hooks/useMenu';
import type { CartItem } from '@/hooks/useCart';
import { formatPrice } from '@/lib/types';
import MenuItemSheet from './MenuItemSheet';
import ComboCard from './ComboCard';

interface Props {
  categories: MenuCategory[];
  items: MenuItem[];
  combos: MenuCombo[];
  currency: string;
  onAddToCart: (item: CartItem) => void;
}

const MenuTab = ({ categories, items, combos, currency, onAddToCart }: Props) => {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const filtered = useMemo(() => {
    if (!activeCat) return items;
    return items.filter(i => i.category_id === activeCat);
  }, [items, activeCat]);

  return (
    <div className="space-y-4">
      {/* Combos */}
      {combos.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">🔥 Комбо</h3>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {combos.map(combo => (
              <ComboCard key={combo.id} combo={combo} currency={currency} onAddToCart={onAddToCart} />
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
          <button
            onClick={() => setActiveCat(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !activeCat ? 'bg-primary text-primary-foreground' : 'glass text-foreground'
            }`}
          >
            Все
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                activeCat === cat.id ? 'bg-primary text-primary-foreground' : 'glass text-foreground'
              }`}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Items */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center py-8 text-xs text-muted-foreground">Меню пока пустое</p>
        )}
        {filtered.map(item => (
          <motion.button
            key={item.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedItem(item)}
            className={`w-full glass rounded-lg p-3 flex gap-3 text-left transition-all ${
              !item.is_available ? 'opacity-50' : ''
            }`}
          >
            {item.photo_url ? (
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
                <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg flex-shrink-0 bg-secondary flex items-center justify-center text-2xl opacity-40">
                🍽️
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                {item.is_vegetarian && <Leaf className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
                {item.is_spicy && <Flame className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
              </div>
              {item.description && (
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                {item.weight && <span>{item.weight}</span>}
                {item.calories && <span>{item.calories} ккал</span>}
                {item.cook_time_minutes && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />{item.cook_time_minutes} мин
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-sm font-bold text-primary">
                  {formatPrice(item.price)} {currency}
                </span>
                {!item.is_available && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Нет в наличии</span>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Item detail sheet */}
      <AnimatePresence>
        {selectedItem && (
          <MenuItemSheet
            item={selectedItem}
            currency={currency}
            onClose={() => setSelectedItem(null)}
            onAddToCart={(cartItem) => {
              onAddToCart(cartItem);
              setSelectedItem(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuTab;
