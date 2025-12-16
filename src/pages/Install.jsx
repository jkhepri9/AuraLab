// src/pages/Install.jsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  Smartphone,
  Monitor,
  Apple,
  Command,
  Share,
  PlusSquare,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import usePWAInstall from "../hooks/usePWAInstall";

export default function Install() {
  const [selectedOS, setSelectedOS] = useState(null);

  const { isInstalled, isInstallable, isIOS, promptInstall } = usePWAInstall();

  useEffect(() => {
    // If they install while on this page, UI updates automatically via hook
  }, [isInstalled]);

  const PlatformCard = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setSelectedOS(id)}
      className={`
        flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 w-full aspect-square
        ${
          selectedOS === id
            ? "bg-emerald-500/20 border-emerald-500/50 text-white shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20"
        }
      `}
    >
      <Icon className={`w-10 h-10 mb-3 ${selectedOS === id ? "text-emerald-400" : ""}`} />
      <span className="font-medium">{label}</span>
    </button>
  );

  const OneClickBlock = ({ platformLabel }) => {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          {isInstalled ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          ) : (
            <Download className="w-8 h-8 text-emerald-500" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-white">
          {isInstalled ? "Installed" : `Install for ${platformLabel}`}
        </h2>

        <p className="text-gray-400 max-w-md mx-auto">
          {isInstalled
            ? "AuraLab is installed on this device."
            : isInstallable
            ? "One-click install is available. Click Install Now."
            : "One-click install is not available yet. Use the browser install option below."}
        </p>

        {!isInstalled && (
          <>
            <Button
              onClick={async () => {
                if (isInstallable) {
                  await promptInstall();
                }
              }}
              disabled={!isInstallable}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold text-lg px-8 py-6 rounded-full shadow-lg shadow-emerald-500/20"
            >
              Install Now
            </Button>

            {!isInstallable && (
              <div className="mt-4 text-left max-w-xl mx-auto bg-black/20 border border-white/5 rounded-xl p-4">
                <div className="text-white font-bold mb-2">Manual install (Chrome/Edge)</div>
                <ul className="text-gray-400 text-sm space-y-1 list-disc pl-5">
                  <li>On Android: Chrome menu (⋮) → <b>Install app</b> or <b>Add to Home screen</b>.</li>
                  <li>On Windows: look for the <b>Install</b> icon in the address bar (omnibox).</li>
                  <li>Install prompts only appear when the site is “installable” (manifest + service worker + HTTPS).</li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8 min-h-[60vh]">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
          Install AuraLab
        </h1>
        <p className="text-gray-400 text-lg">Choose your device for the best installation experience.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PlatformCard id="windows" icon={Monitor} label="Windows" />
        <PlatformCard id="mac" icon={Command} label="Mac" />
        <PlatformCard id="android" icon={Smartphone} label="Android" />
        <PlatformCard id="ios" icon={Apple} label="iOS" />
      </div>

      <AnimatePresence mode="wait">
        {selectedOS && (
          <motion.div
            key={selectedOS}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm"
          >
            {selectedOS === "windows" && <OneClickBlock platformLabel="Windows" />}
            {selectedOS === "android" && <OneClickBlock platformLabel="Android" />}

            {(selectedOS === "mac" || selectedOS === "ios") && (
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
                  Install on {selectedOS === "mac" ? "Mac" : "iOS"}
                </h2>

                <div className="space-y-6">
                  <InstructionStep
                    number="1"
                    title="Open Share/Menu"
                    desc="Locate the Share button or the browser menu."
                    icon={<Share className="w-5 h-5" />}
                  />
                  <InstructionStep
                    number="2"
                    title="Select 'Add to Home Screen'"
                    desc="Find the option to add the app to your home screen/dock."
                    icon={<PlusSquare className="w-5 h-5" />}
                  />
                  <InstructionStep
                    number="3"
                    title="Confirm"
                    desc="Confirm Add/Install. AuraLab will appear as an app icon."
                    icon={<CheckCircle2 className="w-5 h-5" />}
                  />
                </div>

                <div className="mt-8 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">
                  <p className="text-emerald-400 text-sm">
                    <strong>Note:</strong> iOS does not support the same one-click prompt as Android/Windows.
                  </p>
                </div>
              </div>
            )}

            {isIOS && selectedOS !== "ios" && (
              <div className="mt-6 text-center text-xs text-gray-500">
                Detected iOS device: use “Add to Home Screen.”
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InstructionStep({ number, title, desc, icon }) {
  return (
    <div className="flex gap-4 items-start p-4 rounded-xl bg-black/20 border border-white/5">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 text-black font-bold flex items-center justify-center">
        {number}
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-white flex items-center gap-2">
          {title}
          {icon && <span className="text-gray-500">{icon}</span>}
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
