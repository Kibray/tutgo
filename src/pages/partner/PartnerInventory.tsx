import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Minus, Package, X, History, AlertTriangle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const UNITS = ['шт', 'мл', 'кг', 'л', 'уп'];

const PartnerInventory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [locations, setLocations] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [opModal, setOpModal] = useState<{ id: string; type: 'restock' | 'write_off' } | null>(null);
  const [opQty, setOpQty] = useState('');
  const [opNote, setOpNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', quantity: '', unit: 'шт', min_stock: '', location_id: '' });

  useEffect(() => {
    if (!user) return;
    supabase.from('locations').select('id, name').eq('owner_id', user.id).then(({ data }) => {
      setLocations(data || []);
      if (data?.length && !form.location_id) setForm(f => ({ ...f, location_id: data[0].id }));
    });
  }, [user]);

  const loadItems = async () => {
    if (!locations.length) return;
    const ids = locations.map(l => l.id);
    const { data } = await supabase.from('inventory').select('*').in('location_id', ids).order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { if (locations.length) loadItems(); }, [locations]);

  const loadHistory = async (inventoryId: string) => {
    const { data } = await supabase.from('inventory_operations').select('*')
      .eq('inventory_id', inventoryId).order('created_at', { ascending: false }).limit(20);
    setOperations(data || []);
    setShowHistory(inventoryId);
  };

  const handleAdd = async () => {
    if (!form.name || !form.quantity || !form.location_id) { toast.error('Заполните обязательные поля'); return; }
    setSaving(true);
    const { error } = await supabase.from('inventory').insert({
      name: form.name,
      quantity: Number(form.quantity),
      unit: form.unit,
      min_stock: Number(form.min_stock) || 0,
      location_id: form.location_id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Товар добавлен');
    setForm({ name: '', quantity: '', unit: 'шт', min_stock: '', location_id: locations[0]?.id || '' });
    setShowForm(false);
    loadItems();
  };

  const handleOperation = async () => {
    if (!opModal || !opQty || Number(opQty) <= 0) { toast.error('Введите количество'); return; }
    setSaving(true);
    const qty = Number(opQty);
    const item = items.find(i => i.id === opModal.id);
    if (!item) return;

    const newQty = opModal.type === 'restock' ? item.quantity + qty : Math.max(0, item.quantity - qty);

    const { error: opErr } = await supabase.from('inventory_operations').insert({
      inventory_id: opModal.id,
      operation_type: opModal.type,
      quantity: qty,
      note: opNote || null,
      performed_by: user?.id || null,
    });
    if (opErr) { toast.error(opErr.message); setSaving(false); return; }

    const { error } = await supabase.from('inventory').update({ quantity: newQty }).eq('id', opModal.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }

    toast.success(opModal.type === 'restock' ? 'Пополнено' : 'Списано');
    setOpModal(null);
    setOpQty('');
    setOpNote('');
    loadItems();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Товар удалён');
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const lowStock = items.filter(i => i.min_stock > 0 && i.quantity <= i.min_stock).length;

  return (
    <div className="min-h-screen bg-background pb-24 overflow-y-auto">
      <div className="px-4 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/partner')}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold font-display text-foreground flex-1">Склад</h1>
          {lowStock > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/15 text-destructive text-[10px] font-medium">
              <AlertTriangle className="w-3 h-3" /> {lowStock}
            </span>
          )}
        </div>

        {/* Add button */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs text-muted-foreground">{items.length} товаров</p>
          <Button size="sm" onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'default'} className="gap-1 text-xs">
            {showForm ? <><X className="w-3.5 h-3.5" /> Отмена</> : <><Plus className="w-3.5 h-3.5" /> Добавить</>}
          </Button>
        </div>

        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="glass rounded-2xl p-4 mb-4 space-y-3 overflow-hidden">
              <input placeholder="Название *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
              <div className="flex gap-2">
                <input placeholder="Кол-во *" type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  className="flex-1 bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  className="bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <input placeholder="Мин. остаток (необязательно)" type="number" value={form.min_stock}
                onChange={e => setForm(f => ({ ...f, min_stock: e.target.value }))}
                className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
              {locations.length > 1 && (
                <select value={form.location_id} onChange={e => setForm(f => ({ ...f, location_id: e.target.value }))}
                  className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              )}
              <Button onClick={handleAdd} disabled={saving} className="w-full">{saving ? 'Сохранение...' : 'Добавить'}</Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Items list */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Загрузка...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Склад пуст</p>
            <p className="text-xs mt-1">Добавьте первый товар</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => {
              const isLow = item.min_stock > 0 && item.quantity <= item.min_stock;
              return (
                <motion.div key={item.id} layout className="glass rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground truncate">{item.name}</h3>
                        {isLow && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium whitespace-nowrap">
                            Заканчивается!
                          </span>
                        )}
                      </div>
                      <p className={`text-lg font-bold mt-1 ${isLow ? 'text-destructive' : 'text-primary'}`}>
                        {item.quantity} <span className="text-xs font-normal text-muted-foreground">{item.unit}</span>
                      </p>
                      {item.min_stock > 0 && (
                        <p className="text-[10px] text-muted-foreground">мин: {item.min_stock} {item.unit}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg bg-destructive/10 text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => loadHistory(item.id)}
                        className="p-1.5 rounded-lg bg-secondary text-muted-foreground">
                        <History className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="secondary" className="flex-1 gap-1 text-xs"
                      onClick={() => { setOpModal({ id: item.id, type: 'write_off' }); setOpQty(''); setOpNote(''); }}>
                      <Minus className="w-3.5 h-3.5" /> Списать
                    </Button>
                    <Button size="sm" className="flex-1 gap-1 text-xs"
                      onClick={() => { setOpModal({ id: item.id, type: 'restock' }); setOpQty(''); setOpNote(''); }}>
                      <Plus className="w-3.5 h-3.5" /> Пополнить
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Operation modal */}
      <AnimatePresence>
        {opModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={() => setOpModal(null)}>
            <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg glass-strong rounded-t-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                {opModal.type === 'restock' ? '📦 Пополнить' : '📤 Списать'}
              </h3>
              <input placeholder="Количество" type="number" value={opQty} onChange={e => setOpQty(e.target.value)}
                className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" autoFocus />
              <input placeholder="Комментарий (необязательно)" value={opNote} onChange={e => setOpNote(e.target.value)}
                className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setOpModal(null)}>Отмена</Button>
                <Button className="flex-1" onClick={handleOperation} disabled={saving}>
                  {saving ? '...' : 'Подтвердить'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={() => setShowHistory(null)}>
            <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg glass-strong rounded-t-2xl p-5 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">📋 История операций</h3>
                <button onClick={() => setShowHistory(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              {operations.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Нет операций</p>
              ) : (
                <div className="space-y-2">
                  {operations.map(op => (
                    <div key={op.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        op.operation_type === 'restock' ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'
                      }`}>
                        {op.operation_type === 'restock' ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">
                          {op.operation_type === 'restock' ? '+' : '-'}{op.quantity}
                        </p>
                        {op.note && <p className="text-[10px] text-muted-foreground truncate">{op.note}</p>}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(op.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default PartnerInventory;
