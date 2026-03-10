import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Plus, Minus, Trash2, SplitSquareHorizontal, RotateCcw } from 'lucide-react';
import type { CartItem } from '@/hooks/useCart';
import { formatPrice } from '@/lib/types';

interface Props {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  currency: string;
  onUpdateQuantity: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onCheckout: () => void;
}

const CartBar = ({ items, totalAmount, totalItems, currency, onUpdateQuantity, onRemove, onClear, onCheckout }: Props) => {
  const [expanded, setExpanded] = useState(false);

  if (totalItems === 0) return null;

  return (
    <>
      {/* Expanded cart overlay */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 max-h-[70vh] bg-card rounded-t-2xl overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-foreground">Корзина</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={onClear} className="text-xs text-muted-foreground flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" />Очистить
                    </button>
                    <button onClick={() => setExpanded(false)} className="p-1">
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {items.map((item, i) => {
                    const modPrice = item.modifiers.reduce((s, m) => s + m.priceAdd, 0);
                    const itemTotal = (item.price + modPrice) * item.quantity;
                    return (
                      <div key={i} className="flex gap-3 items-start">
                        {item.photo_url && (
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                            <img src={item.photo_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                          {item.modifiers.length > 0 && (
                            <p className="text-[10px] text-muted-foreground">
                              {item.modifiers.map(m => m.option).join(', ')}
                            </p>
                          )}
                          <span className="text-xs font-bold text-primary">{formatPrice(itemTotal)} {currency}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => onUpdateQuantity(i, item.quantity - 1)} className="w-7 h-7 glass rounded-full flex items-center justify-center">
                            <Minus className="w-3 h-3 text-foreground" />
                          </button>
                          <span className="text-xs font-bold text-foreground w-5 text-center">{item.quantity}</span>
                          <button onClick={() => onUpdateQuantity(i, item.quantity + 1)} className="w-7 h-7 glass rounded-full flex items-center justify-center">
                            <Plus className="w-3 h-3 text-foreground" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">Итого</span>
                    <span className="text-base font-bold text-foreground">{formatPrice(totalAmount)} {currency}</span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onCheckout}
                    className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm glow-green"
                  >
                    Оформить предзаказ
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact cart bar */}
      {!expanded && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-16 left-0 right-0 px-4 py-2 z-40"
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setExpanded(true)}
            className="w-full glass-strong rounded-xl px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">{totalItems} {totalItems === 1 ? 'блюдо' : totalItems < 5 ? 'блюда' : 'блюд'}</span>
            </div>
            <span className="text-sm font-bold text-primary">{formatPrice(totalAmount)} {currency}</span>
          </motion.button>
        </motion.div>
      )}
    </>
  );
};

export default CartBar;
