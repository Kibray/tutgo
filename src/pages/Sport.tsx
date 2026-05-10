import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useLocations } from '@/hooks/useLocations';

const SPORTS = [
  { id: 'all', emoji: '🎯', label: 'Все' },
  { id: 'football', emoji: '⚽', label: 'Футбол' },
  { id: 'tennis', emoji: '🎾', label: 'Теннис' },
  { id: 'basketball', emoji: '🏀', label: 'Баскет' },
  { id: 'volleyball', emoji: '🏐', label: 'Волейбол' },
  { id: 'boxing', emoji: '🥊', label: 'Бокс' },
  { id: 'swimming', emoji: '🏊', label: 'Бассейн' },
];

const Sport = () => {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [sport, setSport] = useState('all');
  const { locations, loading } = useLocations('sport');

  const filtered = useMemo(() => {
    if (sport === 'all') return locations;
    return locations.filter((l: any) =>
      l.sub_category === sport ||
      (l.metadata && Array.isArray(l.metadata.sport_types) && l.metadata.sport_types.includes(sport))
    );
  }, [locations, sport]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <button onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-xl font-bold font-[Syne] text-foreground">🏆 Спорт</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-5">
        {/* Entry cards */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/sport/games')}
            className="rounded-2xl border p-4 text-left flex flex-col gap-1.5"
            style={{ backgroundColor: '#EEEDFE', borderColor: '#AFA9EC' }}
          >
            <div className="text-3xl">⚽</div>
            <div className="font-bold text-base" style={{ color: '#3F3A8C' }}>Найти игру</div>
            <div className="text-xs" style={{ color: '#5C57A8' }}>Играй с другими</div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/sport/venues')}
            className="rounded-2xl border p-4 text-left flex flex-col gap-1.5"
            style={{ backgroundColor: '#E1F5EE', borderColor: '#5DCAA5' }}
          >
            <div className="text-3xl">🏟</div>
            <div className="font-bold text-base" style={{ color: '#1F6B52' }}>Забронировать</div>
            <div className="text-xs" style={{ color: '#3A8B6F' }}>Выбери корт</div>
          </motion.button>
        </div>

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

        {/* Locations list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[110px] bg-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="text-5xl">🔍</div>
            <p className="text-muted-foreground">Площадки не найдены</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((l: any) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="font-bold text-base text-foreground line-clamp-1">{l.name}</h3>
                  {l.address && (
                    <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {l.address}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span>{l.rating || 0}</span>
                    {l.review_count ? <span>· {l.review_count} отз.</span> : null}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate('/sport/venue/' + l.id)}
                  className="bg-gradient-to-r from-primary to-blue-600 text-white text-xs rounded-xl shrink-0"
                >
                  Подробнее →
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {!isDesktop && <BottomNav />}
    </div>
  );
};

export default Sport;