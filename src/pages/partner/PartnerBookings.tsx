import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, User, AlertTriangle, List, CalendarDays, Phone, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '@/hooks/usePreferences';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

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

const statusColors: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  pending: { bg: 'bg-yellow-500/15', text: 'text-yellow-600', border: 'border-yellow-500/30', bar: 'bg-yellow-500' },
  confirmed: { bg: 'bg-green-500/15', text: 'text-green-600', border: 'border-green-500/30', bar: 'bg-green-500' },
  cancelled: { bg: 'bg-destructive/15', text: 'text-destructive', border: 'border-destructive/30', bar: 'bg-destructive' },
  completed: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/30', bar: 'bg-primary' },
};

const statusLabels: Record<string, string> = {
  pending: 'Ожидает',
  confirmed: 'Принято',
  cancelled: 'Отменено',
  completed: 'Выполнено',
};

function getInitials(name: string | null): string {
  if (!name) return '??';
  return name.slice(0, 2).toUpperCase();
}

function getDurationMinutes(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  const sortedAppointments = useMemo(() =>
    [...appointments].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
    [appointments]
  );

  const stats = useMemo(() => ({
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
  }), [appointments]);

  const handleStatusUpdate = async (id: string, status: string) => {
    setActionLoading(true);
    await supabase.from('appointments').update({ status }).eq('id', id);
    await fetchData();
    setSelectedAppointment(null);
    setActionLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/partner')}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold font-display text-foreground">{t('partner.journal')}</h1>
        </div>

        {/* Week nav */}
        <div className="flex items-center justify-between mb-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => goDay(-7)} className="p-1">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </motion.button>
          <span className="text-sm font-medium text-foreground">{format(selectedDate, 'LLLL yyyy', { locale: ru })}</span>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => goDay(7)} className="p-1">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        </div>

        {/* Week days */}
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

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Всего', value: stats.total, color: 'text-primary' },
              { label: 'Ожидают', value: stats.pending, color: 'text-yellow-600' },
              { label: 'Принято', value: stats.confirmed, color: 'text-green-600' },
            ].map(s => (
              <div key={s.label} className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-3 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* View toggle */}
        {!loading && !noStaff && !noScheduleConfigured && (
          <div className="flex gap-1 mb-4 bg-secondary/50 rounded-xl p-1">
            {[
              { key: 'list' as const, icon: List, label: 'Список' },
              { key: 'calendar' as const, icon: CalendarDays, label: 'Календарь' },
            ].map(v => (
              <button key={v.key} onClick={() => setViewMode(v.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  viewMode === v.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}>
                <v.icon className="w-3.5 h-3.5" />
                {v.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
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
        ) : viewMode === 'list' ? (
          /* LIST VIEW */
          <div className="space-y-2">
            {sortedAppointments.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Нет записей на этот день</p>
              </div>
            ) : (
              sortedAppointments.map((appt) => {
                const colors = statusColors[appt.status] || statusColors.pending;
                const duration = getDurationMinutes(appt.start_time, appt.end_time);
                return (
                  <motion.div
                    key={appt.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedAppointment(appt)}
                    className="bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    {/* Time */}
                    <div className="text-center min-w-[44px]">
                      <p className="text-sm font-bold text-foreground">{format(new Date(appt.start_time), 'HH:mm')}</p>
                      <p className="text-[10px] text-muted-foreground">{duration} мин</p>
                    </div>

                    {/* Color bar */}
                    <div className={`w-0.5 h-10 rounded-full ${colors.bar}`} />

                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${colors.bg} ${colors.text}`}>
                      {getInitials(appt.client_name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {appt.client_name || appt.client_phone || 'Клиент'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{(appt.service as any)?.name || '—'}</p>
                    </div>

                    {/* Badge */}
                    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 shrink-0 ${colors.bg} ${colors.text} ${colors.border}`}>
                      {statusLabels[appt.status] || appt.status}
                    </Badge>
                  </motion.div>
                );
              })
            )}
          </div>
        ) : !hasAnyWorking ? (
          <div className="text-center py-16 text-muted-foreground">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">В этот день никто не работает</p>
          </div>
        ) : (
          /* CALENDAR VIEW */
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
                        <div key={s.id}
                          onClick={() => appt && setSelectedAppointment(appt)}
                          className={`flex-1 border-l border-t border-border relative ${appt ? 'bg-primary/10 cursor-pointer' : 'bg-background hover:bg-secondary/50 cursor-pointer'}`}>
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

      {/* Bottom Sheet */}
      <AnimatePresence>
        {selectedAppointment && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAppointment(null)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl p-5 pb-8 max-h-[70vh] overflow-y-auto"
            >
              {/* Handle */}
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />

              {/* Close */}
              <button onClick={() => setSelectedAppointment(null)} className="absolute top-4 right-4 p-1 text-muted-foreground">
                <X className="w-5 h-5" />
              </button>

              {/* Client info */}
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold ${(statusColors[selectedAppointment.status] || statusColors.pending).bg} ${(statusColors[selectedAppointment.status] || statusColors.pending).text}`}>
                  {getInitials(selectedAppointment.client_name)}
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {selectedAppointment.client_name || selectedAppointment.client_phone || 'Клиент'}
                  </p>
                  {selectedAppointment.client_phone && (
                    <a href={`tel:${selectedAppointment.client_phone}`} className="text-sm text-primary flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {selectedAppointment.client_phone}
                    </a>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Услуга</span>
                  <span className="font-medium text-foreground">{(selectedAppointment.service as any)?.name || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Время</span>
                  <span className="font-medium text-foreground">
                    {format(new Date(selectedAppointment.start_time), 'HH:mm')} — {format(new Date(selectedAppointment.end_time), 'HH:mm')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Длительность</span>
                  <span className="font-medium text-foreground">{getDurationMinutes(selectedAppointment.start_time, selectedAppointment.end_time)} мин</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Статус</span>
                  <Badge variant="outline" className={`text-xs ${(statusColors[selectedAppointment.status] || statusColors.pending).bg} ${(statusColors[selectedAppointment.status] || statusColors.pending).text} ${(statusColors[selectedAppointment.status] || statusColors.pending).border}`}>
                    {statusLabels[selectedAppointment.status] || selectedAppointment.status}
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {selectedAppointment.status === 'pending' && (
                  <>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleStatusUpdate(selectedAppointment.id, 'cancelled')}
                      className="flex-1 py-2.5 rounded-xl border border-destructive text-destructive text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      Отклонить
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleStatusUpdate(selectedAppointment.id, 'confirmed')}
                      className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      Принять
                    </button>
                  </>
                )}
                {selectedAppointment.status === 'confirmed' && (
                  <>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleStatusUpdate(selectedAppointment.id, 'cancelled')}
                      className="flex-1 py-2.5 rounded-xl border border-destructive text-destructive text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      Отменить
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleStatusUpdate(selectedAppointment.id, 'completed')}
                      className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      Выполнено
                    </button>
                  </>
                )}
                {(selectedAppointment.status === 'cancelled' || selectedAppointment.status === 'completed') && (
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium transition-colors"
                  >
                    Закрыть
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default PartnerBookings;
