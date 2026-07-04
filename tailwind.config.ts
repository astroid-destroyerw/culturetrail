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
        background: "var(--background)",
        foreground: "var(--foreground)",
        accent: "var(--accent)",
        // Surface layers — Tailwind classes: bg-surface-1, bg-surface-2, bg-surface-3
        surface: {
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        accent: "var(--shadow-accent)",
        card: "0 2px 12px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)",
        "card-hover": "0 6px 24px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.25)",
      },
      borderColor: {
        DEFAULT: "var(--border)",
        hover: "var(--border-hover)",
      },
      lineHeight: {
        relaxed: "1.65",
        loose: "1.8",
      },
    },
  },
  plugins: [],
};
export default config;
