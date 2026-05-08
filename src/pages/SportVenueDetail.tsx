import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Star, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/integrations/supabase/client';
import { useSportCourts } from '@/hooks/useSportCourts';
import { useAuth } from '@/hooks/useAuth';

const SPORT_EMOJI: Record<string, string> = {
  football: '⚽',
  tennis: '🎾',
  basketball: '🏀',
  volleyball: '🏐',
  boxing: '🥊',
  swimming: '🏊',
};

const SportVenueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [games, setGames] = useState<any[]>([]);
  const [pickerCourt, setPickerCourt] = useState<any>(null);
  const [pickerDate, setPickerDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [pickerTime, setPickerTime] = useState<string>('');

  const { courts, isLoading: courtsLoading } = useSportCourts(id);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      setLocation(data);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await (supabase.from('sport_games' as any) as any)
        .select('*, sport_courts(*)')
        .eq('location_id', id)
        .eq('status', 'open')
        .eq('game_date', new Date().toISOString().slice(0, 10))
        .order('start_time', { ascending: true })
        .limit(3);
      setGames(data ?? []);
    })();
  }, [id]);

  const sportTypes = Array.from(
    new Set((courts as any[]).map((c) => c.sport_type).filter(Boolean))
  );

  const gallery: string[] = location?.gallery?.length
    ? location.gallery
    : ['/placeholder.svg'];

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="h-64 bg-card animate-pulse" />
        <div className="p-4 space-y-3">
          <div className="h-6 w-2/3 bg-card animate-pulse rounded" />
          <div className="h-4 w-1/2 bg-card animate-pulse rounded" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pb-24">
        <p className="text-muted-foreground">Площадка не найдена</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Назад</Button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <button onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-base font-bold font-[Syne] text-foreground line-clamp-1">
            {location.name}
          </h1>
        </div>
      </div>

      {/* Gallery */}
      <div className="relative w-full h-64 bg-card overflow-hidden">
        <img
          src={gallery[activePhoto]}
          alt={location.name}
          className="w-full h-full object-cover"
        />
        {gallery.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {gallery.map((_, i) => (
              <button
                key={i}
                onClick={() => setActivePhoto(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === activePhoto ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-5">
        {/* Title block */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-[Syne] text-foreground">{location.name}</h2>
          {location.address && (
            <p className="text-sm text-muted-foreground flex items-start gap-1.5">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
              {location.address}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-sm">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold text-foreground">{location.rating || 0}</span>
            {location.review_count ? (
              <span className="text-muted-foreground">· {location.review_count} отзывов</span>
            ) : null}
          </div>
        </div>

        {/* Sport type chips */}
        {sportTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sportTypes.map((s) => (
              <span
                key={s}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-medium text-foreground"
              >
                <span>{SPORT_EMOJI[s] || '🏅'}</span>
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Courts section */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold font-[Syne] text-foreground">🏟 Площадки</h3>
          {courtsLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-card rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : courts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Пока нет доступных площадок
            </p>
          ) : (
            <div className="space-y-2">
              {(courts as any[]).map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{SPORT_EMOJI[c.sport_type] || '🏅'}</span>
                      <h4 className="font-bold text-foreground line-clamp-1">{c.name}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        до {c.capacity} игроков
                      </span>
                      <span className="font-semibold text-foreground">
                        {Number(c.price_per_hour).toLocaleString()} {c.currency}/час
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setPickerCourt(c);
                      setPickerTime('');
                    }}
                    className="bg-gradient-to-r from-primary to-blue-600 text-white text-xs rounded-xl shrink-0"
                  >
                    Забронировать
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Today's games section */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold font-[Syne] text-foreground">⚡ Игры сегодня</h3>
          {games.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Пока нет открытых игр
            </p>
          ) : (
            <div className="space-y-2">
              {games.map((g) => (
                <div
                  key={g.id}
                  className="bg-card rounded-2xl border border-border p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl">{SPORT_EMOJI[g.sport_type] || '🏅'}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground line-clamp-1">
                        {g.sport_courts?.name || g.sport_type}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {g.game_date} · {String(g.start_time).slice(0, 5)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {g.current_players}/{g.max_players}
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => navigate('/sport/games')}
                className="w-full rounded-xl"
              >
                Все игры →
              </Button>
            </div>
          )}
        </section>
      </div>

      <BottomNav />

      <Sheet open={!!pickerCourt} onOpenChange={(o) => !o && setPickerCourt(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-left font-[Syne]">
              Выберите дату и время
            </SheetTitle>
          </SheetHeader>

          {pickerCourt && (
            <div className="mt-4 space-y-5">
              <div className="bg-card border border-border rounded-2xl p-3 flex items-center gap-2">
                <span className="text-xl">{SPORT_EMOJI[pickerCourt.sport_type] || '🏅'}</span>
                <div className="min-w-0">
                  <div className="font-semibold text-foreground line-clamp-1">{pickerCourt.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {Number(pickerCourt.price_per_hour).toLocaleString()} {pickerCourt.currency}/час
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Дата</label>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() + i);
                    const iso = d.toISOString().slice(0, 10);
                    const isActive = iso === pickerDate;
                    return (
                      <button
                        key={iso}
                        onClick={() => setPickerDate(iso)}
                        className={`shrink-0 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card border-border text-foreground'
                        }`}
                      >
                        <div className="text-[10px] opacity-70 uppercase">
                          {d.toLocaleDateString('ru', { weekday: 'short' })}
                        </div>
                        <div className="text-sm font-bold">{d.getDate()}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Время</label>
                <div className="grid grid-cols-4 gap-2">
                  {(() => {
                    const startHour = pickerCourt?.working_hours?.open
                      ? parseInt(pickerCourt.working_hours.open.split(':')[0])
                      : 8;
                    const endHour = pickerCourt?.working_hours?.close
                      ? parseInt(pickerCourt.working_hours.close.split(':')[0])
                      : 21;
                    const count = Math.max(0, endHour - startHour + 1);
                    return Array.from({ length: count }).map((_, i) => {
                      const hour = startHour + i;
                      const t = `${String(hour).padStart(2, '0')}:00`;
                    const isActive = t === pickerTime;
                    return (
                      <button
                        key={t}
                        onClick={() => setPickerTime(t)}
                        className={`px-2 py-2 rounded-xl border text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card border-border text-foreground'
                        }`}
                      >
                        {t}
                      </button>
                    );
                    });
                  })()}
                </div>
              </div>

              <Button
                disabled={!pickerDate || !pickerTime}
                onClick={() => {
                  navigate('/booking-confirm', {
                    state: {
                      location,
                      service: pickerCourt,
                      date: pickerDate,
                      time: pickerTime,
                    },
                  });
                  setPickerCourt(null);
                }}
                className="w-full bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl"
              >
                Продолжить
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SportVenueDetail;