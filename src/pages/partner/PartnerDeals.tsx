import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Edit, X, Loader2, Image, Percent, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import PartnerBottomNav from '@/components/partner/PartnerBottomNav';
import { Switch } from '@/components/ui/switch';

const PartnerDeals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [deals, setDeals] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercent, setDiscountPercent] = useState(10);
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const { data: locs } = await supabase.from('locations').select('id, name, business_type').eq('owner_id', user.id);
    setLocations(locs || []);
    if (locs && locs.length > 0) {
      const locIds = locs.map((l: any) => l.id);
      const { data: d } = await supabase.from('deals').select('*, locations(name, business_type)').in('location_id', locIds).order('created_at', { ascending: false });
      setDeals(d || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const resetForm = () => {
    setTitle(''); setDescription(''); setDiscountPercent(10); setExpiresAt('');
    setSelectedLocation(''); setImageFile(null); setImagePreview(null);
    setEditingDeal(null); setShowForm(false);
  };

  const openEditForm = (deal: any) => {
    setEditingDeal(deal);
    setTitle(deal.title);
    setDescription(deal.description || '');
    setDiscountPercent(deal.discount_percent);
    setExpiresAt(deal.expires_at ? new Date(deal.expires_at).toISOString().split('T')[0] : '');
    setSelectedLocation(deal.location_id);
    setImagePreview(deal.image_url);
    setImageFile(null);
    setShowForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${user!.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('deals').upload(path, file);
    if (error) { toast({ title: 'Ошибка загрузки', description: error.message, variant: 'destructive' }); return null; }
    const { data: { publicUrl } } = supabase.storage.from('deals').getPublicUrl(path);
    return publicUrl;
  };

  const handleSave = async () => {
    if (!title.trim() || !selectedLocation) {
      toast({ title: 'Заполните название и выберите компанию', variant: 'destructive' });
      return;
    }
    setSaving(true);
    let imageUrl = editingDeal?.image_url || null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      discount_percent: discountPercent,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      location_id: selectedLocation,
      image_url: imageUrl,
      is_active: true,
    };

    if (editingDeal) {
      const { error } = await supabase.from('deals').update(payload).eq('id', editingDeal.id);
      if (error) toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      else toast({ title: 'Акция обновлена' });
    } else {
      const { error } = await supabase.from('deals').insert(payload);
      if (error) toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      else toast({ title: 'Акция создана' });
    }
    setSaving(false);
    resetForm();
    fetchData();
  };

  const handleToggleActive = async (deal: any) => {
    await supabase.from('deals').update({ is_active: !deal.is_active }).eq('id', deal.id);
    fetchData();
  };

  const handleDelete = async (dealId: string) => {
    await supabase.from('deals').delete().eq('id', dealId);
    toast({ title: 'Акция удалена' });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/partner')}>
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <h1 className="text-lg font-bold font-display text-foreground">Акции</h1>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold">
            <Plus className="w-4 h-4" /> Создать
          </motion.button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Загрузка...</div>
        ) : deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Percent className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">У вас ещё нет акций</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Создайте первую акцию для привлечения клиентов</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deals.map((deal, i) => (
              <motion.div key={deal.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass rounded-xl p-4">
                <div className="flex gap-3">
                  {deal.image_url && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
                      <img src={deal.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{deal.title}</h3>
                        <p className="text-[10px] text-muted-foreground">{deal.locations?.name}</p>
                      </div>
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-md flex-shrink-0">
                        -{deal.discount_percent}%
                      </span>
                    </div>
                    {deal.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{deal.description}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        {deal.expires_at && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />до {new Date(deal.expires_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                        <Switch checked={deal.is_active} onCheckedChange={() => handleToggleActive(deal)} />
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditForm(deal)} className="p-1.5 rounded-md hover:bg-secondary"><Edit className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        <button onClick={() => handleDelete(deal.id)} className="p-1.5 rounded-md hover:bg-secondary"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={resetForm}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl p-5 mx-4 w-full max-w-sm shadow-xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground">{editingDeal ? 'Редактировать акцию' : 'Новая акция'}</h3>
                <button onClick={resetForm} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Location select */}
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Компания</label>
                  <select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}
                    className="w-full bg-secondary rounded-xl p-3 text-sm text-foreground border border-border focus:border-primary outline-none">
                    <option value="">Выберите компанию</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Название акции</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Скидка на маникюр"
                    className="w-full bg-secondary rounded-xl p-3 text-sm text-foreground border border-border focus:border-primary outline-none" maxLength={100} />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Описание</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Подробности акции..."
                    className="w-full bg-secondary rounded-xl p-3 text-sm text-foreground resize-none h-20 border border-border focus:border-primary outline-none" maxLength={500} />
                </div>

                {/* Discount */}
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Скидка (%)</label>
                  <div className="flex items-center gap-2">
                    <input type="range" min={5} max={90} step={5} value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value))}
                      className="flex-1 accent-[hsl(var(--primary))]" />
                    <span className="text-lg font-bold text-primary w-14 text-right">-{discountPercent}%</span>
                  </div>
                </div>

                {/* Expiry */}
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Действует до</label>
                  <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                    className="w-full bg-secondary rounded-xl p-3 text-sm text-foreground border border-border focus:border-primary outline-none" />
                </div>

                {/* Image */}
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Фото</label>
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="" className="w-full h-32 object-cover rounded-xl" />
                      <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-24 bg-secondary rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors">
                      <Image className="w-6 h-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Загрузить фото</span>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                </div>

                <button onClick={handleSave} disabled={saving}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingDeal ? 'Сохранить' : 'Создать акцию')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default PartnerDeals;
