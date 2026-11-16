import type { Config } from "tailwindcss";

// Palette Haddaj : noir profond + or champagne, gris clairs. Les noms (bordeaux, or…) sont conservés
// pour ne pas toucher aux composants : « bordeaux » = noir / gris anthracite.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", md: "2rem", xl: "3rem" },
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        bordeaux: {
          50: "#F6F6F4",
          100: "#ECEBE8",
          200: "#D7D5D0",
          300: "#B4B1AA",
          400: "#8B8780",
          500: "#5E5B55",
          600: "#3E3C38",
          700: "#2B2A27",
          800: "#1C1B1A",
          900: "#121212",
          950: "#0A0A0A",
        },
        or: {
          50: "#FBF7EE",
          100: "#F5ECD8",
          200: "#EBD8AE",
          300: "#DEC083",
          400: "#D0A85D",
          500: "#C0913F",
          600: "#A2762F",
          700: "#835E27",
          800: "#634721",
          900: "#43301A",
        },
        ivoire: "#FAFAF8",
        champagne: "#F3F1EC",
        sable: "#E6E3DD",
        encre: "#141414",
        taupe: "#6B6862",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        script: ["var(--font-script)", "cursive"],
      },
      letterSpacing: {
        luxe: "0.25em",
      },
      transitionTimingFunction: {
        luxe: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "ken-burns": {
          "0%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        // Petite vibration périodique pour attirer l'attention (bouton Commander)
        attention: {
          "0%, 78%, 100%": { transform: "translateX(0) rotate(0)" },
          "80%": { transform: "translateX(-4px) rotate(-1deg)" },
          "83%": { transform: "translateX(4px) rotate(1deg)" },
          "86%": { transform: "translateX(-3px) rotate(-0.5deg)" },
          "89%": { transform: "translateX(3px) rotate(0.5deg)" },
          "92%": { transform: "translateX(-1px)" },
        },
      },
      animation: {
        "ken-burns": "ken-burns 7s cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 1.6s linear infinite",
        marquee: "marquee 40s linear infinite",
        attention: "attention 3.5s ease-in-out 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
