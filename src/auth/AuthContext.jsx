import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import SignInModal from "../components/auth/SignInModal";

const AuthContext = createContext(null);

const LS_KEY = "auralab_auth_session_v1";

function readSession() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(session) {
  try {
    if (!session) localStorage.removeItem(LS_KEY);
    else localStorage.setItem(LS_KEY, JSON.stringify(session));
  } catch {
    // ignore (private mode / blocked storage)
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());
  const [open, setOpen] = useState(false);

  // store the last attempted action (e.g., playPreset(...))
  const pendingActionRef = useRef(null);

  const isAuthed = !!session?.token;

  /**
   * If authed: run action immediately and return true.
   * If not authed: open sign-in modal, store action to run after sign-in, return false.
   */
  const requireAuth = useCallback(
    (action) => {
      if (isAuthed) {
        if (typeof action === "function") action();
        return true;
      }
      pendingActionRef.current = typeof action === "function" ? action : null;
      setOpen(true);
      return false;
    },
    [isAuthed]
  );

  // Minimal local sign-in (swap later with real auth without changing player gating)
  const signIn = useCallback(({ email, name } = {}) => {
    const cleanEmail = (email || "").trim();
    const cleanName = (name || "").trim();

    const token =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `token_${Date.now()}`;

    const newSession = {
      token,
      user: {
        email: cleanEmail || "user@local",
        name: cleanName || "",
      },
      signedInAt: Date.now(),
    };

    setSession(newSession);
    writeSession(newSession);

    setOpen(false);

    const fn = pendingActionRef.current;
    pendingActionRef.current = null;
    if (typeof fn === "function") fn();
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    writeSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      isAuthed,
      requireAuth,
      signIn,
      signOut,
      openSignIn: () => setOpen(true),
      closeSignIn: () => setOpen(false),
    }),
    [session, isAuthed, requireAuth, signIn, signOut]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SignInModal open={open} onClose={() => setOpen(false)} onSignIn={signIn} />
    </AuthContext.Provider>
  );
}

export { AuthProvider, useAuth } from "./AuthProvider";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

