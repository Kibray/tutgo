import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSportCourts = (locationId?: string) => {
  const { data: courts = [], isLoading } = useQuery({
    queryKey: ['sport_courts', locationId],
    enabled: !!locationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sport_courts' as any)
        .select('*')
        .eq('location_id', locationId!)
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  return { courts, isLoading };
};