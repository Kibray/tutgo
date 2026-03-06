import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, ChevronRight, Star, Loader2, Heart, X } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import ServiceCard from '@/components/ServiceCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { formatPrice } from '@/lib/types';
import type { LocationItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const Bookings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [favoriteLocations, setFavoriteLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [favLoading, setFavLoading] = useState(false);
  const [reviewingAppointment, setReviewingAppointment] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  const fetchAppointments = async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('appointments')
      .select('*, locations(*), services(*), staff(*)')
      .eq('client_user_id', user.id)
      .order('start_time', { ascending: true });
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

  // Fetch favorite locations
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
    });
    setSubmittingReview(false);
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Спасибо за отзыв!' });
      setReviewedIds(prev => new Set([...prev, appointmentId]));
      setReviewingId(null);
      setReviewComment('');
      setReviewRating(5);
    }
  };

  const upcoming = appointments.filter(a => new Date(a.start_time) >= new Date() && a.status !== 'cancelled' && a.status !== 'completed');
  const past = appointments.filter(a => new Date(a.start_time) < new Date() || a.status === 'completed');

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <h1 className="text-lg font-bold font-display text-foreground mb-1">Личный кабинет</h1>
        <p className="text-xs text-muted-foreground mb-4">Записи и избранное</p>

        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="bookings" className="flex-1 text-xs">Мои записи</TabsTrigger>
            <TabsTrigger value="favorites" className="flex-1 text-xs">
              <Heart className="w-3.5 h-3.5 mr-1" />Избранное
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <h2 className="text-sm font-semibold text-foreground mb-3">Предстоящие</h2>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Загрузка...</div>
            ) : upcoming.length === 0 ? (
              <div className="glass rounded-lg p-6 text-center mb-6">
                <p className="text-xs text-muted-foreground">Нет предстоящих записей</p>
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
                      <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-primary/15 text-primary capitalize">{b.status}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(b.start_time).toLocaleDateString('ru', { month: 'short', day: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(b.start_time).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.locations?.city}</span>
                    </div>
                    {b.services?.price > 0 && (
                      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                        <span className="text-sm font-bold text-gradient-green">{formatPrice(b.services.price)} {b.services.currency}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            <h2 className="text-sm font-semibold text-foreground mb-3">Прошедшие</h2>
            {past.length === 0 ? (
              <div className="glass rounded-lg p-6 text-center">
                <p className="text-xs text-muted-foreground">Прошедших записей пока нет</p>
              </div>
            ) : (
              <div className="space-y-3">
                {past.map((b) => (
                  <div key={b.id} className="glass rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{b.services?.name || b.locations?.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(b.start_time).toLocaleDateString('ru')}</p>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-muted text-muted-foreground capitalize">{b.status}</span>
                    </div>
                    {(b.status === 'completed' || new Date(b.end_time) < new Date()) && !reviewedIds.has(b.id) && (
                      <button onClick={() => { setReviewingAppointment(b); setReviewRating(5); setReviewComment(''); }}
                        className="mt-3 pt-3 border-t border-border w-full flex items-center justify-center gap-2 text-xs text-primary font-medium">
                        <Star className="w-3.5 h-3.5" />Оставить отзыв
                      </button>
                    )}
                    {reviewedIds.has(b.id) && (
                      <p className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground text-center">✓ Отзыв оставлен</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites">
            {favLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Загрузка...</div>
            ) : favoriteLocations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-5xl mb-4">❤️</div>
                <p className="text-sm text-muted-foreground max-w-[240px] leading-relaxed">
                  Сохраняй понравившиеся места чтобы быстро найти их снова
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
      <BottomNav />
    </div>
  );
};

export default Bookings;
