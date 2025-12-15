// api/webhook.js
const Stripe = require("stripe");
const { readRawBody, send } = require("./_utils");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

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

    // IMPORTANT:
    // You must update your user database here (Supabase/DB/etc.)
    // based on customer/subscription status.
    //
    // Minimal example: log events for now.
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        // session.customer (Stripe customer id)
        // session.subscription (Stripe subscription id)
        // session.client_reference_id or session.metadata.userId
        console.log("checkout.session.completed", {
          customer: session.customer,
          subscription: session.subscription,
          userId: session.client_reference_id || session.metadata?.userId,
        });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        console.log(event.type, {
          customer: sub.customer,
          status: sub.status,
          cancel_at_period_end: sub.cancel_at_period_end,
          current_period_end: sub.current_period_end,
        });
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
