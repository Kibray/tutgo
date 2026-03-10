import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sanitize user input: remove PostgREST special chars to prevent filter injection
function sanitizeSearchInput(input: string): string {
  // Remove PostgREST operators and SQL-dangerous chars
  return input
    .replace(/[%_\\'";\(\)\{\}\[\]]/g, '')
    .replace(/\.\./g, '')
    .trim()
    .slice(0, 200); // Limit length
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    const lastUserMessage = messages.filter((m: any) => m.role === "user").pop()?.content || "";

    // Sanitize the search term before using in DB queries
    const sanitized = sanitizeSearchInput(lastUserMessage);

    // Search DB for relevant results using service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Use sanitized input in ilike filters
    const searchPattern = `%${sanitized}%`;

    // Search locations
    const { data: locations } = await supabase
      .from("locations")
      .select("id, name, business_type, sub_category, address, lat, lng, phone, rating, review_count, price_from, currency, description")
      .or(`name.ilike.${searchPattern},address.ilike.${searchPattern},sub_category.ilike.${searchPattern},business_type.ilike.${searchPattern},description.ilike.${searchPattern}`)
      .limit(10);

    // Search services
    const { data: services } = await supabase
      .from("services")
      .select("id, name, price, currency, duration_minutes, location_id, description")
      .or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`)
      .limit(10);

    // Get categories for context
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name, subcategories");

    // Build context
    const searchContext = {
      locations: locations || [],
      services: services || [],
      categories: categories || [],
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service unavailable");

    const systemPrompt = `You are TUTGO AI Assistant — a smart concierge for finding services and businesses in Tashkent, Uzbekistan.

CRITICAL RULES:
1. Detect the user's language (Russian, Uzbek, or English) and ALWAYS reply in the SAME language.
2. You help users find businesses, services, beauty salons, clinics, tours, car services, cafes, etc.
3. When you find relevant results, format them as a JSON block wrapped in \`\`\`json_results ... \`\`\` so the app can render cards.
4. Be concise, friendly, helpful. Use emojis sparingly.

SEARCH RESULTS FROM DATABASE (use these to answer):
${JSON.stringify(searchContext, null, 2)}

RESPONSE FORMAT when results found:
1. Brief text intro (1-2 sentences)
2. Then a json_results block like:
\`\`\`json_results
[{"id":"uuid","name":"Name","address":"Address","rating":4.5,"price_from":50000,"currency":"сум","lat":41.31,"lng":69.28,"business_type":"beauty"}]
\`\`\`
3. Brief follow-up question

If NO results found, suggest alternative search terms or categories.
If the user asks something unrelated to services/businesses, politely redirect to TUTGO features.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов, попробуйте позже" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Необходимо пополнить баланс AI" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", status);
      return new Response(JSON.stringify({ error: "Ошибка AI сервиса" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: "Внутренняя ошибка сервера" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
