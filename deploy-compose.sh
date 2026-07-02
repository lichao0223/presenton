#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.deploy.yml}"
COMPOSE_FILE_URL="${COMPOSE_FILE_URL:-https://raw.githubusercontent.com/lichao0223/presenton/main/docker-compose.deploy.yml}"
PROJECT_NAME="${PROJECT_NAME:-presenton}"
ENV_FILE="${ENV_FILE:-.env}"
ACTION="${1:-start}"

compose() {
  docker compose --env-file "$ENV_FILE" -p "$PROJECT_NAME" -f "$COMPOSE_FILE" "$@"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "缺少命令：$1"
    echo "请先安装 Docker Engine 和 Docker Compose Plugin。"
    exit 1
  fi
}

download_file() {
  local url="$1"
  local output="$2"

  if command -v curl >/dev/null 2>&1; then
    curl -fsSL -o "$output" "$url"
    return
  fi

  if command -v wget >/dev/null 2>&1; then
    wget -qO "$output" "$url"
    return
  fi

  echo "缺少下载工具：curl 或 wget"
  echo "请安装其中一个，或手动下载 $COMPOSE_FILE。"
  exit 1
}

ensure_compose_file() {
  if [ -f "$COMPOSE_FILE" ]; then
    return
  fi

  echo "未找到 $COMPOSE_FILE，正在从 GitHub 下载..."
  if ! download_file "$COMPOSE_FILE_URL" "$COMPOSE_FILE"; then
    rm -f "$COMPOSE_FILE"
    echo "下载 $COMPOSE_FILE 失败：$COMPOSE_FILE_URL"
    exit 1
  fi
  echo "已下载 $COMPOSE_FILE"
}

refresh_compose_file() {
  local tmp_file="${COMPOSE_FILE}.tmp"

  echo "正在从 GitHub 更新 $COMPOSE_FILE..."
  if download_file "$COMPOSE_FILE_URL" "$tmp_file"; then
    mv "$tmp_file" "$COMPOSE_FILE"
    echo "已更新 $COMPOSE_FILE"
    return
  fi

  rm -f "$tmp_file"
  echo "更新 $COMPOSE_FILE 失败，继续使用本地文件。"
}

ensure_env_file() {
  if [ -f "$ENV_FILE" ]; then
    return
  fi

  cat > "$ENV_FILE" <<'EOF'
# Presenton Docker Compose 部署配置
PRESENTON_IMAGE=ghcr.io/lichao0223/presenton:latest
PRESENTON_HTTP_HOST_PORT=5001

# 首次启动时自动迁移数据库
MIGRATE_DATABASE_ON_STARTUP=true

# 日志级别：INFO 可看到接口访问、生成进度；WARNING 只看告警和错误
FASTAPI_LOG_LEVEL=INFO
LOG_LEVEL=INFO

# 是否允许在网页设置里修改模型 Key
CAN_CHANGE_KEYS=true

# 可选：预置 Web 登录账号。留空时进入页面后按向导配置。
# AUTH_USERNAME=admin
# AUTH_PASSWORD=change-me-please

# 可选：文本大模型配置示例
# LLM=custom
# CUSTOM_LLM_URL=https://your-openai-compatible-endpoint/v1
# CUSTOM_LLM_API_KEY=your-api-key
# CUSTOM_MODEL=your-model

# 可选：关闭生图，或配置图片服务
# DISABLE_IMAGE_GENERATION=true
# IMAGE_PROVIDER=openai_compatible
# OPENAI_COMPAT_IMAGE_BASE_URL=https://your-image-endpoint/v1
# OPENAI_COMPAT_IMAGE_API_KEY=your-image-api-key
# OPENAI_COMPAT_IMAGE_MODEL=your-image-model
EOF

  echo "已生成 $ENV_FILE，请按需修改模型、账号和端口配置。"
}

show_urls() {
  local port
  port="$(grep -E '^PRESENTON_HTTP_HOST_PORT=' "$ENV_FILE" | tail -n 1 | cut -d '=' -f 2- || true)"
  port="${port:-5001}"
  echo
  echo "Presenton 已启动："
  echo "  http://localhost:${port}"
  echo
  echo "常用命令："
  echo "  ./deploy-compose.sh logs      查看日志"
  echo "  ./deploy-compose.sh update    拉取最新镜像并重启"
  echo "  ./deploy-compose.sh stop      停止服务"
}

require_command docker
ensure_compose_file
ensure_env_file
mkdir -p app_data

case "$ACTION" in
  start|up)
    compose pull presenton || true
    compose up -d presenton
    show_urls
    ;;
  update)
    refresh_compose_file
    compose pull presenton
    compose up -d presenton
    show_urls
    ;;
  restart)
    compose restart presenton
    show_urls
    ;;
  stop|down)
    compose down
    ;;
  logs)
    compose logs -f --tail=200 presenton
    ;;
  status|ps)
    compose ps
    ;;
  config)
    compose config
    ;;
  *)
    echo "用法：./deploy-compose.sh [start|update|restart|stop|logs|status|config]"
    exit 1
    ;;
esac
