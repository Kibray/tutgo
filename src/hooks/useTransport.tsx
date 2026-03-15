import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TransportRoute {
  id: string;
  location_id: string | null;
  from_city: string;
  to_city: string;
  transport_type: string;
  transport_name: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  duration_minutes: number | null;
  price_per_seat: number;
  total_seats: number;
  available_seats: number;
  amenities: string[];
  is_active: boolean;
  created_at: string;
}

export interface TransportBooking {
  id: string;
  route_id: string;
  user_id: string;
  travel_date: string;
  seats: number;
  total_price: number;
  status: string;
  passenger_name: string | null;
  passenger_phone: string | null;
  created_at: string;
  route?: TransportRoute;
}

export interface DriverTrip {
  id: string;
  driver_id: string;
  from_city: string;
  to_city: string;
  departure_datetime: string | null;
  price: number;
  available_seats: number;
  car_model: string | null;
  car_color: string | null;
  amenities: string[];
  status: string;
  created_at: string;
}

export const useTransportRoutes = (filters?: {
  from_city?: string;
  to_city?: string;
  transport_type?: string;
}) => {
  return useQuery({
    queryKey: ['transport_routes', filters],
    queryFn: async () => {
      let query = supabase
        .from('transport_routes')
        .select('*')
        .eq('is_active', true)
        .order('departure_time', { ascending: true });

      if (filters?.from_city) {
        query = query.ilike('from_city', `%${filters.from_city}%`);
      }
      if (filters?.to_city) {
        query = query.ilike('to_city', `%${filters.to_city}%`);
      }
      if (filters?.transport_type && filters.transport_type !== 'all') {
        query = query.eq('transport_type', filters.transport_type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as TransportRoute[];
    },
  });
};

export const usePopularRoutes = (limit = 6) => {
  return useQuery({
    queryKey: ['transport_routes', 'popular', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transport_routes')
        .select('*')
        .eq('is_active', true)
        .order('price_per_seat', { ascending: true })
        .limit(limit);
      if (error) throw error;
      return (data || []) as unknown as TransportRoute[];
    },
  });
};

export const useDriverTrips = () => {
  return useQuery({
    queryKey: ['driver_trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_trips')
        .select('*')
        .eq('status', 'active')
        .order('departure_datetime', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as DriverTrip[];
    },
  });
};

export const useTransportBookings = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['transport_bookings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transport_bookings')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const bookings = data as unknown as TransportBooking[];
      const routeIds = [...new Set(bookings.map(b => b.route_id))];
      if (routeIds.length > 0) {
        const { data: routes } = await supabase
          .from('transport_routes')
          .select('*')
          .in('id', routeIds);
        const routesMap = new Map((routes || []).map(r => [r.id, r as unknown as TransportRoute]));
        bookings.forEach(b => { b.route = routesMap.get(b.route_id); });
      }

      return bookings;
    },
    enabled: !!user,
  });
};

export const useCreateTransportBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (booking: {
      route_id: string;
      user_id: string;
      travel_date: string;
      seats: number;
      total_price: number;
      passenger_name?: string;
      passenger_phone?: string;
    }) => {
      const { data, error } = await supabase
        .from('transport_bookings')
        .insert(booking as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport_bookings'] });
      queryClient.invalidateQueries({ queryKey: ['transport_routes'] });
    },
  });
};
