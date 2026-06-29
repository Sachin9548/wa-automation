// PM2 config — keeps backend running permanently on your machine
// Install: npm install -g pm2
// Start:   pm2 start ecosystem.config.js
// Save:    pm2 save && pm2 startup

module.exports = {
  apps: [
    {
      name: "wa-saas-backend",
      script: "dist/server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
  ],
};
