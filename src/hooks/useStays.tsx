import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Stay {
  id: string;
  location_id: string | null;
  name: string;
  description: string | null;
  category: string;
  photos: string[];
  city: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  price_per_night: number;
  min_nights: number;
  max_guests: number;
  amenities: string[];
  rating: number;
  reviews_count: number;
  is_active: boolean;
  created_at: string;
}

export interface StayRoom {
  id: string;
  stay_id: string;
  name: string;
  description: string | null;
  price_per_night: number;
  max_guests: number;
  bed_type: string | null;
  area_sqm: number | null;
  amenities: string[];
  photos: string[];
  is_available: boolean;
}

export interface StayBooking {
  id: string;
  stay_id: string;
  room_id: string | null;
  user_id: string;
  check_in: string;
  check_out: string;
  nights: number;
  guests: number;
  total_price: number;
  status: string;
  created_at: string;
}

interface StayFilters {
  city?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  maxGuests?: number;
  amenities?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'rating';
}

export const useStays = (filters?: StayFilters) => {
  return useQuery({
    queryKey: ['stays', filters],
    queryFn: async () => {
      let q = supabase.from('stays').select('*').eq('is_active', true);

      if (filters?.city) q = q.ilike('city', `%${filters.city}%`);
      if (filters?.category) q = q.eq('category', filters.category);
      if (filters?.minPrice) q = q.gte('price_per_night', filters.minPrice);
      if (filters?.maxPrice) q = q.lte('price_per_night', filters.maxPrice);
      if (filters?.minRating) q = q.gte('rating', filters.minRating);
      if (filters?.maxGuests) q = q.gte('max_guests', filters.maxGuests);
      if (filters?.amenities?.length) {
        q = q.contains('amenities', filters.amenities);
      }

      if (filters?.sortBy === 'price_asc') q = q.order('price_per_night', { ascending: true });
      else if (filters?.sortBy === 'price_desc') q = q.order('price_per_night', { ascending: false });
      else if (filters?.sortBy === 'rating') q = q.order('rating', { ascending: false });
      else q = q.order('rating', { ascending: false });

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Stay[];
    },
  });
};

export const useStay = (id: string) => {
  return useQuery({
    queryKey: ['stay', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('stays').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Stay;
    },
    enabled: !!id,
  });
};

export const useStayRooms = (stayId: string) => {
  return useQuery({
    queryKey: ['stay_rooms', stayId],
    queryFn: async () => {
      const { data, error } = await supabase.from('stay_rooms').select('*').eq('stay_id', stayId).eq('is_available', true);
      if (error) throw error;
      return (data || []) as StayRoom[];
    },
    enabled: !!stayId,
  });
};

export const useCreateStayBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (booking: {
      stay_id: string;
      room_id?: string;
      user_id: string;
      check_in: string;
      check_out: string;
      nights: number;
      guests: number;
      total_price: number;
    }) => {
      const { data, error } = await supabase.from('stay_bookings').insert({
        ...booking,
        room_id: booking.room_id || null,
        status: 'pending',
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stay_bookings'] });
    },
  });
};

export const useMyStayBookings = (userId?: string) => {
  return useQuery({
    queryKey: ['stay_bookings', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('stay_bookings').select('*').eq('user_id', userId!).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as StayBooking[];
    },
    enabled: !!userId,
  });
};

export const usePopularStays = () => {
  return useQuery({
    queryKey: ['stays_popular'],
    queryFn: async () => {
      const { data, error } = await supabase.from('stays').select('*').eq('is_active', true).gte('rating', 4.7).order('rating', { ascending: false }).limit(6);
      if (error) throw error;
      return (data || []) as Stay[];
    },
  });
};
