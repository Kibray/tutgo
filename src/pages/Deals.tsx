import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tag, Clock } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { deals, services, categories, formatPrice, categoryEmoji } from '@/lib/mock-data';

const Deals = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return deals;
    return deals.filter((d) => d.category === filter);
  }, [filter]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen bg-background pb-24"
    >
      <div className="px-4 pt-6">
        <h1 className="text-lg font-bold font-display text-foreground mb-1">Акции</h1>
        <p className="text-xs text-muted-foreground mb-4">Лучшие предложения и скидки</p>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
          <FilterChip label="Все" active={filter === 'all'} onClick={() => setFilter('all')} />
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              label={c.name}
              icon={c.icon}
              active={filter === c.id}
              onClick={() => setFilter(c.id)}
            />
          ))}
        </div>

        {/* Deal cards */}
        <div className="space-y-4 mt-4">
          {filtered.map((deal, i) => {
            const service = services.find((s) => s.id === deal.serviceId);
            return (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => service && navigate(`/service/${service.id}`)}
                className="glass rounded-lg overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
              >
                {/* Image/Emoji header */}
                <div className="h-32 bg-secondary flex items-center justify-center relative">
                  <span className="text-4xl">{categoryEmoji[deal.category] || '🎁'}</span>

                  {/* Discount badge */}
                  <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground px-2.5 py-1 rounded-lg text-xs font-bold">
                    -{deal.discountPercent}%
                  </div>

                  {/* Category tag */}
                  <div className="absolute bottom-3 left-3 glass rounded-md px-2 py-1 text-[10px] font-medium text-foreground">
                    {categoryEmoji[deal.category]} {categories.find(c => c.id === deal.category)?.name}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-sm font-bold text-foreground">{deal.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{deal.description}</p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gradient-green">
                        {formatPrice(deal.dealPrice)} {deal.currency}
                      </span>
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(deal.originalPrice)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      до {new Date(deal.validUntil).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>

                  {service && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center text-xs">
                        {categoryEmoji[service.category]}
                      </div>
                      <span className="text-xs text-muted-foreground">{service.businessName}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Нет акций в этой категории
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </motion.div>
  );
};

const FilterChip = ({ label, icon, active, onClick }: { label: string; icon?: string; active: boolean; onClick: () => void }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
      active
        ? 'bg-primary text-accent-foreground glow-green-sm'
        : 'glass text-muted-foreground hover:text-foreground'
    }`}
  >
    {icon && <span>{icon}</span>}
    <span>{label}</span>
  </motion.button>
);

export default Deals;
