import { motion } from 'framer-motion';
import type { MenuCombo } from '@/hooks/useMenu';
import type { CartItem } from '@/hooks/useCart';
import { formatPrice } from '@/lib/types';

interface Props {
  combo: MenuCombo;
  currency: string;
  onAddToCart: (item: CartItem) => void;
}

const ComboCard = ({ combo, currency, onAddToCart }: Props) => {
  const discount = combo.original_price > 0
    ? Math.round((1 - combo.combo_price / combo.original_price) * 100)
    : 0;

  const handleAdd = () => {
    onAddToCart({
      itemId: `combo-${combo.id}`,
      name: `🔥 ${combo.name}`,
      price: combo.combo_price,
      quantity: 1,
      photo_url: combo.photo_url,
      modifiers: [],
    });
  };

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="flex-shrink-0 w-60 glass rounded-xl overflow-hidden"
    >
      {combo.photo_url ? (
        <div className="h-28 bg-secondary relative">
          <img src={combo.photo_url} alt={combo.name} className="w-full h-full object-cover" />
          {discount > 0 && (
            <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
              −{discount}%
            </span>
          )}
        </div>
      ) : discount > 0 ? (
        <div className="h-10 flex justify-end px-2 pt-2">
          <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full h-fit">
            −{discount}%
          </span>
        </div>
      ) : null}
      <div className="p-3">
        <p className="text-sm font-semibold text-foreground">{combo.name}</p>
        {combo.description && (
          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{combo.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-bold text-primary">{formatPrice(combo.combo_price)} {currency}</span>
          {combo.original_price > combo.combo_price && (
            <span className="text-[10px] text-muted-foreground line-through">{formatPrice(combo.original_price)}</span>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleAdd}
          className="w-full mt-2 py-2 rounded-lg bg-primary/15 text-primary text-xs font-semibold"
        >
          Добавить
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ComboCard;
