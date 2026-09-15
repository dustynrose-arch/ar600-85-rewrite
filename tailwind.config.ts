import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        army: {
          black: "#101218",
          ink: "#161821",
          gold: "#e2b84a",
          goldDark: "#f4d56a",
          olive: "#1f7a6a",
          oliveDark: "#7fd4c0",
          cream: "#f4efe3",
          paper: "#1c1f2a",
          rust: "#c4452f",
          slate: "#c4bfb3",
          raised: "#262a38",
        },
      },
      fontFamily: {
        ui: ['"Source Sans 3"', "Segoe UI", "Tahoma", "sans-serif"],
        doc: ['"Source Serif 4"', "Georgia", "Times New Roman", "serif"],
      },
      boxShadow: {
        pane: "inset 0 0 0 1px rgba(226,184,74,0.18)",
        chip: "0 0 0 2px #101218, 0 0 0 4px #f4efe3",
      },
    },
  },
  plugins: [],
};

export default config;
