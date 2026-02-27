import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUCKET = "exercise-illustrations";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// ── Step 1: Try wger.de open exercise database (real curated images) ──
async function searchWger(exerciseName: string): Promise<string | null> {
  try {
    // Simplify the name for search (remove MS-specific modifiers)
    const searchTerm = exerciseName
      .replace(/\b(modified|assisted|seated|standing|wall|chair|band|light|ms-safe|gentle)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    const searchUrl = `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(searchTerm)}&language=english&format=json`;
    const searchRes = await fetch(searchUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const suggestions = searchData?.suggestions || [];
    if (suggestions.length === 0) return null;

    // Normalize for comparison
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normalizedSearch = normalize(searchTerm);

    // Find best match: prefer exact/close name matches that have images
    for (const suggestion of suggestions) {
      const name = suggestion?.value || suggestion?.data?.name || "";
      const image = suggestion?.data?.image;
      if (!image) continue;

      const normalizedName = normalize(name);
      // Check if the names are related (one contains the other)
      if (normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName)) {
        const fullUrl = image.startsWith("http") ? image : `https://wger.de${image}`;
        console.log(`exercise-illustration wger hit: "${exerciseName}" → "${name}"`);
        return fullUrl;
      }
    }

    // Fallback: first suggestion with an image (looser match)
    const firstWithImage = suggestions.find((s: any) => s?.data?.image);
    if (firstWithImage) {
      const image = firstWithImage.data.image;
      const fullUrl = image.startsWith("http") ? image : `https://wger.de${image}`;
      console.log(`exercise-illustration wger loose hit: "${exerciseName}" → "${firstWithImage.value}"`);
      return fullUrl;
    }

    return null;
  } catch (e) {
    console.log(`exercise-illustration wger search failed: ${e}`);
    return null;
  }
}

// ── Step 2: AI-generated illustration fallback ──
async function generateAndUploadSequence(
  supabase: any,
  apiKey: string,
  slug: string,
  prompt: string
): Promise<string | null> {
  const filePath = `${slug}-sequence.png`;

  // Check cache
  const { data: existing } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  if (existing?.publicUrl) {
    const headRes = await fetch(existing.publicUrl, { method: "HEAD" });
    if (headRes.ok) {
      console.log(`exercise-illustration cache-hit ${slug}-sequence`);
      return existing.publicUrl;
    }
  }

  console.log(`exercise-illustration generating ${slug}-sequence`);

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    console.error("AI gateway error:", aiRes.status, errText);
    if (aiRes.status === 429) throw new Error("Rate limited, try again shortly");
    if (aiRes.status === 402) throw new Error("AI credits exhausted");
    throw new Error(`AI generation failed: ${aiRes.status}`);
  }

  const aiData = await aiRes.json();
  const imageDataUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageDataUrl) return null;

  const base64Match = imageDataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!base64Match) return null;

  const imageBytes = Uint8Array.from(atob(base64Match[2]), (c) => c.charCodeAt(0));
  const contentType = `image/${base64Match[1]}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, imageBytes, { contentType, upsert: true });

  if (uploadError) {
    console.error("upload error:", uploadError.message);
    return imageDataUrl; // fallback to inline
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return publicUrlData?.publicUrl || imageDataUrl;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, muscle_group } = await req.json();
    if (!name || typeof name !== "string") throw new Error("Exercise name is required");

    const slug = slugify(name);
    const mgLabel = muscle_group || "full body";

    // ── Step 1: Try wger.de curated images first ──
    const wgerUrl = await searchWger(name);
    if (wgerUrl) {
      return new Response(
        JSON.stringify({
          sequenceUrl: null,
          curatedUrl: wgerUrl,
          startUrl: null,
          endUrl: null,
          cached: false,
          source: "wger",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 2: AI-generated fallback ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const prompt = `Create a clean 2-panel instructional fitness illustration for the exercise "${name}" targeting ${mgLabel}.
Layout requirements:
- LEFT panel: starting position
- RIGHT panel: end/peak position
- Use the exact SAME person, same outfit, same camera angle, and same setting in both panels
- Show clear body movement progression from left to right
- Add a simple subtle arrow between panels to indicate motion direction
Style:
- minimal flat illustration
- white background
- side view preferred
- soft muted colors (blues, greens, warm skin tones)
- no text, no labels, no logos
- proper and safe form, inclusive neutral appearance.`;

    const sequenceUrl = await generateAndUploadSequence(supabase, LOVABLE_API_KEY, slug, prompt);

    console.log("exercise-illustration done", slug, { source: "ai", sequence: !!sequenceUrl });

    return new Response(
      JSON.stringify({
        sequenceUrl,
        curatedUrl: null,
        startUrl: null,
        endUrl: null,
        cached: false,
        source: "ai",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("exercise-illustration error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    const status = message.includes("Rate limited") ? 429 : message.includes("credits") ? 402 : 500;

    return new Response(
      JSON.stringify({ sequenceUrl: null, curatedUrl: null, startUrl: null, endUrl: null, error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
