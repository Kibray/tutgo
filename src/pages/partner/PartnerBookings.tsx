import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, User, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '@/hooks/usePreferences';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';

interface StaffMember {
  id: string;
  full_name: string;
  photo_url: string | null;
  working_hours: Record<string, { start: string; end: string }> | null;
  location_id: string;
}

interface Appointment {
  id: string;
  staff_id: string | null;
  service_id: string | null;
  client_name: string | null;
  client_phone: string | null;
  start_time: string;
  end_time: string;
  status: string;
  service?: { name: string } | null;
}

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const SLOT_HEIGHT = 48;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const hh = String(Math.floor(m / 60)).padStart(2, '0');
  const mm = String(m % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

const PartnerBookings = () => {
  const navigate = useNavigate();
  const { t } = usePreferences();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const { data: locs } = await supabase.from('locations').select('id').eq('owner_id', user.id);
    const locIds = (locs || []).map(l => l.id);
    setLocations(locIds);

    if (locIds.length === 0) {
      setStaff([]); setAppointments([]); setLoading(false); return;
    }

    const { data: staffData } = await supabase.from('staff').select('id, full_name, photo_url, working_hours, location_id').in('location_id', locIds);
    setStaff((staffData as any[]) || []);

    const dayStart = new Date(selectedDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate); dayEnd.setHours(23, 59, 59, 999);

    const { data: appts } = await supabase
      .from('appointments')
      .select('id, staff_id, service_id, client_name, client_phone, start_time, end_time, status, service:services(name)')
      .in('location_id', locIds)
      .gte('start_time', dayStart.toISOString())
      .lte('start_time', dayEnd.toISOString())
      .neq('status', 'cancelled');
    setAppointments((appts as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user, selectedDate]);

  // Realtime subscription for appointments
  useEffect(() => {
    if (!user || locations.length === 0) return;
    const channel = supabase
      .channel('partner-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' },
        () => fetchData()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, locations, selectedDate]);

  const dayKey = DAY_KEYS[((selectedDate.getDay() + 6) % 7)];

  const { gridStart, gridEnd, hasAnyWorking } = useMemo(() => {
    let minStart = Infinity, maxEnd = -Infinity, any = false;
    staff.forEach(s => {
      const wh = s.working_hours;
      if (!wh || !wh[dayKey]) return;
      any = true;
      const start = timeToMinutes(wh[dayKey].start);
      const end = timeToMinutes(wh[dayKey].end);
      if (start < minStart) minStart = start;
      if (end > maxEnd) maxEnd = end;
    });
    return { gridStart: any ? minStart : 0, gridEnd: any ? maxEnd : 0, hasAnyWorking: any };
  }, [staff, dayKey]);

  const gridSlots = useMemo(() => {
    if (!hasAnyWorking) return [];
    const slots: number[] = [];
    for (let m = gridStart; m < gridEnd; m += 30) slots.push(m);
    return slots;
  }, [gridStart, gridEnd, hasAnyWorking]);

  const isStaffWorking = (s: StaffMember, slotMinutes: number): boolean => {
    const wh = s.working_hours;
    if (!wh || !wh[dayKey]) return false;
    const ds = wh[dayKey];
    return slotMinutes >= timeToMinutes(ds.start) && slotMinutes < timeToMinutes(ds.end);
  };

  const hasSchedule = (s: StaffMember): boolean => s.working_hours !== null && Object.keys(s.working_hours).length > 0;
  const getStaffAppointments = (staffId: string) => appointments.filter(a => a.staff_id === staffId);
  const goDay = (offset: number) => setSelectedDate(prev => addDays(prev, offset));

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const noStaff = staff.length === 0;
  const noScheduleConfigured = staff.length > 0 && staff.every(s => !hasSchedule(s));

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/partner')}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold font-display text-foreground">{t('partner.journal')}</h1>
        </div>

        <div className="flex items-center justify-between mb-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => goDay(-7)} className="p-1">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </motion.button>
          <span className="text-sm font-medium text-foreground">{format(selectedDate, 'LLLL yyyy', { locale: ru })}</span>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => goDay(7)} className="p-1">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        </div>

        <div className="flex gap-1 mb-4 overflow-x-auto">
          {weekDays.map((d) => (
            <button key={d.toISOString()} onClick={() => setSelectedDate(d)}
              className={`flex-1 min-w-[40px] flex flex-col items-center py-1.5 rounded-lg text-xs transition-colors ${
                isSameDay(d, selectedDate) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
              }`}>
              <span className="uppercase">{format(d, 'EEEEEE', { locale: ru })}</span>
              <span className="text-sm font-semibold">{format(d, 'd')}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Загрузка...</div>
        ) : noStaff ? (
          <div className="text-center py-16 text-muted-foreground">
            <User className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Нет сотрудников</p>
            <button onClick={() => navigate('/partner/staff')} className="mt-3 text-xs text-primary underline">Перейти к мастерам →</button>
          </div>
        ) : noScheduleConfigured ? (
          <div className="text-center py-16">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-destructive" />
            <p className="text-sm font-medium text-foreground">Настройте рабочее время специалиста</p>
            <button onClick={() => navigate('/partner/staff')} className="mt-3 text-xs text-primary underline">Настроить график →</button>
          </div>
        ) : !hasAnyWorking ? (
          <div className="text-center py-16 text-muted-foreground">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">В этот день никто не работает</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="min-w-[600px]">
              <div className="flex border-b border-border mb-1" style={{ paddingLeft: 56 }}>
                {staff.filter(s => hasSchedule(s)).map(s => (
                  <div key={s.id} className="flex-1 text-center px-1">
                    <div className="w-8 h-8 rounded-full bg-secondary mx-auto flex items-center justify-center text-xs font-semibold text-foreground">{s.full_name.charAt(0)}</div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{s.full_name}</p>
                  </div>
                ))}
              </div>
              <div className="relative">
                {gridSlots.map((slotMin) => (
                  <div key={slotMin} className="flex" style={{ height: SLOT_HEIGHT }}>
                    <div className="w-14 flex-shrink-0 text-[10px] text-muted-foreground text-right pr-2 pt-0.5">{minutesToTime(slotMin)}</div>
                    {staff.filter(s => hasSchedule(s)).map(s => {
                      const working = isStaffWorking(s, slotMin);
                      const slotDate = new Date(selectedDate); slotDate.setHours(0, 0, 0, 0);
                      const slotStart = new Date(slotDate.getTime() + slotMin * 60000);
                      const slotEnd = new Date(slotStart.getTime() + 30 * 60000);
                      const appt = getStaffAppointments(s.id).find((a: Appointment) => {
                        const aStart = new Date(a.start_time); const aEnd = new Date(a.end_time);
                        return aStart < slotEnd && aEnd > slotStart;
                      });

                      if (!working) return <div key={s.id} className="flex-1 border-l border-border bg-muted/50 flex items-center justify-center"><span className="text-[9px] text-muted-foreground/50">—</span></div>;

                      return (
                        <div key={s.id} className={`flex-1 border-l border-t border-border relative ${appt ? 'bg-primary/10' : 'bg-background hover:bg-secondary/50 cursor-pointer'}`}>
                          {appt && (
                            <div className="absolute inset-0.5 rounded bg-primary/20 border border-primary/30 p-0.5 overflow-hidden">
                              <p className="text-[9px] font-medium text-primary truncate">{appt.client_name || appt.client_phone || 'Клиент'}</p>
                              <p className="text-[8px] text-muted-foreground truncate">{(appt.service as any)?.name || ''}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default PartnerBookings;
