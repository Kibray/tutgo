import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MenuItem {
  id: string;
  category_id: string | null;
  location_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  photo_url: string | null;
  weight: string | null;
  calories: number | null;
  cook_time_minutes: number | null;
  allergens: string[];
  is_vegetarian: boolean;
  is_spicy: boolean;
  is_available: boolean;
  available_from: string | null;
  available_until: string | null;
  story: string | null;
  recipe_visible: boolean;
  ingredients: { name: string; amount?: string }[];
  chef_note: string | null;
  preparation_steps: { step: number; text: string; time_minutes?: number; photo_url?: string }[];
  origin_country: string | null;
  sort_order: number;
  modifiers?: MenuModifier[];
}

export interface MenuCategory {
  id: string;
  location_id: string;
  name: string;
  emoji: string;
  sort_order: number;
}

export interface MenuModifier {
  id: string;
  item_id: string;
  name: string;
  options: { label: string; price_add: number }[];
}

export interface MenuCombo {
  id: string;
  location_id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  items: { item_id: string; name: string; quantity: number }[];
  original_price: number;
  combo_price: number;
  currency: string;
  available_from: string | null;
  available_until: string | null;
  is_active: boolean;
}

export const useMenu = (locationId: string) => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [modifiers, setModifiers] = useState<MenuModifier[]>([]);
  const [combos, setCombos] = useState<MenuCombo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!locationId) return;
    const fetch = async () => {
      setLoading(true);
      const [catRes, itemRes, comboRes] = await Promise.all([
        supabase.from('menu_categories').select('*').eq('location_id', locationId).order('sort_order'),
        supabase.from('menu_items').select('*').eq('location_id', locationId).order('sort_order'),
        supabase.from('menu_combos').select('*').eq('location_id', locationId).eq('is_active', true),
      ]);
      
      const itemsData = (itemRes.data || []) as unknown as MenuItem[];
      setCategories((catRes.data || []) as unknown as MenuCategory[]);
      setItems(itemsData);
      setCombos((comboRes.data || []) as unknown as MenuCombo[]);

      // Fetch modifiers for all items
      if (itemsData.length > 0) {
        const itemIds = itemsData.map(i => i.id);
        const { data: mods } = await supabase.from('menu_modifiers').select('*').in('item_id', itemIds);
        setModifiers((mods || []) as unknown as MenuModifier[]);
      }
      setLoading(false);
    };
    fetch();
  }, [locationId]);

  // Filter by time of day
  const availableItems = useMemo(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return items.filter(item => {
      if (item.available_from && currentTime < item.available_from) return false;
      if (item.available_until && currentTime > item.available_until) return false;
      return true;
    });
  }, [items]);

  const itemsWithModifiers = useMemo(() => {
    return availableItems.map(item => ({
      ...item,
      modifiers: modifiers.filter(m => m.item_id === item.id),
    }));
  }, [availableItems, modifiers]);

  return { categories, items: itemsWithModifiers, allItems: items, combos, loading };
};
