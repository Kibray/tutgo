import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, MessageCircle, BarChart3, Image, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const benefits = [
  { icon: MapPin, key: 'partner_landing.benefit1' },
  { icon: MessageCircle, key: 'partner_landing.benefit2' },
  { icon: Image, key: 'partner_landing.benefit3' },
  { icon: BarChart3, key: 'partner_landing.benefit4' },
];

const PartnerLanding = () => {
  const navigate = useNavigate();
  const { user, becomePartner } = useAuth();
  const { t } = usePreferences();
  const { toast } = useToast();
  const { categories } = useCategories();

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [partnerTermsAccepted, setPartnerTermsAccepted] = useState(false);
  const [form, setForm] = useState({
    company_name: '',
    category: '',
    phone: '',
    address: '',
    description: '',
    instagram: '',
  });

  const handleCta = () => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred('medium');

    if (!user) {
      toast({ title: t('partner_landing.login_first') });
      navigate('/auth');
      return;
    }

    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.company_name || !form.category || !form.phone || !form.address) {
      toast({ title: t('common.error'), description: t('partner_landing.fill_required'), variant: 'destructive' });
      return;
    }
    if (!partnerTermsAccepted) {
      toast({ title: t('common.error'), description: 'Примите соглашение с партнёрами', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Become partner (get role)
      await becomePartner();

      // 2. Create location
      const { data: location, error: locError } = await supabase
        .from('locations')
        .insert({
          name: form.company_name,
          owner_id: user.id,
          business_type: mapCategoryToBizType(form.category),
          sub_category: form.category,
          address: form.address,
          phone: form.phone,
          description: form.description || null,
          verified: false,
          category_id: categories.find(c => c.name === form.category || c.subcategories?.some((s: any) => s.name === form.category))?.id || null,
        })
        .select('id')
        .single();

      if (locError) throw locError;

      // 3. Create partner application
      const { error: appError } = await supabase
        .from('partner_applications')
        .insert({
          user_id: user.id,
          company_name: form.company_name,
          category: form.category,
          phone: form.phone,
          address: form.address,
          description: form.description || null,
          instagram: form.instagram || null,
        });

      if (appError) {
        if (appError.message?.includes('idx_partner_applications_phone')) {
          toast({ title: t('common.error'), description: t('partner_landing.phone_taken'), variant: 'destructive' });
        } else {
          throw appError;
        }
        setSubmitting(false);
        return;
      }

      toast({ title: t('profile.partner_success'), description: t('partner_landing.app_submitted') });
      navigate('/partner');
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const mapCategoryToBizType = (cat: string): string => {
    const foodTypes = ['Кофейня', 'Кафе', 'Ресторан', 'Фастфуд', 'Столовая', 'Чайхана', 'Кондитерская', 'Бар/Паб'];
    if (foodTypes.includes(cat)) return 'cafe';
    const map: Record<string, string> = {
      'Медицина': 'medical', 'Красота': 'beauty', 'Туры': 'tour',
      'Магазины': 'retail', 'Услуги': 'service', 'Автосервис': 'auto',
      'Спорт': 'sport', 'Обучение': 'education',
    };
    return map[cat] || 'service';
  };

  // Build category options from DB categories + subcategories
  const categoryOptions: { label: string; value: string }[] = [];
  categories.forEach(cat => {
    const subs = (cat.subcategories as any[]) || [];
    if (subs.length > 0) {
      subs.forEach((s: any) => categoryOptions.push({ label: `${s.icon || ''} ${s.name}`, value: s.name }));
    } else {
      categoryOptions.push({ label: `${cat.icon || ''} ${cat.name}`, value: cat.name });
    }
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚀</span>
          </div>
          <h1 className="text-xl font-bold font-display text-foreground mb-2">{t('partner_landing.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('partner_landing.subtitle')}</p>
        </motion.div>

        {!showForm ? (
          <>
            <div className="space-y-3 mb-8">
              {benefits.map((b, i) => (
                <motion.div key={b.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className="glass rounded-lg p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                    <b.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{t(b.key)}</p>
                </motion.div>
              ))}
            </div>

            <motion.button whileTap={{ scale: 0.98 }}
              onClick={handleCta}
              className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm glow-green">
              {t('partner_landing.cta')}
            </motion.button>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="glass rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">{t('partner_landing.fake_warning')}</p>
            </div>

            <div className="space-y-3">
              <Input
                placeholder={t('partner_landing.company_name') + ' *'}
                value={form.company_name}
                onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
              />

              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('partner_landing.category') + ' *'} />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder={t('partner_landing.phone') + ' *'}
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                type="tel"
              />

              <Input
                placeholder={t('partner_landing.address') + ' *'}
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              />

              <Textarea
                placeholder={t('partner_landing.description_optional')}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />

              <Input
                placeholder="Instagram (@username)"
                value={form.instagram}
                onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
              />
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <Checkbox checked={partnerTermsAccepted} onCheckedChange={(v) => setPartnerTermsAccepted(v === true)} className="mt-0.5" />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Я принимаю{' '}
                  <Link to="/terms-partner" className="text-primary hover:underline">Соглашение с партнёрами</Link>
                  {' '}и{' '}
                  <Link to="/privacy" className="text-primary hover:underline">Политику конфиденциальности</Link>
                </span>
              </label>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={submitting || !partnerTermsAccepted}
              className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm glow-green disabled:opacity-50"
            >
              {submitting ? t('common.loading') : t('partner_landing.submit')}
            </motion.button>
          </motion.div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default PartnerLanding;
