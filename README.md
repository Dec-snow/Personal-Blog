# Personal Blog / 个人博客

中文说明 | [English](./README.en.md)

这是我的个人网站 `hoarfrost.cloud` 的 monorepo，包含主站、成长博客子站、Hexo 博客和后端 API。

## 项目结构

```
.
├── main/          # 主站前端（React + Vite）
├── build/         # 成长博客子站（Vite）
├── blog/          # Hexo 博客
├── acg-api/       # Go 后端 API
├── deploy/        # 部署脚本
├── shared/        # 共享资源
├── tools/         # 工具脚本
└── .github/       # GitHub Actions CI/CD
```

- `main/`: 主站前端，基于 React、Vite、Tailwind CSS 和 GSAP。
- `build/`: 成长博客子站，用于记录本站从搭建到迭代的过程。
- `blog/`: Hexo + Butterfly 博客。
- `acg-api/`: Go 后端 API，包含随笔发布、COS 图片上传、服务器状态监控等功能。
- `deploy/`: 部署相关脚本。
- `.github/workflows/`: GitHub Actions 自动部署配置。

## 当前功能

- **首页**：动画 Hero 区域、壁纸选择器、功能卡片展示、GSAP 滚动交互。
- **关于我**：个人介绍、项目展示集、我玩的游戏、技术工具跑马灯。
- **追番大追击**：静态番剧展示，4 个番剧条目，自定义封面和 B 站链接。
- **随笔**：短内容记录，支持长文折叠、图片灯箱放大、COS 图片托管。
- **数据中心**：服务器实时状态监控（CPU、内存、运行时长、goroutine 数）。
- **404 页面**：自定义二次元主题 404 页面。
- **后端**：随笔发布与 COS 图片上传、服务器遥测、站长认证。

## 技术栈

- **前端**：React 18、Vite、Tailwind CSS 3、GSAP、React Router
- **后端**：Go（标准库 net/http）、SQLite（modernc.org/sqlite 纯 Go 驱动）、腾讯云 COS SDK
- **博客**：Hexo + Butterfly 主题
- **基础设施**：阿里云 ECS、Nginx 反向代理、Let's Encrypt SSL、GitHub Actions

## 本地开发

### 前端（主站）

```bash
cd main
npm install
npm run dev          # 启动开发服务器 http://localhost:5173
npm run build        # 构建生产版本到 dist/
```

### 后端（acg-api）

```bash
cd acg-api
go build -o acg-api .
./acg-api            # 默认监听 127.0.0.1:8787
```

后端需要配置环境变量，参考 `acg-api/.env.example`。

### 博客（Hexo）

```bash
cd blog
npm install
npx hexo server      # 启动本地博客服务器 http://localhost:4000
```

## 环境变量

后端通过 `.env` 文件或环境变量配置，关键项见下表：

| 变量 | 说明 | 示例 |
|------|------|------|
| `ACG_API_ADDR` | 监听地址 | `127.0.0.1:8787` |
| `ACG_DATA_DIR` | 数据目录（绝对路径） | `/opt/acg-api/data` |
| `ACG_ALLOWED_ORIGINS` | CORS 白名单 | `https://hoarfrost.cloud` |
| `AUTH_OWNER_PASSWORD` | 站长登录密码 | - |
| `AUTH_SESSION_DAYS` | 会话有效期（天） | `30` |
| `TENCENT_COS_SECRET_ID` | 腾讯云 COS 密钥 ID | - |
| `TENCENT_COS_SECRET_KEY` | 腾讯云 COS 密钥 | - |
| `TENCENT_COS_BUCKET` | COS 存储桶名 | `my-blog-static-1464122491` |

## 部署信息

- 生产域名：`https://hoarfrost.cloud`
- 项目展示：`https://project.hoarfrost.cloud`
- 服务器：阿里云 ECS（Ubuntu）
- Nginx 反向代理 + SSL
- 后端：Go 服务，监听 8787 端口
- CI/CD：推送到 `master` 分支自动触发 GitHub Actions 构建部署

## 非商业立场

本项目仅用于个人学习、技术探索和个人网站部署。
