import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Clock, Users, Plus, Trash2, X, MapPin, Globe, Calendar } from 'lucide-react';
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
  { id: 'guide', label: 'Гид', icon: '🧭' },
];

const tourCategories = [
  { id: 'history', label: 'История' },
  { id: 'nature', label: 'Природа' },
  { id: 'relax', label: 'Отдых' },
  { id: 'mountain', label: 'Горы' },
  { id: 'culture', label: 'Культура' },
];

const baseTabs = [
  { id: 'about', labelKey: 'partner.tab_about', icon: Building2 },
  { id: 'pricelist', labelKey: 'partner.tab_pricelist', icon: Clock },
  { id: 'team', labelKey: 'partner.tab_team', icon: Users },
  { id: 'schedule', labelKey: 'partner.tab_schedule', icon: Clock },
];

const parseProgramText = (text: string) => {
  return text.split('\n').filter(l => l.trim()).map((line, i) => {
    const match = line.match(/^День\s*(\d+)\s*:\s*(.+)/i);
    if (match) return { day: Number(match[1]), title: match[2].trim(), description: '' };
    return { day: i + 1, title: line.trim(), description: '' };
  });
};

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

  // Tours tab state
  const [tours, setTours] = useState<any[]>([]);
  const [showTourForm, setShowTourForm] = useState(false);
  const [savingTour, setSavingTour] = useState(false);
  const [destInput, setDestInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [tourForm, setTourForm] = useState({
    title: '', description: '', departure_city: 'Ташкент', destinations: [] as string[],
    duration_days: '1', price_per_person: '', price_child: '', min_people: '1', max_people: '',
    category: 'nature', includes: [] as string[], excludes: '', program: '',
    available_dates: [] as string[], is_active: true, location_id: '',
  });

  const hasTourBiz = businesses.some(b => b.business_type === 'tour');

  const tabs = useMemo(() => {
    const t = [...baseTabs];
    if (hasTourBiz) {
      t.push({ id: 'tours', labelKey: '🌍 Туры', icon: Globe });
    }
    return t;
  }, [hasTourBiz]);

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

  const loadTours = async () => {
    const tourLocIds = businesses.filter(b => b.business_type === 'tour').map(b => b.id);
    if (!tourLocIds.length) return;
    const { data } = await supabase.from('tours').select('*').in('location_id', tourLocIds).order('created_at', { ascending: false });
    setTours(data || []);
  };

  useEffect(() => { if (activeTab === 'tours' && businesses.length) loadTours(); }, [activeTab, businesses]);

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

  // Tours CRUD
  const tourLocations = businesses.filter(b => b.business_type === 'tour');

  const handleSaveTour = async () => {
    const locId = tourForm.location_id || tourLocations[0]?.id;
    if (!tourForm.title || !tourForm.price_per_person || !locId) {
      toast.error('Заполните обязательные поля'); return;
    }
    setSavingTour(true);
    const priceAdult = Number(tourForm.price_per_person);
    const { error } = await supabase.from('tours').insert({
      location_id: locId,
      title: tourForm.title,
      description: tourForm.description || null,
      departure_city: tourForm.departure_city || 'Ташкент',
      destinations: tourForm.destinations.length ? tourForm.destinations : null,
      duration_days: Number(tourForm.duration_days) || 1,
      price_per_person: priceAdult,
      price_child: tourForm.price_child ? Number(tourForm.price_child) : Math.round(priceAdult * 0.7),
      min_people: Number(tourForm.min_people) || 1,
      max_people: Number(tourForm.max_people) || 20,
      category: tourForm.category,
      includes: tourForm.includes.length ? tourForm.includes : null,
      excludes: tourForm.excludes ? tourForm.excludes.split('\n').filter(l => l.trim()) : null,
      program: tourForm.program ? parseProgramText(tourForm.program) : null,
      available_dates: tourForm.available_dates.length ? tourForm.available_dates : null,
      is_active: tourForm.is_active,
      rating: 0,
      reviews_count: 0,
    } as any);
    setSavingTour(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Тур создан');
    setTourForm({
      title: '', description: '', departure_city: 'Ташкент', destinations: [],
      duration_days: '1', price_per_person: '', price_child: '', min_people: '1', max_people: '',
      category: 'nature', includes: [], excludes: '', program: '',
      available_dates: [], is_active: true, location_id: '',
    });
    setShowTourForm(false);
    loadTours();
  };

  const handleToggleTourActive = async (tourId: string, current: boolean) => {
    await supabase.from('tours').update({ is_active: !current }).eq('id', tourId);
    setTours(prev => prev.map(t => t.id === tourId ? { ...t, is_active: !current } : t));
    toast.success(!current ? 'Тур активирован' : 'Тур скрыт');
  };

  const handleDeleteTour = async (tourId: string) => {
    const { error } = await supabase.from('tours').delete().eq('id', tourId);
    if (error) { toast.error(error.message); return; }
    toast.success('Тур удалён');
    setTours(prev => prev.filter(t => t.id !== tourId));
  };

  const addDestination = () => {
    if (!destInput.trim()) return;
    setTourForm(f => ({ ...f, destinations: [...f.destinations, destInput.trim()] }));
    setDestInput('');
  };

  const removeDestination = (idx: number) => {
    setTourForm(f => ({ ...f, destinations: f.destinations.filter((_, i) => i !== idx) }));
  };

  const addAvailableDate = () => {
    if (!dateInput || tourForm.available_dates.includes(dateInput)) return;
    setTourForm(f => ({ ...f, available_dates: [...f.available_dates, dateInput].sort() }));
    setDateInput('');
  };

  const removeDate = (d: string) => {
    setTourForm(f => ({ ...f, available_dates: f.available_dates.filter(x => x !== d) }));
  };

  return (
    <PartnerLayout title={t('partner.company_profile')}>
      <div className="px-4 pt-2">

        <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mb-6 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              {tab.id === 'tours' ? '🌍 Туры' : t(tab.labelKey)}
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
        )}

        {/* Tours */}
        {activeTab === 'tours' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">{tours.length} туров</p>
              <Button size="sm" onClick={() => setShowTourForm(!showTourForm)} variant={showTourForm ? 'secondary' : 'default'} className="gap-1 text-xs">
                {showTourForm ? <><X className="w-3.5 h-3.5" /> Отмена</> : <><Plus className="w-3.5 h-3.5" /> Создать тур</>}
              </Button>
            </div>

            {showTourForm && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4 space-y-3">
                <input placeholder="Название тура *" value={tourForm.title} onChange={e => setTourForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                <textarea placeholder="Описание тура" value={tourForm.description} onChange={e => setTourForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none h-16" />

                {tourLocations.length > 1 && (
                  <select value={tourForm.location_id || tourLocations[0]?.id} onChange={e => setTourForm(f => ({ ...f, location_id: e.target.value }))}
                    className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                    {tourLocations.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                )}

                <input placeholder="Город отправления" value={tourForm.departure_city} onChange={e => setTourForm(f => ({ ...f, departure_city: e.target.value }))}
                  className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />

                {/* Destinations */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Направления</p>
                  <div className="flex gap-2">
                    <input placeholder="Добавить город" value={destInput} onChange={e => setDestInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDestination())}
                      className="flex-1 bg-secondary/50 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                    <Button size="sm" variant="secondary" onClick={addDestination} type="button"><Plus className="w-3.5 h-3.5" /></Button>
                  </div>
                  {tourForm.destinations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tourForm.destinations.map((d, i) => (
                        <span key={i} className="text-xs bg-secondary px-2 py-1 rounded-lg flex items-center gap-1">
                          {d} <button onClick={() => removeDestination(i)} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <select value={tourForm.duration_days} onChange={e => setTourForm(f => ({ ...f, duration_days: e.target.value }))}
                    className="flex-1 bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                    {[1,2,3,4,5,6,7,10,14].map(d => (
                      <option key={d} value={String(d)}>{d} {d === 1 ? 'день' : d < 5 ? 'дня' : 'дней'}</option>
                    ))}
                  </select>
                  <select value={tourForm.category} onChange={e => setTourForm(f => ({ ...f, category: e.target.value }))}
                    className="flex-1 bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                    {tourCategories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>

                <div className="flex gap-2">
                  <input placeholder="Цена взрослый *" type="number" value={tourForm.price_per_person} onChange={e => setTourForm(f => ({ ...f, price_per_person: e.target.value }))}
                    className="flex-1 bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                  <input placeholder="Цена ребёнок" type="number" value={tourForm.price_child} onChange={e => setTourForm(f => ({ ...f, price_child: e.target.value }))}
                    className="flex-1 bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                </div>

                <div className="flex gap-2">
                  <input placeholder="Мин. людей" type="number" value={tourForm.min_people} onChange={e => setTourForm(f => ({ ...f, min_people: e.target.value }))}
                    className="flex-1 bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                  <input placeholder="Макс. людей *" type="number" value={tourForm.max_people} onChange={e => setTourForm(f => ({ ...f, max_people: e.target.value }))}
                    className="flex-1 bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                </div>

                {/* Includes */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Что включено</p>
                  <div className="flex flex-wrap gap-2">
                    {tourInclusions.map(inc => (
                      <button key={inc.id} type="button"
                        onClick={() => setTourForm(f => ({
                          ...f, includes: f.includes.includes(inc.id)
                            ? f.includes.filter(x => x !== inc.id)
                            : [...f.includes, inc.id]
                        }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                          tourForm.includes.includes(inc.id) ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground'
                        }`}>
                        {inc.icon} {inc.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Что не включено</p>
                  <textarea placeholder={"Каждый пункт с новой строки\nЛичные расходы\nСтраховка"} value={tourForm.excludes}
                    onChange={e => setTourForm(f => ({ ...f, excludes: e.target.value }))}
                    className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none h-16" />
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Программа тура</p>
                  <textarea placeholder={"День 1: Выезд из Ташкента\nДень 2: Горный трек\nДень 3: Возвращение"} value={tourForm.program}
                    onChange={e => setTourForm(f => ({ ...f, program: e.target.value }))}
                    className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none h-24" />
                </div>

                {/* Available dates */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Даты вылетов</p>
                  <div className="flex gap-2">
                    <input type="date" value={dateInput} onChange={e => setDateInput(e.target.value)}
                      className="flex-1 bg-secondary/50 rounded-xl px-3 py-2 text-sm text-foreground outline-none" />
                    <Button size="sm" variant="secondary" onClick={addAvailableDate} type="button"><Plus className="w-3.5 h-3.5" /></Button>
                  </div>
                  {tourForm.available_dates.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tourForm.available_dates.map(d => (
                        <span key={d} className="text-xs bg-secondary px-2 py-1 rounded-lg flex items-center gap-1">
                          📅 {d} <button onClick={() => removeDate(d)} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Активен</span>
                  <button onClick={() => setTourForm(f => ({ ...f, is_active: !f.is_active }))}
                    className={`w-11 h-6 rounded-full transition-colors relative ${tourForm.is_active ? 'bg-primary' : 'bg-muted'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${tourForm.is_active ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>

                <Button onClick={handleSaveTour} disabled={savingTour} className="w-full">{savingTour ? 'Сохранение...' : 'Создать тур'}</Button>
              </motion.div>
            )}

            {tours.length === 0 && !showTourForm ? (
              <div className="text-center py-12 text-muted-foreground">
                <Globe className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Нет туров</p>
                <p className="text-xs mt-1">Создайте первый тур — он сразу появится на странице /tours</p>
              </div>
            ) : (
              tours.map(tour => (
                <motion.div key={tour.id} layout className="glass rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">{tour.title}</h3>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        <span className="text-xs font-medium text-primary">{(tour.price_per_person || 0).toLocaleString()} сум</span>
                        {tour.duration_days && (
                          <span className="text-xs text-muted-foreground">🏔️ {tour.duration_days} {tour.duration_days === 1 ? 'день' : tour.duration_days < 5 ? 'дня' : 'дней'}</span>
                        )}
                        {tour.available_dates?.length > 0 && (
                          <span className="text-xs text-muted-foreground">📅 {tour.available_dates.length} дат</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleTourActive(tour.id, tour.is_active)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${tour.is_active ? 'bg-primary' : 'bg-muted'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${tour.is_active ? 'left-[22px]' : 'left-0.5'}`} />
                      </button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDeleteTour(tour.id)}
                        className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </PartnerLayout>
  );
};

export default PartnerCompanySettings;
