import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Camera, Send, PartyPopper, ArrowRight, ArrowLeft, Upload, X, Check, Square, UserPlus } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getBizType } from "@/lib/categories";
import { useCategories } from "@/hooks/useCategories";

const TOTAL_STEPS = 6;

const BUSINESS_CATEGORIES = [
  'Барбершоп',
  'Салон красоты',
  'Спа и массаж',
  'Ногтевая студия',
  'Медицинская клиника',
  'Стоматология',
  'Ресторан',
  'Кафе',
  'Кофейня',
  'Фастфуд',
  'Магазин',
  'Автосервис',
  'Автомойка',
  'Фитнес-клуб',
  'Спортивный клуб',
  'Школа и обучение',
  'Туристическое агентство',
  'Отель',
  'Услуги',
  'Другое',
];

const UZBEKISTAN_CITIES = [
  'Ташкент',
  'Самарканд',
  'Бухара',
  'Андижан',
  'Наманган',
  'Фергана',
  'Карши',
  'Коканд',
  'Нукус',
  'Ургенч',
  'Хива',
  'Термез',
  'Джизак',
  'Навои',
  'Гулистан',
  'Чирчик',
  'Ангрен',
];

const KAZAKHSTAN_CITIES = ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе'];
const RUSSIA_CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург'];

const COUNTRY_OPTIONS = [
  { value: 'Узбекистан', label: 'Узбекистан 🇺🇿', cities: UZBEKISTAN_CITIES },
  { value: 'Казахстан', label: 'Казахстан 🇰🇿', cities: KAZAKHSTAN_CITIES },
  { value: 'Россия', label: 'Россия 🇷🇺', cities: RUSSIA_CITIES },
];

const HOUR_OPTIONS = Array.from({ length: 18 }, (_, i) => {
  const h = (6 + i).toString().padStart(2, '0');
  return `${h}:00`;
});

const FieldLabel = ({ text, hint, required }: { text: string; hint: string; required?: boolean }) => (
  <div className="flex items-center gap-1.5 mb-1">
    <label className="text-xs font-medium text-foreground">
      {text}{required && ' *'}
    </label>
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-xs">{hint}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

interface PartnerOnboardingProps {
  open: boolean;
  onComplete: () => void;
}

const StepDots = ({ current }: { current: number }) => (
  <div className="flex gap-2 justify-center mb-6">
    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
      <div
        key={i}
        className={cn(
          'w-2 h-2 rounded-full transition-all duration-300',
          i === current ? 'bg-primary w-6' : i < current ? 'bg-primary/50' : 'bg-muted'
        )}
      />
    ))}
  </div>
);

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

/* ─── Step 1: Welcome ─── */
const StepWelcome = ({ onNext }: { onNext: () => void }) => (
  <div className="flex flex-col items-center text-center gap-6 py-4">
    <div className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center">
      <span className="text-4xl font-bold text-primary">T</span>
    </div>
    <div>
      <h2 className="text-xl font-bold text-foreground mb-2">Добро пожаловать в TUTGo!</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Настроим ваш бизнес за 5 минут.<br />
        Заполните основную информацию — и клиенты смогут находить вас и записываться онлайн.
      </p>
    </div>
    <button
      onClick={onNext}
      className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
    >
      Начать <ArrowRight className="w-4 h-4" />
    </button>
  </div>
);

/* ─── Step 2: Company Info ─── */
const StepCompanyInfo = ({ data, setData, onNext, onBack }: {
  data: Record<string, string>; setData: (d: Record<string, string>) => void; onNext: () => void; onBack: () => void;
}) => {
  const [showError, setShowError] = useState(false);
  const nameEmpty = !(data.name || '').trim();
  const addressEmpty = !(data.address || '').trim();
  const handleNext = () => {
    if (nameEmpty || addressEmpty) {
      setShowError(true);
      return;
    }
    setShowError(false);
    onNext();
  };
  const selectedCountry = COUNTRY_OPTIONS.find(c => c.value === (data.country || 'Узбекистан')) || COUNTRY_OPTIONS[0];
  const cityList = selectedCountry.cities;
  const workFrom = data.work_from || '09:00';
  const workTo = data.work_to || '21:00';
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center mb-2">
        <Building2 className="w-10 h-10 text-primary mx-auto mb-2" />
        <h2 className="text-lg font-bold text-foreground">О компании</h2>
        <p className="text-xs text-muted-foreground">Базовая информация для вашего профиля</p>
      </div>
      <div className="space-y-3">
        <div>
          <FieldLabel text="Название" hint="Как клиенты будут вас находить в поиске" required />
          <Input placeholder="Название компании" value={data.name || ''} onChange={e => setData({ ...data, name: e.target.value })}
            className={`bg-secondary border-border ${showError && nameEmpty ? 'ring-2 ring-destructive' : ''}`} />
          {showError && nameEmpty && (
            <p className="text-xs text-destructive mt-1">Заполните обязательные поля</p>
          )}
        </div>
        <div>
          <FieldLabel text="Категория" hint="Определяет в каком разделе появится бизнес" />
          <Select value={data.category || ''} onValueChange={(v) => setData({ ...data, category: v })}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel text="Страна" hint="Влияет на валюту и список городов" />
          <Select value={data.country || 'Узбекистан'} onValueChange={(v) => setData({ ...data, country: v, city: '' })}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Страна" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel text="Город" hint="Клиенты ищут заведения рядом с собой" />
          <Select value={data.city || ''} onValueChange={(v) => setData({ ...data, city: v })}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Город" />
            </SelectTrigger>
            <SelectContent>
              {cityList.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel text="Адрес" hint="Точный адрес — клиенты найдут вас на карте" required />
          <Input placeholder="Адрес" value={data.address || ''} onChange={e => setData({ ...data, address: e.target.value })}
            className={`bg-secondary border-border ${showError && addressEmpty ? 'ring-2 ring-destructive' : ''}`} />
          {showError && addressEmpty && (
            <p className="text-xs text-destructive mt-1">Заполните обязательные поля</p>
          )}
        </div>
        <div>
          <FieldLabel text="Часы работы" hint="Клиенты видят когда вы открыты" />
          <div className="flex items-center gap-2">
            <Select value={workFrom} onValueChange={(v) => setData({ ...data, work_from: v })}>
              <SelectTrigger className="bg-secondary border-border flex-1">
                <SelectValue placeholder="с" />
              </SelectTrigger>
              <SelectContent>
                {HOUR_OPTIONS.map((h) => (
                  <SelectItem key={h} value={h}>{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground text-sm">—</span>
            <Select value={workTo} onValueChange={(v) => setData({ ...data, work_to: v })}>
              <SelectTrigger className="bg-secondary border-border flex-1">
                <SelectValue placeholder="до" />
              </SelectTrigger>
              <SelectContent>
                {HOUR_OPTIONS.map((h) => (
                  <SelectItem key={h} value={h}>{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <FieldLabel text="Телефон" hint="Клиенты смогут позвонить напрямую" />
          <Input placeholder="Телефон" value={data.phone || ''} onChange={e => setData({ ...data, phone: e.target.value })}
            className="bg-secondary border-border" />
        </div>
        <div>
          <FieldLabel text="Описание" hint="Расскажите чем вы отличаетесь от других" />
          <textarea placeholder="Краткое описание" value={data.description || ''} onChange={e => setData({ ...data, description: e.target.value })}
            className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[72px] resize-none" />
        </div>
      </div>
      <div className="flex gap-3 mt-2">
        <button onClick={onBack} className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm flex items-center justify-center gap-1 active:scale-[0.97] transition-transform">
          <ArrowLeft className="w-4 h-4" /> Назад
        </button>
        <button onClick={handleNext} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-1 active:scale-[0.97] transition-transform">
          Далее <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/* ─── Step 3: Photo & Social ─── */
const StepPhotoSocial = ({ data, setData, onNext, onBack }: {
  data: Record<string, string>; setData: (d: Record<string, string>) => void; onNext: () => void; onBack: () => void;
}) => (
  <div className="flex flex-col gap-4">
    <div className="text-center mb-2">
      <Camera className="w-10 h-10 text-primary mx-auto mb-2" />
      <h2 className="text-lg font-bold text-foreground">Фото и соцсети</h2>
      <p className="text-xs text-muted-foreground">Добавьте логотип и ссылку на Instagram</p>
    </div>
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-1">
        <FieldLabel text="Логотип" hint="Ваш бренд — первое что видит клиент" />
        <div className="w-24 h-24 rounded-2xl bg-secondary border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
          <Upload className="w-6 h-6 text-muted-foreground mb-1" />
          <span className="text-[10px] text-muted-foreground">Логотип</span>
        </div>
      </div>
      <div>
        <FieldLabel text="Instagram" hint="Клиенты смотрят ваши работы перед записью" />
        <Input placeholder="@instagram" value={data.instagram || ''} onChange={e => setData({ ...data, instagram: e.target.value })}
          className="bg-secondary border-border" />
      </div>
      <div>
        <FieldLabel text="Telegram" hint="Получайте уведомления о новых записях" />
        <Input placeholder="@username" value={data.telegram || ''} onChange={e => setData({ ...data, telegram: e.target.value })}
          className="bg-secondary border-border" />
      </div>
      <div>
        <FieldLabel text="Сайт" hint="Дополнительная информация для клиентов" />
        <Input placeholder="https://yoursite.com" value={data.website || ''} onChange={e => setData({ ...data, website: e.target.value })}
          className="bg-secondary border-border" />
      </div>
      <p className="text-[11px] text-muted-foreground text-center">Вы сможете загрузить фото позже в настройках компании</p>
    </div>
    <div className="flex gap-3 mt-2">
      <button onClick={onBack} className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm flex items-center justify-center gap-1 active:scale-[0.97] transition-transform">
        <ArrowLeft className="w-4 h-4" /> Назад
      </button>
      <button onClick={onNext} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-1 active:scale-[0.97] transition-transform">
        Далее <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

/* ─── Step 4: Telegram ─── */
const StepTelegram = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => (
  <div className="flex flex-col items-center text-center gap-5 py-2">
    <Send className="w-12 h-12 text-primary" />
    <div>
      <h2 className="text-lg font-bold text-foreground mb-2">Уведомления в Telegram</h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Чтобы получать уведомления о новых записях, откройте Telegram и напишите боту:
      </p>
      <div className="bg-secondary rounded-xl p-4 text-left">
        <p className="text-sm text-foreground font-medium mb-1">1. Найдите <span className="text-primary font-bold">@TutGoUzBot</span></p>
        <p className="text-sm text-foreground font-medium">2. Отправьте команду <span className="text-primary font-mono font-bold">/start</span></p>
      </div>
    </div>
    <div className="flex gap-3 w-full mt-2">
      <button onClick={onBack} className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm flex items-center justify-center gap-1 active:scale-[0.97] transition-transform">
        <ArrowLeft className="w-4 h-4" /> Назад
      </button>
      <button onClick={onNext} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.97] transition-transform">
        Понятно ✓
      </button>
    </div>
  </div>
);

/* ─── Step 5: Done ─── */
const ChecklistItem = ({ done, label }: { done: boolean; label: string }) => (
  <div className="flex items-center gap-3 py-2">
    <div className={cn(
      'w-5 h-5 rounded-md flex items-center justify-center shrink-0',
      done ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
    )}>
      {done ? <Check className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
    </div>
    <span className={cn('text-sm', done ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
  </div>
);

const StepDone = ({ onComplete, hasService }: { onComplete: () => void; hasService: boolean }) => {
  const navigate = useNavigate();
  const handleAddStaff = async () => {
    await onComplete();
    navigate('/partner/staff');
  };
  return (
    <div className="flex flex-col items-center text-center gap-5 py-4">
      <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
        <PartyPopper className="w-10 h-10 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground mb-2">Всё готово! 🎉</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Ваш бизнес настроен. Завершите настройку, чтобы клиенты могли записываться.
        </p>
      </div>
      <div className="w-full bg-secondary/50 rounded-xl p-3 text-left">
        <ChecklistItem done={true} label="Компания создана" />
        <ChecklistItem done={hasService} label="Первая услуга" />
        <ChecklistItem done={false} label="Добавьте мастера" />
        <ChecklistItem done={false} label="Загрузите фото" />
      </div>
      <div className="flex flex-col w-full gap-2">
        <button
          onClick={handleAddStaff}
          className="w-full py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
        >
          <UserPlus className="w-4 h-4" /> Добавить мастера
        </button>
        <button
          onClick={onComplete}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.97] transition-transform"
        >
          Перейти в дашборд
        </button>
      </div>
    </div>
  );
};

/* ─── Step 5b: First Service ─── */
const COUNTRY_CURRENCY: Record<string, string> = {
  'Узбекистан': 'UZS',
  'Казахстан': 'KZT',
  'Россия': 'RUB',
};
const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

const StepFirstService = ({ data, setData, country, onNext, onSkip, onBack }: {
  data: Record<string, string>;
  setData: (d: Record<string, string>) => void;
  country?: string;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) => {
  const currency = COUNTRY_CURRENCY[country || 'Узбекистан'] || 'UZS';
  const handleNext = () => {
    setData({ ...data, currency });
    onNext();
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center mb-2">
        <Building2 className="w-10 h-10 text-primary mx-auto mb-2" />
        <h2 className="text-lg font-bold text-foreground">Первая услуга</h2>
        <p className="text-xs text-muted-foreground">Добавьте услугу — клиенты смогут записаться</p>
      </div>
      <div className="space-y-3">
        <div>
          <FieldLabel text="Название услуги" hint="Как будет называться услуга в каталоге" />
          <Input placeholder="Например: Стрижка мужская" value={data.name || ''} onChange={e => setData({ ...data, name: e.target.value })}
            className="bg-secondary border-border" />
        </div>
        <div>
          <FieldLabel text="Цена" hint="Клиенты видят стоимость до записи" />
          <div className="flex items-center gap-2">
            <Input type="number" inputMode="numeric" placeholder="0" value={data.price || ''} onChange={e => setData({ ...data, price: e.target.value })}
              className="bg-secondary border-border flex-1" />
            <span className="px-3 py-2 rounded-md bg-primary/10 text-primary text-xs font-semibold">{currency}</span>
          </div>
        </div>
        <div>
          <FieldLabel text="Длительность" hint="Влияет на доступные слоты в расписании" />
          <Select value={data.duration || '30'} onValueChange={(v) => setData({ ...data, duration: v })}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Длительность" />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((d) => (
                <SelectItem key={d} value={String(d)}>{d} минут</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-3 mt-2">
        <button onClick={onBack} className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm flex items-center justify-center gap-1 active:scale-[0.97] transition-transform">
          <ArrowLeft className="w-4 h-4" /> Назад
        </button>
        <button onClick={handleNext} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-1 active:scale-[0.97] transition-transform">
          Далее <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <button onClick={onSkip} className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
        Добавлю позже
      </button>
    </div>
  );
};

const PartnerOnboarding = ({ open, onComplete }: PartnerOnboardingProps) => {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [companyData, setCompanyData] = useState<Record<string, string>>({});
  const [socialData, setSocialData] = useState<Record<string, string>>({});
  const [serviceData, setServiceData] = useState<Record<string, string>>({});
  const { user, becomePartner } = useAuth();
  const { categories } = useCategories();

  const next = () => { setDir(1); setStep(s => s + 1); };
  const back = () => { setDir(-1); setStep(s => s - 1); };
  const skipService = () => { setServiceData({}); setDir(1); setStep(s => s + 1); };

  const handleComplete = async () => {
    if (user && companyData.name) {
      try {
        const workingHours = (companyData.work_from || companyData.work_to) ? {
          mon_fri: {
            open: companyData.work_from || '09:00',
            close: companyData.work_to || '21:00',
          },
        } : null;
        const locationMetadata: Record<string, unknown> = {};
        if (companyData.country) locationMetadata.country = companyData.country;
        if (workingHours) locationMetadata.working_hours = workingHours;

        const { data: location, error: locErr } = await supabase
          .from('locations')
          .insert({
            owner_id: user.id,
            name: companyData.name || 'Моя компания',
            phone: companyData.phone || null,
            address: companyData.address || null,
            description: companyData.description || null,
            business_type: getBizType(companyData.category || ''),
            city: companyData.city || 'Ташкент',
            verified: true,
            instagram: socialData.instagram || null,
            website: socialData.website || null,
            metadata: Object.keys(locationMetadata).length ? (locationMetadata as any) : null,
          })
          .select()
          .single();
        if (locErr) throw locErr;

        const trialEnds = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
        const { error: subErr } = await supabase.from('subscriptions').upsert({
          user_id: user.id,
          plan: 'pro',
          status: 'active',
          is_early_adopter: true,
          trial_ends_at: trialEnds,
          current_period_end: trialEnds,
        }, { onConflict: 'user_id' });
        if (subErr) throw subErr;

        const { error: notifErr } = await supabase.from('notifications').insert({
          user_id: user.id,
          title: 'Добро пожаловать в TUTGo! 🎉',
          body: 'Ваш бизнес создан. Pro-тариф активирован на 90 дней — добавьте услуги и начните принимать клиентов.',
          type: 'welcome',
          related_id: location?.id ?? null,
        });
        if (notifErr) throw notifErr;

        await becomePartner();

        const matchedCategory = categories.find(c =>
          c.name === companyData.category ||
          (c.subcategories as any[])?.some((s: any) => s.name === companyData.category)
        );

        await supabase.from('partner_applications').insert({
          user_id: user.id,
          company_name: companyData.name,
          category: companyData.category || '',
          phone: companyData.phone || '',
          address: companyData.address || '',
          description: companyData.description || null,
          instagram: socialData.instagram || null,
        });

        if (location?.id && serviceData.name && serviceData.name.trim()) {
          const { error: svcErr } = await supabase.from('services').insert({
            location_id: location.id,
            name: serviceData.name.trim(),
            price: Number(serviceData.price) || 0,
            duration_minutes: Number(serviceData.duration) || 60,
            currency: serviceData.currency || COUNTRY_CURRENCY[companyData.country || 'Узбекистан'] || 'UZS',
          });
          if (svcErr) console.error('First service save error:', svcErr);
        }
      } catch (e: any) {
        console.error('Onboarding save error:', e);
        toast.error(e?.message || 'Не удалось сохранить данные. Попробуйте ещё раз.');
        return;
      }
    }
    localStorage.setItem('partner_onboarding_done', 'true');
    localStorage.setItem('onboarding_completed', 'true');
    onComplete();
  };

  const steps = [
    <StepWelcome key="welcome" onNext={next} />,
    <StepCompanyInfo key="company" data={companyData} setData={setCompanyData} onNext={next} onBack={back} />,
    <StepPhotoSocial key="photo" data={socialData} setData={setSocialData} onNext={next} onBack={back} />,
    <StepTelegram key="telegram" onNext={next} onBack={back} />,
    <StepFirstService key="service" data={serviceData} setData={setServiceData} country={companyData.country} onNext={next} onSkip={skipService} onBack={back} />,
    <StepDone key="done" onComplete={handleComplete} hasService={!!(serviceData.name && serviceData.name.trim())} />,
  ];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="bg-card border-border max-w-[420px] w-[calc(100%-2rem)] p-6 rounded-2xl [&>button]:hidden max-h-[calc(100vh-80px)] overflow-y-auto"
        onPointerDownOutside={e => e.preventDefault()}
        onEscapeKeyDown={e => e.preventDefault()}
      >
        <StepDots current={step} />
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerOnboarding;
