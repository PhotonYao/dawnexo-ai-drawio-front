# ==============================================================
# AI-DrawIO 前端镜像（Next.js standalone 多阶段构建）
# 构建命令（在前端工程根目录执行，注意替换为你的服务器地址）：
#   docker build --build-arg NEXT_PUBLIC_API_BASE=http://服务器IP:8090 -t dawnexo-ai-drawio-front:1.0 .
# ==============================================================

# 基础镜像源：默认走毫秒云（docker.1ms.run）加速国内拉取；
# 需直连 Docker Hub 时构建加 --build-arg NODE_IMAGE=node:22-alpine
ARG NODE_IMAGE=docker.1ms.run/library/node:22-alpine

# ---------- 阶段一：安装依赖 ----------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- 阶段二：构建 ----------
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 前端只请求同源相对路径 /api/v1/*，不写死任何后端地址；
# /api/ 到后端的转发由服务器上的 nginx 负责（location ^~ /api/）
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------- 阶段三：运行镜像 ----------
FROM ${NODE_IMAGE} AS runner
WORKDIR /app

ARG APP_VERSION=1.0
LABEL org.opencontainers.image.title="dawnexo-ai-drawio-front" \
      org.opencontainers.image.description="AI DrawIO 智能绘图平台前端（Next.js 16 / React 19）" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.authors="kangyaocoding"

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    TZ=Asia/Shanghai \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN apk add --no-cache tzdata

# standalone 产物：server.js + 精简 node_modules；静态资源单独拷贝
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

USER node

EXPOSE 3000

CMD ["node", "server.js"]
