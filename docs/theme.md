# Theme Documentation

This document provides comprehensive guidance on theming, styling, and light/dark mode implementation in the SoundStation application.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Color System & CSS Variables](#color-system--css-variables)
- [Light/Dark Mode Implementation](#lightdark-mode-implementation)
- [Component Styling Patterns](#component-styling-patterns)
- [Best Practices](#best-practices)
- [Quick Reference](#quick-reference)

## Architecture Overview

The application uses a modern theming system built on:
- **Tailwind CSS v4** with CSS variables for dynamic theming
- **Custom CSS properties** defined in `src/styles/app.css`
- **React Context** for theme state management (`ThemeProvider`)
- **Server-side theme persistence** using cookies
- **System preference detection** with automatic fallback

### Tech Stack
- **Tailwind CSS v4**: Utility-first CSS framework with CSS variable integration
- **PostCSS**: CSS processing with `@tailwindcss/postcss` plugin
- **OKLCH Color Space**: Modern color space for better color manipulation
- **CVA (Class Variance Authority)**: Type-safe component variants
- **clsx + tailwind-merge**: Utility for conditional CSS class merging

## Color System & CSS Variables

### CSS Variable Structure

The theme system uses CSS custom properties that map to Tailwind's color tokens. Located in `src/styles/app.css`:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  /* ... more variables */
}
```

### Color Definitions

#### Light Theme (`:root`)
```css
:root {
  --background: oklch(1 0 0);                    /* Pure white */
  --foreground: oklch(0.141 0.005 285.823);      /* Dark slate */
  --primary: oklch(0.637 0.237 25.331);          /* Orange primary */
  --card: oklch(1 0 0);                          /* White cards */
  --border: oklch(0.92 0.004 286.32);           /* Light gray borders */
  /* ... more colors */
}
```

#### Dark Theme (`.dark`)
```css
.dark {
  --background: oklch(0.141 0.005 285.823);      /* Dark slate */
  --foreground: oklch(0.985 0 0);                /* Near white */
  --primary: oklch(0.637 0.237 25.331);          /* Same orange (consistent) */
  --card: oklch(0.21 0.006 285.885);            /* Dark cards */
  --border: oklch(1 0 0 / 10%);                 /* Subtle borders */
  /* ... more colors */
}
```

### Key Color Categories

1. **Background Colors**: `background`, `card`, `popover`
2. **Text Colors**: `foreground`, `muted-foreground`, `card-foreground`
3. **Interactive Colors**: `primary`, `secondary`, `accent`, `destructive`
4. **Semantic Colors**: `border`, `input`, `ring`, `destructive`
5. **Sidebar Colors**: `sidebar-*` variants for navigation
6. **Chart Colors**: `chart-1` through `chart-5` for data visualization

## Light/Dark Mode Implementation

### Theme Provider Setup

The theme system consists of three main parts:

#### 1. Server Functions (`src/components/theme-provider.tsx`)
```typescript
// Server function to get theme from cookie
export const getThemeFn = createServerFn().handler(async () => {
  const theme = getCookie(THEME_COOKIE_NAME);
  return theme ?? "system";
});

// Server function to set theme cookie
export const setThemeFn = createServerFn({ method: "POST" })
  .validator(z.object({ theme: z.enum(["dark", "light", "system"]) }))
  .handler(async ({ data }) => {
    setCookie(THEME_COOKIE_NAME, data.theme);
    return data.theme;
  });
```

#### 2. Theme Provider Component
- Manages theme state with React Context
- Listens to system preference changes
- Applies theme classes to `document.documentElement`
- Syncs with server-side cookies

#### 3. SSR Theme Script
Located in `src/routes/__root.tsx`, prevents flash of unstyled content:

```javascript
// Inline script that runs before React hydration
(function() {
  const THEME_COOKIE_NAME = 'ui-theme';
  let theme = document.cookie.match(new RegExp('(^| )' + THEME_COOKIE_NAME + '=([^;]+)'))?.[2];
  
  let resolvedTheme;
  let root = document.documentElement;
  
  // Clear existing theme classes
  root.classList.remove('light', 'dark');
  
  if (!theme || theme === 'system') {
    // Use system preference
    resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    resolvedTheme = theme;
  }
  
  root.classList.add(resolvedTheme);
})();
```

### Theme Toggle Component

The `ModeToggle` component (`src/components/mode-toggle.tsx`) provides a dropdown menu for theme switching:

```tsx
export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {/* Icons that transition based on theme */}
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Component Styling Patterns

### 1. Base Styling with CSS Variables

All components use Tailwind utilities that reference CSS variables:

```tsx
// Card component using theme-aware background and text colors
<div className="bg-card text-card-foreground border border-border rounded-lg">
  Content here adapts to light/dark theme automatically
</div>
```

### 2. Variant-Based Components (CVA Pattern)

Components like Button use Class Variance Authority for type-safe variants:

```tsx
const buttonVariants = cva(
  // Base styles with theme-aware properties
  "inline-flex items-center justify-center rounded-md transition-all disabled:opacity-50 focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
      }
    }
  }
);
```

### 3. Conditional Dark Mode Styles

Use `dark:` prefix for dark mode specific styles:

```tsx
// Button with different dark mode behavior
<Button className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
  Adapts to theme
</Button>
```

### 4. Theme-Aware Hover States

Components include proper hover states for both themes:

```tsx
// Card with theme-aware hover effects
<div className="hover:shadow-lg hover:border-border/60 transition-all group">
  <div className="group-hover:scale-105 transition-transform" />
</div>
```

### 5. Focus States with Ring Colors

Consistent focus indicators using the `ring` color variable:

```tsx
<button className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" />
```

## Best Practices

### 1. Always Use CSS Variables
 **Good**: `bg-background text-foreground`
L **Bad**: `bg-white text-black`

### 2. Provide Dark Mode Variants When Needed
```tsx
// When CSS variables don't cover your use case
<div className="bg-gray-100 dark:bg-gray-800" />
```

### 3. Use Semantic Color Names
```tsx
// Use semantic names that work across themes
<div className="bg-card border-border text-card-foreground" />
```

### 4. Include Proper Transitions
```tsx
// Smooth theme transitions
<div className="bg-card transition-colors duration-200" />
```

### 5. Test Both Themes
Always test components in both light and dark modes, including:
- Color contrast ratios
- Hover/focus states
- Loading states
- Interactive elements

### 6. Handle System Preference Changes
Components should work with all three theme modes:
- `light`: Force light theme
- `dark`: Force dark theme  
- `system`: Follow OS preference (can change dynamically)

### 7. Use the cn() Utility
For conditional classes and proper class merging:

```tsx
import { cn } from "~/lib/utils";

function MyComponent({ className, variant }: Props) {
  return (
    <div className={cn(
      "base-classes",
      variant === "primary" && "primary-classes",
      className
    )} />
  );
}
```

## Quick Reference

### Essential Theme Colors
```css
/* Backgrounds */
bg-background        /* Main app background */
bg-card             /* Card/panel backgrounds */
bg-muted            /* Muted/disabled backgrounds */
bg-popover          /* Popover/dropdown backgrounds */

/* Text Colors */
text-foreground     /* Primary text */
text-muted-foreground /* Secondary/muted text */
text-card-foreground /* Text on cards */

/* Interactive Colors */
bg-primary text-primary-foreground    /* Primary actions */
bg-secondary text-secondary-foreground /* Secondary actions */
bg-accent text-accent-foreground      /* Accented elements */
bg-destructive text-white             /* Destructive actions */

/* Borders & Outlines */
border-border       /* Standard borders */
border-input        /* Input field borders */
ring-ring          /* Focus ring color */
```

### Common Component Patterns

#### Card Component
```tsx
<div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm">
  <div className="p-6">
    <h3 className="font-semibold">Card Title</h3>
    <p className="text-muted-foreground">Card description</p>
  </div>
</div>
```

#### Button Component
```tsx
// Primary button
<button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
  Primary Action
</button>

// Outline button  
<button className="border border-border bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md">
  Secondary Action
</button>
```

#### Input Component
```tsx
<input className="bg-background border border-input text-foreground px-3 py-2 rounded-md focus:ring-2 focus:ring-ring focus:ring-offset-2" />
```

#### Theme Toggle Integration
```tsx
// In your header or settings
import { ModeToggle } from "~/components/mode-toggle";

<nav className="flex items-center gap-4">
  {/* Other nav items */}
  <ModeToggle />
</nav>
```

### Custom Animations
The theme includes custom animations for enhanced UX:

```css
/* Available custom animations */
.animate-fadeIn      /* Fade in effect */
.animate-fadeInUp    /* Fade in with upward motion */
.shake              /* Shake animation for errors */
.animation-delay-100 /* 0.1s animation delay */
```

### File Structure Summary
```
src/
   styles/
      app.css                 # Main CSS with theme variables
   components/
      theme-provider.tsx      # Theme context and management  
      mode-toggle.tsx         # Theme switching component
      ui/                     # Base UI components with theming
   lib/
      utils.ts               # cn() utility function
   routes/
       __root.tsx             # SSR theme script
```

This theming system provides a robust, accessible, and maintainable approach to handling light/dark modes while ensuring consistent visual design across the entire application.