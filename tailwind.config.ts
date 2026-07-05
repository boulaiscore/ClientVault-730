import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f7f8fb",
        foreground: "#17202a",
        surface: "#ffffff",
        muted: "#eef2f7",
        "muted-foreground": "#667085",
        border: "#d8dee8",
        primary: "#1f6feb",
        "primary-foreground": "#ffffff"
      },
      boxShadow: {
        soft: "0 8px 30px rgba(15, 23, 42, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
