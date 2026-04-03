import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { LocationItem } from '@/lib/types';

export const useLocations = (categoryName?: string, subcategory?: string, search?: string) => {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('locations')
      .select('*')
      .order('is_promoted', { ascending: false })
      .order('rating', { ascending: false });
    setLocations((data as LocationItem[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchLocations(); }, []);

  // Realtime subscription for locations
  useEffect(() => {
    const channel = supabase
      .channel('locations-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' },
        () => fetchLocations()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    const categoryMap: Record<string, { field: 'sub_category' | 'business_type'; value: string }[]> = {
      'стоматология': [{ field: 'sub_category', value: 'dental' }],
      'стоматолог': [{ field: 'sub_category', value: 'dental' }],
      'зубной': [{ field: 'sub_category', value: 'dental' }],
      'дантист': [{ field: 'sub_category', value: 'dental' }],
      'барбершоп': [{ field: 'sub_category', value: 'barbershop' }],
      'барбер': [{ field: 'sub_category', value: 'barbershop' }],
      'салон красоты': [{ field: 'sub_category', value: 'salon' }],
      'салон': [{ field: 'sub_category', value: 'salon' }],
      'красота': [{ field: 'business_type', value: 'beauty' }],
      'спа': [{ field: 'sub_category', value: 'spa' }],
      'кафе': [{ field: 'business_type', value: 'cafe' }],
      'ресторан': [{ field: 'business_type', value: 'cafe' }],
      'медицина': [{ field: 'business_type', value: 'medical' }],
      'клиника': [{ field: 'business_type', value: 'medical' }],
      'тур': [{ field: 'business_type', value: 'tour' }],
    };

    return locations.filter((s) => {
      const matchCat = !categoryName || categoryName === 'all' || s.business_type === categoryName;
      const matchSub = !subcategory || subcategory === 'all' || s.sub_category === subcategory;

      if (!search) return matchCat && matchSub;

      const q = search.toLowerCase().trim();

      // Check category keyword map
      const mapped = categoryMap[q];
      if (mapped) {
        return mapped.some(m =>
          m.field === 'sub_category' ? s.sub_category === m.value : s.business_type === m.value
        );
      }

      // Partial match on category keywords
      for (const [keyword, targets] of Object.entries(categoryMap)) {
        if (keyword.includes(q) || q.includes(keyword)) {
          if (targets.some(m =>
            m.field === 'sub_category' ? s.sub_category === m.value : s.business_type === m.value
          )) return true;
        }
      }

      // Text search on name, address, sub_category
      const matchSearch =
        s.name.toLowerCase().includes(q) ||
        (s.address || '').toLowerCase().includes(q) ||
        (s.sub_category || '').toLowerCase().includes(q) ||
        (s.business_type || '').toLowerCase().includes(q);
      return matchCat && matchSub && matchSearch;
    });
  }, [locations, categoryName, subcategory, search]);

  return { locations: filtered, allLocations: locations, loading };
};
