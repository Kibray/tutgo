import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Clock, Users, Plus, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const tabs = [
  { id: 'about', labelKey: 'partner.tab_about', icon: Building2 },
  { id: 'pricelist', labelKey: 'partner.tab_pricelist', icon: Clock },
  { id: 'team', labelKey: 'partner.tab_team', icon: Users },
  { id: 'schedule', labelKey: 'partner.tab_schedule', icon: Clock },
];

const PartnerCompanySettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = usePreferences();
  const [activeTab, setActiveTab] = useState('about');
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', price: '', currency: 'сум', duration_minutes: '30', description: '', location_id: '',
  });
  const [staffForm, setStaffForm] = useState({
    full_name: '', phone: '', specialties: '', location_id: '',
  });

  useEffect(() => {
    if (!user) return;
    supabase.from('locations').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => {
        setBusinesses(data || []);
        if (data?.length && !form.location_id) {
          setForm(f => ({ ...f, location_id: data[0].id }));
        }
      });
  }, [user]);

  const loadServices = async () => {
    if (!businesses.length) return;
    const ids = businesses.map(b => b.id);
    const { data } = await supabase.from('services').select('*, locations(name)').in('location_id', ids).order('created_at', { ascending: false });
    setServices(data || []);
  };

  useEffect(() => { if (activeTab === 'pricelist' && businesses.length) loadServices(); }, [activeTab, businesses]);

  const handleSave = async () => {
    if (!form.name || !form.price || !form.location_id) { toast.error('Заполните обязательные поля'); return; }
    setSaving(true);
    const { error } = await supabase.from('services').insert({
      name: form.name,
      price: Number(form.price),
      currency: form.currency,
      duration_minutes: Number(form.duration_minutes) || 30,
      description: form.description || null,
      location_id: form.location_id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Услуга добавлена');
    setForm({ name: '', price: '', currency: 'сум', duration_minutes: '30', description: '', location_id: businesses[0]?.id || '' });
    setShowForm(false);
    loadServices();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Услуга удалена');
    setServices(s => s.filter(x => x.id !== id));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/partner')}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold font-display text-foreground">{t('partner.company_profile')}</h1>
        </div>

        <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mb-6 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        {/* About */}
        {activeTab === 'about' && (
          <div className="space-y-3">
            {businesses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">{t('partner.no_services')}</p>
                <p className="text-xs mt-1">{t('partner.add_in_services')}</p>
              </div>
            ) : (
              businesses.map(biz => (
                <div key={biz.id} className="glass rounded-2xl p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">{biz.name}</h3>
                  <p className="text-xs text-muted-foreground">{biz.description || t('partner.no_desc')}</p>
                  {biz.address && <p className="text-xs text-muted-foreground">📍 {biz.address}</p>}
                  {biz.phone && <p className="text-xs text-muted-foreground">📞 {biz.phone}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {/* Pricelist */}
        {activeTab === 'pricelist' && (
          <div className="space-y-3">
            {businesses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">Сначала добавьте бизнес во вкладке «Услуги»</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">{services.length} услуг</p>
                  <Button size="sm" onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'default'} className="gap-1 text-xs">
                    {showForm ? <><X className="w-3.5 h-3.5" /> Отмена</> : <><Plus className="w-3.5 h-3.5" /> Добавить</>}
                  </Button>
                </div>

                {showForm && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4 space-y-3">
                    <input placeholder="Название услуги *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                    <div className="flex gap-2">
                      <input placeholder="Цена *" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                        className="flex-1 bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                      <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                        className="bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                        <option value="сум">сум</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                    <input placeholder="Длительность (мин)" type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                      className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                    {businesses.length > 1 && (
                      <select value={form.location_id} onChange={e => setForm(f => ({ ...f, location_id: e.target.value }))}
                        className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                        {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    )}
                    <textarea placeholder="Описание (необязательно)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none h-16" />
                    <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? 'Сохранение...' : 'Сохранить'}</Button>
                  </motion.div>
                )}

                {services.length === 0 && !showForm ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Нет услуг</p>
                    <p className="text-xs mt-1">Добавьте первую услугу</p>
                  </div>
                ) : (
                  services.map(svc => (
                    <motion.div key={svc.id} layout className="glass rounded-2xl p-4 flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">{svc.name}</h3>
                        {svc.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{svc.description}</p>}
                        <div className="flex gap-3 mt-1.5">
                          <span className="text-xs font-medium text-primary">{svc.price.toLocaleString()} {svc.currency}</span>
                          <span className="text-xs text-muted-foreground">{svc.duration_minutes} мин</span>
                        </div>
                        {svc.locations?.name && <p className="text-[10px] text-muted-foreground mt-1">📍 {svc.locations.name}</p>}
                      </div>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(svc.id)}
                        className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  ))
                )}
              </>
            )}
          </div>
        )}

        {/* Team */}
        {activeTab === 'team' && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('partner.no_staff')}</p>
            <p className="text-xs mt-1">{t('partner.staff_hint')}</p>
          </div>
        )}

        {/* Schedule */}
        {activeTab === 'schedule' && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">{t('partner.hours_coming')}</p>
            <p className="text-xs mt-1">{t('partner.hours_hint')}</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default PartnerCompanySettings;
