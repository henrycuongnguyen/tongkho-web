# Tongkho-Web: Project Overview & PDR

## Executive Summary

**Tongkho-Web** is a Vietnamese real estate discovery and listing platform serving the Vietnamese property market. The project delivers a fast, SEO-optimized, static website for browsing properties, projects, and real estate market insights.

**Live Site:** https://tongkhobds.com

---

## Product Definition

### Vision
Enable property seekers in Vietnam to discover, compare, and understand the real estate market with a modern, responsive web experience.

### Target Audience
- **Primary:** Individual property buyers/renters searching for homes in Vietnam
- **Secondary:** Real estate investors researching market trends
- **Tertiary:** Real estate agents/developers discovering partnership opportunities

### Key Features

#### 1. Search & Discovery
- Multi-tab search interface (Buy/Rent/Projects)
- City-based filtering (63 Vietnamese provinces)
- Property type filtering (apartment, house, villa, land, office, shophouse, warehouse)
- Price range & area range filters
- Keyword search
- Advanced filter options in hero search component

#### 2. Property Listings & Details
- Property cards with images, price, area, bedrooms/bathrooms
- Featured/hot property highlighting
- Responsive grid layout
- Mock data with real property structure
- **Dynamic property detail pages** with image gallery, info section, contact sidebar
- Price history chart visualization
- Related properties recommendations
- **Zero Results Fallback** with 3-tier intelligent filter relaxation (v1 parity)
  - Level 1: Keep location, remove filters
  - Level 2: Expand to city level, remove all filters
  - Level 3: Nationwide search
- Fallback analytics tracking (GA4)
- LRU caching (5-min TTL, 100 entries max)

#### 3. Project Showcase
- Real estate project listings with developer info
- Project status tracking (upcoming, selling, sold_out, completed)
- Amenities & location information
- Featured projects section
- **Dynamic project detail pages** (future)

#### 4. Market Intelligence
- News/blog articles (market trends, policy, investment tips)
- Location cards showing property density
- Customer testimonials/reviews
- Vietnamese-specific content
- **Dynamic news article pages** with share buttons and related articles sidebar
- News folder categories (hierarchical structure with parent-child relationships)

#### 5. Responsive Design
- Desktop, tablet, mobile optimization
- Orange primary theme (#f97316)
- Vietnamese fonts (Inter, Be Vietnam Pro)
- Mobile menu with hamburger navigation
- Responsive image gallery

#### 6. Database-Driven Features
- **Menu System**: Dynamic navigation from PostgreSQL (property types, news folders)
- **Build-time Generation**: Hierarchical menu structure with 1-hour caching
- **27 Dynamic Folder Pages**: Auto-generated news category pages at `/tin-tuc/danh-muc/{folder-name}`
- **Contact Form**: SSR page (`/lien-he`) with server-side validation, database persistence, CSRF protection, rate limiting
- **Utilities (Feng Shui Calculators)**: Database-driven utility list (`/tienich/{slug}`) with 4 interactive calculators, AI-powered advice, form validation
- **Soft-delete Pattern**: Consistent with V1 architecture for data preservation

#### 7. Maps & Network Page
- **Office Locator**: Interactive map showing all TongKhoBDS office locations
- **Google Maps Integration**: Dynamic API loading, markers, info windows, directions
- **2-Panel Layout**: Office list (left) + interactive map (right), responsive stacking
- **Hybrid SSG**: Build-time data fetch + client-side interactivity
- **Graceful Fallback**: Demo offices when database unavailable (build resilience)

---

## Functional Requirements

| Requirement | Status | Priority |
|---|---|---|
| Homepage with hero search | Complete | High |
| Property listing grid | Complete | High |
| Search filtering (city, type, price, area) | Complete | High |
| Project showcase section | Complete | High |
| News/blog section | Complete | Medium |
| Location cards | Complete | Medium |
| Contact page with form submission | Complete | Medium |
| Utilities page with feng shui calculators | Complete | Medium |
| Responsive design (all breakpoints) | Complete | High |
| Vietnamese localization (dates, numbers, prices) | Complete | High |
| SEO optimization (sitemap, meta tags) | Complete | High |
| Static HTML output (zero JS required) | Complete | High |
| Zero results fallback with suggestions | Complete | High |
| Fallback analytics tracking | Complete | Medium |

---

## Non-Functional Requirements

| Requirement | Specification |
|---|---|
| **Performance** | Sub-2s homepage load (static output) |
| **SEO** | Dynamic sitemap, meta tags per page, semantic HTML |
| **Accessibility** | WCAG 2.1 Level AA (Astro defaults) |
| **Browser Support** | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| **Code Quality** | TypeScript strict mode, 0 unused variables |
| **Build Size** | <3MB total output (excluding images) |

---

## Technical Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Astro | 5.2 |
| **Runtime** | React | 19.0.0 |
| **Styling** | Tailwind CSS | 3.4 |
| **Language** | TypeScript | 5.7 (strict mode) |
| **Database** | PostgreSQL | (V1 legacy schema) |
| **ORM** | Drizzle ORM | latest |
| **Search** | Elasticsearch | (future integration) |
| **Icons** | Lucide (Iconify JSON) | 1.2.0 |
| **Output** | Static HTML | Zero JavaScript |
| **Hosting** | Static file server | nginx/Netlify/Vercel/Cloudflare |

---

## Data Model

### Core Entities

#### Property
```
- id, title, slug, type (PropertyType), transactionType
- price, priceUnit, area
- bedrooms?, bathrooms?
- address, district, city
- description, images[], thumbnail
- features[], createdAt, isFeatured, isHot
```

#### Project
```
- id, name, slug, developer, location, city
- status, totalUnits, priceRange, area
- description, images[], thumbnail, amenities[]
- completionDate?, isFeatured
```

#### NewsArticle
```
- id, title, slug, excerpt, content, thumbnail
- category (market|policy|tips|project_news|investment)
- author, publishedAt, views
```

#### Location
```
- id, name, slug, image, propertyCount
```

---

## User Workflows

### 1. Property Search
1. User lands on homepage
2. Selects transaction type (buy/rent)
3. Filters by city, property type, price, area
4. Views property cards with key info
5. (Future) Clicks through to property detail page

### 2. Project Discovery
1. User visits Projects section on homepage
2. Browsees featured projects grid
3. Sees developer, status, price range, amenities
4. (Future) Explores project detail page with unit inventory

### 3. Market Research
1. User navigates to News section
2. Reads market trends, policy updates, investment tips
3. (Future) Filters by category/date

---

## Success Metrics

| Metric | Target |
|---|---|
| Homepage load time | <2 seconds (static) |
| Mobile usability score | >90 (Lighthouse) |
| SEO ranking (target keywords) | Top 3 position (6-12 months) |
| User sessions | >5K/month (3-6 months) |
| Bounce rate | <50% |
| Pages per session | >2 |

---

## Phase-Based Roadmap

### Phase 1: Foundation (COMPLETE)
- Astro 5.2 + React 19 setup with zero JavaScript output
- Tailwind CSS 3.4 styling with custom components
- Mock property/project/news data (comprehensive dataset)
- Search UI with multi-tab interface and filters
- Responsive layout (mobile-first approach)
- TypeScript strict mode interfaces and types
- SEO: Sitemap generation, meta tags, robots.txt
- Vietnamese localization (dates, prices, slugs, relative times)

### Phase 2: Dynamic Menu & Folder Pages (COMPLETE)
- **Database-driven navigation menu** from PostgreSQL
- **Build-time menu generation** with 1-hour caching
- **Hierarchical news folders** (parent-child relationships)
- **27 dynamic category pages** at `/tin-tuc/danh-muc/{folder-name}`
- **Service layer** (menu-service.ts) with recursive folder traversal
- **Fallback menu** for database unavailability
- **Performance optimization** (96.3% cache hit rate, <100ms queries)

### Phase 3: Dynamic Routes & SEO (PLANNED)
- Dynamic routes per property detail pages (`/bds/[slug]`)
- Dynamic routes for articles (`/tin-tuc/[slug]`)
- Per-page meta tags (title, description, OG tags)
- JSON-LD structured data (Organization, WebSite, LocalBusiness, BreadcrumbList)
- Open Graph / Twitter cards
- Breadcrumb navigation
- Canonical URL handling

### Phase 4: Backend Integration (PLANNED)
- API integration with Elasticsearch (property search)
- PostgreSQL direct queries (property details, related properties)
- Image CDN optimization (quanly.tongkhobds.com)
- Real estate database schema normalization
- CMS API for news articles

### Phase 5: Advanced Features (PLANNED)
- Admin dashboard for property management
- Lead generation forms
- Agent/broker features
- Map integration (Google Maps)
- Virtual tours / 3D viewing
- Mortgage calculator
- Price prediction/analytics

---

## Dependencies & Constraints

### Tech Constraints
- Must remain static (zero server-side rendering)
- TypeScript strict mode (no `any`)
- All dependencies must be published npm packages

### Business Constraints
- Vietnamese market focus (localization priority)
- SEO-first approach (every page must be discoverable)
- Mobile-first responsive design
- GDPR/privacy compliance for EU users

### V1 Schema Alignment (Migration Reference)

### V1-V2 Database Schema Mapping

**Current Implementation (Phase 1-2):**

| V1 Table | V2 Reference | Status | Purpose |
|---|---|---|---|
| `property_type` | Drizzle schema ✅ | Complete | Property classification (apartment, house, villa, etc.) |
| `folder` | Drizzle schema ✅ | Complete | News category hierarchy (parent-child structure) |
| `auth_user` | PostgreSQL native | Complete | User authentication (Web2py auth system) |
| `auth_group` | PostgreSQL native | Complete | User roles (admin, agent, guest) |

**Planned Implementation (Phase 3-5):**

| V1 Table | V2 Target | Status | Purpose |
|---|---|---|---|
| `real_estate` | Phase 3 | Planned | Property listings (40+ fields per listing) |
| `real_estate_transaction` | Phase 3 | Planned | Sales/rental transactions (status workflow) |
| `transaction_history` | Phase 3 | Planned | Immutable audit log (state changes) |
| `project` | Phase 3 | Planned | Real estate projects (development phases) |
| `consultation` | Phase 4 | Planned | Lead inquiries (salesman assignments) |
| `locations` | Phase 3 | Planned | Geographic hierarchy (city→district→ward) |
| `post_office` | Phase 5 | Planned | Office hierarchy (5-level org structure) |
| `office_staff` | Phase 5 | Planned | Employee roster (multi-office support) |
| `dbank_account` | Phase 4 | Planned | Bank accounts (commission management) |
| `withdraw` | Phase 4 | Planned | Withdrawal workflow (pending→approved→completed) |

### Key V1 Patterns to Adopt

**1. Soft-Delete Convention:**
```typescript
// NEVER: DELETE FROM real_estate WHERE id = ...
// ALWAYS: UPDATE real_estate SET aactive=false WHERE id = ...
// QUERY: WHERE aactive=true (mandatory filter)
```

**2. Status Enum Pattern:**
```typescript
const PROPERTY_STATUS = { DRAFT: 1, ACTIVE: 2, SOLD: 3, RENTED: 4, INACTIVE: 5 };
const TX_STATUS = { PENDING: 1, APPROVED: 2, REJECTED: 3, IN_RECONCILIATION: 4, COMPLETED: 5 };
```

**3. Audit Trail Fields:**
```typescript
// All transactional tables include:
created_on: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
created_by: FK to auth_user (NOT NULL)
updated_on: TIMESTAMP (auto-updated by PostgreSQL trigger)
```

**4. Hierarchical Data:**
```typescript
// Self-referencing parent_id for trees:
parent_id: FK to self (NULL for root)
// Example: news folders, office hierarchy, property type groups
```

**5. Commission & Financial:**
```typescript
// V1 pattern for commission workflow:
// Transaction (completed) → Commission accrual → Withdrawal request → Payment
// Fields: rate_seller, amount_seller, bonus, commission_percentage
```

### Migration Risk Mitigation

**Known Issues from V1:**
- 57 tables with many unused/legacy fields → cleanup plan needed
- Salesman/Staff dual identity system → consolidation roadmap
- SEO metadata uses generic entity_type/entity_id → consider specialized schema
- Real estate has 40+ fields with flexible JSON data → validation strategy

**Recommendations:**
1. Phase 3: Create clean `real_estate` schema mapping only needed V1 fields
2. Phase 4: Implement data validation layer (JSON schema for flexible fields)
3. Phase 5: Plan data cleanup (archive legacy tables, consolidate identities)
4. Ongoing: Document breaking changes for V1 API consumers

---

## Known Limitations
- Mock data only (no real property API yet)
- No user authentication
- No transaction/booking capability
- No real-time updates

---

## Acceptance Criteria

**MVP is COMPLETE when:**
- Homepage loads in <2 seconds (static output)
- All 5 search filters work (city, property type, price, area, keyword)
- Property/project/news cards render correctly on mobile/desktop
- Zero TypeScript errors
- Sitemap generated and robots.txt configured
- Visual design matches Figma (primary orange, Inter font, responsive)
- No console errors/warnings in production build

---

## Current Implementation Status

### Completed Features
- ✅ **Foundation Phase:** Astro 5.2, React 19, TypeScript 5.7, Tailwind CSS 3.4
- ✅ **Homepage:** 8 sections (hero, projects, properties, locations, news, partners, press, download-app)
- ✅ **Components:** 35+ components across 10 categories (about, auth, cards, contact, footer, header, home, news, property, seo, ui)
- ✅ **Pages:** 8 route files + 27 dynamic folder pages (35 total)
- ✅ **Database Integration:** Drizzle ORM with PostgreSQL, menu-service with 1-hour caching, consultation table
- ✅ **Search UI:** Multi-tab filters (city, type, price, area, keyword)
- ✅ **Contact Page:** SSR page with form validation, database persistence, CSRF protection, rate limiting
- ✅ **Vietnamese Localization:** Date formatting, currency notation (tỷ/triệu), slug generation, budget formatting
- ✅ **SEO:** Dynamic sitemap, robots.txt, semantic HTML, structured data schemas, listing page metadata, breadcrumb schema
- ✅ **Search Experience:** Zero results fallback with 3-tier filter relaxation, analytics tracking, LRU caching
- ✅ **Performance:** <2 second load time, zero JavaScript (contact form works without JS), 96.3% cache hit rate, 80% fallback cache hit rate
- ✅ **Security:** CSRF tokens, rate limiting (5 req/min), server-side validation, XSS protection

### Current Phase: Phase 3 Complete, Phase 4 Planned

**Phase 2 Completion (Feb 6-10):**
- Database-driven menu system with hierarchical folder support
- Build-time menu generation (1-hour TTL caching)
- 27 dynamic news category pages
- Recursive folder transformation for nested navigation
- Sidebar location filter cards (SSR) with property counts
- SEO metadata integration (ElasticSearch + PostgreSQL fallback)

**Phase 3 Completion (Feb 11 - Mar 5):**
- Zero results fallback & suggestions (3-tier relaxation strategy) - **Feb 11**
- Dynamic property detail pages with image gallery
- News article detail pages with share buttons
- Per-page meta tags and OG tag generation
- JSON-LD structured data (Organization, Product, Article)
- Breadcrumb navigation with schema.org markup
- Related articles/properties sidebars
- Recently viewed properties tracker (localStorage, DOM-safe)
- Contact page SSR (`/lien-he`) with form submission, database persistence, CSRF + rate limiting - **Mar 5**

### Code Statistics (Scout Report, Feb 7)
- **Total Files:** 61 across entire codebase
- **Total LOC:** ~15,085 lines
- **Components:** 32 files (5197 LOC)
- **Database:** 8 files including schema + migrations (6139 LOC)
- **Services:** 4 files (1026 LOC)
- **Pages:** 8 routes + 27 dynamic pages (1425 LOC)
- **Data/Types/Utils:** 8 files (1050 LOC)

---

## Document History

| Version | Date | Changes |
|---|---|---|
| 2.3 | 2026-03-05 | Contact page SSR implementation complete: /lien-he with form validation, CSRF protection, rate limiting, database persistence. Phase 3 now complete. Updated features list, requirements, security items. |
| 2.2 | 2026-02-11 | Docs: Added zero results fallback feature, 3-tier relaxation strategy, analytics tracking, LRU cache, functional requirements updated |
| 2.1 | 2026-02-10 | Docs: Added sidebar location filters (SSR), SEO metadata integration, Phase 3 in progress status |
| 2.0 | 2026-02-07 | Scout: Updated with 32 components, 35 pages, 61 files, 15K+ LOC, Phase 2 complete status |
| 1.0 | 2026-01-28 | Initial project documentation |
