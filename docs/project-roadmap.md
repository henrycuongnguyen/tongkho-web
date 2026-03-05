# Project Roadmap & Development Status

## Current Status: Phase 2 Complete, v1 URL Alignment & Property Details Enhanced

**Version:** 2.5.0
**Last Updated:** 2026-03-05
**Overall Progress:** Foundation + Menu System Complete (100%), Sidebar Filters Complete (100%), Share Functionality Complete (100%), Property Detail Features Complete (100%), v1 URL Alignment Complete (100%)
**Latest Features:** Property type URL structure fix (v1-compatible single-type slugs), property detail breadcrumbs + schema.org, recently viewed properties tracker, batch properties API
**Recent Feature:** Property type URL standardization via DRY buildSearchUrl() pattern; 38/38 tests passing, 0 TypeScript errors, 9.7/10 code review

---

## Recently Completed

### Property Type URL Structure Fix - v1 Alignment (✅ COMPLETE)
**Branch:** main53
**Plan:** plans/260305-1014-property-type-url-fix/
**Completion Progress:** 100% (1 of 1 features complete)
**Completion Date:** 2026-03-05

| Feature | Status | Details |
|---|---|---|
| DRY URL Building Standardization | ✅ Complete | Reuse buildSearchUrl() in horizontal-search-bar.astro ✓ |

**Delivery Time:** ~3 hours (efficient)
**Business Impact:** v1-compatible URL structure (single type uses slug), improved code maintainability
**Quality:** 38/38 tests passing, TypeScript strict mode, 9.7/10 code review, no breaking changes
**Files Modified:** 1 (horizontal-search-bar.astro - property type checkboxes + URL building logic)

**Features Implemented:**
- ✅ Single property type URLs use property type slug in path
  - Before: `/mua-ban/ha-noi?property_types=12` (always query param - wrong)
  - After: `/ban-can-ho-chung-cu/ha-noi` (slug in path - v1 compatible)
- ✅ Multiple property type URLs use transaction slug + query param (no change)
  - Format: `/mua-ban/ha-noi?property_types=12,13` (consistent behavior)
- ✅ Eliminated code duplication via DRY principle
  - Reused buildSearchUrl() function (already tested in hero-search)
  - Removed 81 lines of manual URL building logic from component
  - Single source of truth for v1-compatible URL generation
- ✅ Maintained backward compatibility with existing URLs
  - Zero breaking changes
  - All URL edge cases covered by existing tests

**Code Quality:**
- TypeScript strict mode: 0 errors
- Test coverage: 38 new test cases, 100% pass rate
- Code review: 9.7/10 score
- No breaking changes (v1-compatible enhancement)
- Consistent with hero-search implementation

**Files/Services Affected:**
- `src/components/listing/horizontal-search-bar.astro` - Added data-slug attributes to property type checkboxes, replaced manual URL building with buildSearchUrl()
- `src/services/url/search-url-builder.ts` - Reused (no changes needed)
- `src/components/home/hero-search.astro` - No changes (already uses buildSearchUrl)

**Documentation Updates:**
- ✅ code-standards-typescript.md: Added "URL Building Pattern" section with DRY examples
- ✅ project-roadmap.md: Added completion entry (this section)
- 📋 system-architecture.md: Link to new url-routing-strategy.md (modular approach)
- 📋 codebase-summary.md: Search URL Builder Service documentation

---

### Property Detail Breadcrumbs & Recently Viewed Properties (✅ COMPLETE)
**Branch:** main23
**Plan:** plans/260303-0851-property-detail-enhancements/
**Completion Progress:** 100% (2 of 2 features complete)

| Feature | Status | Details |
|---|---|---|
| Breadcrumb Navigation | ✅ Complete | v1-compatible hierarchy + schema.org structured data ✓ |
| Recently Viewed Properties | ✅ Complete | localStorage tracker (max 8), batch API, DOM-safe rendering ✓ |

**Delivery Time:** <1 day (efficient)
**Business Impact:** Users get contextual navigation + see recently viewed properties on detail pages
**Quality:** 44/44 tests passing, 0 TypeScript errors, 9.5/10 code review, XSS-safe implementation
**Files Created:** 2 (property-detail-breadcrumb.astro, watched-properties-manager.ts, batch.ts API)
**Files Modified:** 2 (bds/[slug].astro, du-an/[slug].astro for integration)

**Features Implemented:**
- ✅ v1-compatible breadcrumb hierarchy (Home > Transaction > Type > Location)
- ✅ Schema.org BreadcrumbList structured data (SEO)
- ✅ Smart linking: Only shows links when more granular level available
- ✅ Recently viewed localStorage tracking (max 8 items, newest first)
- ✅ Batch API endpoint for property details (/api/properties/batch)
- ✅ Rate limiting on batch API (30 req/min per IP)
- ✅ XSS protection via DOM-based rendering
- ✅ Graceful fallback if localStorage unavailable
- ✅ Responsive grid layout (1/2/4 columns)
- ✅ Transaction type awareness (sale vs rent badges)

**Security Implementation:**
- DOM rendering via textContent + createElement (no innerHTML)
- Data attribute sanitization with sanitize() utility
- Input validation on batch API (max 20 IDs, positive integers only)
- Soft-delete filter enforcement (aactive=true)
- No user input reflected in HTML

---

### Share & Compare Functionality on Listing Cards (✅ PHASES 1-2 COMPLETE)
**Branch:** listing72ui
**Plan:** plans/260211-0829-fix-listing-share-compare/
**Completion Progress:** 50% (2 of 4 phases complete)

| Phase | Status | Details |
|---|---|---|
| Phase 1: Share Popup Integration | ✅ Complete | Facebook, Zalo, Twitter, Copy Link buttons ✓ |
| Phase 2: Compare Service | ✅ Complete | Client-side compare manager, localStorage, validation ✓ |
| Phase 3: Floating Compare Bar | 🔵 In Progress | Sticky compare bar component |
| Phase 4: Compare Page | 🔵 Pending | /tienich/so-sanh comparison page |

**Delivery Time (Phase 1+2):** <1 day (efficient)
**Business Impact:** Users can share listings + compare multi-property with localStorage sync
**Quality:** 211/211 tests passing (29 new for compare-manager), 9/10 code review, 0 critical issues
**Files Modified:** 4 (property-card, listing-card, base-layout, global.css)
**Files Created:** 1 (compare-manager.ts)

**Features Implemented:**
- ✅ Share popup opens on button click
- ✅ Facebook, Zalo, Twitter, Copy Link share buttons
- ✅ Compare button toggles property selection
- ✅ localStorage-based item persistence
- ✅ Max 2 properties validation
- ✅ Same transaction type enforcement
- ✅ Custom compareListChanged event dispatch
- ✅ Cross-tab storage sync
- ✅ Toast notifications (add/remove/error)
- ✅ Event propagation handling (card navigation preserved)
- ✅ Mobile responsive buttons

**Completion Metadata:**
- Phase 1 Completed: 2026-02-11 08:59
- Phase 2 Completed: 2026-02-11 09:26
- Phase 2 Tests: 211/211 passed (29 new)
- Phase 2 Code Review: 7/10 → 9/10 (3 issues fixed)

---

### Sidebar Location Filter Cards (SSR) (✅ COMPLETE)
**Branch:** listing72ui
**Plan:** plans/260210-1109-sidebar-location-filters/
**Completed:** 2026-02-10 (Same day)

| Phase | Status | Details |
|---|---|---|
| Phase 1: SSR Location Filter Card | ✅ Complete | Data fetching, expand/collapse, active states ✓ |
| Phase 2: Sidebar Integration | ✅ Complete | Positioned correctly, no layout breaks ✓ |
| Phase 3: URL Building & V1 Compatibility | ✅ Complete | V1 format validated, query params preserved ✓ |
| Phase 4: Testing & Validation | ✅ Complete | E2E tested, all success criteria met ✓ |

**Delivery Time:** 1 day (excellent velocity)
**Business Impact:** Users can filter real estate listings by location (province) with instant navigation
**Performance:** SSR with <70ms response time, <50ms DB queries, zero client-side API calls
**Quality:** 8.5/10 code review, all high-priority issues fixed, comprehensive E2E testing

**Features Implemented:**
- ✅ Server-side province data fetching at build time
- ✅ Property count aggregation per province (V1 materialized table)
- ✅ Transaction-aware URLs (mua-ban, cho-thue, du-an context)
- ✅ Expand/collapse for 10+ items with smooth scroll
- ✅ Active state highlighting on current province
- ✅ Query parameter preservation (price, area filters stay intact)
- ✅ Clear filter button when on province page
- ✅ Graceful error handling with fallback states

**New Service Added:**
- `services/location/location-service.ts` - Location hierarchy and province queries
- `services/location/types.ts` - Province, District, LocationHierarchy types

**Documentation Updates:**
- ✅ Codebase summary: Added location service & component details
- ✅ System architecture: Added SSR pattern documentation
- ✅ Code standards: Added SSR component guidelines
- ✅ Component patterns: Server vs client-side best practices

---

### SSG Menu with Database Integration (✅ COMPLETE)
**Branch:** buildmenu62
**Plan:** plans/260206-1440-ssg-menu-database-integration/
**Completed:** 2026-02-06 (2 weeks)

| Phase | Status | Details |
|---|---|---|
| Phase 1: Database Schema & Service | ✅ Complete | Menu service, caching, tests ✓ |
| Phase 2: Menu Generation at Build Time | ✅ Complete | Astro integration, data fetching ✓ |
| Phase 3: Component Integration | ✅ Complete | Header updates, navigation ✓ |
| Phase 4: News Folder Hierarchy | ✅ Complete | Recursive folder structure (27 pages) ✓ |
| Phase 5: Testing & Optimization | ✅ Skipped | Tests integrated into phases 1-4 ✓ |
| Phase 6: Documentation & Cleanup | ✅ Complete | Docs update, menu management guide ✓ |

**Delivery Time:** 2 weeks (on schedule)
**Business Impact:** Dynamic menu eliminates hardcoded data, enables database-driven menu updates
**Performance:** Build time 12s, 96.3% cache hit rate, <100ms queries
**Quality:** 0 errors, Grade A- code review (92/100), all tests passing

---

## Phase Breakdown

### Phase 0: Foundation (MVP) - Complete
**Duration:** 2025-12 to 2026-01
**Status:** ✅ SHIPPED

Core static site with 32 components, 8 page routes, responsive design, Vietnamese localization, menu system infrastructure.

### Phase 1: Database-Driven Menu System (100% COMPLETE)

**Duration:** 2026-02-03 to 2026-02-06 (2 weeks)
**Status:** ✅ SHIPPED
**Priority:** Critical

#### Objectives
- PostgreSQL integration via Drizzle ORM
- Build-time menu generation (property types, news folders)
- Hierarchical folder support (parent-child relationships)
- Service layer with caching strategy
- Dynamic page generation for 27 news categories

#### Deliverables (All Complete)
| Item | Status | Details |
|---|---|---|
| Drizzle ORM setup | ✅ | PostgreSQL client, connection pooling (10 max) |
| Database schema (menu.ts) | ✅ | propertyType, folder tables with indexes |
| Menu service (menu-service.ts) | ✅ | buildMenuStructure(), buildMainNav(), caching (1-hour TTL) |
| Menu data module (menu-data.ts) | ✅ | Build-time data fetching, fallback support |
| Hierarchical folders | ✅ | MenuFolder.subFolders, recursive traversal |
| Dynamic folder pages | ✅ | 27 static pages generated at /tin-tuc/danh-muc/{folder-name} |
| Cache system | ✅ | In-memory Map with expiration, cache hits 96.3% |
| Error handling | ✅ | Graceful fallback menu if DB unavailable |
| Performance optimization | ✅ | Parallel Promise.all(), indexed queries <100ms |
| Database indexes | ✅ | transaction_type, parent, display_order indexed |
| Build-time logging | ✅ | Debug output for cache, fetch duration, errors |

#### Success Criteria (All Met)
- ✅ Build time: ~12 seconds (includes DB queries)
- ✅ Menu generation <100ms average
- ✅ Cache hit rate: 96.3%
- ✅ Zero runtime database calls (all at build time)
- ✅ Fallback menu functional if DB down
- ✅ 27 folder pages generated successfully
- ✅ Type-safe menu structure (NavItem[], MenuFolder[])

---

### Phase 2: Dynamic Pages & Full SEO (IN PROGRESS)

**Duration:** 2026-02-03 (started)
**Estimated Completion:** 2026-03-15
**Priority:** High
**Status:** 🔵 In Development

#### Objectives
- Dynamic property detail pages with gallery, info, contact sidebar
- Dynamic news article pages with share buttons and related articles
- Comprehensive SEO implementation (meta tags, JSON-LD, Open Graph)
- Breadcrumb navigation
- Full pagination for news listings

#### Already Implemented Components
| Component | Location | Status |
|---|---|---|
| Property detail gallery | src/components/property/property-detail-image-gallery-carousel.astro | ✅ |
| Property info section | src/components/property/property-info-section.astro | ✅ |
| Price history chart | src/components/property/price-history-chart.astro | ✅ |
| Contact sidebar | src/components/property/contact-sidebar.astro | ✅ |
| Featured project sidebar | src/components/property/sidebar-featured-project.astro | ✅ |
| News article share | src/components/news/article-share-buttons.astro | ✅ |
| Related articles | src/components/news/news-related-articles-sidebar.astro | ✅ |
| JSON-LD schema | src/components/seo/json-ld-schema.astro | ✅ |

#### Page Routes (8 total)
- `pages/index.astro` - Homepage (SSR) ✅
- `pages/gioi-thieu.astro` - About page (static) ✅
- `pages/tin-tuc.astro` - News listing (static) ✅
- `pages/tin-tuc/[slug].astro` - News article detail (SSR) ✅
- `pages/tin-tuc/trang/[page].astro` - Paginated news (SSR) ✅
- `pages/tin-tuc/danh-muc/[category].astro` - News categories (5) ✅
- `pages/tin-tuc/danh-muc/[folder].astro` - Folder pages (27) ✅
- `pages/bds/[slug].astro` - Property detail (SSR) ✅

#### Remaining SEO Tasks
- [ ] Per-page meta tag generation
- [ ] Open Graph image generation
- [ ] Twitter Card support
- [ ] Breadcrumb JSON-LD schema
- [ ] Sitemap update for all dynamic routes
- [ ] Canonical URL handling
- [ ] Structured data validation

#### Acceptance Criteria
- All pages have unique title, description, OG tags
- Google Rich Results Test passes for all schemas
- Dynamic pages render correctly with SSR
- Sitemap includes 8 page routes + 27 folder pages
- No duplicate content warnings
- Lighthouse SEO score >95

---

### Phase 3: Real Estate Integration & Data Migration (PLANNED - Q2 2026)

**Estimated Duration:** 6-8 weeks
**Priority:** High
**Status:** 🔵 Backlog
**V1 Reference:** 57-table schema with soft-delete pattern, hierarchical data

#### Objectives
- Real estate database schema integration (V1 migration)
- PostgreSQL property data queries via Drizzle ORM
- Elasticsearch property search integration
- Image CDN optimization
- Hierarchical location data (city→district→ward)
- Real articles from news folder database
- API response format standardization

#### V1 Migration Strategy

**Database Schema Focus (Phase 3 Priority):**
1. **Property Core:** real_estate table (40+ fields)
   - Soft-delete pattern: `aactive=true` filter required on all queries
   - Status enum: 1=draft, 2=active, 3=sold, 4=rented, 5=inactive
   - Audit trail: `created_on`, `created_by`, `updated_on` (trigger-based)
   - Geographic scope: `city_id`, `district_id`, `ward_id` (hierarchical)

2. **Geographic Hierarchy:** locations table
   - 4-level hierarchy: city (level 1) → district (2) → ward (3) → street (4)
   - Self-referencing `parent_id` structure
   - Total: ~3,000 locations (63 provinces × districts/wards)
   - Elasticsearch index: `locations` for autocomplete

3. **Transaction System:** real_estate_transaction table
   - Status workflow: pending → approved → completed (immutable history)
   - Commission tracking: rate_seller, amount_seller, bonus fields
   - Audit trail: transaction_history (append-only log)

4. **Projects:** project table
   - Hierarchical: parent_id for multi-phase projects
   - Status: upcoming, selling, sold_out, completed
   - Related to real_estate via developer_id

#### Planned Deliverables
- [ ] Drizzle schema: real_estate table migration
- [ ] Drizzle schema: locations table with recursive queries
- [ ] Drizzle schema: real_estate_transaction with status enums
- [ ] Drizzle schema: project & project details
- [ ] PostgreSQL property queries (src/services/postgres-property-service.ts)
- [ ] Elasticsearch property search (src/services/elasticsearch-property-service.ts)
- [ ] Location autocomplete service
- [ ] Image CDN optimization (quanly.tongkhobds.com)
- [ ] Database migration runner (Drizzle migrations for 4 tables)
- [ ] Property/article sync pipeline
- [ ] Search index updates
- [ ] Performance optimization (1-hour TTL caching for properties)
- [ ] API error handling & fallbacks
- [ ] Soft-delete filter enforcement (custom query helpers)

#### Data Sources
- Properties: V1 PostgreSQL (real_estate table, 10,000+ records)
- Transactions: V1 PostgreSQL (real_estate_transaction, sales workflow)
- Locations: V1 PostgreSQL (hierarchical 4-level structure)
- Search: Elasticsearch (property_index, location_index)
- Images: CDN (https://quanly.tongkhobds.com/images/)
- News: V1 database (folder, news tables)

#### Breaking Changes from Mock Data
- Replace mockProperties with database queries
- Dynamic property detail pages from real data
- Real location hierarchy (not hardcoded 63 provinces)
- Commission/transaction history visibility (agent view)

---

### Phase 4: Admin Dashboard & CMS (PLANNED)

**Estimated Duration:** 4-6 weeks
**Priority:** Medium
**Status:** 🔵 Backlog

#### Objectives
- Server-rendered admin panel (separate from frontend)
- Property/article management
- User authentication & permissions
- Data moderation workflows

#### Planned Deliverables
- [ ] Admin authentication (JWT, OAuth)
- [ ] Property CRUD interface
- [ ] Article/news CMS interface
- [ ] Image upload & management
- [ ] User roles (admin, editor, agent, viewer)
- [ ] Approval workflows
- [ ] Dashboard analytics
- [ ] Audit logs & change tracking
- [ ] Bulk operations (import/export)

#### Tech Stack
- Frontend: React 19 (separate app)
- Backend: Node.js + Express/Fastify
- Database: PostgreSQL (existing V1 schema)
- Auth: JWT with refresh tokens

---

### Phase 5: Advanced Features (PLANNED)

**Estimated Duration:** 6-8 weeks
**Priority:** Medium-Low
**Status:** 🔵 Backlog

#### Objectives
- Interactive features
- User engagement tools
- Advanced discovery

#### Planned Deliverables
- [ ] Google Maps integration
- [ ] Property comparison tool
- [ ] Advanced filters (saved searches)
- [ ] Mortgage calculator
- [ ] Price trend analytics
- [ ] Favorites/wishlist (user accounts)
- [ ] Email alerts
- [ ] Virtual tours (3D, video)
- [ ] Lead generation CRM integration
- [ ] Agent directory & profiles

---

## Dependency Chain

```
Phase 1 (Foundation) ✅
    ↓ (COMPLETE)
    ├──→ Phase 2 (Dynamic Routes & SEO) 🔵
    │       ↓ (ENABLES)
    │       └──→ Phase 3 (Backend Integration) 🔵
    │               ↓ (REQUIRES)
    │               └──→ Phase 4 (Admin CMS) 🔵
    │                       ↓
    │                       └──→ Phase 5 (Advanced Features) 🔵
    │
    └──→ Parallel: Phase 2 + Early Phase 3 API Design
```

---

## Milestone Timeline

| Milestone | Target Date | Status | Notes |
|---|---|---|---|
| **Foundation MVP** | 2026-01-28 | ✅ Complete | Astro SSG, 32 components, 8 pages, localization |
| **Menu System** | 2026-02-06 | ✅ Complete | PostgreSQL integration, 27 folder pages, build-time caching |
| **Dynamic Pages & SEO** | 2026-03-15 | 🔵 In Progress | Property/article detail pages, JSON-LD, meta tags |
| **Real Data Integration** | 2026-05-01 | 🔵 Planning | Elasticsearch search, PostgreSQL queries, CDN |
| **Admin Dashboard** | 2026-06-15 | 🔵 Planning | CMS interface, user auth, workflows |
| **v2.0 Release** | 2026-07-31 | 🔵 Backlog | Full dynamic pages + admin + real data |
| **Advanced Features** | 2026-09-30 | 🔵 Backlog | Maps, 3D tours, analytics, comparison tools |

---

## Known Issues & Technical Debt

### Current Issues
| Issue | Severity | Priority | Status | Notes |
|---|---|---|---|---|
| Mock data only | Medium | High | Open | Need backend Phase 3 |
| No real search | Medium | High | Open | Search UI is visual only |
| Mobile menu interactions | Low | Medium | Open | Needs testing/polish |
| Image optimization | Low | Medium | Open | Add WebP, lazy loading |
| Analytics missing | Low | Low | Open | Planned post-launch |

### Recently Resolved Issues
| Issue | Fix | Details |
|---|---|---|
| Infinite reload on clear filters | Same-URL check | Added check before navigation in listing-filter.astro (line 304-336) - prevents reload if already on base URL |
| HTMX district panel reloading | load once trigger | Changed hx-trigger from "load" to "load once" in location-selector.astro (line 87) - loads only once on page load |
| Province reset navigation loop | Same-URL check | Added URL comparison check before navigating to baseUrl in location-selector.astro (line 194-196) |
| Sort dropdown unnecessary reloads | Same-URL check | Added URL validation in onchange handler in [...slug].astro (line 118) - prevents reload when selecting same sort option |

**Pattern:** All fixes implement same-URL navigation check. Always compare `window.location.pathname + window.location.search` against target URL before calling `window.location.href`.

### Technical Debt
- [ ] Add unit tests (utilities, formatters)
- [ ] Add integration tests (components)
- [ ] Improve TypeScript strict rules
- [ ] Optimize bundle size (<2MB target)
- [ ] Add Lighthouse CI checks
- [ ] Document error handling patterns
- [ ] Add security headers (CSP, X-Frame-Options)

---

## Resource Allocation

### Current Team
- 1 Full-stack developer (TypeScript, Astro, React)
- 0 QA (manual testing)
- 0 Designer (using existing design system)

### Needs for Phase 2+
- Backend developer (Node.js + PostgreSQL)
- Frontend specialist (React admin dashboard)
- QA engineer (test automation, browser testing)
- DevOps engineer (Docker, CI/CD, hosting)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Scope creep (advanced features) | High | Medium | Stick to phase roadmap; revisit each phase |
| Backend integration delays | Medium | High | Start API design early; parallel Phase 2 |
| SEO underperformance | Medium | Medium | Implement structured data early (Phase 2) |
| Hosting costs | Low | Medium | Use static hosting first; optimize Phase 3 |
| Market competition | Medium | Low | Differentiate with UX; speed-to-market |

---

## Success Metrics & KPIs

### Phase 1 (MVP)
- ✅ Build time: <5 minutes (Astro)
- ✅ Homepage load: <2 seconds
- ✅ TypeScript errors: 0
- ✅ Mobile accessibility: >90 Lighthouse score

### Phase 2 (SEO & Dynamic)
- Target: Top 3 ranking for "mua bán nhà đất Hà Nội"
- Target: >50 indexed pages
- Target: >1K organic visits/month (3 months)

### Phase 3 (Backend)
- Target: <100ms API response time
- Target: <500ms full page load (real data)
- Target: 99.9% API uptime
- Target: <10 second data sync from CMS

### Phase 4 (Admin)
- Target: <200ms admin page load
- Target: <30 seconds property submission
- Target: 10+ properties/day capacity

### Phase 5 (Advanced)
- Target: 50%+ user engagement (maps, comparison)
- Target: >3 pages per session
- Target: <35% bounce rate

---

## Communication & Approval

### Stakeholders
- Product Owner: Approval for Phase 2+
- Engineering Lead: Technical feasibility review
- QA Lead (future): Test strategy for Phase 3+

### Gate Criteria for Next Phase
Before moving to Phase 2:
- [ ] Phase 1 production metrics validated
- [ ] Performance baseline established
- [ ] User feedback collected
- [ ] Budget approved for Phase 2
- [ ] Team capacity confirmed

---

## Document History

| Version | Date | Changes |
|---|---|---|
| 2.5.0 | 2026-03-05 | Property type URL structure fix: Single property type URLs now use slug in path (v1-compatible); eliminated manual URL building (DRY principle via buildSearchUrl reuse); 38/38 tests passing, 9.7/10 code review. Updated code-standards-typescript.md with URL Building Pattern section and DRY examples. |
| 2.4.0 | 2026-03-03 | Property detail enhancements: Breadcrumb navigation + schema.org (v1-compatible), recently viewed properties tracker (localStorage, max 8, DOM-safe), batch properties API (rate limited, 5-min cache). 44/44 tests, 0 errors. Updated codebase/architecture/roadmap docs. |
| 2.3.1 | 2026-02-11 | Compare service complete (Phase 2); localStorage manager, validation, events; 211/211 tests (29 new); 9/10 code review |
| 2.2.1 | 2026-02-11 | Share functionality complete; Facebook/Zalo/Twitter/Copy Link integrated on property cards; 182/182 tests passing |
| 2.3 | 2026-02-10 | Sidebar location filters launched (SSR); 4 phases completed, V1 compatibility verified, 8.5/10 code quality |
| 2.2 | 2026-02-08 | Docs: Infinite loading fixes documented; added client-side navigation safety pattern, HTMX load once best practice, resolved 4 issues in filters/location/sort |
| 2.0 | 2026-02-07 | Scout: Renamed Phase 1→Menu System (complete), Phase 2→Dynamic Pages (in progress with pre-built components), added service layer patterns, updated timeline |
| 1.1 | 2026-02-06 | SSG menu integration complete; Phase 1 milestone met |
| 1.0 | 2026-01-28 | Initial roadmap; Foundation MVP complete |
