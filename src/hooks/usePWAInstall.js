// src/hooks/usePWAInstall.js
import { useCallback, useEffect, useMemo, useState } from "react";

const INSTALLED_KEY = "auralab_pwa_installed";

function readInstalledFlag() {
  try {
    return localStorage.getItem(INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeInstalledFlag() {
  try {
    localStorage.setItem(INSTALLED_KEY, "1");
  } catch {}
}

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

function getPromptEvent() {
  if (typeof window === "undefined") return null;
  return window.__AURALAB_BIP_EVENT__ || window.deferredPrompt || null;
}

function clearPromptEvent() {
  if (typeof window === "undefined") return;
  window.__AURALAB_BIP_EVENT__ = null;
  window.deferredPrompt = null;
}

export default function usePWAInstall() {
  const [isInstalled, setIsInstalled] = useState(() => detectStandalone() || readInstalledFlag());
  const [isInstallable, setIsInstallable] = useState(() => Boolean(getPromptEvent()));
  const isIOS = useMemo(() => detectIOS(), []);

  useEffect(() => {
    const onVisibility = () => {
      setIsInstalled(detectStandalone() || readInstalledFlag());
      setIsInstallable(Boolean(getPromptEvent()));
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      // If main.jsx already captured it, this will just keep it consistent
      e.preventDefault();
      window.__AURALAB_BIP_EVENT__ = e;
      window.deferredPrompt = e;
      setIsInstallable(true);
    };

    const onAppInstalled = () => {
      clearPromptEvent();
      setIsInstallable(false);
      setIsInstalled(true);
      writeInstalledFlag();
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const prompt = getPromptEvent();
    if (!prompt) return { outcome: "unavailable" };

    // Must be called in direct response to the user click
    prompt.prompt();

    const choiceResult = await prompt.userChoice;

    clearPromptEvent();
    setIsInstallable(false);

    if (choiceResult?.outcome === "accepted") {
      setIsInstalled(true);
      writeInstalledFlag();
    }

    return choiceResult;
  }, []);

  return {
    isInstalled,
    isInstallable,
    isIOS,
    promptInstall,
  };
}
