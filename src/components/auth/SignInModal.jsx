// src/components/auth/SignInModal.jsx
import React from "react";

export default function SignInModal({
  open,
  onClose,
  onGoogle,
  googleDisabled = false,
  helperText = "",
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950/95 p-5 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Sign in required"
        >
          <div className="mb-2 text-lg font-semibold text-white">
            Sign In Required
          </div>

          <div className="mb-4 text-sm text-white/70">
            Please sign in to play this mode.
          </div>

          {helperText ? (
            <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
              {helperText}
            </div>
          ) : null}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white/80 hover:bg-white/5"
            >
              Not Now
            </button>

            <button
              onClick={onGoogle}
              disabled={googleDisabled}
              className={[
                "flex-1 rounded-xl px-3 py-2 text-sm font-semibold",
                googleDisabled
                  ? "bg-white/20 text-white/50 cursor-not-allowed"
                  : "bg-white text-black hover:bg-white/90",
              ].join(" ")}
            >
              Continue with Google
            </button>
          </div>

          <div className="mt-3 text-[11px] leading-snug text-white/50">
            Uses your Supabase Google sign-in.
          </div>
        </div>
      </div>
    </div>
  );
}
