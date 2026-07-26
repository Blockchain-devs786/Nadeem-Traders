// PM2 Ecosystem Config — Nadeem Traders
// Run: pm2 start ecosystem.config.cjs
// Logs: pm2 logs nadeem-traders --lines 50

const path = require("path");

// Dynamically resolve to wherever this file lives — works on any machine
const PROJECT_ROOT = __dirname;

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
