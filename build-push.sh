#!/usr/bin/env bash
# ==============================================================
# 前端镜像构建并推送（腾讯云 CCR 等私有镜像仓库通用）
# 用法：在本目录（dawnexo-ai-drawio-front/）执行  ./build-push.sh
#       （绝对路径定位，在任意工作目录执行均可）
#
# 依赖：.env（本目录或上级 my-ai-drawio 目录）中的
#         FRONTEND_IMAGE           镜像全名
#
# 说明：前端只请求同源相对路径 /api/v1/*，不写死任何后端地址；
#       /api/ 到后端的转发由服务器上的 nginx 负责
#
# 登录：.env 同时配置 REGISTRY + REGISTRY_USERNAME + REGISTRY_PASSWORD 时静默登录；
#       否则先直接推送，认证被拒时自动进入交互式 docker login（手动输入密码）后重试
# ==============================================================
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ---- 定位 .env（优先本目录，其次上级 my-ai-drawio 目录） ----
if [ -f "$SCRIPT_DIR/.env" ]; then
  ENV_FILE="$SCRIPT_DIR/.env"
elif [ -f "$SCRIPT_DIR/../.env" ]; then
  ENV_FILE="$SCRIPT_DIR/../.env"
else
  echo "错误：未找到 .env（应位于本目录或上级 my-ai-drawio 目录）"; exit 1
fi
get_env() { grep -E "^$1=" "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '\r'; }

FRONTEND_IMAGE=$(get_env FRONTEND_IMAGE)
REGISTRY=$(get_env REGISTRY)
REGISTRY_USERNAME=$(get_env REGISTRY_USERNAME)
REGISTRY_PASSWORD=$(get_env REGISTRY_PASSWORD)

[ -z "$FRONTEND_IMAGE" ] && { echo "错误：.env 缺少 FRONTEND_IMAGE"; exit 1; }

# ---- 登录镜像仓库：有凭证静默登录，无凭证交互式输入 ----
do_login() {
  [ -n "$REGISTRY" ] || return 1
  if [ -n "$REGISTRY_USERNAME" ] && [ -n "$REGISTRY_PASSWORD" ]; then
    echo "==> 使用 .env 凭证登录 $REGISTRY"
    echo "$REGISTRY_PASSWORD" | docker login "$REGISTRY" --username "$REGISTRY_USERNAME" --password-stdin
  elif [ -n "$REGISTRY_USERNAME" ]; then
    echo "==> 登录 $REGISTRY（用户名 $REGISTRY_USERNAME，请按提示输入密码）"
    docker login "$REGISTRY" --username "$REGISTRY_USERNAME"
  else
    echo "==> 登录 $REGISTRY（请按提示输入用户名与密码）"
    docker login "$REGISTRY"
  fi
}

# ---- 推送：认证被拒时登录后重试 ----
push_image() {
  echo "==> 推送 $1"
  if docker push "$1"; then
    return 0
  fi
  echo "==> 推送被拒，需要登录后重试"
  do_login
  docker push "$1"
}

echo "==> 构建前端镜像: $FRONTEND_IMAGE"
docker build -t "$FRONTEND_IMAGE" "$SCRIPT_DIR"

push_image "$FRONTEND_IMAGE"

echo ""
echo "完成。服务器上执行："
[ -n "$REGISTRY" ] && echo "  docker login $REGISTRY   # 首次需要，按提示输入密码"
echo "  docker compose pull && docker compose up -d"
