// api/create-checkout-session.js
const Stripe = require("stripe");
const { getBaseUrl, readJson, send } = require("./_utils");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

  try {
    const { plan = "monthly", userId = null, email = null } = await readJson(req);

    if (!userId) {
      return send(res, 400, { error: "Missing userId (sign in first)" });
    }

    const priceId =
      plan === "yearly"
        ? process.env.STRIPE_PRICE_ID_YEARLY
        : process.env.STRIPE_PRICE_ID_MONTHLY;

    if (!priceId) return send(res, 500, { error: "Missing STRIPE_PRICE_ID_* env var" });

    const baseUrl = getBaseUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/account?checkout=cancel`,
      allow_promotion_codes: true,

      client_reference_id: String(userId),
      customer_email: email || undefined,
      metadata: { userId: String(userId) },
    });

    return send(res, 200, { url: session.url });
  } catch (e) {
    console.error("create-checkout-session error:", e);
    return send(res, 500, { error: "Failed to create checkout session" });
  }
};
