// api/webhook.js
const Stripe = require("stripe");
const { readRawBody, send } = require("./_utils");
const { createClient } = require("@supabase/supabase-js");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function upsertSubscriptionByCustomer(customerId) {
  // Pull latest active-ish subscription for that customer
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1,
    status: "all",
  });

  const sub = subs.data?.[0];
  if (!sub) return;

  // We store userId in subscription metadata (set from checkout session)
  const userId = sub.metadata?.userId || null;
  if (!userId) {
    console.warn("Subscription missing metadata.userId. Cannot attach to user.");
    return;
  }

  const payload = {
    user_id: userId,
    stripe_customer_id: String(customerId),
    stripe_subscription_id: String(sub.id),
    status: String(sub.status),
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.error("Supabase upsert error:", error);
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

  const sig = req.headers["stripe-signature"];
  if (!sig) return send(res, 400, { error: "Missing Stripe signature" });

  try {
    const rawBody = await readRawBody(req);

    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        // Attach userId to the subscription metadata for later tracking
        const userId = session.client_reference_id || session.metadata?.userId || null;
        const subscriptionId = session.subscription;

        if (userId && subscriptionId) {
          await stripe.subscriptions.update(subscriptionId, {
            metadata: { userId: String(userId) },
          });
        }

        if (session.customer) {
          await upsertSubscriptionByCustomer(session.customer);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        if (sub.customer) {
          await upsertSubscriptionByCustomer(sub.customer);
        }
        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        const inv = event.data.object;
        if (inv.customer) {
          await upsertSubscriptionByCustomer(inv.customer);
        }
        break;
      }

      default:
        break;
    }

    return send(res, 200, { received: true });
  } catch (e) {
    console.error("webhook error:", e.message || e);
    return send(res, 400, { error: "Webhook error" });
  }
};
