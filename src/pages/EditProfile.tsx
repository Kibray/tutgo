import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import BottomNav from '@/components/BottomNav';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = usePreferences();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('display_name, phone, telegram_username, avatar_url')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name || '');
          setPhone(data.phone || '');
          setTelegramUsername(data.telegram_username || '');
          setAvatarUrl(data.avatar_url || '');
        }
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      display_name: displayName || null,
      phone: phone || null,
      telegram_username: telegramUsername || null,
    }).eq('user_id', user.id);
    setSaving(false);

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('edit.saved') });
      navigate('/profile');
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold font-display text-foreground">{t('edit.title')}</h1>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">👤</span>
              )}
            </div>
            <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <Camera className="w-3.5 h-3.5 text-primary-foreground" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{t('edit.upload_avatar')}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('edit.name')}</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)}
              className="w-full glass rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('edit.phone')}</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+998"
              className="w-full glass rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('edit.telegram')}</label>
            <input value={telegramUsername} onChange={e => setTelegramUsername(e.target.value)} placeholder="@username"
              className="w-full glass rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors" />
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving}
          className="w-full mt-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          <Save className="w-4 h-4" />
          {saving ? t('common.loading') : t('edit.save')}
        </motion.button>
      </div>
      <BottomNav />
    </div>
  );
};

export default EditProfile;
