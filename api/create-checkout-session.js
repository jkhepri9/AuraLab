// api/create-checkout-session.js
import Stripe from "stripe";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
    const PRICE_MONTHLY = process.env.STRIPE_PRICE_ID_MONTHLY || "";
    const PRICE_YEARLY = process.env.STRIPE_PRICE_ID_YEARLY || "";
    const APP_BASE_URL = process.env.APP_BASE_URL || `https://${req.headers.host}`;

    if (!STRIPE_SECRET_KEY) return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY" });
    if (!PRICE_MONTHLY) return res.status(500).json({ error: "Missing STRIPE_PRICE_ID_MONTHLY" });
    if (!PRICE_YEARLY) return res.status(500).json({ error: "Missing STRIPE_PRICE_ID_YEARLY" });

    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { plan, userId, email } = body;

    const price =
      plan === "yearly" ? PRICE_YEARLY :
      plan === "monthly" ? PRICE_MONTHLY :
      null;

    if (!price) return res.status(400).json({ error: "Invalid plan. Use monthly|yearly." });

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: `${APP_BASE_URL}/account?checkout=success`,
      cancel_url: `${APP_BASE_URL}/account?checkout=cancel`,
      customer_email: email || undefined,
      metadata: { user_id: userId || "", plan: plan || "" },
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    // Always JSON (prevents “Unexpected token 'A'”)
    return res.status(500).json({ error: e?.message || "Server error creating checkout session" });
  }
}
