import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Clock, MapPin, ChevronRight, Navigation, Copy, Phone, Share2, Send, User, Users, CalendarDays, Bell } from 'lucide-react';
import AddressPicker from '@/components/AddressPicker';
import QueueStatus from '@/components/QueueStatus';
import { formatPrice, openDirections, copyAddress, categoryEmoji } from '@/lib/types';
import type { LocationItem } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import DateChip from '@/components/DateChip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useMenu } from '@/hooks/useMenu';
import { useCart } from '@/hooks/useCart';
import MenuTab from '@/components/menu/MenuTab';
import CartBar from '@/components/menu/CartBar';
import ReservationTab from '@/components/menu/ReservationTab';

const pluralReviews = (n: number) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'отзыв';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'отзыва';
  return 'отзывов';
};

const ServiceDetail = () => {
  const { id } = useParams();
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [claimSubmitting, setClaimSubmitting] = useState(false);

  const [location, setLocation] = useState<LocationItem | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [bookedSeats, setBookedSeats] = useState<Record<string, number>>({});
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const { categories, items: menuItems, combos, loading: menuLoading } = useMenu(id || '');
  const cart = useCart();

  const isCafe = location?.business_type === 'cafe' || location?.business_type === 'restaurant' || location?.business_type === 'food';

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const { data: loc } = await supabase.from('locations').select('*').eq('id', id).single();
      if (loc) {
        setLocation(loc as LocationItem);
        const [svcRes, staffRes, reviewsRes] = await Promise.all([
          supabase.from('services').select('*').eq('location_id', id),
          supabase.from('staff').select('*').eq('location_id', id),
          supabase.from('reviews').select('*').eq('location_id', id).order('created_at', { ascending: false }).limit(50),
        ]);
        setServices(svcRes.data || []);

        if (loc.business_type === 'tour' && svcRes.data?.length) {
          const svcIds = svcRes.data.map((s: any) => s.id);
          const { data: appts } = await supabase.from('appointments').select('service_id')
            .in('service_id', svcIds).in('status', ['confirmed', 'pending']);
          const counts: Record<string, number> = {};
          (appts || []).forEach((a: any) => { counts[a.service_id] = (counts[a.service_id] || 0) + 1; });
          setBookedSeats(counts);
        }

        setStaffList(staffRes.data || []);
        
        const rawReviews = reviewsRes.data || [];
        if (rawReviews.length > 0) {
          const userIds = [...new Set(rawReviews.map((r: any) => r.user_id))];
          const { data: profiles } = await supabase.from('public_profiles' as any).select('user_id, display_name, avatar_url').in('user_id', userIds);
          const profileMap: Record<string, any> = {};
          (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });
          setReviews(rawReviews.map((r: any) => ({ ...r, profiles: profileMap[r.user_id] || null })));
        } else {
          setReviews([]);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

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

  const dates = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; }),
  []);

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  const timeSlots = useMemo(() => {
    const date = dates[selectedDate];
    const dayName = dayNames[date.getDay()];

    let startH = 9, startM = 0, endH = 20, endM = 0;

    const staff = staffList.find(s => s.id === selectedStaff);
    const wh = staff?.working_hours as Record<string, { start: string; end: string }> | null;

    if (wh && wh[dayName]) {
      const [sh, sm] = wh[dayName].start.split(':').map(Number);
      const [eh, em] = wh[dayName].end.split(':').map(Number);
      startH = sh; startM = sm; endH = eh; endM = em;
    }

    const slots: { id: string; time: string; available: boolean }[] = [];
    let h = startH, m = startM;
    const endMinutes = endH * 60 + endM;

    while (h * 60 + m < endMinutes) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      slots.push({ id: `slot-${time}`, time, available: !bookedSlots.has(time) });
      m += 30;
      if (m >= 60) { h += 1; m = 0; }
    }
    return slots;
  }, [selectedDate, selectedStaff, staffList, dates, bookedSlots]);

  // Fetch existing appointments for selected staff + date
  useEffect(() => {
    const fetchBooked = async () => {
      if (!selectedStaff || !id) { setBookedSlots(new Set()); return; }
      setSlotsLoading(true);
      const date = dates[selectedDate];
      const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      const dayStart = `${dateStr}T00:00:00`;
      const dayEnd = `${dateStr}T23:59:59`;

      const { data } = await supabase.from('appointments').select('start_time, end_time')
        .eq('staff_id', selectedStaff)
        .gte('start_time', dayStart)
        .lte('start_time', dayEnd)
        .in('status', ['pending', 'confirmed']);

      const taken = new Set<string>();
      (data || []).forEach((appt: any) => {
        const start = new Date(appt.start_time);
        const end = new Date(appt.end_time);
        let cursor = new Date(start);
        while (cursor < end) {
          taken.add(`${cursor.getHours().toString().padStart(2, '0')}:${cursor.getMinutes().toString().padStart(2, '0')}`);
          cursor = new Date(cursor.getTime() + 30 * 60000);
        }
      });
      setBookedSlots(taken);
      setSlotsLoading(false);
    };
    fetchBooked();
  }, [selectedStaff, selectedDate, id, dates]);


  const isBookable = location ? ['beauty', 'medical', 'tour', 'service', 'auto', 'sport', 'education'].includes(location.business_type) : false;

  if (loading) return (
    <div className="min-h-screen bg-background p-4 space-y-4" style={{ background: 'linear-gradient(135deg, #f5e6ee 0%, #e8ecf7 50%, #e0e8f5 100%)' }}>
      <div className="h-56 rounded-2xl bg-muted animate-pulse" />
      <div className="h-6 w-2/3 rounded bg-muted animate-pulse" />
      <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
      <div className="h-4 w-full rounded bg-muted animate-pulse" />
      <div className="h-10 w-full rounded-xl bg-muted animate-pulse" />
      <div className="flex gap-3 mt-4">
        {[1,2,3].map(i => <div key={i} className="h-10 w-20 rounded-lg bg-muted animate-pulse" />)}
      </div>
    </div>
  );
  if (!location) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground" style={{ background: 'linear-gradient(135deg, #f5e6ee 0%, #e8ecf7 50%, #e0e8f5 100%)' }}>Услуга не найдена</div>;

  const fullAddress = `${location.address || ''}, ${location.city || ''}`;
  const lat = location.lat || 41.3111;
  const lng = location.lng || 69.2797;

  const handleBook = () => {
    if (!user) {
      navigate('/auth', { state: { returnTo: window.location.pathname } });
      return;
    }
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred('medium');
    const svc = services.find(s => s.id === selectedService);
    navigate('/booking-confirm', {
      state: { location, service: svc, date: dates[selectedDate], time: selectedSlot, staffId: selectedStaff, staffList },
    });
  };

  // Wizard step helpers
  const hasServices = services.length > 0;
  const hasStaff = staffList.length > 0;
  const serviceStepDone = !hasServices || !!selectedService;
  const staffStepDone = !hasStaff || !!selectedStaff;
  const dateTimeStepDone = !!selectedSlot;
  const allStepsDone = serviceStepDone && staffStepDone && dateTimeStepDone;

  const handleSelectService = (svcId: string) => {
    setSelectedService(svcId);
    setSelectedStaff(null);
    setSelectedSlot(null);
  };
  const handleSelectStaff = (staffId: string) => {
    setSelectedStaff(staffId);
    setSelectedSlot(null);
  };
  const handleSelectDate = (i: number) => {
    setSelectedDate(i);
    setSelectedSlot(null);
  };

  const ctaLabel = !serviceStepDone
    ? 'Выберите услугу'
    : !staffStepDone
    ? 'Выберите специалиста'
    : !dateTimeStepDone
    ? 'Выберите дату и время'
    : 'Записаться →';

  const selectedServiceObj = services.find(s => s.id === selectedService);
  const selectedStaffObj = staffList.find(s => s.id === selectedStaff);
  const selectedDateObj = dates[selectedDate];
  const summaryParts = [
    selectedServiceObj?.name,
    selectedStaffObj?.full_name,
    selectedDateObj ? `${selectedDateObj.toLocaleDateString('ru', { day: 'numeric', month: 'short' })}, ${selectedSlot}` : null,
  ].filter(Boolean);

  const handleCopyAddress = () => { copyAddress(fullAddress); toast({ title: 'Адрес скопирован', description: fullAddress }); };
  const handleShare = () => {
    const text = `${location.name}\n${fullAddress}\n${(location.price_from || 0) > 0 ? `от ${formatPrice(location.price_from!)} ${location.currency}` : ''}`;
    if (navigator.share) navigator.share({ title: location.name, text });
    else { navigator.clipboard.writeText(text); toast({ title: 'Скопировано для отправки' }); }
  };

  const handleClaimBusiness = async () => {
    if (!user) {
      toast({ title: 'Войдите чтобы заявить права на бизнес' });
      navigate('/auth/partner');
      return;
    }
    if (!location) return;
    setClaimSubmitting(true);
    try {
      const { error } = await supabase.from('partner_applications').insert({
        user_id: user.id,
        company_name: location.name,
        claimed_location_id: location.id,
        status: 'claim_pending',
        phone: location.phone || '',
        address: location.address || '',
        category: location.sub_category || '',
      });
      if (error) throw error;
      toast({ title: 'Заявка отправлена! Мы свяжемся с вами.' });
    } catch (err: any) {
      toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
    } finally {
      setClaimSubmitting(false);
    }
  };

  const handleCallWaiter = async () => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.notificationOccurred('success');
    toast({ title: '📲 Официант вызван!', description: 'Скоро подойдём к вашему столику' });
    await supabase.from('notifications').insert({
      user_id: location?.owner_id,
      title: 'Вызов официанта',
      body: `Стол запрашивает обслуживание`,
      type: 'waiter_call',
      metadata: { location_id: location?.id }
    } as any);
  };

  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter((r: any) => r.rating === star).length,
  }));
  const maxRatingCount = Math.max(...ratingDist.map(d => d.count), 1);

  return (
    <div className="min-h-screen bg-background pb-32 overflow-y-auto" style={{ background: 'linear-gradient(135deg, #f5e6ee 0%, #e8ecf7 50%, #e0e8f5 100%)' }}>
      {/* Hero */}
      <div className="relative h-56 bg-secondary">
        {location.gallery && location.gallery.length > 0 ? (
          <div className="flex gap-1 w-full h-full">
            <div className="flex-1 overflow-hidden">
              <img src={location.gallery[0]} alt={location.name} className="w-full h-full object-cover" />
            </div>
            {location.gallery.length > 1 && (
              <div className="w-1/3 flex flex-col gap-1">
                {location.gallery.slice(1, 3).map((url, i) => (
                  <div key={i} className="flex-1 overflow-hidden">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                {location.gallery.length <= 2 && (
                  <div className="flex-1 bg-muted flex items-center justify-center text-2xl opacity-60">📷</div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${
            location.business_type === 'beauty' ? 'from-pink-500/30 to-purple-500/30' :
            location.business_type === 'medical' ? 'from-blue-500/30 to-cyan-500/30' :
            location.business_type === 'cafe' ? 'from-amber-500/30 to-orange-500/30' :
            location.business_type === 'tour' ? 'from-emerald-500/30 to-teal-500/30' :
            'from-primary/20 to-primary/40'
          }`}>
            <span className="text-6xl font-bold text-foreground/30">{location.name?.charAt(0)?.toUpperCase()}</span>
          </div>
        )}
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-9 h-9 glass rounded-full flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        {location.branded_icon_url && (
          <div className="absolute -bottom-5 left-4 w-12 h-12 rounded-full border-2 border-background overflow-hidden bg-secondary">
            <img src={location.branded_icon_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Gallery scroll */}
      {location.gallery && location.gallery.length > 3 && (
        <div className="px-4 mt-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {location.gallery.slice(3).map((url, i) => (
              <div key={i} className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="glass rounded-lg p-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold font-display text-foreground">{location.name}</h1>
            {location.verified ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">✅ Онлайн-запись</span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium">📞 Только по звонку</span>
            )}
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
            <>
              <span className="text-lg font-bold text-gradient-green mt-3 block">от {formatPrice(location.price_from!)} {location.currency}</span>
              <span className="text-[10px] text-muted-foreground mt-1 block">* Цены ориентировочные, уточняйте при записи.</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 mt-4 grid grid-cols-5 gap-2">
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
        {!location?.owner_id && (
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleClaimBusiness} disabled={claimSubmitting}
            className="glass rounded-xl py-3 flex flex-col items-center gap-1.5 disabled:opacity-50">
            <span className="text-lg">🏢</span><span className="text-[10px] font-medium text-foreground">{claimSubmitting ? '...' : 'Мой бизнес'}</span>
          </motion.button>
        )}
      </div>

      {/* CAFE MODE */}
      {isCafe ? (
        <div className="px-4 mt-4">
          <Tabs defaultValue="menu" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="menu" className="flex-1 text-xs">🍽️ Меню</TabsTrigger>
              <TabsTrigger value="reserve" className="flex-1 text-xs">📅 Забронировать</TabsTrigger>
              <TabsTrigger value="about" className="flex-1 text-xs">
                О нас {(location.review_count || 0) > 0 && <span className="ml-1 text-[10px] text-muted-foreground">({location.review_count})</span>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="menu">
              <MenuTab
                categories={categories}
                items={menuItems}
                combos={combos}
                currency={location.currency || 'сум'}
                onAddToCart={cart.addItem}
              />
            </TabsContent>

            <TabsContent value="reserve">
              <ReservationTab
                locationId={location.id}
                locationName={location.name}
                currency={location.currency || 'сум'}
                cartItems={cart.items}
                cartTotal={cart.totalAmount}
                onClearCart={() => cart.clear()}
              />
            </TabsContent>

            <TabsContent value="about">
              {/* Reviews section - same as before */}
              <div className="glass rounded-lg p-4">
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
            currency={location.currency || 'сум'}
            onUpdateQuantity={cart.updateQuantity}
            onRemove={cart.removeItem}
            onClear={cart.clear}
            onCheckout={() => {
              // Switch to reservation tab with pre-order
              const tabTrigger = document.querySelector('[data-value="reserve"]') as HTMLElement;
              if (tabTrigger) tabTrigger.click();
            }}
          />
        </div>
      ) : (
        /* NON-CAFE MODE - original tabs */
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
                  <div className="divide-y divide-border">
                    {services.map((svc) => {
                      const meta = svc.metadata || {};
                      const isTour = location.business_type === 'tour';
                      return (
                        <div key={svc.id} className="py-3 flex items-start justify-between gap-3 first:pt-0 last:pb-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{svc.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              {isTour && meta.duration_days ? (
                                <><CalendarDays className="w-3 h-3" />{meta.duration_days} {meta.duration_days === 1 ? 'день' : meta.duration_days < 5 ? 'дня' : 'дней'}</>
                              ) : (
                                <><Clock className="w-3 h-3" />{svc.duration_minutes} мин</>
                              )}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-gradient-green whitespace-nowrap">{formatPrice(svc.price)} {svc.currency}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center mt-3 pt-3 border-t border-border">
                    ↓ Прокрутите вниз чтобы выбрать услугу и записаться
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-muted-foreground">Услуги не добавлены</div>
              )}
            </TabsContent>

            <TabsContent value="reviews">
              <div className="glass rounded-lg p-4">
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
      )}

      {/* Live Queue */}
      {location.queue_enabled && (
        <div className="px-4 mt-4">
          <QueueStatus locationId={location.id} locationName={location.name} />
        </div>
      )}

      {/* Booking (non-cafe) - Wizard */}
      {isBookable && !isCafe && location.verified && (
        <>
          <div className="px-4 mt-6">
            {/* Progress chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {hasServices && (
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                  serviceStepDone ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
                }`}>
                  1. Услуга {serviceStepDone && '✓'}
                </span>
              )}
              {hasStaff && (
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                  staffStepDone && !!selectedStaff ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
                }`}>
                  {hasServices ? 2 : 1}. Специалист {staffStepDone && !!selectedStaff && '✓'}
                </span>
              )}
              <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                dateTimeStepDone ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
              }`}>
                {(hasServices ? 1 : 0) + (hasStaff ? 1 : 0) + 1}. Дата и время {dateTimeStepDone && '✓'}
              </span>
            </div>

            {/* Step 1 — Service */}
            {hasServices && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Выберите услугу</h3>
                <div className="space-y-2">
                  {services.map((svc) => {
                    const meta = svc.metadata || {};
                    const isTour = location.business_type === 'tour';
                    return (
                      <motion.button key={svc.id} whileTap={{ scale: 0.98 }} onClick={() => handleSelectService(svc.id)}
                        className={`w-full glass rounded-lg p-3 text-left transition-colors ${selectedService === svc.id ? 'ring-1 ring-primary glow-green-sm' : ''}`}>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">{svc.name}</p>
                          <span className="text-sm font-bold text-gradient-green">{formatPrice(svc.price)} {svc.currency}</span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          {isTour && meta.duration_days ? (
                            <><CalendarDays className="w-3 h-3" />{meta.duration_days} {meta.duration_days === 1 ? 'день' : meta.duration_days < 5 ? 'дня' : 'дней'}</>
                          ) : (
                            <><Clock className="w-3 h-3" />{svc.duration_minutes} мин</>
                          )}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2 — Staff */}
            <AnimatePresence>
              {hasStaff && serviceStepDone && (
                <motion.div
                  key="staff-step"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mb-4"
                >
                  <h3 className="text-sm font-semibold text-foreground mb-3">Выберите специалиста</h3>
                  <div className="space-y-2">
                    {staffList.map((s: any) => (
                      <motion.button key={s.id} whileTap={{ scale: 0.98 }} onClick={() => handleSelectStaff(s.id)}
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 3 — Date + Time */}
            <AnimatePresence>
              {serviceStepDone && staffStepDone && (
                <motion.div
                  key="datetime-step"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                >
                  <h3 className="text-sm font-semibold text-foreground mb-3">Выберите дату</h3>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                    {dates.map((date, i) => <DateChip key={i} date={date} active={selectedDate === i} onClick={() => handleSelectDate(i)} />)}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mt-4 mb-3">Выберите время</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {slotsLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="py-2.5 rounded-md bg-muted animate-pulse h-9" />
                      ))
                    ) : timeSlots.length === 0 ? (
                      <p className="col-span-4 text-xs text-muted-foreground text-center py-4">
                        На этот день нет доступного времени, попробуйте другую дату
                      </p>
                    ) : (
                      timeSlots.map((slot) => {
                        const isSelected = selectedSlot === slot.time;
                        const isUnavailable = !slot.available;
                        return (
                          <motion.button
                            key={slot.id}
                            whileTap={isUnavailable ? undefined : { scale: 0.95 }}
                            onClick={() => { if (!isUnavailable) setSelectedSlot(slot.time); }}
                            disabled={isUnavailable}
                            title={isUnavailable ? 'Занято' : undefined}
                            className={`py-2.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                              isUnavailable
                                ? 'bg-muted text-muted-foreground line-through cursor-not-allowed'
                                : isSelected
                                ? 'bg-primary text-accent-foreground glow-green-sm'
                                : 'glass text-foreground hover:bg-secondary'
                            }`}
                          >
                            {isUnavailable && <span className="text-[10px]">🔒</span>}
                            {slot.time}
                          </motion.button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Fixed CTA */}
          <div className="fixed bottom-0 left-0 right-0 px-4 py-3 glass-strong z-40" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)' }}>
            {allStepsDone && summaryParts.length > 0 && (
              <p className="text-[11px] text-muted-foreground text-center mb-2 truncate">
                {summaryParts.join(' · ')}
              </p>
            )}
            <motion.button whileTap={allStepsDone ? { scale: 0.98 } : undefined} onClick={handleBook} disabled={!allStepsDone}
              className={`w-full py-3.5 rounded-lg font-semibold text-sm transition-all ${
                allStepsDone ? 'bg-primary text-accent-foreground glow-green' : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}>{ctaLabel}</motion.button>
          </div>
        </>
      )}
      {isBookable && !isCafe && !location.verified && (
        <div className="px-4 mt-6">
          <div className="glass rounded-lg p-4 flex flex-col items-center gap-3">
            {location.phone && (
              <motion.a
                whileTap={{ scale: 0.97 }}
                href={`tel:${location.phone}`}
                className="w-full py-3.5 rounded-lg bg-primary text-accent-foreground font-semibold text-sm text-center flex items-center justify-center gap-2 glow-green"
              >
                📞 Позвонить
              </motion.a>
            )}
            <p className="text-xs text-muted-foreground text-center">⏳ Онлайн-запись скоро появится в этом заведении</p>
          </div>
        </div>
      )}
      {!isDesktop && <BottomNav />}
    </div>
  );
};

export default ServiceDetail;
