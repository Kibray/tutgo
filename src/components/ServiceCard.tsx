import { motion } from 'framer-motion';
import { Star, MapPin, BadgeCheck, Send, Heart, Users, CalendarDays, Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatPrice, categoryEmoji } from '@/lib/types';
import type { LocationItem } from '@/lib/types';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '@/hooks/usePreferences';

import { supabase } from '@/integrations/supabase/client';

interface ServiceCardProps {
  service: LocationItem;
  index: number;
  onClick?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  compact?: boolean;
}

const pluralReviews = (n: number) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return '';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'а';
  return 'ов';
};

const ServiceCard = ({ service, index, onClick, isFavorite, onToggleFavorite, compact }: ServiceCardProps) => {
  const navigate = useNavigate();
  const { t } = usePreferences();
  const isTour = service.business_type === 'tour';
  const [tourInfo, setTourInfo] = useState<{ remaining: number | null; durationDays: number | null } | null>(null);

  useEffect(() => {
    if (!isTour) return;
    const fetchTourInfo = async () => {
      const { data: svcs } = await supabase.from('services').select('id, max_seats, metadata').eq('location_id', service.id).limit(1);
      if (!svcs?.length) return;
      const svc = svcs[0] as any;
      const meta = svc.metadata || {};
      let remaining: number | null = null;
      if (svc.max_seats) {
        const { count } = await supabase.from('appointments').select('*', { count: 'exact', head: true })
          .eq('service_id', svc.id).in('status', ['confirmed', 'pending']);
        remaining = svc.max_seats - (count || 0);
      }
      setTourInfo({ remaining, durationDays: meta.duration_days || null });
    };
    fetchTourInfo();
  }, [service.id, isTour]);

  const handleClick = () => {
    if (onClick) return onClick();
    navigate(`/service/${service.id}`);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://tutgo.uz/service/${service.id}`;
    if (navigator.share) {
      navigator.share({ title: service.name, text: service.address || '', url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      // toast не используем — просто молча копируем
    }
  };

  const photoSrc = service.gallery?.[0] || service.branded_icon_url || null;
  const placeholderGradient =
    service.business_type === 'beauty' ? 'from-pink-500/30 to-purple-500/30' :
    service.business_type === 'medical' ? 'from-blue-500/30 to-cyan-500/30' :
    service.business_type === 'cafe' ? 'from-amber-500/30 to-orange-500/30' :
    service.business_type === 'tour' ? 'from-emerald-500/30 to-teal-500/30' :
    'from-primary/20 to-primary/40';

  const distance = (service as any)._distance as number | undefined;

  const favoriteBtn = onToggleFavorite && (
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
  );

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className="bg-secondary/80 border border-border/50 rounded-lg p-4 flex gap-3 cursor-pointer active:scale-[0.98] transition-transform relative"
      >
        {favoriteBtn}
        <div className="w-20 h-20 rounded-md bg-secondary flex-shrink-0 flex items-center justify-center overflow-hidden">
          {photoSrc ? (
            <img src={photoSrc} alt={service.name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${placeholderGradient}`}>
              <span className="text-2xl font-bold text-foreground/60">{service.name?.charAt(0)?.toUpperCase()}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 pr-8">
            <h3 className="text-sm font-semibold text-foreground truncate">{service.name}</h3>
            {service.verified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
          </div>
          <div className="mt-0.5">
            {service.verified ? (
              <span className="inline-flex items-center gap-0.5 text-[9px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium">✅ {t('index.online')}</span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">📞 {t('detail.call')}</span>
            )}
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
                <span className="text-xs text-muted-foreground">{t('card.view')}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {isTour && tourInfo?.durationDays && (
                <span className="flex items-center gap-0.5 px-2 py-1 rounded-md bg-secondary text-[10px] font-medium text-muted-foreground">
                  <CalendarDays className="w-3 h-3" />{tourInfo.durationDays}д
                </span>
              )}
              {isTour && tourInfo?.remaining !== null && tourInfo?.remaining !== undefined && (
                <span className={`flex items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-medium ${
                  tourInfo.remaining <= 0 ? 'bg-destructive/15 text-destructive' :
                  tourInfo.remaining <= 3 ? 'bg-destructive/15 text-destructive' :
                  tourInfo.remaining <= 5 ? 'bg-amber-500/15 text-amber-500' :
                  'bg-primary/15 text-primary'
                }`}>
                  <Users className="w-3 h-3" />
                  {tourInfo.remaining > 0 ? `${tourInfo.remaining} ${t('card.seats')}` : t('card.no_seats')}
                </span>
              )}
              {service.telegram && (
                <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://t.me/${service.telegram}`, '_blank');
                }} className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#2AABEE]/15 text-[#2AABEE] text-[10px] font-medium hover:bg-[#2AABEE]/25 transition-colors">
                  <Send className="w-3 h-3" />TG
                </motion.button>
              )}
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleShare}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-muted-foreground text-[10px] font-medium hover:bg-secondary/80 transition-colors">
                <Share2 className="w-3 h-3" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className="bg-secondary/80 border border-border/50 rounded-lg overflow-hidden cursor-pointer active:scale-[0.98] transition-transform relative"
    >
      {favoriteBtn}
      <div className="relative w-full h-[160px] bg-secondary overflow-hidden">
        {photoSrc ? (
          <img src={photoSrc} alt={service.name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${placeholderGradient}`}>
            <span className="text-5xl font-bold text-foreground/60">{service.name?.charAt(0)?.toUpperCase()}</span>
          </div>
        )}
        <div
          className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88), transparent)' }}
        />
        <div className="absolute inset-x-0 bottom-0 p-3 flex items-end justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-semibold text-white truncate drop-shadow">{service.name}</h3>
              {service.verified && <BadgeCheck className="w-4 h-4 text-white flex-shrink-0" />}
            </div>
            {service.address && (
              <p className="text-xs text-white/80 truncate mt-0.5">{service.address}</p>
            )}
          </div>
          {(service.price_from || 0) > 0 ? (
            <span className="text-sm font-bold text-gradient-green flex-shrink-0 bg-black/30 px-2 py-1 rounded-md backdrop-blur-sm">
              {formatPrice(service.price_from!)} {service.currency}
            </span>
          ) : (
            <span className="text-xs text-white/90 flex-shrink-0 bg-black/30 px-2 py-1 rounded-md backdrop-blur-sm">{t('card.view')}</span>
          )}
        </div>
      </div>

      <div className="p-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="text-foreground font-medium">{service.rating || 0}</span>
            {(service.review_count || 0) > 0 && (
              <span className="text-muted-foreground/70">· {service.review_count}</span>
            )}
          </span>
          {typeof distance === 'number' && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {distance < 1 ? `${Math.round(distance * 1000)} м` : `${distance.toFixed(1)} км`}
            </span>
          )}
          {service.verified ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium">✅ {t('index.online')}</span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">📞 {t('detail.call')}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isTour && tourInfo?.durationDays && (
            <span className="flex items-center gap-0.5 px-2 py-1 rounded-md bg-secondary text-[10px] font-medium text-muted-foreground">
              <CalendarDays className="w-3 h-3" />{tourInfo.durationDays}д
            </span>
          )}
          {isTour && tourInfo?.remaining !== null && tourInfo?.remaining !== undefined && (
            <span className={`flex items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-medium ${
              tourInfo.remaining <= 0 ? 'bg-destructive/15 text-destructive' :
              tourInfo.remaining <= 3 ? 'bg-destructive/15 text-destructive' :
              tourInfo.remaining <= 5 ? 'bg-amber-500/15 text-amber-500' :
              'bg-primary/15 text-primary'
            }`}>
              <Users className="w-3 h-3" />
              {tourInfo.remaining > 0 ? `${tourInfo.remaining} ${t('card.seats')}` : t('card.no_seats')}
            </span>
          )}
          {service.telegram && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => {
              e.stopPropagation();
              window.open(`https://t.me/${service.telegram}`, '_blank');
            }} className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#2AABEE]/15 text-[#2AABEE] text-[10px] font-medium hover:bg-[#2AABEE]/25 transition-colors">
              <Send className="w-3 h-3" />TG
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleShare}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-muted-foreground text-[10px] font-medium hover:bg-secondary/80 transition-colors">
            <Share2 className="w-3 h-3" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
