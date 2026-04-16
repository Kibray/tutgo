import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { useToast } from '@/hooks/use-toast';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';

const Reviews = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = usePreferences();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, locations(name, business_type, branded_icon_url, gallery)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) console.error('Reviews fetch error', error);
      setReviews(data || []);
      setLoading(false);
    };
    fetchReviews();
  }, [user, authLoading]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const getPhoto = (loc: any) => {
    if (loc?.branded_icon_url) return loc.branded_icon_url;
    if (loc?.gallery?.length) return loc.gallery[0];
    return null;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Мои отзывы</h1>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading || authLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <Star className="w-10 h-10 text-muted-foreground" />
            <p className="text-foreground font-medium">Войдите чтобы видеть свои отзывы</p>
            <Button onClick={() => navigate('/auth')} size="sm">Войти</Button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
            <Star className="w-10 h-10 text-muted-foreground" />
            <p className="text-foreground font-medium">Вы ещё не оставляли отзывов</p>
            <p className="text-sm text-muted-foreground">Отзывы появятся здесь после ваших визитов</p>
          </div>
        ) : (
          reviews.map((review) => {
            const loc = review.locations;
            const photo = getPhoto(loc);
            return (
              <div key={review.id} className="bg-card rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center gap-3">
                  {photo ? (
                    <img src={photo} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg">📍</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{loc?.name || 'Компания'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                </div>
                {review.comment && (
                  <p className="text-sm text-foreground/80">{review.comment}</p>
                )}
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Reviews;
