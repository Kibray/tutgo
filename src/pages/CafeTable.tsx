import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMenu } from '@/hooks/useMenu';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/types';
import type { LocationItem } from '@/lib/types';
import MenuTab from '@/components/menu/MenuTab';
import CartBar from '@/components/menu/CartBar';
import CafeOrderStatus from '@/components/cafe/CafeOrderStatus';
import CafePayment from '@/components/cafe/CafePayment';
import CafeRating from '@/components/cafe/CafeRating';

const translations: Record<string, Record<string, string>> = {
  ru: { menu: 'Меню', callWaiter: 'Позвать официанта', waiterCalled: 'Официант вызван!', waiterDesc: 'Скоро подойдём', table: 'Столик', order: 'Заказать', loading: 'Загрузка...' },
  uz: { menu: 'Menyu', callWaiter: 'Ofitsiantni chaqirish', waiterCalled: 'Ofitsiant chaqirildi!', waiterDesc: 'Tez orada kelamiz', table: 'Stol', order: 'Buyurtma berish', loading: 'Yuklanmoqda...' },
  en: { menu: 'Menu', callWaiter: 'Call waiter', waiterCalled: 'Waiter called!', waiterDesc: 'Coming soon', table: 'Table', order: 'Place order', loading: 'Loading...' },
};

const CafeTable = () => {
  const { slug, tableNum } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [lang, setLang] = useState<'ru' | 'uz' | 'en'>('ru');
  const t = translations[lang];

  const [location, setLocation] = useState<LocationItem | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const locationId = location?.id || '';
  const { categories, items: menuItems, combos } = useMenu(locationId);
  const cart = useCart();
  const tableNumber = parseInt(tableNum || '0');

  // Fetch location by slug
  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      const { data: loc } = await supabase.from('locations').select('*').eq('slug', slug).single();
      if (loc) {
        setLocation(loc as LocationItem);
        // Find table (requires auth - anon users can't query cafe_tables)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: tbl } = await supabase
            .from('cafe_tables')
            .select('id')
            .eq('location_id', loc.id)
            .eq('table_number', tableNumber)
            .single();
          if (tbl) setTableId(tbl.id);
        }

        // Check active order for this table
        const { data: orders } = await supabase
          .from('cafe_orders')
          .select('*')
          .eq('location_id', loc.id)
          .eq('table_number', tableNumber)
          .in('status', ['new', 'preparing', 'ready', 'served'])
          .order('created_at', { ascending: false })
          .limit(1);
        if (orders && orders.length > 0) setActiveOrder(orders[0]);
      }
      setLoading(false);
    };
    fetchData();
  }, [slug, tableNumber]);

  // Realtime order updates
  useEffect(() => {
    if (!locationId || !tableNumber) return;
    const channel = supabase
      .channel(`cafe-order-${locationId}-${tableNumber}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'cafe_orders',
        filter: `location_id=eq.${locationId}`,
      }, (payload) => {
        const record = payload.new as any;
        if (record?.table_number === tableNumber) {
          setActiveOrder(record);
          if (record.status === 'ready') {
            toast({ title: '✅ Заказ готов!', description: 'Ваш заказ сейчас принесут' });
            const tg = (window as any).Telegram?.WebApp;
            tg?.HapticFeedback?.notificationOccurred('success');
          }
          if (record.status === 'served') {
            setShowRating(true);
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [locationId, tableNumber]);

  const handlePlaceOrder = async () => {
    if (cart.totalItems === 0) return;
    setSubmitting(true);
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred('heavy');

    const orderItems = cart.items.map(i => ({
      item_id: i.itemId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      modifiers: i.modifiers,
      photo_url: i.photo_url,
    }));

    const { data, error } = await supabase.from('cafe_orders').insert({
      location_id: locationId,
      table_id: tableId,
      table_number: tableNumber,
      client_id: user?.id || null,
      items: orderItems,
      total_amount: cart.totalAmount,
      final_amount: cart.totalAmount,
      currency: location?.currency || 'сум',
      status: 'new',
    } as any).select().single();

    setSubmitting(false);
    if (error) {
      toast({ title: 'Ошибка', description: 'Не удалось отправить заказ', variant: 'destructive' });
    } else {
      setActiveOrder(data);
      cart.clear();
      toast({ title: '✅ Заказ отправлен!', description: `Заказ #${(data as any).id?.slice(-4).toUpperCase()}` });
      tg?.HapticFeedback?.notificationOccurred('success');
    }
  };

  const handleCallWaiter = async () => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.notificationOccurred('warning');
    toast({ title: `📲 ${t.waiterCalled}`, description: t.waiterDesc });
    
    // Notify via telegram
    if (location) {
      await supabase.functions.invoke('telegram-notify', {
        body: {
          type: 'cafe.waiter_call',
          record: { location_id: locationId, table_number: tableNumber },
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Кафе не найдено</p>
      </div>
    );
  }

  const currency = location.currency || 'сум';

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 glass-strong px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {location.branded_icon_url && (
              <img src={location.branded_icon_url} alt="" className="w-8 h-8 rounded-full object-cover" />
            )}
            <div>
              <h1 className="text-sm font-bold text-foreground">{location.name}</h1>
              <p className="text-[10px] text-muted-foreground">{t.table} №{tableNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <div className="flex items-center gap-0.5 glass rounded-full px-1 py-0.5">
              {(['ru', 'uz', 'en'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 py-1 rounded-full text-[10px] font-medium transition-colors ${
                    lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active order status */}
      {activeOrder && !showPayment && !showRating && (
        <div className="px-4 mt-3">
          <CafeOrderStatus
            order={activeOrder}
            currency={currency}
            onPayClick={() => setShowPayment(true)}
          />
        </div>
      )}

      {/* Payment sheet */}
      <AnimatePresence>
        {showPayment && activeOrder && (
          <CafePayment
            order={activeOrder}
            currency={currency}
            onClose={() => setShowPayment(false)}
            onPaid={() => {
              setShowPayment(false);
              setShowRating(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Rating sheet */}
      <AnimatePresence>
        {showRating && activeOrder && (
          <CafeRating
            order={activeOrder}
            onClose={() => { setShowRating(false); setActiveOrder(null); }}
          />
        )}
      </AnimatePresence>

      {/* Menu */}
      {!showPayment && !showRating && (
        <div className="px-4 mt-3">
          <MenuTab
            categories={categories}
            items={menuItems}
            combos={combos}
            currency={currency}
            onAddToCart={cart.addItem}
          />
        </div>
      )}

      {/* Call waiter FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleCallWaiter}
        className="fixed bottom-32 right-4 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg glow-green"
      >
        <Bell className="w-6 h-6" />
      </motion.button>

      {/* Cart */}
      <CartBar
        items={cart.items}
        totalAmount={cart.totalAmount}
        totalItems={cart.totalItems}
        currency={currency}
        onUpdateQuantity={cart.updateQuantity}
        onRemove={cart.removeItem}
        onClear={cart.clear}
        onCheckout={handlePlaceOrder}
      />
    </div>
  );
};

export default CafeTable;
