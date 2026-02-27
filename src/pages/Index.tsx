import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import CategoryChips from '@/components/CategoryChips';
import ServiceCard from '@/components/ServiceCard';
import BottomNav from '@/components/BottomNav';
import { SkeletonList } from '@/components/SkeletonCard';
import { services } from '@/lib/mock-data';

const Index = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filtered = services.filter((s) => {
    const matchCat = category === 'all' || s.category === category || s.subcategory.toLowerCase() === category;
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.businessName.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const recentlyVisited = services.slice(0, 3);

  const handleSearch = (query: string) => {
    setSearch(query);
  };

  const handleSearchSubmit = (query: string) => {
    if (query.trim()) {
      const tg = (window as any).Telegram?.WebApp;
      tg?.HapticFeedback?.impactOccurred('light');
      navigate('/explore', { state: { searchQuery: query } });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-5"
        >
          <div>
            <h1 className="text-xl font-bold font-display text-foreground">
              TUT<span className="text-gradient-green">GO</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Бронируй услуги и туры по Узбекистану
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm">
            🇺🇿
          </div>
        </motion.div>

        <SearchBar onSearch={handleSearch} onSubmit={handleSearchSubmit} />
      </div>

      {/* Categories */}
      <div className="px-4 mt-4">
        <CategoryChips selected={category} onSelect={setCategory} />
      </div>

      {/* Recently Visited */}
      <AnimatePresence>
        {!search && category === 'all' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 px-4"
          >
            <h2 className="text-sm font-semibold text-foreground mb-3">
              Недавно просмотренные
            </h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
              {recentlyVisited.map((s) => (
                <RecentCard key={s.id} service={s} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Service List */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">
            {category === 'all' ? 'Популярное рядом' : `${categories_label(category)}`}
          </h2>
          <span className="text-xs text-muted-foreground">
            {filtered.length} найдено
          </span>
        </div>

        {loading ? (
          <SkeletonList count={4} />
        ) : (
          <div className="space-y-3">
            {filtered.map((service, i) => (
              <ServiceCard key={service.id} service={service} index={i} />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Ничего не найдено. Попробуйте другой запрос.
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

const categories_label = (id: string) => {
  const map: Record<string, string> = {
    beauty: 'Красота', medical: 'Медицина', tour: 'Туры',
    cafe: 'Кофейни', retail: 'Магазины', service: 'Услуги', office: 'Офисы',
  };
  return map[id] || id.charAt(0).toUpperCase() + id.slice(1);
};

const RecentCard = ({ service }: { service: typeof services[0] }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(`/service/${service.id}`)}
      className="glass rounded-lg p-3 min-w-[140px] flex-shrink-0 cursor-pointer"
    >
      <div className="w-full h-16 rounded-md bg-secondary flex items-center justify-center text-xl mb-2">
        {{ tour: '🏔️', beauty: '✨', cafe: '☕️', retail: '🛍️', service: '🛠️', medical: '🏥' }[service.category] || '📍'}
      </div>
      <p className="text-xs font-medium text-foreground truncate">
        {service.businessName}
      </p>
      <p className="text-[10px] text-muted-foreground truncate">
        {service.name}
      </p>
    </motion.div>
  );
};

export default Index;
