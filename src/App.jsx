//App.jsx

import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Layout from "./Layout";
import ScrollToTop from "./components/ScrollToTop";

import Home from "./pages/Home";
import Install from "./pages/Install";
import AuraGenerator from "./pages/AuraGenerator";
import AuraConverter from "./pages/AuraConverter";
import AuraModes from "./pages/AuraModes";
import AuraEditor from "./pages/AuraEditor";
import NowPlaying from "./pages/NowPlaying";
import Account from "./pages/Account";
import Start from "./pages/Start";

import {
  GlobalPlayerProvider,
  useGlobalPlayer,
} from "./audio/GlobalPlayerContext";
import { isFirstRunComplete } from "@/lib/firstRunFlag";

function FirstRunGate() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const allow = new Set(["/Start", "/Install", "/account", "/Account"]);
    if (allow.has(location.pathname)) return;

    if (!isFirstRunComplete()) {
      navigate("/Start", { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
}

function AppInner() {
  const {
    currentPlayingPreset,
    isPlaying,
    togglePlayPause,
    isStickyPlayerHidden,
    hideStickyPlayerOnce,
  } = useGlobalPlayer();

  const rawBase = import.meta.env.BASE_URL || "/";
  const basename = rawBase === "/./" ? "/" : rawBase.replace(/\/$/, "") || "/";

  return (
    <Router>
      <FirstRunGate />
      <ScrollToTop />
      <Layout
        currentPlayingPreset={currentPlayingPreset}
        isPlaying={isPlaying}
        hideStickyPlayer={isStickyPlayerHidden}
        onTogglePlayPause={togglePlayPause}
        onCloseStickyPlayer={hideStickyPlayerOnce}
      >
        <Routes>
          <Route path="/Start" element={<Start />} />
          <Route path="/" element={<Home />} />
          <Route path="/Install" element={<Install />} />
          <Route path="/AuraGenerator" element={<AuraGenerator />} />
          <Route path="/AuraConverter" element={<AuraConverter />} />
          <Route path="/AuraModes" element={<AuraModes />} />
          <Route path="/AuraEditor" element={<AuraEditor />} />
          <Route path="/NowPlaying" element={<NowPlaying />} />
          <Route path="/account" element={<Account />} />
          <Route path="/Account" element={<Account />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default function App() {
  return (
    <GlobalPlayerProvider>
      <AppInner />
    </GlobalPlayerProvider>
  );
}
