# hoarfrost - Personal Frontend Website

> 个人博客前端主站，基于 React 18 + Vite + Tailwind CSS + GSAP 构建，部署于 hoarfrost.cloud。

## ✨ Features

- **Hero Section**: 4K 动漫风格背景，GSAP 滚动动画，COS 壁纸轮播。
- **About Section**: 个人介绍与游戏展示。
- **Story Section**: 动漫场景背景，叙事动画。
- **Features (Bento Grid)**: 相册集、哔哩哔哩追番、数据中心三大入口。
- **Moments Page**: `/moments` 随笔页面，支持文本折叠与图片灯箱放大。
- **Gallery**: `/gallery` 相册集，从后端 API 加载专辑与图片。
- **BiliHub**: `/bili` 哔哩哔哩追番列表与创作者雷达。
- **Data Center**: `/ai-traffic` 数据中心，服务器状态实时监控（CPU、内存、goroutine）。
- **About**: `/about` 关于页面，含项目展示与游戏收藏。
- **PWA**: 支持 PWA 离线访问与安装。
- **Owner Console**: `/app` 站长管理控制台（随笔发布、图片上传、后端健康检查）。

## 🛠 Tech Stack

- React 18 + Vite
- Tailwind CSS
- GSAP (ScrollTrigger)
- React Icons
- PWA (Service Worker + Web App Manifest)

## 🧩 Site Modules

- `/moments`: 随笔页面，支持图文发布与 COS 图片上传。
- `/gallery`: 相册集与图片管理。
- `/bili`: 哔哩哔哩追番数据缓存与展示。
- `/ai-traffic`: 数据中心，服务器状态实时监控。
- `/about`: 关于页面，含项目展示与游戏收藏。
- `/app`: 站长控制台（随笔发布、图片上传、后端健康检查）。

## 🚀 Run Locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173/`

## 📄 License

Personal project by [郑帅](https://github.com/Dec-snow).
