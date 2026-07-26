// Force Nitro to build for Node.js server deployment (PM2 / Node.js) instead of Cloudflare
process.env.NITRO_PRESET = process.env.NITRO_PRESET || "node-server";

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
