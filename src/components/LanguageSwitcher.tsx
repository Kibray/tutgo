import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePreferences } from '@/hooks/usePreferences';
import { LANG_FLAGS, type Lang } from '@/lib/i18n';

const langs: Lang[] = ['ru', 'uz', 'en'];
const langCodes: Record<Lang, string> = { ru: 'RU', uz: 'UZ', en: 'EN' };

const LanguageSwitcher = () => {
  const { lang, setLang } = usePreferences();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-secondary/80 backdrop-blur-sm text-xs font-medium text-foreground hover:bg-secondary transition-colors"
      >
        <span>{LANG_FLAGS[lang]}</span>
        <span>{langCodes[lang]}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-1 bg-card rounded-xl border border-border shadow-xl overflow-hidden z-[3000] min-w-[120px]"
          >
            {langs.map((l) => (
              <button
                key={l}
                onClick={() => { setLang(l); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                  lang === l ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-secondary'
                }`}
              >
                <span>{LANG_FLAGS[l]}</span>
                <span>{langCodes[l]}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;
