import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy:     "#1A2E44",
        evergreen: "#2E6B5E",
        paper:    "#FAF7F2",
        amber:    "#C8922A",
        ink:      "#0B1B2B",
        cream:    "#F5F1E8",
        rust:     "#8B4A2F",
      },
    },
  },
  plugins: [],
};
export default config;
