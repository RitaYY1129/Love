# HTTPS 后端部署

仓库中的 `docker-compose.prod.yml` 会启动 MySQL、Node.js 后端和 Caddy。Caddy 会为已解析到服务器的域名自动申请并续期 HTTPS 证书。

## 部署前准备

- 一台可以运行 Docker Compose 的服务器
- 一个已解析到服务器公网 IP 的域名，例如 `api.example.com`
- 微信开放平台移动应用的 AppID、AppSecret
- 腾讯云短信应用、短信签名和验证码模板

复制 `.env.production.example` 为 `.env.production`，填写全部生产参数。任何 Secret、数据库密码和 `.env.production` 都不能提交到 Git。

## 启动

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

健康检查：

```text
https://你的API域名/api/health
```

首次启动会创建数据库表并运行移动登录迁移。MySQL 不暴露公网端口，外部请求只通过 Caddy 的 443 端口进入后端。

## 短信模板

当前腾讯云短信模板需要按顺序包含两个变量：

```text
您的验证码为{1}，{2}分钟内有效。
```

生产环境固定使用腾讯云短信；未配置完整参数时接口会明确报错，不会回退为前端假验证码。

## Android 对接

前端 `.env.android.local` 的 `VITE_API_BASE` 应设为：

```dotenv
VITE_API_BASE=https://你的API域名/api
```

Capacitor WebView 的来源是 `https://localhost`，因此生产环境 `CORS_ORIGINS` 至少需要包含 `https://localhost`。
