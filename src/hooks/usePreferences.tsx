import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { t as translate, type Lang, detectBrowserLang } from '@/lib/i18n';

interface PreferencesContextType {
  lang: Lang;
  darkMode: boolean;
  notifications: boolean;
  setLang: (l: Lang) => void;
  setDarkMode: (v: boolean) => void;
  setNotifications: (v: boolean) => void;
  t: (key: string) => string;
}

const PreferencesContext = createContext<PreferencesContextType>({
  lang: 'ru',
  darkMode: true,
  notifications: true,
  setLang: () => {},
  setDarkMode: () => {},
  setNotifications: () => {},
  t: (key: string) => translate(key, 'ru'),
});

function getInitialLang(): Lang {
  const stored = localStorage.getItem('tutgo_lang') as Lang;
  if (stored && ['ru', 'uz', 'en'].includes(stored)) return stored;
  const detected = detectBrowserLang();
  localStorage.setItem('tutgo_lang', detected);
  return detected;
}

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [lang, setLangState] = useState<Lang>(getInitialLang);
  const [darkMode, setDarkModeState] = useState(() => localStorage.getItem('tutgo_dark') !== 'false');
  const [notifications, setNotificationsState] = useState(true);

  // Load preferences from DB
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('language, dark_mode, notifications_enabled')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          if (data.language) { setLangState(data.language as Lang); localStorage.setItem('tutgo_lang', data.language); }
          setDarkModeState(data.dark_mode ?? true);
          localStorage.setItem('tutgo_dark', String(data.dark_mode ?? true));
          setNotificationsState(data.notifications_enabled ?? true);
        }
      });
  }, [user]);

  // Apply dark mode
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [darkMode]);

  const saveToDb = useCallback(async (updates: Record<string, any>) => {
    if (!user) return;
    await supabase.from('profiles').update(updates as any).eq('user_id', user.id);
  }, [user]);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('tutgo_lang', l);
    saveToDb({ language: l });
  };

  const setDarkMode = (v: boolean) => {
    setDarkModeState(v);
    localStorage.setItem('tutgo_dark', String(v));
    saveToDb({ dark_mode: v });
  };

  const setNotifications = (v: boolean) => {
    setNotificationsState(v);
    saveToDb({ notifications_enabled: v });
  };

  const tFn = useCallback((key: string) => {
    return translate(key, lang);
  }, [lang]);

  return (
    <PreferencesContext.Provider value={{ lang, darkMode, notifications, setLang, setDarkMode, setNotifications, t: tFn }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => useContext(PreferencesContext);
