<p align="center">
  <img src="./readme_assets/images/logo.png" alt="Presenton" />
</p>

# Presenton 中文二开版

Presenton 是一个开源的 AI 演示文稿生成与编辑工具，可用于生成、编辑、预览、导出 PPTX/PDF，并支持接入 OpenAI、Gemini、Claude、DeepSeek、Ollama、LM Studio、OpenAI 兼容接口等模型服务。

这个仓库是 `lichao0223/presenton` 的二开版本，已加入中文界面、模型兼容性调整、自定义模板相关增强、Docker 镜像构建工作流，以及一键 Docker Compose 部署脚本。

## 功能概览

- AI 生成 PPT 大纲和每页内容
- 支持上传文档或输入提示词生成演示文稿
- 支持自定义主题和自定义模板
- 支持 PPTX/PDF 导出
- 支持多种文本模型和生图模型
- 支持 Docker 一体化部署
- 支持 GitHub Actions 自动构建镜像
- 数据默认持久化到 `app_data`

## 快速部署

推荐在 Linux x86_64/amd64 服务器上使用 Docker Compose 部署。

### 1. 安装 Docker

服务器需要先安装：

- Docker Engine
- Docker Compose Plugin，即 `docker compose`

检查命令：

```bash
docker --version
docker compose version
```

### 2. 克隆仓库

```bash
git clone https://github.com/lichao0223/presenton.git
cd presenton
```

如果使用 SSH：

```bash
git clone git@github.com:lichao0223/presenton.git
cd presenton
```

### 3. 一键启动

```bash
chmod +x ./deploy-compose.sh
./deploy-compose.sh
```

脚本第一次运行会自动生成 `.env`，创建 `app_data`，拉取镜像并启动服务。

默认访问地址：

```text
http://服务器IP:5001
```

本机访问：

```text
http://localhost:5001
```

## 一键部署脚本

根目录提供了：

```text
deploy-compose.sh
docker-compose.deploy.yml
```

常用命令：

```bash
# 启动
./deploy-compose.sh

# 查看状态
./deploy-compose.sh status

# 查看日志
./deploy-compose.sh logs

# 拉取最新镜像并重启
./deploy-compose.sh update

# 重启
./deploy-compose.sh restart

# 停止并移除容器
./deploy-compose.sh stop

# 查看最终 Compose 配置
./deploy-compose.sh config
```

## 配置文件 `.env`

首次运行 `deploy-compose.sh` 会自动生成 `.env`。你可以按需修改：

```bash
PRESENTON_IMAGE=ghcr.io/lichao0223/presenton:latest
PRESENTON_HTTP_HOST_PORT=5001
MIGRATE_DATABASE_ON_STARTUP=true
CAN_CHANGE_KEYS=true
```

修改端口示例：

```bash
PRESENTON_HTTP_HOST_PORT=8080
```

然后重启：

```bash
./deploy-compose.sh restart
```

## 登录账号

可以在 `.env` 里预置管理员账号：

```bash
AUTH_USERNAME=admin
AUTH_PASSWORD=change-me-please
```

如果已经初始化过账号，直接改 `.env` 不一定会覆盖已保存的账号。需要强制覆盖时临时加：

```bash
AUTH_OVERRIDE_FROM_ENV=true
```

启动一次后建议删除或改回空值。

如果要重置登录信息，可以临时设置：

```bash
RESET_AUTH=true
```

启动一次后也建议删除。

## 配置大模型

可以在网页设置里配置模型，也可以在 `.env` 中预置。

### OpenAI 兼容接口

适合自建网关、One API、LiteLLM、New API、vLLM 网关等：

```bash
LLM=custom
CUSTOM_LLM_URL=https://your-openai-compatible-endpoint/v1
CUSTOM_LLM_API_KEY=your-api-key
CUSTOM_MODEL=your-model
```

### OpenAI

```bash
LLM=openai
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4.1
```

### Google Gemini

```bash
LLM=google
GOOGLE_API_KEY=your-google-api-key
GOOGLE_MODEL=gemini-2.5-flash
```

### DeepSeek

```bash
LLM=deepseek
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_MODEL=deepseek-chat
```

### Ollama

如果 Ollama 在宿主机运行：

```bash
LLM=ollama
OLLAMA_URL=http://host.docker.internal:11434
OLLAMA_MODEL=llama3.2:3b
```

Linux 上如果容器访问不到 `host.docker.internal`，可以改成宿主机内网 IP。

## 配置生图

如果不想生成图片：

```bash
DISABLE_IMAGE_GENERATION=true
```

OpenAI 兼容生图接口：

```bash
IMAGE_PROVIDER=openai_compatible
OPENAI_COMPAT_IMAGE_BASE_URL=https://your-image-endpoint/v1
OPENAI_COMPAT_IMAGE_API_KEY=your-image-api-key
OPENAI_COMPAT_IMAGE_MODEL=your-image-model
```

OpenAI 官方生图：

```bash
IMAGE_PROVIDER=gpt-image-1.5
OPENAI_API_KEY=your-openai-api-key
GPT_IMAGE_1_5_QUALITY=medium
```

图库模式：

```bash
IMAGE_PROVIDER=pexels
PEXELS_API_KEY=your-pexels-api-key
```

或：

```bash
IMAGE_PROVIDER=pixabay
PIXABAY_API_KEY=your-pixabay-api-key
```

## 数据持久化

Docker 部署时数据挂载到：

```text
./app_data:/app_data
```

这里会保存：

- 数据库
- 上传文件
- 生成图片
- 导出文件
- 登录配置
- 记忆和缓存数据

备份时主要备份 `app_data` 即可。

## GitHub Actions 自动构建镜像

仓库内置工作流：

```text
.github/workflows/docker-release.yml
```

推送到 `main` 后会自动构建 Linux x86_64 镜像：

```text
ghcr.io/lichao0223/presenton:latest
```

查看构建状态：

```text
GitHub 仓库 -> Actions -> Docker Release
```

服务器更新到最新镜像：

```bash
git pull
./deploy-compose.sh update
```

如果 GHCR 镜像是私有的，需要先登录：

```bash
docker login ghcr.io
```

用户名填 GitHub 用户名，密码填 GitHub Personal Access Token。

## 本地构建 Docker 镜像

如果不想使用 GitHub Actions，也可以在本地构建：

```bash
docker buildx build \
  --platform linux/amd64 \
  -t presenton-custom:latest \
  --load .
```

然后修改 `.env`：

```bash
PRESENTON_IMAGE=presenton-custom:latest
```

启动：

```bash
./deploy-compose.sh
```

## 开发运行

前端和后端可以直接本地运行，适合二开调试。

后端 FastAPI：

```bash
cd servers/fastapi
uv sync
uv run uvicorn main:app --host 127.0.0.1 --port 8010 --reload
```

前端 Next.js：

```bash
cd servers/nextjs
npm install
npm run dev
```

访问：

```text
http://127.0.0.1:3000
```

## 常用运维

查看日志：

```bash
./deploy-compose.sh logs
```

进入容器：

```bash
docker exec -it presenton bash
```

停止服务：

```bash
./deploy-compose.sh stop
```

删除并重建：

```bash
./deploy-compose.sh stop
./deploy-compose.sh
```

清理本地未使用镜像：

```bash
docker image prune
```

## API 使用

部署后接口根地址与网页同源，例如：

```text
http://localhost:5001/api/v1/ppt
```

生成 PPT 的接口：

```text
POST /api/v1/ppt/presentation/generate
```

示例：

```bash
curl -X POST http://localhost:5001/api/v1/ppt/presentation/generate \
  -H "Content-Type: application/json" \
  -u "admin:change-me-please" \
  -d '{
    "content": "介绍 AI 编程工具的发展趋势",
    "n_slides": 8,
    "language": "zh-CN"
  }'
```

如果没有开启账号密码，或实例仍处在首次配置流程，请先在网页端完成初始化。

## 从上游同步代码

本仓库建议保留两个 remote：

```bash
git remote -v
```

期望类似：

```text
origin    git@github.com-lichao-openclaw:lichao0223/presenton.git
upstream  https://github.com/presenton/presenton.git
```

同步上游：

```bash
git fetch upstream
git merge upstream/main
```

有冲突时，优先保留本仓库二开内容，再按需适配上游更新。

## 许可证

本项目基于 Apache 2.0 许可证。详见 [LICENSE](./LICENSE)。
