import { useState, useCallback, useMemo, createContext, useContext } from 'react';

export interface CartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: { name: string; option: string; priceAdd: number }[];
  photo_url?: string | null;
}

const useCartState = () => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      const key = `${item.itemId}-${JSON.stringify(item.modifiers)}`;
      const existing = prev.findIndex(i => `${i.itemId}-${JSON.stringify(i.modifiers)}` === key);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + item.quantity };
        return updated;
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuantity = useCallback((index: number, qty: number) => {
    setItems(prev => {
      if (qty <= 0) return prev.filter((_, i) => i !== index);
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: qty };
      return updated;
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const modPrice = item.modifiers.reduce((s, m) => s + m.priceAdd, 0);
      return sum + (item.price + modPrice) * item.quantity;
    }, 0);
  }, [items]);

  const totalItems = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  return { items, addItem, removeItem, updateQuantity, clear, totalAmount, totalItems };
};

const CartContext = createContext<ReturnType<typeof useCartState> | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const cart = useCartState();
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
