// src/auth/AuthProvider.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { getSupabase, getIsSupabaseConfigured } from "@/lib/supabaseClient";
import SignInModal from "../components/auth/SignInModal";

const AuthContext = createContext(null);

const AUTH_RETURN_TO_KEY = "auralab_auth_return_to_v1";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Global sign-in gate modal (used by playback gate)
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();

    if (!supabase) {
      setSession(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data?.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      setLoading(false);

      // If user just signed in, close the gate modal
      if (newSession?.user) setGateOpen(false);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const configured = getIsSupabaseConfigured();
  const supabase = getSupabase();

  const user = session?.user ?? null;
  const isAuthed = !!user;

  const openGate = useCallback(() => setGateOpen(true), []);
  const closeGate = useCallback(() => setGateOpen(false), []);

  /**
   * Used by playback gate:
   * - If still loading, do nothing (prevents modal flashing).
   * - If authed, return true.
   * - If not authed, open modal and return false.
   */
  const requireAuth = useCallback(() => {
    if (loading) return false;
    if (isAuthed) return true;
    setGateOpen(true);
    return false;
  }, [loading, isAuthed]);

  /**
   * Supabase Google OAuth.
   * IMPORTANT:
   * - Always redirect to /account (stable callback route you already allow)
   * - Save "returnTo" so /account can send the user back after sign-in
   */
  const signInWithGoogle = useCallback(
    async ({ returnToPath } = {}) => {
      if (!supabase) return;

      try {
        if (returnToPath && typeof returnToPath === "string") {
          // Only store relative in-app paths (safety + router friendly)
          if (returnToPath.startsWith("/")) {
            localStorage.setItem(AUTH_RETURN_TO_KEY, returnToPath);
          }
        }

        const redirectTo = `${window.location.origin}/account`;

        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });

        if (error) {
          console.error("[AuthProvider] Supabase sign-in error:", error);
          // Keep modal open so user can retry
          setGateOpen(true);
        }
      } catch (e) {
        console.error("[AuthProvider] signInWithGoogle failed:", e);
        setGateOpen(true);
      }
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, [supabase]);

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      configured,
      supabase,

      // gate + auth helpers
      isAuthed,
      requireAuth,
      openGate,
      closeGate,
      signInWithGoogle,
      signOut,

      // shared key for Account to read (not required, but useful)
      AUTH_RETURN_TO_KEY,
    }),
    [
      session,
      user,
      loading,
      configured,
      supabase,
      isAuthed,
      requireAuth,
      openGate,
      closeGate,
      signInWithGoogle,
      signOut,
    ]
  );

  const googleDisabled = !configured || !supabase;

  return (
    <AuthContext.Provider value={value}>
      {children}

      <SignInModal
        open={gateOpen}
        onClose={closeGate}
        onGoogle={() => {
          const returnToPath =
            window.location.pathname + window.location.search + window.location.hash;
          signInWithGoogle({ returnToPath });
        }}
        googleDisabled={googleDisabled}
        helperText={
          !configured
            ? "Supabase is not configured, so Google sign-in is unavailable."
            : ""
        }
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
