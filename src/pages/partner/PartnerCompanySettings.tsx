import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Clock, Users, Plus, Trash2, X, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { supabase } from '@/integrations/supabase/client';
import PartnerLayout from '@/components/partner/PartnerLayout';
import BusinessPhotoUpload from '@/components/BusinessPhotoUpload';
import AddressPicker from '@/components/AddressPicker';
import BusinessLinkSection from '@/components/partner/BusinessLinkSection';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const tourInclusions = [
  { id: 'transport', label: 'Транспорт', icon: '🚌' },
  { id: 'food', label: 'Питание', icon: '🍽️' },
  { id: 'hotel', label: 'Проживание', icon: '🏨' },
  { id: 'tickets', label: 'Входные билеты', icon: '🎫' },
  { id: 'photographer', label: 'Фотограф', icon: '📸' },
];

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
    // Tour-specific
    max_seats: '', tour_program: '', inclusions: [] as string[], duration_days: '1',
    meeting_point: '', meeting_point_lat: null as number | null, meeting_point_lng: null as number | null,
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

  const loadStaff = async () => {
    if (!businesses.length) return;
    const ids = businesses.map(b => b.id);
    const { data } = await supabase.from('staff').select('*').in('location_id', ids).order('created_at', { ascending: false });
    setStaff(data || []);
  };

  useEffect(() => { if (activeTab === 'team' && businesses.length) loadStaff(); }, [activeTab, businesses]);

  // Check if current location is a tour business
  const currentBiz = businesses.find(b => b.id === form.location_id);
  const isTourBiz = currentBiz?.business_type === 'tour';

  const handleSave = async () => {
    if (!form.name || !form.price || !form.location_id) { toast.error('Заполните обязательные поля'); return; }
    setSaving(true);

    const tourMetadata = isTourBiz ? {
      tour_program: form.tour_program || null,
      inclusions: form.inclusions,
      duration_days: Number(form.duration_days) || 1,
      meeting_point: form.meeting_point || null,
      meeting_point_lat: form.meeting_point_lat,
      meeting_point_lng: form.meeting_point_lng,
    } : {};

    const { error } = await supabase.from('services').insert({
      name: form.name,
      price: Number(form.price),
      currency: form.currency,
      duration_minutes: Number(form.duration_minutes) || 30,
      description: form.description || null,
      location_id: form.location_id,
      max_seats: isTourBiz && form.max_seats ? Number(form.max_seats) : null,
      metadata: tourMetadata,
    } as any);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isTourBiz ? 'Тур добавлен' : 'Услуга добавлена');
    setForm({ name: '', price: '', currency: 'сум', duration_minutes: '30', description: '', location_id: businesses[0]?.id || '',
      max_seats: '', tour_program: '', inclusions: [], duration_days: '1', meeting_point: '', meeting_point_lat: null, meeting_point_lng: null });
    setShowForm(false);
    loadServices();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Услуга удалена');
    setServices(s => s.filter(x => x.id !== id));
  };

  const handleSaveStaff = async () => {
    if (!staffForm.full_name || !staffForm.location_id) { toast.error('Заполните обязательные поля'); return; }
    setSaving(true);
    const { error } = await supabase.from('staff').insert({
      full_name: staffForm.full_name,
      phone: staffForm.phone || null,
      specialties: staffForm.specialties ? staffForm.specialties.split(',').map(s => s.trim()) : null,
      location_id: staffForm.location_id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Сотрудник добавлен');
    setStaffForm({ full_name: '', phone: '', specialties: '', location_id: businesses[0]?.id || '' });
    setShowStaffForm(false);
    loadStaff();
  };

  const handleDeleteStaff = async (id: string) => {
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Сотрудник удалён');
    setStaff(s => s.filter(x => x.id !== id));
  };

  return (
    <PartnerLayout title={t('partner.company_profile')}>
      <div className="px-4">

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
                <div key={biz.id} className="glass rounded-2xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">{biz.name}</h3>
                  <p className="text-xs text-muted-foreground">{biz.description || t('partner.no_desc')}</p>
                  {biz.address && <p className="text-xs text-muted-foreground">📍 {biz.address}</p>}
                  {biz.phone && <p className="text-xs text-muted-foreground">📞 {biz.phone}</p>}

                  {/* Photo Upload Section */}
                  <div className="pt-2 border-t border-border">
                    <BusinessPhotoUpload
                      locationId={biz.id}
                      brandedIconUrl={biz.branded_icon_url}
                      gallery={biz.gallery}
                      onUpdate={(fields) => {
                        setBusinesses(prev => prev.map(b => b.id === biz.id ? { ...b, ...fields } : b));
                      }}
                    />
                  </div>

                  {/* Queue toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div>
                      <p className="text-xs font-medium text-foreground">Живая очередь</p>
                      <p className="text-[10px] text-muted-foreground">Клиенты смогут брать талон</p>
                    </div>
                    <button
                      onClick={async () => {
                        const newVal = !biz.queue_enabled;
                        await supabase.from('locations').update({ queue_enabled: newVal }).eq('id', biz.id);
                        setBusinesses(prev => prev.map(b => b.id === biz.id ? { ...b, queue_enabled: newVal } : b));
                        toast.success(newVal ? 'Очередь включена' : 'Очередь выключена');
                      }}
                      className={`w-11 h-6 rounded-full transition-colors relative ${biz.queue_enabled ? 'bg-primary' : 'bg-muted'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${biz.queue_enabled ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                  </div>
                  {/* Business Link Section */}
                  <BusinessLinkSection
                    locationId={biz.id}
                    locationName={biz.name}
                    businessType={biz.business_type}
                    rating={biz.rating}
                    reviewCount={biz.review_count}
                    priceFrom={biz.price_from}
                    currency={biz.currency}
                  />
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
                    <input placeholder={isTourBiz ? "Название тура *" : "Название услуги *"} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
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
                    {!isTourBiz && (
                      <input placeholder="Длительность (мин)" type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                        className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                    )}
                    {businesses.length > 1 && (
                      <select value={form.location_id} onChange={e => setForm(f => ({ ...f, location_id: e.target.value }))}
                        className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                        {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    )}
                    <textarea placeholder="Описание (необязательно)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none h-16" />

                    {/* Tour-specific fields */}
                    {isTourBiz && (
                      <>
                        <div className="border-t border-border pt-3">
                          <p className="text-xs font-semibold text-foreground mb-2">🏔️ Параметры тура</p>
                        </div>
                        <div className="flex gap-2">
                          <input placeholder="Мест в группе" type="number" value={form.max_seats} onChange={e => setForm(f => ({ ...f, max_seats: e.target.value }))}
                            className="flex-1 bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                          <select value={form.duration_days} onChange={e => setForm(f => ({ ...f, duration_days: e.target.value }))}
                            className="flex-1 bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                            {[1,2,3,4,5,6,7,10,14].map(d => (
                              <option key={d} value={String(d)}>{d} {d === 1 ? 'день' : d < 5 ? 'дня' : 'дней'}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Программа тура</p>
                          <textarea placeholder={"День 1: Выезд из Ташкента...\nДень 2: Осмотр достопримечательностей..."} value={form.tour_program}
                            onChange={e => setForm(f => ({ ...f, tour_program: e.target.value }))}
                            className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none h-24" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Что включено</p>
                          <div className="flex flex-wrap gap-2">
                            {tourInclusions.map(inc => (
                              <button key={inc.id} type="button"
                                onClick={() => setForm(f => ({
                                  ...f, inclusions: f.inclusions.includes(inc.id)
                                    ? f.inclusions.filter(x => x !== inc.id)
                                    : [...f.inclusions, inc.id]
                                }))}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                                  form.inclusions.includes(inc.id) ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground'
                                }`}>
                                {inc.icon} {inc.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">📍 Точка сбора</p>
                          <AddressPicker
                            address={form.meeting_point}
                            lat={form.meeting_point_lat}
                            lng={form.meeting_point_lng}
                            onAddressChange={(addr, lat, lng) => setForm(f => ({ ...f, meeting_point: addr, meeting_point_lat: lat, meeting_point_lng: lng }))}
                          />
                        </div>
                      </>
                    )}

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
                  services.map(svc => {
                    const meta = svc.metadata || {};
                    const svcBiz = businesses.find((b: any) => b.id === svc.location_id);
                    const svcIsTour = svcBiz?.business_type === 'tour';
                    return (
                    <motion.div key={svc.id} layout className="glass rounded-2xl p-4 flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">{svc.name}</h3>
                        {svc.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{svc.description}</p>}
                        <div className="flex gap-3 mt-1.5 flex-wrap">
                          <span className="text-xs font-medium text-primary">{svc.price.toLocaleString()} {svc.currency}</span>
                          {svcIsTour && meta.duration_days ? (
                            <span className="text-xs text-muted-foreground">🏔️ {meta.duration_days} {meta.duration_days === 1 ? 'день' : meta.duration_days < 5 ? 'дня' : 'дней'}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">{svc.duration_minutes} мин</span>
                          )}
                          {svcIsTour && svc.max_seats && <span className="text-xs text-muted-foreground">👥 {svc.max_seats} мест</span>}
                        </div>
                        {svcIsTour && meta.inclusions?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {meta.inclusions.map((inc: string) => {
                              const icons: Record<string, string> = { transport: '🚌', food: '🍽️', hotel: '🏨', tickets: '🎫', photographer: '📸' };
                              return <span key={inc} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-md">{icons[inc] || inc}</span>;
                            })}
                          </div>
                        )}
                        {svc.locations?.name && <p className="text-[10px] text-muted-foreground mt-1">📍 {svc.locations.name}</p>}
                      </div>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(svc.id)}
                        className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                    );
                  })
                )}
              </>
            )}
          </div>
        )}

        {/* Team */}
        {activeTab === 'team' && (
          <div className="space-y-3">
            {businesses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Сначала добавьте бизнес во вкладке «О компании»</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">{staff.length} сотрудников</p>
                  <Button size="sm" onClick={() => setShowStaffForm(!showStaffForm)} variant={showStaffForm ? 'secondary' : 'default'} className="gap-1 text-xs">
                    {showStaffForm ? <><X className="w-3.5 h-3.5" /> Отмена</> : <><Plus className="w-3.5 h-3.5" /> Добавить</>}
                  </Button>
                </div>

                {showStaffForm && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4 space-y-3">
                    <input placeholder="Имя и фамилия *" value={staffForm.full_name} onChange={e => setStaffForm(f => ({ ...f, full_name: e.target.value }))}
                      className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                    <input placeholder="Телефон" type="tel" value={staffForm.phone} onChange={e => setStaffForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                    <input placeholder="Специальности (через запятую)" value={staffForm.specialties} onChange={e => setStaffForm(f => ({ ...f, specialties: e.target.value }))}
                      className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                    {businesses.length > 1 && (
                      <select value={staffForm.location_id} onChange={e => setStaffForm(f => ({ ...f, location_id: e.target.value }))}
                        className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                        <option value="">Выберите бизнес</option>
                        {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    )}
                    {businesses.length === 1 && (
                      <input type="hidden" value={staffForm.location_id || businesses[0]?.id || ''} onChange={e => setStaffForm(f => ({ ...f, location_id: e.target.value }))} />
                    )}
                    <Button onClick={() => {
                      if (businesses.length === 1 && !staffForm.location_id) {
                        setStaffForm(f => ({ ...f, location_id: businesses[0].id }));
                      }
                      handleSaveStaff();
                    }} disabled={saving} className="w-full">{saving ? 'Сохранение...' : 'Сохранить'}</Button>
                  </motion.div>
                )}

                {staff.length === 0 && !showStaffForm ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Нет сотрудников</p>
                    <p className="text-xs mt-1">Добавьте первого сотрудника</p>
                  </div>
                ) : (
                  staff.map(member => (
                    <motion.div key={member.id} layout className="glass rounded-2xl p-4 flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground">{member.full_name}</h3>
                        {member.phone && <p className="text-xs text-muted-foreground mt-0.5">📞 {member.phone}</p>}
                        {member.specialties && member.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {member.specialties.map((spec: string, i: number) => (
                              <span key={i} className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">{spec}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDeleteStaff(member.id)}
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

        {/* Schedule */}
        {activeTab === 'schedule' && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">{t('partner.hours_coming')}</p>
            <p className="text-xs mt-1">{t('partner.hours_hint')}</p>
          </div>
      </div>
    </PartnerLayout>
  );
};

export default PartnerCompanySettings;
