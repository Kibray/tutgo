import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Calendar, Clock, MapPin, User, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/types';
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

    const insertData = {
      location_id: location.id,
      service_id: service?.id || null,
      staff_id: staffId || null,
      client_user_id: user.id,
      client_name: user.user_metadata?.display_name || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'pending',
    };

    const { data, error } = await supabase.from('appointments').insert(insertData).select();

    setSaving(false);
    if (error) {
      toast({ title: 'Ошибка при создании записи', description: error.message, variant: 'destructive' });
      toast({ title: t('common.error'), description: error.message.includes('Double booking') ? t('booking.time_taken') : error.message, variant: 'destructive' });
    } else {
      setConfirmed(true);
      toast({ title: t('booking.created') });
    }
  };

  if (confirmed) {
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
        </motion.div>

        <div className="flex gap-3 mt-8 w-full max-w-sm">
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate('/bookings')}
            className="flex-1 py-3.5 glass rounded-lg font-semibold text-sm text-foreground">{t('booking.my_bookings')}</motion.button>
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate('/')}
            className="flex-1 py-3.5 bg-primary text-accent-foreground rounded-lg font-semibold text-sm glow-green">{t('booking.to_home')}</motion.button>
        </div>
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
