import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) { setFavoriteIds(new Set()); return; }
    setLoading(true);
    const { data } = await supabase
      .from('favorites')
      .select('location_id')
      .eq('user_id', user.id);
    setFavoriteIds(new Set((data || []).map((f: any) => f.location_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const toggleFavorite = useCallback(async (locationId: string) => {
    if (!user) return false;
    const isFav = favoriteIds.has(locationId);
    if (isFav) {
      setFavoriteIds(prev => { const next = new Set(prev); next.delete(locationId); return next; });
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('location_id', locationId);
    } else {
      setFavoriteIds(prev => new Set(prev).add(locationId));
      await supabase.from('favorites').insert({ user_id: user.id, location_id: locationId });
    }
    return !isFav;
  }, [user, favoriteIds]);

  const isFavorite = useCallback((locationId: string) => favoriteIds.has(locationId), [favoriteIds]);

  return { favoriteIds, isFavorite, toggleFavorite, loading };
};
