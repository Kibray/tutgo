import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Star, Clock, MapPin, Users, Check, ChevronRight, Navigation, Copy, Phone, Share2, MessageCircle, Send,
} from 'lucide-react';
import { services, staff, generateTimeSlots, formatPrice, openDirections, copyAddress } from '@/lib/mock-data';
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
  const service = services.find((s) => s.id === id);

  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [seats, setSeats] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const isTour = service?.category === 'tour';
  const isBookable = service ? (service.bookable !== false && ['beauty', 'medical', 'tour', 'service'].includes(service.category)) : true;

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Услуга не найдена
      </div>
    );
  }

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const fullAddress = `${service.address}, ${service.city}`;
  const lat = service.meetingPoint?.lat || service.lat || 41.3111;
  const lng = service.meetingPoint?.lng || service.lng || 69.2797;
  const categoryEmoji: Record<string, string> = { tour: '🏔️', beauty: '✨', cafe: '☕️', retail: '🛍️', service: '🛠️', medical: '🏥' };

  const handleBook = () => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred('medium');
    navigate('/booking-confirm', {
      state: { service, date: dates[selectedDate], time: selectedSlot, staff: selectedStaff, seats: isTour ? seats : 1 },
    });
  };

  const handleCopyAddress = () => {
    copyAddress(fullAddress);
    toast({ title: 'Адрес скопирован', description: fullAddress });
  };

  const handleShare = () => {
    const tg = (window as any).Telegram?.WebApp;
    const text = `${service.name} — ${service.businessName}\n${fullAddress}\n${service.price > 0 ? `${formatPrice(service.price)} ${service.currency}` : ''}`;
    if (tg?.switchInlineQuery) {
      tg.switchInlineQuery(text);
    } else if (navigator.share) {
      navigator.share({ title: service.name, text });
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: 'Скопировано для отправки' });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32 overflow-y-auto">
      {/* Hero / Photo Gallery */}
      <div className="relative h-56 bg-secondary flex items-center justify-center">
        <div className="flex gap-1 w-full h-full">
          <div className="flex-1 bg-secondary flex items-center justify-center text-5xl">
            {categoryEmoji[service.category] || '📍'}
          </div>
          <div className="w-1/3 flex flex-col gap-1">
            <div className="flex-1 bg-muted flex items-center justify-center text-2xl opacity-60">📷</div>
            <div className="flex-1 bg-muted flex items-center justify-center text-2xl opacity-60">📷</div>
          </div>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 glass rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <span className="absolute bottom-3 right-3 text-xs glass rounded-full px-3 py-1 text-muted-foreground">
          1 / 3
        </span>
      </div>

      {/* Info */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="glass rounded-lg p-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold font-display text-foreground">{service.name}</h1>
            {service.verified && (
              <span className="inline-flex items-center gap-0.5 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">✓ Verified</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{service.businessName}</p>

          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-primary fill-primary" />{service.rating} ({service.reviewCount})</span>
            {service.duration > 0 && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{service.duration} мин</span>}
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{service.city}</span>
          </div>

          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="flex-1">{fullAddress}</span>
            <button onClick={handleCopyAddress} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-gradient-green">{formatPrice(service.price)} {service.currency}</span>
            {isTour && (
              <span className="flex items-center gap-1 text-xs text-primary bg-green-soft/30 px-2 py-1 rounded-md">
                <Users className="w-3 h-3" />{service.seatsLeft}/{service.maxCapacity} мест
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="px-4 mt-4 grid grid-cols-4 gap-2">
        {/* Telegram — primary contact */}
        {service.telegram && (
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
            const tg = (window as any).Telegram?.WebApp;
            tg?.HapticFeedback?.impactOccurred('light');
            window.open(`https://t.me/${service.telegram}`, '_blank');
          }}
            className="glass rounded-xl py-3 flex flex-col items-center gap-1.5 ring-1 ring-[#2AABEE]/30">
            <Send className="w-5 h-5 text-[#2AABEE]" />
            <span className="text-[10px] font-medium text-foreground">Telegram</span>
          </motion.button>
        )}
        {service.phone && (
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => window.open(`tel:${service.phone}`)}
            className="glass rounded-xl py-3 flex flex-col items-center gap-1.5">
            <Phone className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-medium text-foreground">Позвонить</span>
          </motion.button>
        )}
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => openDirections(lat, lng, fullAddress)}
          className="glass rounded-xl py-3 flex flex-col items-center gap-1.5">
          <Navigation className="w-5 h-5 text-primary" />
          <span className="text-[10px] font-medium text-foreground">Маршрут</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleShare}
          className="glass rounded-xl py-3 flex flex-col items-center gap-1.5">
          <Share2 className="w-5 h-5 text-primary" />
          <span className="text-[10px] font-medium text-foreground">Поделиться</span>
        </motion.button>
        {service.website && (
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => window.open(service.website, '_blank')}
            className="glass rounded-xl py-3 flex flex-col items-center gap-1.5">
            <span className="text-lg">🌐</span>
            <span className="text-[10px] font-medium text-foreground">Сайт</span>
          </motion.button>
        )}
      </div>

      {/* Tour extras */}
      {isTour && service.whatsIncluded && (
        <div className="px-4 mt-4">
          <div className="glass rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Что включено</h3>
            <div className="space-y-1.5">
              {service.whatsIncluded.map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-primary" />{item}
                </div>
              ))}
            </div>
            {service.meetingPoint && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />Место встречи: {service.meetingPoint.address}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tour seats */}
      {isTour && (
        <div className="px-4 mt-4">
          <div className="glass rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Количество мест</h3>
            <div className="flex items-center gap-4">
              <button onClick={() => setSeats(Math.max(1, seats - 1))}
                className="w-9 h-9 rounded-lg bg-secondary text-foreground font-bold text-lg flex items-center justify-center">−</button>
              <span className="text-lg font-bold text-foreground w-8 text-center">{seats}</span>
              <button onClick={() => setSeats(Math.min(service.seatsLeft || 1, seats + 1))}
                className="w-9 h-9 rounded-lg bg-primary text-accent-foreground font-bold text-lg flex items-center justify-center">+</button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="px-4 mt-4">
        <div className="glass rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Отзывы</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
              <span className="font-medium text-foreground">{service.rating}</span>
              <span>· {service.reviewCount} отзывов</span>
            </div>
          </div>

          {/* Star breakdown */}
          <div className="space-y-1 mb-4">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-3">{star}</span>
                <Star className="w-3 h-3 text-primary fill-primary" />
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${star === 5 ? 70 : star === 4 ? 20 : star === 3 ? 7 : star === 2 ? 3 : 1}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Reviews list */}
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

          {/* Write review button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="w-full mt-4 py-3 rounded-lg glass text-sm font-medium text-foreground flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4 text-primary" />
            Написать отзыв
          </motion.button>

          {showReviewForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-muted cursor-pointer hover:text-primary hover:fill-primary transition-colors" />
                ))}
              </div>
              <textarea
                placeholder="Расскажите о вашем опыте..."
                className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors min-h-[80px] resize-none"
              />
              <button className="w-full py-2.5 rounded-lg bg-primary text-accent-foreground text-sm font-medium">
                Отправить
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Booking section */}
      {isBookable && (
        <>
          <div className="px-4 mt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Выберите дату</h3>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
              {dates.map((date, i) => (
                <DateChip key={i} date={date} active={selectedDate === i} onClick={() => setSelectedDate(i)} />
              ))}
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

          {!isTour && (
            <div className="px-4 mt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Выберите специалиста</h3>
              <div className="space-y-2">
                {staff.map((s) => (
                  <motion.button key={s.id} whileTap={{ scale: 0.98 }} onClick={() => setSelectedStaff(s.id)}
                    className={`w-full glass rounded-lg p-3 flex items-center gap-3 transition-colors ${selectedStaff === s.id ? 'ring-1 ring-primary glow-green-sm' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-foreground">{s.name.charAt(0)}</div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.role}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><Star className="w-3 h-3 text-primary fill-primary" />{s.rating}</div>
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
              }`}>
              {isTour
                ? `Забронировать ${seats} ${seats === 1 ? 'место' : seats < 5 ? 'места' : 'мест'} · ${formatPrice(service.price * seats)} ${service.currency}`
                : `Записаться · ${formatPrice(service.price)} ${service.currency}`}
            </motion.button>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
};

export default ServiceDetail;
