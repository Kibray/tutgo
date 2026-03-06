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
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      ...opts,
    }),
  });
  return res.json();
}

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleString("ru-RU", {
    timeZone: "Asia/Tashkent",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatTime(isoDate: string) {
  return new Date(isoDate).toLocaleString("ru-RU", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit", minute: "2-digit",
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, record, old_record } = await req.json();

    // ---- APPOINTMENT EVENTS ----
    if (type === "appointment.created") {
      // Notify business owner about new appointment
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

      // Get service name
      let serviceName = "—";
      if (record.service_id) {
        const { data: service } = await supabase
          .from("services")
          .select("name")
          .eq("id", record.service_id)
          .single();
        if (service) serviceName = service.name;
      }

      const clientName = record.client_name || "Клиент";
      const dateStr = formatDate(record.start_time);

      await sendTelegram(ownerProfile.telegram_chat_id,
        `🔔 <b>Новая запись!</b>\n👤 Клиент: ${clientName}\n📅 Дата: ${dateStr}\n💼 Услуга: ${serviceName}`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "✅ Подтвердить", callback_data: `confirm_${record.id}` },
                { text: "❌ Отменить", callback_data: `cancel_${record.id}` },
              ],
            ],
          },
        }
      );
    }

    if (type === "appointment.cancelled_by_client") {
      // Client cancelled — notify business
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

      await sendTelegram(ownerProfile.telegram_chat_id,
        `❌ <b>Клиент отменил запись</b>\n👤 ${record.client_name || "Клиент"}\n📅 ${formatDate(record.start_time)}`
      );
    }

    // ---- REVIEW EVENTS ----
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

      // Get reviewer name
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

      await sendTelegram(ownerProfile.telegram_chat_id,
        `⭐ <b>Новый отзыв от ${reviewerName}</b>\nОценка: ${stars}\nКомментарий: ${record.comment || "—"}`
      );
    }

    // ---- DEAL EVENTS ----
    if (type === "deal.created") {
      // Notify all clients who have telegram_chat_id and notify_deals=true
      const { data: location } = await supabase
        .from("locations")
        .select("name")
        .eq("id", record.location_id)
        .single();

      if (!location) return new Response("ok");

      const expiresStr = record.expires_at
        ? formatDate(record.expires_at)
        : "—";

      // Get all users with telegram connected and deals notifications enabled
      const { data: profiles } = await supabase
        .from("profiles")
        .select("telegram_chat_id")
        .not("telegram_chat_id", "is", null)
        .eq("notify_deals", true);

      if (profiles && profiles.length > 0) {
        const text = `🎁 <b>Новая акция от ${location.name}</b>\n${record.title}${record.description ? "\n" + record.description : ""}\nУспей воспользоваться до ${expiresStr}`;
        
        // Send in batches (avoid rate limiting)
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

      // Find appointments starting in ~1 hour
      const { data: appointments } = await supabase
        .from("appointments")
        .select("*, location_id")
        .in("status", ["pending", "confirmed"])
        .gte("start_time", fiveMinBuffer.toISOString())
        .lte("start_time", oneHourLater.toISOString());

      if (!appointments || appointments.length === 0) return new Response("ok");

      for (const apt of appointments) {
        const { data: location } = await supabase
          .from("locations")
          .select("name, owner_id")
          .eq("id", apt.location_id)
          .single();

        if (!location) continue;

        const timeStr = formatTime(apt.start_time);

        // Notify client
        if (apt.client_user_id) {
          const { data: clientProfile } = await supabase
            .from("profiles")
            .select("telegram_chat_id, notify_reminder")
            .eq("user_id", apt.client_user_id)
            .single();

          if (clientProfile?.telegram_chat_id && clientProfile.notify_reminder) {
            await sendTelegram(clientProfile.telegram_chat_id,
              `⏰ <b>Напоминание!</b> Через 1 час у вас запись:\n📍 ${location.name}\n📅 ${timeStr}\nУдачи! 😊`
            );
          }
        }

        // Notify business owner
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("telegram_chat_id")
          .eq("user_id", location.owner_id)
          .single();

        if (ownerProfile?.telegram_chat_id) {
          await sendTelegram(ownerProfile.telegram_chat_id,
            `⏰ <b>Через 1 час у вас запись:</b>\n👤 Клиент: ${apt.client_name || "Клиент"}\n📅 Время: ${timeStr}`
          );
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("telegram-notify error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
