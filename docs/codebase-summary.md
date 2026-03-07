# Codebase Summary

## Directory Structure

```
tongkho-web/
├── src/
│   ├── components/
│   │   ├── cards/
│   │   │   └── property-card.astro          # Property listing card w/ ShareButtons (110 LOC) [Phase 1]
│   │   ├── footer/
│   │   │   └── footer.astro                 # Footer with links (173 LOC)
│   │   ├── header/
│   │   │   ├── header.astro                 # Main navigation + database menu (94 LOC) [Phase 3]
│   │   │   └── header-mobile-menu.tsx       # Mobile menu (React) (110 LOC)
│   │   ├── about/
│   │   │   ├── about-team-member-card.astro
│   │   │   └── about-achievement-stat-card.astro
│   │   ├── auth/
│   │   │   └── auth-modal.astro             # Full authentication modal
│   │   ├── listing/                         # Listing page & search components
│   │   │   ├── horizontal-search-bar.astro  # Search form for listing pages
│   │   │   ├── listing-breadcrumb.astro     # Breadcrumb navigation
│   │   │   ├── listing-filter.astro         # Filter panel (desktop)
│   │   │   ├── listing-grid.astro           # Property results grid
│   │   │   ├── listing-pagination.astro     # Pagination controls
│   │   │   ├── listing-property-card.astro  # ES property card w/ ShareButtons [Phase 1]
│   │   │   ├── location-chips.astro         # Selected location tags
│   │   │   ├── location-autocomplete.astro  # Location search input
│   │   │   └── sidebar/
│   │   │       ├── sidebar-wrapper.astro    # Sidebar container
│   │   │       ├── location-filter-card.astro # [NEW] SSR location filter with property counts
│   │   │       ├── price-range-filter-card.astro
│   │   │       ├── area-range-filter-card.astro
│   │   │       ├── dynamic-sidebar-filters.astro # Context-aware filters
│   │   │       ├── location-selector.astro
│   │   │       ├── property-type-dropdown.astro
│   │   │       ├── province-selector-modal.astro
│   │   │       ├── featured-project-banner.astro
│   │   │       └── quick-contact-banner.astro
│   │   ├── home/
│   │   │   ├── hero-section.astro           # Hero banner
│   │   │   ├── hero-search.astro            # Search form (Astro)
│   │   │   ├── featured-project-section.astro # Projects grid
│   │   │   ├── properties-section.astro     # Properties grid
│   │   │   ├── locations-section.astro      # Location cards
│   │   │   ├── customers-section.astro      # Testimonials
│   │   │   ├── news-section.astro           # News articles
│   │   │   ├── download-app-section.astro   # App download CTA
│   │   │   ├── partners-section.astro       # Partner logos (6)
│   │   │   └── press-coverage-section.astro # Media mentions
│   │   ├── news/
│   │   │   ├── article-share-buttons.astro  # Social share
│   │   │   └── news-related-articles-sidebar.astro # Dynamic folder sections from DB (95 LOC) [NEW]
│   │   ├── property/
│   │   │   ├── property-detail-breadcrumb.astro         # v1-compatible breadcrumb + schema [NEW]
│   │   │   ├── property-detail-image-gallery-carousel.astro
│   │   │   ├── property-info-section.astro
│   │   │   ├── price-history-chart.astro    # Chart.js visualization
│   │   │   ├── contact-sidebar.astro
│   │   │   ├── sidebar-featured-project.astro
│   │   │   └── sidebar-filter-list.astro
│   │   ├── seo/
│   │   │   └── json-ld-schema.astro         # Structured data
│   │   ├── ui/
│   │   │   ├── checkbox.astro
│   │   │   ├── location-dropdown.astro      # 63 provinces
│   │   │   ├── property-type-dropdown.astro
│   │   │   ├── range-slider-dropdown.astro
│   │   │   ├── pagination.astro
│   │   │   └── share-buttons.astro
│   │   ├── utility/                         # [NEW] Utilities feature components
│   │   │   ├── utility-sidebar.astro        # Dynamic utilities list, active state highlighting
│   │   │   ├── utility-form.tsx             # Client-side form validation
│   │   │   ├── utility-result.tsx           # HTML rendering, print functionality
│   │   │   └── utility-container.tsx        # Main page layout container
│   │   └── scroll-to-top-button.astro
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
│   ├── scripts/
│   │   ├── compare-manager.ts               # Compare/wishlist localStorage manager (212 LOC) [Phase 2]
│   │   └── watched-properties-manager.ts    # Recently viewed properties tracker (247 LOC) [NEW]
│   ├── services/
│   │   ├── menu-service.ts                  # Menu generation service (384 LOC) w/ fetchNewsFolders + N+1 optimization [Phase 4]
│   │   ├── seo/
│   │   │   ├── types.ts                     # SEO metadata type definitions (140 LOC) [Phase 5]
│   │   │   ├── seo-metadata-service.ts      # Main orchestration service (226 LOC) [Phase 5]
│   │   │   └── seo-metadata-db-service.ts   # PostgreSQL fallback service (142 LOC) [Phase 5]
│   │   ├── elasticsearch/
│   │   │   ├── types.ts                     # ES types & interfaces (124 LOC) [Phase 3]
│   │   │   ├── query-builder.ts             # v1-compatible ES query builder (238 LOC) [Phase 3]
│   │   │   ├── query-builder.test.ts        # Comprehensive ES query tests (839 LOC) [Phase 3]
│   │   │   ├── property-search-service.ts   # Property listing search (Phase 3)
│   │   │   ├── location-search-service.ts   # Location autocomplete search (Phase 3)
│   │   │   └── seo-metadata-search-service.ts # ElasticSearch SEO service (152 LOC) [Phase 5]
│   │   └── utility/                         # [NEW] Utilities/Feng Shui calculators
│   │       ├── types.ts                     # Utility, FormField, AICalculateRequest types
│   │       ├── form-configs.ts              # Form configs for 4 calculators (hardcoded)
│   │       ├── utility-service.ts           # Database queries + AI API integration
│   │       └── index.ts                     # Service exports
│   ├── layouts/
│   │   ├── base-layout.astro                # HTML base template (65 LOC)
│   │   └── main-layout.astro                # Header + main + footer (35 LOC)
│   ├── pages/
│   │   ├── index.astro                      # Homepage (SSR)
│   │   ├── gioi-thieu.astro                 # About page
│   │   ├── tin-tuc.astro                    # News listing (9 per page)
│   │   ├── tin-tuc/[slug].astro             # News article detail (SSR)
│   │   ├── tin-tuc/trang/[page].astro       # Paginated news (SSR)
│   │   ├── chuyenmuc/[folder].astro         # News folder pages with pagination (SSR) [Phase 2]
│   │   ├── bds/[slug].astro                 # Property detail (SSR)
│   │   ├── du-an/[slug].astro               # Project detail (SSR)
│   │   ├── lien-he.astro                    # Contact page with form submission
│   │   ├── tienich/index.astro              # [NEW] Utilities index (redirects to first util)
│   │   ├── tienich/[slug].astro             # [NEW] Utility detail page (SSG/SSR)
│   │   └── api/
│   │       ├── properties/
│   │       │   └── batch.ts                 # Batch properties API [NEW]
│   │       └── utility/
│   │           └── calculate.ts             # [NEW] AI calculation proxy endpoint
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

**Total:** ~15,500 lines of code across 63 files
- Components: 42+ files (5500+ LOC) across 12 categories (About, Auth, Cards, Footer, Header, Home, Listing, News, Property, SEO, UI)
- Pages: 8 route files + 27 dynamic folder pages (1425 LOC)
- Database: 8 files (6139 LOC) - schemas, migrations, indexes
- Services: 4 files (1026 LOC) - menu, elasticsearch, postgres services
- Data & Types: 8 files (1050 LOC) - mock data, static data, type definitions
- Utils & Layouts: 4 files (247 LOC)

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

### Location Service (location/location-service.ts) [NEW - Phase 2]
**Purpose:** Server-side location hierarchy and property count queries for listing pages

**Key Functions:**
- `getAllProvincesWithCount(limit, useNewAddresses)` – Fetch top 20 provinces with property counts from V1 materialized table
- `getAllProvinces(useNewAddresses)` – Legacy function to fetch provinces with district counts
- `getDistrictsByProvinces(provinceNIds)` – Batch fetch districts grouped by province
- `buildLocationHierarchy()` – Build complete hierarchy (cached for build-time generation)
- `getProvinceBySlug(slug)` – Resolve single province from slug
- `getDistrictBySlug(provinceNId, districtSlug)` – Resolve district with province context
- `resolveLocationSlugs(slugs)` – Batch resolve multiple location slugs (province/district)
- `clearLocationCache()` – Manual cache invalidation (testing)

**Features:**
- V1-compatible data source: `locations_with_count_property` materialized table for performance
- Property counts aggregated per province (materialized in database)
- In-memory hierarchy caching for SSR components
- Support for new vs legacy addresses via `mergedintoid` filtering
- Type-safe Province/District/LocationHierarchy interfaces
- Graceful error handling with empty fallback arrays
- Display order support for featured city ranking

**Data Structure:**
```typescript
interface Province {
  id: number;
  nId: string;                    // V1 city_id
  name: string;                   // "Hà Nội"
  slug: string;                   // "ha-noi"
  districtCount: number;
  propertyCount?: number;         // Aggregated from locations_with_count_property
  cityImage?: string;             // Optional city thumbnail
  cityImageWeb?: string;          // Web version image
  cityLatlng?: string;            // Lat/lng JSON
  displayOrder?: number;          // For featured ranking
}
```

**Usage:** Called by location-filter-card.astro (SSR), location dropdown, and location search components

### Location Filter Card Component [NEW - Phase 2]
**File:** `components/listing/sidebar/location-filter-card.astro`

**Purpose:** Server-rendered sidebar widget showing top 20 provinces with property counts and expand/collapse functionality

**Features:**
- **Server-Side Rendering:** Fetches province data at build time via `getAllProvincesWithCount()`
- **Property Counts:** Displays property count per province (formatted as "1K", "500", etc.)
- **Transaction Type Awareness:** Parses URL to determine transaction context (mua-ban, cho-thue, du-an)
- **Active State Highlighting:** Visual indicator for currently selected province
- **Expand/Collapse:** Shows 10 items by default, expands to full list (20) on demand
- **Query Parameter Preservation:** Maintains search filters (price, area, etc.) when navigating provinces
- **Clear Filter Button:** Shows when on province page, returns to base transaction URL
- **Smooth Scroll:** Scrolls to card top on collapse for UX

**URL Pattern:**
```
/{transactionType}/{provinceSlug}?minPrice=500&maxPrice=1000&...
/mua-ban/ha-noi?minPrice=500&maxPrice=1000
/cho-thue/can-tho
/mua-ban  # Base (no province selected)
```

**Error Handling:**
- Graceful fallback if database unavailable
- Empty state message if no provinces found
- Client-side expand/collapse works independently of server data

**Client-Side Script:**
- `initLocationFilterCard()` - Attach expand/collapse listeners
- Runs on page load and after View Transitions (astro:after-swap)
- Uses data attributes for DOM queries (prevent collisions with other components)

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

### Search URL Builder Service (search-url-builder.ts) [NEW - Phase 2]
**File:** `src/services/url/search-url-builder.ts` (42 LOC)

**Responsibility:** Generate v1-compatible search URLs from filter objects (centralized DRY pattern)

**Key Functions:**

1. **buildSearchUrl(filters, propertyTypeSlugMap) → string**
   - **Input:** SearchFilters object + property type slug map
   - **Process:** Converts filters to v1-compatible URL path + query params
   - **Output:** Search URL string (e.g., `/ban-can-ho-chung-cu/ha-noi?bedrooms=3`)
   - **Single Source of Truth:** All listing URL building uses this function
   - **Used In:** Hero search, horizontal search bar, sidebar filters

2. **buildPropertyTypeSlugMap() → Map<number, string>**
   - Scans DOM for checkboxes with CSS class `.widget-type`
   - Extracts id → slug mapping from `value` and `data-slug` attributes
   - Returns Map for O(1) slug lookups
   - Used in: All listing page URL building when property type selection changes

**Implementation Details:**

**URL Structure (v1-compatible):**
- **urlArg1** (first segment): Property type slug OR transaction slug
  - Single type: Use property type slug (e.g., `ban-can-ho-chung-cu`)
  - Multiple/none: Use transaction slug (e.g., `mua-ban`)
- **urlArg2** (second segment): Province slug (e.g., `ha-noi`)
- **urlArg3** (third segment): Price slug if price filter applied (e.g., `gia-tu-1-ty-den-2-ty`)
- **Query Parameters:** Multiple types, districts, filters (bedrooms, bathrooms, etc.)

**Example URLs Generated:**
```
Single type:        /ban-can-ho-chung-cu/ha-noi
Multiple types:     /mua-ban/ha-noi?property_types=12,13
Type + price:       /ban-can-ho-chung-cu/ha-noi/gia-tu-1-ty-den-2-ty
Type + districts:   /ban-can-ho-chung-cu/ha-noi?addresses=quan-hoan-kiem,quan-ba-dinh
Type + all filters: /ban-can-ho-chung-cu/ha-noi/gia-tu-1-ty-den-2-ty?addresses=...&bedrooms=3
```

**Test Coverage:** 38 test cases
- Single property type URL generation ✓
- Multiple property type URL generation ✓
- Price slug generation and edge cases ✓
- Location/district parameter handling ✓
- v1 compatibility verification ✓

**DRY Pattern (Why Centralized):**
- Eliminates code duplication across search components
- Single source of truth for v1-compatible URL logic
- Updates to buildSearchUrl() automatically benefit all components
- Easier to test and maintain edge cases
- Consistent URL format across entire application

**Validation & Fallbacks:**
- Validates slug existence before using in path
- Falls back to transaction slug if property type slug missing
- URLs always start with v1-compatible slugs (never numeric IDs)
- Handles edge cases (no location, no property type, all filters)

### Compare Manager (compare-manager.ts) [NEW - Phase 2]
**File:** `src/scripts/compare-manager.ts`

**Purpose:** Client-side property comparison system using localStorage (max 2 items, same transaction type validation)

**Key Functions:**
- `init()` – Initialize on DOM load, sync button active states with localStorage
- `add(item)` – Add property to comparison list with validation
- `remove(estateId)` – Remove property from list
- `toggle(element)` – Toggle property in/out of list (main interaction)
- `getItems()` – Retrieve all compared properties
- `clear()` – Remove all items

**Features:**
- **Max 2 Items:** Validation enforces comparison limit; toast error if exceeded
- **Same Transaction Type:** Enforces sale/rent matching; prevents mixing transaction types
- **Toast Notifications:** Success/error messages in Vietnamese
- **XSS Protection:** Data attribute sanitization via `sanitize()` utility
- **Event Delegation:** Single body listener (prevents memory leaks with HTMX)
- **Cross-Tab Sync:** localStorage events enable sync across browser tabs
- **Graceful Degradation:** Fallback if localStorage unavailable (private browsing)

**Data Structure:**
```typescript
interface CompareItem {
  estateId: string;       // Property ID
  transactionType: string; // "1" (sale) or "2" (rent)
  url: string;            // Property detail link
  image: string;          // Thumbnail URL
  title: string;          // Property name
}
```

**Utilities:**
- `sanitize(value)` – XSS prevention via textContent → innerHTML
- `normalizeTransactionType(value)` – Handles multiple formats (1/2, sale/rent, Vietnamese)
- `showToast(message, type)` – Simple toast with auto-dismiss (3s)

**Integration Points:**
- property-card.astro: `.btn-compare` button with data attributes
- listing-property-card.astro: `.btn-compare` button with data attributes
- base-layout.astro: Script initialization on DOMContentLoaded & htmx:afterSwap
- global.css: `.btn-compare.active` styling (blue highlight)

**localStorage Key:** `compare_items` (JSON stringified array)

**Usage:** Bind click handler to `.btn-compare` buttons; manager automatically syncs UI state with storage

### Watched Properties Manager (watched-properties-manager.ts) [NEW]
**File:** `src/scripts/watched-properties-manager.ts`

**Purpose:** Client-side recently viewed properties tracking using localStorage (max 8 items, newest first)

**Key Functions:**
- `init()` – Initialize on property detail page load, fetch and render watched properties
- `trackView(property)` – Add property to watched list (moves to front if exists)
- `getItems()` – Retrieve all watched properties from storage
- `getDisplayIds(excludeId)` – Get IDs for display (excluding current property)
- `renderCards(properties, containerId)` – Render property cards using DOM methods (XSS-safe)
- `formatPrice(price, unit)` – Format Vietnamese currency for display

**Features:**
- **Max 8 Items:** localStorage limit prevents unlimited growth
- **Newest First:** Recently viewed properties appear at front
- **XSS Protection:** DOM-based rendering via textContent + createElement
- **Batch API Integration:** Fetches property details via `/api/properties/batch`
- **Rate Limiting:** 30 requests/min per IP on batch API
- **Graceful Degradation:** Returns empty array if localStorage unavailable (private browsing)
- **Vietnamese UX:** Price formatting (tỷ, triệu, triệu/tháng) and section title in Vietnamese

**Data Structure:**
```typescript
interface WatchedProperty {
  estateId: string;
  transactionType: string;  // 'sale' | 'rent'
  title: string;
  url: string;
  image: string;
}
```

**Integration:**
- Property detail pages set data attributes on H1: `data-estate-id`, `data-transaction-type`, `data-title`, `data-url`, `data-image`
- Script runs on page load via base-layout.astro
- Container element: `<div id="watched-properties"></div>` at bottom of property detail
- Renders 4-column grid (responsive: 1 col mobile, 2 col tablet, 4 col desktop)

**localStorage Key:** `watched_properties_list` (JSON stringified array)

### Batch Properties API (`pages/api/properties/batch.ts`) [NEW]
**Purpose:** Server-side API endpoint for fetching multiple properties by IDs

**Endpoint:** `GET /api/properties/batch?ids=1,2,3`

**Features:**
- **Batch Queries:** Fetch up to 20 properties in single request
- **Rate Limiting:** 30 req/min per IP (429 on limit)
- **Caching:** 5-minute HTTP cache for responses
- **Order Preservation:** Returns properties in request order
- **Input Validation:** Sanitizes ID list (integers only, 0 < count <= 20)
- **Database Safety:** Soft-delete filter (`aactive=true`), parameterized queries via Drizzle
- **Error Handling:** 400/429/500 responses with JSON messages

**Request:**
```
GET /api/properties/batch?ids=1,2,3
```

**Response (200):**
```json
{
  "properties": [
    {
      "id": "1",
      "title": "Căn hộ cao cấp Hà Nội",
      "slug": "can-ho-cao-cap-ha-noi",
      "price": 5500000000,
      "priceUnit": "total",
      "transactionType": "sale",
      "thumbnail": "https://...",
      "city": "Hà Nội",
      "district": "Cầu Giấy",
      "area": 120
    }
  ]
}
```

**Query Limits:**
- Max 20 IDs per request (412 error if exceeded)
- Must provide at least 1 ID (400 error if missing)
- IDs must be positive integers (400 error if invalid)

**Rate Limiting:**
- Window: 60 seconds
- Max requests: 30 per IP
- Cleanup: Automatic entry removal after window expires
- Response header: `Retry-After: 60` on 429

**Used By:**
- `watched-properties-manager.ts` – Fetches property details for display
- Future: Compare functionality, similar properties sidebar

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

### SEO Metadata Service (seo-metadata-service.ts) [Phase 5]
**Purpose:** Server-side SEO metadata orchestration for listing pages. Fetches and renders dynamic title & content from database.

**Architecture:** ElasticSearch → PostgreSQL → Default fallback

**Key Functions:**
- `getSeoMetadata(slug)` – Main orchestration function, returns formatted SeoMetadata object
  - Parses slug to extract 3-part URL format (transaction/location/price)
  - Tries ElasticSearch first, falls back to PostgreSQL if not found
  - Uses default SEO metadata as final fallback
  - Applies price context if 3-part URL detected
  - Ensures return is never null (empty object if all sources fail)
- `parseSlug(slug)` – Extract base slug & price slug from URL path
  - Handles: '/mua-ban/ha-noi' → baseSlug, '/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty' → baseSlug + priceSlug
- `formatSeoMetadata(result, priceSlug)` – Format raw DB result + apply price context
- `applyPriceContext(metadata, priceSlug)` – Replace {price} placeholder with actual range
  - Examples: 'gia-tu-1-ty-den-2-ty' → 'giá từ 1 tỷ đến 2 tỷ'
  - Matches 10+ price slug patterns (range, under, over, in tỷ/triệu)
- `replaceImageUrls(content)` – Convert relative URLs to absolute for CDN
  - `/uploads/image.jpg` → `{PUBLIC_IMAGE_SERVER_URL}/uploads/image.jpg`

**Features:**
- Graceful degradation on service failures (logs warnings, continues)
- Dynamic title rendering from database (H1 headings)
- SEO content below listings (contentBelow field)
- Price context injection for template-based metadata
- Image URL CDN integration
- Environment-based image server URL (PUBLIC_IMAGE_SERVER_URL)

**Data Flow (Listing Page):**
1. URL arrives: `/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty?filters...`
2. `getSeoMetadata(pathname)` called during SSR
3. Fetches metadata from ES → DB → Default
4. Renders as:
   - Page title (H1) from `titleWeb` or `title`
   - Content above (if exists, before results grid)
   - Content below (if exists & properties found, after pagination)
5. Meta tags from `metaDescription`, `ogTitle`, etc.

**Integration Points:**
- Called in `[...slug].astro:229` during page rendering
- Result passed to layout as title & description
- `contentBelow` rendered at line 346 with prose styling

### SEO Metadata Search Service (seo-metadata-search-service.ts) [Phase 5]
**Purpose:** ElasticSearch integration for SEO metadata queries

**Key Functions:**
- `searchSeoMetadata(options)` – Query seo_meta_data ES index
  - Returns SeoMetadataResult or null if not found
  - Validates slug, sanitizes for injection attacks
  - Filters by `is_active: true`

**Features:**
- Slug sanitization (only allow a-z, 0-9, -, /, _)
- Exact slug matching via ES `term` query
- Returns 30+ fields from _source
- Graceful error handling with null return

### SEO Metadata DB Service (seo-metadata-db-service.ts) [Phase 5]
**Purpose:** PostgreSQL fallback for SEO metadata (via seo_meta_data table)

**Key Functions:**
- `getSeoMetadataFromDb(slug)` – Query by slug, filters `isActive=true`
- `getDefaultSeoMetadata()` – Fetch default SEO (slug='/default/')
- `seoMetadataExists(slug)` – Lightweight existence check
- `mapDbRecordToResult(record)` – Convert DB record to typed result

**Features:**
- Drizzle ORM integration
- Case-insensitive field mapping (camelCase + snake_case)
- Database error isolation (never throws, logs & returns null)
- Default fallback support

### Utility Service (utility-service.ts) [NEW - Phase 6]
**Purpose:** Database-driven utilities (feng shui calculators) with external AI API integration

**Key Functions:**
- `getUtilities()` – Fetch all utilities from `news` table grouped by utilities folder
  - Returns hardcoded "So sánh bất động sản" (comparison) at index 0 (v1 behavior)
  - Orders by `displayOrder` field (database-first)
  - Fallback if utilities folder not found or database unavailable
- `getUtilityBySlug(slug)` – Resolve utility by slug
- `getFormConfigByType(type)` – Get hardcoded form config for utility type
- `calculateResult(request)` – Call external AI API and return HTML result

**Features:**
- Database-first architecture (queries `news` table via Drizzle ORM)
- Hardcoded form configurations in TypeScript (4 calculators: HouseConstructionAgeCheck, FengShuiDirectionAdvisor, ColorAdvisor, OfficeFengShui)
- External AI API integration (`https://resan8n.ecrm.vn/webhook/tkbds-app/ai`)
- Type-safe request/response handling
- Graceful error handling with fallback defaults
- Vietnamese slug generation from utility names

**Data Structure:**
```typescript
interface Utility {
  id: number;
  name: string;                    // "Tư vấn tuổi xây nhà"
  description: string;             // "HouseConstructionAgeCheck"
  slug: string;                    // "tu-van-tuoi-xay-nha"
  icon?: string;
}

interface FormField {
  name: string;                    // "ownerBirthYear"
  label: string;                   // "Năm sinh gia chủ"
  type: 'text' | 'number' | 'select';
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }>;
}
```

**Database Integration:**
- Queries `news` table with folder filter (utilities folder = 'tien-ich-tong-kho')
- Soft-delete aware: filters `aactive = true`
- Display order respected: `orderBy(asc(news.displayOrder))`

### Utility Form Configs (form-configs.ts) [NEW]
**Purpose:** Hardcoded form configurations for 4 feng shui calculators

**Supported Calculators:**
1. **HouseConstructionAgeCheck** - House construction year advisor
   - Fields: ownerBirthYear (number), expectedStartYear (number), gender (select)
2. **FengShuiDirectionAdvisor** - House direction recommendation
   - Fields: ownerBirthYear (number), houseFacing (8 directions), gender (select), lengthOption (short/medium/long)
3. **ColorAdvisor** - Color palette recommendation
   - Fields: ownerBirthYear (number), gender (select), lengthOption (short/medium/long)
4. **OfficeFengShui** - Office feng shui layout
   - Fields: ownerBirthYear (number), gender (select), lengthOption (short/medium/long)

**Design Pattern:**
- Static configurations (no database storage needed)
- Forms map to AI API payload fields
- Type-safe via TypeScript interfaces (UtilityFormConfig, FormField)
- Export functions: `getFormConfig(type)`, `hasFormConfig(type)`

### API Utility Calculate Endpoint (pages/api/utility/calculate.ts) [NEW]
**Purpose:** Server-side API proxy for AI calculation (protects API credentials)

**Endpoint:** `POST /api/utility/calculate`

**Features:**
- Request validation (required fields: type, ownerBirthYear)
- Birth year range validation (1900-2100)
- API credential protection (X-API-Key header never exposed to client)
- Error handling with user-friendly Vietnamese messages
- Returns AI API response as-is (JSON with status, message, data.html)

**Request Payload:**
```json
{
  "type": "HouseConstructionAgeCheck",
  "ownerBirthYear": 1990,
  "expectedStartYear": 2026,
  "gender": "male",
  "userId": 1
}
```

**Response (200):**
```json
{
  "status": 1,
  "message": "Success",
  "data": {
    "html": "<div>Kết quả tư vấn...</div>"
  }
}
```

**Error Responses:**
- 400: Missing/invalid required fields
- 500: AI API connection failure

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
| 2.6 | 2026-03-05 | [NEW] Utilities page (feng shui calculators): Added utility-service.ts + form-configs.ts (database-first, hardcoded forms), 4 components (sidebar, form, result, container), page routes (/tienich/[slug]), API proxy endpoint. Database-first approach using news table. All 45/45 tests passing, 0 TypeScript errors. |
| 2.5 | 2026-03-05 | [NEW] Contact page: Added consultation schema, contact-form/info/cta components, SSR page with CSRF + rate limiting, database persistence. 45/45 tests passing. |
| 2.4 | 2026-03-03 | [NEW] Property detail breadcrumbs + recently viewed: Added property-detail-breadcrumb.astro (v1-compatible navigation + schema.org), watched-properties-manager.ts (localStorage tracker, max 8 items, DOM-safe rendering), batch properties API (rate limited, 5-min cache, order preserved). All 44/44 tests passing, 0 TypeScript errors. |
| 2.3 | 2026-02-11 | Phase 2 compare service: Created compare-manager.ts (localStorage-based, max 2 items, transaction type validation, toast notifications, XSS protection). Updated property cards with compare buttons. All 211 tests passing |
| 2.2 | 2026-02-11 | Phase 1 share functionality: Integrated ShareButtons component (popup variant) into property-card.astro and listing-property-card.astro; Share button row added to action buttons |
| 2.1 | 2026-02-11 | Phase 5 complete: SEO metadata integration (ES→DB→Default flow, price context injection, dynamic content rendering) |
| 2.0 | 2026-02-07 | Scout report: Added 32 components (8 new sections), 8 page routes, dynamic detail pages, authentication modal, SEO schemas, image gallery, news system, price history chart. Total ~3,500 LOC |
| 1.4 | 2026-02-06 | Phase 4 complete: Hierarchical news folders, dynamic folder pages (27 total), recursive data structures |
| 1.3 | 2026-02-06 | Phase 3 complete: Extracted static-data.ts for filter options; database-driven header navigation |
| 1.2 | 2026-02-06 | Phase 2 complete: Added menu-data.ts, build-time menu generation with fallback support |
| 1.1 | 2026-02-06 | Phase 1 complete: Added menu service layer, database schema (propertyType, folder), Drizzle ORM integration |
| 1.0 | 2026-01-28 | Initial codebase documentation |
