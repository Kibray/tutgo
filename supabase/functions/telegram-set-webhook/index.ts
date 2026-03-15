const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const TELEGRAM_SECRET_TOKEN = Deno.env.get("TELEGRAM_SECRET_TOKEN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = "https://ivnczarwkkeyncwrovio.supabase.co/functions/v1/telegram-bot";

    // Log secret token info for debugging (not the value itself)
    const tokenLen = TELEGRAM_SECRET_TOKEN?.length ?? 0;
    const tokenValid = TELEGRAM_SECRET_TOKEN ? /^[A-Za-z0-9_-]+$/.test(TELEGRAM_SECRET_TOKEN) : false;
    console.log(`TELEGRAM_SECRET_TOKEN length: ${tokenLen}, valid chars: ${tokenValid}`);

    const payload: Record<string, unknown> = {
      url: webhookUrl,
      allowed_updates: ["message", "callback_query"],
    };

    if (TELEGRAM_SECRET_TOKEN && tokenValid) {
      payload.secret_token = TELEGRAM_SECRET_TOKEN;
    }

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return new Response(JSON.stringify({ ok: data.ok, description: data.description, tokenLen, tokenValid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Set webhook error");
    return new Response(JSON.stringify({ error: "Внутренняя ошибка сервера" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});