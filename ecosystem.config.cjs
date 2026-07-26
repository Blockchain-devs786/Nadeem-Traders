// PM2 Ecosystem Config — Nadeem Traders
// Run: pm2 start ecosystem.config.cjs
// Logs: pm2 logs nadeem-traders --lines 50

const path = require("path");
const fs = require("fs");

// Dynamically resolve to wherever this file lives — works on any machine
const PROJECT_ROOT = __dirname;

// Read .env file into env object if present
const envVars = {};
const envFilePath = path.join(PROJECT_ROOT, ".env");
if (fs.existsSync(envFilePath)) {
  const content = fs.readFileSync(envFilePath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        envVars[key] = val;
      }
    }
  });
}

module.exports = {
  apps: [
    {
      name: "nadeem-traders",

      // Entry point: Nitro node-server build output
      script: path.join(PROJECT_ROOT, ".output", "server", "index.mjs"),

      // Working directory — always the project root, regardless of clone location
      cwd: PROJECT_ROOT,

      // Tell Nitro / h3 to listen on port 3002
      env: {
        NODE_ENV: "production",
        PORT: "3002",
        HOST: "127.0.0.1",
        ...envVars,
      },

      // Restart policy
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",

      // Log files — absolute paths so PM2 never gets confused
      out_file: path.join(PROJECT_ROOT, "logs", "pm2-out.log"),
      error_file: path.join(PROJECT_ROOT, "logs", "pm2-err.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Merge stdout + stderr into a single stream in pm2 logs
      merge_logs: true,

      // Give the process time to start before PM2 marks it as errored
      wait_ready: false,
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
};
