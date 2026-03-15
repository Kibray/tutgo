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
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAccept = async () => {
    if (!accepted) return;
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

        <div className="py-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} className="mt-0.5" />
            <span className="text-sm text-foreground leading-relaxed">
              Мне исполнилось 18 лет, и я принимаю{' '}
              <Link to="/terms" className="text-primary hover:underline font-medium">Условия использования</Link>
              {' '}и{' '}
              <Link to="/privacy" className="text-primary hover:underline font-medium">Политику конфиденциальности</Link>
            </span>
          </label>
        </div>

        <Button onClick={handleAccept} disabled={!accepted || saving} className="w-full">
          {saving ? 'Сохраняем...' : 'Продолжить'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default TermsAcceptanceModal;
