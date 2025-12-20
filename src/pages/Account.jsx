// src/pages/Account.jsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { startCheckout } from "@/lib/billing";
import { useAuth } from "@/auth/AuthProvider";
import { getSupabase, getIsSupabaseConfigured } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";

const AUTH_RETURN_TO_KEY = "auralab_auth_return_to_v1";

export default function Account() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [sub, setSub] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const supabase = getSupabase();
  const configured = getIsSupabaseConfigured();

  const userId = user?.id || null;
  const email = user?.email || null;

  // If sign-in came from the playback gate, return user back after auth succeeds.
  useEffect(() => {
    if (!user) return;

    let returnTo = "";
    try {
      returnTo = localStorage.getItem(AUTH_RETURN_TO_KEY) || "";
    } catch {
      returnTo = "";
    }

    // Only redirect to safe in-app paths
    if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("/account")) {
      try {
        localStorage.removeItem(AUTH_RETURN_TO_KEY);
      } catch {
        // ignore
      }

      // Navigate after user exists (meaning session is established)
      // Use replace to avoid keeping /account in history if they didn't intend to visit it.
      navigate(returnTo, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    let alive = true;

    async function loadSubscription() {
      if (!configured || !supabase) return;
      if (!userId) {
        setSub(null);
        return;
      }

      setSubLoading(true);

      const { data, error } = await supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", userId)
        .maybeSingle();

      if (!alive) return;

      if (error) {
        console.warn("subscription read error", error);
        setSub(null);
      } else {
        setSub(data ?? null);
      }

      setSubLoading(false);
    }

    loadSubscription();
    return () => {
      alive = false;
    };
  }, [userId, configured]);

  const handleCheckout = async (plan) => {
    setCheckoutError("");
    setCheckoutLoading(true);

    try {
      await startCheckout(plan, { userId, email });
    } catch (e) {
      const msg = e?.message || "Checkout failed";
      console.error("Checkout error:", e);
      setCheckoutError(msg);
      toast.error(msg);
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-5 py-10 text-white">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold">Account</h1>
          <p className="text-sm text-gray-400 mt-1">
            Sign in, subscribe, and manage premium access.
          </p>
        </div>

        {!configured && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
            Supabase is not configured in the frontend.
          </div>
        )}

        {authError && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {authError}
          </div>
        )}

        {checkoutError && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {checkoutError}
          </div>
        )}

        {loading ? (
          <div className="text-gray-400">Loading…</div>
        ) : !user ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
            <div className="text-sm text-gray-300">
              You need to sign in before subscribing (so premium can be attached to your account).
            </div>

            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
              onClick={() => {
                setAuthError("");
                // Sign-in from Account itself (no returnTo needed)
                signInWithGoogle({ returnToPath: "" });
              }}
              disabled={!supabase}
            >
              Sign in with Google
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
            <div className="text-sm text-gray-300">
              Signed in as <span className="font-semibold">{email}</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-bold">Subscription</div>
              {subLoading ? (
                <div className="text-sm text-gray-400 mt-1">Checking…</div>
              ) : sub?.status ? (
                <div className="text-sm text-gray-300 mt-1">
                  Status: <span className="font-semibold">{sub.status}</span>
                </div>
              ) : (
                <div className="text-sm text-gray-400 mt-1">
                  No active subscription on file.
                </div>
              )}
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
                onClick={() => handleCheckout("monthly")}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? "Redirecting…" : "Subscribe Monthly"}
              </Button>

              <Button
                variant="outline"
                className="border-white/10 text-white hover:bg-white/10"
                onClick={() => handleCheckout("yearly")}
                disabled={checkoutLoading}
              >
                Subscribe Yearly
              </Button>

              <Button
                variant="outline"
                className="border-white/10 text-white hover:bg-white/10"
                onClick={() => signOut()}
                disabled={!supabase}
              >
                Sign out
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
