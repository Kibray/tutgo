// Public webhook — receives Instagram DM events from Meta
// GET: webhook verification (hub.challenge)
// POST: incoming message → AI reply → send via IG Graph API
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VERIFY_TOKEN = Deno.env.get("INSTAGRAM_VERIFY_TOKEN") ?? "tutgo_instagram_2024";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function sendInstagramMessage(pageAccessToken: string, recipientId: string, text: string) {
  const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(pageAccessToken)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
      messaging_type: "RESPONSE",
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("IG send error:", res.status, t);
  }
}

async function notifyPartnerTelegram(userId: string, clientText: string, senderId: string) {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/telegram-notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "instagram.handoff",
        record: { user_id: userId, sender_id: senderId, text: clientText },
      }),
    });
  } catch (e) {
    console.error("telegram-notify failed:", e);
  }
}

async function generateReply(opts: {
  businessName: string;
  slug: string | null;
  services: Array<{ name: string; price: number; currency: string; duration_minutes: number }>;
  userMessage: string;
}): Promise<{ reply: string; handoff: boolean }> {
  const { businessName, slug, services, userMessage } = opts;
  const bookingUrl = slug ? `https://tutgo.uz/b/${slug}` : "https://tutgo.uz";
  const servicesList = services.length
    ? services.map((s) => `- ${s.name} — ${s.price} ${s.currency} (${s.duration_minutes} мин)`).join("\n")
    : "Список услуг уточняется.";

  const systemPrompt = `Ты — вежливый ассистент салона "${businessName}" в Instagram Direct.
Отвечай кратко (1-3 предложения), на языке клиента (RU/UZ/EN).

Услуги и цены:
${servicesList}

Правила:
1. Если клиент хочет записаться, узнать свободное время, забронировать — обязательно дай ссылку: ${bookingUrl}
2. Если вопрос НЕ про услуги, цены или запись (например, технический, жалоба, сложный кейс) — ответь ровно "HANDOFF" и больше ничего. Менеджер свяжется лично.
3. Никогда не выдумывай цены и услуги, которых нет в списке.
4. Будь дружелюбным, используй максимум 1 эмодзи.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    console.error("AI gateway error:", res.status, await res.text());
    return { reply: "Спасибо за сообщение! Менеджер скоро ответит вам лично.", handoff: true };
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content?.trim() || "";

  if (content === "HANDOFF" || content.toUpperCase().includes("HANDOFF")) {
    return {
      reply: `Спасибо за сообщение! Менеджер скоро свяжется с вами лично. А пока вы можете посмотреть наши услуги: ${bookingUrl}`,
      handoff: true,
    };
  }

  return { reply: content || `Спасибо! Подробнее: ${bookingUrl}`, handoff: false };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // 1. GET — Meta webhook verification
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
      return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // 2. POST — incoming Instagram messages
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    // Quick ack to Meta — process async-ish but still in this invocation
    if (body.object !== "instagram" && body.object !== "page") {
      return new Response("EVENT_RECEIVED", { status: 200 });
    }

    for (const entry of body.entry ?? []) {
      const pageId: string = entry.id; // recipient = our partner's IG page id
      const events = entry.messaging ?? entry.changes ?? [];

      for (const evt of events) {
        // Only handle direct messages (skip echoes from us & non-text)
        const message = evt.message;
        if (!message || message.is_echo) continue;
        const text: string | undefined = message.text;
        const senderId: string | undefined = evt.sender?.id;
        if (!text || !senderId) continue;

        // Find partner profile by instagram_page_id
        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("user_id, instagram_access_token")
          .eq("instagram_page_id", pageId)
          .eq("instagram_connected", true)
          .maybeSingle();

        if (profErr || !profile?.instagram_access_token) {
          console.warn("No connected partner for page_id:", pageId, profErr);
          continue;
        }

        // Load partner's primary location + services
        const { data: location } = await supabase
          .from("locations")
          .select("id, name, slug")
          .eq("owner_id", profile.user_id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        let services: any[] = [];
        if (location?.id) {
          const { data: svc } = await supabase
            .from("services")
            .select("name, price, currency, duration_minutes")
            .eq("location_id", location.id)
            .limit(20);
          services = svc ?? [];
        }

        const { reply, handoff } = await generateReply({
          businessName: location?.name ?? "наш салон",
          slug: location?.slug ?? null,
          services,
          userMessage: text,
        });

        await sendInstagramMessage(profile.instagram_access_token, senderId, reply);

        if (handoff) {
          await notifyPartnerTelegram(profile.user_id, text, senderId);
        }
      }
    }

    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (e) {
    console.error("instagram-webhook error:", e);
    // Always 200 to Meta to avoid retries storm; log internally
    return new Response("EVENT_RECEIVED", { status: 200 });
  }
});