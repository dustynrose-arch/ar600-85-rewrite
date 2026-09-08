import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        army: {
          black: "#1f2f24",
          ink: "#1a1f1c",
          gold: "#c9a227",
          goldDark: "#b8943a",
          olive: "#3d4a2e",
          oliveDark: "#243628",
          cream: "#f7f4ec",
          paper: "#fbf8f1",
          rust: "#8b2e1f",
          slate: "#4a463c",
          header: "#1f2f24",
          wash: "#f6f1e3",
          draft: "#f3e6c4",
          draftInk: "#5c4a18",
          lock: "#f0e2dc",
          lockInk: "#5a3228",
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
