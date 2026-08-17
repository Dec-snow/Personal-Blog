import { useEffect, useState, useCallback } from "react";
import { fetchPublicMoments } from "../services/ownerApi";
import { moments as staticMoments } from "../data/moments";

const momentDateTime = (moment) => {
  if (!moment.date) return moment.year || "";
  const parts = moment.date.split(".");
  const month = parts[0] || "01";
  const day = parts[1] || "01";
  return `${moment.year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const COLLAPSE_THRESHOLD = 120;

const MomentsPage = () => {
  const [moments, setMoments] = useState(staticMoments);
  const [loading, setLoading] = useState(true);
  const [expandedKeys, setExpandedKeys] = useState(() => new Set());
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchPublicMoments();
        if (!cancelled && data.items && data.items.length > 0) {
          setMoments(data.items);
        }
      } catch {
        // 静默回退到静态数据
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ESC to close lightbox + lock body scroll
  useEffect(() => {
    if (!lightbox) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox]);

  const toggleExpand = useCallback((key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return (
    <div className="moments-page">
      <div className="moments-page-bg" aria-hidden="true">
        <span className="moments-page-glow moments-page-glow--rose" />
        <span className="moments-page-glow moments-page-glow--mint" />
        <span className="moments-page-glow moments-page-glow--sun" />
      </div>

      <header className="moments-page-hero">
        <h1>随笔</h1>
        <p className="moments-page-subtitle">记录日常所思所感，慢慢写，慢慢长大</p>
      </header>

      <section className="moments-page-list" aria-label="随笔列表">
        {loading ? (
          <p style={{ textAlign: "center", color: "#8a7078", fontSize: 14 }}>
            加载中…
          </p>
        ) : moments.length === 0 ? (
          <p style={{ textAlign: "center", color: "#8a7078", fontSize: 14 }}>
            还没有发布随笔，去后端控制台写一条吧。
          </p>
        ) : (
          moments.map((moment, index) => {
            const key = `${moment.year}-${moment.date}-${moment.type}-${index}`;
            const lines = moment.lines || (moment.content ? [moment.content] : []);
            const totalLen = lines.reduce((sum, l) => sum + (l ? l.length : 0), 0);
            const isLong = totalLen > COLLAPSE_THRESHOLD;
            const isExpanded = expandedKeys.has(key);
            const showCollapsed = isLong && !isExpanded;

            return (
              <article
                key={key}
                className={`moments-card moments-page-card moments-card--${moment.tone || "aurora"} moments-module--${moment.module || "postcard"}`}
                style={{ "--moment-index": String(index + 1) }}
              >
                <div className="moments-meta">
                  <time className="moments-date" dateTime={momentDateTime(moment)}>
                    {moment.year} · {moment.date}
                  </time>
                  <span className="moments-type">{moment.type}</span>
                </div>
                <div className={`moments-lines${showCollapsed ? " moments-lines--collapsed" : ""}`}>
                  {lines.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
                {isLong && (
                  <button
                    type="button"
                    className="moments-expand-btn"
                    onClick={() => toggleExpand(key)}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? "收起" : "展开全文"}
                    <svg
                      viewBox="0 0 12 12"
                      width="10"
                      height="10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: isExpanded ? "rotate(180deg)" : "none",
                        transition: "transform 0.25s ease",
                      }}
                    >
                      <path d="M2 4l4 4 4-4" />
                    </svg>
                  </button>
                )}
                {moment.image && (
                  <figure
                    className="moments-photo moments-photo--clickable"
                    onClick={() => setLightbox(moment.image)}
                    role="button"
                    tabIndex={0}
                    aria-label="点击放大图片"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setLightbox(moment.image);
                      }
                    }}
                  >
                    <img
                      src={moment.image.src}
                      alt={moment.image.alt}
                      loading="lazy"
                    />
                    <span className="moments-photo-zoom" aria-hidden="true">
                      <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="6.5" cy="6.5" r="4" />
                        <path d="M9.5 9.5L14 14" />
                        <path d="M4.5 6.5h4M6.5 4.5v4" />
                      </svg>
                    </span>
                  </figure>
                )}
              </article>
            );
          })
        )}
      </section>

      {lightbox && (
        <div
          className="moments-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="图片预览"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.src || lightbox}
            alt={lightbox.alt || ""}
            className="moments-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default MomentsPage;
