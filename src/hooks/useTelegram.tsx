import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import WebApp from '@twa-dev/sdk';
import { supabase } from '@/integrations/supabase/client';

interface TelegramContextType {
  isTelegram: boolean;
  user: typeof WebApp.initDataUnsafe.user | null;
  colorScheme: 'light' | 'dark';
  ready: boolean;
}

const TelegramContext = createContext<TelegramContextType>({
  isTelegram: false,
  user: null,
  colorScheme: 'dark',
  ready: false,
});

function applyTelegramTheme() {
  const tp = WebApp.themeParams;
  const root = document.documentElement;

  if (tp.bg_color) {
    root.style.setProperty('--tg-bg', tp.bg_color);
  }
  if (tp.secondary_bg_color) {
    root.style.setProperty('--tg-secondary-bg', tp.secondary_bg_color);
  }

  // Apply Telegram's color scheme class
  if (WebApp.colorScheme === 'light') {
    root.classList.add('tg-light');
  } else {
    root.classList.remove('tg-light');
  }
}

async function autoAuth(initData: string) {
  try {
    const res = await supabase.functions.invoke('telegram-miniapp-auth', {
      body: { initData },
    });

    if (res.data?.session) {
      await supabase.auth.setSession({
        access_token: res.data.session.access_token,
        refresh_token: res.data.session.refresh_token,
      });
    }
  } catch (e) {
    console.error('Telegram auto-auth failed:', e);
  }
}

export const TelegramProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<TelegramContextType>({
    isTelegram: false,
    user: null,
    colorScheme: 'dark',
    ready: false,
  });

  useEffect(() => {
    const isTg = Boolean(WebApp.initData && WebApp.initData.length > 0);

    if (!isTg) {
      setState(s => ({ ...s, ready: true }));
      return;
    }

    // Initialize Telegram WebApp
    WebApp.ready();
    WebApp.expand();
    applyTelegramTheme();

    const user = WebApp.initDataUnsafe?.user || null;

    setState({
      isTelegram: true,
      user,
      colorScheme: WebApp.colorScheme || 'dark',
      ready: false,
    });

    // Auto-authenticate
    autoAuth(WebApp.initData).finally(() => {
      setState(s => ({ ...s, ready: true }));
    });

    // Listen for theme changes
    WebApp.onEvent('themeChanged', applyTelegramTheme);

    return () => {
      WebApp.offEvent('themeChanged', applyTelegramTheme);
    };
  }, []);

  return (
    <TelegramContext.Provider value={state}>
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => useContext(TelegramContext);
