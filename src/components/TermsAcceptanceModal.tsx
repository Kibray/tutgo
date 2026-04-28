import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TermsAcceptanceModalProps {
  open: boolean;
  userId: string;
  onAccepted: () => void;
  variant?: 'client' | 'partner';
}

const TermsAcceptanceModal = ({ open, userId, onAccepted, variant = 'client' }: TermsAcceptanceModalProps) => {
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  const isPartner = variant === 'partner';

  const handleAccept = async () => {
    if (!accepted) return;
    setSaving(true);

    const updateData = isPartner
      ? { partner_terms_accepted: true, partner_terms_accepted_at: new Date().toISOString() }
      : { terms_accepted: true, terms_accepted_at: new Date().toISOString() };

    const { error } = await supabase.from('profiles').update(updateData as any).eq('user_id', userId);

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
          <DialogTitle className="text-lg font-bold font-display text-foreground">
            {isPartner ? 'Регистрация партнёра TutGo 🏢' : 'Добро пожаловать в TutGo! 🎉'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            Прежде чем начать, примите условия:
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} className="mt-0.5" />
            <span className="text-sm text-foreground leading-relaxed">
              {isPartner ? (
                <>
                  Я принимаю{' '}
                  <a href="/terms-partner" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Соглашение с партнёрами</a>
                  {' '}и{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Политику конфиденциальности</a>
                </>
              ) : (
                <>
                  Мне исполнилось 18 лет, и я принимаю{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Условия использования</a>
                  {' '}и{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Политику конфиденциальности</a>
                </>
              )}
            </span>
          </label>
        </div>

        <Button onClick={handleAccept} disabled={!accepted || saving} className="w-full">
          {saving ? 'Сохраняем...' : 'Продолжить →'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default TermsAcceptanceModal;
