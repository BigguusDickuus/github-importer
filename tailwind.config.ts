typescript;
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/*/.{ts,tsx}", "./components/*/.{ts,tsx}", "./app/*/.{ts,tsx}", "./src/*/.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Paleta Noite Cósmica (cores diretas hex)
        "night-sky": "#050816",
        "midnight-surface": "#101322",
        "mystic-indigo": {
          DEFAULT: "#6366F1",
          dark: "#4F46E5",
        },
        "oracle-ember": "#F97316",
        "starlight-text": "#F9FAFB",
        "moonlight-text": "#9CA3AF",
        "obsidian-border": "#1F2933",
        "verdant-success": "#22C55E",
        "solar-warning": "#FACC15",
        "blood-moon-error": "#EF4444",

        // Shadcn colors (sobrescrevendo com nossas cores)
        border: "#1F2933",
        input: "#1F2933",
        ring: "#6366F1",
        background: "#050816",
        foreground: "#F9FAFB",
        primary: {
          DEFAULT: "#6366F1",
          foreground: "#F9FAFB",
        },
        secondary: {
          DEFAULT: "#101322",
          foreground: "#F9FAFB",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#F9FAFB",
        },
        muted: {
          DEFAULT: "#1F2933",
          foreground: "#9CA3AF",
        },
        accent: {
          DEFAULT: "#1F2933",
          foreground: "#F9FAFB",
        },
        popover: {
          DEFAULT: "#101322",
          foreground: "#F9FAFB",
        },
        card: {
          DEFAULT: "#101322",
          foreground: "#F9FAFB",
        },
      },
      spacing: {
        touch: "44px",
      },
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
