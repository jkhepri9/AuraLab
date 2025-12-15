// api/create-checkout-session.cjs
const Stripe = require("stripe");

function json(res, code, payload) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
    const PRICE_MONTHLY = process.env.STRIPE_PRICE_ID_MONTHLY || "";
    const PRICE_YEARLY = process.env.STRIPE_PRICE_ID_YEARLY || "";
    const APP_BASE_URL = process.env.APP_BASE_URL || `https://${req.headers.host}`;

    if (!STRIPE_SECRET_KEY) return json(res, 500, { error: "Missing STRIPE_SECRET_KEY" });
    if (!PRICE_MONTHLY) return json(res, 500, { error: "Missing STRIPE_PRICE_ID_MONTHLY" });
    if (!PRICE_YEARLY) return json(res, 500, { error: "Missing STRIPE_PRICE_ID_YEARLY" });

    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body && typeof body === "object" ? body : {};

    const { plan, userId, email } = body;

    const price =
      plan === "yearly" ? PRICE_YEARLY :
      plan === "monthly" ? PRICE_MONTHLY :
      null;

    if (!price) return json(res, 400, { error: "Invalid plan. Use monthly|yearly." });

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: `${APP_BASE_URL}/account?checkout=success`,
      cancel_url: `${APP_BASE_URL}/account?checkout=cancel`,
      customer_email: email || undefined,
      metadata: { user_id: userId || "", plan: plan || "" },
    });

    return json(res, 200, { url: session.url });
  } catch (e) {
    return json(res, 500, { error: e?.message || "Server error creating checkout session" });
  }
};
