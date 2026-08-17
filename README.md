# Personal Blog / 个人博客

[中文说明](./README.zh-CN.md) | English

This is the monorepo for my personal website `hoarfrost.cloud`, including the main site, build-log subsite, Hexo blog, and backend API.

## Project Structure

```
.
├── main/          # Main frontend (React + Vite)
├── build/         # Build-log subsite (Vite)
├── blog/          # Hexo blog
├── acg-api/       # Go backend API
├── deploy/        # Deployment scripts
├── shared/        # Shared resources
├── tools/         # Utility scripts
└── .github/       # GitHub Actions CI/CD
```

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
- **Backend**: Go (standard library net/http), SQLite (modernc.org/sqlite pure Go driver), Tencent Cloud COS SDK
- **Blog**: Hexo + Butterfly theme
- **Infrastructure**: Aliyun ECS, Nginx reverse proxy, Let's Encrypt SSL, GitHub Actions

## Local Development

### Frontend (Main Site)

```bash
cd main
npm install
npm run dev          # Dev server at http://localhost:5173
npm run build        # Build production to dist/
```

### Backend (acg-api)

```bash
cd acg-api
go build -o acg-api .
./acg-api            # Listens on 127.0.0.1:8787 by default
```

Configure environment variables via `.env` file, see `acg-api/.env.example`.

### Blog (Hexo)

```bash
cd blog
npm install
npx hexo server      # Local blog server at http://localhost:4000
```

## Environment Variables

The backend is configured via `.env` file or environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `ACG_API_ADDR` | Listen address | `127.0.0.1:8787` |
| `ACG_DATA_DIR` | Data directory (absolute path) | `/opt/acg-api/data` |
| `ACG_ALLOWED_ORIGINS` | CORS whitelist | `https://hoarfrost.cloud` |
| `AUTH_OWNER_PASSWORD` | Owner login password | - |
| `AUTH_SESSION_DAYS` | Session duration (days) | `30` |
| `TENCENT_COS_SECRET_ID` | Tencent Cloud COS key ID | - |
| `TENCENT_COS_SECRET_KEY` | Tencent Cloud COS key | - |
| `TENCENT_COS_BUCKET` | COS bucket name | `my-blog-static-1464122491` |

## Deployment

- Production domain: `https://hoarfrost.cloud`
- Project showcase: `https://project.hoarfrost.cloud`
- Server: Aliyun ECS (Ubuntu)
- Nginx reverse proxy with SSL
- Backend: Go service on port 8787
- CI/CD: Push to `master` branch triggers GitHub Actions auto-deploy

## Non-Commercial Position

This project is used only for personal learning, technical exploration, and personal website deployment.
