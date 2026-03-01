import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCategories } from '@/hooks/useCategories';

interface CategoryChipsProps {
  selected: string;
  onSelect: (id: string) => void;
  selectedSub?: string;
  onSubSelect?: (id: string) => void;
}

const CategoryChips = ({ selected, onSelect, selectedSub, onSubSelect }: CategoryChipsProps) => {
  const { categories } = useCategories();
  const activeCat = categories.find((c) => c.id === selected);
  const subs = activeCat?.subcategories || [];

  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        <ChipButton label="Все" icon="🔥" active={selected === 'all'} onClick={() => onSelect('all')} />
        {categories.map((cat) => (
          <ChipButton key={cat.id} label={cat.name} icon={cat.icon} active={selected === cat.id} onClick={() => onSelect(cat.id)} />
        ))}
      </div>
      <AnimatePresence>
        {subs.length > 0 && onSubSelect && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
            <SubChip label="Все" active={!selectedSub || selectedSub === 'all'} onClick={() => onSubSelect('all')} />
            {subs.map((sub) => (
              <SubChip key={sub.id} label={sub.name} icon={sub.icon} active={selectedSub === sub.id} onClick={() => onSubSelect(sub.id)} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ChipButton = ({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) => (
  <motion.button whileTap={{ scale: 0.95 }} onClick={onClick}
    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
      active ? 'bg-primary text-accent-foreground glow-green-sm' : 'glass text-muted-foreground hover:text-foreground'
    }`}>
    <span>{icon}</span><span>{label}</span>
  </motion.button>
);

const SubChip = ({ label, icon, active, onClick }: { label: string; icon?: string; active: boolean; onClick: () => void }) => (
  <motion.button whileTap={{ scale: 0.95 }} onClick={onClick}
    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
      active ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
    }`}>
    {icon && <span>{icon}</span>}{label}
  </motion.button>
);

export default CategoryChips;
