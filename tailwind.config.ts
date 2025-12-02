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
        // Paleta Noite Cósmica - NOMES CUSTOM
        "night-sky": "#050816",
        "midnight-surface": "#101322",
        "mystic-indigo": "#6366F1",
        "mystic-indigo-dark": "#4F46E5",
        "oracle-ember": "#F97316",
        "starlight-text": "#F9FAFB",
        "moonlight-text": "#9CA3AF",
        "obsidian-border": "#1F2933",
        "verdant-success": "#22C55E",
        "solar-warning": "#FACC15",
        "blood-moon-error": "#EF4444",

        // Shadcn colors - USA AS VARS
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
