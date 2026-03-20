import { useState, useEffect, useMemo } from 'react';
import { Users, Search, Phone, Calendar, TrendingUp } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import PartnerLayout from '@/components/partner/PartnerLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ClientData {
  name: string;
  phone: string | null;
  visits: number;
  lastVisit: string;
  totalSpent: number;
  currency: string;
}

const PartnerClients = () => {
  const { t } = usePreferences();
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    loadClients();
  }, [user]);

  const loadClients = async () => {
    if (!user) return;
    setLoading(true);

    // Get owner's locations
    const { data: locs } = await supabase
      .from('locations')
      .select('id, currency')
      .eq('owner_id', user.id);

    if (!locs || locs.length === 0) {
      setLoading(false);
      return;
    }

    const locIds = locs.map(l => l.id);
    const currencyMap: Record<string, string> = {};
    locs.forEach(l => { currencyMap[l.id] = l.currency || 'сум'; });

    // Get all appointments for these locations
    const { data: appointments } = await supabase
      .from('appointments')
      .select('client_name, client_phone, start_time, location_id, service_id, status')
      .in('location_id', locIds)
      .in('status', ['confirmed', 'completed', 'pending']);

    // Get services for price lookup
    const { data: services } = await supabase
      .from('services')
      .select('id, price')
      .in('location_id', locIds);

    const servicePrice: Record<string, number> = {};
    services?.forEach(s => { servicePrice[s.id] = s.price; });

    // Aggregate by client key (name + phone)
    const map = new Map<string, ClientData>();

    appointments?.forEach(apt => {
      const key = `${(apt.client_name || '').trim().toLowerCase()}|${(apt.client_phone || '').trim()}`;
      if (!key || key === '|') return;

      const existing = map.get(key);
      const price = apt.service_id ? (servicePrice[apt.service_id] || 0) : 0;
      const currency = currencyMap[apt.location_id] || 'сум';

      if (existing) {
        existing.visits += 1;
        existing.totalSpent += price;
        if (apt.start_time > existing.lastVisit) {
          existing.lastVisit = apt.start_time;
        }
      } else {
        map.set(key, {
          name: apt.client_name || 'Без имени',
          phone: apt.client_phone || null,
          visits: 1,
          lastVisit: apt.start_time,
          totalSpent: price,
          currency,
        });
      }
    });

    // Sort by last visit descending
    const result = Array.from(map.values()).sort(
      (a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
    );

    setClients(result);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      c => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
    );
  }, [clients, search]);

  const getRecencyBadge = (lastVisit: string) => {
    const days = Math.floor((Date.now() - new Date(lastVisit).getTime()) / 86400000);
    if (days <= 30) return { label: '< 30д', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (days <= 60) return { label: '30-60д', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    return { label: '> 60д', className: 'bg-red-500/20 text-red-400 border-red-500/30' };
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });

  const formatMoney = (amount: number, currency: string) =>
    `${amount.toLocaleString('ru-RU')} ${currency}`;

  return (
    <PartnerLayout title={t('partner.clients')}>
      <div className="px-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или телефону..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>

        {/* Stats summary */}
        {clients.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-card border border-border p-3 text-center">
              <p className="text-lg font-bold text-foreground">{clients.length}</p>
              <p className="text-[10px] text-muted-foreground">Всего</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-3 text-center">
              <p className="text-lg font-bold text-emerald-400">
                {clients.filter(c => {
                  const days = Math.floor((Date.now() - new Date(c.lastVisit).getTime()) / 86400000);
                  return days <= 30;
                }).length}
              </p>
              <p className="text-[10px] text-muted-foreground">Активные</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-3 text-center">
              <p className="text-lg font-bold text-red-400">
                {clients.filter(c => {
                  const days = Math.floor((Date.now() - new Date(c.lastVisit).getTime()) / 86400000);
                  return days > 60;
                }).length}
              </p>
              <p className="text-[10px] text-muted-foreground">Потерянные</p>
            </div>
          </div>
        )}

        {/* Client list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl bg-card border border-border p-4 animate-pulse">
                <div className="h-4 w-32 bg-muted rounded mb-2" />
                <div className="h-3 w-48 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{search ? 'Ничего не найдено' : t('partner.no_clients')}</p>
            {!search && <p className="text-xs mt-1">{t('partner.clients_hint')}</p>}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((client, i) => {
              const badge = getRecencyBadge(client.lastVisit);
              return (
                <div key={i} className="rounded-xl bg-card border border-border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{client.name}</p>
                        {client.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {client.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={`text-[10px] shrink-0 ${badge.className}`}>
                      {badge.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {client.visits} визит{client.visits === 1 ? '' : client.visits < 5 ? 'а' : 'ов'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(client.lastVisit)}
                    </span>
                    <span className="ml-auto font-medium text-foreground">
                      {formatMoney(client.totalSpent, client.currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PartnerLayout>
  );
};

export default PartnerClients;
