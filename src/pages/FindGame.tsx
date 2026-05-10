import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, MapPin, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useSportGames } from '@/hooks/useSportGames';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SPORTS = [
  { id: 'all', emoji: '🎯', label: 'Все' },
  { id: 'football', emoji: '⚽', label: 'Футбол' },
  { id: 'tennis', emoji: '🎾', label: 'Теннис' },
  { id: 'basketball', emoji: '🏀', label: 'Баскетбол' },
  { id: 'volleyball', emoji: '🏐', label: 'Волейбол' },
  { id: 'boxing', emoji: '🥊', label: 'Бокс' },
  { id: 'swimming', emoji: '🏊', label: 'Плавание' },
];

const SKILLS = [
  { id: 'all', label: 'Любой уровень' },
  { id: 'beginner', label: 'Новичок' },
  { id: 'amateur', label: 'Любитель' },
  { id: 'pro', label: 'Профи' },
];

const DATE_FILTERS = [
  { id: 'all', label: 'Все даты' },
  { id: 'today', label: 'Сегодня' },
  { id: 'tomorrow', label: 'Завтра' },
  { id: 'week', label: 'Неделя' },
];

const SPORT_EMOJI: Record<string, string> = {
  football: '⚽', tennis: '🎾', basketball: '🏀',
  volleyball: '🏐', boxing: '🥊', swimming: '🏊',
};

const SKILL_STYLE: Record<string, string> = {
  beginner: 'bg-green-500/15 text-green-600 border-green-500/30',
  amateur: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  pro: 'bg-red-500/15 text-red-600 border-red-500/30',
};

const SKILL_LABEL: Record<string, string> = {
  beginner: 'Новичок', amateur: 'Любитель', pro: 'Профи',
};

const formatDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

const FindGame = () => {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { user } = useAuth();
  usePreferences();

  const [myGameIds, setMyGameIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('game_participants' as any)
      .select('game_id')
      .eq('user_id', user.id)
      .eq('status', 'joined')
      .then(({ data }) => {
        if (data) setMyGameIds(data.map((d: any) => d.game_id));
      });
  }, [user]);

  const [sport, setSport] = useState('all');
  const [skill, setSkill] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Current city — no centralized city state exists in the app yet,
  // so we read from localStorage (set by future city picker). When null
  // we skip the filter and show a banner.
  const currentCity = typeof window !== 'undefined'
    ? (localStorage.getItem('selected_city') || '').trim() || null
    : null;

  const dateValue = useMemo(() => {
    const now = new Date();
    if (dateFilter === 'today') return now.toISOString().slice(0, 10);
    if (dateFilter === 'tomorrow') {
      const t = new Date(now); t.setDate(t.getDate() + 1);
      return t.toISOString().slice(0, 10);
    }
    return undefined;
  }, [dateFilter]);

  const { games, isLoading, joinGame, leaveGame } = useSportGames({
    sport_type: sport !== 'all' ? sport : undefined,
    skill_level: skill !== 'all' ? skill : undefined,
    date: dateValue,
  });

  const filteredGames = useMemo(() => {
    let list = games as any[];
    if (dateFilter === 'week') {
      const now = new Date();
      const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);
      list = list.filter((g) => {
        const gd = new Date(g.game_date);
        return gd >= new Date(now.toDateString()) && gd <= weekEnd;
      });
    }
    if (currentCity) {
      list = list.filter((g) => (g.locations?.city || '').toLowerCase() === currentCity.toLowerCase());
    }
    return list;
  }, [games, dateFilter, currentCity]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)}>
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <h1 className="text-xl font-bold font-[Syne] text-foreground">🏆 Игры</h1>
          </div>
          <Button
            size="sm"
            onClick={() => user ? navigate('/games/create') : navigate('/auth')}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-xl"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Создать
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Sport chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SPORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSport(s.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                sport === s.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground border border-border'
              }`}
            >
              <span>{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Skill chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SKILLS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSkill(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                skill === s.id
                  ? 'bg-foreground text-background'
                  : 'bg-card text-muted-foreground border border-border'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Date chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {DATE_FILTERS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDateFilter(d.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                dateFilter === d.id
                  ? 'bg-foreground text-background'
                  : 'bg-card text-muted-foreground border border-border'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* List */}
        {!currentCity && (
          <div className="text-sm text-muted-foreground text-center py-2">
            Показаны игры из всех городов. Выберите город в профиле.
          </div>
        )}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[180px] bg-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="text-5xl">🔍</div>
            <p className="text-muted-foreground">Игры не найдены</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(filteredGames as any[]).map((g) => {
              const isFull = g.status === 'full' || g.current_players >= g.max_players;
              const isCancelled = g.status === 'cancelled' || g.status === 'finished';
              const progress = Math.min(100, Math.round((g.current_players / g.max_players) * 100));
              const free = !g.price_per_person || Number(g.price_per_person) === 0;
              return (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl border border-border p-4 space-y-3"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="text-3xl shrink-0">{SPORT_EMOJI[g.sport_type] || '🏟️'}</div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base text-foreground line-clamp-1">
                          {g.locations?.name || 'Площадка'}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {g.sport_courts?.name || 'Корт'}
                        </p>
                      </div>
                    </div>
                    {g.skill_level && (
                      <Badge className={`text-[10px] border ${SKILL_STYLE[g.skill_level] || ''}`}>
                        {SKILL_LABEL[g.skill_level] || g.skill_level}
                      </Badge>
                    )}
                  </div>

                  {/* Date / time */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(g.game_date)}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {String(g.start_time).slice(0, 5)}
                    </span>
                    <span>·</span>
                    <span>{g.duration_minutes} мин</span>
                  </div>

                  {/* Players progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Игроки</span>
                      <span className={`font-semibold ${isFull ? 'text-red-500' : 'text-foreground'}`}>
                        {g.current_players} / {g.max_players}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${isFull ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-end justify-between pt-1">
                    <div>
                      {free ? (
                        <span className="text-base font-bold text-green-600">Бесплатно</span>
                      ) : (
                        <>
                          <span className="text-base font-bold text-primary">
                            {Number(g.price_per_person).toLocaleString()} {g.currency || 'UZS'}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">за человека</span>
                        </>
                      )}
                    </div>
                    {myGameIds.includes(g.id) ? (
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await leaveGame(g.id);
                            setMyGameIds(prev => prev.filter(id => id !== g.id));
                          } catch {
                            toast.error('Не удалось покинуть игру');
                          }
                        }}
                        className={`text-xs rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white`}
                      >
                        Покинуть
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={isFull || isCancelled}
                        onClick={async () => {
                          try {
                            await joinGame(g.id);
                            setMyGameIds(prev => [...prev, g.id]);
                          } catch {
                            toast.error('Не удалось присоединиться');
                          }
                        }}
                        className={`text-xs rounded-xl ${
                          isFull
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        }`}
                      >
                        {isFull ? 'Заполнено' : 'Присоединиться'}
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {!isDesktop && <BottomNav />}
    </div>
  );
};

export default FindGame;