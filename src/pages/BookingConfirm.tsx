import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Calendar, Clock, MapPin, User, Loader2, CalendarDays, Share2, Navigation } from 'lucide-react';
import { formatPrice, openDirections } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { useToast } from '@/hooks/use-toast';

const BookingConfirm = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as any;
  const { user } = useAuth();
  const { t, lang } = usePreferences();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!confirmed || !state?.date) return;
    const [hours, minutes] = (time || '00:00').split(':').map(Number);
    const startCal = new Date(date);
    startCal.setHours(hours, minutes, 0, 0);

    const update = () => {
      const diff = startCal.getTime() - Date.now();
      if (diff <= 0) { setCountdown(''); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      setCountdown(days > 0 ? `До записи ${days} дн. ${hours} ч.` : `До записи ${hours} ч.`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [confirmed]);

  const locale = lang === 'uz' ? 'uz' : lang === 'en' ? 'en' : 'ru';

  if (!state?.location) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>{t('booking.no_data')}</p>
          <button onClick={() => navigate('/')} className="text-primary mt-2 text-sm">{t('booking.to_home')}</button>
        </div>
      </div>
    );
  }

  const { location, service, date, time, staffId, staffList } = state;
  const staffMember = staffList?.find((s: any) => s.id === staffId);
  const d = new Date(date);

  const handleConfirm = async () => {
    if (!user) {
      toast({ title: t('common.error'), description: 'Необходимо войти в аккаунт для бронирования', variant: 'destructive' });
      navigate('/auth');
      return;
    }
    if (!time) {
      toast({ title: t('common.error'), description: 'Время не выбрано', variant: 'destructive' });
      return;
    }
    setSaving(true);

    const [hours, minutes] = time.split(':').map(Number);
    const startTime = new Date(d);
    startTime.setHours(hours, minutes, 0, 0);
    const durationMin = service?.duration_minutes || 60;
    const endTime = new Date(startTime.getTime() + durationMin * 60000);

    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('user_id', user.id)
      .single();

    const insertData = {
      location_id: location.id,
      service_id: (service?.price_per_hour !== undefined || service?.sport_type !== undefined)
        ? null
        : (service?.id || null),
      staff_id: staffId || null,
      client_user_id: user.id,
      client_name: user.user_metadata?.display_name || null,
      client_phone: profile?.phone || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'pending',
    };

    const { data, error } = await supabase.from('appointments').insert(insertData).select();

    setSaving(false);
    if (error) {
      toast({ title: t('common.error'), description: error.message.includes('Double booking') ? t('booking.time_taken') : error.message, variant: 'destructive' });
    } else {
      setConfirmed(true);
      toast({ title: t('booking.created') });
    }
  };

  if (confirmed) {
    const [hours, minutes] = (time || '00:00').split(':').map(Number);
    const startCal = new Date(d);
    startCal.setHours(hours, minutes, 0, 0);
    const durationMin = service?.duration_minutes || 60;
    const endCal = new Date(startCal.getTime() + durationMin * 60000);
    const toCalDate = (dt: Date) => dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const fullAddress = `${location.address || ''}, ${location.city || ''}`.trim();
    const eventTitle = `${service?.name || location.name} в ${location.name}`;
    const dateStr = d.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' });
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${toCalDate(startCal)}/${toCalDate(endCal)}&location=${encodeURIComponent(fullAddress)}`;
    const shareText = `${service?.name || location.name} в ${location.name} — ${dateStr} в ${time}`;

    const handleAddCalendar = () => window.open(calendarUrl, '_blank');
    const handleRoute = () => {
      if (location.lat && location.lng) openDirections(location.lat, location.lng, fullAddress);
    };
    const handleShare = async () => {
      if (navigator.share) {
        try { await navigator.share({ text: shareText }); } catch {}
      } else {
        navigator.clipboard.writeText(shareText);
        toast({ title: t('booking.copied') });
      }
    };

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', duration: 0.5 }}
          className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center glow-green">
            <Check className="w-6 h-6 text-accent-foreground" />
          </div>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-xl font-bold font-display text-foreground text-center">{t('booking.confirmed')}</motion.h1>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass rounded-lg p-5 mt-6 w-full max-w-sm space-y-3">
          <h3 className="font-semibold text-foreground text-sm">{service?.name || location.name}</h3>
          <p className="text-xs text-muted-foreground">{location.name}</p>
          <div className="border-t border-border pt-3 space-y-2.5">
            <Row icon={Calendar} label={t('booking.date')} value={dateStr} />
            <Row icon={Clock} label={t('booking.time')} value={time} />
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs text-muted-foreground w-20">{t('booking.address')}</span>
              <span className="text-xs text-foreground font-medium flex-1 truncate">{fullAddress}</span>
              {location.lat && location.lng && (
                <button onClick={handleRoute} className="text-[10px] text-primary font-semibold whitespace-nowrap">{t('booking.route')}</button>
              )}
            </div>
            {staffMember && <Row icon={User} label={t('booking.specialist')} value={staffMember.full_name} />}
          </div>
          {service?.price > 0 && (
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('booking.total')}</span>
              <span className="text-lg font-bold text-gradient-green">{formatPrice(service.price)} {service.currency}</span>
            </div>
          )}
        </motion.div>

        {countdown && (
          <div className="mt-3 w-full max-w-sm px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-600 font-medium text-center">
            {countdown}
          </div>
        )}

        <div className="flex gap-2 mt-4 w-full max-w-sm">
          <motion.button whileTap={{ scale: 0.98 }} onClick={handleAddCalendar}
            className="flex-1 glass rounded-lg py-3 flex flex-col items-center gap-1 text-foreground">
            <CalendarDays className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-semibold">{t('booking.add_to_calendar')}</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowMap(true)} disabled={!location.lat || !location.lng}
            className="flex-1 glass rounded-lg py-3 flex flex-col items-center gap-1 text-foreground disabled:opacity-40">
            <Navigation className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-semibold">{t('booking.route')}</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.98 }} onClick={handleShare}
            className="flex-1 glass rounded-lg py-3 flex flex-col items-center gap-1 text-foreground">
            <Share2 className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-semibold">{t('booking.share')}</span>
          </motion.button>
        </div>

        <div className="flex gap-3 mt-4 w-full max-w-sm">
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate('/bookings')}
            className="flex-1 py-3.5 glass rounded-lg font-semibold text-sm text-foreground">{t('booking.my_bookings')}</motion.button>
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate('/')}
            className="flex-1 py-3.5 bg-primary text-accent-foreground rounded-lg font-semibold text-sm glow-green">{t('booking.to_home')}</motion.button>
        </div>
        {showMap && location.lat && location.lng && (
          <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowMap(false)}>
            <div className="w-full glass rounded-t-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
              <p className="text-sm font-semibold text-center">Открыть в...</p>
              {[
                { label: 'Google Maps', url: `https://maps.google.com/?q=${location.lat},${location.lng}` },
                { label: 'Яндекс Карты', url: `https://maps.yandex.ru/?pt=${location.lng},${location.lat}&z=16` },
                { label: '2GIS', url: `https://2gis.uz/search/${location.lat}%2C${location.lng}` },
              ].map(({ label, url }) => (
                <button key={label} onClick={() => window.open(url, '_blank')}
                  className="w-full py-3 glass rounded-lg text-sm font-medium">
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <h1 className="text-xl font-bold font-display text-foreground text-center mb-6">{t('booking.confirm_booking')}</h1>

      <div className="glass rounded-lg p-5 w-full max-w-sm space-y-3">
        <h3 className="font-semibold text-foreground text-sm">{service?.name || location.name}</h3>
        <p className="text-xs text-muted-foreground">{location.name}</p>
        <div className="border-t border-border pt-3 space-y-2.5">
          <Row icon={Calendar} label={t('booking.date')} value={d.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' })} />
          <Row icon={Clock} label={t('booking.time')} value={time} />
          <Row icon={MapPin} label={t('booking.address')} value={`${location.address || ''}, ${location.city || ''}`} />
          {staffMember && <Row icon={User} label={t('booking.specialist')} value={staffMember.full_name} />}
        </div>
        {service?.price > 0 && (
          <div className="border-t border-border pt-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('booking.total')}</span>
            <span className="text-lg font-bold text-gradient-green">{formatPrice(service.price)} {service.currency}</span>
          </div>
        )}
      </div>

      <div
        className="mt-4 w-full max-w-sm rounded-xl border p-3 flex gap-3"
        style={{ backgroundColor: '#FAEEDA', borderColor: '#FAC775' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#FAC775' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#633806" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold" style={{ color: '#633806' }}>{t('booking.fraud_title')}</p>
          <p className="text-[11px] font-medium mt-1 leading-snug" style={{ color: '#8a5a1f' }}>{t('booking.fraud_body')}</p>
        </div>
      </div>

      <motion.button whileTap={{ scale: 0.98 }} onClick={handleConfirm} disabled={saving || !user}
        className="mt-8 w-full max-w-sm py-3.5 bg-primary text-accent-foreground rounded-lg font-semibold text-sm glow-green disabled:opacity-50 flex items-center justify-center gap-2">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" />{t('booking.saving')}</> : t('booking.confirm_booking')}
      </motion.button>

      {!user && <p className="text-xs text-destructive mt-3">{t('booking.login_required')}</p>}
    </div>
  );
};

const Row = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-center gap-3">
    <Icon className="w-4 h-4 text-primary flex-shrink-0" />
    <span className="text-xs text-muted-foreground w-20">{label}</span>
    <span className="text-xs text-foreground font-medium">{value}</span>
  </div>
);

export default BookingConfirm;
