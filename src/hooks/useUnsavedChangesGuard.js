import { useCallback, useEffect, useRef } from "react";

// BrowserRouter-safe guard (NO useBlocker)
export default function useUnsavedChangesGuard(isDirty) {
  const dirtyRef = useRef(!!isDirty);

  useEffect(() => {
    dirtyRef.current = !!isDirty;
  }, [isDirty]);

  // refresh/close/tab switch protection
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // use this on any "leave page" buttons/links you control
  return useCallback((msg = "You have unsaved changes. Leave without saving?") => {
    if (!dirtyRef.current) return true;
    return window.confirm(msg);
  }, []);
}
