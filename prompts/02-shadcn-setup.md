# Step 2: ShadCN UI Setup and Theming

## Overview

This plan outlines the process of initialising ShadCN UI components and configuring a custom theme for the NoteMomad application, including integrating the background image.

## Prerequisites

- T3 stack application with Tailwind CSS already configured
- Node.js and npm installed

## Implementation Steps

### 1. Install ShadCN UI CLI

```bash
# Install ShadCN UI CLI
npm install --save-dev @shadcn/ui
```

### 2. Initialize ShadCN UI

```bash
# Initialize ShadCN UI with the CLI
npx shadcn-ui@latest init
```

During initialization, you'll need to answer several questions:

- **Would you like to use TypeScript?** Yes
- **Which style would you like to use?** Default
- **Which color would you like to use as base color?** Slate
- **Where is your tailwind.config.js located?** tailwind.config.js
- **Configure the import alias for components?** @/components
- **Configure the import alias for utilities?** @/lib/utils
- **Are you using React Server Components?** Yes

### 3. Update Tailwind Configuration for Custom Theme

Create or edit your tailwind.config.js:

```bash
# Edit the tailwind.config.js file
```

Update the content with your custom color palette:

```javascript
import { fontFamily } from "tailwindcss/defaultTheme";

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
        sans: ["var(--font-sans)", ...fontFamily.sans],
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
```

### 4. Create CSS Variables for the Theme

Create or update your global CSS file (e.g., `src/styles/globals.css`):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary-50: 210 100% 97%;
    --primary-100: 210 100% 94%;
    --primary-200: 210 100% 87%;
    --primary-300: 210 100% 80%;
    --primary-400: 214 80% 72%;
    --primary-500: 216 80% 60%;
    --primary-600: 217 80% 54%;
    --primary-700: 218 71% 43%;
    --primary-800: 218 72% 34%;
    --primary-900: 220, 70%, 28%;
    --primary-foreground: 210 40% 98%;

    --secondary-50: 213 80% 97%;
    --secondary-100: 214 68% 93%;
    --secondary-200: 211 63% 87%;
    --secondary-300: 212 53% 78%;
    --secondary-400: 213 31% 59%;
    --secondary-500: 213 30% 50%;
    --secondary-600: 210 19% 36%;
    --secondary-700: 212 47% 38%;
    --secondary-800: 214 23% 24%;
    --secondary-900: 216 26% 17%;
    --secondary-foreground: 210 40% 98%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 217 80% 54%;
    --primary-foreground: 210 40% 98%;

    --secondary: 212 47% 38%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Add background image */
body::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("/src/background2.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.05;
  z-index: -1;
}
```

### 5. Install Required ShadCN UI Components

Install the components you'll need for your application:

```bash
# Install basic UI components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
```

### 6. Create a Theme Provider Component

Create a theme provider component to manage both light and dark modes:

```bash
# Install next-themes
npm install next-themes
```

Create a ThemeProvider component at `src/components/theme-provider.tsx`:

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

### 7. Implement ThemeProvider in Root Layout

Update your root layout to use the ThemeProvider in `src/app/layout.tsx`:

```tsx
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 8. Create Theme Toggle Component

Create a component to toggle between light and dark modes:

```bash
npx shadcn-ui@latest add dropdown-menu
```

Then create a theme toggle component at `src/components/theme-toggle.tsx`:

```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 9. Install Additional Dependencies

```bash
# Install Lucide Icons (used in the theme toggle)
npm install lucide-react

# Install the tailwindcss-animate plugin for animations
npm install tailwindcss-animate
```

### 10. Create a Custom Utils File

Create a utility file for class name merging at `src/lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Install required dependencies:

```bash
npm install clsx tailwind-merge
```

### 11. Move Background Image to Public Directory

Move the background image to the public directory for better accessibility:

```bash
# Create the public/images directory if it doesn't exist
mkdir -p public/images

# Copy the background image
cp src/background2.png public/images/
```

Then update the CSS to reference the new location:

```css
body::before {
  /* ... other properties ... */
  background-image: url("/images/background2.png");
  /* ... other properties ... */
}
```

## Verification

To verify your setup:

1. Run the development server:

```bash
npm run dev
```

2. Create a simple test page with a few components to check that the theming is working correctly.

3. Check both light and dark mode using the theme toggle component.

## Troubleshooting

### CSS Issues

- If the CSS is not applying correctly, check that the globals.css file is imported correctly in your layout.
- Verify that the Tailwind configuration is correct.

### Component Issues

- If components are not rendering correctly, check that they are imported correctly.
- Verify that the ShadCN UI components are installed.

## Next Steps

After setting up ShadCN UI and the theme, proceed to implementing authentication using NextAuth.js.
