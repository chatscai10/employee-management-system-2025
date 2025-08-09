# 🐳 Employee Management System - Production Dockerfile
FROM node:18-alpine

# 設置工作目錄
WORKDIR /app

# 安裝系統依賴
RUN apk add --no-cache \
    sqlite \
    curl \
    tzdata \
    && rm -rf /var/cache/apk/*

# 設置時區
ENV TZ=Asia/Taipei

# 複製 package 文件
COPY package*.json ./

# 安裝依賴（只安裝生產依賴）
RUN npm ci --only=production && npm cache clean --force

# 創建非 root 用戶
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# 創建必要的目錄
RUN mkdir -p logs uploads database && \
    chown -R nodeuser:nodejs /app

# 複製應用程式碼
COPY --chown=nodeuser:nodejs . .

# 設置權限
RUN chmod +x scripts/*.sh 2>/dev/null || true

# 切換到非 root 用戶
USER nodeuser

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/api/health || exit 1

# 暴露端口
EXPOSE 3000

# 啟動應用
CMD ["npm", "start"]