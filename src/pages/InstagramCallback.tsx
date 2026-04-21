import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const InstagramCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Подключаем Instagram…');

  useEffect(() => {
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error_description') || params.get('error');
    const expectedState = sessionStorage.getItem('ig_oauth_state');
    sessionStorage.removeItem('ig_oauth_state');

    if (error) {
      setStatus('error');
      setMessage(error);
      return;
    }
    if (!code) {
      setStatus('error');
      setMessage('Код авторизации не получен');
      return;
    }
    if (state && expectedState && state !== expectedState) {
      setStatus('error');
      setMessage('Неверный state — возможна попытка подмены');
      return;
    }

    const redirectUri = `${window.location.origin}/instagram-callback`;
    supabase.functions
      .invoke('instagram-oauth-callback', { body: { code, redirect_uri: redirectUri } })
      .then(({ data, error: invErr }) => {
        if (invErr || (data as any)?.error) {
          setStatus('error');
          setMessage((data as any)?.error || invErr?.message || 'Ошибка подключения');
          return;
        }
        setStatus('success');
        setMessage('Instagram успешно подключён!');
        setTimeout(() => navigate('/partner'), 1500);
      });
  }, [params, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="glass rounded-2xl p-8 max-w-sm w-full text-center">
        {status === 'loading' && <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />}
        {status === 'success' && <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />}
        {status === 'error' && <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />}
        <h1 className="text-lg font-bold text-foreground mb-2">
          {status === 'loading' && 'Подождите…'}
          {status === 'success' && 'Готово!'}
          {status === 'error' && 'Ошибка'}
        </h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        {status === 'error' && (
          <button
            onClick={() => navigate('/partner')}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
          >
            Вернуться
          </button>
        )}
      </div>
    </div>
  );
};

export default InstagramCallback;