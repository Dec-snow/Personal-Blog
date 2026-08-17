# Personal Blog / 个人博客

[中文说明](./README.zh-CN.md) | English

This is the monorepo for my personal website `hoarfrost.cloud`, including the main site, build-log subsite, Hexo blog, and backend API.

## Project Structure

- `main/`: Main frontend site, built with React, Vite, Tailwind CSS, and GSAP.
- `build/`: Build-log subsite for recording how this website is built and iterated.
- `blog/`: Hexo + Butterfly blog.
- `acg-api/`: Go backend API, including essay publishing, COS image uploads, server status monitoring, and related features.
- `deploy/`: Deployment-related scripts.
- `.github/workflows/`: GitHub Actions deployment configuration.

## Current Features

- **Home**: Animated hero section with wallpaper selector, feature cards, and GSAP scroll interactions.
- **About**: Personal introduction, project showcase, game list, and tool marquee.
- **Anime**: Static anime watchlist with 4 entries and custom cover images.
- **Essays (随笔)**: Moment-style short notes with text folding, image lightbox, and COS-hosted images.
- **Data Center**: Live server status monitoring (CPU, memory, uptime, goroutines).
- **404 Page**: Custom anime-themed 404 page.
- **Backend**: Essay publishing with COS image upload, server telemetry, and authentication.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS 3, GSAP, React Router
- **Backend**: Go, SQLite, Tencent Cloud COS SDK
- **Infrastructure**: Aliyun ECS, Nginx reverse proxy, Let's Encrypt SSL, GitHub Actions

## Deployment

- Production domain: `https://hoarfrost.cloud`
- Project showcase: `https://project.hoarfrost.cloud`
- Server: Aliyun ECS (Ubuntu)
- Nginx reverse proxy with SSL
- Backend: Go service on port 8787

## Non-Commercial Position

This project is used only for personal learning, technical exploration, and personal website deployment.
