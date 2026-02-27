import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-lato)", "Helvetica Neue", "sans-serif"],
        body: ["var(--font-lato)", "Helvetica Neue", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cream: {
          DEFAULT: "#FFF8F0",
          dark: "#F5EDE0",
        },
        warmwhite: "#FFFCF7",
        terra: {
          DEFAULT: "#C8543A",
          light: "#E8745C",
          dark: "#A03A22",
        },
        sage: {
          DEFAULT: "#7A9E7E",
          light: "#A8C5AB",
          dark: "#4E7352",
        },
        honey: {
          DEFAULT: "#D4892A",
          light: "#F0B455",
        },
        espresso: {
          DEFAULT: "#2C1810",
          mid: "#5C3D2E",
          light: "#8B6355",
        },
      },
      backgroundImage: {
        "gradient-hero": "linear-gradient(135deg, #FFF0E0 0%, #FFE4C8 40%, #F5D5B0 100%)",
        "gradient-cta": "linear-gradient(135deg, #C8543A 0%, #D4892A 100%)",
        "gradient-sage": "linear-gradient(135deg, #7A9E7E 0%, #4E7352 100%)",
        "gradient-overlay": "linear-gradient(to top, rgba(44,24,16,0.85) 0%, rgba(44,24,16,0.2) 60%, transparent 100%)",
        "gradient-card": "linear-gradient(160deg, #FFFCF7 0%, #FFF0E0 100%)",
      },
      boxShadow: {
        card: "0 4px 20px rgba(200,84,58,0.12)",
        hover: "0 12px 40px rgba(200,84,58,0.22)",
        soft: "0 8px 24px rgba(44,24,16,0.12)",
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        "fade-up": "fadeUp 0.7s ease-out forwards",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
