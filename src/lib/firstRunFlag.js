export const FIRST_RUN_KEY = "auralab_first_run_v1";
const FALLBACK_FLAG = "__AURALAB_FIRST_RUN_DONE__";

function setFallbackFlag() {
  if (typeof window === "undefined") return;
  window[FALLBACK_FLAG] = true;
}

export function isFirstRunComplete() {
  if (typeof window === "undefined") return false;

  if (window[FALLBACK_FLAG] === true) return true;

  try {
    if (localStorage.getItem(FIRST_RUN_KEY) === "1") {
      setFallbackFlag();
      return true;
    }
  } catch {
    // localStorage unavailable
  }

  try {
    if (sessionStorage.getItem(FIRST_RUN_KEY) === "1") {
      setFallbackFlag();
      return true;
    }
  } catch {
    // sessionStorage unavailable
  }

  return false;
}

export function markFirstRunComplete() {
  if (typeof window === "undefined") return;

  setFallbackFlag();

  try {
    localStorage.setItem(FIRST_RUN_KEY, "1");
  } catch {
    // ignore write failure
  }

  try {
    sessionStorage.setItem(FIRST_RUN_KEY, "1");
  } catch {
    // ignore write failure
  }
}
