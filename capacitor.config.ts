// capacitor.config.ts
/// <reference types="node" />

import type { CapacitorConfig } from "@capacitor/cli";

const capServerUrl = (process.env.CAP_SERVER_URL || "").trim();

const config: CapacitorConfig = {
  appId: "space.auralab",
  appName: "AuraLab",
  webDir: "dist",

  // Dev-only live reload (optional)
  ...(capServerUrl
    ? {
        server: {
          url: capServerUrl,
          cleartext: capServerUrl.startsWith("http://"),
        },
      }
    : {}),
};

export default config;
