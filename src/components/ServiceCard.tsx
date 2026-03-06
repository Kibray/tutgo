import { motion } from 'framer-motion';
import { Star, MapPin, BadgeCheck, Send, Heart } from 'lucide-react';
import { formatPrice, categoryEmoji } from '@/lib/types';
import type { LocationItem } from '@/lib/types';
import { useNavigate } from 'react-router-dom';

interface ServiceCardProps {
  service: LocationItem;
  index: number;
  onClick?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

const pluralReviews = (n: number) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return '';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'а';
  return 'ов';
};

const ServiceCard = ({ service, index, onClick, isFavorite, onToggleFavorite }: ServiceCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) return onClick();
    navigate(`/service/${service.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      onClick={handleClick}
      className="glass rounded-lg p-4 flex gap-3 cursor-pointer active:scale-[0.98] transition-transform relative"
    >
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const tg = (window as any).Telegram?.WebApp;
            tg?.HapticFeedback?.impactOccurred('light');
            onToggleFavorite(service.id);
          }}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-background/60 backdrop-blur-sm"
        >
          <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
        </button>
      )}
      <div className="w-20 h-20 rounded-md bg-secondary flex-shrink-0 flex items-center justify-center text-2xl">
        {categoryEmoji[service.business_type] || '📍'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 pr-8">
          <h3 className="text-sm font-semibold text-foreground truncate">{service.name}</h3>
          {service.verified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{service.address}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-primary fill-primary" />{service.rating || 0}
            {(service.review_count || 0) > 0 && <span className="text-muted-foreground/70">· {service.review_count} отзыв{pluralReviews(service.review_count || 0)}</span>}
          </span>
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{service.city}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {(service.price_from || 0) > 0 ? (
              <span className="text-sm font-bold text-gradient-green">{formatPrice(service.price_from!)} {service.currency}</span>
            ) : (
              <span className="text-xs text-muted-foreground">Посмотреть</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {service.telegram && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => {
                e.stopPropagation();
                window.open(`https://t.me/${service.telegram}`, '_blank');
              }} className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#2AABEE]/15 text-[#2AABEE] text-[10px] font-medium hover:bg-[#2AABEE]/25 transition-colors">
                <Send className="w-3 h-3" />TG
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ServiceCard;
