import { Phone, Navigation, Globe, BadgeCheck, Star, MapPin, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Service, formatPrice, openDirections, copyAddress } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

interface BusinessSheetProps {
  service: Service | null;
  open: boolean;
  onClose: () => void;
  onFullPage?: () => void;
}

const categoryEmoji: Record<string, string> = {
  tour: '🏔️',
  beauty: '✨',
  medical: '🏥',
  cafe: '☕️',
  retail: '🛍️',
  service: '🛠️',
  office: '🏢',
};

const BusinessSheet = ({ service, open, onClose, onFullPage }: BusinessSheetProps) => {
  const { toast } = useToast();
  if (!service) return null;

  const fullAddress = `${service.address}, ${service.city}`;
  const lat = service.lat || 41.3111;
  const lng = service.lng || 69.2797;

  const handleCall = () => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred('light');
    if (service.phone) window.open(`tel:${service.phone}`);
  };

  const handleRoute = () => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred('medium');
    openDirections(lat, lng, fullAddress);
  };

  const handleWebsite = () => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred('light');
    if (service.website) {
      tg?.openLink?.(service.website) || window.open(service.website, '_blank');
    }
  };

  const handleCopy = () => {
    copyAddress(fullAddress);
    toast({ title: 'Адрес скопирован', description: fullAddress });
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="glass-strong border-border">
        <DrawerHeader className="text-left">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-2xl flex-shrink-0">
              {categoryEmoji[service.category] || '📍'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <DrawerTitle className="text-base font-bold text-foreground truncate">
                  {service.businessName}
                </DrawerTitle>
                {service.verified && (
                  <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </div>
              <DrawerDescription className="text-xs text-muted-foreground mt-0.5">
                {service.name}
              </DrawerDescription>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
              {service.rating} ({service.reviewCount})
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {service.city}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span className="flex-1 truncate">{fullAddress}</span>
            <button onClick={handleCopy} className="p-1 rounded hover:bg-secondary">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          {service.price > 0 && (
            <p className="text-lg font-bold text-gradient-green mt-2">
              {formatPrice(service.price)} {service.currency}
            </p>
          )}
        </DrawerHeader>

        {/* Action buttons */}
        <div className="px-4 pb-6 flex gap-3">
          {service.phone && (
            <ActionButton icon={<Phone className="w-5 h-5" />} label="Позвонить" onClick={handleCall} />
          )}
          <ActionButton icon={<Navigation className="w-5 h-5" />} label="Маршрут" onClick={handleRoute} primary />
          {service.website && (
            <ActionButton icon={<Globe className="w-5 h-5" />} label="Сайт" onClick={handleWebsite} />
          )}
          {onFullPage && (service.bookable !== false) && (
            <ActionButton
              icon={<span className="text-lg">📋</span>}
              label="Подробнее"
              onClick={onFullPage}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

const ActionButton = ({
  icon,
  label,
  onClick,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-colors ${
      primary
        ? 'bg-primary text-accent-foreground'
        : 'glass text-foreground'
    }`}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </motion.button>
);

export default BusinessSheet;
