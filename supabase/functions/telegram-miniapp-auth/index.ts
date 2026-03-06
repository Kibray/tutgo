import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function validateInitData(initData: string): Promise<Record<string, string> | null> {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;

  params.delete("hash");
  const entries = Array.from(params.entries());
  entries.sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

  // HMAC-SHA256 validation per Telegram docs
  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode("WebAppData"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const secretKeyData = await crypto.subtle.sign("HMAC", secretKey, encoder.encode(BOT_TOKEN));
  
  const validationKey = await crypto.subtle.importKey(
    "raw",
    secretKeyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", validationKey, encoder.encode(dataCheckString));
  
  const hexHash = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (hexHash !== hash) return null;

  const result: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(initData).entries()) {
    result[k] = v;
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { initData } = await req.json();

    if (!initData) {
      return new Response(JSON.stringify({ error: "No initData" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validated = await validateInitData(initData);
    if (!validated) {
      return new Response(JSON.stringify({ error: "Invalid initData" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userStr = validated["user"];
    if (!userStr) {
      return new Response(JSON.stringify({ error: "No user in initData" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tgUser = JSON.parse(userStr);
    const chatId = tgUser.id;
    const firstName = tgUser.first_name || "Telegram User";
    const username = tgUser.username || null;

    // Deterministic email & password (same scheme as OTP flow)
    const email = `tg_${chatId}@telegram.tutgo.app`;
    const password = `tg_${chatId}_${SUPABASE_SERVICE_ROLE_KEY.slice(-12)}`;

    // Try sign in first
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInData?.session) {
      // Update profile
      await supabase
        .from("profiles")
        .update({
          telegram_chat_id: chatId,
          telegram_username: username,
          display_name: firstName,
        })
        .eq("user_id", signInData.user.id);

      return new Response(JSON.stringify({
        session: signInData.session,
        user: signInData.user,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create new user
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: firstName,
        telegram_chat_id: chatId,
      },
    });

    if (signUpError || !signUpData.user) {
      return new Response(JSON.stringify({ error: "Account creation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update profile
    await supabase
      .from("profiles")
      .update({
        telegram_chat_id: chatId,
        telegram_username: username,
      })
      .eq("user_id", signUpData.user.id);

    // Sign in
    const { data: newSession } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!newSession?.session) {
      return new Response(JSON.stringify({ error: "Login after signup failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      session: newSession.session,
      user: newSession.user,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("MiniApp auth error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
