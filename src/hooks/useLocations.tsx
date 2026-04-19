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
      // БАРБЕРШОПЫ / ПАРИКМАХЕРСКИЕ
      'барбершоп': [{ field: 'sub_category', value: 'barbershop' }],
      'барбер': [{ field: 'sub_category', value: 'barbershop' }],
      'сартарошхона': [{ field: 'sub_category', value: 'barbershop' }],
      'сарторошхона': [{ field: 'sub_category', value: 'barbershop' }],
      'сартарош': [{ field: 'sub_category', value: 'barbershop' }],
      'парикмахер': [{ field: 'sub_category', value: 'barbershop' }],
      'парикмахерская': [{ field: 'sub_category', value: 'barbershop' }],
      'стрижка': [{ field: 'sub_category', value: 'barbershop' }],
      'sartarosh': [{ field: 'sub_category', value: 'barbershop' }],
      'haircut': [{ field: 'sub_category', value: 'barbershop' }],
      // САЛОНЫ КРАСОТЫ
      'салон красоты': [{ field: 'sub_category', value: 'salon' }],
      'салон': [{ field: 'sub_category', value: 'salon' }],
      'красота': [{ field: 'business_type', value: 'beauty' }],
      'гўзаллик': [{ field: 'sub_category', value: 'salon' }],
      'gozallik': [{ field: 'sub_category', value: 'salon' }],
      'beauty salon': [{ field: 'sub_category', value: 'salon' }],
      'маникюр': [{ field: 'sub_category', value: 'salon' }],
      'маникур': [{ field: 'sub_category', value: 'salon' }],
      'manikur': [{ field: 'sub_category', value: 'salon' }],
      // СПА
      'спа': [{ field: 'sub_category', value: 'spa' }],
      'spa': [{ field: 'sub_category', value: 'spa' }],
      'massaj': [{ field: 'sub_category', value: 'spa' }],
      'массаж': [{ field: 'sub_category', value: 'spa' }],
      // СТОМАТОЛОГИЯ
      'стоматология': [{ field: 'sub_category', value: 'dental' }],
      'стоматолог': [{ field: 'sub_category', value: 'dental' }],
      'зубной': [{ field: 'sub_category', value: 'dental' }],
      'дантист': [{ field: 'sub_category', value: 'dental' }],
      'тиш шифокор': [{ field: 'sub_category', value: 'dental' }],
      'тишшифокор': [{ field: 'sub_category', value: 'dental' }],
      'tish shifokor': [{ field: 'sub_category', value: 'dental' }],
      'стомат': [{ field: 'sub_category', value: 'dental' }],
      'зубной врач': [{ field: 'sub_category', value: 'dental' }],
      // КАФЕ / РЕСТОРАНЫ
      'кафе': [{ field: 'business_type', value: 'cafe' }],
      'ресторан': [{ field: 'business_type', value: 'cafe' }],
      'ovqat': [{ field: 'business_type', value: 'cafe' }],
      'овқат': [{ field: 'business_type', value: 'cafe' }],
      'choyxona': [{ field: 'business_type', value: 'cafe' }],
      'чойхона': [{ field: 'business_type', value: 'cafe' }],
      'taom': [{ field: 'business_type', value: 'cafe' }],
      'fastfood': [{ field: 'business_type', value: 'cafe' }],
      'фастфуд': [{ field: 'business_type', value: 'cafe' }],
      // МЕДИЦИНА
      'медицина': [{ field: 'business_type', value: 'medical' }],
      'клиника': [{ field: 'business_type', value: 'medical' }],
      'shifoxona': [{ field: 'business_type', value: 'medical' }],
      'шифохона': [{ field: 'business_type', value: 'medical' }],
      'shifokor': [{ field: 'business_type', value: 'medical' }],
      'шифокор': [{ field: 'business_type', value: 'medical' }],
      'поликлиника': [{ field: 'business_type', value: 'medical' }],
      'poliklinika': [{ field: 'business_type', value: 'medical' }],
      'больница': [{ field: 'business_type', value: 'medical' }],
      'kasalxona': [{ field: 'business_type', value: 'medical' }],
      // ТУРЫ
      'тур': [{ field: 'business_type', value: 'tour' }],
      'sayohat': [{ field: 'business_type', value: 'tour' }],
      'саёхат': [{ field: 'business_type', value: 'tour' }],
      'экскурсия': [{ field: 'business_type', value: 'tour' }],
      'ekskursiya': [{ field: 'business_type', value: 'tour' }],
      // МАГАЗИНЫ
      'магазин': [{ field: 'business_type', value: 'retail' }],
      'dokon': [{ field: 'business_type', value: 'retail' }],
      'дўкон': [{ field: 'business_type', value: 'retail' }],
      // АВТОСЕРВИС
      'автосервис': [{ field: 'business_type', value: 'auto' }],
      'avtoservis': [{ field: 'business_type', value: 'auto' }],
      'шиномонтаж': [{ field: 'business_type', value: 'auto' }],
      'shinomontaj': [{ field: 'business_type', value: 'auto' }],
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
