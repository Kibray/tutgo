import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Store, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import { categories } from '@/lib/mock-data';

const amenitiesList = [
  { id: 'wifi', label: 'WiFi', icon: '📶' },
  { id: 'parking', label: 'Парковка', icon: '🅿️' },
  { id: 'cards', label: 'Карты', icon: '💳' },
  { id: '24h', label: '24/7', icon: '🕐' },
];

const Partner = () => {
  const { user, isPartner, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('service');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [website, setWebsite] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);

  useEffect(() => {
    if (user) fetchBusinesses();
  }, [user]);

  const fetchBusinesses = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    setBusinesses(data || []);
  };

  const handleSave = async () => {
    if (!user || !name.trim()) {
      toast({ title: 'Введите название бизнеса', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('locations').insert({
      owner_id: user.id,
      name: name.trim(),
      business_type: businessType,
      sub_category: subCategory || null,
      description: description || null,
      address: address || null,
      phone: phone || null,
      telegram: telegram || null,
      website: website || null,
      price_from: priceFrom ? parseInt(priceFrom) : 0,
      amenities: amenities,
    });
    setSaving(false);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Бизнес добавлен!' });
      setShowForm(false);
      setName(''); setDescription(''); setAddress(''); setPhone(''); setTelegram(''); setWebsite(''); setPriceFrom(''); setAmenities([]);
      fetchBusinesses();
    }
  };

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Загрузка...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 pb-24">
        <Store className="w-12 h-12 text-primary mb-4" />
        <h1 className="text-lg font-bold text-foreground mb-2">Панель партнёра</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">Войдите, чтобы управлять бизнесом</p>
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate('/auth')}
          className="px-8 py-3 rounded-lg bg-primary text-accent-foreground font-semibold text-sm">
          Войти / Регистрация
        </motion.button>
        <BottomNav />
      </div>
    );
  }

  if (!isPartner) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 pb-24">
        <Store className="w-12 h-12 text-primary mb-4" />
        <h1 className="text-lg font-bold text-foreground mb-2">Вы ещё не партнёр</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">Станьте партнёром в разделе «Профиль»</p>
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate('/profile')}
          className="px-8 py-3 rounded-lg bg-primary text-accent-foreground font-semibold text-sm">
          Перейти в профиль
        </motion.button>
        <BottomNav />
      </div>
    );
  }

  const selectedCat = categories.find(c => c.id === businessType);

  return (
    <div className="min-h-screen bg-background pb-24 overflow-y-auto">
      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold font-display text-foreground">Мой бизнес</h1>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-accent-foreground text-xs font-medium">
            <Plus className="w-4 h-4" />
            Добавить
          </motion.button>
        </div>

        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-lg p-4 mb-6 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Новый бизнес</h3>

            <input placeholder="Название *" value={name} onChange={e => setName(e.target.value)}
              className="w-full glass rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors" />

            <select value={businessType} onChange={e => { setBusinessType(e.target.value); setSubCategory(''); }}
              className="w-full glass rounded-lg px-3 py-2.5 text-sm text-foreground bg-background border border-border focus:border-primary outline-none">
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>

            {selectedCat?.subcategories && (
              <select value={subCategory} onChange={e => setSubCategory(e.target.value)}
                className="w-full glass rounded-lg px-3 py-2.5 text-sm text-foreground bg-background border border-border focus:border-primary outline-none">
                <option value="">Подкатегория</option>
                {selectedCat.subcategories.map(sc => <option key={sc.id} value={sc.id}>{sc.icon || ''} {sc.name}</option>)}
              </select>
            )}

            <textarea placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)}
              className="w-full glass rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors min-h-[60px] resize-none" />

            <input placeholder="Адрес" value={address} onChange={e => setAddress(e.target.value)}
              className="w-full glass rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors" />

            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Телефон" value={phone} onChange={e => setPhone(e.target.value)}
                className="glass rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors" />
              <input placeholder="Telegram @" value={telegram} onChange={e => setTelegram(e.target.value)}
                className="glass rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors" />
            </div>

            <input placeholder="Сайт (https://...)" value={website} onChange={e => setWebsite(e.target.value)}
              className="w-full glass rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors" />

            <input type="number" placeholder="Цена от (сум)" value={priceFrom} onChange={e => setPriceFrom(e.target.value)}
              className="w-full glass rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors" />

            {/* Amenities */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Удобства</p>
              <div className="flex flex-wrap gap-2">
                {amenitiesList.map(a => (
                  <button key={a.id} onClick={() => setAmenities(prev => prev.includes(a.id) ? prev.filter(x => x !== a.id) : [...prev, a.id])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${amenities.includes(a.id) ? 'bg-primary text-accent-foreground' : 'glass text-muted-foreground'}`}>
                    {a.icon} {a.label}
                  </button>
                ))}
              </div>
            </div>

            <motion.button whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving}
              className="w-full py-3 rounded-lg bg-primary text-accent-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Сохранение...' : 'Сохранить'}
            </motion.button>
          </motion.div>
        )}

        {/* Existing businesses */}
        {businesses.length === 0 && !showForm && (
          <div className="text-center py-12 text-muted-foreground">
            <Store className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">У вас пока нет бизнесов</p>
            <p className="text-xs mt-1">Нажмите «Добавить», чтобы создать первый</p>
          </div>
        )}

        <div className="space-y-3">
          {businesses.map((biz, i) => (
            <motion.div key={biz.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{biz.name}</h3>
                <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{biz.business_type}</span>
              </div>
              {biz.address && <p className="text-xs text-muted-foreground mt-1">{biz.address}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {biz.phone && <span>📞 {biz.phone}</span>}
                {biz.telegram && <span>✈️ @{biz.telegram}</span>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Partner;
