# Personal Blog / 个人博客

中文说明 | [English](./README.md)

这是我的个人网站 `hoarfrost.cloud` 的 monorepo，包含主站、成长博客子站、Hexo 博客和后端 API。

## 项目结构

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
- **后端**：Go、SQLite、腾讯云 COS SDK
- **基础设施**：阿里云 ECS、Nginx 反向代理、Let's Encrypt SSL、GitHub Actions

## 部署信息

- 生产域名：`https://hoarfrost.cloud`
- 项目展示：`https://project.hoarfrost.cloud`
- 服务器：阿里云 ECS（Ubuntu）
- Nginx 反向代理 + SSL
- 后端：Go 服务，监听 8787 端口

## 非商业立场

本项目仅用于个人学习、技术探索和个人网站部署。
