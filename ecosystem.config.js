/**
 * 🚀 PM2 進程管理配置 - Employee Management System
 * 多環境企業級進程管理配置
 */

module.exports = {
  apps: [
    // 生產環境配置
    {
      name: 'employee-management-prod',
      script: './server/server.js',
      instances: 'max', // 使用所有 CPU 核心
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_file: './.env.production',
      
      // 自動重啟配置
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      // 日誌配置
      log_file: './logs/pm2-combined.log',
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // 進程管理
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // 監控配置
      monitoring: true,
      pmx: true,
      
      // 健康檢查
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // 進階配置
      node_args: '--max_old_space_size=2048'
    },

    // 測試環境配置
    {
      name: 'employee-management-staging',
      script: './server/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'staging',
        PORT: 4000
      },
      env_file: './.env.staging',
      
      autorestart: true,
      watch: ['server/', 'routes/', 'middleware/'],
      ignore_watch: ['node_modules', 'logs', 'uploads', 'database'],
      max_memory_restart: '512M',
      
      log_file: './logs/pm2-staging-combined.log',
      out_file: './logs/pm2-staging-out.log',
      error_file: './logs/pm2-staging-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      node_args: '--max_old_space_size=1024'
    },

    // 開發環境配置
    {
      name: 'employee-management-dev',
      script: './server/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_file: './.env.development',
      
      autorestart: true,
      watch: true,
      ignore_watch: [
        'node_modules',
        'logs',
        'public/uploads',
        'database',
        'tests',
        '*.log'
      ],
      max_memory_restart: '256M',
      
      log_file: './logs/pm2-dev-combined.log',
      out_file: './logs/pm2-dev-out.log',
      error_file: './logs/pm2-dev-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // 開發環境特殊配置
      node_args: '--inspect=9229 --max_old_space_size=512',
      source_map_support: true,
      
      min_uptime: '5s',
      max_restarts: 3,
      restart_delay: 2000
    }
  ],

  // 部署配置
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-production-server1.com', 'your-production-server2.com'],
      ref: 'origin/main',
      repo: 'git@github.com:yourcompany/employee-management.git',
      path: '/var/www/employee-management',
      'pre-deploy-local': 'npm run test',
      'post-deploy': 'npm ci --only=production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /var/www/employee-management',
      'post-setup': 'pm2 install pm2-logrotate',
      env: {
        NODE_ENV: 'production'
      }
    },

    staging: {
      user: 'deploy',
      host: 'your-staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:yourcompany/employee-management.git',
      path: '/var/www/employee-management-staging',
      'pre-deploy-local': 'npm run test:staging',
      'post-deploy': 'npm ci && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': 'mkdir -p /var/www/employee-management-staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};