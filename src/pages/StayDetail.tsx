import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Heart, Star, MapPin, Users, ChevronRight, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { format, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useStay, useStayRooms, useCreateStayBooking, StayRoom } from '@/hooks/useStays';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import BottomNav from '@/components/BottomNav';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const CATEGORY_LABELS: Record<string, string> = {
  hotel: '🏨 Гостиница', sanatorium: '🌿 Санаторий', dacha: '🏡 Дача',
  resort: '🏖️ Зона отдыха', glamping: '🏕️ Глэмпинг', hostel: '🛏️ Хостел',
};

const AMENITY_ICONS: Record<string, string> = {
  'Бассейн': '🏊', 'СПА': '💆', 'Ресторан': '🍽️', 'Парковка': '🅿️', 'Wi-Fi': '📶',
  'Фитнес': '💪', 'Лечение': '⚕️', '3 питания': '🍽️', 'Горный воздух': '🏔️',
  'Мангал': '🔥', 'Сад': '🌳', 'Аквапарк': '🎢', 'Пляж': '🏖️', 'Анимация': '🎭',
  'Горы': '⛰️', 'Костёр': '🔥', 'Лес': '🌲', 'Звёздное небо': '🌟', 'Кондиционер': '❄️',
};

const StayDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { user } = useAuth();
  const { data: stay, isLoading } = useStay(id || '');
  const { data: rooms = [] } = useStayRooms(id || '');
  const createBooking = useCreateStayBooking();

  const [photoIndex, setPhotoIndex] = useState(0);
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(2);
  const [selectedRoom, setSelectedRoom] = useState<StayRoom | null>(null);
  const [bookingSheet, setBookingSheet] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  const nights = useMemo(() => checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0, [checkIn, checkOut]);
  const pricePerNight = selectedRoom?.price_per_night || stay?.price_per_night || 0;
  const totalPrice = nights * pricePerNight;

  const photos = stay?.photos?.length ? stay.photos : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'];

  const handleBook = async () => {
    if (!user) { navigate('/auth'); return; }
    if (!checkIn || !checkOut || nights < 1) {
      toast({ title: 'Выберите даты', description: 'Укажите даты заезда и выезда', variant: 'destructive' });
      return;
    }
    try {
      await createBooking.mutateAsync({
        stay_id: id!,
        room_id: selectedRoom?.id,
        user_id: user.id,
        check_in: format(checkIn, 'yyyy-MM-dd'),
        check_out: format(checkOut, 'yyyy-MM-dd'),
        nights,
        guests,
        total_price: totalPrice,
      });
      setBookingSheet(false);
      setSuccessModal(true);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось создать бронь', variant: 'destructive' });
    }
  };

  if (isLoading || !stay) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const ratingText = stay.rating >= 4.8 ? 'Превосходно' : stay.rating >= 4.5 ? 'Отлично' : stay.rating >= 4.0 ? 'Очень хорошо' : 'Хорошо';

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Photo Slider */}
      <div className="relative h-[280px] md:h-[400px]">
        <img src={photos[photoIndex]} alt={stay.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </button>
        </div>
        {photos.length > 1 && (
          <>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, i) => (
                <button key={i} onClick={() => setPhotoIndex(i)} className={cn("w-2 h-2 rounded-full transition-colors", i === photoIndex ? "bg-white" : "bg-white/40")} />
              ))}
            </div>
            <span className="absolute bottom-4 right-4 text-xs text-white bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">{photoIndex + 1}/{photos.length}</span>
            {photoIndex > 0 && (
              <button onClick={() => setPhotoIndex(photoIndex - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center">
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
            )}
            {photoIndex < photos.length - 1 && (
              <button onClick={() => setPhotoIndex(photoIndex + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            )}
          </>
        )}
      </div>

      <div className="px-4 space-y-5 mt-4">
        {/* Live badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">✅ Свободно</Badge>
          <Badge variant="outline" className="text-[10px] border-blue-400/30 text-blue-400">⚡ Мгновенное подтверждение</Badge>
          <Badge variant="outline" className="text-[10px] border-green-400/30 text-green-400">🆓 Отмена за 24ч</Badge>
        </div>

        {/* Main info */}
        <div className="space-y-2">
          <Badge variant="secondary" className="text-[10px]">{CATEGORY_LABELS[stay.category] || stay.category}</Badge>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Syne, sans-serif' }}>{stay.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-0.5"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />{stay.rating}</span>
            <span>· {stay.reviews_count} отзывов</span>
            <span>· {ratingText}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{stay.city}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />до {stay.max_guests} гостей</span>
          </div>
          {stay.description && <p className="text-sm text-muted-foreground leading-relaxed">{stay.description}</p>}
        </div>

        {/* Dates section */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <h2 className="text-sm font-bold">📅 Даты</h2>
          <div className="grid grid-cols-2 gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-12 flex-col items-start text-left", checkIn && "border-primary/50")}>
                  <span className="text-[10px] text-primary font-semibold">Заезд</span>
                  <span className="text-xs">{checkIn ? format(checkIn, 'dd MMM yyyy', { locale: ru }) : 'Выберите дату'}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} disabled={d => d < new Date()} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-12 flex-col items-start text-left", checkOut && "border-blue-400/50")}>
                  <span className="text-[10px] text-blue-400 font-semibold">Выезд</span>
                  <span className="text-xs">{checkOut ? format(checkOut, 'dd MMM yyyy', { locale: ru }) : 'Выберите дату'}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} disabled={d => d < (checkIn || new Date())} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          {nights > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">🌙 {nights} {nights === 1 ? 'ночь' : nights < 5 ? 'ночи' : 'ночей'}</span>
              <span className="text-primary font-bold">{totalPrice.toLocaleString()} сум</span>
            </div>
          )}
        </div>

        {/* Guests counter */}
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between">
          <span className="text-sm font-medium">👥 Гостей</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">−</button>
            <span className="text-sm font-semibold w-5 text-center">{guests}</span>
            <button onClick={() => setGuests(Math.min(stay.max_guests, guests + 1))} className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">+</button>
          </div>
        </div>

        {/* Rooms */}
        {rooms.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold">🛏️ Номера</h2>
            {rooms.map(room => (
              <div
                key={room.id}
                className={cn(
                  "bg-card rounded-2xl border p-4 space-y-2 cursor-pointer transition-colors",
                  selectedRoom?.id === room.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                )}
                onClick={() => setSelectedRoom(selectedRoom?.id === room.id ? null : room)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{room.name}</h3>
                  {selectedRoom?.id === room.id && <Check className="w-4 h-4 text-primary" />}
                </div>
                {room.description && <p className="text-xs text-muted-foreground">{room.description}</p>}
                <div className="flex gap-2 text-xs text-muted-foreground">
                  {room.bed_type && <span>🛏️ {room.bed_type}</span>}
                  {room.area_sqm && <span>📐 {room.area_sqm} м²</span>}
                  <span>👥 до {room.max_guests}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {room.amenities?.slice(0, 4).map(a => (
                    <Badge key={a} variant="outline" className="text-[10px] px-1.5 py-0 border-border/50">{a}</Badge>
                  ))}
                </div>
                <div className="text-primary font-bold text-sm">{room.price_per_night.toLocaleString()} сум <span className="text-xs text-muted-foreground font-normal">/ ночь</span></div>
              </div>
            ))}
          </div>
        )}

        {/* Amenities */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold">✨ Удобства</h2>
          <div className="grid grid-cols-2 gap-2">
            {stay.amenities?.map(a => (
              <div key={a} className="flex items-center gap-2 text-sm text-foreground">
                <span>{AMENITY_ICONS[a] || '✅'}</span>
                <span>{a}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold">❓ Правила</h2>
          <div className="bg-card rounded-2xl border border-border p-4 space-y-2 text-sm text-muted-foreground">
            <p>🕐 Заезд с 14:00</p>
            <p>🕐 Выезд до 12:00</p>
            <p>🐾 Домашние животные — уточняйте</p>
            <p>🚭 Курение запрещено</p>
            <p>🤫 Тихое время с 23:00</p>
          </div>
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border safe-bottom">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            {nights > 0 ? (
              <>
                <p className="text-xs text-muted-foreground">{nights} {nights === 1 ? 'ночь' : nights < 5 ? 'ночи' : 'ночей'}</p>
                <p className="text-lg font-bold text-primary">{totalPrice.toLocaleString()} сум</p>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">от</p>
                <p className="text-lg font-bold text-primary">{pricePerNight.toLocaleString()} сум <span className="text-xs text-muted-foreground font-normal">/ ночь</span></p>
              </>
            )}
          </div>
          <Button
            onClick={() => { if (nights > 0) setBookingSheet(true); else toast({ title: 'Выберите даты заезда и выезда' }); }}
            className="h-11 px-6 text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #00ff87, #00c6ff)' }}
          >
            🏨 Забронировать
          </Button>
        </div>
      </div>

      {/* Booking confirmation sheet */}
      <Sheet open={bookingSheet} onOpenChange={setBookingSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader><SheetTitle>Подтверждение брони</SheetTitle></SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2 text-sm">
              <p className="flex justify-between"><span className="text-muted-foreground">🏨 Объект</span><span className="font-medium">{stay.name}</span></p>
              {selectedRoom && <p className="flex justify-between"><span className="text-muted-foreground">🛏️ Номер</span><span className="font-medium">{selectedRoom.name}</span></p>}
              <p className="flex justify-between"><span className="text-muted-foreground">📅 Заезд</span><span className="font-medium">{checkIn && format(checkIn, 'dd MMMM yyyy', { locale: ru })}</span></p>
              <p className="flex justify-between"><span className="text-muted-foreground">📅 Выезд</span><span className="font-medium">{checkOut && format(checkOut, 'dd MMMM yyyy', { locale: ru })}</span></p>
              <p className="flex justify-between"><span className="text-muted-foreground">🌙 Ночей</span><span className="font-medium">{nights}</span></p>
              <p className="flex justify-between"><span className="text-muted-foreground">👥 Гостей</span><span className="font-medium">{guests}</span></p>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Итого</span>
              <span className="text-2xl font-bold text-primary">{totalPrice.toLocaleString()} сум</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setBookingSheet(false)}>Отмена</Button>
              <Button
                className="flex-1"
                onClick={handleBook}
                disabled={createBooking.isPending}
                style={{ background: 'linear-gradient(135deg, #00ff87, #00c6ff)' }}
              >
                {createBooking.isPending ? '...' : '✅ Подтвердить'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Success modal */}
      <AnimatePresence>
        {successModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
            onClick={() => { setSuccessModal(false); navigate('/bookings'); }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-card rounded-3xl p-8 text-center space-y-4 max-w-sm w-full border border-border"
              onClick={e => e.stopPropagation()}
            >
              <span className="text-6xl">🏨</span>
              <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Syne, sans-serif' }}>Номер забронирован!</h2>
              <p className="text-sm text-muted-foreground">Ждём вас {checkIn && format(checkIn, 'dd MMMM', { locale: ru })}!</p>
              <p className="text-xs text-muted-foreground">📱 Подтверждение в @TutGoUzBot</p>
              <Button className="w-full" onClick={() => { setSuccessModal(false); navigate('/bookings'); }}>Отлично! 🎉</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isDesktop && <BottomNav />}
    </div>
  );
};

export default StayDetail;
