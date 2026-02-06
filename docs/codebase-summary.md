# Codebase Summary

## Directory Structure

```
tongkho-web/
├── src/
│   ├── components/
│   │   ├── cards/
│   │   │   └── property-card.astro          # Property listing card (110 LOC)
│   │   ├── footer/
│   │   │   └── footer.astro                 # Footer with links (173 LOC)
│   │   ├── header/
│   │   │   ├── header.astro                 # Main navigation + database menu (94 LOC) [Phase 3]
│   │   │   └── header-mobile-menu.tsx       # Mobile menu (React) (110 LOC)
│   │   └── home/
│   │       ├── hero-section.astro           # Hero banner (32 LOC)
│   │       ├── hero-search.tsx              # Search form (React) (140 LOC)
│   │       ├── featured-project-section.astro # Projects grid (117 LOC)
│   │       ├── properties-section.astro     # Properties grid (64 LOC)
│   │       ├── locations-section.astro      # Location cards (120 LOC)
│   │       ├── customers-section.astro      # Testimonials (65 LOC)
│   │       └── news-section.astro           # News articles (101 LOC)
│   ├── data/
│   │   ├── mock-properties.ts               # Property/project/news mock data (255 LOC)
│   │   ├── menu-data.ts                     # Menu data at build time (78 LOC) [Phase 2]
│   │   └── static-data.ts                   # Static dropdown options (57 LOC) [Phase 3]
│   ├── db/
│   │   ├── index.ts                         # Drizzle ORM database client
│   │   ├── schema/
│   │   │   ├── index.ts                     # Schema exports
│   │   │   ├── menu.ts                      # Menu schema (propertyType, folder)
│   │   │   ├── real-estate.ts               # Real estate property schema
│   │   │   ├── project.ts                   # Project schema
│   │   │   └── news.ts                      # News schema
│   │   └── migrations/
│   │       ├── 0000_peaceful_payback.sql    # Base schema migration
│   │       ├── 0001_add_menu_indexes.sql    # Menu performance indexes
│   │       └── README-MENU-INDEXES.md       # Migration documentation
│   ├── services/
│   │   └── menu-service.ts                  # Menu generation service (384 LOC) [Phase 4]
│   ├── layouts/
│   │   ├── base-layout.astro                # HTML base template (65 LOC)
│   │   └── main-layout.astro                # Header + main + footer (35 LOC)
│   ├── pages/
│   │   ├── index.astro                      # Homepage (32 LOC)
│   │   └── tin-tuc/danh-muc/[folder].astro  # Dynamic folder pages (14 LOC) [Phase 4]
│   ├── styles/
│   │   └── global.css                       # Tailwind + custom styles (118 LOC)
│   ├── types/
│   │   ├── property.ts                      # Property/Project/News interfaces (101 LOC)
│   │   └── menu.ts                          # Menu service + NavItem types (74 LOC) [Phase 3]
│   └── utils/
│       └── format.ts                        # Formatting utilities (94 LOC)
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   └── [images, social media files]
├── .gitignore
├── astro.config.mjs                         # Astro config (React, Tailwind, Sitemap)
├── tailwind.config.mjs                      # Tailwind theme (colors, fonts)
├── tsconfig.json                            # TypeScript + path aliases
├── package.json                             # Dependencies
└── README.md                                # Project documentation
```

**Total:** ~2,500 lines of code (including new database layer)

---

## Component Architecture

### Layout Structure
```
base-layout.astro (HTML <head>, meta tags, fonts)
  └─ main-layout.astro (header + <main> + footer)
      └─ pages/index.astro (homepage content)
```

### Homepage Sections (Astro + React Mix)
```
1. header.astro ──────────────────────────────────────
   - Logo, main nav menu, search icon
   - Responsive (desktop/mobile)

2. hero-section.astro ────────────────────────────────
   - Background image, title, subtitle

3. hero-search.tsx (React) ───────────────────────────
   - Transaction type tabs (buy/rent/project)
   - City filter, property type, price range, area
   - Keyword search, advanced options

4. featured-project-section.astro ────────────────────
   - Project cards grid (image, name, developer, price range)

5. properties-section.astro ──────────────────────────
   - Property cards grid (image, title, price, area, bedrooms)

6. locations-section.astro ──────────────────────────
   - Location cards (city image, name, property count)

7. customers-section.astro ───────────────────────────
   - Testimonial cards

8. news-section.astro ────────────────────────────────
   - News article cards (thumbnail, title, excerpt, date)

9. footer.astro ──────────────────────────────────────
   - Company info, links, contact, social media
```

---

## Data Models & Interfaces

### Property
```typescript
interface Property {
  id: string
  title: string
  slug: string
  type: 'apartment' | 'house' | 'villa' | 'land' | 'office' | 'shophouse' | 'warehouse'
  transactionType: 'sale' | 'rent'
  price: number
  priceUnit: 'VND' | 'billion' | 'million' | 'per_month'
  area: number
  bedrooms?: number
  bathrooms?: number
  address: string
  district: string
  city: string
  description: string
  images: string[]
  thumbnail: string
  features: string[]
  createdAt: string
  isFeatured: boolean
  isHot: boolean
}
```

### Project
```typescript
interface Project {
  id: string
  name: string
  slug: string
  developer: string
  location: string
  city: string
  status: 'upcoming' | 'selling' | 'sold_out' | 'completed'
  totalUnits: number
  priceRange: string
  area: string
  description: string
  images: string[]
  thumbnail: string
  amenities: string[]
  completionDate?: string
  isFeatured: boolean
}
```

### NewsArticle
```typescript
interface NewsArticle {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  thumbnail: string
  category: 'market' | 'policy' | 'tips' | 'project_news' | 'investment'
  author: string
  publishedAt: string
  views: number
}
```

### Location
```typescript
interface Location {
  id: string
  name: string
  slug: string
  image: string
  propertyCount: number
}
```

### SearchFilters
```typescript
interface SearchFilters {
  transactionType: 'sale' | 'rent'
  city?: string
  keyword?: string
  propertyType?: string
  priceMin?: number
  priceMax?: number
  areaMin?: number
  areaMax?: number
}
```

---

## Key Modules

### Menu Service (menu-service.ts) [Phase 4]
**Purpose:** Database-driven navigation menu generation for SSG builds with hierarchical folder support

**Key Functions:**
- `buildMenuStructure()` – Fetch all menu data (property types, news folders) with 1-hour caching
- `buildMainNav()` – Generate NavItem[] structure for header components with nested children
- `fetchPropertyTypesByTransaction()` – Query property types by transaction (buy/rent/project)
- `fetchNewsFolders()` – Query news folders with parent-child hierarchy
- `fetchSubFolders()` – Recursively fetch sub-folders for hierarchical menu items
- `folderToNavItem()` – Recursively transform MenuFolder to NavItem with nested children
- `clearMenuCache()` – Manual cache invalidation
- `getFallbackMenu()` – Fallback menu if database unavailable

**Features:**
- In-memory caching during build (configurable 1-hour TTL default)
- Hierarchical folder support (parent-child relationships with unlimited depth)
- Recursive sub-folder fetching for nested navigation menus
- Type-safe transformations to NavItem interface
- Graceful error handling with fallback menus
- Parallel data fetching via Promise.all()

**Usage:** Called during Astro build to generate dynamic navigation menus

### Menu Schema (menu.ts) [NEW - Phase 1]
**Tables:**
- `propertyType` – Maps V1 property_type table (id, title, parentId, transactionType, vietnamese, slug, aactive)
- `folder` – Maps V1 folder table (id, parent, name, label, publish, displayOrder)

**Indexes:** Added in migration 0001_add_menu_indexes.sql for performance

### Menu Data (menu-data.ts) [NEW - Phase 2]
**Purpose:** Fetch menu data from database at build time for Astro SSG

**Key Functions:**
- `getMainNavItems()` – Async function that fetches menu items during Astro build
  - Returns database-driven menu via `buildMainNav()` from menu-service.ts
  - Falls back to `FALLBACK_MENU` if database unavailable
  - Logs fetch duration and item count for debugging
  - Sanitizes errors to avoid exposing database credentials

**Features:**
- Graceful error handling with built-in fallback menu
- Build-time only execution (no runtime database calls)
- Console logging for build troubleshooting
- Safe error messages (no stack trace leaks)

**Usage:** Imported by header, footer components during build process

### Static Data (static-data.ts) [NEW - Phase 3]
**Purpose:** Centralized static dropdown options for filters (non-database-driven)

**Exports:**
- `cities[]` – Available cities (Hà Nội, TP.HCM, Đà Nẵng, etc.)
- `propertyTypes[]` – Property type options (Căn hộ, Nhà riêng, Biệt thự, etc.)
- `priceRanges[]` – Price bracket options (Dưới 500M, 500M-1T, 1-2T, etc.)
- `areaRanges[]` – Area bracket options (<30m², 30-50m², 50-80m², etc.)

**Data Structure:**
```typescript
interface StaticOption {
  value: string;
  label: string;
}
```

**Usage:** Imported by hero-search, filter components for UI dropdowns
**Note:** Separate from menu-data.ts (database-driven nav); purely static UI options

### Mock Data (mock-properties.ts)
**Purpose:** Sample data for development & demo

**Exports:**
- `mockProperties[]` – 20-30 property examples
- `mockProjects[]` – 10-15 project examples
- `mockNews[]` – 8-10 news articles
- `mockLocations[]` – 5-8 location cards

**Usage:** Renders property/project/news grids on homepage

### Formatting Utilities (format.ts)
**Purpose:** Vietnamese localization & text formatting

**Functions:**
- `formatPrice(price, unit)` – "5.5 tỷ", "500 triệu", "15 triệu/tháng"
- `formatNumber(num)` – Vietnamese thousand separators
- `formatDate(dateStr)` – "28 tháng 1 năm 2026"
- `formatRelativeTime(dateStr)` – "2 ngày trước", "Hôm qua"
- `truncateText(text, maxLength)` – Ellipsis truncation
- `generateSlug(text)` – Vietnamese → ASCII slug (dấu → no-dau)

**Usage:** Imported in component templates & React components

---

## Styling Strategy

### Tailwind Configuration (tailwind.config.mjs)
**Primary Color Palette:**
- Primary (orange): #f97316 (500 shade)
- Secondary (slate): #64748b (500 shade)
- Gradients & shades: 50-900 scales

**Typography:**
- Sans: Inter (default)
- Heading: Be Vietnam Pro

**Container:**
- Responsive padding: 1rem → 5rem
- Max-width centered layout

### Global Styles (global.css)
**Custom CSS:**
- Tailwind @apply directives
- Custom component classes (e.g., `.btn`, `.card`)
- Font imports (Inter, Be Vietnam Pro)
- Responsive utility overrides

---

## Build & Deployment

### Build Process
1. **Check:** `astro check` (TypeScript validation)
2. **Build:** `astro build` (generates `/dist` static output)
3. **Output:** Zero JavaScript (all React prerendered)

### Configuration (astro.config.mjs)
- **Site:** https://tongkhobds.com
- **Output:** `static` (no SSR/SSG required)
- **Integrations:**
  - `@astrojs/react` (prerender React components)
  - `@astrojs/tailwind` (auto-inject Tailwind)
  - `@astrojs/sitemap` (dynamic XML sitemap)
- **Vite:** SSR external modules exclude `@radix-ui/*`

### Scripts (package.json)
```bash
npm run dev      # Local dev server (hot reload)
npm run build    # TypeScript check + build
npm run preview  # Preview dist/ locally
npm run astro    # Astro CLI commands
```

---

## TypeScript Path Aliases (tsconfig.json)

| Alias | Path |
|---|---|
| `@/*` | `src/*` |
| `@components/*` | `src/components/*` |
| `@layouts/*` | `src/layouts/*` |
| `@assets/*` | `src/assets/*` |
| `@data/*` | `src/data/*` |
| `@utils/*` | `src/utils/*` |

**Usage:** Import like `import { formatPrice } from '@utils/format'`

---

## Dependencies Summary

| Package | Version | Purpose |
|---|---|---|
| astro | 5.2.0 | Static site generator |
| react | 19.0.0 | Interactive components |
| react-dom | 19.0.0 | React rendering |
| tailwindcss | 3.4.0 | CSS framework |
| typescript | 5.7.0 | Type safety |
| @astrojs/react | 4.2.0 | Astro-React integration |
| @astrojs/tailwind | 6.0.0 | Astro-Tailwind integration |
| @astrojs/sitemap | 3.3.0 | Dynamic sitemap generation |
| @types/react | 19.0.0 | React TypeScript definitions |
| @iconify-json/lucide | 1.2.0 | Icon library |

**Dev Dependencies:**
- `@astrojs/check` – TypeScript validation
- `autoprefixer` – CSS vendor prefixes

---

## Performance Characteristics

| Metric | Target |
|---|---|
| Homepage load | <2 seconds (static HTML) |
| Bundle size | <3MB (dist/) |
| Lighthouse Performance | >90 |
| JavaScript | 0 bytes (all static) |
| Time to Interactive | <1 second |

---

## Document History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-01-28 | Initial codebase documentation |
| 1.1 | 2026-02-06 | Phase 1 complete: Added menu service layer, database schema (propertyType, folder), Drizzle ORM integration, menu type definitions |
| 1.2 | 2026-02-06 | Phase 2 complete: Added menu-data.ts module for build-time menu generation with fallback support |
| 1.3 | 2026-02-06 | Phase 3 complete: Extracted static-data.ts for filter options; NavItem interface moved to menu.ts; header components updated to use database-driven menu |
| 1.4 | 2026-02-06 | Phase 4 complete: Hierarchical news folder support; Added MenuFolder.subFolders field for nested categories; fetchSubFolders() for recursive queries; Dynamic folder pages at /tin-tuc/danh-muc/[folder]; 27 static pages generated at build time |
