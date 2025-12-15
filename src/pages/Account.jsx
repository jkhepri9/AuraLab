// src/pages/Account.jsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { startCheckout } from "@/lib/billing";
import { useAuth } from "@/auth/AuthProvider";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export default function Account() {
  const { user, loading } = useAuth();
  const [sub, setSub] = useState(null);
  const [subLoading, setSubLoading] = useState(false);

  const userId = user?.id || null;
  const email = user?.email || null;

  useEffect(() => {
    let alive = true;

    async function loadSubscription() {
      if (!isSupabaseConfigured || !supabase) return;
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
  }, [userId]);

  const signInGoogle = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
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

        {!isSupabaseConfigured && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
            Supabase is not configured in the frontend. Add:
            <div className="mt-2 font-mono text-xs text-red-200/90">
              VITE_SUPABASE_URL
              <br />
              VITE_SUPABASE_ANON_KEY
            </div>
            Then redeploy.
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
              onClick={signInGoogle}
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
                onClick={() => startCheckout("monthly", { userId, email })}
              >
                Subscribe Monthly
              </Button>

              <Button
                variant="outline"
                className="border-white/10 text-white hover:bg-white/10"
                onClick={() => startCheckout("yearly", { userId, email })}
              >
                Subscribe Yearly
              </Button>

              <Button
                variant="outline"
                className="border-white/10 text-white hover:bg-white/10"
                onClick={signOut}
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
