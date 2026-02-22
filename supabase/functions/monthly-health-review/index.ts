import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { entries, relapses, medications, msType, mode } = await req.json();

    if (!entries || entries.length < 3) {
      return new Response(JSON.stringify({ error: "Need at least 3 entries" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isDoctor = mode === "doctor";

    const systemPrompt = isDoctor
      ? `You are a clinical health data analyst. Generate a concise, professional 90-day clinical summary for a neurologist. Include: symptom averages, notable trends, medication adherence notes, and relapse events. Use clinical but accessible language. Format with clear sections. Be objective and data-driven.`
      : `You are a compassionate health coach for someone living with Multiple Sclerosis. Generate a warm, supportive monthly health review. Highlight the top 3 symptom drivers, identify areas of improvement, and suggest 2-3 practical behavior adjustments. Keep the tone encouraging and empathetic — never clinical or cold.`;

    const userPrompt = `Here is the health data:
- MS Type: ${msType || "Not specified"}
- Medications: ${medications?.join(", ") || "None listed"}
- Entries (last ${entries.length} days): ${JSON.stringify(entries.slice(0, 30).map((e: any) => ({
      date: e.date,
      fatigue: e.fatigue,
      pain: e.pain,
      brain_fog: e.brain_fog,
      mood: e.mood,
      stress: e.stress,
      sleep: e.sleep_hours,
      mobility: e.mobility,
      spasticity: e.spasticity,
    })))}
- Recent relapses: ${JSON.stringify(relapses?.slice(0, 3).map((r: any) => ({
      start: r.start_date,
      end: r.end_date,
      severity: r.severity,
      symptoms: r.symptoms,
    })) || [])}

${isDoctor ? "Generate a structured clinical summary suitable for a neurologist appointment." : "Generate a supportive monthly health review."}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1200,
        temperature: 0.7,
      }),
    });

    const result = await response.json();
    const review = result.choices?.[0]?.message?.content || null;

    return new Response(JSON.stringify({ review }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
