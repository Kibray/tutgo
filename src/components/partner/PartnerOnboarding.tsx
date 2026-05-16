import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Camera, Send, PartyPopper, ArrowRight, ArrowLeft, Upload, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const TOTAL_STEPS = 5;

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
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center mb-2">
        <Building2 className="w-10 h-10 text-primary mx-auto mb-2" />
        <h2 className="text-lg font-bold text-foreground">О компании</h2>
        <p className="text-xs text-muted-foreground">Базовая информация для вашего профиля</p>
      </div>
      <div className="space-y-3">
        <div>
          <Input placeholder="Название компании *" value={data.name || ''} onChange={e => setData({ ...data, name: e.target.value })}
            className={`bg-secondary border-border ${showError && nameEmpty ? 'ring-2 ring-destructive' : ''}`} />
          {showError && nameEmpty && (
            <p className="text-xs text-destructive mt-1">Заполните обязательные поля</p>
          )}
        </div>
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
        <Input placeholder="Телефон" value={data.phone || ''} onChange={e => setData({ ...data, phone: e.target.value })}
          className="bg-secondary border-border" />
        <Select value={data.city || ''} onValueChange={(v) => setData({ ...data, city: v })}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="Город" />
          </SelectTrigger>
          <SelectContent>
            {UZBEKISTAN_CITIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div>
          <Input placeholder="Адрес *" value={data.address || ''} onChange={e => setData({ ...data, address: e.target.value })}
            className={`bg-secondary border-border ${showError && addressEmpty ? 'ring-2 ring-destructive' : ''}`} />
          {showError && addressEmpty && (
            <p className="text-xs text-destructive mt-1">Заполните обязательные поля</p>
          )}
        </div>
        <textarea placeholder="Краткое описание" value={data.description || ''} onChange={e => setData({ ...data, description: e.target.value })}
          className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[72px] resize-none" />
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
    <div className="flex flex-col items-center gap-4">
      <div className="w-24 h-24 rounded-2xl bg-secondary border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
        <Upload className="w-6 h-6 text-muted-foreground mb-1" />
        <span className="text-[10px] text-muted-foreground">Логотип</span>
      </div>
      <Input placeholder="@instagram" value={data.instagram || ''} onChange={e => setData({ ...data, instagram: e.target.value })}
        className="bg-secondary border-border" />
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
const StepDone = ({ onComplete }: { onComplete: () => void }) => (
  <div className="flex flex-col items-center text-center gap-6 py-6">
    <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
      <PartyPopper className="w-10 h-10 text-primary" />
    </div>
    <div>
      <h2 className="text-xl font-bold text-foreground mb-2">Всё готово! 🎉</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Ваш бизнес настроен. Теперь добавьте услуги и мастеров — и клиенты смогут записываться онлайн.
      </p>
    </div>
    <button
      onClick={onComplete}
      className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.97] transition-transform"
    >
      Перейти в панель управления
    </button>
  </div>
);

const PartnerOnboarding = ({ open, onComplete }: PartnerOnboardingProps) => {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [companyData, setCompanyData] = useState<Record<string, string>>({});
  const [socialData, setSocialData] = useState<Record<string, string>>({});
  const { user } = useAuth();

  const next = () => { setDir(1); setStep(s => s + 1); };
  const back = () => { setDir(-1); setStep(s => s - 1); };

  const handleComplete = async () => {
    if (user && companyData.name) {
      try {
        await supabase.from('locations').insert({
          owner_id: user.id,
          name: companyData.name || 'Моя компания',
          phone: companyData.phone || null,
          address: companyData.address || null,
          description: companyData.description || null,
          business_type: 'service',
          city: companyData.city || 'Ташкент',
        });
      } catch (e) {
        console.error('Onboarding save error:', e);
      }
    }
    localStorage.setItem('partner_onboarding_done', 'true');
    onComplete();
  };

  const steps = [
    <StepWelcome key="welcome" onNext={next} />,
    <StepCompanyInfo key="company" data={companyData} setData={setCompanyData} onNext={next} onBack={back} />,
    <StepPhotoSocial key="photo" data={socialData} setData={setSocialData} onNext={next} onBack={back} />,
    <StepTelegram key="telegram" onNext={next} onBack={back} />,
    <StepDone key="done" onComplete={handleComplete} />,
  ];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="bg-card border-border max-w-[420px] w-[calc(100%-2rem)] p-6 rounded-2xl [&>button]:hidden"
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
