# V2 Architecture Patterns: Sidebar Location Filters
**Research Date:** 2026-02-10 | **Status:** Complete

## Executive Summary
V2 codebase has established patterns for sidebar filters via modular service + Astro component architecture. Location data flows through `LocationService` → `SidebarFilterService` → Astro components with HTMX for dynamic loading. Sidebar location filters should follow proven patterns: service layer handles data, Astro handles static rendering, HTMX handles dynamic interactions.

---

## 1. Existing Location Services Architecture

### LocationService (`src/services/location/location-service.ts`)
**Key Patterns:**
- **Build-time optimization**: In-memory caching via `cachedHierarchy` singleton
- **V1 compatibility**: Uses `locationsWithCountProperty` materialized table (pre-aggregated counts)
- **Two data sources**:
  - `locations_with_count_property`: Fast, aggregated (production)
  - `locations`: Full detail queries for lookups
- **Hierarchy building**: `buildLocationHierarchy()` returns `{ provinces, districtsByProvince }`

**Core Functions:**
```
getAllProvincesWithCount(limit?, useNewAddresses=true) → Province[]
getDistrictsByProvinces(provinceNIds) → Record<string, District[]>
buildLocationHierarchy() → LocationHierarchy (cached)
resolveLocationSlugs(slugs) → {nId, name, slug, type, provinceId}[]
```

**Data Model:**
```typescript
Province: { id, nId, name, slug, propertyCount, cityImage, displayOrder }
District: { id, nId, name, slug, provinceId }
LocationHierarchy: { provinces[], districtsByProvince{} }
```

---

## 2. Sidebar Filter Service Pattern

### SidebarFilterService (`src/services/sidebar-filter-service.ts`)
**Architecture:**
- Takes `SidebarFilterParams` (transactionType, province/district context, baseUrl)
- Generates dynamic filter blocks based on URL context
- Returns `SidebarFilterBlock[]` structure:

```typescript
SidebarFilterBlock {
  id: string            // 'districts', 'property-types'
  title: string         // Display title
  filters: SidebarFilter[]
}

SidebarFilter {
  title: string
  url: string           // Ready-to-use navigation URL
  count?: number
}
```

**Pattern:**
1. Context-aware filtering (only show districts if on province page)
2. Pre-built URLs (no client-side URL building needed)
3. Ordered by popularity (searchCount DESC)
4. Limit results (50 districts, 20 property types)

---

## 3. Sidebar Component Patterns

### Component Structure
**Location Selector** (`location-selector.astro`):
- Province button (modal trigger)
- District search input + dropdown (HTMX-driven)
- HTMX loads districts on province selection: `/api/location/districts?province={nId}`
- View Transition safe (data-initialized tracking)

**Filter Cards** (`price-range-filter-card.astro`):
- Predefined options + clear filter action
- Direct links (no API calls needed)
- URL building functions (`buildPriceSlug`, `getRangeUrl`)
- Preserves query params (area, property_types)

**Key Patterns:**
- Astro props for initial data (build-time)
- `data-*` attributes for JS state management
- HTMX for lazy-loaded content (districts)
- Event listeners for interactive updates
- View Transition `data-initialized` guard

---

## 4. URL Building System

### SearchUrlBuilder (`src/services/url/search-url-builder.ts`)
**Architecture:**
- Client-side implementation (V1 port)
- No server roundtrip needed
- Handles: transaction type, location, property types, price, area, sort

**URL Format (V1 compatible):**
```
/{arg0}/{arg1}/{arg2}?{params}
arg0: transaction type (mua-ban, cho-thue, du-an)
arg1: location slug OR property-type slug
arg2: price slug (gia-tu-1-ty-den-2-ty)
params: property_types, area ranges, sort, etc.
```

**Filter URL Building Pattern:**
- Price ranges: Call `buildPriceSlug(min, max)` → price slug
- Locations: Direct slug navigation (no calculation)
- Property types: Use query params + property_types slug in arg1

---

## 5. Location API Endpoints

### Existing Pattern (`/api/location/districts`)
**Used by:** `location-selector.astro` HTMX call
**Returns:** HTML fragment (district list)
**Params:** `province={nId}&base={baseUrl}`

**For Sidebar Location Cards**, need to follow this pattern:
- Endpoint returns only changed content
- Maintains HTMX-friendly HTML structure
- Loads on-demand (not pre-rendered)

---

## 6. Recommended Sidebar Location Component Structure

### New Component: `location-filter-card.astro`
**Purpose:** Display location filter options in sidebar context

**Props:**
```typescript
interface Props {
  transactionType: number      // 1=mua-ban, 2=cho-thue, 3=du-an
  currentProvince?: string     // Current page province slug
  currentDistrict?: string     // Current page district slug
  baseUrl: string              // e.g., /mua-ban
  maxItems?: number            // Default: 10
}
```

**Implementation Strategy:**
1. **Build-time rendering:**
   - Use `LocationService.getAllProvincesWithCount()` for province list
   - Show top provinces (filtered by property count)
   - Add "Xem tất cả" → Province selector modal

2. **Dynamic districts:**
   - Load via HTMX if province selected: `/api/location/districts`
   - Client-side search filter like `location-selector`
   - Preserve query params (area, property_types)

3. **URL generation:**
   - Use slug-based navigation (no calculation)
   - Format: `/{transactionType}/{province}` or `/{transactionType}/{province}/{district}`
   - Preserve existing query params

---

## 7. Architectural Decisions Made (Inherited)

**✓ Service Layer Approach:**
- Data access via LocationService (not inline queries)
- Reusable `SidebarFilterService` pattern for blocks
- Caching at service level (singleton in-memory)

**✓ Build-Time Optimization:**
- Use materialized `locations_with_count_property` table
- Pre-calculate province counts
- Cache hierarchy during build

**✓ HTMX for Dynamic Content:**
- District lists load via HTMX (not pre-rendered)
- API endpoints return HTML (not JSON)
- Preserves SEO benefits (static shell, dynamic internals)

**✓ Astro Component Philosophy:**
- Minimal client-side JS (data-* attributes only)
- Server-side prop drilling for initial data
- Event-based JS for interactions (CustomEvent, HTMX)

**✓ URL Structure:**
- V1-compatible slug-based routing
- No hash-based navigation
- Query params for secondary filters

---

## 8. File References & Related Code

**Core Services:**
- `src/services/location/location-service.ts` (161 lines)
- `src/services/sidebar-filter-service.ts` (172 lines)
- `src/services/url/search-url-builder.ts` (229 lines)

**Components:**
- `src/components/listing/sidebar/location-selector.astro` (317 lines)
- `src/components/listing/sidebar/price-range-filter-card.astro` (168 lines)
- `src/components/listing/sidebar/province-selector-modal.astro`
- `src/components/listing/sidebar/dynamic-sidebar-filters.astro`

**Types:**
- `src/services/location/types.ts`
- `src/types/search-filters.ts`

---

## 9. Reusable Patterns Summary

| Pattern | File | Reuse For Locations |
|---------|------|-------------------|
| Service → Props → Astro | LocationService → location-selector | Copy pattern for location filter card |
| HTMX Dynamic Loading | location-selector (districts) | Load related locations dynamically |
| Data-driven Components | price-range-filter-card | Static + dynamic location options |
| URL Builder | search-url-builder.ts | Extend for location params |
| Modal Pattern | province-selector-modal.astro | Reuse for expanded location selection |
| Sidebar Block Pattern | SidebarFilterService | Extend for location block generation |

---

## Implementation Checklist

- [ ] Extend `SidebarFilterService` with `generateLocationBlock()` function
- [ ] Create `location-filter-card.astro` component
- [ ] Add API endpoint: `/api/location/popular` (top provinces by count)
- [ ] Update `dynamic-sidebar-filters.astro` to include location block
- [ ] Test URL generation preserves existing query params
- [ ] Update tests for service layer functions
- [ ] Document location filter block in sidebar documentation

---

## Unresolved Questions

1. **Location count source:** Should location filter cards show property counts? (Current design shows counts only in province modals)
2. **Max popular locations:** How many "top provinces" to show in sidebar? (Recommended: 5-8)
3. **Secondary filters:** Should sidebar show district options without location selection? (Current pattern: NO - districts load only on province selection)
