/** Tailwind config — palette mirrors src/tokens.js exactly.
 *  preflight is OFF so Tailwind coexists with the existing CSS
 *  (styles.js / admin.css) during the incremental migration.
 *  Once everything is on Tailwind, flip preflight back on. */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        cream:   "#FDFAF7",
        blush:   "#EDD5DA",
        blush2:  "#E2C0C8",
        panel:   "#FAF8F5",
        line:    "#E8D8DC",
        line2:   "#DEC8CE",
        ink:     "#1C1C1C",
        dark:    "#3A2830",
        warm:    "#7A5C64",
        muted:   "#A08890",
        accent:  "#C4748A",
        accentD: "#A85C72",
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
