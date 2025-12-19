// src/components/ScrollToTop.jsx
// -----------------------------------------------------------------------------
// AuraLab — Scroll restoration helper
// Ensures each route navigation starts at the top of the page.
// -----------------------------------------------------------------------------

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}
