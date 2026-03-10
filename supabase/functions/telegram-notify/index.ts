import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendTelegram(chatId: number, text: string, opts?: { reply_markup?: any }) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...opts,
      }),
    });
    return res.json();
  } catch (e) {
    console.error("Failed to send telegram message");
    return null;
  }
}

function formatDate(isoDate: string) {
  const d = new Date(isoDate);
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  return `${d.toLocaleDateString("ru-RU", { timeZone: "Asia/Tashkent", day: "numeric" })} ${months[d.getMonth()]} ${d.toLocaleDateString("ru-RU", { timeZone: "Asia/Tashkent", year: "numeric" })}`;
}

function formatTime(isoDate: string) {
  return new Date(isoDate).toLocaleString("ru-RU", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ' + (currency || 'сум');
}

const FOOTER = `\n━━━━━━━━━━━━━━━━━━━━\n💡 <i>Найдено через TutGo — маркетплейс\nуслуг Узбекистана</i>\n🌐 tutgo.uz | @TutGoUzBot`;
const FOOTER_SHORT = `\n━━━━━━━━━━━━━━━━━━━━\n🌐 tutgo.uz`;

async function getAppointmentContext(record: any) {
  const { data: location } = await supabase
    .from("locations")
    .select("name, owner_id, address, lat, lng, phone, city")
    .eq("id", record.location_id)
    .single();

  let serviceName = "—";
  let servicePrice = 0;
  let serviceCurrency = "сум";
  if (record.service_id) {
    const { data: service } = await supabase
      .from("services")
      .select("name, price, currency")
      .eq("id", record.service_id)
      .single();
    if (service) {
      serviceName = service.name;
      servicePrice = service.price;
      serviceCurrency = service.currency;
    }
  }

  let staffName = "";
  if (record.staff_id) {
    const { data: staff } = await supabase
      .from("staff")
      .select("full_name")
      .eq("id", record.staff_id)
      .single();
    if (staff) staffName = staff.full_name;
  }

  return { location, serviceName, servicePrice, serviceCurrency, staffName };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, record, old_record, chatId, text: directText } = await req.json();

    // ---- DIRECT QUEUE NOTIFICATION ----
    if (type === "queue.notify" && chatId && directText) {
      await sendTelegram(chatId, directText);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- APPOINTMENT CREATED (notify business) ----
    if (type === "appointment.created") {
      const ctx = await getAppointmentContext(record);
      if (!ctx.location) return new Response("ok");

      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("telegram_chat_id")
        .eq("user_id", ctx.location.owner_id)
        .single();

      if (!ownerProfile?.telegram_chat_id) return new Response("ok");

      const clientName = record.client_name || "Клиент";
      const clientPhone = record.client_phone || "";

      const text = `━━━━━━━━━━━━━━━━━━━━\n🔔 <b>Новая запись!</b>\n\n👤 Клиент: ${clientName}${clientPhone ? `\n📞 ${clientPhone}` : ""}\n📅 ${formatDate(record.start_time)} · ${formatTime(record.start_time)}\n🔧 ${ctx.serviceName}${ctx.servicePrice > 0 ? `\n💰 ${formatPrice(ctx.servicePrice, ctx.serviceCurrency)}` : ""}${ctx.staffName ? `\n👨‍💼 Мастер: ${ctx.staffName}` : ""}\n━━━━━━━━━━━━━━━━━━━━`;

      await sendTelegram(ownerProfile.telegram_chat_id, text, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Подтвердить", callback_data: `confirm_${record.id}` },
              { text: "❌ Отменить", callback_data: `cancel_${record.id}` },
            ],
          ],
        },
      });

      if (record.client_user_id) {
        const { data: clientProfile } = await supabase
          .from("profiles")
          .select("telegram_chat_id, notify_confirmed")
          .eq("user_id", record.client_user_id)
          .single();

        if (clientProfile?.telegram_chat_id) {
          const mapsLink = ctx.location.lat && ctx.location.lng
            ? `https://maps.google.com?q=${ctx.location.lat},${ctx.location.lng}`
            : "";

          const clientText = `━━━━━━━━━━━━━━━━━━━━\n✅ <b>Запись оформлена!</b>\n\n🏢 ${ctx.location.name}${ctx.location.address ? `\n📍 ${ctx.location.address}` : ""}${ctx.location.city ? `, ${ctx.location.city}` : ""}\n📅 Дата: ${formatDate(record.start_time)}\n⏰ Время: ${formatTime(record.start_time)}\n🔧 Услуга: ${ctx.serviceName}${ctx.servicePrice > 0 ? `\n💰 Стоимость: ${formatPrice(ctx.servicePrice, ctx.serviceCurrency)}` : ""}${ctx.staffName ? `\n\n👨‍💼 Мастер: ${ctx.staffName}` : ""}${ctx.location.phone ? `\n📞 Телефон: ${ctx.location.phone}` : ""}${mapsLink ? `\n\n🗺️ <a href="${mapsLink}">Показать на карте</a>` : ""}${FOOTER}`;

          await sendTelegram(clientProfile.telegram_chat_id, clientText);
        }
      }
    }

    // ---- APPOINTMENT CANCELLED BY CLIENT ----
    if (type === "appointment.cancelled_by_client") {
      const ctx = await getAppointmentContext(record);
      if (!ctx.location) return new Response("ok");

      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("telegram_chat_id")
        .eq("user_id", ctx.location.owner_id)
        .single();

      if (!ownerProfile?.telegram_chat_id) return new Response("ok");

      const text = `━━━━━━━━━━━━━━━━━━━━\n❌ <b>Клиент отменил запись</b>\n\n👤 ${record.client_name || "Клиент"}\n📅 ${formatDate(record.start_time)} · ${formatTime(record.start_time)}\n🔧 ${ctx.serviceName}\n━━━━━━━━━━━━━━━━━━━━`;

      await sendTelegram(ownerProfile.telegram_chat_id, text);
    }

    // ---- REVIEW CREATED ----
    if (type === "review.created") {
      const { data: location } = await supabase
        .from("locations")
        .select("name, owner_id")
        .eq("id", record.location_id)
        .single();

      if (!location) return new Response("ok");

      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("telegram_chat_id")
        .eq("user_id", location.owner_id)
        .single();

      if (!ownerProfile?.telegram_chat_id) return new Response("ok");

      let reviewerName = "Клиент";
      if (record.user_id) {
        const { data: reviewer } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", record.user_id)
          .single();
        if (reviewer?.display_name) reviewerName = reviewer.display_name;
      }

      const stars = "⭐".repeat(Math.min(record.rating, 5));

      const text = `━━━━━━━━━━━━━━━━━━━━\n⭐ <b>Новый отзыв!</b>\n\n👤 ${reviewerName}\nОценка: ${stars} (${record.rating}/5)\n${record.comment ? `💬 «${record.comment}»` : "Без комментария"}\n━━━━━━━━━━━━━━━━━━━━`;

      await sendTelegram(ownerProfile.telegram_chat_id, text);
    }

    // ---- DEAL CREATED ----
    if (type === "deal.created") {
      const { data: location } = await supabase
        .from("locations")
        .select("name")
        .eq("id", record.location_id)
        .single();

      if (!location) return new Response("ok");

      const expiresStr = record.expires_at ? formatDate(record.expires_at) : "";

      const { data: profiles } = await supabase
        .from("profiles")
        .select("telegram_chat_id")
        .not("telegram_chat_id", "is", null)
        .eq("notify_deals", true);

      if (profiles && profiles.length > 0) {
        const text = `━━━━━━━━━━━━━━━━━━━━\n🎁 <b>Новая акция!</b>\n\n🏢 ${location.name}\n🏷️ ${record.title}${record.description ? `\n${record.description}` : ""}${expiresStr ? `\n\n⏳ Успей до ${expiresStr}` : ""}${FOOTER_SHORT}`;

        for (const p of profiles) {
          if (p.telegram_chat_id) {
            sendTelegram(p.telegram_chat_id, text).catch(() => {});
          }
        }
      }
    }

    // ---- REMINDER (called by cron) ----
    if (type === "reminder.check") {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const fiveMinBuffer = new Date(now.getTime() + 55 * 60 * 1000);

      const { data: appointments } = await supabase
        .from("appointments")
        .select("*")
        .in("status", ["pending", "confirmed"])
        .gte("start_time", fiveMinBuffer.toISOString())
        .lte("start_time", oneHourLater.toISOString());

      if (!appointments || appointments.length === 0) return new Response("ok");

      for (const apt of appointments) {
        const { data: location } = await supabase
          .from("locations")
          .select("name, owner_id, address, lat, lng")
          .eq("id", apt.location_id)
          .single();

        if (!location) continue;

        const timeStr = formatTime(apt.start_time);
        const mapsLink = location.lat && location.lng
          ? `https://maps.google.com?q=${location.lat},${location.lng}`
          : "";

        if (apt.client_user_id) {
          const { data: clientProfile } = await supabase
            .from("profiles")
            .select("telegram_chat_id, notify_reminder")
            .eq("user_id", apt.client_user_id)
            .single();

          if (clientProfile?.telegram_chat_id && clientProfile.notify_reminder) {
            const text = `━━━━━━━━━━━━━━━━━━━━\n⏰ <b>Напоминание!</b>\n\nЧерез 1 час у вас запись:\n🏢 ${location.name}\n⏰ в ${timeStr}${location.address ? `\n\n📍 Адрес: ${location.address}` : ""}${mapsLink ? `\n🗺️ <a href="${mapsLink}">Как добраться</a>` : ""}\n\nУдачи! 😊${FOOTER_SHORT}`;

            await sendTelegram(clientProfile.telegram_chat_id, text);
          }
        }

        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("telegram_chat_id")
          .eq("user_id", location.owner_id)
          .single();

        if (ownerProfile?.telegram_chat_id) {
          const text = `━━━━━━━━━━━━━━━━━━━━\n⏰ <b>Через 1 час запись:</b>\n\n👤 Клиент: ${apt.client_name || "Клиент"}\n📅 Время: ${timeStr}\n━━━━━━━━━━━━━━━━━━━━`;

          await sendTelegram(ownerProfile.telegram_chat_id, text);
        }
      }
    }

    // ---- POST-VISIT REVIEW REQUEST ----
    if (type === "appointment.completed") {
      const { data: location } = await supabase
        .from("locations")
        .select("name")
        .eq("id", record.location_id)
        .single();

      if (!location || !record.client_user_id) return new Response("ok");

      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("telegram_chat_id")
        .eq("user_id", record.client_user_id)
        .single();

      if (!clientProfile?.telegram_chat_id) return new Response("ok");

      const text = `━━━━━━━━━━━━━━━━━━━━\n🙏 <b>Спасибо за визит!</b>\n\nВы посетили:\n🏢 ${location.name}\n\nОставьте отзыв — это поможет\nдругим клиентам! ⭐⭐⭐⭐⭐\n━━━━━━━━━━━━━━━━━━━━\n🔍 <i>Найдите другие услуги на tutgo.uz</i>\nКрасота • Медицина • Туры • Сервис\n━━━━━━━━━━━━━━━━━━━━`;

      await sendTelegram(clientProfile.telegram_chat_id, text, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "⭐ Оставить отзыв", url: "https://tutgo.lovable.app" }],
          ],
        },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("telegram-notify error:", err);
    return new Response(JSON.stringify({ error: "Внутренняя ошибка сервера" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
