# syntax=docker/dockerfile:1

# ---- Stage 1: cài dependencies (chỉ production, giữ image runtime nhỏ gọn) ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Stage 2: runtime image ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .

# Chạy bằng user "node" có sẵn trong base image (non-root) thay vì root.
USER node

EXPOSE 5000

# Healthcheck gọi endpoint /health (thêm ở PR-12) — Docker/orchestrator dựa vào đây để biết
# container có sẵn sàng nhận traffic hay không (readyState MongoDB === connected).
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get({host:'127.0.0.1',port:process.env.PORT||5000,path:'/health',timeout:4000}, r => process.exit(r.statusCode===200?0:1)).on('error', () => process.exit(1))"

CMD ["node", "main.js"]
