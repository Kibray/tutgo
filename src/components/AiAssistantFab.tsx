import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, MapPin, CalendarPlus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';

interface ResultCard {
  id: string;
  name: string;
  address?: string;
  rating?: number;
  price_from?: number;
  currency?: string;
  lat?: number;
  lng?: number;
  business_type?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  results?: ResultCard[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

function parseResultsFromContent(content: string): { text: string; results: ResultCard[] } {
  const regex = /```json_results\s*([\s\S]*?)```/g;
  let results: ResultCard[] = [];
  const text = content.replace(regex, (_, json) => {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) results = parsed;
    } catch { /* ignore */ }
    return '';
  }).trim();
  return { text, results };
}

const AiAssistantFab = ({ onShowOnMap }: { onShowOnMap?: (locations: ResultCard[]) => void }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const input = query.trim();
    if (!input || loading) return;
    setQuery('');

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const apiMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Пожалуйста, войдите в аккаунт для использования AI ассистента.' }]);
        setLoading(false);
        return;
      }

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Ошибка сервера' }));
        setMessages(prev => [...prev, { role: 'assistant', content: err.error || 'Ошибка' }]);
        setLoading(false);
        return;
      }

      // Stream response
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';

      const updateAssistant = (content: string) => {
        const { text, results } = parseResultsFromContent(content);
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: text, results } : m);
          }
          return [...prev, { role: 'assistant', content: text, results }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              updateAssistant(assistantContent);
            }
          } catch { /* partial */ }
        }
      }
      // Final flush
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw.startsWith('data: ')) continue;
          const json = raw.slice(6).trim();
          if (json === '[DONE]') continue;
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) { assistantContent += c; updateAssistant(assistantContent); }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error('AI chat error:', e);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Произошла ошибка. Попробуйте позже.' }]);
    } finally {
      setLoading(false);
    }
  }, [query, messages, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const bookableTypes = ['beauty', 'medical', 'tour', 'service'];

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        className="fixed z-[1100] w-14 h-14 rounded-full bg-primary text-accent-foreground flex items-center justify-center glow-green shadow-lg"
        style={{ bottom: 'calc(70px + 16px)', right: '16px' }}
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[1200] flex flex-col"
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} />

            <div className="relative mt-auto mx-3 mb-24 glass-strong rounded-2xl flex flex-col max-h-[70vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">TUTGO AI</h3>
                    <p className="text-[10px] text-muted-foreground">Умный поиск услуг</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-hide">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center px-4">
                      Опишите, что ищете — я найду лучшие варианты в Ташкенте
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['🦷 Стоматология', '💇 Стрижка недорого', '🏔️ Туры'].map(s => (
                        <button key={s} onClick={() => { setQuery(s.replace(/^.\s/, '')); }}
                          className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-secondary text-secondary-foreground rounded-bl-md'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : msg.content}

                      {/* Result cards */}
                      {msg.results && msg.results.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.results.map((r) => (
                            <div key={r.id} className="bg-background/50 rounded-xl p-3 border border-border">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-foreground text-xs truncate">{r.name}</p>
                                  {r.address && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{r.address}</p>}
                                </div>
                                {r.rating != null && r.rating > 0 && (
                                  <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">⭐ {r.rating}</span>
                                )}
                              </div>
                              {(r.price_from ?? 0) > 0 && (
                                <p className="text-xs font-bold text-primary mt-1">
                                  от {new Intl.NumberFormat('ru-RU').format(r.price_from!)} {r.currency || 'сум'}
                                </p>
                              )}
                              <div className="flex gap-2 mt-2">
                                {r.lat && r.lng && (
                                  <button onClick={() => {
                                    onShowOnMap?.([r]);
                                    setOpen(false);
                                  }}
                                    className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors">
                                    <MapPin className="w-3 h-3" /> На карте
                                  </button>
                                )}
                                {bookableTypes.includes(r.business_type || '') && (
                                  <button onClick={() => { navigate(`/service/${r.id}`); setOpen(false); }}
                                    className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
                                    <CalendarPlus className="w-3 h-3" /> Записаться
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                          {messages[i].results!.length > 1 && (
                            <button onClick={() => {
                              onShowOnMap?.(msg.results!.filter(r => r.lat && r.lng));
                              setOpen(false);
                            }}
                              className="w-full text-[10px] py-1.5 text-primary hover:underline">
                              📍 Показать все на карте
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="px-3 pb-3 pt-2 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Что вы ищете?"
                    className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors"
                  />
                  <button
                    disabled={loading || !query.trim()}
                    onClick={sendMessage}
                    className="w-11 h-11 rounded-xl bg-primary text-accent-foreground flex items-center justify-center flex-shrink-0 disabled:opacity-50 transition-opacity"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiAssistantFab;
