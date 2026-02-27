import { motion } from 'framer-motion';

interface DateChipProps {
  date: Date;
  active: boolean;
  onClick: () => void;
}

const DateChip = ({ date, active, onClick }: DateChipProps) => {
  const day = date.toLocaleDateString('ru', { weekday: 'short' });
  const num = date.getDate();
  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex flex-col items-center px-3 py-2.5 rounded-lg min-w-[52px] transition-colors ${
        active
          ? 'bg-primary text-accent-foreground glow-green-sm'
          : 'glass text-muted-foreground'
      }`}
    >
      <span className="text-[10px] font-medium">{isToday ? 'Сегодня' : day}</span>
      <span className="text-base font-bold mt-0.5">{num}</span>
    </motion.button>
  );
};

export default DateChip;
