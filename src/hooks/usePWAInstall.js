// src/hooks/usePWAInstall.js
import { useCallback, useEffect, useMemo, useState } from "react";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function detectIOS() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent || "";
  const iPadOS = /Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(ua) || iPadOS;
}

function detectStandalone() {
  if (typeof window === "undefined") return false;
  const mql = window.matchMedia?.("(display-mode: standalone)");
  const iosStandalone = window.navigator.standalone === true;
  return Boolean(mql?.matches || iosStandalone);
}

// -----------------------------------------------------------------------------
// Global singleton store (prevents missing beforeinstallprompt + keeps in sync)
// -----------------------------------------------------------------------------
const STORE_KEY = "__AURALAB_PWA_STORE__";
const BIP_KEY = "__AURALAB_BIP_EVENT__";

function getStore() {
  if (typeof window === "undefined") {
    return {
      isInstalled: false,
      isInstallable: false,
      promptEvent: null,
      listeners: new Set(),
      initialized: false,
    };
  }

  if (!window[STORE_KEY]) {
    window[STORE_KEY] = {
      isInstalled: detectStandalone(),
      isInstallable: false,
      promptEvent: window[BIP_KEY] || window.deferredPrompt || null,
      listeners: new Set(),
      initialized: false,
    };

    // If we already have a cached prompt event from some earlier code path
    if (window[STORE_KEY].promptEvent) window[STORE_KEY].isInstallable = true;
  }

  return window[STORE_KEY];
}

function emit() {
  const store = getStore();
  store.listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore subscriber errors
    }
  });
}

function setStore(partial) {
  const store = getStore();
  Object.assign(store, partial);
  emit();
}

function clearPromptEvent() {
  if (typeof window === "undefined") return;
  window[BIP_KEY] = null;
  window.deferredPrompt = null;
  const store = getStore();
  store.promptEvent = null;
}

function ensureGlobalListeners() {
  if (typeof window === "undefined") return;
  const store = getStore();
  if (store.initialized) return;
  store.initialized = true;

  const onBeforeInstallPrompt = (e) => {
    // REQUIRED: stop Chrome from auto-showing mini-infobar and allow deferred prompt
    e.preventDefault();

    // Cache globally so any page/component can trigger it later
    window[BIP_KEY] = e;
    window.deferredPrompt = e;

    setStore({
      promptEvent: e,
      isInstallable: true,
      // If this event fired, browser considers it not installed (or at least installable)
      isInstalled: false,
    });
  };

  const onAppInstalled = () => {
    clearPromptEvent();
    setStore({
      isInstallable: false,
      isInstalled: true,
      promptEvent: null,
    });
  };

  const onVisibility = () => {
    // Keep installed status accurate when user returns to tab / changes modes
    setStore({
      isInstalled: detectStandalone(),
      isInstallable: Boolean(getStore().promptEvent),
    });
  };

  window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  window.addEventListener("appinstalled", onAppInstalled);
  document.addEventListener("visibilitychange", onVisibility);

  // Track display-mode changes (best-effort)
  const mql = window.matchMedia?.("(display-mode: standalone)");
  const onMqlChange = () => {
    setStore({ isInstalled: detectStandalone() });
  };
  if (mql?.addEventListener) mql.addEventListener("change", onMqlChange);
  else if (mql?.addListener) mql.addListener(onMqlChange);
}

// Initialize listeners immediately (so you don’t miss the event)
ensureGlobalListeners();

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------
export default function usePWAInstall() {
  const isIOS = useMemo(() => detectIOS(), []);

  const [snapshot, setSnapshot] = useState(() => {
    const store = getStore();
    return {
      isInstalled: store.isInstalled,
      isInstallable: store.isInstallable,
      promptEvent: store.promptEvent,
    };
  });

  useEffect(() => {
    const store = getStore();
    const onUpdate = () => {
      const s = getStore();
      setSnapshot({
        isInstalled: s.isInstalled,
        isInstallable: s.isInstallable,
        promptEvent: s.promptEvent,
      });
    };

    store.listeners.add(onUpdate);
    // sync once on mount
    onUpdate();

    return () => {
      store.listeners.delete(onUpdate);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const store = getStore();
    const prompt = store.promptEvent || window[BIP_KEY] || window.deferredPrompt || null;

    if (!prompt) return { outcome: "unavailable" };

    // Must be called directly from a user gesture
    prompt.prompt();

    const choiceResult = await prompt.userChoice;

    clearPromptEvent();
    setStore({ promptEvent: null, isInstallable: false });

    // appinstalled event is the real source of truth, but we can optimistically update
    if (choiceResult?.outcome === "accepted") {
      setStore({ isInstalled: true });
    }

    return choiceResult;
  }, []);

  return {
    isInstalled: snapshot.isInstalled,
    isInstallable: snapshot.isInstallable,
    isIOS,
    promptInstall,
  };
}
