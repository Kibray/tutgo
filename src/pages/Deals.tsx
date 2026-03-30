import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tag, Clock, ChevronRight, Sparkles } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { formatPrice, getServiceEmoji } from '@/lib/types';
import { useCategories } from '@/hooks/useCategories';
import { usePreferences } from '@/hooks/usePreferences';
import { supabase } from '@/integrations/supabase/client';

interface Deal {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number;
  image_url: string | null;
  expires_at: string | null;
  is_active: boolean;
  location_id: string;
  locations: {
    id: string;
    name: string;
    business_type: string;
    city: string | null;
    category_id: string | null;
    address: string | null;
  };
}

const getBizType = (categoryName: string): string => {
  const map: Record<string, string> = {
    'Медицина': 'medical', 'Красота': 'beauty', 'Туры': 'tour',
    'Еда и напитки': 'cafe', 'Магазины': 'retail', 'Услуги': 'service',
  };
  return map[categoryName] || 'service';
};

const Deals = () => {
  const navigate = useNavigate();
  const { t, lang } = usePreferences();
  const [filter, setFilter] = useState('all');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const { categories } = useCategories();

  useEffect(() => {
    const fetchDeals = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('deals')
        .select('*, locations(id, name, business_type, city, category_id, address)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      const now = new Date();
      const active = (data || []).filter((d: any) => !d.expires_at || new Date(d.expires_at) > now);
      setDeals(active as Deal[]);
      setLoading(false);
    };
    fetchDeals();
  }, []);

  const selectedCat = categories.find(c => c.id === filter);
  const bizType = selectedCat ? getBizType(selectedCat.name) : null;
  const filteredDeals = filter === 'all' ? deals : deals.filter(d => d.locations?.business_type === bizType);
  const locale = lang === 'uz' ? 'uz' : lang === 'en' ? 'en' : 'ru';

  const handleUseDeal = (deal: Deal) => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred('medium');
    navigate(`/service/${deal.location_id}`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold font-display text-foreground">{t('deals.title')}</h1>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{t('deals.subtitle')}</p>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 -mx-4 px-4">
          <FilterChip label={t('cat.all')} active={filter === 'all'} onClick={() => setFilter('all')} />
          {categories.map((c) => (
            <FilterChip key={c.id} label={c.name} icon={c.icon} active={filter === c.id} onClick={() => setFilter(c.id)} />
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">🏷️</div>
            <p className="text-sm text-muted-foreground">{t('deals.empty')}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{t('deals.empty_desc')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDeals.map((deal, i) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => handleUseDeal(deal)}
              >
                <div className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5">
                  {deal.image_url ? (
                    <img src={deal.image_url} alt={deal.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl opacity-30">{categoryEmoji[deal.locations?.business_type] || '🏷️'}</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-sm font-extrabold px-3 py-1.5 rounded-xl shadow-lg">
                    -{deal.discount_percent}%
                  </div>
                  <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-foreground text-[10px] font-medium px-2 py-1 rounded-lg">
                    {categoryEmoji[deal.locations?.business_type] || '📍'} {deal.locations?.business_type}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-foreground">{deal.title}</h3>
                      <p className="text-xs text-primary font-medium mt-0.5">{deal.locations?.name}</p>
                    </div>
                  </div>

                  {deal.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{deal.description}</p>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {deal.expires_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {t('deals.until')} {new Date(deal.expires_at).toLocaleDateString(locale, { day: 'numeric', month: 'long' })}
                        </span>
                      )}
                      {deal.locations?.city && (
                        <span className="flex items-center gap-1">📍 {deal.locations.city}</span>
                      )}
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => { e.stopPropagation(); handleUseDeal(deal); }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                    >
                      {t('btn.details')} <ChevronRight className="w-3 h-3" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </motion.div>
  );
};

const FilterChip = ({ label, icon, active, onClick }: { label: string; icon?: string; active: boolean; onClick: () => void }) => (
  <motion.button whileTap={{ scale: 0.95 }} onClick={onClick}
    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
      active ? 'bg-primary text-primary-foreground glow-green-sm' : 'glass text-muted-foreground hover:text-foreground'
    }`}>
    {icon && <span>{icon}</span>}<span>{label}</span>
  </motion.button>
);

export default Deals;
