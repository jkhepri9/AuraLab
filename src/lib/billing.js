// src/lib/billing.js
export async function startCheckout(plan = "monthly", { userId = null, email = null } = {}) {
  const res = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, userId, email }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Checkout failed");

  if (data?.url) window.location.href = data.url;
}
