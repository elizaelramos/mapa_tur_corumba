module.exports = {
  apps: [
    {
      name: 'mapatur-api',
      script: './apps/api/src/index.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        API_PORT: 8008,
      },
      error_file: './apps/api/logs/pm2-error.log',
      out_file: './apps/api/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Configurações de restart automático
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      // Configurações de monitoramento de saúde
      kill_timeout: 5000,
      listen_timeout: 3000,

      // Estratégias de restart
      exp_backoff_restart_delay: 100,

      // Reiniciar se o uso de memória ultrapassar 500MB
      max_memory_restart: '500M',

      // Configuração de watch (desativado para produção)
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads', '.git'],

      // Monitoramento de CPU e memória
      instance_var: 'INSTANCE_ID',
    },
    {
      name: 'mapatur-web',
      script: 'bash',
      args: 'start-vite.sh',
      cwd: './apps/web',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 8009,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Configurações de restart automático
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      // Configurações de monitoramento de saúde
      kill_timeout: 5000,
      listen_timeout: 3000,

      // Estratégias de restart
      exp_backoff_restart_delay: 100,

      // Reiniciar se o uso de memória ultrapassar 1GB (Vite pode usar mais memória)
      max_memory_restart: '1G',

      // Configuração de watch (desativado)
      watch: false,
      ignore_watch: ['node_modules', 'dist', '.git'],

      // Monitoramento de CPU e memória
      instance_var: 'INSTANCE_ID',
    },
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:repo.git',
      path: '/var/www/mapatur',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
    },
  },
};
