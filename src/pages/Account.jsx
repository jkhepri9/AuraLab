// src/pages/Account.jsx
import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { startCheckout } from "@/lib/billing";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function Account() {
  const q = useQuery();
  const status = q.get("checkout"); // "success" | "cancel" | null

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 text-white px-5 py-10">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold">Account</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your subscription and premium access.
          </p>
        </div>

        {status === "success" && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
            Subscription started successfully.
          </div>
        )}

        {status === "cancel" && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-200">
            Checkout canceled.
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div>
            <div className="text-lg font-bold">Go Premium</div>
            <div className="text-sm text-gray-400">
              Unlock premium modes, longer exports, and advanced studio features.
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
              onClick={() => startCheckout("monthly")}
            >
              Subscribe Monthly
            </Button>

            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/10"
              onClick={() => startCheckout("yearly")}
            >
              Subscribe Yearly
            </Button>
          </div>

          <div className="text-[12px] text-gray-500">
            After payment, you’ll be returned here.
          </div>
        </div>
      </div>
    </div>
  );
}
