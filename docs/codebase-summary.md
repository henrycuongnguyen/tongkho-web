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
│   │   │   ├── header.astro                 # Main navigation (95 LOC)
│   │   │   ├── header-mobile-menu.tsx       # Mobile menu (React) (110 LOC)
│   │   │   └── header-nav-data.ts           # Nav/filter data (109 LOC)
│   │   └── home/
│   │       ├── hero-section.astro           # Hero banner (32 LOC)
│   │       ├── hero-search.tsx              # Search form (React) (140 LOC)
│   │       ├── featured-project-section.astro # Projects grid (117 LOC)
│   │       ├── properties-section.astro     # Properties grid (64 LOC)
│   │       ├── locations-section.astro      # Location cards (120 LOC)
│   │       ├── customers-section.astro      # Testimonials (65 LOC)
│   │       └── news-section.astro           # News articles (101 LOC)
│   ├── data/
│   │   └── mock-properties.ts               # Property/project/news mock data (255 LOC)
│   ├── layouts/
│   │   ├── base-layout.astro                # HTML base template (65 LOC)
│   │   └── main-layout.astro                # Header + main + footer (35 LOC)
│   ├── pages/
│   │   └── index.astro                      # Homepage (32 LOC)
│   ├── services/
│   │   ├── elasticsearch/                    # Elasticsearch services (modular)
│   │   │   ├── base.service.ts              # Base class (~100 LOC)
│   │   │   ├── property.service.ts          # Property searches (~170 LOC)
│   │   │   ├── project.service.ts           # Project searches (~40 LOC)
│   │   │   ├── location.service.ts          # Location searches (~60 LOC)
│   │   │   ├── seo.service.ts               # SEO metadata (~30 LOC)
│   │   │   ├── constants.ts                 # ES indices & types (~80 LOC)
│   │   │   └── index.ts                     # Barrel export (~50 LOC)
│   │   ├── postgres-news-project-service.ts  # PostgreSQL news/projects service (298 LOC)
│   │   └── postgres-property-service.ts      # PostgreSQL properties service
│   ├── styles/
│   │   └── global.css                       # Tailwind + custom styles (118 LOC)
│   ├── types/
│   │   └── property.ts                      # TypeScript interfaces (101 LOC)
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

**Total:** ~2,500 lines of code (including backend services)

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

### Navigation Data (header-nav-data.ts)
**Purpose:** Centralized navigation structure & filter options

**Exports:**
- `mainNavItems[]` – Menu structure (trang chủ, mua bán, cho thuê, dự án, etc.)
- `cities[]` – Available cities for filtering
- `propertyTypes[]` – Property type options
- `priceRanges[]` – Price bracket options
- `areaRanges[]` – Area bracket options

**Usage:** Imported by header, hero-search, filter components

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

### Backend Services (services/)
**Purpose:** Data fetching from external databases

#### Elasticsearch Services (elasticsearch/)
**Architecture:** Modular services with shared base class
**Connection:** REST API via `fetch` (no client library)
- Uses `ES_URL`, `ES_INDEX`, `ES_API_KEY` environment variables
- Authentication: `Authorization: ApiKey ${apiKey}` header

**Module Structure:**
- `constants.ts` - ES_INDICES, mappings, TypeScript types
- `base.service.ts` - ElasticsearchBaseService (shared search logic)
- `property.service.ts` - ElasticsearchPropertyService (singleton)
- `project.service.ts` - ElasticsearchProjectService (singleton)
- `location.service.ts` - ElasticsearchLocationService (singleton)
- `seo.service.ts` - ElasticsearchSeoService (singleton)
- `index.ts` - Barrel export for clean imports

**Available Indices (ES_INDICES constant):**
- `PROPERTIES` - "real_estate" (property listings)
- `PROJECTS` - "project" (real estate projects)
- `LOCATIONS` - "locations" (location/area data)
- `SEO_META` - "seo_meta_data" (SEO metadata)

**Property Service Methods:**
- `searchProperties(transactionType, limit)` – Search by sale/rent
- `mapToProperty(hit)` – Transform ES response to Property type
- `parsePriceDescription(desc)` – Parse Vietnamese price format

**Project Service Methods:**
- `searchProjects(query?, limit)` – Search projects index

**Location Service Methods:**
- `searchLocations(query?, limit)` – Search locations index
- `searchLocationsAndProjects(query?, limit)` – Combined search

**SEO Service Methods:**
- `getSeoMetadata(path)` – Get SEO metadata for specific path

**Design Principles:**
- **Single Responsibility:** Each service handles one domain
- **Inheritance:** All extend ElasticsearchBaseService
- **Minimal Dependencies:** Manual fetch instead of client library
- **Type Safety:** All responses mapped to TypeScript interfaces
- **Singleton Pattern:** Export service instances for reuse

#### PostgreSQL News/Project Service (postgres-news-project-service.ts)
**Connection:** `pg` library with connection pool
- Uses `DATABASE_URL` environment variable
- Pool config: max 10 connections, 30s idle timeout
- Singleton instance: `postgresNewsProjectService`

**Methods:**
- `getLatestNews(limit)` – Fetch latest news from folders [26, 27, 37]
- `getNewsBySlug(slug)` – Get specific news article by slug
- `getFeaturedProjects(limit)` – Get featured projects (with fallback)
- `mapToNewsArticle(row)` – Transform DB row to NewsArticle type
- `mapToProject(row)` – Transform DB row to Project type

**Tables:**
- `news` – Articles with folders/categories (id, name, description, htmlcontent, avatar, folder)
- `project` – Real estate projects (id, slug, project_name, developer_name, main_image, etc.)

**Image URLs:**
- Base URL: `https://quanly.tongkhobds.com`
- News avatars: `/tongkho/static/uploads/news/`
- Other uploads: `/uploads/` path

#### PostgreSQL Property Service (postgres-property-service.ts)
**Purpose:** Additional property queries from PostgreSQL
- Similar pattern to news/project service
- Connection pooling for efficiency

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
| pg | 8.18.0 | PostgreSQL client library |
| @astrojs/react | 4.2.0 | Astro-React integration |
| @astrojs/tailwind | 6.0.0 | Astro-Tailwind integration |
| @astrojs/sitemap | 3.3.0 | Dynamic sitemap generation |
| @types/react | 19.0.0 | React TypeScript definitions |
| @types/pg | 8.16.0 | PostgreSQL TypeScript definitions |
| @iconify-json/lucide | 1.2.0 | Icon library |

**Dev Dependencies:**
- `@astrojs/check` – TypeScript validation
- `autoprefixer` – CSS vendor prefixes

**Environment Variables:**
```bash
# Elasticsearch
ES_URL=https://elastic.tongkhobds.com
ES_INDEX=real_estate
ES_API_KEY=your_api_key_here

# PostgreSQL
DATABASE_URL=postgres://username:password@host:5432/database
```

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
| 1.1 | 2026-02-05 | Added backend services documentation (Elasticsearch, PostgreSQL) |
