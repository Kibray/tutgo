import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TermsAcceptanceModalProps {
  open: boolean;
  userId: string;
  onAccepted: () => void;
}

const TermsAcceptanceModal = ({ open, userId, onAccepted }: TermsAcceptanceModalProps) => {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  const canContinue = ageConfirmed && termsAccepted;

  const handleAccept = async () => {
    if (!canContinue) return;
    setSaving(true);

    const { error } = await supabase.from('profiles').update({
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
    }).eq('user_id', userId);

    setSaving(false);

    if (error) {
      toast.error('Ошибка сохранения: ' + error.message);
      return;
    }

    onAccepted();
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold font-display text-foreground">Добро пожаловать в TutGo!</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            Перед использованием сервиса подтвердите следующее:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox checked={ageConfirmed} onCheckedChange={(v) => setAgeConfirmed(v === true)} className="mt-0.5" />
            <span className="text-sm text-foreground leading-relaxed">Мне исполнилось 18 лет</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox checked={termsAccepted} onCheckedChange={(v) => setTermsAccepted(v === true)} className="mt-0.5" />
            <span className="text-sm text-foreground leading-relaxed">
              Я принимаю{' '}
              <Link to="/terms" className="text-primary hover:underline font-medium">Пользовательское соглашение</Link>
              {' '}и{' '}
              <Link to="/privacy" className="text-primary hover:underline font-medium">Политику конфиденциальности</Link>
              {' '}TutGo
            </span>
          </label>
        </div>

        <Button onClick={handleAccept} disabled={!canContinue || saving} className="w-full">
          {saving ? 'Сохраняем...' : 'Продолжить'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default TermsAcceptanceModal;
