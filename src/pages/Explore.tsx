import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import ServiceCard from '@/components/ServiceCard';
import BusinessSheet from '@/components/BusinessSheet';
import { services, Service } from '@/lib/mock-data';

const Explore = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingQuery = (location.state as any)?.searchQuery || '';
  const [search, setSearch] = useState(incomingQuery);
  const [sheetService, setSheetService] = useState<Service | null>(null);

  useEffect(() => {
    if (incomingQuery) {
      window.history.replaceState({}, '');
    }
  }, [incomingQuery]);

  const filtered = services.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.businessName.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.subcategory.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q)
    );
  });

  const cities = [
    { name: 'Ташкент', emoji: '🏙️', count: 7 },
    { name: 'Самарканд', emoji: '🕌', count: 1 },
    { name: 'Бухара', emoji: '🏛️', count: 0 },
    { name: 'Хива', emoji: '🏰', count: 0 },
    { name: 'Фергана', emoji: '🌄', count: 0 },
  ];

  const isBookable = (s: Service) =>
    s.bookable !== false && ['beauty', 'medical', 'tour', 'service'].includes(s.category);

  const handleCardClick = (s: Service) => {
    if (isBookable(s)) {
      navigate(`/service/${s.id}`);
    } else {
      setSheetService(s);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen bg-background pb-24"
    >
      <div className="px-4 pt-6">
        <h1 className="text-lg font-bold font-display text-foreground mb-1">Карта</h1>
        <p className="text-xs text-muted-foreground mb-4">Услуги, туры и заведения Узбекистана</p>

        <div className="glass rounded-lg px-4 py-3 flex items-center gap-3 mb-4">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Поиск на карте..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent w-full text-foreground placeholder:text-muted-foreground outline-none text-sm"
            autoFocus={!!incomingQuery}
          />
        </div>

        {/* Map placeholder */}
        <div className="glass rounded-lg h-48 flex items-center justify-center mb-6 relative overflow-hidden">
          <div className="text-center">
            <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Интерактивная карта скоро</p>
          </div>
          {filtered.slice(0, 6).map((s, i) => (
            <button
              key={s.id}
              onClick={() => handleCardClick(s)}
              className="absolute w-3 h-3 rounded-full bg-primary animate-pulse-green cursor-pointer"
              style={{
                top: `${25 + i * 10}%`,
                left: `${20 + i * 12}%`,
              }}
            />
          ))}
        </div>

        {/* Results */}
        <AnimatePresence>
          {search && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <h2 className="text-sm font-semibold text-foreground mb-3">
                Результаты ({filtered.length})
              </h2>
              <div className="space-y-3">
                {filtered.map((s, i) => (
                  <ServiceCard
                    key={s.id}
                    service={s}
                    index={i}
                    onClick={() => handleCardClick(s)}
                  />
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    Ничего не найдено
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cities */}
        {!search && (
          <>
            <h2 className="text-sm font-semibold text-foreground mb-3">Города</h2>
            <div className="space-y-2">
              {cities.map((city, i) => (
                <motion.div
                  key={city.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSearch(city.name)}
                  className="glass rounded-lg p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <span className="text-2xl">{city.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{city.name}</p>
                    <p className="text-xs text-muted-foreground">{city.count} заведений</p>
                  </div>
                  <Search className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      <BusinessSheet
        service={sheetService}
        open={!!sheetService}
        onClose={() => setSheetService(null)}
        onFullPage={() => {
          if (sheetService) {
            navigate(`/service/${sheetService.id}`);
            setSheetService(null);
          }
        }}
      />
      <BottomNav />
    </motion.div>
  );
};

export default Explore;
