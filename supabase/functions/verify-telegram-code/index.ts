import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();

    if (!code || code.length !== 6) {
      return new Response(JSON.stringify({ error: "Введите 6-значный код" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find valid code
    const { data: authCode, error: findError } = await supabase
      .from("telegram_auth_codes")
      .select("*")
      .eq("code", code)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (findError || !authCode) {
      return new Response(JSON.stringify({ error: "Неверный или просроченный код" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark code as used
    await supabase
      .from("telegram_auth_codes")
      .update({ used: true })
      .eq("id", authCode.id);

    // Create a deterministic email from telegram_chat_id
    const email = `tg_${authCode.telegram_chat_id}@telegram.tutgo.app`;
    const password = `tg_${authCode.telegram_chat_id}_${SUPABASE_SERVICE_ROLE_KEY.slice(-12)}`;

    // Try to sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInData?.session) {
      // Update profile with telegram info
      await supabase
        .from("profiles")
        .update({
          telegram_chat_id: authCode.telegram_chat_id,
          telegram_username: authCode.telegram_username,
          display_name: authCode.telegram_first_name || undefined,
        })
        .eq("user_id", signInData.user.id);

      return new Response(JSON.stringify({
        session: signInData.session,
        user: signInData.user,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // User doesn't exist — create account
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: authCode.telegram_first_name || "Telegram User",
        telegram_chat_id: authCode.telegram_chat_id,
      },
    });

    if (signUpError || !signUpData.user) {
      console.error("Signup error:", signUpError);
      return new Response(JSON.stringify({ error: "Ошибка создания аккаунта" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update profile with telegram info
    await supabase
      .from("profiles")
      .update({
        telegram_chat_id: authCode.telegram_chat_id,
        telegram_username: authCode.telegram_username,
      })
      .eq("user_id", signUpData.user.id);

    // Sign in the newly created user
    const { data: newSignIn, error: newSignInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (newSignInError || !newSignIn.session) {
      return new Response(JSON.stringify({ error: "Ошибка входа после регистрации" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      session: newSignIn.session,
      user: newSignIn.user,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Verify error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
