import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Clock, MapPin, ChevronRight, Navigation, Copy, Phone, Share2, Send, User } from 'lucide-react';
import { formatPrice, openDirections, copyAddress, categoryEmoji } from '@/lib/types';
import type { LocationItem } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import DateChip from '@/components/DateChip';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const pluralReviews = (n: number) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'отзыв';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'отзыва';
  return 'отзывов';
};

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [location, setLocation] = useState<LocationItem | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const { data: loc } = await supabase.from('locations').select('*').eq('id', id).single();
      if (loc) {
        setLocation(loc as LocationItem);
        const [svcRes, staffRes, reviewsRes] = await Promise.all([
          supabase.from('services').select('*').eq('location_id', id),
          supabase.from('staff').select('*').eq('location_id', id),
          supabase.from('reviews').select('*, profiles!reviews_user_id_fkey(display_name, avatar_url)').eq('location_id', id).order('created_at', { ascending: false }).limit(50),
        ]);
        setServices(svcRes.data || []);
        setStaffList(staffRes.data || []);
        setReviews(reviewsRes.data || []);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  // Compute per-staff ratings
  const staffRatings = useMemo(() => {
    const map: Record<string, { sum: number; count: number }> = {};
    reviews.forEach((r: any) => {
      if (r.staff_id) {
        if (!map[r.staff_id]) map[r.staff_id] = { sum: 0, count: 0 };
        map[r.staff_id].sum += r.rating;
        map[r.staff_id].count += 1;
      }
    });
    const result: Record<string, number> = {};
    Object.entries(map).forEach(([sid, { sum, count }]) => {
      result[sid] = Math.round((sum / count) * 10) / 10;
    });
    return result;
  }, [reviews]);

  const timeSlots = useMemo(() => {
    const slots: { id: string; time: string; available: boolean }[] = [];
    for (let h = 9; h <= 20; h++) {
      for (const m of ['00', '30']) {
        const time = `${h.toString().padStart(2, '0')}:${m}`;
        slots.push({ id: `slot-${time}`, time, available: true });
      }
    }
    return slots;
  }, []);

  const isBookable = location ? ['beauty', 'medical', 'tour', 'service', 'auto', 'sport', 'education'].includes(location.business_type) : false;

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Загрузка...</div>;
  if (!location) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Услуга не найдена</div>;

  const dates = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; });
  const fullAddress = `${location.address || ''}, ${location.city || ''}`;
  const lat = location.lat || 41.3111;
  const lng = location.lng || 69.2797;

  const handleBook = () => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred('medium');
    const svc = services.find(s => s.id === selectedService);
    navigate('/booking-confirm', {
      state: { location, service: svc, date: dates[selectedDate], time: selectedSlot, staffId: selectedStaff, staffList },
    });
  };

  const handleCopyAddress = () => { copyAddress(fullAddress); toast({ title: 'Адрес скопирован', description: fullAddress }); };
  const handleShare = () => {
    const text = `${location.name}\n${fullAddress}\n${(location.price_from || 0) > 0 ? `от ${formatPrice(location.price_from!)} ${location.currency}` : ''}`;
    if (navigator.share) navigator.share({ title: location.name, text });
    else { navigator.clipboard.writeText(text); toast({ title: 'Скопировано для отправки' }); }
  };

  // Rating distribution
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter((r: any) => r.rating === star).length,
  }));
  const maxRatingCount = Math.max(...ratingDist.map(d => d.count), 1);

  return (
    <div className="min-h-screen bg-background pb-32 overflow-y-auto">
      {/* Hero */}
      <div className="relative h-56 bg-secondary flex items-center justify-center">
        <div className="flex gap-1 w-full h-full">
          <div className="flex-1 bg-secondary flex items-center justify-center text-5xl">{categoryEmoji[location.business_type] || '📍'}</div>
          <div className="w-1/3 flex flex-col gap-1">
            <div className="flex-1 bg-muted flex items-center justify-center text-2xl opacity-60">📷</div>
            <div className="flex-1 bg-muted flex items-center justify-center text-2xl opacity-60">📷</div>
          </div>
        </div>
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-9 h-9 glass rounded-full flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* Info card */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="glass rounded-lg p-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold font-display text-foreground">{location.name}</h1>
            {location.verified && <span className="inline-flex items-center gap-0.5 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">✓</span>}
          </div>
          {location.description && <p className="text-sm text-muted-foreground mt-1">{location.description}</p>}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-primary fill-primary" /><span className="font-semibold text-foreground">{location.rating}</span> · {location.review_count} {pluralReviews(location.review_count || 0)}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{location.city}</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="flex-1">{fullAddress}</span>
            <button onClick={handleCopyAddress} className="p-1.5 rounded-md hover:bg-secondary transition-colors"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
          </div>
          {(location.price_from || 0) > 0 && (
            <span className="text-lg font-bold text-gradient-green mt-3 block">от {formatPrice(location.price_from!)} {location.currency}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 mt-4 grid grid-cols-4 gap-2">
        {location.telegram && (
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => window.open(`https://t.me/${location.telegram}`, '_blank')}
            className="glass rounded-xl py-3 flex flex-col items-center gap-1.5 ring-1 ring-[hsl(200,80%,55%)]/30">
            <Send className="w-5 h-5 text-[hsl(200,80%,55%)]" /><span className="text-[10px] font-medium text-foreground">Telegram</span>
          </motion.button>
        )}
        {location.phone && (
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => window.open(`tel:${location.phone}`)}
            className="glass rounded-xl py-3 flex flex-col items-center gap-1.5">
            <Phone className="w-5 h-5 text-primary" /><span className="text-[10px] font-medium text-foreground">Позвонить</span>
          </motion.button>
        )}
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => openDirections(lat, lng, fullAddress)}
          className="glass rounded-xl py-3 flex flex-col items-center gap-1.5">
          <Navigation className="w-5 h-5 text-primary" /><span className="text-[10px] font-medium text-foreground">Маршрут</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleShare}
          className="glass rounded-xl py-3 flex flex-col items-center gap-1.5">
          <Share2 className="w-5 h-5 text-primary" /><span className="text-[10px] font-medium text-foreground">Поделиться</span>
        </motion.button>
      </div>

      {/* Tabs: Services / Reviews */}
      <div className="px-4 mt-4">
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="services" className="flex-1 text-xs">Услуги</TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1 text-xs">
              Отзывы {(location.review_count || 0) > 0 && <span className="ml-1 text-[10px] text-muted-foreground">({location.review_count})</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            {services.length > 0 ? (
              <div className="glass rounded-lg p-4">
                <div className="space-y-2">
                  {services.map((svc) => (
                    <motion.button key={svc.id} whileTap={{ scale: 0.98 }} onClick={() => setSelectedService(svc.id)}
                      className={`w-full glass rounded-lg p-3 flex items-center justify-between transition-colors ${selectedService === svc.id ? 'ring-1 ring-primary' : ''}`}>
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground">{svc.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{svc.duration_minutes} мин</p>
                      </div>
                      <span className="text-sm font-bold text-gradient-green">{formatPrice(svc.price)} {svc.currency}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground">Услуги не добавлены</div>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            <div className="glass rounded-lg p-4">
              {/* Rating summary */}
              <div className="flex gap-4 mb-4">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-foreground">{location.rating || 0}</span>
                  <div className="flex items-center gap-0.5 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < Math.round(location.rating || 0) ? 'text-primary fill-primary' : 'text-muted'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1">{location.review_count || 0} {pluralReviews(location.review_count || 0)}</span>
                </div>
                <div className="flex-1 space-y-1">
                  {ratingDist.map(({ star, count }) => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-3">{star}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(count / maxRatingCount) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-4 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review list */}
              {reviews.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Пока нет отзывов</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review: any) => {
                    const profile = review.profiles;
                    const displayName = profile?.display_name || 'Пользователь';
                    const initials = displayName.charAt(0).toUpperCase();
                    return (
                      <div key={review.id} className="border-t border-border pt-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                            {profile?.avatar_url ? (
                              <img src={profile.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                            ) : (
                              <span className="text-xs font-bold text-primary">{initials}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-foreground">{displayName}</p>
                              <span className="text-[10px] text-muted-foreground">{new Date(review.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-primary fill-primary' : 'text-muted'}`} />
                              ))}
                            </div>
                            {review.comment && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{review.comment}</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking */}
      {isBookable && (
        <>
          <div className="px-4 mt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Выберите дату</h3>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
              {dates.map((date, i) => <DateChip key={i} date={date} active={selectedDate === i} onClick={() => setSelectedDate(i)} />)}
            </div>
          </div>
          <div className="px-4 mt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Выберите время</h3>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((slot) => (
                <motion.button key={slot.id} whileTap={{ scale: 0.95 }} onClick={() => setSelectedSlot(slot.time)}
                  className={`py-2.5 rounded-md text-xs font-medium transition-colors ${
                    selectedSlot === slot.time ? 'bg-primary text-accent-foreground glow-green-sm'
                    : 'glass text-foreground hover:bg-secondary'
                  }`}>{slot.time}</motion.button>
              ))}
            </div>
          </div>
          {staffList.length > 0 && (
            <div className="px-4 mt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Выберите специалиста</h3>
              <div className="space-y-2">
                {staffList.map((s: any) => (
                  <motion.button key={s.id} whileTap={{ scale: 0.98 }} onClick={() => setSelectedStaff(s.id)}
                    className={`w-full glass rounded-lg p-3 flex items-center gap-3 transition-colors ${selectedStaff === s.id ? 'ring-1 ring-primary glow-green-sm' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-foreground">{s.full_name?.charAt(0)}</div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">{s.full_name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{(s.specialties || []).join(', ')}</p>
                        {staffRatings[s.id] && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Star className="w-3 h-3 text-primary fill-primary" />{staffRatings[s.id]}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          <div className="fixed bottom-16 left-0 right-0 px-4 py-3 glass-strong z-40">
            <motion.button whileTap={{ scale: 0.98 }} onClick={handleBook} disabled={!selectedSlot}
              className={`w-full py-3.5 rounded-lg font-semibold text-sm transition-all ${
                selectedSlot ? 'bg-primary text-accent-foreground glow-green' : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}>Записаться</motion.button>
          </div>
        </>
      )}
      <BottomNav />
    </div>
  );
};

export default ServiceDetail;
