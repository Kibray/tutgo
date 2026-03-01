import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { LocationItem } from '@/lib/types';

export const useLocations = (categoryName?: string, subcategory?: string, search?: string) => {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('locations')
        .select('*')
        .order('is_promoted', { ascending: false })
        .order('rating', { ascending: false });
      setLocations((data as LocationItem[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = useMemo(() => {
    return locations.filter((s) => {
      const matchCat = !categoryName || categoryName === 'all' || s.business_type === categoryName;
      const matchSub = !subcategory || subcategory === 'all' || s.sub_category === subcategory;
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.address || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.sub_category || '').toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSub && matchSearch;
    });
  }, [locations, categoryName, subcategory, search]);

  return { locations: filtered, allLocations: locations, loading };
};
