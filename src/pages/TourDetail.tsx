import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Heart, Star, MapPin, Users, Clock, Minus, Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useTour, useTours, useCreateTourBooking } from '@/hooks/useTours';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const TourDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: tour, isLoading } = useTour(id || '');
  const createBooking = useCreateTourBooking();

  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Similar tours
  const { data: similarData } = useTours({ category: tour?.category });

  const totalPrice = useMemo(() => {
    if (!tour) return 0;
    return tour.price_per_person * adults + tour.price_child * children;
  }, [tour, adults, children]);

  const handleBook = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!selectedDate) {
      toast.error('Выберите дату вылета');
      return;
    }
    if (!tour) return;

    try {
      await createBooking.mutateAsync({
        tour_id: tour.id,
        user_id: user.id,
        adults,
        children,
        selected_date: selectedDate,
        total_price: totalPrice,
      });
      setShowSuccess(true);
    } catch (e: any) {
      toast.error(e.message || 'Ошибка бронирования');
    }
  };

  if (isLoading || !tour) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isHit = tour.rating >= 4.9;
  const photos = tour.photos?.length ? tour.photos : ['/placeholder.svg'];
  const program = (tour.program || []) as { day: number; title: string; description: string }[];
  const highlights = (tour.highlights || []) as { icon: string; title: string; description: string }[];
  const futureDates = (tour.available_dates || []).filter(d => new Date(d) >= new Date());
  const pastDates = (tour.available_dates || []).filter(d => new Date(d) < new Date());

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Photo Slider */}
      <div className="relative h-[300px] md:h-[400px]">
        <img
          src={photos[currentPhoto]}
          alt={tour.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        <button
          onClick={() => navigate('/tours')}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <Heart className="w-5 h-5 text-white" />
        </button>

        {photos.length > 1 && (
          <>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPhoto(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === currentPhoto ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
            <span className="absolute bottom-4 right-4 text-xs text-white bg-black/50 px-2 py-1 rounded-full">
              {currentPhoto + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 space-y-6 -mt-4 relative z-10">
        {/* Live badges */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 whitespace-nowrap">
            🔥 12 человек смотрят сейчас
          </Badge>
          <Badge className="bg-primary/10 text-primary border-primary/20 whitespace-nowrap">
            ⚡ Мгновенное подтверждение
          </Badge>
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 whitespace-nowrap">
            🆓 Отмена за 48ч бесплатно
          </Badge>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="flex gap-2">
            {isHit && <Badge className="bg-orange-500/90 text-white">🔥 Хит</Badge>}
            <Badge variant="secondary">{tour.duration_days} дней / {tour.duration_days - 1} ночей</Badge>
          </div>
          <h1 className="text-2xl font-bold font-[Syne] text-foreground">{tour.title}</h1>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(tour.rating) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
              ))}
            </div>
            <span className="text-muted-foreground">{tour.rating}</span>
            <span className="text-muted-foreground">· {tour.reviews_count} отзывов</span>
            {tour.rating >= 4.5 && (
              <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">Превосходно</Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">📍 {tour.departure_city}</Badge>
            <Badge variant="outline">👥 {tour.min_people}–{tour.max_people} чел</Badge>
            <Badge variant="outline">🗣️ РУ/УЗ</Badge>
            <Badge variant="outline">🎫 Билеты вкл.</Badge>
          </div>
        </div>

        {/* Description */}
        {tour.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{tour.description}</p>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold">✨ Главное</h2>
            <div className="space-y-2">
              {highlights.map((h, i) => (
                <div key={i} className="p-3 rounded-xl bg-primary/[0.04] border border-primary/10">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{h.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{h.title}</p>
                      <p className="text-xs text-muted-foreground">{h.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Includes / Excludes */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold">📦 Включено / Не включено</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              {tour.includes.map((inc, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/[0.06] border border-primary/10 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  {inc}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {tour.excludes.map((exc, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-muted border border-border text-sm text-muted-foreground">
                  <X className="w-4 h-4 shrink-0" />
                  {exc}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Program */}
        {program.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold">📅 Программа по дням</h2>
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-primary/20" />
              {program.map((p, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[18px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                  <div>
                    <p className="font-semibold text-sm">День {p.day}: {p.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Date selection */}
        {tour.available_dates?.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold">🗓️ Дата вылета</h2>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {tour.available_dates.map(date => {
                const isPast = new Date(date) < new Date();
                const isSelected = selectedDate === date;
                const d = new Date(date);
                return (
                  <button
                    key={date}
                    disabled={isPast}
                    onClick={() => setSelectedDate(date)}
                    className={`flex flex-col items-center px-4 py-2 rounded-xl border text-sm whitespace-nowrap transition-colors ${
                      isPast
                        ? 'opacity-40 cursor-not-allowed border-border'
                        : isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="font-medium">{d.getDate()}</span>
                    <span className="text-xs text-muted-foreground">
                      {d.toLocaleDateString('ru', { month: 'short' })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* People count */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold">👥 Количество человек</h2>
          <div className="bg-card rounded-xl border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Взрослые</p>
                <p className="text-xs text-muted-foreground">{tour.price_per_person.toLocaleString()} сум</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAdults(Math.max(1, adults - 1))}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold w-4 text-center">{adults}</span>
                <button
                  onClick={() => setAdults(Math.min(tour.max_people, adults + 1))}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Дети 6–17 лет</p>
                <p className="text-xs text-muted-foreground">{tour.price_child.toLocaleString()} сум</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setChildren(Math.max(0, children - 1))}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold w-4 text-center">{children}</span>
                <button
                  onClick={() => setChildren(children + 1)}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-2">
          <h2 className="text-lg font-bold">💰 Итоговая стоимость</h2>
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>{tour.price_per_person.toLocaleString()} × {adults} взр.</span>
              <span>{(tour.price_per_person * adults).toLocaleString()} сум</span>
            </div>
            {children > 0 && (
              <div className="flex justify-between">
                <span>{tour.price_child.toLocaleString()} × {children} дет.</span>
                <span>{(tour.price_child * children).toLocaleString()} сум</span>
              </div>
            )}
          </div>
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="font-bold">Итого</span>
            <span className="text-xl font-bold text-primary">{totalPrice.toLocaleString()} сум</span>
          </div>
          <p className="text-xs text-muted-foreground">Сервисный сбор TutGo — Бесплатно 🎉</p>
          <p className="text-xs text-muted-foreground">Оплата напрямую турагентству</p>
        </div>

        {/* FAQ */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold">❓ Частые вопросы</h2>
          <Accordion type="single" collapsible>
            <AccordionItem value="cancel">
              <AccordionTrigger className="text-sm">Можно ли отменить бронирование?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Да, бесплатно за 48 часов. При отмене менее 48ч — удерживается 20%.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="visa">
              <AccordionTrigger className="text-sm">Нужна ли виза?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Нет. Для граждан СНГ виза не нужна.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="kids">
              <AccordionTrigger className="text-sm">Есть детская скидка?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Да! Дети 6–17 лет — скидка 27%. До 6 лет — бесплатно.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="agent">
              <AccordionTrigger className="text-sm">Когда свяжется турагент?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                В течение 2 часов после бронирования. Уведомление придёт в @TutGoUzBot.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Similar tours */}
        {(() => {
          const allSimilar = similarData?.pages.flatMap(p => p.tours).filter(t => t.id !== tour.id) ?? [];
          if (allSimilar.length === 0) return null;
          return (
          <div className="space-y-3">
            <h2 className="text-lg font-bold">🌍 Похожие туры</h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {allSimilar.slice(0, 6).map(t => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/tours/${t.id}`)}
                  className="min-w-[200px] bg-card rounded-xl border border-border overflow-hidden text-left"
                >
                  <img src={t.photos?.[0] || '/placeholder.svg'} alt={t.title} className="w-full h-28 object-cover" />
                  <div className="p-3">
                    <p className="font-medium text-sm line-clamp-1">{t.title}</p>
                    <p className="text-primary text-sm font-bold">{t.price_per_person.toLocaleString()} сум</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          );
        })()}
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-xs text-muted-foreground">за человека</span>
            <p className="text-lg font-bold text-primary">{tour.price_per_person.toLocaleString()} сум</p>
          </div>
          <div className="flex gap-1.5">
            <Badge variant="outline" className="text-[10px]">⚡</Badge>
            <Badge variant="outline" className="text-[10px]">🆓</Badge>
          </div>
          <Button
            onClick={handleBook}
            disabled={createBooking.isPending}
            className="bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl px-6"
          >
            🌍 Забронировать
          </Button>
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="text-center max-w-sm">
          <div className="space-y-4 py-4">
            <div className="text-6xl">✅</div>
            <DialogHeader>
              <DialogTitle className="text-center">Заявка отправлена!</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Турагент свяжется в течение 2 часов</p>
            <p className="text-sm text-muted-foreground">📱 Уведомление придёт в @TutGoUzBot</p>
            <Button onClick={() => { setShowSuccess(false); navigate('/tours'); }} className="w-full">
              Отлично! 🎉
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TourDetail;
