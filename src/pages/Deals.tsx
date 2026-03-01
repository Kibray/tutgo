import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tag, Clock } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { formatPrice, categoryEmoji } from '@/lib/types';
import { useCategories } from '@/hooks/useCategories';

const Deals = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const { categories } = useCategories();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <h1 className="text-lg font-bold font-display text-foreground mb-1">Акции</h1>
        <p className="text-xs text-muted-foreground mb-4">Лучшие предложения и скидки</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
          <FilterChip label="Все" active={filter === 'all'} onClick={() => setFilter('all')} />
          {categories.map((c) => (
            <FilterChip key={c.id} label={c.name} icon={c.icon} active={filter === c.id} onClick={() => setFilter(c.id)} />
          ))}
        </div>
        <div className="text-center py-12 text-muted-foreground text-sm">
          Акции скоро появятся
        </div>
      </div>
      <BottomNav />
    </motion.div>
  );
};

const FilterChip = ({ label, icon, active, onClick }: { label: string; icon?: string; active: boolean; onClick: () => void }) => (
  <motion.button whileTap={{ scale: 0.95 }} onClick={onClick}
    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
      active ? 'bg-primary text-accent-foreground glow-green-sm' : 'glass text-muted-foreground hover:text-foreground'
    }`}>
    {icon && <span>{icon}</span>}<span>{label}</span>
  </motion.button>
);

export default Deals;
