# MarketHub Frontend Redesign — Design Doc

**Date:** 2026-03-08
**Scope:** Visual overhaul (Approach B) + search debounce with autocomplete suggestions
**Goal:** Modern, portfolio-worthy UI with an indigo/violet accent theme

---

## 1. Color System

Replace the neutral-only OKLCH shadcn palette with an indigo/violet accent system.

| Token | Light Mode Value | Usage |
|-------|-----------------|-------|
| `--primary` | `oklch(0.511 0.262 276)` — Indigo 600 | Buttons, links, active states |
| `--primary-foreground` | White | Text on primary |
| `--accent` | `oklch(0.627 0.265 303)` — Violet 500 | Highlights, badges, glow effects |
| `--background` | `oklch(0.984 0.003 247)` — Slate 50 | Page background |
| `--card` | White | Card backgrounds |
| `--muted` | Slate 100 | Subtle fills |
| `--border` | Slate 200 | Borders |

Dark mode uses `oklch(0.13 0.02 260)` (deep slate) for backgrounds with indigo accents staying vibrant.

**Visual changes driven by color:**
- Logo icon: indigo fill
- "MarketHub" brand text: indigo→violet gradient (`bg-clip-text text-transparent`)
- Category badges: soft indigo pills (`bg-indigo-50 text-indigo-700 border-indigo-200`)
- Price text: `text-indigo-600 font-bold`
- Cart badge count: indigo background
- Sign In button: filled indigo instead of outline

---

## 2. Header

**Frosted glass effect:** `sticky top-0 backdrop-blur-md bg-white/80 dark:bg-slate-900/80` replaces the plain white background. Bottom border becomes `border-indigo-100` in light mode.

**Logo:** `ShoppingBag` icon with indigo fill. "MarketHub" text gets the indigo→violet gradient.

**Nav links:** `hover:text-indigo-600` + animated underline via `after:` pseudo-element sliding in from left.

**Search bar:** Width expanded to `max-w-lg`. Gains `focus-within:ring-2 focus-within:ring-indigo-500` ring. Hosts the new suggestion dropdown (see Section 5).

**Sign In button:** `variant="default"` with indigo primary color instead of `variant="outline"`.

**Cart badge:** Count pill changes to indigo background.

No structural changes — sticky positioning, mobile nav drawer, and layout remain the same.

---

## 3. Hero Section

**Background:** Radial mesh gradient (CSS only, no images):
```css
background: radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.511 0.262 276 / 0.15), transparent),
            radial-gradient(ellipse 60% 40% at 80% 60%, oklch(0.627 0.265 303 / 0.08), transparent);
```
Layered over a subtle dot-grid pattern using CSS `background-image: radial-gradient(...)`.

**Size:** `py-32` (up from `py-20`).

**Heading:** `text-5xl sm:text-6xl lg:text-7xl`, tighter tracking (`tracking-tight`). Key word(s) get the indigo→violet gradient treatment.

**Subheading:** `text-xl` with `max-w-2xl`.

**CTA button:** Large indigo gradient button with shimmer on hover. Arrow icon animates `translate-x-1` on `group-hover`.

**Trust pills:** Row of 3 stat chips below CTA:
- `✦ 10,000+ Products`
- `✦ Secure Checkout`
- `✦ Fast Delivery`

Styled as `bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-4 py-1 text-sm`.

---

## 4. Product Cards

**Shape:** `rounded-2xl` corners, white background, `border-slate-200`.

**Hover state (three simultaneous effects):**
1. Card lifts: `hover:shadow-xl hover:shadow-indigo-500/10`
2. Image zooms: `scale-105 transition-transform duration-300` on the `<Image>`
3. Ring appears: `hover:ring-1 hover:ring-indigo-200`

**Image area:** `aspect-[4/3]` (replaces `aspect-square`). Background: `bg-slate-50`.

**Category badge:** `bg-indigo-50 text-indigo-700 border border-indigo-200` pill.

**Price:** `text-indigo-600 font-bold text-xl`.

**"Add to Cart" reveal (desktop only):** Ghost indigo button at card bottom, `opacity-0 group-hover:opacity-100 transition-opacity duration-200`. On mobile, the card links to detail page as before.

**Out of stock:** Red destructive badge retained. Card gets `opacity-60 grayscale-[30%]` overlay.

---

## 5. Search — Debounce + Autocomplete Suggestions

### Functional Behavior

- **Debounce:** 300ms after last keystroke before firing the suggestions query.
- **Trigger:** Input focused + ≥ 2 characters typed.
- **Data source:** Existing `GET /products?q=...&limit=5` endpoint — **no backend changes**.
- **Dismiss:** `Escape` key or click outside closes dropdown.
- **Keyboard nav:** `↑↓` arrows move between suggestions, `Enter` on a suggestion navigates to that product.

### Dropdown UI

```
┌─────────────────────────────────┐
│ 🔍  Results for "mac"           │
├─────────────────────────────────┤
│  MacBook Pro 14"                │
│  MacBook Air M2                 │
│  Mac Mini                       │
│  Magic Mouse                    │
│  Magic Keyboard                 │
├─────────────────────────────────┤
│  Press Enter to search all →   │
└─────────────────────────────────┘
```

- Clicking a suggestion → navigates to `/products/[id]`
- Clicking footer / pressing `Enter` → navigates to `/products?q=...` (existing search)
- Loading: subtle spinner on the right side of the input

### New Files

| File | Purpose |
|------|---------|
| `hooks/use-debounce.ts` | Generic debounce hook |
| `hooks/use-search-suggestions.ts` | React Query hook hitting `/products?q=...&limit=5` |
| `components/layout/search-suggestions.tsx` | Dropdown suggestion panel |

### Modified Files

| File | Change |
|------|--------|
| `components/layout/search-bar.tsx` | Integrate debounce, open/close state, keyboard nav, spinner |

---

## 6. Files to Modify (Summary)

| File | Change |
|------|--------|
| `app/globals.css` | New OKLCH color tokens (indigo/violet/slate palette) |
| `app/page.tsx` | New hero section (gradient bg, larger heading, trust pills) |
| `components/layout/header.tsx` | Frosted glass, gradient logo, indigo nav styles |
| `components/layout/search-bar.tsx` | Debounce integration, suggestion dropdown |
| `components/products/product-card.tsx` | Hover effects, new badge/price styles, Add to Cart reveal |
| `components/products/product-grid.tsx` | Minor spacing/gap adjustments if needed |

### New Files

| File | Purpose |
|------|---------|
| `hooks/use-debounce.ts` | 300ms debounce utility |
| `hooks/use-search-suggestions.ts` | React Query suggestions fetcher |
| `components/layout/search-suggestions.tsx` | Suggestion dropdown component |

---

## Out of Scope

- Backend changes (no new endpoints needed)
- Routing or data fetching changes
- Product detail page redesign
- Cart / checkout / orders pages
- Authentication flow pages
