import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { seedDemoData } from '@/scripts/seedDemoData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const SeedDemo = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [existingCount, setExistingCount] = useState(0);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.email !== 'demo@tutgo.uz') {
      setAccessError('Войдите под demo@tutgo.uz, чтобы открыть seed demo.');
      setCheckingAccess(false);
      return;
    }
    (async () => {
      const { data: isAdmin, error } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (error || !isAdmin) {
        setAccessError('У demo@tutgo.uz нет роли admin для запуска seed demo.');
        setCheckingAccess(false);
        return;
      }
      setAccessError(null);
      setCheckingAccess(false);
    })();
  }, [user, authLoading]);

  if (authLoading || checkingAccess) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const appendLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const run = async (force = false) => {
    setRunning(true);
    setNeedsConfirm(false);
    if (!force) setLogs([]);
    const result = await seedDemoData({ log: appendLog, forceRecreateAppointments: force });
    if (result.needsConfirm) {
      setNeedsConfirm(true);
      setExistingCount(result.existingAppointmentsCount || 0);
    } else if (result.ok) {
      setDone(true);
    }
    setRunning(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-3">
            <Sprout className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Demo Data Seeder 🌱</h1>
          <p className="text-sm text-muted-foreground mt-1">Только для demo@tutgo.uz</p>
        </div>

        {!running && !done && !needsConfirm && (
          <button
            onClick={() => run(false)}
            className="w-full bg-primary text-primary-foreground rounded-xl py-4 font-semibold hover:bg-primary/90 transition-colors"
          >
            Заполнить mock данные
          </button>
        )}

        {needsConfirm && (
          <div className="rounded-xl border border-border bg-card p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Данные уже есть ({existingCount} записей)</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Удалить старые записи и пересоздать?
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => run(true)}
                    className="flex-1 bg-destructive text-destructive-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-destructive/90"
                  >
                    Пересоздать
                  </button>
                  <button
                    onClick={() => { setNeedsConfirm(false); setDone(true); }}
                    className="flex-1 bg-muted text-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-muted/80"
                  >
                    Оставить как есть
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {logs.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 mt-4 max-h-96 overflow-y-auto">
            <div className="space-y-1.5 font-mono text-sm">
              {logs.map((line, i) => (
                <div key={i} className="text-foreground/90">{line}</div>
              ))}
              {running && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Выполняется...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {done && (
          <button
            onClick={() => navigate('/partner')}
            className="w-full mt-4 bg-primary text-primary-foreground rounded-xl py-4 font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            Открыть партнёрский кабинет
            <ExternalLink className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SeedDemo;
