import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  AlertTriangle,
  X,
  Check,
  XCircle,
  Phone,
  Scissors,
  List,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePreferences } from "@/hooks/usePreferences";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import PartnerLayout from '@/components/partner/PartnerLayout';
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

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
  service?: { name: string; price?: number; currency?: string } | null;
}

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const SLOT_HEIGHT = 48;

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  confirmed: "Принят",
  cancelled: "Отменён",
  completed: "Завершён",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-500 bg-yellow-500/10",
  confirmed: "text-green-500 bg-green-500/10",
  cancelled: "text-red-500 bg-red-500/10",
  completed: "text-blue-500 bg-blue-500/10",
};

const STATUS_BAR_COLORS: Record<string, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-green-500",
  cancelled: "bg-red-500",
  completed: "bg-blue-500",
};

const STATUS_AVATAR_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-600",
  confirmed: "bg-green-500/20 text-green-600",
  cancelled: "bg-red-500/20 text-red-600",
  completed: "bg-blue-500/20 text-blue-600",
};

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function getInitials(name: string | null): string {
  if (!name) return "??";
  return name.slice(0, 2).toUpperCase();
}

function getDurationMinutes(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

const PartnerBookings = () => {
  const navigate = useNavigate();
  const { t } = usePreferences();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [updating, setUpdating] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const { data: locs } = await supabase.from("locations").select("id").eq("owner_id", user.id);
    const locIds = (locs || []).map((l) => l.id);
    setLocations(locIds);

    if (locIds.length === 0) {
      setStaff([]);
      setAppointments([]);
      setLoading(false);
      return;
    }

    const { data: staffData } = await supabase
      .from("staff")
      .select("id, full_name, photo_url, working_hours, location_id")
      .in("location_id", locIds);
    setStaff((staffData as any[]) || []);

    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: appts } = await supabase
      .from("appointments")
      .select(
        "id, staff_id, service_id, client_name, client_phone, start_time, end_time, status, service:services(name, price, currency)",
      )
      .in("location_id", locIds)
      .gte("start_time", dayStart.toISOString())
      .lte("start_time", dayEnd.toISOString());
    setAppointments((appts as any[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user, selectedDate]);

  useEffect(() => {
    if (!user || locations.length === 0) return;
    const channel = supabase
      .channel("partner-appointments")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => fetchData())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, locations, selectedDate]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(true);
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    setUpdating(false);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      const msgs: Record<string, string> = {
        confirmed: "✅ Запись принята!",
        cancelled: "❌ Запись отклонена",
        completed: "✅ Запись завершена!",
      };
      toast({ title: msgs[status] || "Статус обновлён" });
      setSelectedAppointment(null);
      fetchData();
    }
  };

  const dayKey = DAY_KEYS[(selectedDate.getDay() + 6) % 7];

  const { gridStart, gridEnd, hasAnyWorking } = useMemo(() => {
    let minStart = Infinity,
      maxEnd = -Infinity,
      any = false;
    staff.forEach((s) => {
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
  const getStaffAppointments = (staffId: string) => appointments.filter((a) => a.staff_id === staffId);
  const goDay = (offset: number) => setSelectedDate((prev) => addDays(prev, offset));

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const noStaff = staff.length === 0;
  const noScheduleConfigured = staff.length > 0 && staff.every((s) => !hasSchedule(s));

  const stats = useMemo(() => ({
    total: appointments.length,
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  }), [appointments]);

  const sortedAppointments = useMemo(
    () => [...appointments].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
    [appointments],
  );

  return (
    <PartnerLayout title={t("partner.journal")}>
      <div className="px-4 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/partner")}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold font-display text-foreground">{t("partner.journal")}</h1>
        </div>

        <div className="flex items-center justify-between mb-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => goDay(-7)} className="p-1">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </motion.button>
          <span className="text-sm font-medium text-foreground">
            {format(selectedDate, "LLLL yyyy", { locale: ru })}
          </span>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => goDay(7)} className="p-1">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        </div>

        <div className="flex gap-1 mb-4 overflow-x-auto">
          {weekDays.map((d) => (
            <button
              key={d.toISOString()}
              onClick={() => setSelectedDate(d)}
              className={`flex-1 min-w-[40px] flex flex-col items-center py-1.5 rounded-lg text-xs transition-colors ${
                isSameDay(d, selectedDate)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <span className="uppercase">{format(d, "EEEEEE", { locale: ru })}</span>
              <span className="text-sm font-semibold">{format(d, "d")}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Всего</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-yellow-500">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Ожидают</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-green-500">{stats.confirmed}</p>
            <p className="text-xs text-muted-foreground">Принято</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-red-500">{stats.cancelled}</p>
            <p className="text-xs text-muted-foreground">Отклонённые</p>
          </div>
        </div>

        <div className="flex gap-1 mb-4 p-1 rounded-lg bg-secondary/50">
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <List className="w-3.5 h-3.5" /> Список
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'calendar' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" /> Календарь
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Загрузка...</div>
        ) : noStaff ? (
          <div className="text-center py-16 text-muted-foreground">
            <User className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Нет сотрудников</p>
            <button onClick={() => navigate("/partner/staff")} className="mt-3 text-xs text-primary underline">
              Перейти к мастерам →
            </button>
          </div>
        ) : noScheduleConfigured ? (
          <div className="text-center py-16">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-destructive" />
            <p className="text-sm font-medium text-foreground">Настройте рабочее время специалиста</p>
            <button onClick={() => navigate("/partner/staff")} className="mt-3 text-xs text-primary underline">
              Настроить график →
            </button>
          </div>
        ) : viewMode === 'list' ? (
          sortedAppointments.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Нет записей на этот день</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedAppointments.map((appt) => (
                <motion.div
                  key={appt.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedAppointment(appt)}
                  className="glass rounded-2xl p-4 flex items-center gap-3 cursor-pointer active:bg-secondary/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-12 text-center">
                    <p className="text-sm font-bold text-foreground">
                      {new Date(appt.start_time).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {getDurationMinutes(appt.start_time, appt.end_time)} мин
                    </p>
                  </div>

                  <div className={`w-0.5 h-10 rounded-full flex-shrink-0 ${STATUS_BAR_COLORS[appt.status] || "bg-muted"}`} />

                  <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${STATUS_AVATAR_COLORS[appt.status] || "bg-muted text-muted-foreground"}`}>
                    {getInitials(appt.client_name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {appt.client_name || appt.client_phone || "Клиент"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {(appt.service as any)?.name || ""}
                    </p>
                  </div>

                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md flex-shrink-0 ${STATUS_COLORS[appt.status] || "text-muted-foreground bg-muted"}`}>
                    {STATUS_LABELS[appt.status] || appt.status}
                  </span>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          !hasAnyWorking ? (
            <div className="text-center py-16 text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">В этот день никто не работает</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="min-w-[600px]">
                <div className="flex border-b border-border mb-1" style={{ paddingLeft: 56 }}>
                  {staff
                    .filter((s) => hasSchedule(s))
                    .map((s) => (
                      <div key={s.id} className="flex-1 text-center px-1">
                        <div className="w-8 h-8 rounded-full bg-secondary mx-auto flex items-center justify-center text-xs font-semibold text-foreground">
                          {s.full_name.charAt(0)}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{s.full_name}</p>
                      </div>
                    ))}
                </div>
                <div className="relative">
                  {gridSlots.map((slotMin) => (
                    <div key={slotMin} className="flex" style={{ height: SLOT_HEIGHT }}>
                      <div className="w-14 flex-shrink-0 text-[10px] text-muted-foreground text-right pr-2 pt-0.5">
                        {minutesToTime(slotMin)}
                      </div>
                      {staff
                        .filter((s) => hasSchedule(s))
                        .map((s) => {
                          const working = isStaffWorking(s, slotMin);
                          const slotDate = new Date(selectedDate);
                          slotDate.setHours(0, 0, 0, 0);
                          const slotStart = new Date(slotDate.getTime() + slotMin * 60000);
                          const slotEnd = new Date(slotStart.getTime() + 30 * 60000);
                          const appt = getStaffAppointments(s.id).find((a: Appointment) => {
                            const aStart = new Date(a.start_time);
                            const aEnd = new Date(a.end_time);
                            return aStart < slotEnd && aEnd > slotStart;
                          });

                          if (!working)
                            return (
                              <div
                                key={s.id}
                                className="flex-1 border-l border-border bg-muted/50 flex items-center justify-center"
                              >
                                <span className="text-[9px] text-muted-foreground/50">—</span>
                              </div>
                            );

                          return (
                            <div
                              key={s.id}
                              onClick={() => appt && setSelectedAppointment(appt)}
                              className={`flex-1 border-l border-t border-border relative ${appt ? "bg-primary/10 cursor-pointer hover:bg-primary/20" : "bg-background hover:bg-secondary/50 cursor-pointer"}`}
                            >
                              {appt && (
                                <div className="absolute inset-0.5 rounded bg-primary/20 border border-primary/30 p-0.5 overflow-hidden">
                                  <p className="text-[9px] font-medium text-primary truncate">
                                    {appt.client_name || appt.client_phone || "Клиент"}
                                  </p>
                                  <p className="text-[8px] text-muted-foreground truncate">
                                    {(appt.service as any)?.name || ""}
                                  </p>
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
          )
        )}
      </div>
      <PartnerBottomNav />

      <AnimatePresence>
        {selectedAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setSelectedAppointment(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl p-5 mx-4 w-full max-w-sm shadow-xl border border-border"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold font-display text-foreground">Детали записи</h2>
                <button onClick={() => setSelectedAppointment(null)} className="p-1.5 rounded-full hover:bg-secondary">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${STATUS_AVATAR_COLORS[selectedAppointment.status] || "bg-muted text-muted-foreground"}`}>
                  {getInitials(selectedAppointment.client_name)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedAppointment.client_name || "Не указано"}</p>
                  {selectedAppointment.client_phone && (
                    <a href={`tel:${selectedAppointment.client_phone}`} className="text-xs text-primary font-medium">
                      {selectedAppointment.client_phone} · Позвонить
                    </a>
                  )}
                </div>
              </div>

              <span className={`text-[10px] font-medium px-2.5 py-1 rounded-md ${STATUS_COLORS[selectedAppointment.status] || "text-muted-foreground bg-muted"}`}>
                {STATUS_LABELS[selectedAppointment.status] || selectedAppointment.status}
              </span>

              <div className="mt-3 space-y-2">
                {selectedAppointment.service && (
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50">
                    <Scissors className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Услуга</p>
                      <p className="text-sm font-semibold text-foreground">{(selectedAppointment.service as any).name}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50">
                  <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Время</p>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(selectedAppointment.start_time).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                      {" — "}
                      {new Date(selectedAppointment.end_time).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                {selectedAppointment.status === "pending" && (
                  <div className="flex gap-3">
                    <motion.button whileTap={{ scale: 0.97 }} disabled={updating} onClick={() => updateStatus(selectedAppointment.id, "cancelled")}
                      className="flex-1 py-2.5 rounded-lg border border-destructive/30 text-destructive text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50">
                      <XCircle className="w-4 h-4" /> Отклонить
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} disabled={updating} onClick={() => updateStatus(selectedAppointment.id, "confirmed")}
                      className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50">
                      <Check className="w-4 h-4" /> Принять
                    </motion.button>
                  </div>
                )}
                {selectedAppointment.status === "confirmed" && (
                  <div className="flex gap-3">
                    <motion.button whileTap={{ scale: 0.97 }} disabled={updating} onClick={() => updateStatus(selectedAppointment.id, "cancelled")}
                      className="flex-1 py-2.5 rounded-lg border border-destructive/30 text-destructive text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50">
                      <XCircle className="w-4 h-4" /> Отменить
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} disabled={updating} onClick={() => updateStatus(selectedAppointment.id, "completed")}
                      className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50">
                      <CheckCircle2 className="w-4 h-4" /> Выполнено
                    </motion.button>
                  </div>
                )}
                {(selectedAppointment.status === "cancelled" || selectedAppointment.status === "completed") && (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setSelectedAppointment(null)}
                    className="w-full py-2.5 rounded-lg bg-secondary text-foreground text-sm font-semibold flex items-center justify-center gap-1.5">
                    <X className="w-4 h-4" /> Закрыть
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PartnerBookings;
