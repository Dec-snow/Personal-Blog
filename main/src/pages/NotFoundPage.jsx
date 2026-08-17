import { Link } from "react-router-dom";

const NotFoundPage = () => {
  /** 生成樱花花瓣（客户端确定，避免 hydration mismatch） */
  const sakuraPetals = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    style: {
      left: `${Math.random() * 100}%`,
      animationDuration: `${8 + Math.random() * 6}s`,
      animationDelay: `${Math.random() * 8}s`,
      transform: `scale(${0.6 + Math.random() * 0.8})`,
    },
    color: i % 3 === 0 ? "#ffc8d4" : "#ffb7c5",
    opacity: 0.35 + Math.random() * 0.3,
  }));

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
      {/* ── 暗夜背景 ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, #0a0e1a 0%, #0d1224 18%, #111628 32%, #131a2e 42%, #11203c 55%, #0f1830 68%, #140f2a 82%, #1a1030 100%)",
        }}
      />
      {/* ── 噪点叠加（消除色带） ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* ── 樱花飘落 ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {sakuraPetals.map((p) => (
          <span
            key={p.id}
            className="animate-sakura-fall absolute"
            style={p.style}
          >
            <svg width="14" height="14" viewBox="0 0 20 20">
              <g fill={p.color} opacity={p.opacity}>
                <circle cx="10" cy="4" r="3" />
                <circle cx="16" cy="8" r="3" />
                <circle cx="14" cy="15" r="3" />
                <circle cx="6" cy="15" r="3" />
                <circle cx="4" cy="8" r="3" />
              </g>
            </svg>
          </span>
        ))}
      </div>

      {/* ── 呼吸光晕 ── */}
      <div className="animate-oregairu-glow pointer-events-none absolute -left-20 top-1/4 size-72 rounded-full bg-[#3a7a9e]/20 blur-[60px]" />
      <div
        className="animate-oregairu-glow pointer-events-none absolute -right-16 bottom-1/4 size-64 rounded-full bg-[#a8d8ea]/15 blur-[50px]"
        style={{ animationDelay: "2.5s" }}
      />
      <div
        className="animate-oregairu-glow pointer-events-none absolute left-1/3 bottom-10 size-48 rounded-full bg-[#8ec5e8]/10 blur-[40px]"
        style={{ animationDelay: "1.5s" }}
      />

      {/* ── 内容区 ── */}
      <div className="relative z-10 flex flex-col items-center">
        {/* 死鱼眼 */}
        <svg
          className="animate-dead-fish-blink mb-4"
          width="84"
          height="44"
          viewBox="0 0 120 60"
          aria-hidden="true"
        >
          <path
            d="M 10 34 Q 60 20, 110 34"
            stroke="#a8d8ea"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 10 34 Q 60 42, 110 34"
            stroke="#a8d8ea"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.4"
          />
          <ellipse cx="60" cy="35" rx="4" ry="3" fill="#a8d8ea" opacity="0.5" />
          {/* 睫毛 */}
          <line x1="20" y1="30" x2="16" y2="26" stroke="#a8d8ea" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
          <line x1="30" y1="28" x2="28" y2="23" stroke="#a8d8ea" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
          <line x1="100" y1="30" x2="104" y2="26" stroke="#a8d8ea" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
          <line x1="90" y1="28" x2="92" y2="23" stroke="#a8d8ea" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
        </svg>

        {/* 404 大字 */}
        <h1
          className="animate-oregairu-float select-none font-zentry text-[6rem] font-black leading-none tracking-tighter md:text-[9rem]"
          style={{
            background:
              "linear-gradient(135deg, #3a7a9e 0%, #6bb0d0 25%, #a8d8ea 50%, #6bb0d0 75%, #3a7a9e 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 4px 20px rgba(168, 216, 234, 0.3))",
          }}
        >
          404
        </h1>

        {/* 文案 */}
        <p
          className="animate-oregairu-fade-in mt-5 max-w-xs text-sm leading-relaxed text-white/35 md:max-w-md"
          style={{ animationDelay: "0.3s" }}
        >
          这个页面和比企谷一样，独自待在角落。
          <br />
          要不先回侍奉部喝罐 MAX 咖啡？
        </p>

        {/* 返回按钮 — MAX 咖啡风格 */}
        <Link
          to="/"
          className="animate-oregairu-fade-in group mt-8 inline-flex items-center gap-2.5 rounded-full border border-[#a8d8ea]/30 bg-white/5 px-7 py-3 text-sm font-medium text-[#a8d8ea] backdrop-blur-sm transition-all duration-300 hover:border-[#a8d8ea]/60 hover:bg-[#a8d8ea]/10 hover:shadow-[0_0_20px_rgba(168,216,234,0.15)]"
          style={{ animationDelay: "0.9s" }}
        >
          <span className="text-base">☕</span>
          回到侍奉部
          <span className="text-base transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </Link>

        {/* 底部名言 */}
        <p
          className="animate-oregairu-fade-in mt-8 text-xs text-white/20"
          style={{ animationDelay: "1.2s", letterSpacing: "0.1em" }}
        >
          「温柔正确的人总是难以生存，因为这世界既不温柔，也不正确。」
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;
