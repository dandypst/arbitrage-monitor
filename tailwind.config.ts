import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0A0C10",
        panel: "#12161D",
        panelBorder: "#212734",
        ink: "#E7EAEF",
        mute: "#69707F",
        signal: "#2ED37A",
        alarm: "#FF5C5C",
        amber: "#F5A623",
        wire: "#3E7BFA",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
