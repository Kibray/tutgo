import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Send, BarChart3, Check, Link2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Props {
  locationId: string;
  locationName: string;
  businessType: string;
  rating: number | null;
  reviewCount: number | null;
  priceFrom: number | null;
  currency: string | null;
}

const categoryLabels: Record<string, string> = {
  beauty: '✂️ Красота',
  medical: '💊 Медицина',
  tour: '🌍 Туры',
  cafe: '☕ Кафе',
  retail: '🛍️ Магазин',
  service: '🔧 Сервис',
  office: '🏢 Офис',
};

const BusinessLinkSection = ({ locationId, locationName, businessType, rating, reviewCount, priceFrom, currency }: Props) => {
  const { user } = useAuth();
  const [slug, setSlug] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ week: 0, month: 0 });
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    (supabase.from('locations') as any)
      .select('slug')
      .eq('id', locationId)
      .single()
      .then(({ data }: any) => {
        if (data?.slug) setSlug(data.slug);
      });
  }, [locationId]);

  useEffect(() => {
    if (!slug || !showStats) return;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    Promise.all([
      (supabase.from as any)('referral_clicks').select('id', { count: 'exact', head: true }).eq('location_slug', slug).gte('clicked_at', weekAgo),
      (supabase.from as any)('referral_clicks').select('id', { count: 'exact', head: true }).eq('location_slug', slug).gte('clicked_at', monthAgo),
    ]).then(([weekRes, monthRes]) => {
      setStats({ week: weekRes.count || 0, month: monthRes.count || 0 });
    });
  }, [slug, showStats]);

  if (!slug) return null;

  const link = `tutgo.uz/b/${slug}`;
  const fullLink = `https://tutgo.lovable.app/b/${slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    toast.success('Ссылка скопирована');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTelegram = () => {
    const catLabel = categoryLabels[businessType] || '🔧 Сервис';
    const ratingStr = rating ? `⭐ Рейтинг: ${rating}` + (reviewCount ? ` · ${reviewCount} отзывов` : '') : '';
    const priceStr = priceFrom ? `💰 от ${new Intl.NumberFormat('ru-RU').format(priceFrom)} ${currency || 'сум'}` : '';

    const text = `━━━━━━━━━━━━━━━━━━━━\n📍 ${locationName}\n\n${catLabel} в Ташкенте${ratingStr ? `\n${ratingStr}` : ''}${priceStr ? `\n${priceStr}` : ''}\n\n📲 Записывайся онлайн — быстро и удобно!\n👉 ${fullLink}\n\n🌐 Powered by TutGo\n━━━━━━━━━━━━━━━━━━━━`;

    window.open(`https://t.me/share/url?url=${encodeURIComponent(fullLink)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Моя ссылка</h3>
      </div>

      <div className="bg-secondary/50 rounded-xl px-3 py-2.5 flex items-center gap-2">
        <span className="text-xs text-muted-foreground flex-1 font-mono truncate">{link}</span>
        <button onClick={handleCopy} className="text-primary flex-shrink-0">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 bg-secondary/50 rounded-xl py-2 text-xs font-medium text-foreground flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
        >
          <Copy className="w-3.5 h-3.5" /> Скопировать
        </button>
        <button
          onClick={handleShareTelegram}
          className="flex-1 bg-primary/15 rounded-xl py-2 text-xs font-medium text-primary flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
        >
          <Send className="w-3.5 h-3.5" /> Telegram
        </button>
      </div>

      <button
        onClick={() => setShowStats(!showStats)}
        className="w-full bg-secondary/30 rounded-xl py-2 text-xs font-medium text-muted-foreground flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
      >
        <BarChart3 className="w-3.5 h-3.5" /> Статистика переходов
      </button>

      {showStats && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex gap-3"
        >
          <div className="flex-1 bg-secondary/50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-foreground">{stats.week}</p>
            <p className="text-[10px] text-muted-foreground">за 7 дней</p>
          </div>
          <div className="flex-1 bg-secondary/50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-foreground">{stats.month}</p>
            <p className="text-[10px] text-muted-foreground">за 30 дней</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BusinessLinkSection;
