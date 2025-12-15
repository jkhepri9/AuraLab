// src/lib/billing.js
export async function startCheckout(plan = "monthly", { userId = null, email = null } = {}) {
  const res = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, userId, email }),
  });

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");

  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new Error(data?.error || `Checkout failed (HTTP ${res.status})`);
  }

  if (!data?.url) throw new Error("Checkout failed: missing redirect URL.");
  window.location.assign(data.url);
}
