export const makePosterDataUri = (label) => {
  const safe = String(label).replace(/[<>&"]/g, "").slice(0, 20);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stop-color="#EAF6FF"/>
        <stop offset="50%" stop-color="#FFEAF4"/>
        <stop offset="100%" stop-color="#F3E8FF"/>
      </linearGradient>
    </defs>
    <rect width="600" height="800" fill="url(#g)"/>
    <circle cx="120" cy="140" r="40" fill="#00C2FF" opacity="0.12"/>
    <circle cx="480" cy="620" r="70" fill="#FF6BAA" opacity="0.1"/>
    <text x="300" y="420" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#7C5CFF" opacity="0.4">${safe || "ANIME"}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const hasRemoteCover = (item) =>
  Boolean(item?.coverUrl && !String(item.coverUrl).startsWith("data:"));

export const resolveCoverSrc = (item, apiBase) => {
  if (!item?.coverUrl) return null;
  if (item.coverUrl.startsWith("http") || item.coverUrl.startsWith("data:")) {
    return item.coverUrl;
  }
  const base = (apiBase || "").replace(/\/$/, "");
  return base ? `${base}${item.coverUrl}` : item.coverUrl;
};
