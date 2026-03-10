import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, UserCog, Plus, Trash2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '@/hooks/usePreferences';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import PartnerLayout from '@/components/partner/PartnerLayout';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

interface StaffMember {
  id: string;
  full_name: string;
  photo_url: string | null;
  specialties: string[] | null;
  working_hours: Record<string, { start: string; end: string }> | null;
  location_id: string;
}

const DAY_LABELS: Record<string, { ru: string; uz: string; en: string }> = {
  monday: { ru: 'Понедельник', uz: 'Dushanba', en: 'Monday' },
  tuesday: { ru: 'Вторник', uz: 'Seshanba', en: 'Tuesday' },
  wednesday: { ru: 'Среда', uz: 'Chorshanba', en: 'Wednesday' },
  thursday: { ru: 'Четверг', uz: 'Payshanba', en: 'Thursday' },
  friday: { ru: 'Пятница', uz: 'Juma', en: 'Friday' },
  saturday: { ru: 'Суббота', uz: 'Shanba', en: 'Saturday' },
  sunday: { ru: 'Воскресенье', uz: 'Yakshanba', en: 'Sunday' },
};
const DAY_KEYS = Object.keys(DAY_LABELS);

const HOURS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

const PartnerStaff = () => {
  const navigate = useNavigate();
  const { t, lang } = usePreferences();
  const { user } = useAuth();
  const { toast } = useToast();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSpecialties, setNewSpecialties] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [scheduleOpenId, setScheduleOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const { data: locs } = await supabase.from('locations').select('id, name').eq('owner_id', user.id);
    setLocations(locs || []);
    const locIds = (locs || []).map(l => l.id);

    if (locIds.length > 0) {
      const { data } = await supabase.from('staff').select('*').in('location_id', locIds).order('created_at');
      setStaff((data as any[]) || []);
    } else {
      setStaff([]);
    }
    setLoading(false);
  };

  const addStaff = async () => {
    if (!newName.trim() || !selectedLocation) return;
    setSaving(true);
    const specs = newSpecialties.split(',').map(s => s.trim()).filter(Boolean);
    const { error } = await supabase.from('staff').insert({
      location_id: selectedLocation,
      full_name: newName.trim(),
      specialties: specs.length > 0 ? specs : null,
      working_hours: null,
    });
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Сотрудник добавлен' });
      setShowAdd(false);
      setNewName('');
      setNewSpecialties('');
      fetchData();
    }
    setSaving(false);
  };

  const deleteStaff = async (id: string) => {
    await supabase.from('staff').delete().eq('id', id);
    fetchData();
  };

  const updateSchedule = async (staffId: string, newHours: Record<string, { start: string; end: string }> | null) => {
    const finalHours = newHours && Object.keys(newHours).length > 0 ? newHours : null;
    const { error } = await supabase.from('staff').update({ working_hours: finalHours }).eq('id', staffId);
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      setStaff(prev => prev.map(s => s.id === staffId ? { ...s, working_hours: finalHours } : s));
    }
  };

  const toggleDay = (s: StaffMember, day: string) => {
    const wh = { ...(s.working_hours || {}) };
    if (wh[day]) {
      delete wh[day];
    } else {
      wh[day] = { start: '09:00', end: '18:00' };
    }
    updateSchedule(s.id, wh);
  };

  const setDayTime = (s: StaffMember, day: string, field: 'start' | 'end', value: string) => {
    const wh = { ...(s.working_hours || {}) };
    if (!wh[day]) wh[day] = { start: '09:00', end: '18:00' };
    wh[day] = { ...wh[day], [field]: value };
    updateSchedule(s.id, wh);
  };

  return (
    <PartnerLayout title={t('partner.staff')} headerRight={
      locations.length > 0 ? (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { setShowAdd(true); if (locations.length === 1) setSelectedLocation(locations[0].id); }}
          className="flex items-center gap-1 bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-medium"
        >
          <Plus className="w-3.5 h-3.5" /> Добавить
        </motion.button>
      ) : undefined
    }>
      <div className="px-4">

        {/* Add form */}
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4 mb-4 border border-border space-y-3">
            {locations.length > 1 && (
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 text-sm"
              >
                <option value="">Выберите локацию</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            )}
            <input
              placeholder="Имя специалиста *"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2.5 text-sm placeholder:text-muted-foreground outline-none focus:border-primary"
            />
            <input
              placeholder="Специализации (через запятую)"
              value={newSpecialties}
              onChange={e => setNewSpecialties(e.target.value)}
              className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2.5 text-sm placeholder:text-muted-foreground outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              <button
                onClick={addStaff}
                disabled={saving || !newName.trim() || !selectedLocation}
                className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium disabled:opacity-50"
              >
                {saving ? '...' : 'Сохранить'}
              </button>
              <button onClick={() => setShowAdd(false)} className="px-4 text-sm text-muted-foreground">
                Отмена
              </button>
            </div>
          </motion.div>
        )}

        {/* Staff list */}
        {loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Загрузка...</div>
        ) : locations.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <UserCog className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Сначала добавьте бизнес</p>
            <button onClick={() => navigate('/partner/services')} className="mt-2 text-xs text-primary underline">
              Перейти в «Мои услуги» →
            </button>
          </div>
        ) : staff.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <UserCog className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('partner.no_staff')}</p>
            <p className="text-xs mt-1">{t('partner.staff_hint')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {staff.map(s => {
              const scheduleOpen = scheduleOpenId === s.id;
              const hasHours = s.working_hours && Object.keys(s.working_hours).length > 0;
              return (
                <div key={s.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  {/* Staff row */}
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground flex-shrink-0">
                      {s.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.full_name}</p>
                      {s.specialties && s.specialties.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate">{s.specialties.join(', ')}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setScheduleOpenId(scheduleOpen ? null : s.id)}
                        className={`p-2 rounded-lg transition-colors ${scheduleOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
                      >
                        <Clock className="w-4 h-4" />
                        {scheduleOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteStaff(s.id)}
                        className="p-2 text-destructive/60 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Schedule status badge */}
                  {!scheduleOpen && (
                    <div className="px-3 pb-2">
                      {hasHours ? (
                        <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          ✓ График настроен
                        </span>
                      ) : (
                        <span className="text-[10px] text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                          ⚠ График не настроен
                        </span>
                      )}
                    </div>
                  )}

                  {/* Schedule editor */}
                  {scheduleOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="border-t border-border bg-muted/30 p-3 space-y-2"
                    >
                      <p className="text-xs font-medium text-foreground mb-2">Рабочие часы</p>
                      {DAY_KEYS.map(day => {
                        const dayData = s.working_hours?.[day];
                        const enabled = !!dayData;
                        return (
                          <div key={day} className="flex items-center gap-2">
                            <Switch
                              checked={enabled}
                              onCheckedChange={() => toggleDay(s, day)}
                              className="scale-75"
                            />
                            <span className="w-20 text-xs text-foreground">
                              {DAY_LABELS[day][lang as keyof typeof DAY_LABELS[typeof day]] || DAY_LABELS[day].ru}
                            </span>
                            {enabled ? (
                              <div className="flex items-center gap-1">
                                <select
                                  value={dayData!.start}
                                  onChange={e => setDayTime(s, day, 'start', e.target.value)}
                                  className="rounded border border-border bg-background text-foreground px-1.5 py-1 text-xs"
                                >
                                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                                <span className="text-xs text-muted-foreground">—</span>
                                <select
                                  value={dayData!.end}
                                  onChange={e => setDayTime(s, day, 'end', e.target.value)}
                                  className="rounded border border-border bg-background text-foreground px-1.5 py-1 text-xs"
                                >
                                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Выходной</span>
                            )}
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <PartnerBottomNav />
    </div>
  );
};

export default PartnerStaff;
