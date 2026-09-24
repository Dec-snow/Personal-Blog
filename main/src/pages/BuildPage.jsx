import { useEffect, useRef, useState } from "react";

// ───────────────── 技术栈飘带数据 ─────────────────
const TECH_BADGES = [
  { name: "React 18", icon: "⚛️", label: "UI Framework", color: "#61DAFB" },
  { name: "Vite", icon: "⚡", label: "Build Tool", color: "#646CFF" },
  { name: "Tailwind CSS 3", icon: "🎨", label: "Styling", color: "#06B6D4" },
  { name: "GSAP", icon: "✨", label: "Animation", color: "#88CE02" },
  { name: "React Router 6", icon: "🧭", label: "Routing", color: "#CA4245" },
  { name: "Go 1.22", icon: "🐹", label: "Backend", color: "#00ADD8" },
  { name: "SQLite", icon: "🗄️", label: "Database", color: "#003B57" },
  { name: "腾讯云 COS", icon: "☁️", label: "Storage", color: "#00A4FF" },
  { name: "PWA", icon: "📱", label: "Progressive", color: "#5A0FC8" },
  { name: "DeepSeek", icon: "🤖", label: "AI Chat", color: "#4D6BFE" },
];

// ───────────────── 滚动揭示 Hook ─────────────────
const SCROLL_REVEAL = "opacity-0 translate-y-6 transition-all duration-700 ease-out";

const useReveal = () => {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return { ref, shown };
};

const RevealSection = ({ children, className = "" }) => {
  const { ref, shown } = useReveal();
  return (
    <div
      ref={ref}
      className={`${SCROLL_REVEAL} ${shown ? "opacity-100 translate-y-0" : ""} ${className}`}
    >
      {children}
    </div>
  );
};

// ───────────────── 架构层级 ─────────────────
const ARCH_LAYERS = [
  {
    label: "展示层",
    eng: "Presentation",
    color: "#FF6BAA",
    items: [
      { name: "React 18", detail: "函数组件 + Hooks，Suspense 路由级代码分割" },
      { name: "Tailwind CSS 3", detail: "原子化 CSS，JIT 编译，自定义主题" },
      { name: "GSAP", detail: "ScrollTrigger 驱动滚动动画与交互" },
      { name: "PWA", detail: "Manifest + Service Worker，仅生产域名启用" },
    ],
  },
  {
    label: "网关层",
    eng: "Gateway",
    color: "#646CFF",
    items: [
      { name: "Nginx", detail: "HTTPS 反代，静态资源 + /api 代理到 Go 后端" },
      { name: "React Router 6", detail: "嵌套路由 + SiteLayout，10 页懒加载" },
    ],
  },
  {
    label: "服务层",
    eng: "Service",
    color: "#00ADD8",
    items: [
      { name: "Go 1.22 HTTP", detail: "acg-api 轻量服务，约 20 个 RESTful 端点" },
      { name: "Session Auth", detail: "邮箱密码登录 + bcrypt + Cookie 会话" },
      { name: "AI 聊天", detail: "DeepSeek API 对接，按 IP 每日限额" },
    ],
  },
  {
    label: "数据层",
    eng: "Data",
    color: "#88CE02",
    items: [
      { name: "SQLite", detail: "modernc.org/sqlite 嵌入式，WAL 模式" },
      { name: "7 张数据表", detail: "users, sessions, moments, chat_quota, drafts, login_challenges, site_settings" },
    ],
  },
  {
    label: "资源层",
    eng: "Resources",
    color: "#00A4FF",
    items: [
      { name: "腾讯云 COS", detail: "壁纸、相册、头像、音乐统一托管" },
      { name: "中文路径编码", detail: "URL 编码支持中文文件夹名" },
    ],
  },
];

// ───────────────── 页面功能矩阵 ─────────────────
const PAGE_MATRIX = [
  {
    route: "/",
    title: "首页",
    eng: "Home",
    icon: "🏠",
    accent: "#FF6BAA",
    features: [
      "Hero 指南针壁纸 — 拖拽旋转 + 四方向锦瑟诗句",
      "影像档案翻页器 — 3D 翻转浏览，SWITCH COVER 唤起",
      "Source Slot 抽奖机 — 三位数字滚动 + 随机壁纸奖品",
      "Story 信封展开 + Contact 联系区域",
    ],
    techs: ["GSAP", "3D Tilt", "Slot Machine", "Scroll Reveal"],
  },
  {
    route: "/gallery",
    title: "相册集",
    eng: "Gallery",
    icon: "🖼️",
    accent: "#7C5CFF",
    features: [
      "相册列表 — 静态 JSON 配置，支持多相册分组",
      "相册详情页 — 大图浏览，首张 eager 其余 lazy",
      "COS 资源托管 — 图片统一存腾讯云，CDN 加速",
      "控制台上传 — 站长后台直传 COS，按相册分类存储",
    ],
    techs: ["Static Data", "COS CDN", "Lazy Load", "Fallback"],
  },
  {
    route: "/moments",
    title: "随笔",
    eng: "Moments",
    icon: "✍️",
    accent: "#FF8FAB",
    features: [
      "卡片时间线布局 — tone 调色 + module 分类",
      "API 优先加载 — SQLite 持久化，不可用时回退静态 JSON",
      "后台增删 — 支持图文混排，ID 精准删除",
      "COS 附图 — 发布时上传图片到 COS，删除时自动清理",
    ],
    techs: ["SQLite CRUD", "COS Upload", "API First", "Static Fallback"],
  },
  {
    route: "/bili",
    title: "哔哩BILI",
    eng: "BiliHub",
    icon: "📺",
    accent: "#00C2FF",
    features: [
      "追番导航 — 静态番剧卡片，点击跳转 B站播放页",
      "创作者展示 — 关注的 UP 主卡片，外链直达空间",
      "ACG 主题板块 — 番剧 / 创作者分区导航",
      "移动端响应式 — 卡片网格自适应布局",
    ],
    techs: ["Static Nav", "External Link", "Responsive Grid"],
  },
  {
    route: "/ai-traffic",
    title: "数据中心",
    eng: "Monitor",
    icon: "📊",
    accent: "#FFD43B",
    features: [
      "ServerInfoPanel — 圆形 HUD 展示系统指标",
      "CPU / 内存 / 运行时间 / 环境 四项监控",
      "数字缓动动画 + 10s 自动轮询刷新",
      "站点信息卡 — 技术栈、存储、部署概览",
    ],
    techs: ["10s Polling", "Number Easing", "Circle HUD"],
  },
  {
    route: "/about",
    title: "关于我",
    eng: "About",
    icon: "👤",
    accent: "#88CE02",
    features: [
      "Shadow DOM 隔离 — 加载 about-preview.html",
      "个人介绍 + 项目展示集 + 游戏货架 3D 倾斜",
      "跑马灯文字滚动 + 项目卡光标跟随",
      "CSS 作用域隔离，无样式污染",
    ],
    techs: ["Shadow DOM", "CSS Isolation", "Marquee", "3D Shelf"],
  },
  {
    route: "/chat",
    title: "博客助手",
    eng: "AI Chat",
    icon: "🤖",
    accent: "#4D6BFE",
    features: [
      "DeepSeek AI 对话 — 同步响应，实时回复",
      "访客每日限额 — 按 IP 计数，次日自动重置",
      "站长无限额度 — 登录后解锁无限制对话",
      "二次元风格界面 — 暗夜樱花 + 呼吸光晕主题",
    ],
    techs: ["DeepSeek API", "IP Rate Limit", "Session Auth", "Anime UI"],
  },
  {
    route: "/app",
    title: "站长控制台",
    eng: "Console",
    icon: "⚙️",
    accent: "#5A0FC8",
    features: [
      "账号登录 — 邮箱密码 + Cookie 会话，站长权限门控",
      "随笔管理 — 发布 / 删除，支持 COS 附图自动清理",
      "COS 资产上传 — 相册 / 随笔 / 头像多分类直传",
      "聊天限额管理 — 滑块调整访客每日对话次数",
      "运行总览 — 后端健康、站长状态、随笔列表一览",
    ],
    techs: ["Session Auth", "COS Upload", "SQLite CRUD", "Chat Limit", "Health Monitor"],
  },
];

// ───────────────── 交互亮点 ─────────────────
const INTERACTIONS = [
  {
    icon: "🧭",
    title: "指南针壁纸选择",
    desc: "拖拽旋转指针实时高亮方向卡，松手吸附最近方向，《锦瑟》四联诗句渐变描边随方向切换",
    tag: "GSAP + Drag",
  },
  {
    icon: "📖",
    title: "影像档案翻页器",
    desc: "3D rotateY 翻页浏览影像档案，卡片层叠偏移，侧栏片段笔记 + 快速跳转，SWITCH COVER 唤起",
    tag: "3D Transform",
  },
  {
    icon: "🎰",
    title: "老虎机抽奖机",
    desc: "拉杆触发三位数字滚动定格，弹出随机壁纸奖品。奖品异步从 COS 加载，含历史记录与测试模式",
    tag: "Slot Animation",
  },
  {
    icon: "✉️",
    title: "信封 Story 展开",
    desc: "信封随滚动进入视口展开，展示寄语，配合光晕装饰与径向光弧，柔和的阅读体验",
    tag: "Scroll Reveal",
  },
  {
    icon: "🎵",
    title: "音波播放指示器",
    desc: "导航栏音乐按钮四条竖线动画，各主题配色独立。点击切换播/停 COS 背景音循环",
    tag: "Audio Control",
  },
  {
    icon: "🎭",
    title: "页面主题系统",
    desc: "每页面独立导航配色（dark/bili/gallery/moments/about），滚动时浮层显隐 + 样式动态切换",
    tag: "Dynamic Theme",
  },
];

// ───────────────── 搭建历程 ─────────────────
const TIMELINE = [
  {
    phase: "起步",
    title: "项目骨架搭建",
    desc: "基于开源模板初始化 React + Vite + Tailwind 工程，理解组件划分与路由架构，配置 COS 开发代理实现同源资源加载。",
    accent: "#7C5CFF",
  },
  {
    phase: "定制",
    title: "视觉重塑与资源替换",
    desc: "替换 COS 存储桶全部资源（壁纸、相册、头像、音乐），调整全局配色与字体族，移除不需要的模块（留言板、好友页、AI 画廊），确立博客专属风格。",
    accent: "#FF6BAA",
  },
  {
    phase: "开发",
    title: "前后端功能实现",
    desc: "Go 后端从零搭建：SQLite 持久化、Session 认证、随笔 CRUD、AI 聊天 + 访客限额。前端接入 API，新增博客助手、创造纪事页面与导航栏音乐播放。",
    accent: "#00C2FF",
  },
  {
    phase: "打磨",
    title: "交互细节与 Owner 控制台",
    desc: "实现指南针壁纸、影像档案翻页、老虎机抽奖、信封展开等交互。搭建 /app 站长控制台：登录门控、随笔管理、COS 资产上传、后端健康监控，PWA 门控仅限生产域名。",
    accent: "#88CE02",
  },
  {
    phase: "上线",
    title: "部署与持续优化",
    desc: "前端静态部署至云端，Go 后端运行于阿里云 ECS。域名 HTTPS 接入，PWA Manifest 注入，Service Worker 离线缓存。持续迭代：博客助手二次元化、聊天限额管理等。",
    accent: "#FF8FAB",
  },
];

const BuildPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff8f1_0%,#ffeef5_35%,#f3e8ff_65%,#eaf6ff_100%)]">
      {/* ═══════════ Hero ═══════════ */}
      <section className="relative flex min-h-[42vh] flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-8">
        <div className="pointer-events-none absolute -left-20 top-20 size-72 rounded-full bg-[#FF6BAA]/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-10 size-80 rounded-full bg-[#7C5CFF]/10 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/3 size-64 -translate-x-1/2 rounded-full bg-[#00C2FF]/6 blur-3xl" />

        <div className="relative z-10 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-[#7C5CFF]/70">
            Build Journal
          </p>
          <h1 className="mt-4 font-zentry text-4xl font-black uppercase text-[#2D2A3A] md:text-6xl">
            创造纪事
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#2D2A3A]/60 md:text-base">
            从一行代码到一个完整的个人博客，这里记录着技术选型、前后端功能实现与交互打磨的全过程。
          </p>
        </div>
      </section>

      {/* ═══════════ 架构总览 — 分层可视化 ═══════════ */}
      <section className="container mx-auto px-4 pb-16 md:px-10">
        <RevealSection>
          <div className="mb-8 px-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#7C5CFF]/80">
              Architecture
            </p>
            <h2 className="mt-2 font-zentry text-2xl font-black uppercase text-[#2D2A3A] md:text-3xl">
              架构全景
            </h2>
            <p className="mt-2 text-sm text-[#2D2A3A]/50">
              展示 → 网关 → 服务 → 数据 → 资源，五层分层架构
            </p>
          </div>
        </RevealSection>

        <div className="space-y-4">
          {ARCH_LAYERS.map((layer, i) => (
            <RevealSection key={layer.label}>
              <div
                className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/50 p-5 shadow-[0_6px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_10px_32px_rgba(0,0,0,0.08)] md:p-6"
                style={{ borderLeftWidth: 4, borderLeftColor: layer.color }}
              >
                {/* Background glow */}
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-35"
                  style={{ background: layer.color }}
                />

                <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
                  {/* Layer label */}
                  <div className="flex shrink-0 items-center gap-3 md:w-32 md:flex-col md:items-start md:gap-1">
                    <span
                      className="rounded-lg px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white"
                      style={{ background: layer.color }}
                    >
                      L{ i + 1 }
                    </span>
                    <div>
                      <div className="text-sm font-bold text-[#2D2A3A]">{layer.label}</div>
                      <div className="text-[10px] uppercase tracking-wider text-[#2D2A3A]/40">
                        {layer.eng}
                      </div>
                    </div>
                  </div>

                  {/* Layer items */}
                  <div className="flex flex-1 flex-wrap gap-3">
                    {layer.items.map((item) => (
                      <div
                        key={item.name}
                        className="flex-1 rounded-xl border px-4 py-3"
                        style={{
                          minWidth: 160,
                          borderColor: `${layer.color}25`,
                          background: `${layer.color}08`,
                        }}
                      >
                        <div
                          className="text-xs font-bold"
                          style={{ color: layer.color }}
                        >
                          {item.name}
                        </div>
                        <div className="mt-1 text-[11px] leading-relaxed text-[#2D2A3A]/55">
                          {item.detail}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ═══════════ 页面功能矩阵 ═══════════ */}
      <section className="container mx-auto px-4 pb-16 md:px-10">
        <RevealSection>
          <div className="mb-8 px-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#FF6BAA]/80">
              Page Matrix
            </p>
            <h2 className="mt-2 font-zentry text-2xl font-black uppercase text-[#2D2A3A] md:text-3xl">
              页面矩阵
            </h2>
            <p className="mt-2 text-sm text-[#2D2A3A]/50">
              8 个前端页面 + 站长控制台，每页独立功能体系
            </p>
          </div>
        </RevealSection>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PAGE_MATRIX.map((page, i) => (
            <RevealSection key={page.route}>
              <div
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/50 p-5 shadow-[0_6px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(255,107,170,0.08)]"
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                {/* Accent top stripe */}
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: page.accent }}
                />

                {/* Header */}
                <div className="mb-3 flex items-center gap-2.5 pt-1">
                  <span className="text-xl">{page.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-[#2D2A3A]">{page.title}</h3>
                    <p className="font-mono text-[10px] tracking-wider text-[#2D2A3A]/35">
                      {page.route}
                      <span className="ml-1.5 text-[#2D2A3A]/25">{page.eng}</span>
                    </p>
                  </div>
                </div>

                {/* Features */}
                <ul className="flex-1 space-y-1.5">
                  {page.features.map((feat, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-xs leading-relaxed text-[#2D2A3A]/60"
                    >
                      <span className="mt-0.5 shrink-0 text-[10px]" style={{ color: page.accent }}>
                        ◆
                      </span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Tech tags */}
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[#2D2A3A]/6 pt-3">
                  {page.techs.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide"
                      style={{
                        borderColor: `${page.accent}30`,
                        background: `${page.accent}0D`,
                        color: `${page.accent}bb`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ═══════════ 交互亮点 ═══════════ */}
      <section className="container mx-auto px-4 pb-16 md:px-10">
        <RevealSection>
          <div className="mb-8 px-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#88CE02]/80">
              Interactions
            </p>
            <h2 className="mt-2 font-zentry text-2xl font-black uppercase text-[#2D2A3A] md:text-3xl">
              交互细节
            </h2>
            <p className="mt-2 text-sm text-[#2D2A3A]/50">
              那些让页面「活」起来的动画与微交互
            </p>
          </div>
        </RevealSection>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INTERACTIONS.map((item, i) => (
            <RevealSection key={item.title}>
              <div
                className="group flex h-full flex-col rounded-2xl border border-white/60 bg-white/50 p-5 shadow-[0_6px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1"
                style={{ transitionDelay: `${i * 30}ms` }}
              >
                <div className="mb-2 flex items-center gap-2.5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
                    style={{ background: "rgba(136,206,2,0.12)" }}
                  >
                    {item.icon}
                  </span>
                  <span
                    className="rounded-full border border-[#88CE02]/25 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-[#88CE02]/80"
                  >
                    {item.tag}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#2D2A3A]">{item.title}</h3>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-[#2D2A3A]/55">
                  {item.desc}
                </p>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ═══════════ 搭建历程 ═══════════ */}
      <section className="container mx-auto px-4 pb-16 md:px-10">
        <RevealSection>
          <div className="mb-8 px-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#FF8FAB]/80">
              Timeline
            </p>
            <h2 className="mt-2 font-zentry text-2xl font-black uppercase text-[#2D2A3A] md:text-3xl">
              搭建历程
            </h2>
            <p className="mt-2 text-sm text-[#2D2A3A]/50">
              从初始化到上线，每一步都有迹可循
            </p>
          </div>
        </RevealSection>

        <div className="relative">
          {/* Timeline spine */}
          <div className="absolute left-[22px] top-3 bottom-3 w-[2px] rounded-full bg-gradient-to-b from-[#7C5CFF]/50 via-[#FF6BAA]/50 via-[#00C2FF]/50 via-[#88CE02]/50 to-[#FF8FAB]/50 md:left-1/2 md:-translate-x-1/2" />

          <div className="space-y-8">
            {TIMELINE.map((item, i) => (
              <RevealSection key={item.phase}>
                <div
                  className={`relative flex items-start gap-5 md:w-1/2 ${
                    i % 2 === 0
                      ? "md:ml-0 md:pr-12"
                      : "md:ml-auto md:pl-12"
                  }`}
                >
                  {/* Node */}
                  <div
                    className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-white font-mono text-xs font-bold text-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
                    style={{
                      background: `linear-gradient(135deg, ${item.accent}, ${item.accent}dd)`,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>

                  {/* Card */}
                  <div className="flex-1 rounded-2xl border border-white/60 bg-white/50 p-5 shadow-[0_6px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_10px_32px_rgba(0,0,0,0.08)]">
                    <span
                      className="inline-block rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white"
                      style={{ background: item.accent }}
                    >
                      {item.phase}
                    </span>
                    <h3 className="mt-2 text-base font-bold text-[#2D2A3A]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#2D2A3A]/60">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 技术栈飘带动画 ═══════════ */}
      <section className="container mx-auto px-4 pb-28 md:px-10">
        <RevealSection>
          <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-gradient-to-br from-[#2D2A3A] via-[#3D2A5A] to-[#2D2A3A] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] md:px-10 md:py-12">
            <div className="pointer-events-none absolute -right-16 -top-16 size-52 rounded-full bg-[#7C5CFF]/12 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 size-52 rounded-full bg-[#FF6BAA]/10 blur-3xl" />

            <div className="relative text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#FF6BAA]/75">
                Tech Stack
              </p>
              <h2 className="mt-2 font-zentry text-2xl font-black uppercase text-white md:text-3xl">
                技术栈一览
              </h2>
            </div>

            {/* ── 第一行：向右飘 ── */}
            <div className="relative mt-10 w-full overflow-hidden py-3">
              <div className="marquee-track marquee-track--right flex w-max gap-4">
                {[...TECH_BADGES, ...TECH_BADGES].map((tech, i) => (
                  <div
                    key={`${tech.name}-${i}`}
                    className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-white/12 bg-white/6 px-5 py-3 backdrop-blur-sm"
                    style={{ borderColor: `${tech.color}35` }}
                  >
                    <span className="text-xl">{tech.icon}</span>
                    <div className="text-left leading-tight">
                      <div className="text-xs font-bold text-white/90">{tech.name}</div>
                      <div className="text-[10px] text-white/40">{tech.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 第二行：向左飘（偏移起始位置，速度稍慢） ── */}
            <div className="relative mt-4 w-full overflow-hidden py-3">
              <div className="marquee-track marquee-track--left flex w-max gap-4">
                {[...TECH_BADGES.slice().reverse(), ...TECH_BADGES.slice().reverse()].map((tech, i) => (
                  <div
                    key={`${tech.name}-rev-${i}`}
                    className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-white/12 bg-white/6 px-5 py-3 backdrop-blur-sm"
                    style={{ borderColor: `${tech.color}35` }}
                  >
                    <span className="text-xl">{tech.icon}</span>
                    <div className="text-left leading-tight">
                      <div className="text-xs font-bold text-white/90">{tech.name}</div>
                      <div className="text-[10px] text-white/40">{tech.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 底部说明 */}
            <p className="relative mt-10 text-center text-xs leading-relaxed text-white/45">
              前端 React 18 + Vite + Tailwind CSS 3 + GSAP 动画引擎，
              后端 Go 1.22 + SQLite + Session 认证，
              资源托管腾讯云 COS，PWA 仅限生产域名。
              持续开发中，更多功能敬请期待 ✨
            </p>
          </div>
        </RevealSection>
      </section>
    </div>
  );
};

export default BuildPage;
