// api/debug-env.js
export default function handler(req, res) {
  const key = (process.env.STRIPE_SECRET_KEY || "").trim();

  res.status(200).json({
    vercelEnv: process.env.VERCEL_ENV || null,          // production | preview | development
    gitCommit: process.env.VERCEL_GIT_COMMIT_SHA || null,

    hasStripeSecretKey: Boolean(key),
    stripeSecretPrefix: key ? key.slice(0, 7) : null,  // "sk_live" or "sk_test"
    stripeSecretLength: key ? key.length : 0,

    hasMonthlyPrice: Boolean((process.env.STRIPE_PRICE_ID_MONTHLY || "").trim()),
    hasYearlyPrice: Boolean((process.env.STRIPE_PRICE_ID_YEARLY || "").trim()),
    hasAppBaseUrl: Boolean((process.env.APP_BASE_URL || "").trim()),
  });
}
