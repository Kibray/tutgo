import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Search, Star, MapPin, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';
import ComingSoonBanner from '@/components/ComingSoonBanner';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'all', icon: '🏨', label: 'Все' },
  { id: 'hotel', icon: '🏨', label: 'Отели' },
  { id: 'hostel', icon: '🛏️', label: 'Хостелы' },
  { id: 'apartment', icon: '🏠', label: 'Квартиры' },
  { id: 'guesthouse', icon: '🏡', label: 'Гостевые дома' },
];

const MOCK_STAYS = [
  {
    id: '1', name: 'Ichan Qala Hotel', city: 'Хива', category: 'hotel',
    photo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
    rating: 4.8, reviews: 124, price: 450000, amenities: ['🏊 Бассейн', '📶 Wi-Fi', '🅿️ Парковка', '🍽️ Завтрак'],
    tag: '🔥 Популярный',
  },
  {
    id: '2', name: 'Registan Plaza', city: 'Самарканд', category: 'hotel',
    photo: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop',
    rating: 4.9, reviews: 89, price: 680000, amenities: ['🏊 Бассейн', '💆 SPA', '📶 Wi-Fi', '🍽️ Ресторан'],
    tag: '⭐ Премиум',
  },
  {
    id: '3', name: 'Old City Hostel', city: 'Бухара', category: 'hostel',
    photo: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop',
    rating: 4.5, reviews: 56, price: 120000, amenities: ['📶 Wi-Fi', '🍽️ Кухня', '🧺 Стирка'],
    tag: '💰 Бюджетный',
  },
  {
    id: '4', name: 'Tashkent City Apartment', city: 'Ташкент', category: 'apartment',
    photo: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
    rating: 4.7, reviews: 34, price: 350000, amenities: ['📶 Wi-Fi', '🧊 Кондиционер', '🅿️ Парковка', '🍳 Кухня'],
    tag: null,
  },
  {
    id: '5', name: 'Silk Road Guest House', city: 'Самарканд', category: 'guesthouse',
    photo: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
    rating: 4.6, reviews: 78, price: 220000, amenities: ['📶 Wi-Fi', '🍽️ Завтрак', '🌳 Сад'],
    tag: '🆕 Новый',
  },
];

const comingSoonToast = () => toast('🚧 Скоро будет доступно', { description: 'Раздел в разработке — следите за обновлениями!' });

const Stay = () => {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = MOCK_STAYS.filter(s => activeCategory === 'all' || s.category === activeCategory);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">🏨 Жильё</h1>
        </div>
      </div>

      <ComingSoonBanner feature="stay" />

      <div className={cn('px-4 py-4 space-y-4', isDesktop && 'max-w-3xl mx-auto')}>
        {/* Search form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-4 space-y-3"
        >
          <div className="h-10 rounded-xl bg-muted border border-border flex items-center px-3 text-xs text-muted-foreground opacity-70">
            <MapPin className="w-3.5 h-3.5 mr-2" /> Город или название отеля
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground opacity-70">📅 Заезд</div>
            <div className="flex-1 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground opacity-70">📅 Выезд</div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground opacity-70">👥 2 гостя</div>
            <div className="flex-1 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground opacity-70">🛏️ 1 номер</div>
          </div>
          <Button onClick={comingSoonToast} className="w-full gap-2 opacity-80" disabled>
            <Search className="w-4 h-4" /> Найти жильё
          </Button>
        </motion.div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                activeCategory === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">{filtered.length} вариантов</p>

        {/* Stay cards */}
        <div className="space-y-3">
          {filtered.map((stay, i) => (
            <motion.div
              key={stay.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={comingSoonToast}
              className="bg-card rounded-2xl overflow-hidden border border-border cursor-pointer hover:border-primary/30 transition-all group"
            >
              <div className="relative h-[180px]">
                <img
                  src={stay.photo}
                  alt={stay.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {stay.tag && (
                    <Badge className="bg-black/60 backdrop-blur-sm text-white text-[10px] border-0">{stay.tag}</Badge>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); comingSoonToast(); }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
                >
                  <Heart className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-foreground line-clamp-1">{stay.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {stay.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-semibold text-foreground">{stay.rating}</span>
                    <span className="text-[10px] text-muted-foreground">({stay.reviews})</span>
                  </div>
                </div>

                <div className="flex gap-1 flex-wrap">
                  {stay.amenities.slice(0, 4).map((a, j) => (
                    <Badge key={j} variant="outline" className="text-[10px] border-border">{a}</Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-lg font-bold text-primary">{stay.price.toLocaleString()} сум</p>
                    <p className="text-[10px] text-muted-foreground">за ночь</p>
                  </div>
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); comingSoonToast(); }} className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(200,100%,50%)] text-primary-foreground opacity-80">
                    Забронировать →
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {!isDesktop && <BottomNav />}
    </div>
  );
};

export default Stay;
