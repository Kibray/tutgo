import { supabase } from '@/integrations/supabase/client';

export type LogFn = (msg: string) => void;

const DEMO_EMAIL = 'demo@tutgo.uz';

const UZ_NAMES = [
  'Алишер', 'Бобур', 'Жасур', 'Камол', 'Локман', 'Мансур', 'Нодир', 'Отабек',
  'Равшан', 'Санжар', 'Тимур', 'Улугбек', 'Фаррух', 'Хусан', 'Шерзод',
  'Элмурод', 'Юсуф', 'Зафар', 'Акбар', 'Даврон',
];

const MONTH_NAMES = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const randomPhone = () => {
  let s = '+99890';
  for (let i = 0; i < 7; i++) s += rand(0, 9);
  return s;
};

const pickStatus = (date: Date): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const r = Math.random();
  if (d.getTime() < today.getTime()) {
    if (r < 0.7) return 'completed';
    if (r < 0.9) return 'confirmed';
    return 'cancelled';
  }
  if (d.getTime() === today.getTime()) {
    return r < 0.3 ? 'confirmed' : 'pending';
  }
  return r < 0.8 ? 'pending' : 'confirmed';
};

interface SeedOptions {
  log: LogFn;
  forceRecreateAppointments?: boolean;
}

export interface SeedResult {
  ok: boolean;
  needsConfirm?: boolean;
  existingAppointmentsCount?: number;
  locationId?: string;
  message?: string;
}

/**
 * Найти id демо-локации (помечена в metadata.is_demo = true).
 * Эта локация принадлежит demo@tutgo.uz и используется для презентаций.
 */
async function findDemoLocation(log: LogFn): Promise<{ id: string; ownerId: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    log(`❌ Вы не авторизованы. Войдите как ${DEMO_EMAIL} и повторите.`);
    return null;
  }
  if (user.email !== DEMO_EMAIL) {
    log(`⚠️ Текущий email: ${user.email}. Скрипт работает только под ${DEMO_EMAIL}.`);
    return null;
  }

  const { data, error } = await supabase
    .from('locations')
    .select('id, name, owner_id, metadata')
    .eq('owner_id', user.id)
    .filter('metadata->>is_demo', 'eq', 'true')
    .limit(1)
    .maybeSingle();

  if (error) {
    log(`❌ Ошибка поиска демо-локации: ${error.message}`);
    return null;
  }

  if (!data) {
    log(`❌ Демо-локация не найдена (нет locations с metadata.is_demo=true).`);
    log(`   Создайте её вручную или попросите админа.`);
    return null;
  }

  log(`✅ Найдена демо-локация: ${data.name} (${data.id})`);
  return { id: data.id, ownerId: data.owner_id };
}

async function ensureServices(locationId: string, log: LogFn) {
  const { data: existing } = await supabase
    .from('services')
    .select('id, name, duration_minutes')
    .eq('location_id', locationId);

  if (existing && existing.length > 0) {
    log(`✅ Услуги уже есть (${existing.length}) — используем как есть`);
    return existing;
  }

  const services = [
    { location_id: locationId, name: 'Стрижка мужская', price: 80000, duration_minutes: 30, currency: 'сум' },
    { location_id: locationId, name: 'Стрижка + борода', price: 130000, duration_minutes: 60, currency: 'сум' },
    { location_id: locationId, name: 'Оформление бороды', price: 60000, duration_minutes: 30, currency: 'сум' },
    { location_id: locationId, name: 'Детская стрижка', price: 60000, duration_minutes: 30, currency: 'сум' },
  ];

  const { data, error } = await supabase.from('services').insert(services).select('id, name, duration_minutes');
  if (error) {
    log(`❌ Ошибка создания услуг: ${error.message}`);
    return [];
  }
  log(`✅ Создано ${data.length} услуг`);
  return data;
}

async function ensureStaff(locationId: string, log: LogFn) {
  const { data: existing } = await supabase
    .from('staff')
    .select('id, full_name')
    .eq('location_id', locationId);

  if (existing && existing.length > 0) {
    log(`✅ Сотрудники уже есть (${existing.length}) — используем как есть`);
    return existing;
  }

  const staff = [
    { location_id: locationId, full_name: 'Азиз Каримов', specialties: ['Стрижка', 'Борода'], working_days: [1, 2, 3, 4, 5] },
    { location_id: locationId, full_name: 'Бобур Рашидов', specialties: ['Стрижка'], working_days: [1, 2, 3, 4, 5, 6] },
    { location_id: locationId, full_name: 'Санжар Юсупов', specialties: ['Стрижка', 'Борода', 'Уход'], working_days: [2, 3, 4, 5, 6] },
  ];

  const { data, error } = await supabase.from('staff').insert(staff).select('id, full_name');
  if (error) {
    log(`❌ Ошибка создания сотрудников: ${error.message}`);
    return [];
  }
  log(`✅ Создано ${data.length} сотрудников`);
  return data;
}

async function ensureSubscription(userId: string, log: LogFn) {
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id, plan')
    .eq('user_id', userId)
    .maybeSingle();

  // Триал и период подписки — на год вперёд от сегодня
  const oneYearAhead = new Date();
  oneYearAhead.setFullYear(oneYearAhead.getFullYear() + 1);
  const periodEnd = oneYearAhead.toISOString();

  if (existing) {
    await supabase
      .from('subscriptions')
      .update({
        plan: 'pro',
        status: 'active',
        trial_ends_at: periodEnd,
        current_period_end: periodEnd,
        is_early_adopter: true,
      })
      .eq('user_id', userId);
    log(`✅ Подписка Pro обновлена (до ${periodEnd.slice(0, 10)})`);
    return;
  }

  const { error } = await supabase.from('subscriptions').insert({
    user_id: userId,
    plan: 'pro',
    status: 'active',
    trial_ends_at: periodEnd,
    current_period_end: periodEnd,
    is_early_adopter: true,
  });
  if (error) {
    log(`⚠️ Ошибка создания подписки: ${error.message}`);
  } else {
    log(`✅ Создана подписка Pro (до ${periodEnd.slice(0, 10)})`);
  }
}

async function countAppointments(locationId: string): Promise<number> {
  const { count } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('location_id', locationId);
  return count || 0;
}

// Скользящее окно вокруг сегодняшней даты, чтобы дашборд всегда был «живой»:
// прошлое — для аналитики/выручки, будущее — для календаря/новых заявок.
const DAYS_BACK = 60;
const DAYS_FORWARD = 60;

function generateAppointmentRecords(
  locationId: string,
  services: any[],
  staff: any[],
  log: LogFn,
): any[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(start.getDate() - DAYS_BACK);
  const end = new Date(today);
  end.setDate(end.getDate() + DAYS_FORWARD);
  end.setHours(23, 59, 59, 0);

  const all: any[] = [];
  const cur = new Date(start);
  let currentMonth = -1;

  while (cur <= end) {
    if (cur.getMonth() !== currentMonth) {
      currentMonth = cur.getMonth();
      log(`⏳ Готовим записи для ${MONTH_NAMES[currentMonth]} ${cur.getFullYear()}...`);
    }

    // Сегодня и ближайшие дни — больше записей, чтобы дашборд был насыщен
    const isToday = cur.getTime() === today.getTime();
    const daysFromToday = Math.abs((cur.getTime() - today.getTime()) / 86400000);
    const isNear = daysFromToday <= 7;

    if (cur.getDay() !== 0) {
      const count = isToday ? rand(8, 14) : isNear ? rand(6, 12) : rand(4, 10);
      const usedSlots = new Set<string>();
      for (let i = 0; i < count; i++) {
        const svc = pick(services);
        const stf = pick(staff);
        const hour = rand(9, 19);
        const minute = Math.random() < 0.5 ? 0 : 30;
        const slotKey = `${stf.id}-${cur.toDateString()}-${hour}:${minute}`;
        if (usedSlots.has(slotKey)) continue;
        usedSlots.add(slotKey);

        const startTime = new Date(cur);
        startTime.setHours(hour, minute, 0, 0);
        const endTime = new Date(startTime.getTime() + (svc.duration_minutes || 30) * 60000);

        all.push({
          location_id: locationId,
          service_id: svc.id,
          staff_id: stf.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: pickStatus(startTime),
          client_name: pick(UZ_NAMES),
          client_phone: randomPhone(),
          client_user_id: null,
        });
      }
    }
    cur.setDate(cur.getDate() + 1);
  }

  return all;
}

async function seedAppointmentsViaRpc(
  locationId: string,
  services: any[],
  staff: any[],
  log: LogFn,
) {
  const records = generateAppointmentRecords(locationId, services, staff, log);
  log(`📦 Подготовлено ${records.length} записей. Отправляем одной транзакцией (триггеры отключены на сервере)...`);

  // Отправляем чанками по 500, чтобы не упереться в размер payload
  const CHUNK = 500;
  let totalInserted = 0;
  let totalDeleted = 0;
  let firstChunk = true;

  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK);
    // Только в первом чанке функция удалит старые. Для последующих чанков
    // достаточно того, что таблица уже очищена. Но наша RPC всегда удаляет —
    // поэтому первый раз шлём с реальным удалением, дальше — только пустые DELETE.
    const { data, error } = await supabase.rpc('seed_demo_appointments', {
      p_location_id: locationId,
      p_appointments: chunk,
    });

    if (error) {
      log(`❌ RPC error на чанке ${i}: ${error.message}`);
      return { ok: false, totalInserted, totalDeleted };
    }

    const result = data as { deleted: number; inserted: number };
    if (firstChunk) {
      totalDeleted = result.deleted;
      log(`🗑 Удалено старых записей: ${result.deleted}`);
      firstChunk = false;
    }
    totalInserted += result.inserted;
    log(`  ✓ Чанк ${Math.floor(i / CHUNK) + 1}: вставлено ${result.inserted}`);
  }

  log(`✅ Итого создано записей: ${totalInserted} (за период март–август 2025)`);
  return { ok: true, totalInserted, totalDeleted };
}

async function ensureDeals(locationId: string, log: LogFn) {
  const { data: existing } = await supabase
    .from('deals')
    .select('id')
    .eq('location_id', locationId);
  if (existing && existing.length > 0) {
    log(`✅ Акции уже есть (${existing.length})`);
    return;
  }

  const deals = [
    { location_id: locationId, title: 'Скидка 20% на первый визит', discount_percent: 20, is_active: true, expires_at: '2025-12-31T00:00:00Z' },
    { location_id: locationId, title: 'Комбо: стрижка + борода', discount_percent: 15, is_active: true, expires_at: '2025-11-30T00:00:00Z' },
    { location_id: locationId, title: 'Детский день — скидка 30%', discount_percent: 30, is_active: false, expires_at: '2025-06-01T00:00:00Z' },
  ];
  const { error } = await supabase.from('deals').insert(deals);
  if (error) {
    log(`⚠️ Ошибка создания акций: ${error.message}`);
  } else {
    log(`✅ Создано ${deals.length} акций`);
  }
}

async function ensureInventory(locationId: string, log: LogFn) {
  const { data: existing } = await supabase
    .from('inventory')
    .select('id')
    .eq('location_id', locationId);
  if (existing && existing.length > 0) {
    log(`✅ Склад уже есть (${existing.length})`);
    return;
  }

  const items = [
    { location_id: locationId, name: 'Машинка для стрижки', quantity: 5, min_stock: 2, unit: 'шт' },
    { location_id: locationId, name: 'Ножницы парикмахерские', quantity: 8, min_stock: 3, unit: 'шт' },
    { location_id: locationId, name: 'Шампунь профессиональный', quantity: 3, min_stock: 5, unit: 'л' },
    { location_id: locationId, name: 'Помада для укладки', quantity: 12, min_stock: 4, unit: 'шт' },
  ];
  const { error } = await supabase.from('inventory').insert(items);
  if (error) {
    log(`⚠️ Ошибка создания склада: ${error.message}`);
  } else {
    log(`✅ Создано ${items.length} позиций склада`);
  }
}

export async function seedDemoData({ log, forceRecreateAppointments = false }: SeedOptions): Promise<SeedResult> {
  const demo = await findDemoLocation(log);
  if (!demo) return { ok: false, message: 'Демо-локация не найдена' };

  const { id: locationId, ownerId: userId } = demo;

  const services = await ensureServices(locationId, log);
  const staff = await ensureStaff(locationId, log);
  await ensureSubscription(userId, log);

  if (services.length === 0 || staff.length === 0) {
    return { ok: false, message: 'Нет услуг или сотрудников для генерации записей' };
  }

  const existingCount = await countAppointments(locationId);
  if (existingCount > 0 && !forceRecreateAppointments) {
    log(`⚠️ Уже есть ${existingCount} записей. Подтвердите пересоздание.`);
    return { ok: false, needsConfirm: true, existingAppointmentsCount: existingCount, locationId };
  }

  // RPC сама удалит старые и вставит новые в одной транзакции с отключёнными триггерами
  const seedRes = await seedAppointmentsViaRpc(locationId, services, staff, log);
  if (!seedRes.ok) return { ok: false, message: 'Ошибка вставки записей через RPC' };

  await ensureDeals(locationId, log);
  await ensureInventory(locationId, log);

  log(`🎉 Готово! Открой /partner — увидишь живой кабинет с историей.`);
  return { ok: true, locationId };
}
