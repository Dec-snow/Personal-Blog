# acg-api (Go backend)

hoarfrost.cloud 博客后端服务，基于 Go 标准库 net/http + SQLite。

## 运行

```bash
cd acg-api
go build -o acg-api .
./acg-api
```

默认监听 `127.0.0.1:8787`。

## 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `ACG_API_ADDR` | 监听地址 | `127.0.0.1:8787` |
| `ACG_DATA_DIR` | 数据目录（绝对路径） | `/opt/acg-api/data` |
| `ACG_ALLOWED_ORIGINS` | CORS 白名单 | `https://hoarfrost.cloud,https://www.hoarfrost.cloud` |
| `AUTH_OWNER_PASSWORD` | 站长登录密码 | - |
| `AUTH_OWNER_SECURITY_ANSWER` | 二次验证答案 | - |
| `AUTH_SESSION_DAYS` | 会话有效期（天） | `30` |
| `AUTH_COOKIE_SECURE` | Cookie Secure 标志 | `true` |
| `TENCENT_COS_SECRET_ID` | 腾讯云 COS 密钥 ID | - |
| `TENCENT_COS_SECRET_KEY` | 腾讯云 COS 密钥 | - |
| `TENCENT_COS_BUCKET` | COS 存储桶名 | `my-blog-static-1464122491` |
| `TENCENT_COS_REGION` | COS 区域 | `ap-guangzhou` |
| `TENCENT_COS_BASE_URL` | COS 访问域名 | `https://my-blog-static-1464122491.cos.ap-guangzhou.myqcloud.com` |

## API 端点

### 公开接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/health` | 健康检查 |
| GET | `/api/server/info` | 服务器状态监控 |
| GET | `/api/moments` | 获取随笔列表 |

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/logout` | 登出 |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 站长控制台（需登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/owner/status` | 站长状态 |
| GET/POST | `/api/owner/drafts` | 草稿管理 |
| POST | `/api/owner/publish` | 发布文章 |
| POST | `/api/owner/moments` | 发布随笔 |
| DELETE | `/api/owner/moments` | 删除随笔 |
| POST | `/api/owner/assets` | COS 图片上传 |
| POST | `/api/owner/uploads` | 本地临时上传 |
| GET | `/api/owner/uploads/:name` | 读取临时上传 |

## 部署

1. 编译：`CGO_ENABLED=0 go build -o acg-api .`
2. systemd 或 nohup 运行，设置 `ACG_DATA_DIR=/opt/acg-api/data`
3. Nginx 反向代理：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8787;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 技术栈

- Go 标准库 net/http（无框架）
- SQLite（modernc.org/sqlite 纯 Go 驱动）
- 腾讯云 COS SDK（图片存储）
- 内存占用约 15-30MB
