/** Tailwind config — the palette is derived from src/tokens.js, the single
 *  source of truth for brand colors. Change a color there and it flows to
 *  every Tailwind class AND the few remaining inline styles that read T.
 *  preflight is OFF so Tailwind coexists with the base rules in index.css. */
import T from "./src/tokens.js";

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        cream:   T.cream,
        panel:   T.panel,
        blush:   T.blush,
        blush2:  T.blush2,
        line:    T.border,
        line2:   T.border2,
        ink:     T.black,
        dark:    T.dark,
        warm:    T.warm,
        muted:   T.muted,
        accent:  T.accent,
        accentD: T.accentD,
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", "serif"],
        sans:  ["'Jost'", "sans-serif"],
      },
      keyframes: {
        "carousel-tick": {
          from: { transform: "scaleX(0)" },
          to:   { transform: "scaleX(1)" },
        },
      },
      animation: {
        "carousel-tick": "carousel-tick 3s linear infinite",
      },
    },
  },
  plugins: [],
};
