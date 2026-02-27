import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Star, Clock, MapPin, Users, Check, ChevronRight, Navigation, Copy,
} from 'lucide-react';
import { services, staff, generateTimeSlots, formatPrice, openDirections, copyAddress } from '@/lib/mock-data';
import BottomNav from '@/components/BottomNav';
import DateChip from '@/components/DateChip';
import { useToast } from '@/hooks/use-toast';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const service = services.find((s) => s.id === id);

  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [seats, setSeats] = useState(1);

  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const isTour = service?.category === 'tour';

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

  const handleBook = () => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred('medium');
    navigate('/booking-confirm', {
      state: {
        service,
        date: dates[selectedDate],
        time: selectedSlot,
        staff: selectedStaff,
        seats: isTour ? seats : 1,
      },
    });
  };

  const handleCopyAddress = () => {
    copyAddress(fullAddress);
    toast({ title: 'Адрес скопирован', description: fullAddress });
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Hero */}
      <div className="relative h-48 bg-secondary flex items-center justify-center text-5xl">
        {isTour ? '🏔️' : '✂️'}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 glass rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* Info */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="glass rounded-lg p-4">
          <h1 className="text-lg font-bold font-display text-foreground">
            {service.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {service.businessName}
          </p>

          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
              {service.rating} ({service.reviewCount})
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {service.duration} мин
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {service.city}
            </span>
          </div>

          {/* Address with copy */}
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="flex-1">{fullAddress}</span>
            <button onClick={handleCopyAddress} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-gradient-green">
              {formatPrice(service.price)} {service.currency}
            </span>
            {isTour && (
              <span className="flex items-center gap-1 text-xs text-primary bg-green-soft/30 px-2 py-1 rounded-md">
                <Users className="w-3 h-3" />
                {service.seatsLeft}/{service.maxCapacity} мест
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Directions button */}
      <div className="px-4 mt-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => openDirections(lat, lng, fullAddress)}
          className="w-full glass rounded-lg p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
            <Navigation className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">Проложить маршрут</p>
            <p className="text-xs text-muted-foreground">Яндекс Карты · Google Maps · 2GIS</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.button>
      </div>

      {/* Tour extras */}
      {isTour && service.whatsIncluded && (
        <div className="px-4 mt-4">
          <div className="glass rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Что включено</h3>
            <div className="space-y-1.5">
              {service.whatsIncluded.map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-primary" />
                  {item}
                </div>
              ))}
            </div>
            {service.meetingPoint && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  Место встречи: {service.meetingPoint.address}
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
              <button
                onClick={() => setSeats(Math.max(1, seats - 1))}
                className="w-9 h-9 rounded-lg bg-secondary text-foreground font-bold text-lg flex items-center justify-center"
              >
                −
              </button>
              <span className="text-lg font-bold text-foreground w-8 text-center">{seats}</span>
              <button
                onClick={() => setSeats(Math.min(service.seatsLeft || 1, seats + 1))}
                className="w-9 h-9 rounded-lg bg-primary text-accent-foreground font-bold text-lg flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Picker */}
      <div className="px-4 mt-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Выберите дату</h3>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
          {dates.map((date, i) => (
            <DateChip
              key={i}
              date={date}
              active={selectedDate === i}
              onClick={() => setSelectedDate(i)}
            />
          ))}
        </div>
      </div>

      {/* Time Slots */}
      <div className="px-4 mt-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Выберите время</h3>
        <div className="grid grid-cols-4 gap-2">
          {timeSlots.map((slot) => (
            <motion.button
              key={slot.id}
              whileTap={{ scale: 0.95 }}
              disabled={!slot.available}
              onClick={() => setSelectedSlot(slot.time)}
              className={`py-2.5 rounded-md text-xs font-medium transition-colors ${
                selectedSlot === slot.time
                  ? 'bg-primary text-accent-foreground glow-green-sm'
                  : slot.available
                  ? 'glass text-foreground hover:bg-secondary'
                  : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
              }`}
            >
              {slot.time}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Staff */}
      {!isTour && (
        <div className="px-4 mt-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Выберите специалиста</h3>
          <div className="space-y-2">
            {staff.map((s) => (
              <motion.button
                key={s.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedStaff(s.id)}
                className={`w-full glass rounded-lg p-3 flex items-center gap-3 transition-colors ${
                  selectedStaff === s.id ? 'ring-1 ring-primary glow-green-sm' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-foreground">
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.role}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 text-primary fill-primary" />
                  {s.rating}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Book Button */}
      <div className="fixed bottom-16 left-0 right-0 px-4 py-3 glass-strong z-40">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleBook}
          disabled={!selectedSlot}
          className={`w-full py-3.5 rounded-lg font-semibold text-sm transition-all ${
            selectedSlot
              ? 'bg-primary text-accent-foreground glow-green'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {isTour
            ? `Забронировать ${seats} ${seats === 1 ? 'место' : seats < 5 ? 'места' : 'мест'} · ${formatPrice(service.price * seats)} ${service.currency}`
            : `Записаться · ${formatPrice(service.price)} ${service.currency}`}
        </motion.button>
      </div>

      <BottomNav />
    </div>
  );
};

export default ServiceDetail;
