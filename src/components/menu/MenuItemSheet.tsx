import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, Leaf, Flame, BookOpen, Salad, ChefHat, Plus, Minus } from 'lucide-react';
import type { MenuItem } from '@/hooks/useMenu';
import type { CartItem } from '@/hooks/useCart';
import { formatPrice } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface Props {
  item: MenuItem;
  currency: string;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

const MenuItemSheet = ({ item, currency, onClose, onAddToCart }: Props) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, { label: string; price_add: number }>>({});

  const modifierTotal = useMemo(() =>
    Object.values(selectedModifiers).reduce((s, m) => s + m.price_add, 0), [selectedModifiers]);

  const totalPrice = (item.price + modifierTotal) * quantity;

  const handleAdd = () => {
    if (!item.is_available) return;
    onAddToCart({
      itemId: item.id,
      name: item.name,
      price: item.price,
      quantity,
      photo_url: item.photo_url,
      modifiers: Object.entries(selectedModifiers).map(([name, opt]) => ({
        name,
        option: opt.label,
        priceAdd: opt.price_add,
      })),
    });
  };

  const allergens = (item.allergens || []) as string[];
  const ingredients = (item.ingredients || []) as { name: string; amount?: string }[];
  const steps = (item.preparation_steps || []) as { step: number; text: string; time_minutes?: number; photo_url?: string }[];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 max-h-[90vh] bg-card rounded-t-2xl overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header image */}
        {item.photo_url ? (
          <div className="relative h-48 bg-secondary">
            <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
            <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 glass rounded-full flex items-center justify-center">
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>
        ) : (
          <div className="flex justify-end p-3">
            <button onClick={onClose} className="w-8 h-8 glass rounded-full flex items-center justify-center">
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>
        )}

        <div className="p-4 pb-32">
          {/* Title & badges */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">{item.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                {item.is_vegetarian && (
                  <span className="flex items-center gap-0.5 text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                    <Leaf className="w-3 h-3" />Вегетарианское
                  </span>
                )}
                {item.is_spicy && (
                  <span className="flex items-center gap-0.5 text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
                    <Flame className="w-3 h-3" />Острое
                  </span>
                )}
              </div>
            </div>
            <span className="text-lg font-bold text-primary">{formatPrice(item.price)} {currency}</span>
          </div>

          {item.description && <p className="text-sm text-muted-foreground mt-2">{item.description}</p>}

          {/* Quick info */}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            {item.weight && <span>⚖️ {item.weight}</span>}
            {item.calories && <span>🔥 {item.calories} ккал</span>}
            {item.cook_time_minutes && (
              <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{item.cook_time_minutes} мин</span>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="story" className="mt-4">
            <TabsList className="w-full">
              {(item.story || item.origin_country || item.chef_note) && (
                <TabsTrigger value="story" className="flex-1 text-[11px]">📖 История</TabsTrigger>
              )}
              {(ingredients.length > 0 || allergens.length > 0) && (
                <TabsTrigger value="ingredients" className="flex-1 text-[11px]">🌿 Состав</TabsTrigger>
              )}
              {item.recipe_visible && steps.length > 0 && (
                <TabsTrigger value="recipe" className="flex-1 text-[11px]">👨‍🍳 Рецепт</TabsTrigger>
              )}
            </TabsList>

            {(item.story || item.origin_country || item.chef_note) && (
              <TabsContent value="story" className="space-y-3">
                {item.story && <p className="text-sm text-muted-foreground leading-relaxed">{item.story}</p>}
                {item.origin_country && (
                  <p className="text-xs text-muted-foreground">🌍 Страна происхождения: <span className="text-foreground font-medium">{item.origin_country}</span></p>
                )}
                {item.chef_note && (
                  <div className="glass rounded-lg p-3">
                    <p className="text-xs font-medium text-foreground mb-1">👨‍🍳 Заметка от шефа</p>
                    <p className="text-xs text-muted-foreground italic">«{item.chef_note}»</p>
                  </div>
                )}
              </TabsContent>
            )}

            {(ingredients.length > 0 || allergens.length > 0) && (
              <TabsContent value="ingredients" className="space-y-3">
                {ingredients.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-foreground">Ингредиенты</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ingredients.map((ing, i) => {
                        const isAllergen = allergens.some(a => ing.name.toLowerCase().includes(a.toLowerCase()));
                        return (
                          <span key={i} className={`text-[11px] px-2 py-1 rounded-full ${
                            isAllergen ? 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30' : 'bg-secondary text-foreground'
                          }`}>
                            {ing.name}{ing.amount ? ` · ${ing.amount}` : ''}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {allergens.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-400 mb-1">⚠️ Аллергены</p>
                    <div className="flex flex-wrap gap-1.5">
                      {allergens.map((a, i) => (
                        <span key={i} className="text-[11px] bg-red-500/15 text-red-400 px-2 py-1 rounded-full">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            )}

            {item.recipe_visible && steps.length > 0 && (
              <TabsContent value="recipe">
                <div className="space-y-3">
                  {steps.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-primary">{step.step || i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-foreground">{step.text}</p>
                        {step.time_minutes && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />{step.time_minutes} мин
                          </p>
                        )}
                        {step.photo_url && (
                          <img src={step.photo_url} alt="" className="w-full h-32 object-cover rounded-lg mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>

          {/* Modifiers */}
          {item.modifiers && item.modifiers.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="text-xs font-semibold text-foreground">Настроить</p>
              {item.modifiers.map(mod => (
                <div key={mod.id} className="space-y-1.5">
                  <p className="text-[11px] text-muted-foreground">{mod.name}</p>
                  <div className="flex gap-2 flex-wrap">
                    {(mod.options as { label: string; price_add: number }[]).map((opt, i) => {
                      const isSelected = selectedModifiers[mod.name]?.label === opt.label;
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedModifiers(prev => ({
                            ...prev,
                            [mod.name]: isSelected ? undefined! : opt,
                          }))}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'glass text-foreground'
                          }`}
                        >
                          {opt.label} {opt.price_add > 0 && `+${formatPrice(opt.price_add)}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom add to cart */}
        {item.is_available && (
          <div className="fixed bottom-0 left-0 right-0 p-4 glass-strong z-50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 glass rounded-lg px-2">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-1.5">
                  <Minus className="w-4 h-4 text-foreground" />
                </button>
                <span className="text-sm font-bold text-foreground w-6 text-center">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="p-1.5">
                  <Plus className="w-4 h-4 text-foreground" />
                </button>
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleAdd}
                className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm glow-green"
              >
                Добавить · {formatPrice(totalPrice)} {currency}
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default MenuItemSheet;
