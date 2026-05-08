import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'partner_selected_location';

type PartnerLocation = {
  id: string;
  owner_id: string;
  name: string;
  [key: string]: any;
};

type PartnerLocationContextValue = {
  locations: PartnerLocation[];
  selectedLocationId: string | null;
  setSelectedLocationId: (id: string | null) => void;
  selectedLocation: PartnerLocation | null;
  locationsLoading: boolean;
};

const PartnerLocationContext = createContext<PartnerLocationContextValue | undefined>(undefined);

export const PartnerLocationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [locations, setLocations] = useState<PartnerLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [selectedLocationId, setSelectedLocationIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  const setSelectedLocationId = (id: string | null) => {
    setSelectedLocationIdState(id);
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) {
        setLocations([]);
        setLocationsLoading(false);
        return;
      }
      setLocationsLoading(true);
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true });
      if (cancelled) return;
      if (error) {
        setLocations([]);
      } else {
        const list = (data ?? []) as PartnerLocation[];
        setLocations(list);
        const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
        const storedExists = stored && list.some(l => l.id === stored);
        if (storedExists) {
          setSelectedLocationIdState(stored);
        } else if (list.length > 0) {
          setSelectedLocationIdState(list[0].id);
          if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, list[0].id);
        } else {
          setSelectedLocationIdState(null);
          if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
        }
      }
      setLocationsLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const selectedLocation = useMemo(
    () => locations.find(l => l.id === selectedLocationId) ?? null,
    [locations, selectedLocationId]
  );

  const value: PartnerLocationContextValue = {
    locations,
    selectedLocationId,
    setSelectedLocationId,
    selectedLocation,
    locationsLoading,
  };

  return (
    <PartnerLocationContext.Provider value={value}>
      {children}
    </PartnerLocationContext.Provider>
  );
};

export const usePartnerLocation = (): PartnerLocationContextValue => {
  const ctx = useContext(PartnerLocationContext);
  if (!ctx) {
    throw new Error('usePartnerLocation must be used within a PartnerLocationProvider');
  }
  return ctx;
};