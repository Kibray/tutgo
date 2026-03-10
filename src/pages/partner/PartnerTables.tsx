import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, QrCode, Download, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import PartnerLayout from '@/components/partner/PartnerLayout';

const statusColors: Record<string, { bg: string; label: string; emoji: string }> = {
  free: { bg: 'bg-green-500', label: 'Свободен', emoji: '🟢' },
  waiting: { bg: 'bg-amber-500', label: 'Ожидает', emoji: '🟡' },
  occupied: { bg: 'bg-red-500', label: 'Занят', emoji: '🔴' },
  bill: { bg: 'bg-blue-500', label: 'Счёт', emoji: '🔵' },
};

const PartnerTables = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tables, setTables] = useState<any[]>([]);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [locationSlug, setLocationSlug] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newNum, setNewNum] = useState('');
  const [newCap, setNewCap] = useState('4');

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: loc } = await supabase.from('locations').select('id, slug').eq('owner_id', user.id).eq('business_type', 'cafe').limit(1).single();
      if (loc) {
        setLocationId(loc.id);
        setLocationSlug(loc.slug || '');
        await fetchTables(loc.id);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  // Realtime table status
  useEffect(() => {
    if (!locationId) return;
    const channel = supabase
      .channel(`tables-${locationId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cafe_tables', filter: `location_id=eq.${locationId}` },
        () => { if (locationId) fetchTables(locationId); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [locationId]);

  const fetchTables = async (locId: string) => {
    const { data } = await supabase.from('cafe_tables').select('*').eq('location_id', locId).order('table_number');
    setTables(data || []);
  };

  const handleAdd = async () => {
    if (!newNum || !locationId) return;
    const qrUrl = `${window.location.origin}/cafe/${locationSlug}/table/${newNum}`;
    const { error } = await supabase.from('cafe_tables').insert({
      location_id: locationId,
      table_number: parseInt(newNum),
      capacity: parseInt(newCap) || 4,
      qr_code: qrUrl,
    });
    if (error) {
      toast({ title: 'Ошибка', description: 'Столик с таким номером уже есть', variant: 'destructive' });
    } else {
      setNewNum(''); setNewCap('4'); setShowForm(false);
      await fetchTables(locationId);
      toast({ title: 'Столик добавлен' });
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('cafe_tables').delete().eq('id', id);
    if (locationId) await fetchTables(locationId);
  };

  const handleDownloadQR = (table: any) => {
    const url = table.qr_code || `${window.location.origin}/cafe/${locationSlug}/table/${table.table_number}`;
    // Generate simple QR code via API
    const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}&bgcolor=1a1a2e&color=22c55e`;
    const a = document.createElement('a');
    a.href = qrApi;
    a.download = `table-${table.table_number}-qr.png`;
    a.target = '_blank';
    a.click();
    toast({ title: 'QR код скачан', description: `Столик №${table.table_number}` });
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Загрузка...</div>;

  return (
    <PartnerLayout title="🪑 Столики">
      <div className="px-4">

      <div className="px-4 mt-3 space-y-3">
        <button onClick={() => setShowForm(true)}
          className="w-full glass rounded-lg p-3 flex items-center gap-2 text-primary text-sm font-medium">
          <Plus className="w-4 h-4" />Добавить столик
        </button>

        {showForm && (
          <div className="glass rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input value={newNum} onChange={e => setNewNum(e.target.value)} placeholder="Номер *" type="number"
                className="w-full bg-secondary rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground border-none outline-none" />
              <input value={newCap} onChange={e => setNewCap(e.target.value)} placeholder="Вместимость" type="number"
                className="w-full bg-secondary rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground border-none outline-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Добавить</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-lg glass text-sm text-foreground">Отмена</button>
            </div>
          </div>
        )}

        {/* Table grid */}
        <div className="grid grid-cols-3 gap-3">
          {tables.map(table => {
            const st = statusColors[table.status] || statusColors.free;
            return (
              <motion.div
                key={table.id}
                whileTap={{ scale: 0.95 }}
                className="glass rounded-xl p-3 flex flex-col items-center gap-2 relative"
              >
                <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${st.bg}`} />
                <span className="text-2xl">🪑</span>
                <span className="text-sm font-bold text-foreground">№{table.table_number}</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Users className="w-3 h-3" />{table.capacity}
                </span>
                <span className="text-[9px] text-muted-foreground">{st.emoji} {st.label}</span>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => handleDownloadQR(table)} className="p-1.5 glass rounded-md">
                    <QrCode className="w-3.5 h-3.5 text-primary" />
                  </button>
                  <button onClick={() => handleDelete(table.id)} className="p-1.5 glass rounded-md">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {tables.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <p className="text-4xl">🪑</p>
            <p className="text-sm text-muted-foreground">Добавьте столики для вашего кафе</p>
          </div>
        )}
      </div>
    </PartnerLayout>
  );
};

export default PartnerTables;
