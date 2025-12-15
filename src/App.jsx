import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./Layout";

import Home from "./pages/Home";
import Install from "./pages/Install";
import AuraGenerator from "./pages/AuraGenerator";
import AuraConverter from "./pages/AuraConverter";
import AuraModes from "./pages/AuraModes";
import AuraEditor from "./pages/AuraEditor";
import NowPlaying from "./pages/NowPlaying";
import Account from "./pages/Account";

import { GlobalPlayerProvider, useGlobalPlayer } from "./audio/GlobalPlayerContext";

function AppInner() {
  const { currentPlayingPreset, isPlaying, stop, togglePlayPause, restart } =
    useGlobalPlayer();

  return (
    <Router>
      <Layout
        currentPlayingPreset={currentPlayingPreset}
        isPlaying={isPlaying}
        onStop={stop}
        onTogglePlayPause={togglePlayPause}
        onBack={restart}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Install" element={<Install />} />
          <Route path="/AuraGenerator" element={<AuraGenerator />} />
          <Route path="/AuraConverter" element={<AuraConverter />} />
          <Route path="/AuraModes" element={<AuraModes />} />
          <Route path="/AuraEditor" element={<AuraEditor />} />
          <Route path="/NowPlaying" element={<NowPlaying />} />

          {/* ✅ Account (support both cases so you never get a blank main area) */}
          <Route path="/account" element={<Account />} />
          <Route path="/Account" element={<Account />} />

          {/* ✅ Fallback so unmatched routes never look “blank” */}
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
