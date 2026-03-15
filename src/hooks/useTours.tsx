import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Tour {
  id: string;
  location_id: string;
  title: string;
  description: string | null;
  photos: string[];
  duration_days: number;
  price_per_person: number;
  price_child: number;
  max_people: number;
  min_people: number;
  departure_city: string;
  destinations: string[];
  category: string;
  includes: string[];
  excludes: string[];
  program: any[];
  highlights: any[];
  available_dates: string[];
  is_active: boolean;
  rating: number;
  reviews_count: number;
  created_at: string;
}

export interface TourBooking {
  id: string;
  tour_id: string;
  user_id: string;
  adults: number;
  children: number;
  selected_date: string;
  total_price: number;
  status: string;
  created_at: string;
  tour?: Tour;
}

export const useTours = (filters?: {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  duration?: string;
  minRating?: number;
  maxGroup?: number;
  includes?: string[];
}) => {
  return useQuery({
    queryKey: ['tours', filters],
    queryFn: async () => {
      let query = supabase
        .from('tours')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,departure_city.ilike.%${filters.search}%`);
      }
      if (filters?.minPrice) {
        query = query.gte('price_per_person', filters.minPrice);
      }
      if (filters?.maxPrice) {
        query = query.lte('price_per_person', filters.maxPrice);
      }
      if (filters?.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = (data || []) as unknown as Tour[];

      // Client-side filters
      if (filters?.duration) {
        result = result.filter(t => {
          if (filters.duration === '1') return t.duration_days === 1;
          if (filters.duration === '2-3') return t.duration_days >= 2 && t.duration_days <= 3;
          if (filters.duration === '4-5') return t.duration_days >= 4 && t.duration_days <= 5;
          if (filters.duration === '6+') return t.duration_days >= 6;
          return true;
        });
      }
      if (filters?.maxGroup) {
        result = result.filter(t => t.max_people <= filters.maxGroup!);
      }
      if (filters?.includes && filters.includes.length > 0) {
        result = result.filter(t =>
          filters.includes!.every(inc => t.includes.some(ti => ti.toLowerCase().includes(inc.toLowerCase())))
        );
      }

      return result;
    },
  });
};

export const useTour = (id: string) => {
  return useQuery({
    queryKey: ['tour', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as unknown as Tour;
    },
    enabled: !!id,
  });
};

export const usePopularTours = (limit = 6) => {
  return useQuery({
    queryKey: ['tours', 'popular', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('is_active', true)
        .gte('rating', 4.8)
        .order('rating', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as unknown as Tour[];
    },
  });
};

export const useTourBookings = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['tour_bookings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tour_bookings')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch tour details for each booking
      const bookings = data as unknown as TourBooking[];
      const tourIds = [...new Set(bookings.map(b => b.tour_id))];
      if (tourIds.length > 0) {
        const { data: tours } = await supabase
          .from('tours')
          .select('*')
          .in('id', tourIds);
        const toursMap = new Map((tours || []).map(t => [t.id, t as unknown as Tour]));
        bookings.forEach(b => { b.tour = toursMap.get(b.tour_id); });
      }

      return bookings;
    },
    enabled: !!user,
  });
};

export const useCreateTourBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (booking: {
      tour_id: string;
      user_id: string;
      adults: number;
      children: number;
      selected_date: string;
      total_price: number;
    }) => {
      const { data, error } = await supabase
        .from('tour_bookings')
        .insert(booking as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour_bookings'] });
    },
  });
};
