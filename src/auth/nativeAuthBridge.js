// src/auth/nativeAuthBridge.js
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";

function parseReturnUrl(urlString) {
  // Handles:
  // - PKCE:   myapp://auth/callback?code=...
  // - Implicit / token: myapp://auth/callback#access_token=...&refresh_token=...
  // - Some providers return tokens in query params.
  const url = new URL(urlString);

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error") || url.searchParams.get("error_code");
  const error_description =
    url.searchParams.get("error_description") || url.searchParams.get("error_message");

  let access_token = url.searchParams.get("access_token");
  let refresh_token = url.searchParams.get("refresh_token");

  if ((!access_token || !refresh_token) && url.hash) {
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
    access_token = access_token || hashParams.get("access_token");
    refresh_token = refresh_token || hashParams.get("refresh_token");
  }

  return { code, access_token, refresh_token, error, error_description };
}

async function finalizeSupabaseSessionFromUrl(supabase, url) {
  const { code, access_token, refresh_token, error, error_description } =
    parseReturnUrl(url);

  if (error) {
    throw new Error(error_description || error);
  }

  // Prefer PKCE exchange if present
  if (code) {
    const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
    if (exErr) throw exErr;
    return;
  }

  // Otherwise set tokens directly if present
  if (access_token && refresh_token) {
    const { error: setErr } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (setErr) throw setErr;
    return;
  }

  // Nothing usable
  throw new Error("No auth code or tokens found in callback URL.");
}

export function setupNativeAuthBridge({ supabase, onAuthed }) {
  // onAuthed: optional callback you can use to route user into the app UI.
  let didHandleOnce = false;

  const handleUrl = async (url) => {
    if (!url) return;

    // Prevent double-handling (some Android devices can fire multiple times)
    if (didHandleOnce) return;
    didHandleOnce = true;

    try {
      await finalizeSupabaseSessionFromUrl(supabase, url);
      try {
        await Browser.close();
      } catch {}
      if (typeof onAuthed === "function") onAuthed();
    } catch (e) {
      // Allow retry if something failed
      didHandleOnce = false;
      try {
        await Browser.close();
      } catch {}
      console.error("[NativeAuthBridge] Callback handling failed:", e);
    }
  };

  // 1) When app is opened via deep link
  App.addListener("appUrlOpen", ({ url }) => {
    handleUrl(url);
  });

  // 2) If the app was cold-started by the deep link
  App.getLaunchUrl().then(({ url }) => {
    if (url) handleUrl(url);
  });
}
