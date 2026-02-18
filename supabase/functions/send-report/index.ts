import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const KLAVIYO_BASE = "https://a.klaviyo.com/api";
const KLAVIYO_REVISION = "2024-10-15";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth ────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userEmail = claimsData.claims.email as string;

    // ── Secrets ──────────────────────────────────────────────
    const KLAVIYO_API_KEY = Deno.env.get("KLAVIYO_API_KEY");
    const KLAVIYO_FROM_EMAIL = Deno.env.get("KLAVIYO_FROM_EMAIL");
    if (!KLAVIYO_API_KEY) throw new Error("KLAVIYO_API_KEY is not configured");
    if (!KLAVIYO_FROM_EMAIL) throw new Error("KLAVIYO_FROM_EMAIL is not configured");

    // ── Payload ──────────────────────────────────────────────
    const { recipientEmail, pdfBase64, fileName, reportPeriod } = await req.json();
    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: "recipientEmail is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!pdfBase64) {
      return new Response(JSON.stringify({ error: "pdfBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeFileName = fileName ?? "LiveWithMS-Report.pdf";
    const period = reportPeriod ?? "recent period";

    // ── Send via Klaviyo Messages API ────────────────────────
    // Klaviyo's /api/messages endpoint supports attachments
    const body = {
      data: {
        type: "message",
        attributes: {
          channel: "email",
          to: [recipientEmail],
          from_email: KLAVIYO_FROM_EMAIL,
          from_label: "LiveWithMS",
          subject: `MS Health Report – ${period}`,
          body: {
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                <div style="background:#EA580C;padding:20px;border-radius:8px 8px 0 0;">
                  <h1 style="color:white;margin:0;font-size:22px;">LiveWithMS</h1>
                  <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px;">Doctor-Ready Health Report</p>
                </div>
                <div style="background:#FFFAF7;padding:24px;border:1px solid #F0E6D8;border-top:none;border-radius:0 0 8px 8px;">
                  <p style="color:#1F1F1F;font-size:15px;">Dear Dr.,</p>
                  <p style="color:#444;font-size:14px;line-height:1.6;">
                    Please find attached a health report from your patient covering the <strong>${period}</strong>.
                    This report was generated via LiveWithMS and includes symptom tracking data, medication adherence,
                    and personal observations.
                  </p>
                  <p style="color:#444;font-size:14px;line-height:1.6;">
                    The PDF is attached to this email for your records.
                  </p>
                  <div style="margin:20px 0;padding:12px 16px;background:#FFF7ED;border-left:4px solid #EA580C;border-radius:4px;">
                    <p style="color:#7C2D12;font-size:12px;margin:0;">
                      ⚕️ This report is for informational purposes only and does not constitute medical advice.
                      Always consult with your neurologist for medical decisions.
                    </p>
                  </div>
                  <p style="color:#666;font-size:12px;">
                    Sent on behalf of patient (${userEmail}) via LiveWithMS
                  </p>
                </div>
              </div>
            `,
            text: `LiveWithMS Health Report\n\nDear Dr.,\n\nPlease find the attached health report for the period: ${period}.\n\nSent on behalf of ${userEmail}.\n\n⚕️ Not medical advice. Always consult your neurologist.`,
          },
          attachments: [
            {
              filename: safeFileName,
              content: pdfBase64,
              content_type: "application/pdf",
            },
          ],
        },
      },
    };

    const res = await fetch(`${KLAVIYO_BASE}/messages/`, {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
        "Content-Type": "application/json",
        revision: KLAVIYO_REVISION,
        accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    const parsed = text ? JSON.parse(text) : {};

    if (!res.ok) {
      console.error("Klaviyo error:", res.status, text);
      // Fall back to a mailto approach if Klaviyo messages API isn't enabled
      // Return a structured error so the client can handle it gracefully
      return new Response(
        JSON.stringify({
          error: "email_send_failed",
          klaviyo_status: res.status,
          detail: parsed,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true, recipientEmail }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-report error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
