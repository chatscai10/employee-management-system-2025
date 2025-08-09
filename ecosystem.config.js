module.exports = {
  apps: [{
    name: 'employee-management-system',
    script: './server/server.js',
    instances: 1, // 開發環境使用單實例
    exec_mode: 'fork', // 開發環境使用 fork 模式
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '500M',
    node_args: '--max_old_space_size=512',
    watch: false,
    ignore_watch: [
      'node_modules',
      'logs',
      'public/uploads',
      'tests'
    ],
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,
    listen_timeout: 8000,
    restart_delay: 4000
  }]
};