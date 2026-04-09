import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${d}`);
};

serve(async (req) => {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey || !webhookSecret) {
    logStep("Missing secrets");
    return new Response("Server misconfigured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    logStep("Signature verification failed", { error: String(err) });
    return new Response("Invalid signature", { status: 400 });
  }

  logStep("Event received", { type: event.type, id: event.id });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        if (!userId) {
          logStep("No user_id in session metadata, looking up by email");
          // Try to find user by email
          const email = session.customer_details?.email || session.customer_email;
          if (email) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("user_id")
              .eq("user_id", (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === email)?.id ?? "")
              .limit(1);
            if (profiles && profiles.length > 0) {
              await activatePremium(supabase, profiles[0].user_id, session.subscription as string, stripe);
            }
          }
          break;
        }
        await activatePremium(supabase, userId, session.subscription as string, stripe);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        if (!userId) {
          logStep("No user_id in subscription metadata, skipping");
          break;
        }

        const isActive = ["active", "trialing"].includes(subscription.status);
        const endDate = new Date(subscription.current_period_end * 1000).toISOString();

        await supabase.from("profiles").update({
          is_premium: isActive,
          premium_until: isActive ? endDate : null,
        }).eq("user_id", userId);

        logStep("Subscription synced", { userId, status: subscription.status, isActive });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        if (!userId) break;

        await supabase.from("profiles").update({
          is_premium: false,
          premium_until: null,
        }).eq("user_id", userId);

        logStep("Subscription cancelled", { userId });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }
  } catch (err) {
    logStep("Error processing event", { error: String(err) });
    return new Response("Processing error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

async function activatePremium(
  supabase: any,
  userId: string,
  subscriptionId: string | null,
  stripe: Stripe
) {
  let premiumUntil: string | null = null;

  if (subscriptionId) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    premiumUntil = new Date(sub.current_period_end * 1000).toISOString();
  }

  await supabase.from("profiles").update({
    is_premium: true,
    premium_until: premiumUntil,
    premium_started_at: new Date().toISOString(),
  }).eq("user_id", userId);

  logStep("Premium activated", { userId, premiumUntil });
}
