import { getHeroWordmarkStyle } from "./heroWordmarkTheme";

const HeroWordmark = ({ heroIndex }) => {
  const className = "hero-wordmark hero-wordmark--ready";

  return (
    <div
      key={`hero-wordmark-${heroIndex}`}
      className={className}
      style={getHeroWordmarkStyle(heroIndex)}
      aria-label="追著猫的老鼠"
    >
      <span
        style={{
          fontFamily: "'Pacifico', 'Ma Shan Zheng', cursive",
          fontSize: "clamp(2rem, 5vw, 4rem)",
          fontWeight: 400,
          whiteSpace: "nowrap",
          display: "inline-block",
          transform: "rotate(-4deg)",
          letterSpacing: "0.02em",
          color: "var(--hero-wordmark-fill, #fff)",
          textShadow:
            "0 2px 12px rgba(0,0,0,0.25), 0 0 24px var(--hero-wordmark-stroke, rgba(255,255,255,0.3))",
        }}
      >
        追著猫的老鼠
      </span>
    </div>
  );
};

export default HeroWordmark;
