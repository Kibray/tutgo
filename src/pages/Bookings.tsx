import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, ChevronRight, Star, Loader2, Heart, X, AlertTriangle } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import ServiceCard from '@/components/ServiceCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { usePreferences } from '@/hooks/usePreferences';
import { formatPrice } from '@/lib/types';
import type { LocationItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const Bookings = () => {
  const { user } = useAuth();
  const isDesktop = useIsDesktop();
  const { toast } = useToast();
  const { t, lang } = usePreferences();
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [favoriteLocations, setFavoriteLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [favLoading, setFavLoading] = useState(false);
  const [reviewingAppointment, setReviewingAppointment] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchAppointments = async () => {
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('appointments')
      .select('*, locations(*), services(*), staff(*)')
      .eq('client_user_id', user.id)
      .order('start_time', { ascending: true });
    if (error) toast({ title: 'Ошибка загрузки записей', description: error.message, variant: 'destructive' });
    setAppointments(data || []);
    setLoading(false);

    if (data && data.length > 0) {
      const ids = data.map((a: any) => a.id);
      const { data: reviews } = await supabase
        .from('reviews')
        .select('appointment_id')
        .in('appointment_id', ids);
      if (reviews) setReviewedIds(new Set(reviews.map((r: any) => r.appointment_id)));
    }
  };

  useEffect(() => {
    const fetchFavLocations = async () => {
      if (favoriteIds.size === 0) { setFavoriteLocations([]); return; }
      setFavLoading(true);
      const { data } = await supabase
        .from('locations')
        .select('*')
        .in('id', Array.from(favoriteIds));
      setFavoriteLocations((data as LocationItem[]) || []);
      setFavLoading(false);
    };
    fetchFavLocations();
  }, [favoriteIds]);

  useEffect(() => { fetchAppointments(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('my-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `client_user_id=eq.${user.id}` },
        () => fetchAppointments()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleSubmitReview = async (appointmentId: string, locationId: string) => {
    if (!user) return;
    setSubmittingReview(true);
    const { error } = await supabase.from('reviews').insert({
      appointment_id: appointmentId,
      location_id: locationId,
      user_id: user.id,
      rating: reviewRating,
      comment: reviewComment || null,
      staff_id: reviewingAppointment?.staff_id || null,
    });
    setSubmittingReview(false);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('bookings.thanks_review') });
      setReviewedIds(prev => new Set([...prev, appointmentId]));
      setReviewingAppointment(null);
      setReviewComment('');
      setReviewRating(5);
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('location_id', locationId);
      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await supabase
          .from('locations')
          .update({ rating: Math.round(avg * 10) / 10 })
          .eq('id', locationId);
      }
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    setCancelling(true);
    const apt = appointments.find(a => a.id === appointmentId);
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId)
      .eq('client_user_id', user?.id);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ Запись отменена' });
      if (apt) {
        supabase.functions.invoke('telegram-notify', {
          body: { type: 'appointment.cancelled_by_client', record: apt },
        }).catch(() => {});
      }
      await fetchAppointments();
    }
    setCancelling(false);
    setCancelConfirmId(null);
  };

  const dateFmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(d).toLocaleDateString(lang === 'uz' ? 'uz' : lang === 'en' ? 'en' : 'ru', opts);
  const timeFmt = (d: string) =>
    new Date(d).toLocaleTimeString(lang === 'uz' ? 'uz' : lang === 'en' ? 'en' : 'ru', { hour: '2-digit', minute: '2-digit' });

  const upcoming = appointments.filter(a => new Date(a.start_time) >= new Date() && a.status !== 'cancelled' && a.status !== 'completed');
  const past = appointments.filter(a =>
    new Date(a.start_time) < new Date() ||
    a.status === 'completed' ||
    a.status === 'cancelled'
  );

  const STATUS_LABELS: Record<string, string> = {
    pending: 'Ожидает',
    confirmed: 'Подтверждена',
    cancelled: 'Отменена',
    completed: 'Завершена',
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <h1 className="text-lg font-bold font-display text-foreground mb-1">{t('bookings.title')}</h1>
        <p className="text-xs text-muted-foreground mb-4">{t('bookings.subtitle')}</p>

        {!user && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-2">Войдите чтобы видеть записи</p>
            <p className="text-xs text-muted-foreground mb-6">Здесь будут все ваши бронирования</p>
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
            >
              Войти
            </button>
          </div>
        )}

        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="bookings" className="flex-1 text-xs">{t('bookings.my_bookings')}</TabsTrigger>
            <TabsTrigger value="favorites" className="flex-1 text-xs">
              <Heart className="w-3.5 h-3.5 mr-1" />{t('nav.favorites')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <h2 className="text-sm font-semibold text-foreground mb-3">{t('bookings.upcoming')}</h2>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">{t('common.loading')}</div>
            ) : upcoming.length === 0 ? (
              <div className="glass rounded-lg p-6 text-center mb-6">
                <p className="text-xs text-muted-foreground">{t('bookings.no_upcoming')}</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {upcoming.map((b, i) => (
                  <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className="glass rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{b.services?.name || b.locations?.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{b.locations?.name}</p>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-primary/15 text-primary capitalize">{STATUS_LABELS[b.status] || b.status}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{dateFmt(b.start_time, { month: 'short', day: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeFmt(b.start_time)}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.locations?.city}</span>
                    </div>
                    {b.services?.price > 0 && (
                      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                        <span className="text-sm font-bold text-gradient-green">{formatPrice(b.services.price)} {b.services.currency}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setCancelConfirmId(b.id); }}
                      className="mt-3 pt-3 border-t border-border w-full flex items-center justify-center gap-1.5 text-xs text-destructive font-medium"
                    >
                      <X className="w-3.5 h-3.5" />Отменить запись
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            <h2 className="text-sm font-semibold text-foreground mb-3">{t('bookings.past')}</h2>
            {past.length === 0 ? (
              <div className="glass rounded-lg p-6 text-center">
                <p className="text-xs text-muted-foreground">{t('bookings.no_past')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {past.map((b) => (
                  <div key={b.id} className="glass rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{b.services?.name || b.locations?.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{dateFmt(b.start_time, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-muted text-muted-foreground capitalize">{STATUS_LABELS[b.status] || b.status}</span>
                    </div>
                    {(b.status === 'completed' || new Date(b.end_time) < new Date()) && b.status !== 'cancelled' && !reviewedIds.has(b.id) && (
                      <button onClick={() => { setReviewingAppointment(b); setReviewRating(5); setReviewComment(''); }}
                        className="mt-3 pt-3 border-t border-border w-full flex items-center justify-center gap-2 text-xs text-primary font-medium">
                        <Star className="w-3.5 h-3.5" />{t('detail.leave_review')}
                      </button>
                    )}
                    {reviewedIds.has(b.id) && (
                      <p className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground text-center">{t('bookings.review_sent')}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites">
            {favLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">{t('common.loading')}</div>
            ) : favoriteLocations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-5xl mb-4">❤️</div>
                <p className="text-sm text-muted-foreground max-w-[240px] leading-relaxed">
                  {t('bookings.fav_empty')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {favoriteLocations.map((loc, i) => (
                  <ServiceCard
                    key={loc.id}
                    service={loc}
                    index={i}
                    isFavorite={true}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewingAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setReviewingAppointment(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl p-5 mx-4 w-full max-w-sm shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground">{t('detail.leave_review')}</h3>
                <button onClick={() => setReviewingAppointment(null)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                {reviewingAppointment.services?.name || reviewingAppointment.locations?.name}
                {' · '}
                {dateFmt(reviewingAppointment.start_time, { day: 'numeric', month: 'short' })}
              </p>

              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setReviewRating(star)} className="p-1">
                    <Star className={`w-8 h-8 transition-colors ${star <= reviewRating ? 'text-primary fill-primary' : 'text-muted'}`} />
                  </button>
                ))}
              </div>

              <textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder={t('bookings.review_placeholder')}
                className="w-full bg-secondary rounded-xl p-3 text-sm text-foreground resize-none h-24 border border-border focus:border-primary outline-none mb-4"
              />

              <div className="flex gap-2">
                <button onClick={() => setReviewingAppointment(null)} className="flex-1 py-2.5 text-sm glass rounded-xl text-muted-foreground font-medium">{t('common.cancel')}</button>
                <button
                  onClick={() => handleSubmitReview(reviewingAppointment.id, reviewingAppointment.location_id)}
                  disabled={submittingReview}
                  className="flex-1 py-2.5 text-sm bg-primary text-accent-foreground rounded-xl font-semibold flex items-center justify-center gap-1"
                >
                  {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : t('bookings.send')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cancelConfirmId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => !cancelling && setCancelConfirmId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl p-5 mx-4 w-full max-w-sm shadow-xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Отменить запись?</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Бизнес получит уведомление об отмене</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setCancelConfirmId(null)} disabled={cancelling}
                  className="flex-1 py-2.5 text-sm glass rounded-xl text-muted-foreground font-medium">
                  Назад
                </button>
                <button onClick={() => handleCancelAppointment(cancelConfirmId)} disabled={cancelling}
                  className="flex-1 py-2.5 text-sm bg-destructive text-destructive-foreground rounded-xl font-semibold flex items-center justify-center gap-1">
                  {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Да, отменить'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isDesktop && <BottomNav />}
    </div>
  );
};

export default Bookings;
