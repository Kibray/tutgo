// OAuth callback for Meta/Instagram Business Login
// Exchanges `code` for long-lived access token, fetches IG page id,
// stores credentials in profiles table for the authenticated partner.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const META_APP_ID = Deno.env.get("META_APP_ID")!;
const META_APP_SECRET = Deno.env.get("META_APP_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await anon.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub;

    const body = await req.json();
    const { code, redirect_uri } = body;
    if (!code || !redirect_uri) {
      return new Response(JSON.stringify({ error: "code and redirect_uri required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Exchange code → short-lived user token
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${META_APP_ID}` +
      `&client_secret=${META_APP_SECRET}` +
      `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
      `&code=${encodeURIComponent(code)}`;
    const shortRes = await fetch(tokenUrl);
    const shortData = await shortRes.json();
    if (!shortRes.ok || !shortData.access_token) {
      console.error("Short token error:", shortData);
      return new Response(JSON.stringify({ error: "Failed to get access token", details: shortData }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Exchange short → long-lived token (~60 days)
    const longUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${META_APP_ID}` +
      `&client_secret=${META_APP_SECRET}` +
      `&fb_exchange_token=${shortData.access_token}`;
    const longRes = await fetch(longUrl);
    const longData = await longRes.json();
    const userAccessToken = longData.access_token || shortData.access_token;

    // 3. Get user's pages (need page-scoped token)
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${encodeURIComponent(userAccessToken)}`,
    );
    const pagesData = await pagesRes.json();
    const page = pagesData.data?.[0];
    if (!page?.id || !page?.access_token) {
      return new Response(JSON.stringify({ error: "No Facebook page found. Connect a page linked to your Instagram Business account." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Get connected Instagram Business account id
    const igRes = await fetch(
      `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${encodeURIComponent(page.access_token)}`,
    );
    const igData = await igRes.json();
    const instagramUserId: string | undefined = igData.instagram_business_account?.id;
    if (!instagramUserId) {
      return new Response(JSON.stringify({ error: "Page has no linked Instagram Business account" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Subscribe page to messaging webhooks
    await fetch(
      `https://graph.facebook.com/v21.0/${page.id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token=${encodeURIComponent(page.access_token)}`,
      { method: "POST" },
    );

    // 6. Save to profile (service role bypasses RLS, but we scope to userId)
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { error: updErr } = await admin
      .from("profiles")
      .update({
        instagram_user_id: instagramUserId,
        instagram_page_id: page.id,
        instagram_access_token: page.access_token,
        instagram_connected: true,
      })
      .eq("user_id", userId);

    if (updErr) {
      console.error("Profile update error:", updErr);
      return new Response(JSON.stringify({ error: "Failed to save credentials" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, instagram_user_id: instagramUserId, page_id: page.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("oauth-callback error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});