# Project Guidelines

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Package Manager**: pnpm

## Commands

```bash
pnpm dev          # Start development server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript type check (tsc --noEmit)
```

## Project Structure

```
app/
├── layout.tsx          # Root layout (html + body tags required)
├── page.tsx            # Home page
├── globals.css         # Global styles — import Tailwind here
├── (routes)/
│   └── [slug]/
│       └── page.tsx
components/
├── ui/                 # Reusable UI primitives
└── [feature]/          # Feature-specific components
lib/                    # Utilities, helpers, shared logic
types/                  # Shared TypeScript types
public/                 # Static assets
```

## TypeScript

- Always type component props explicitly
- Use `React.ReactNode` for children props

```typescript
interface Props {
  children: React.ReactNode;
  title: string;
  count?: number;
}

export default function MyComponent({ children, title, count = 0 }: Props) {
  // ...
}
```

## Tailwind CSS v4

Tailwind v4 uses a CSS-first config — no `tailwind.config.js` needed.

Import in `app/globals.css`:

```css
@import 'tailwindcss';
```

PostCSS config (`postcss.config.mjs`):

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

Custom theme tokens go in `globals.css` using CSS variables:

```css
@import 'tailwindcss';

@theme {
  --color-brand: #6366f1;
  --font-sans: 'Inter', sans-serif;
}
```

## Next.js App Router Conventions

- `layout.tsx` — shared UI for a segment and its children
- `page.tsx` — unique UI for a route (makes the route publicly accessible)
- `loading.tsx` — Suspense boundary for a segment
- `error.tsx` — Error boundary (`"use client"` required)
- `not-found.tsx` — 404 UI for a segment

Root layout must define `<html>` and `<body>` tags:

```typescript
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
```

## Server vs Client Components

- **Default**: Server Components — use for data fetching, static rendering
- **`"use client"`**: Only when you need interactivity, browser APIs, or React hooks
- Keep `"use client"` boundaries as low in the tree as possible

## Code Style

- Named exports for components; default export for route files (`page.tsx`, `layout.tsx`)
- Co-locate component-specific logic and types in the same file
