import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const KLAVIYO_API_URL = "https://a.klaviyo.com/api/message-sends/";

function avg(vals: (number | null)[]): number | null {
  const v = vals.filter((x): x is number => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function label(v: number | null, unit = "/10"): string {
  if (v === null) return "not recorded";
  return `${v.toFixed(1)}${unit}`;
}

function levelWord(v: number | null): string {
  if (v === null) return "not recorded";
  if (v <= 3) return "low";
  if (v <= 6) return "moderate";
  return "high";
}

function bar(v: number | null, max = 10): string {
  if (v === null) return "─────────── (no data)";
  const filled = Math.round((v / max) * 10);
  return "█".repeat(filled) + "░".repeat(10 - filled) + ` ${v.toFixed(1)}`;
}

function buildHtml(
  email: string,
  entries: {
    fatigue: number | null;
    pain: number | null;
    brain_fog: number | null;
    mood: number | null;
    mobility: number | null;
    sleep_hours: number | null;
  }[],
  weekStart: string,
  weekEnd: string
): string {
  const avgFatigue = avg(entries.map((e) => e.fatigue));
  const avgPain = avg(entries.map((e) => e.pain));
  const avgBrainFog = avg(entries.map((e) => e.brain_fog));
  const avgMood = avg(entries.map((e) => e.mood));
  const avgMobility = avg(entries.map((e) => e.mobility));
  const avgSleep = avg(entries.map((e) => e.sleep_hours));

  const logged = entries.length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Your Weekly MS Digest</title>
<style>
  body { margin:0; padding:0; background:#f5f5f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrap { max-width:560px; margin:32px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 16px rgba(0,0,0,.08); }
  .header { background:linear-gradient(135deg,#E8751A 0%,#f59e0b 100%); padding:32px 32px 24px; color:#fff; }
  .header h1 { margin:0 0 4px; font-size:22px; font-weight:700; }
  .header p { margin:0; font-size:14px; opacity:.85; }
  .body { padding:28px 32px; }
  .week-label { font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.08em; color:#9ca3af; margin-bottom:20px; }
  .stat-row { display:flex; align-items:center; margin-bottom:14px; gap:12px; }
  .stat-label { width:88px; font-size:13px; color:#6b7280; flex-shrink:0; }
  .stat-bar { flex:1; font-family:monospace; font-size:12px; color:#374151; }
  .stat-raw { width:48px; text-align:right; font-size:12px; color:#9ca3af; flex-shrink:0; }
  .divider { height:1px; background:#f3f4f6; margin:20px 0; }
  .footer { padding:20px 32px 28px; background:#fafafa; }
  .footer p { margin:0 0 8px; font-size:12px; color:#9ca3af; line-height:1.6; }
  .footer a { color:#E8751A; text-decoration:none; }
  .badge { display:inline-block; background:#fef3c7; color:#b45309; font-size:11px; font-weight:600; border-radius:999px; padding:2px 10px; margin-left:8px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>🧡 Your Weekly MS Digest</h1>
    <p>${weekStart} – ${weekEnd} · ${logged} day${logged !== 1 ? "s" : ""} logged</p>
  </div>
  <div class="body">
    <div class="week-label">Symptom Averages</div>

    <div class="stat-row">
      <span class="stat-label">😴 Fatigue</span>
      <span class="stat-bar">${bar(avgFatigue)}</span>
      <span class="stat-raw">${levelWord(avgFatigue)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">⚡ Pain</span>
      <span class="stat-bar">${bar(avgPain)}</span>
      <span class="stat-raw">${levelWord(avgPain)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">🌫️ Brain Fog</span>
      <span class="stat-bar">${bar(avgBrainFog)}</span>
      <span class="stat-raw">${levelWord(avgBrainFog)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">😊 Mood</span>
      <span class="stat-bar">${bar(avgMood)}</span>
      <span class="stat-raw">${levelWord(avgMood)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">🚶 Mobility</span>
      <span class="stat-bar">${bar(avgMobility)}</span>
      <span class="stat-raw">${levelWord(avgMobility)}</span>
    </div>

    <div class="divider"></div>

    <div class="week-label">Sleep</div>
    <div class="stat-row">
      <span class="stat-label">💤 Avg Sleep</span>
      <span class="stat-bar" style="font-family:inherit;font-size:13px;color:#374151;">${label(avgSleep, " hrs / night")}</span>
    </div>

    <div class="divider"></div>

    <p style="font-size:13px;color:#374151;line-height:1.7;margin:0;">
      Keep going — every entry helps you and your care team see the full picture. 
      Open the app to log today and keep your streak alive! 💪
    </p>
  </div>
  <div class="footer">
    <p>You're receiving this because you opted into weekly digests in LiveWithMS.<br/>
    <a href="#">Unsubscribe</a> · This is not medical advice.</p>
  </div>
</div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const KLAVIYO_API_KEY = Deno.env.get("KLAVIYO_API_KEY");
    const KLAVIYO_FROM_EMAIL = Deno.env.get("KLAVIYO_FROM_EMAIL");

    if (!KLAVIYO_API_KEY) throw new Error("KLAVIYO_API_KEY is not configured");
    if (!KLAVIYO_FROM_EMAIL) throw new Error("KLAVIYO_FROM_EMAIL is not configured");

    // Admin client — bypasses RLS to query all opted-in users
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all opted-in profiles with an email
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("user_id, neurologist_email")
      .eq("weekly_digest_enabled", true);

    if (profErr) throw profErr;
    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: "No opted-in users found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Week window: last 7 days
    const now = new Date();
    const weekEnd = now.toISOString().slice(0, 10);
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const results: { user_id: string; status: string; error?: string }[] = [];

    for (const profile of profiles) {
      try {
        // Get the user's auth email
        const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(
          profile.user_id
        );
        if (userErr || !userData?.user?.email) {
          results.push({ user_id: profile.user_id, status: "skipped", error: "no email" });
          continue;
        }
        const recipientEmail = userData.user.email;

        // Fetch last 7 days of entries
        const { data: entries, error: entErr } = await supabase
          .from("daily_entries")
          .select("fatigue, pain, brain_fog, mood, mobility, sleep_hours")
          .eq("user_id", profile.user_id)
          .gte("date", weekStart)
          .lte("date", weekEnd);

        if (entErr) throw entErr;

        if (!entries || entries.length === 0) {
          results.push({ user_id: profile.user_id, status: "skipped", error: "no entries" });
          continue;
        }

        const html = buildHtml(recipientEmail, entries, weekStart, weekEnd);

        // Klaviyo send-message endpoint
        const resp = await fetch(KLAVIYO_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
            "Content-Type": "application/json",
            revision: "2024-10-15",
          },
          body: JSON.stringify({
            data: {
              type: "message-send",
              attributes: {
                message: {
                  channel: "email",
                  to: [{ email: recipientEmail }],
                  from: {
                    email: KLAVIYO_FROM_EMAIL,
                    name: "LiveWithMS",
                  },
                  subject: `🧡 Your weekly MS digest — ${weekStart}`,
                  content: { html },
                },
              },
            },
          }),
        });

        if (!resp.ok) {
          const body = await resp.text();
          console.error(`Klaviyo error for ${recipientEmail}:`, resp.status, body);
          results.push({ user_id: profile.user_id, status: "error", error: `${resp.status}: ${body}` });
          continue;
        }

        await resp.text(); // consume body
        results.push({ user_id: profile.user_id, status: "sent" });
      } catch (e) {
        results.push({
          user_id: profile.user_id,
          status: "error",
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-weekly-digest error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
