import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const SPORTS = [
  { id: 'football', label: '⚽ Футбол' },
  { id: 'tennis', label: '🎾 Теннис' },
  { id: 'basketball', label: '🏀 Баскетбол' },
  { id: 'volleyball', label: '🏐 Волейбол' },
  { id: 'boxing', label: '🥊 Бокс' },
  { id: 'swimming', label: '🏊 Плавание' },
];

const SKILLS = [
  { id: 'beginner', label: 'Новичок' },
  { id: 'amateur', label: 'Любитель' },
  { id: 'pro', label: 'Профи' },
];

const today = () => new Date().toISOString().slice(0, 10);

const CreateGame = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sportType, setSportType] = useState('football');
  const [gameDate, setGameDate] = useState(today());
  const [startTime, setStartTime] = useState('19:00');
  const [duration, setDuration] = useState(60);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [price, setPrice] = useState(0);
  const [skill, setSkill] = useState('amateur');
  const [notes, setNotes] = useState('');

  const [locationId, setLocationId] = useState<string>('');
  const [courtId, setCourtId] = useState<string>('');
  const [locations, setLocations] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Load sport venues that have at least one court matching the chosen sport
  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from('sport_courts' as any) as any)
        .select('location_id, sport_type, locations(id, name)')
        .eq('sport_type', sportType)
        .eq('is_active', true);
      const unique = new Map<string, any>();
      (data ?? []).forEach((c: any) => {
        if (c.locations) unique.set(c.locations.id, c.locations);
      });
      const list = Array.from(unique.values());
      setLocations(list);
      if (list.length && !list.find((l) => l.id === locationId)) {
        setLocationId(list[0].id);
      } else if (!list.length) {
        setLocationId('');
        setCourtId('');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sportType]);

  // Load courts for selected location + sport
  useEffect(() => {
    if (!locationId) {
      setCourts([]);
      setCourtId('');
      return;
    }
    (async () => {
      const { data } = await (supabase.from('sport_courts' as any) as any)
        .select('*')
        .eq('location_id', locationId)
        .eq('sport_type', sportType)
        .eq('is_active', true);
      const list = data ?? [];
      setCourts(list);
      if (list.length) setCourtId(list[0].id);
      else setCourtId('');
    })();
  }, [locationId, sportType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!locationId || !courtId) {
      toast.error('Выберите площадку и корт');
      return;
    }
    if (maxPlayers < 2 || maxPlayers > 22) {
      toast.error('Игроков должно быть от 2 до 22');
      return;
    }
    setSubmitting(true);
    const payload: any = {
      sport_type: sportType,
      game_date: gameDate,
      start_time: startTime,
      duration_minutes: Number(duration) || 60,
      max_players: Number(maxPlayers),
      price_per_person: Number(price) || 0,
      skill_level: skill,
      notes: notes.trim() || null,
      status: 'open',
      current_players: 1,
      created_by: user.id,
      currency: 'UZS',
      location_id: locationId,
      court_id: courtId,
    };
    const { data: newGame, error } = await (supabase.from('sport_games' as any) as any)
      .insert(payload)
      .select('id')
      .single();
    if (error || !newGame) {
      setSubmitting(false);
      toast.error(error?.message || 'Не удалось создать игру');
      return;
    }
    const { error: participantError } = await (supabase.from('game_participants' as any) as any).insert({
      game_id: newGame.id,
      user_id: user.id,
      status: 'joined',
    });
    setSubmitting(false);
    if (participantError) {
      toast.error(participantError.message || 'Игра создана, но не удалось добавить вас как участника');
      return;
    }
    toast.success('Игра создана!');
    navigate('/sport/games');
  };

  const inputCls =
    'w-full px-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:border-primary';

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} aria-label="Назад">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-base font-bold font-[Syne] text-foreground">Создать игру</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Sport */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Вид спорта</label>
          <select
            value={sportType}
            onChange={(e) => setSportType(e.target.value)}
            className={inputCls}
          >
            {SPORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Venue */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Площадка</label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className={inputCls}
            disabled={!locations.length}
          >
            {locations.length === 0 ? (
              <option value="">Нет доступных площадок</option>
            ) : (
              locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Court */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Корт</label>
          <select
            value={courtId}
            onChange={(e) => setCourtId(e.target.value)}
            className={inputCls}
            disabled={!courts.length}
          >
            {courts.length === 0 ? (
              <option value="">Нет доступных кортов</option>
            ) : (
              courts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · до {c.capacity}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Date + time */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Дата</label>
            <Input
              type="date"
              min={today()}
              value={gameDate}
              onChange={(e) => setGameDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Время</label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Duration + players */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Длительность (мин)
            </label>
            <Input
              type="number"
              min={15}
              step={15}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Макс. игроков (2–22)
            </label>
            <Input
              type="number"
              min={2}
              max={22}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              required
            />
          </div>
        </div>

        {/* Price + skill */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Цена с человека (UZS)
            </label>
            <Input
              type="number"
              min={0}
              step={1000}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
            <p className="text-[11px] text-muted-foreground">0 — бесплатно</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Уровень</label>
            <select
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              className={inputCls}
            >
              {SKILLS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            Описание (необязательно)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Дополнительные детали об игре…"
            className={`${inputCls} resize-none`}
          />
        </div>

        <Button
          type="submit"
          disabled={submitting || !locationId || !courtId}
          className="w-full rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white"
        >
          {submitting ? 'Создаём…' : 'Создать игру'}
        </Button>
      </form>

      <BottomNav />
    </div>
  );
};

export default CreateGame;