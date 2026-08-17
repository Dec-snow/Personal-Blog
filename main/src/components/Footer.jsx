import clsx from "clsx";
import { FaGithub, FaEnvelope } from "react-icons/fa";
import { SiBilibili } from "react-icons/si";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

// ===== 可配置项 =====
const SITE_START_DATE = new Date("2026-07-01T00:00:00"); // 网站上线时间
const SITE_AUTHOR = "追著猫的老鼠";
const ICP_NUMBER = "鄂ICP备2026039603号-1";
const ICP_URL = "https://beian.miit.gov.cn/";

const socialLinks = [
  { href: "https://github.com/Dec-snow", icon: <FaGithub />, label: "GitHub" },
  {
    href: "https://space.bilibili.com/252362781?spm_id_from=333.1007.0.0",
    icon: <SiBilibili />,
    label: "Bilibili",
  },
  {
    href: "mailto:yzbek.86@gmail.com",
    icon: <FaEnvelope />,
    label: "yzbek.86@gmail.com",
  },
];

// 运行时间计时器
function useRuntime() {
  const [text, setText] = useState("");
  useEffect(() => {
    const tick = () => {
      const diff = Date.now() - SITE_START_DATE.getTime();
      if (diff < 0) {
        setText("即将上线");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setText(`${d} 天 ${h} 小时 ${m} 分 ${s} 秒`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return text;
}

const footerThemes = {
  default: {
    shell:
      "border-t border-[#F2E6C9] bg-gradient-to-r from-[#FFF8E7] via-[#FFEAF4] to-[#EAF6FF] text-[#2B2B2B]",
    copy: "text-[#5F4B52]",
    link: "text-[#FF6B9D] hover:text-[#E91E63] transition-colors",
    icon: "text-[#2B2B2B] hover:text-[#FF8FAB]",
    badge: "border border-[#F2E6C9] bg-white/80 text-[#5F4B52]",
    dot: "bg-[#4ade80]",
    tip: "border border-[#F2E6C9] bg-white/95 text-[#2B2B2B]",
  },
  bili: {
    shell:
      "border-t border-[#E8DFFB] bg-gradient-to-r from-[#EAF6FF] via-[#FFEAF4] to-[#F3E8FF] text-[#2D2A3A]",
    copy: "text-[#2D2A3A]/85",
    link: "text-[#7C5CFF] hover:text-[#5B3FD6] transition-colors",
    icon: "text-[#2D2A3A] hover:text-[#7C5CFF]",
    badge: "border border-[#E8DFFB] bg-white/80 text-[#2D2A3A]",
    dot: "bg-[#4ade80]",
    tip: "border border-[#E8DFFB] bg-white/95 text-[#2D2A3A]",
  },
  ai: {
    shell: "border-t border-[#F2E6C9] bg-[#FFF8E7] text-[#2B2B2B]",
    copy: "text-[#6B7280]",
    link: "text-[#FF6B9D] hover:text-[#E91E63] transition-colors",
    icon: "text-[#2B2B2B] hover:text-[#FF8FAB]",
    badge: "border border-[#F2E6C9] bg-white text-[#6B7280]",
    dot: "bg-[#4ade80]",
    tip: "border border-[#F2E6C9] bg-white text-[#2B2B2B]",
  },
  moments: {
    shell:
      "border-t border-[#E8DFFB] bg-gradient-to-r from-[#FFFDFD] via-[#FFF4F8] to-[#F1FFFC] text-[#4A4456]",
    copy: "text-[#6A6674]",
    link: "text-[#9B8FD4] hover:text-[#7C5CFF] transition-colors",
    icon: "text-[#4A4456] hover:text-[#9B8FD4]",
    badge: "border border-[#E8DFFB] bg-white/80 text-[#6A6674]",
    dot: "bg-[#4ade80]",
    tip: "border border-[#E8DFFB] bg-white/95 text-[#4A4456]",
  },
};

const Footer = () => {
  const { pathname } = useLocation();
  const runtime = useRuntime();
  const variant = pathname.startsWith("/bili")
    ? "bili"
    : pathname.startsWith("/ai-traffic")
      ? "ai"
      : pathname.startsWith("/moments")
            ? "moments"
            : "default";
  const theme = footerThemes[variant];

  return (
    <footer className={clsx("w-full py-6", theme.shell)}>
      <div className="container mx-auto flex flex-col items-center gap-3 px-4">
        {/* 运行时间 */}
        <div
          className={clsx(
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-light",
            theme.badge
          )}
        >
          <span
            className={clsx(
              "inline-block h-1.5 w-1.5 animate-pulse rounded-full",
              theme.dot
            )}
          />
          本站已经运行 {runtime}
        </div>

        {/* 社交链接 */}
        <div className="flex justify-center gap-5">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={clsx(
                "group relative text-lg transition-colors duration-300",
                theme.icon
              )}
            >
              {link.icon}
              <span
                className={clsx(
                  "pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-0.5 text-xs opacity-0 transition-opacity group-hover:opacity-100",
                  theme.tip
                )}
              >
                {link.label}
              </span>
            </a>
          ))}
        </div>

        {/* 版权 */}
        <p className={clsx("text-center text-xs font-light", theme.copy)}>
          © 2026 {SITE_AUTHOR}. All Rights Reserved.
        </p>

        {/* ICP 备案 */}
        <a
          href={ICP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            "text-xs font-light transition-colors hover:underline",
            theme.copy
          )}
        >
          {ICP_NUMBER}
        </a>

        {/* 技术归属 */}
        <p className={clsx("text-xs font-light", theme.copy)}>
          Powered by{" "}
          <a
            href="https://react.dev"
            target="_blank"
            rel="noopener noreferrer"
            className={theme.link}
          >
            React
          </a>{" "}
          &{" "}
          <a
            href="https://vite.dev"
            target="_blank"
            rel="noopener noreferrer"
            className={theme.link}
          >
            Vite
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
