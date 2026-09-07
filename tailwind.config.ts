import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        army: {
          black: "#161410",
          ink: "#1c1a14",
          gold: "#c5a14a",
          goldDark: "#8d7328",
          olive: "#3d4a2e",
          oliveDark: "#2a3320",
          cream: "#f4f1ea",
          paper: "#fbf8f1",
          rust: "#8b2e1f",
          slate: "#4a463c",
        },
      },
      fontFamily: {
        ui: ['"Source Sans 3"', "Segoe UI", "Tahoma", "sans-serif"],
        doc: ['"Source Serif 4"', "Georgia", "Times New Roman", "serif"],
      },
      boxShadow: {
        pane: "inset 0 0 0 1px rgba(22,20,16,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
