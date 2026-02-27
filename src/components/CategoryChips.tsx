import { useRef } from 'react';
import { motion } from 'framer-motion';
import { categories } from '@/lib/mock-data';

interface CategoryChipsProps {
  selected: string;
  onSelect: (id: string) => void;
}

const CategoryChips = ({ selected, onSelect }: CategoryChipsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4"
    >
      <ChipButton
        label="Все"
        icon="🔥"
        active={selected === 'all'}
        onClick={() => onSelect('all')}
      />
      {categories.map((cat) => (
        <ChipButton
          key={cat.id}
          label={cat.name}
          icon={cat.icon}
          active={selected === cat.id}
          onClick={() => onSelect(cat.id)}
        />
      ))}
    </div>
  );
};

const ChipButton = ({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
      active
        ? 'bg-primary text-accent-foreground glow-green-sm'
        : 'glass text-muted-foreground hover:text-foreground'
    }`}
  >
    <span>{icon}</span>
    <span>{label}</span>
  </motion.button>
);

export default CategoryChips;
