import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL = "google/gemini-3-flash-preview";

// Sanitize user input: remove PostgREST special chars to prevent filter injection
function sanitizeSearchInput(input: string): string {
  return input
    .replace(/[%_\\'";\(\)\{\}\[\]]/g, '')
    .replace(/\.\./g, '')
    .replace(/,/g, ' ')
    .trim()
    .slice(0, 200);
}

interface Intent {
  service_query: string;
  business_type: string | null;
  location: string | null;
  date: string | null;      // YYYY-MM-DD
  time_from: string | null; // HH:MM
  budget_max: number | null;
  rating_min: number | null;
  language: "ru" | "uz" | "en";
  missing: string[];
}

const EMPTY_INTENT: Intent = {
  service_query: "", business_type: null, location: null, date: null,
  time_from: null, budget_max: null, rating_min: null, language: "ru", missing: [],
};

const BUSINESS_TYPES = [
  "beauty", "medical", "cafe", "retail", "auto", "fitness",
  "education", "tour", "hotel", "service",
];

async function extractIntent(
  apiKey: string,
  messages: { role: string; content: string }[],
  todayIso: string,
): Promise<Intent> {
  const prompt = `You extract structured search intent for TUTGO (services marketplace in Tashkent, Uzbekistan).
Today is ${todayIso} (Asia/Tashkent).
Return ONLY a json object with these keys:
{
 "service_query": "short keywords of the service/place the user wants, in the user's language, e.g. 'стоматолог'",
 "business_type": one of ${JSON.stringify(BUSINESS_TYPES)} or null,
 "location": "district / area / address mentioned, else null",
 "date": "YYYY-MM-DD if a date is stated or implied (tomorrow, saturday), else null",
 "time_from": "HH:MM if a time constraint is stated, else null",
 "budget_max": number in local currency (сум) if a max budget is stated, else null,
 "rating_min": number 0-5 if the user wants high rating (use 4.5 for 'лучшие'/'best'), else null,
 "language": "ru" | "uz" | "en" (language of the last user message),
 "missing": array of any of ["date","time","location","budget"] that are important for THIS request but not provided (keep it minimal, at most 1)
}
Never invent businesses. Only reflect what the user said.`;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: prompt }, ...messages.slice(-6)],
        response_format: { type: "json_object" },
      }),
    });
    if (!resp.ok) return { ...EMPTY_INTENT };
    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw.replace(/^```json\s*|```$/g, "").trim());
    return {
      ...EMPTY_INTENT,
      ...parsed,
      business_type: BUSINESS_TYPES.includes(parsed.business_type) ? parsed.business_type : null,
      missing: Array.isArray(parsed.missing) ? parsed.missing.slice(0, 1) : [],
    };
  } catch (e) {
    console.error("intent extraction failed:", e);
    return { ...EMPTY_INTENT };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service unavailable");

    const now = new Date(Date.now() + 5 * 3600 * 1000); // Asia/Tashkent
    const todayIso = now.toISOString().slice(0, 10);

    // ---------- 1. STRUCTURED INTENT ----------
    const intent = await extractIntent(LOVABLE_API_KEY, messages, todayIso);

    // ---------- 2. RETRIEVAL (Supabase = source of truth) ----------
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const terms = sanitizeSearchInput(intent.service_query || lastUserMessage)
      .split(/\s+/)
      .filter((w) => w.length >= 3)
      .slice(0, 4);
    const locTerm = intent.location ? sanitizeSearchInput(intent.location) : null;

    let locQuery = supabase
      .from("locations")
      .select("id, name, business_type, sub_category, address, city, lat, lng, phone, rating, review_count, price_from, currency, description, verified, is_promoted")
      .limit(40);

    if (intent.business_type) locQuery = locQuery.eq("business_type", intent.business_type);
    if (terms.length) {
      const ors = terms.flatMap((t) => [
        `name.ilike.%${t}%`,
        `sub_category.ilike.%${t}%`,
        `description.ilike.%${t}%`,
        `business_type.ilike.%${t}%`,
      ]);
      locQuery = locQuery.or(ors.join(","));
    }
    let { data: locations } = await locQuery;

    // Widen: if strict category+keyword search found nothing, retry on category alone
    if ((!locations || locations.length === 0) && intent.business_type) {
      const { data: fallback } = await supabase
        .from("locations")
        .select("id, name, business_type, sub_category, address, city, lat, lng, phone, rating, review_count, price_from, currency, description, verified, is_promoted")
        .eq("business_type", intent.business_type)
        .limit(20);
      locations = fallback || [];
    }
    locations = locations || [];

    // Matching services for the found locations (real prices only)
    const locIds = locations.map((l: any) => l.id);
    let services: any[] = [];
    if (locIds.length) {
      const { data: svc } = await supabase
        .from("services")
        .select("id, name, price, currency, duration_minutes, location_id")
        .in("location_id", locIds)
        .limit(200);
      services = svc || [];
    }

    const svcByLoc = new Map<string, any[]>();
    for (const s of services) {
      const arr = svcByLoc.get(s.location_id) || [];
      arr.push(s);
      svcByLoc.set(s.location_id, arr);
    }

    // ---------- 3. RANKING ----------
    const lower = (v: unknown) => String(v ?? "").toLowerCase();
    const scored = locations.map((l: any) => {
      const svcList = svcByLoc.get(l.id) || [];
      const matchingSvc = svcList.filter((s) =>
        terms.some((t) => lower(s.name).includes(t.toLowerCase()))
      );
      const cheapest = (matchingSvc.length ? matchingSvc : svcList)
        .map((s) => s.price)
        .filter((p) => typeof p === "number" && p > 0)
        .sort((a, b) => a - b)[0] ?? l.price_from ?? null;

      let score = 0;
      // relevance
      const hay = `${lower(l.name)} ${lower(l.sub_category)} ${lower(l.description)}`;
      score += terms.filter((t) => hay.includes(t.toLowerCase())).length * 3;
      if (matchingSvc.length) score += 3;
      if (intent.business_type && l.business_type === intent.business_type) score += 2;
      // location fit
      if (locTerm) {
        const lt = locTerm.toLowerCase();
        if (lower(l.address).includes(lt) || lower(l.city).includes(lt)) score += 5;
      }
      // price fit
      if (intent.budget_max != null && cheapest != null) {
        score += cheapest <= intent.budget_max ? 3 : -5;
      }
      // rating
      if (typeof l.rating === "number") {
        score += l.rating;
        if (intent.rating_min != null && l.rating < intent.rating_min) score -= 4;
      }
      if ((l.review_count ?? 0) > 5) score += 0.5;
      if (l.verified) score += 1;
      if (l.is_promoted) score += 0.5;

      return {
        score,
        card: {
          id: l.id,
          name: l.name,
          category: l.sub_category || l.business_type,
          business_type: l.business_type,
          address: l.address,
          rating: l.rating,
          review_count: l.review_count,
          price_from: cheapest,
          currency: l.currency || "сум",
          lat: l.lat,
          lng: l.lng,
          services: (matchingSvc.length ? matchingSvc : svcList).slice(0, 3).map((s) => ({
            id: s.id, name: s.name, price: s.price, duration_minutes: s.duration_minutes,
          })),
          booking_path: `/service/${l.id}`,
        },
      };
    });

    const strong = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((s) => s.card);

    const { data: categories } = await supabase.from("categories").select("id, name, subcategories");

    // ---------- 4. GENERATION ----------
    const systemPrompt = `You are TUTGO AI Assistant — a concierge for finding services and businesses in Tashkent, Uzbekistan.

LANGUAGE: reply in ${intent.language} (the user's language: ru/uz/en). Always match the user's language.

STRUCTURED INTENT EXTRACTED FROM THE CONVERSATION:
${JSON.stringify(intent, null, 2)}

VERIFIED CANDIDATES FROM THE DATABASE (the ONLY businesses, prices and ratings you may mention):
${JSON.stringify(strong, null, 2)}

AVAILABLE CATEGORIES:
${JSON.stringify(categories || [], null, 2)}

HARD RULES:
- NEVER invent businesses, services, prices, ratings, phone numbers or availability. Only use the candidates above.
- NEVER claim a specific time slot is free. Say the user can check and book free time on the place page.
- If candidates array is empty: say briefly that nothing matched, and suggest broadening the search or a related category from the list. Do not output a json_results block.
- If "missing" in the intent is non-empty AND you still show results, end with ONE short follow-up question about that single missing detail. Never ask more than one question.
- Be concise (1-3 sentences before the results), friendly, emojis sparingly.

RESPONSE FORMAT when there are candidates:
1. A short intro sentence.
2. A fenced block exactly like:
\`\`\`json_results
[ ...copy the candidate objects verbatim, best first, max 5... ]
\`\`\`
3. One short follow-up question (only if needed).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
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
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        // Structured intent for the client (date/time carried into the booking flow)
        "X-Tutgo-Intent": encodeURIComponent(JSON.stringify({
          date: intent.date, time_from: intent.time_from, language: intent.language,
        })),
        "Access-Control-Expose-Headers": "X-Tutgo-Intent",
      },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: "Внутренняя ошибка сервера" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
