---
title: "Property Detail Page: Breadcrumbs & Recently Viewed"
description: "Fix breadcrumbs to match v1 hierarchy and add recently viewed properties list"
status: completed
priority: P2
effort: 6h
branch: main23
tags: [breadcrumb, recently-viewed, property-detail, v1-migration]
created: 2026-03-03
completed: 2026-03-03
---

# Property Detail Page: Breadcrumbs & Recently Viewed

## Overview

Two enhancements for property detail page (`/bds/[slug].astro`) and project detail page (`/du-an/[slug].astro`):

1. **Breadcrumbs Fix** - Current v2 breadcrumbs missing property type and location hierarchy
2. **Recently Viewed** - Track and display user's viewing history using localStorage

## Phase Summary

| Phase | Task | Effort | Status |
|-------|------|--------|--------|
| 1 | [Breadcrumbs Component](./phase-01-breadcrumbs-component.md) | 2h | completed |
| 2 | [Recently Viewed System](./phase-02-recently-viewed-system.md) | 4h | completed |

## Key Findings from Research

### v1 Breadcrumb Structure (from `build_breadcrumbs_for_property_detail`)

```
Trang chủ > Transaction Type > Property Type > City > District > Ward
```

**v1 Python Logic (`bds.py:962-1023`):**
1. Always starts with "Trang chủ" → `/`
2. Transaction type (Mua Bán/Cho Thuê) → `/mua-ban` or `/cho-thue`
3. Property type (Căn hộ, Nhà riêng, etc.) → `/{property-type-slug}`
4. City (if available) → `?selected_addresses={city-slug}`
5. District (if available) → `?selected_addresses={district-slug}`
6. Ward (if available) → `?selected_addresses={ward-slug}`

**Current v2 Problem:**
- Missing property type level
- Missing location hierarchy (city → district → ward)
- Only shows: `Trang chủ > Mua Bán > [Title]`

### v1 Recently Viewed Implementation

**Storage:** `localStorage.watched_properties_list` (JSON array)

**Data Structure:**
```typescript
interface WatchedProperty {
  estateId: string;
  transactionType: string;
  title: string;
  url: string;
  image: string;
}
```

**Behavior (`watched_properties.js`):**
1. On page load, read current property from `h1.title` data attributes
2. Remove current property from list (if exists) to avoid duplicates
3. Fetch remaining properties via AJAX: `/bds/load_watched_properties.load?ids=...`
4. Add current property to front of list
5. Cap list at 8 items (remove oldest)
6. Save back to localStorage

**Display (`load_watched_properties.load`):**
- Section title: "Bất động sản đã xem"
- Swiper carousel on mobile
- 4-column grid on desktop
- Uses same `property_card.html` template as listings

## Architecture Decisions

### Breadcrumbs
- Create reusable `PropertyDetailBreadcrumb` component
- Accept `property` object with full location/type data
- Build URLs matching v1 format using `selected_addresses` param

### Recently Viewed
- Follow existing pattern from `CompareManager` (localStorage + singleton)
- Create `WatchedPropertiesManager` in `src/scripts/`
- Server-rendered static container, client-populated content
- Use `PropertyCard` for consistent display

## Dependencies

- `src/db/schema/menu.ts` - `propertyType` table for type info
- `src/db/schema/location.ts` - `locations` table for location slugs
- `src/scripts/compare-manager.ts` - Pattern reference for localStorage
- `src/components/cards/property-card.astro` - Card component

## Success Criteria

- [x] Breadcrumbs match v1 hierarchy: Transaction > Property Type > City > District > Ward
- [x] Each breadcrumb level links to correct listing page with filters
- [x] Recently viewed tracks last 8 properties viewed
- [x] Recently viewed section displays after related properties
- [x] Recently viewed persists across sessions (localStorage)
- [x] No duplicate entries in recently viewed list

## Implementation Results

### Phase 1: Breadcrumbs (100% Complete)
- Created `src/components/property/property-detail-breadcrumb.astro` - Full breadcrumb hierarchy support
- Updated `src/pages/bds/[slug].astro` - Integrated breadcrumb with property data
- Updated `src/pages/du-an/[slug].astro` - Integrated breadcrumb with project data
- All breadcrumb levels working: Home > Transaction > Property Type > City > District > Ward
- Schema.org BreadcrumbList structured data included

### Phase 2: Recently Viewed (100% Complete)
- Created `src/scripts/watched-properties-manager.ts` - DOM-based rendering (XSS-safe)
- Created `src/pages/api/properties/batch.ts` - Rate-limited batch API (30 req/min)
- Updated `src/pages/bds/[slug].astro` - Added watched-properties container
- localStorage tracking: max 8 items, newest first
- Client-side rendering with property cards

### Security Improvements
- Fixed innerHTML XSS vulnerability → replaced with DOM methods
- Added rate limiting to batch API endpoint
- Sanitized all user-controlled data

### Testing Summary
- Tests: 44/44 passing (100% success rate)
- Build: 0 TypeScript errors
- Code review: 9.5/10 (after security fixes)

### Files Changed
1. `src/components/property/property-detail-breadcrumb.astro` (NEW)
2. `src/scripts/watched-properties-manager.ts` (NEW)
3. `src/pages/api/properties/batch.ts` (NEW)
4. `src/pages/bds/[slug].astro` (MODIFIED)
5. `src/pages/du-an/[slug].astro` (MODIFIED)
