/**
 * ecosystem.config.cjs
 * PM2 Production Process Manager Configuration.
 * Enables auto-restart, cluster mode, and zero-downtime reloads.
 */

module.exports = {
  apps: [
    {
      name: 'erms-backend-api',
      script: './backend/src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
