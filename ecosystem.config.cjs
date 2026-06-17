/** PM2 — MatuPark (matupark.matubyte.com) */
module.exports = {
  apps: [
    {
      name: 'matupark-billing',
      cwd: __dirname,
      script: 'server/start-billing.mjs',
      interpreter: 'node',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env_file: '.env',
      env: {
        NODE_ENV: 'production',
        BILLING_API_PORT: '3010',
      },
    },
  ],
}
