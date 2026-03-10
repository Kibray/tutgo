import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Save, List, Pencil, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCategories } from '@/hooks/useCategories';
import PartnerLayout from '@/components/partner/PartnerLayout';
import AddressPicker from '@/components/AddressPicker';

const amenitiesList = [
  { id: 'wifi', label: 'WiFi', icon: '📶' },
  { id: 'parking', label: 'Парковка', icon: '🅿️' },
  { id: 'cards', label: 'Карты', icon: '💳' },
  { id: '24h', label: '24/7', icon: '🕐' },
];

const PartnerServices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = usePreferences();
  const { toast } = useToast();
  const { categories } = useCategories();

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('service');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [formLat, setFormLat] = useState<number | null>(null);
  const [formLng, setFormLng] = useState<number | null>(null);
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [website, setWebsite] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);

  useEffect(() => { if (user) fetchBusinesses(); }, [user]);

  const fetchBusinesses = async () => {
    if (!user) return;
    const { data } = await supabase.from('locations').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
    setBusinesses(data || []);
  };

  const resetForm = () => {
    setName(''); setBusinessType('service'); setSubCategory(''); setDescription('');
    setAddress(''); setFormLat(null); setFormLng(null); setPhone(''); setTelegram('');
    setWebsite(''); setPriceFrom(''); setAmenities([]); setEditingId(null);
  };

  const openEditForm = (biz: any) => {
    setEditingId(biz.id);
    setName(biz.name || '');
    setBusinessType(biz.business_type || 'service');
    setSubCategory(biz.sub_category || '');
    setDescription(biz.description || '');
    setAddress(biz.address || '');
    setFormLat(biz.lat ?? null);
    setFormLng(biz.lng ?? null);
    setPhone(biz.phone || '');
    setTelegram(biz.telegram || '');
    setWebsite(biz.website || '');
    setPriceFrom(biz.price_from ? String(biz.price_from) : '');
    setAmenities(Array.isArray(biz.amenities) ? biz.amenities : []);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!user || !name.trim()) {
      toast({ title: t('partner.enter_name'), variant: 'destructive' });
      return;
    }
    setSaving(true);

    const payload = {
      name: name.trim(), business_type: businessType,
      sub_category: subCategory || null, description: description || null,
      address: address || null, phone: phone || null, telegram: telegram || null,
      website: website || null, price_from: priceFrom ? parseInt(priceFrom) : 0,
      amenities: amenities,
      ...(formLat !== null && formLng !== null ? { lat: formLat, lng: formLng } : {}),
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('locations').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('locations').insert({ ...payload, owner_id: user.id }));
    }

    setSaving(false);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingId ? 'Данные обновлены' : t('partner.biz_added') });
      setShowForm(false);
      resetForm();
      fetchBusinesses();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Компания удалена' });
      setBusinesses(prev => prev.filter(b => b.id !== id));
      setDeleteConfirmId(null);
    }
  };

  const selectedCat = categories.find(c => {
    const typeMap: Record<string, string> = {
      'Медицина': 'medical', 'Красота': 'beauty', 'Туры': 'tour',
      'Кофейни': 'cafe', 'Магазины': 'retail', 'Услуги': 'service',
    };
    return typeMap[c.name] === businessType;
  });

  const typeOptions = categories.map(c => {
    const typeMap: Record<string, string> = {
      'Медицина': 'medical', 'Красота': 'beauty', 'Туры': 'tour',
      'Кофейни': 'cafe', 'Магазины': 'retail', 'Услуги': 'service',
    };
    return { value: typeMap[c.name] || c.name.toLowerCase(), label: `${c.icon} ${c.name}` };
  });

  return (
    <PartnerLayout title={t('partner.services')} headerRight={
      <motion.button whileTap={{ scale: 0.95 }} onClick={() => { if (showForm && editingId) { setShowForm(false); resetForm(); } else { resetForm(); setShowForm(!showForm); } }}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium">
        {showForm ? <><X className="w-4 h-4" /> Отмена</> : <><Plus className="w-4 h-4" /> {t('partner.add')}</>}
      </motion.button>
    }>
      <div className="px-4">

        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4 mb-6 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{editingId ? 'Редактирование' : t('partner.new_biz')}</h3>
            <input placeholder={t('partner.name_placeholder')} value={name} onChange={e => setName(e.target.value)}
              className="w-full glass rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors" />
            <select value={businessType} onChange={e => { setBusinessType(e.target.value); setSubCategory(''); }}
              className="w-full glass rounded-xl px-3 py-2.5 text-sm text-foreground bg-background border border-border focus:border-primary outline-none">
              {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {selectedCat?.subcategories && selectedCat.subcategories.length > 0 && (
              <select value={subCategory} onChange={e => setSubCategory(e.target.value)}
                className="w-full glass rounded-xl px-3 py-2.5 text-sm text-foreground bg-background border border-border focus:border-primary outline-none">
                <option value="">Подкатегория</option>
                {selectedCat.subcategories.map((sc: any) => <option key={sc.id} value={sc.id}>{sc.icon || ''} {sc.name}</option>)}
              </select>
            )}
            <textarea placeholder={t('partner.desc_placeholder')} value={description} onChange={e => setDescription(e.target.value)}
              className="w-full glass rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors min-h-[60px] resize-none" />
            <AddressPicker
              address={address}
              lat={formLat}
              lng={formLng}
              onAddressChange={(addr, lat, lng) => { setAddress(addr); setFormLat(lat); setFormLng(lng); }}
            />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder={t('edit.phone')} value={phone} onChange={e => setPhone(e.target.value)}
                className="glass rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors" />
              <input placeholder="Telegram @" value={telegram} onChange={e => setTelegram(e.target.value)}
                className="glass rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors" />
            </div>
            <input placeholder={t('partner.website_placeholder')} value={website} onChange={e => setWebsite(e.target.value)}
              className="w-full glass rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors" />
            <input type="number" placeholder={t('partner.price_placeholder')} value={priceFrom} onChange={e => setPriceFrom(e.target.value)}
              className="w-full glass rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors" />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{t('partner.amenities')}</p>
              <div className="flex flex-wrap gap-2">
                {amenitiesList.map(a => (
                  <button key={a.id} onClick={() => setAmenities(prev => prev.includes(a.id) ? prev.filter(x => x !== a.id) : [...prev, a.id])}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${amenities.includes(a.id) ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground'}`}>
                    {a.icon} {a.label}
                  </button>
                ))}
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? t('common.loading') : t('edit.save')}
            </motion.button>
          </motion.div>
        )}

        {businesses.length === 0 && !showForm && (
          <div className="text-center py-16 text-muted-foreground">
            <List className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('partner.no_services')}</p>
            <p className="text-xs mt-1">{t('partner.services_hint')}</p>
          </div>
        )}

        <div className="space-y-3">
          {businesses.map((biz, i) => (
            <motion.div key={biz.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{biz.name}</h3>
                <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{biz.business_type}</span>
              </div>
              {biz.address && <p className="text-xs text-muted-foreground mt-1">{biz.address}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {biz.phone && <span>📞 {biz.phone}</span>}
                {biz.telegram && <span>✈️ @{biz.telegram}</span>}
              </div>

              {/* Edit / Delete buttons */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => openEditForm(biz)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Редактировать
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setDeleteConfirmId(biz.id)}
                  className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Удалить
                </motion.button>
              </div>

              {/* Delete confirmation */}
              {deleteConfirmId === biz.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <p className="text-xs text-foreground font-medium mb-2">Вы уверены что хотите удалить «{biz.name}»?</p>
                  <p className="text-[10px] text-muted-foreground mb-3">Все связанные услуги, записи и данные будут потеряны.</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(biz.id)}
                      className="flex-1 py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold">
                      Да, удалить
                    </button>
                    <button onClick={() => setDeleteConfirmId(null)}
                      className="flex-1 py-2 rounded-lg bg-secondary text-foreground text-xs font-medium">
                      Отмена
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
      </div>
    </PartnerLayout>
  );
};

export default PartnerServices;
