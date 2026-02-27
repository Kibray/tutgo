import { motion } from 'framer-motion';
import { Star, Clock, MapPin, Users, BadgeCheck } from 'lucide-react';
import { Service, formatPrice } from '@/lib/mock-data';
import { useNavigate } from 'react-router-dom';

const categoryEmoji: Record<string, string> = {
  tour: '🏔️',
  beauty: '✨',
  medical: '🏥',
  cafe: '☕️',
  retail: '🛍️',
  service: '🛠️',
  office: '🏢',
};

interface ServiceCardProps {
  service: Service;
  index: number;
  onClick?: () => void;
}

const ServiceCard = ({ service, index, onClick }: ServiceCardProps) => {
  const navigate = useNavigate();
  const isTour = service.category === 'tour';
  const isBookable = service.bookable !== false && (service.category === 'beauty' || service.category === 'medical' || service.category === 'tour' || service.category === 'service');

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
      className="glass rounded-lg p-4 flex gap-3 cursor-pointer active:scale-[0.98] transition-transform"
    >
      {/* Thumbnail */}
      <div className="w-20 h-20 rounded-md bg-secondary flex-shrink-0 flex items-center justify-center text-2xl">
        {categoryEmoji[service.category] || '📍'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {service.name}
          </h3>
          {service.verified && (
            <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {service.businessName}
        </p>

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-primary fill-primary" />
            {service.rating}
          </span>
          {service.duration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {service.duration} мин
            </span>
          )}
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {service.city}
          </span>
        </div>

        <div className="flex items-center justify-between mt-2">
          {service.price > 0 ? (
            <span className="text-sm font-bold text-gradient-green">
              {formatPrice(service.price)} {service.currency}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Посмотреть</span>
          )}
          {isTour && service.seatsLeft !== undefined && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <Users className="w-3 h-3" />
              {service.seatsLeft} мест
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ServiceCard;
