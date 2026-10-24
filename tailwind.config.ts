import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17171C",
        chalk: "#F2F2EE",
        stone: "#D9D9D4",
        butter: "#FFDC4A",
        flamingo: "#FF86AD",
        seafoam: "#8FE3CB",
        frost: "#BDE8F2",
        mute: "#5B5B66",
        paper: "#FFFFFF",
        card: "#FFFFFF",
      },
      boxShadow: {
        card: "4px 4px 0 #17171C",
        btn: "3px 3px 0 #17171C",
      },
      borderRadius: {
        card: "20px",
        btn: "14px",
      },
      fontFamily: {
        display: ["var(--font-display)", "Bricolage Grotesque", "sans-serif"],
        sans: ["var(--font-sans)", "Instrument Sans", "sans-serif"],
        mono: ["var(--font-mono)", "DM Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
