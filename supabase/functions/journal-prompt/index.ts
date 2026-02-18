import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EntryData {
  fatigue: number | null;
  pain: number | null;
  brain_fog: number | null;
  mood: number | null;
  mobility: number | null;
  sleep_hours: number | null;
  mood_tags: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const entry: EntryData = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build a readable summary of the day's data
    const describe = (v: number | null, label: string, unit = "/10") =>
      v !== null ? `${label}: ${v}${unit}` : null;

    const lines = [
      describe(entry.fatigue, "Fatigue"),
      describe(entry.pain, "Pain"),
      describe(entry.brain_fog, "Brain fog"),
      describe(entry.mood, "Mood"),
      describe(entry.mobility, "Mobility"),
      entry.sleep_hours !== null ? `Sleep last night: ${entry.sleep_hours} hours` : null,
      entry.mood_tags?.length ? `Mood tags: ${entry.mood_tags.join(", ")}` : null,
    ].filter(Boolean);

    const hasData = lines.length > 0;

    const dataBlock = hasData
      ? lines.join("\n")
      : "No symptoms were logged yet today.";

    const systemPrompt = `You are a warm, empathetic journaling coach for someone living with Multiple Sclerosis.
Your job is to suggest 2–3 short, open-ended journal prompts tailored to their day's symptom data.

Rules:
- Each prompt should be one sentence ending in "?" or an open invitation.
- Do NOT interpret symptoms clinically — focus on feelings, moments, coping, gratitude, or reflection.
- Translate numbers into plain feelings (e.g. fatigue 7/10 → "a draining day", mood 8/10 → "a good emotional day").
- Keep tone gentle, curious, and human — never preachy or clinical.
- Return ONLY the prompts as a numbered list (1. … 2. … 3. …), nothing else.`;

    const userPrompt = `Today's symptom data:\n${dataBlock}\n\nSuggest 3 journal prompts for today.`;

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
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached — please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Could not generate prompts" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const json = await response.json();
    const raw = json.choices?.[0]?.message?.content ?? "";

    // Parse numbered list → array of strings
    const prompts = raw
      .split("\n")
      .map((l: string) => l.replace(/^\d+\.\s*/, "").trim())
      .filter((l: string) => l.length > 4);

    return new Response(
      JSON.stringify({ prompts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("journal-prompt error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
