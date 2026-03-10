import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Edit, Eye, EyeOff, GripVertical, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/types';
import PartnerLayout from '@/components/partner/PartnerLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const PartnerMenu = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [locationId, setLocationId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [combos, setCombos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showCatForm, setShowCatForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showComboForm, setShowComboForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [catName, setCatName] = useState('');
  const [catEmoji, setCatEmoji] = useState('🍽️');

  // Item form fields
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCatId, setItemCatId] = useState('');
  const [itemWeight, setItemWeight] = useState('');
  const [itemCalories, setItemCalories] = useState('');
  const [itemCookTime, setItemCookTime] = useState('');
  const [itemVeg, setItemVeg] = useState(false);
  const [itemSpicy, setItemSpicy] = useState(false);
  const [itemStory, setItemStory] = useState('');
  const [itemChefNote, setItemChefNote] = useState('');
  const [itemOrigin, setItemOrigin] = useState('');
  const [itemAvailFrom, setItemAvailFrom] = useState('');
  const [itemAvailUntil, setItemAvailUntil] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchLoc = async () => {
      const { data } = await supabase.from('locations').select('id').eq('owner_id', user.id).eq('business_type', 'cafe').limit(1).single();
      if (data) {
        setLocationId(data.id);
        await fetchAll(data.id);
      }
      setLoading(false);
    };
    fetchLoc();
  }, [user]);

  const fetchAll = async (locId: string) => {
    const [catRes, itemRes, comboRes] = await Promise.all([
      supabase.from('menu_categories').select('*').eq('location_id', locId).order('sort_order'),
      supabase.from('menu_items').select('*').eq('location_id', locId).order('sort_order'),
      supabase.from('menu_combos').select('*').eq('location_id', locId),
    ]);
    setCategories(catRes.data || []);
    setItems(itemRes.data || []);
    setCombos(comboRes.data || []);
  };

  const handleAddCategory = async () => {
    if (!catName || !locationId) return;
    await supabase.from('menu_categories').insert({
      location_id: locationId, name: catName, emoji: catEmoji,
      sort_order: categories.length,
    });
    setCatName(''); setCatEmoji('🍽️'); setShowCatForm(false);
    await fetchAll(locationId);
    toast({ title: 'Категория добавлена' });
  };

  const handleDeleteCategory = async (id: string) => {
    await supabase.from('menu_categories').delete().eq('id', id);
    if (locationId) await fetchAll(locationId);
  };

  const handleAddItem = async () => {
    if (!itemName || !locationId) return;
    const data: any = {
      location_id: locationId,
      name: itemName,
      description: itemDesc || null,
      price: parseInt(itemPrice) || 0,
      category_id: itemCatId || null,
      weight: itemWeight || null,
      calories: itemCalories ? parseInt(itemCalories) : null,
      cook_time_minutes: itemCookTime ? parseInt(itemCookTime) : null,
      is_vegetarian: itemVeg,
      is_spicy: itemSpicy,
      story: itemStory || null,
      chef_note: itemChefNote || null,
      origin_country: itemOrigin || null,
      available_from: itemAvailFrom || null,
      available_until: itemAvailUntil || null,
      sort_order: items.length,
    };

    if (editItem) {
      await supabase.from('menu_items').update(data).eq('id', editItem.id);
    } else {
      await supabase.from('menu_items').insert(data);
    }

    resetItemForm();
    await fetchAll(locationId);
    toast({ title: editItem ? 'Блюдо обновлено' : 'Блюдо добавлено' });
  };

  const resetItemForm = () => {
    setItemName(''); setItemDesc(''); setItemPrice(''); setItemCatId('');
    setItemWeight(''); setItemCalories(''); setItemCookTime('');
    setItemVeg(false); setItemSpicy(false); setItemStory('');
    setItemChefNote(''); setItemOrigin(''); setItemAvailFrom(''); setItemAvailUntil('');
    setEditItem(null); setShowItemForm(false);
  };

  const handleEditItem = (item: any) => {
    setEditItem(item);
    setItemName(item.name); setItemDesc(item.description || '');
    setItemPrice(item.price?.toString() || ''); setItemCatId(item.category_id || '');
    setItemWeight(item.weight || ''); setItemCalories(item.calories?.toString() || '');
    setItemCookTime(item.cook_time_minutes?.toString() || '');
    setItemVeg(item.is_vegetarian); setItemSpicy(item.is_spicy);
    setItemStory(item.story || ''); setItemChefNote(item.chef_note || '');
    setItemOrigin(item.origin_country || '');
    setItemAvailFrom(item.available_from || ''); setItemAvailUntil(item.available_until || '');
    setShowItemForm(true);
  };

  const toggleAvailability = async (item: any) => {
    await supabase.from('menu_items').update({ is_available: !item.is_available } as any).eq('id', item.id);
    if (locationId) await fetchAll(locationId);
  };

  const handleDeleteItem = async (id: string) => {
    await supabase.from('menu_items').delete().eq('id', id);
    if (locationId) await fetchAll(locationId);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Загрузка...</div>;
  if (!locationId) return (
    <PartnerLayout title="Управление меню">
      <div className="flex items-center justify-center px-4 py-16">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-sm">Создайте кафе/ресторан чтобы управлять меню</p>
          <button onClick={() => navigate('/partner/settings')} className="text-primary text-sm font-medium">Настройки компании →</button>
        </div>
      </div>
    </PartnerLayout>
  );

  const inputCls = "w-full bg-secondary rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground border-none outline-none";

  return (
    <PartnerLayout title="Управление меню">
      <div className="px-4">

      <Tabs defaultValue="items" className="px-4 mt-3">
        <TabsList className="w-full">
          <TabsTrigger value="items" className="flex-1 text-xs">🍽️ Блюда</TabsTrigger>
          <TabsTrigger value="categories" className="flex-1 text-xs">📂 Категории</TabsTrigger>
          <TabsTrigger value="combos" className="flex-1 text-xs">🔥 Комбо</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-3">
          <button onClick={() => { resetItemForm(); setShowItemForm(true); }}
            className="w-full glass rounded-lg p-3 flex items-center gap-2 text-primary text-sm font-medium">
            <Plus className="w-4 h-4" />Добавить блюдо
          </button>

          {/* Item form */}
          {showItemForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-bold text-foreground">{editItem ? 'Редактировать' : 'Новое блюдо'}</h3>
              <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Название *" className={inputCls} />
              <textarea value={itemDesc} onChange={e => setItemDesc(e.target.value)} placeholder="Описание" className={`${inputCls} h-16 resize-none`} />
              <div className="grid grid-cols-2 gap-2">
                <input value={itemPrice} onChange={e => setItemPrice(e.target.value)} placeholder="Цена *" type="number" className={inputCls} />
                <select value={itemCatId} onChange={e => setItemCatId(e.target.value)} className={inputCls}>
                  <option value="">Без категории</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input value={itemWeight} onChange={e => setItemWeight(e.target.value)} placeholder="Вес (г)" className={inputCls} />
                <input value={itemCalories} onChange={e => setItemCalories(e.target.value)} placeholder="Ккал" type="number" className={inputCls} />
                <input value={itemCookTime} onChange={e => setItemCookTime(e.target.value)} placeholder="Мин" type="number" className={inputCls} />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <input type="checkbox" checked={itemVeg} onChange={e => setItemVeg(e.target.checked)} className="accent-primary" />🌱 Вегетарианское
                </label>
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <input type="checkbox" checked={itemSpicy} onChange={e => setItemSpicy(e.target.checked)} className="accent-primary" />🌶️ Острое
                </label>
              </div>
              <input value={itemOrigin} onChange={e => setItemOrigin(e.target.value)} placeholder="Страна происхождения" className={inputCls} />
              <textarea value={itemStory} onChange={e => setItemStory(e.target.value)} placeholder="История блюда" className={`${inputCls} h-16 resize-none`} />
              <input value={itemChefNote} onChange={e => setItemChefNote(e.target.value)} placeholder="Заметка от шефа" className={inputCls} />
              <div className="grid grid-cols-2 gap-2">
                <input value={itemAvailFrom} onChange={e => setItemAvailFrom(e.target.value)} placeholder="Доступно с (08:00)" className={inputCls} />
                <input value={itemAvailUntil} onChange={e => setItemAvailUntil(e.target.value)} placeholder="До (22:00)" className={inputCls} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddItem} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
                  {editItem ? 'Сохранить' : 'Добавить'}
                </button>
                <button onClick={resetItemForm} className="px-4 py-2.5 rounded-lg glass text-sm text-foreground">Отмена</button>
              </div>
            </motion.div>
          )}

          {/* Items list */}
          {items.map(item => (
            <div key={item.id} className={`glass rounded-lg p-3 flex items-center gap-3 ${!item.is_available ? 'opacity-50' : ''}`}>
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
                {item.photo_url ? <img src={item.photo_url} alt="" className="w-full h-full object-cover" /> : '🍽️'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.name}
                  {item.is_vegetarian && ' 🌱'}
                  {item.is_spicy && ' 🌶️'}
                </p>
                <p className="text-xs text-primary font-bold">{formatPrice(item.price)} сум</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleAvailability(item)} className="p-1.5 rounded-md hover:bg-secondary">
                  {item.is_available ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                </button>
                <button onClick={() => handleEditItem(item)} className="p-1.5 rounded-md hover:bg-secondary">
                  <Edit className="w-4 h-4 text-muted-foreground" />
                </button>
                <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 rounded-md hover:bg-secondary">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-center py-8 text-xs text-muted-foreground">Добавьте первое блюдо</p>}
        </TabsContent>

        <TabsContent value="categories" className="space-y-3">
          <button onClick={() => setShowCatForm(true)}
            className="w-full glass rounded-lg p-3 flex items-center gap-2 text-primary text-sm font-medium">
            <Plus className="w-4 h-4" />Добавить категорию
          </button>
          {showCatForm && (
            <div className="glass rounded-lg p-4 space-y-3">
              <div className="flex gap-2">
                <input value={catEmoji} onChange={e => setCatEmoji(e.target.value)} className={`${inputCls} w-16 text-center`} />
                <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Название категории" className={`${inputCls} flex-1`} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddCategory} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Добавить</button>
                <button onClick={() => setShowCatForm(false)} className="px-4 py-2.5 rounded-lg glass text-sm text-foreground">Отмена</button>
              </div>
            </div>
          )}
          {categories.map(cat => (
            <div key={cat.id} className="glass rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-foreground">{cat.emoji} {cat.name}</span>
              <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5"><Trash2 className="w-4 h-4 text-destructive" /></button>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="combos" className="space-y-3">
          <p className="text-center py-8 text-xs text-muted-foreground">Комбо-сеты в разработке</p>
        </TabsContent>
      </div>
    </PartnerLayout>
  );
};

export default PartnerMenu;
