import { useCallback, useEffect, useMemo, useState } from 'react';

// Shared reference (persists across hook instances)
let deferredPromptEvent = null;

// Persisted flag so the CTA stays hidden for a user who already installed.
// Chrome may stop firing `beforeinstallprompt` after install; this keeps UI consistent.
const INSTALLED_KEY = 'auralab_pwa_installed';

function readInstalledFlag() {
  try {
    return localStorage.getItem(INSTALLED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeInstalledFlag() {
  try {
    localStorage.setItem(INSTALLED_KEY, '1');
  } catch {}
}

function detectIOS() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent || '';
  // iPadOS 13+ can report as Mac; touch points distinguish it.
  const iPadOS = /Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(ua) || iPadOS;
}

function detectStandalone() {
  if (typeof window === 'undefined') return false;
  const mql = window.matchMedia?.('(display-mode: standalone)');
  // iOS Safari exposes navigator.standalone
  const iosStandalone = window.navigator.standalone === true;
  return Boolean(mql?.matches || iosStandalone);
}

/**
 * PWA install hook
 * - Exposes an install CTA when available (Chrome/Edge) or when manual install is applicable (iOS)
 * - Hides CTA when already installed
 */
export default function usePWAInstall() {
  const [isInstalled, setIsInstalled] = useState(() => detectStandalone() || readInstalledFlag());
  const [isInstallable, setIsInstallable] = useState(() => Boolean(deferredPromptEvent));
  const isIOS = useMemo(() => detectIOS(), []);

  useEffect(() => {
    // Some platforms only update display-mode after a reload; keep it fresh.
    const onVisibility = () => setIsInstalled(detectStandalone() || readInstalledFlag());
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredPromptEvent = e;
      // Legacy compatibility (your Install page used this)
      window.deferredPrompt = e;
      setIsInstallable(true);
    };

    const onAppInstalled = () => {
      deferredPromptEvent = null;
      window.deferredPrompt = null;
      setIsInstallable(false);
      setIsInstalled(true);
      writeInstalledFlag();
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const prompt = deferredPromptEvent || window.deferredPrompt;
    if (!prompt) return { outcome: 'unavailable' };

    prompt.prompt();
    const choiceResult = await prompt.userChoice;

    deferredPromptEvent = null;
    window.deferredPrompt = null;
    setIsInstallable(false);

    if (choiceResult?.outcome === 'accepted') {
      setIsInstalled(true);
      writeInstalledFlag();
    }

    return choiceResult;
  }, []);

  const canShowInstall = useMemo(() => {
    return !isInstalled && (isInstallable || isIOS);
  }, [isInstalled, isInstallable, isIOS]);

  return {
    isInstalled,
    isInstallable,
    isIOS,
    canShowInstall,
    promptInstall,
  };
}
