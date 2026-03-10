import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Copy, Check, ExternalLink, Unlink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface TelegramLinkBlockProps {
  variant?: 'client' | 'business';
}

const TelegramLinkBlock = ({ variant = 'client' }: TelegramLinkBlockProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [telegramUsername, setTelegramUsername] = useState('');
  const [savedUsername, setSavedUsername] = useState('');
  const [chatId, setChatId] = useState<number | null>(null);
  const [linkCode, setLinkCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'code' | 'connected'>('input');

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('telegram_username, telegram_chat_id')
      .eq('user_id', user.id)
      .single();
    
    if (data?.telegram_chat_id) {
      setChatId(data.telegram_chat_id);
      setSavedUsername(data.telegram_username || '');
      setStep('connected');
    } else if (data?.telegram_username) {
      setSavedUsername(data.telegram_username);
      setTelegramUsername(data.telegram_username);
    }
  };

  // Poll for connection after code is generated
  useEffect(() => {
    if (step !== 'code' || !user) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('telegram_chat_id, telegram_username')
        .eq('user_id', user.id)
        .single();
      if (data?.telegram_chat_id) {
        setChatId(data.telegram_chat_id);
        setSavedUsername(data.telegram_username || telegramUsername);
        setStep('connected');
        toast({ title: '✅ Telegram подключён!', description: 'Теперь вы будете получать уведомления' });
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [step, user]);

  const generateCode = async () => {
    if (!user) return;
    setLoading(true);

    // Save username
    const cleanUsername = telegramUsername.replace('@', '').trim();
    if (cleanUsername) {
      await supabase
        .from('profiles')
        .update({ telegram_username: cleanUsername })
        .eq('user_id', user.id);
    }

    // Delete old codes
    await supabase
      .from('telegram_link_codes')
      .delete()
      .eq('user_id', user.id);

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    
    const { error } = await supabase
      .from('telegram_link_codes')
      .insert({
        user_id: user.id,
        code,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

    if (!error) {
      setLinkCode(code);
      setStep('code');
    } else {
      toast({ title: 'Ошибка', description: 'Не удалось сгенерировать код', variant: 'destructive' });
    }
    setLoading(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(linkCode);
    setCopied(true);
    toast({ title: 'Код скопирован!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const disconnect = async () => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ telegram_chat_id: null, telegram_username: null })
      .eq('user_id', user.id);
    setChatId(null);
    setSavedUsername('');
    setTelegramUsername('');
    setStep('input');
    toast({ title: 'Telegram отключён' });
  };

  if (!user) return null;

  const descText = variant === 'business'
    ? 'Получай уведомления о новых записях в Telegram!'
    : 'Получай уведомления о записях прямо в Telegram!';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4 mb-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${step === 'connected' ? 'bg-primary/15' : 'bg-blue-500/15'}`}>
          <Send className={`w-5 h-5 ${step === 'connected' ? 'text-primary' : 'text-blue-500'}`} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {step === 'connected' ? '✅ Telegram подключён' : '📱 Подключи Telegram'}
          </p>
          <p className="text-[11px] text-muted-foreground">{descText}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'connected' && (
          <motion.div key="connected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between bg-primary/10 rounded-lg px-3 py-2.5">
              <span className="text-sm text-foreground">
                ✅ @{savedUsername || 'подключено'}
              </span>
              <button
                onClick={disconnect}
                className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
              >
                <Unlink className="w-3.5 h-3.5" />
                Отключить
              </button>
            </div>
          </motion.div>
        )}

        {step === 'input' && (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Шаг 1: Введи @username</label>
              <input
                type="text"
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
                placeholder="@твой_username"
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <button
              onClick={generateCode}
              disabled={loading || !telegramUsername.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Получить код привязки</>
              )}
            </button>
          </motion.div>
        )}

        {step === 'code' && (
          <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-2">Шаг 2: Отправь этот код боту</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold tracking-[0.3em] text-foreground">{linkCode}</span>
                <button onClick={copyCode} className="p-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors">
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Код действителен 10 минут</p>
            </div>

            <a
              href="https://t.me/TutGoUzBot"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Открыть @TutGoUzBot
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <p className="text-[11px] text-muted-foreground text-center">
              Шаг 3: Отправь боту код <b>{linkCode}</b> и дождись подтверждения
            </p>

            <button
              onClick={() => setStep('input')}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              ← Назад
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TelegramLinkBlock;
