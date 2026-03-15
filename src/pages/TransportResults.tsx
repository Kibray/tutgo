import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, SlidersHorizontal, ArrowUpDown, Check, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import BottomNav from '@/components/BottomNav';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useTransportRoutes, TransportRoute, useCreateTransportBooking } from '@/hooks/useTransport';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const TRANSPORT_ICONS: Record<string, string> = {
  bus: '🚌',
  minibus: '🚐',
  suv: '🚙',
  vip: '🏎️',
};

const TRANSPORT_LABELS: Record<string, string> = {
  bus: 'Автобус',
  minibus: 'Минибус',
  suv: 'Внедорожник',
  vip: 'VIP авто',
};

const FILTER_TYPES = [
  { id: 'all', icon: '🚌', label: 'Все' },
  { id: 'bus', icon: '🚌', label: 'Автобус' },
  { id: 'minibus', icon: '🚐', label: 'Минибус' },
  { id: 'suv', icon: '🚙', label: 'Внедорожник' },
];

const formatTime = (t: string | null) => t ? t.slice(0, 5) : '--:--';

const RouteCard = ({ route, onSelect }: { route: TransportRoute; onSelect: () => void }) => {
  const seatsColor = route.available_seats > 5 ? 'text-green-400' : route.available_seats > 0 ? 'text-orange-400' : 'text-destructive';
  const seatsIcon = route.available_seats > 5 ? '✅' : route.available_seats > 0 ? '⚠️' : '❌';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{TRANSPORT_ICONS[route.transport_type] || '🚌'}</span>
          <div>
            <p className="text-sm font-semibold text-foreground">{route.transport_name || TRANSPORT_LABELS[route.transport_type]}</p>
            <p className="text-[10px] text-muted-foreground">{TRANSPORT_LABELS[route.transport_type]}</p>
          </div>
        </div>
        <span className="text-lg font-bold text-primary">{route.price_per_seat.toLocaleString()} сум</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{formatTime(route.departure_time)}</p>
          <p className="text-[10px] text-muted-foreground">{route.from_city}</p>
        </div>
        <div className="flex-1 flex items-center gap-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] text-muted-foreground px-1">
            {route.duration_minutes ? `${Math.floor(route.duration_minutes / 60)}ч ${route.duration_minutes % 60}м` : '—'}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{formatTime(route.arrival_time)}</p>
          <p className="text-[10px] text-muted-foreground">{route.to_city}</p>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        {route.amenities?.slice(0, 4).map((a, i) => (
          <Badge key={i} variant="outline" className="text-[10px] border-border">{a}</Badge>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className={cn("text-xs font-medium", seatsColor)}>
          {seatsIcon} {route.available_seats > 0 ? `${route.available_seats} мест свободно` : 'Нет мест'}
        </span>
        <Button
          size="sm"
          onClick={onSelect}
          disabled={route.available_seats === 0}
          className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(200,100%,50%)] text-primary-foreground"
        >
          Выбрать место →
        </Button>
      </div>
    </motion.div>
  );
};

const TransportResults = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDesktop = useIsDesktop();
  const { user } = useAuth();
  const { toast } = useToast();
  const createBooking = useCreateTransportBooking();

  const fromCity = searchParams.get('from') || '';
  const toCity = searchParams.get('to') || '';
  const travelDate = searchParams.get('date') || '';
  const passengers = parseInt(searchParams.get('passengers') || '1');

  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: routes = [], isLoading } = useTransportRoutes({
    from_city: fromCity,
    to_city: toCity,
    transport_type: typeFilter,
  });

  const filtered = useMemo(() => {
    return routes.filter(r => r.available_seats >= passengers);
  }, [routes, passengers]);

  const handleSelect = (route: TransportRoute) => {
    setSelectedRoute(route);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!selectedRoute) return;

    try {
      await createBooking.mutateAsync({
        route_id: selectedRoute.id,
        user_id: user.id,
        travel_date: travelDate || new Date().toISOString().split('T')[0],
        seats: passengers,
        total_price: selectedRoute.price_per_seat * passengers,
      });
      setShowConfirm(false);
      setShowSuccess(true);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось забронировать', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/transport')} className="p-1.5">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">{fromCity || '?'} → {toCity || '?'}</p>
            <p className="text-[10px] text-muted-foreground">{travelDate || 'Любая дата'} · {passengers} пассажир(ов)</p>
          </div>
        </div>
      </div>

      <div className={cn("px-4 py-4 space-y-4", isDesktop && "max-w-3xl mx-auto")}>
        {/* Type filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_TYPES.map(f => (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                typeFilter === f.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">{filtered.length} рейсов найдено</p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm text-muted-foreground">Рейсы не найдены</p>
            <Button variant="outline" className="mt-3" onClick={() => navigate('/transport')}>
              Изменить поиск
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(route => (
              <RouteCard key={route.id} route={route} onSelect={() => handleSelect(route)} />
            ))}
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Подтверждение бронирования</DialogTitle>
            <DialogDescription>Проверьте данные перед бронированием</DialogDescription>
          </DialogHeader>
          {selectedRoute && (
            <div className="space-y-3">
              <div className="space-y-2 text-sm">
                <p>📍 {selectedRoute.from_city} → {selectedRoute.to_city}</p>
                {travelDate && <p>📅 {travelDate}</p>}
                <p>🕐 Отправление: {formatTime(selectedRoute.departure_time)}</p>
                <p>👥 Пассажиров: {passengers}</p>
                <p>{TRANSPORT_ICONS[selectedRoute.transport_type]} {selectedRoute.transport_name || TRANSPORT_LABELS[selectedRoute.transport_type]}</p>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-2xl font-bold text-primary">{(selectedRoute.price_per_seat * passengers).toLocaleString()} сум</p>
                <p className="text-xs text-muted-foreground">Оплата при посадке</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>Отмена</Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(200,100%,50%)]"
                  onClick={handleConfirm}
                  disabled={createBooking.isPending}
                >
                  {createBooking.isPending ? '...' : '✅ Подтвердить'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Success dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm mx-auto text-center">
          <DialogHeader>
            <DialogTitle className="sr-only">Успех</DialogTitle>
            <DialogDescription className="sr-only">Бронирование подтверждено</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="text-5xl">🎫</div>
            <h3 className="text-xl font-bold text-foreground">Место забронировано!</h3>
            <p className="text-sm text-muted-foreground">Приезжайте за 15 минут до отправления</p>
            <p className="text-xs text-muted-foreground">📱 Уведомление придёт в @TutGoUzBot</p>
            <Button
              className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(200,100%,50%)]"
              onClick={() => { setShowSuccess(false); navigate('/transport'); }}
            >
              Отлично! 🎉
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {!isDesktop && <BottomNav />}
    </div>
  );
};

export default TransportResults;
