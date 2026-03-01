import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Clock, MapPin, Users, Check, ChevronRight, Navigation, Copy, Phone, Share2, MessageCircle, Send } from 'lucide-react';
import { formatPrice, openDirections, copyAddress, categoryEmoji } from '@/lib/types';
import type { LocationItem } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import DateChip from '@/components/DateChip';
import { useToast } from '@/hooks/use-toast';

const mockReviews = [
  { id: '1', author: 'Алишер М.', rating: 5, text: 'Отличный сервис! Очень доволен результатом.', date: '2 дня назад' },
  { id: '2', author: 'Нигора К.', rating: 4, text: 'Хорошее место, рекомендую. Персонал вежливый.', date: '1 неделю назад' },
  { id: '3', author: 'Тимур Р.', rating: 5, text: 'Быстро, качественно, буду обращаться снова.', date: '2 недели назад' },
];

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [location, setLocation] = useState<LocationItem | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const { data: loc } = await supabase.from('locations').select('*').eq('id', id).single();
      if (loc) {
        setLocation(loc as LocationItem);
        const [svcRes, staffRes] = await Promise.all([
          supabase.from('services').select('*').eq('location_id', id),
          supabase.from('staff').select('*').eq('location_id', id),
        ]);
        setServices(svcRes.data || []);
        setStaffList(staffRes.data || []);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const timeSlots = useMemo(() => {
    const slots: { id: string; time: string; available: boolean }[] = [];
    for (let h = 9; h <= 20; h++) {
      for (const m of ['00', '30']) {
        const time = `${h.toString().padStart(2, '0')}:${m}`;
        slots.push({ id: `slot-${time}`, time, available: Math.random() > 0.3 });
      }
    }
    return slots;
  }, []);

  const isBookable = location ? ['beauty', 'medical', 'tour', 'service'].includes(location.business_type) : false;

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

  return (
    <div className="min-h-screen bg-background pb-32 overflow-y-auto">
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

      <div className="px-4 -mt-6 relative z-10">
        <div className="glass rounded-lg p-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold font-display text-foreground">{location.name}</h1>
            {location.verified && <span className="inline-flex items-center gap-0.5 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">✓ Verified</span>}
          </div>
          {location.description && <p className="text-sm text-muted-foreground mt-1">{location.description}</p>}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-primary fill-primary" />{location.rating} ({location.review_count})</span>
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

      <div className="px-4 mt-4 grid grid-cols-4 gap-2">
        {location.telegram && (
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => window.open(`https://t.me/${location.telegram}`, '_blank')}
            className="glass rounded-xl py-3 flex flex-col items-center gap-1.5 ring-1 ring-[#2AABEE]/30">
            <Send className="w-5 h-5 text-[#2AABEE]" /><span className="text-[10px] font-medium text-foreground">Telegram</span>
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

      {/* Services list */}
      {services.length > 0 && (
        <div className="px-4 mt-4">
          <div className="glass rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Услуги</h3>
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
        </div>
      )}

      {/* Reviews */}
      <div className="px-4 mt-4">
        <div className="glass rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Отзывы</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
              <span className="font-medium text-foreground">{location.rating}</span>
              <span>· {location.review_count} отзывов</span>
            </div>
          </div>
          <div className="space-y-3">
            {mockReviews.map((review) => (
              <div key={review.id} className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{review.author}</span>
                  <span className="text-[10px] text-muted-foreground">{review.date}</span>
                </div>
                <div className="flex items-center gap-0.5 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-primary fill-primary' : 'text-muted'}`} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{review.text}</p>
              </div>
            ))}
          </div>
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowReviewForm(!showReviewForm)}
            className="w-full mt-4 py-3 rounded-lg glass text-sm font-medium text-foreground flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />Написать отзыв
          </motion.button>
        </div>
      </div>

      {/* Booking section */}
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
                <motion.button key={slot.id} whileTap={{ scale: 0.95 }} disabled={!slot.available} onClick={() => setSelectedSlot(slot.time)}
                  className={`py-2.5 rounded-md text-xs font-medium transition-colors ${
                    selectedSlot === slot.time ? 'bg-primary text-accent-foreground glow-green-sm'
                    : slot.available ? 'glass text-foreground hover:bg-secondary'
                    : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
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
                      <p className="text-xs text-muted-foreground">{(s.specialties || []).join(', ')}</p>
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
