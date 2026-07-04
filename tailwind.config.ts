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
        surface: {
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        accent: "var(--shadow-accent)",
        card: "0 2px 12px rgba(50,30,10,0.10), 0 1px 3px rgba(50,30,10,0.07)",
        "card-hover": "0 6px 28px rgba(50,30,10,0.14), 0 2px 8px rgba(50,30,10,0.08)",
      },
      borderColor: {
        DEFAULT: "var(--border)",
        hover: "var(--border-hover)",
      },
      lineHeight: {
        relaxed: "1.70",
        loose: "1.85",
      },
    },
  },
  plugins: [],
};
export default config;
