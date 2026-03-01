import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  subcategories: { id: string; name: string; icon?: string }[];
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');
      if (data) {
        setCategories(
          data.map((c: any) => ({
            id: c.id,
            name: c.name,
            icon: c.icon || '📍',
            sort_order: c.sort_order || 0,
            subcategories: Array.isArray(c.subcategories) ? c.subcategories : [],
          }))
        );
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { categories, loading };
};
