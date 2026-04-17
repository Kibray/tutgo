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

export async function findDemoUserId(log: LogFn): Promise<string | null> {
  // Try profiles table first via display_name/phone — but most reliable: use auth.users via RPC if available.
  // Fallback: search profiles where the linked auth user email is demo@tutgo.uz.
  // Since we can't query auth.users from client, try: look at locations for owners whose profile display_name matches "demo" pattern? Not reliable.
  // Best approach: ask current authenticated user. If logged in as demo@tutgo.uz, use that user.id.
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email === DEMO_EMAIL) {
    log(`✅ Найден demo пользователь (текущая сессия): ${user.id}`);
    return user.id;
  }

  // Fallback: try to find via locations with name containing 'TutGo Demo' (already seeded)
  const { data: loc } = await supabase
    .from('locations')
    .select('owner_id')
    .ilike('name', '%TutGo Demo%')
    .limit(1)
    .maybeSingle();
  if (loc?.owner_id) {
    log(`✅ Найден demo пользователь через существующий бизнес: ${loc.owner_id}`);
    return loc.owner_id;
  }

  log(`❌ Не найден demo пользователь. Войдите в систему как ${DEMO_EMAIL} и повторите.`);
  return null;
}

async function ensureLocation(userId: string, log: LogFn): Promise<string | null> {
  const { data: existing } = await supabase
    .from('locations')
    .select('id, name')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    log(`✅ Используем существующий бизнес: ${existing.name}`);
    return existing.id;
  }

  const { data, error } = await supabase
    .from('locations')
    .insert({
      name: 'TutGo Demo Барбершоп',
      business_type: 'service',
      sub_category: 'barbershop',
      address: 'Ташкент, ул. Амира Темура 15',
      city: 'Ташкент',
      phone: '+998901234567',
      currency: 'сум',
      verified: true,
      queue_enabled: true,
      rating: 4.7,
      review_count: 38,
      price_from: 50000,
      owner_id: userId,
    })
    .select('id')
    .single();

  if (error) {
    log(`❌ Ошибка создания бизнеса: ${error.message}`);
    return null;
  }
  log(`✅ Создан бизнес: TutGo Demo Барбершоп`);
  return data.id;
}

async function ensureServices(locationId: string, log: LogFn) {
  const { data: existing } = await supabase
    .from('services')
    .select('id, name, duration_minutes')
    .eq('location_id', locationId);

  if (existing && existing.length > 0) {
    log(`✅ Услуги уже есть (${existing.length})`);
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
    log(`✅ Сотрудники уже есть (${existing.length})`);
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

  if (existing) {
    await supabase
      .from('subscriptions')
      .update({
        plan: 'pro',
        status: 'active',
        trial_ends_at: '2025-08-31T23:59:59Z',
        current_period_end: '2025-08-31T23:59:59Z',
        is_early_adopter: true,
      })
      .eq('user_id', userId);
    log(`✅ Подписка Pro обновлена`);
    return;
  }

  const { error } = await supabase.from('subscriptions').insert({
    user_id: userId,
    plan: 'pro',
    status: 'active',
    trial_ends_at: '2025-08-31T23:59:59Z',
    current_period_end: '2025-08-31T23:59:59Z',
    is_early_adopter: true,
  });
  if (error) {
    log(`⚠️ Ошибка создания подписки: ${error.message}`);
  } else {
    log(`✅ Создана подписка Pro`);
  }
}

async function countAppointments(locationId: string): Promise<number> {
  const { count } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('location_id', locationId);
  return count || 0;
}

async function deleteAppointments(locationId: string, log: LogFn) {
  const { error } = await supabase.from('appointments').delete().eq('location_id', locationId);
  if (error) {
    log(`⚠️ Ошибка удаления старых записей: ${error.message}`);
  } else {
    log(`🗑 Старые записи удалены`);
  }
}

async function generateAppointments(
  locationId: string,
  services: any[],
  staff: any[],
  log: LogFn,
) {
  const start = new Date('2025-03-01T00:00:00');
  const end = new Date('2025-08-31T23:59:59');
  const all: any[] = [];

  const cur = new Date(start);
  let currentMonth = -1;

  while (cur <= end) {
    if (cur.getMonth() !== currentMonth) {
      currentMonth = cur.getMonth();
      log(`⏳ Создаём записи... (${MONTH_NAMES[currentMonth]} ${cur.getFullYear()})`);
    }

    if (cur.getDay() !== 0) {
      const count = rand(4, 12);
      const usedSlots = new Set<string>();
      for (let i = 0; i < count; i++) {
        const svc = pick(services);
        const stf = pick(staff);
        const hour = rand(9, 19);
        const minute = Math.random() < 0.5 ? 0 : 30;
        const slotKey = `${stf.id}-${hour}:${minute}`;
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

  // Batch insert by 100
  let inserted = 0;
  for (let i = 0; i < all.length; i += 100) {
    const batch = all.slice(i, i + 100);
    const { error } = await supabase.from('appointments').insert(batch);
    if (error) {
      log(`⚠️ Ошибка batch ${i}: ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }
  log(`✅ Создано ${inserted} записей (март–август 2025)`);
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
    { location_id: locationId, title: 'Скидка 20% на первый визит', discount_percent: 20, is_active: true, expires_at: '2025-08-01T00:00:00Z' },
    { location_id: locationId, title: 'Комбо: стрижка + борода', discount_percent: 15, is_active: true, expires_at: '2025-07-01T00:00:00Z' },
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
  const userId = await findDemoUserId(log);
  if (!userId) return { ok: false, message: 'Demo пользователь не найден' };

  const locationId = await ensureLocation(userId, log);
  if (!locationId) return { ok: false, message: 'Не удалось создать бизнес' };

  const services = await ensureServices(locationId, log);
  const staff = await ensureStaff(locationId, log);
  await ensureSubscription(userId, log);

  if (services.length === 0 || staff.length === 0) {
    return { ok: false, message: 'Нет услуг или сотрудников для генерации записей' };
  }

  const existingCount = await countAppointments(locationId);
  if (existingCount > 100 && !forceRecreateAppointments) {
    log(`⚠️ Уже есть ${existingCount} записей. Подтвердите пересоздание.`);
    return { ok: false, needsConfirm: true, existingAppointmentsCount: existingCount, locationId };
  }

  if (forceRecreateAppointments && existingCount > 0) {
    await deleteAppointments(locationId, log);
  }

  await generateAppointments(locationId, services, staff, log);
  await ensureDeals(locationId, log);
  await ensureInventory(locationId, log);

  log(`🎉 Готово! Можно открывать демо.`);
  return { ok: true, locationId };
}
