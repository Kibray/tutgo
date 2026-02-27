import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send } from 'lucide-react';

const AiAssistantFab = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  return (
    <>
      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        className="fixed z-[1100] w-14 h-14 rounded-full bg-primary text-accent-foreground flex items-center justify-center glow-green shadow-lg"
        style={{ bottom: 'calc(70px + 16px)', right: '16px' }}
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>

      {/* Chat Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[1200] flex flex-col"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} />

            {/* Chat panel */}
            <div className="relative mt-auto mx-4 mb-24 glass-strong rounded-2xl p-4 max-h-[60vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">AI Ассистент</h3>
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground text-center px-4">
                  Опишите, что вы ищете<br />
                  <span className="text-xs opacity-70">(например: круглосуточная стоматология)</span>
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Что вы ищете?"
                  className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors"
                />
                <button
                  className="w-11 h-11 rounded-xl bg-primary text-accent-foreground flex items-center justify-center flex-shrink-0"
                  onClick={() => {
                    if (query.trim()) {
                      setQuery('');
                    }
                  }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiAssistantFab;
