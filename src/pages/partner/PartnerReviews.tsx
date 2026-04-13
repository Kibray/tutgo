import { useState, useEffect, useMemo } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import PartnerLayout from '@/components/partner/PartnerLayout';

const PartnerReviews = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: locs } = await supabase
        .from('locations').select('id, name').eq('owner_id', user.id);
      const locList = locs || [];
      setLocations(locList);
      const locIds = locList.map(l => l.id);
      if (!locIds.length) { setLoading(false); return; }

      const { data } = await supabase
        .from('reviews')
        .select('*')
        .in('location_id', locIds)
        .order('created_at', { ascending: false });
      setReviews(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const locMap = useMemo(() => {
    const m: Record<string, string> = {};
    locations.forEach(l => { m[l.id] = l.name; });
    return m;
  }, [locations]);

  const totalReviews = reviews.length;
  const avgRating = totalReviews ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1) : '—';
  const fiveStarCount = reviews.filter(r => r.rating === 5).length;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <PartnerLayout title="Отзывы">
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
            <Star className="w-10 h-10 text-muted-foreground" />
            <p className="text-foreground font-medium">Отзывов пока нет</p>
            <p className="text-sm text-muted-foreground">Они появятся после того как клиенты оставят оценки</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Всего отзывов', value: totalReviews },
                { label: 'Средний рейтинг', value: avgRating },
                { label: '5 звёзд', value: fiveStarCount },
              ].map((card) => (
                <div key={card.label} className="bg-card rounded-xl border border-border p-4 text-center space-y-1">
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-card rounded-xl border border-border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-foreground/80">{review.comment}</p>
                  )}
                  {locations.length > 1 && (
                    <p className="text-xs text-muted-foreground">{locMap[review.location_id] || ''}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PartnerLayout>
  );
};

export default PartnerReviews;
