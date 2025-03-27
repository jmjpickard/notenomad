import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          50: "rgb(var(--tw-primary-50, 240 247 255) / <alpha-value>)",
          100: "rgb(var(--tw-primary-100, 224 240 254) / <alpha-value>)",
          200: "rgb(var(--tw-primary-200, 194 224 251) / <alpha-value>)",
          300: "rgb(var(--tw-primary-300, 158 205 250) / <alpha-value>)",
          400: "rgb(var(--tw-primary-400, 122 179 246) / <alpha-value>)",
          500: "rgb(var(--tw-primary-500, 74 134 232) / <alpha-value>)",
          600: "rgb(var(--tw-primary-600, 58 118 216) / <alpha-value>)",
          700: "rgb(var(--tw-primary-700, 43 93 176) / <alpha-value>)",
          800: "rgb(var(--tw-primary-800, 37 74 138) / <alpha-value>)",
          900: "rgb(var(--tw-primary-900, 33 61 112) / <alpha-value>)",
          DEFAULT: "rgb(var(--tw-primary-500, 74 134 232) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          50: "rgb(var(--tw-secondary-50, 242 247 252) / <alpha-value>)",
          100: "rgb(var(--tw-secondary-100, 227 238 249) / <alpha-value>)",
          200: "rgb(var(--tw-secondary-200, 199 221 242) / <alpha-value>)",
          300: "rgb(var(--tw-secondary-300, 165 200 233) / <alpha-value>)",
          400: "rgb(var(--tw-secondary-400, 117 152 184) / <alpha-value>)",
          500: "rgb(var(--tw-secondary-500, 93 130 163) / <alpha-value>)",
          600: "rgb(var(--tw-secondary-600, 70 92 112) / <alpha-value>)",
          700: "rgb(var(--tw-secondary-700, 55 99 140) / <alpha-value>)",
          800: "rgb(var(--tw-secondary-800, 44 61 79) / <alpha-value>)",
          900: "rgb(var(--tw-secondary-900, 30 42 59) / <alpha-value>)",
          DEFAULT: "rgb(var(--tw-secondary-500, 93 130 163) / <alpha-value>)",
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
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
