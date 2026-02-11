# V2 Listing Page Architecture & Price History Integration Analysis

## Executive Summary
V2 listing uses stateless, URL-driven architecture with sidebar containing 5-6 filter/info cards. Price history chart exists but only for detail pages. Integration requires minimal refactoring: add price-history card to sidebar wrapper.

---

## V2 Listing Page Architecture

### Main Entry Point
**File:** `src/pages/[...slug].astro` (300 lines)

**URL Pattern:** `/{transaction}/{location}/{property-type}?filters`
- `transaction`: mua-ban | cho-thue | du-an
- `location`: ha-noi | ba-dinh | toan-quoc
- `property-type`: ban-can-ho-chung-cu | etc (optional)
- Query params: `sort`, `minPrice`, `maxPrice`, `minArea`, `maxArea`, `keyword`, `bedrooms`, `bathrooms`, `page`, `radius`

**Core Flow:**
1. Parse URL → filters (PropertySearchFilters)
2. Parallel queries (SSG-optimized):
   - `searchProperties()` → ES results (24 per page)
   - `getFeaturedProjects()` → 5 featured projects
   - `getSideBlock()` → Location-based sidebar blocks
3. Render layout with 3 main sections:
   - Horizontal search bar
   - Property grid + pagination
   - **Sidebar** (our focus)

**Data Passing:**
```astro
<Fragment slot="sidebar">
  <SidebarWrapper
    filters={filters}
    featuredProjects={featuredProjects}
    sideBlocks={sideBlocks}
  />
</Fragment>
```

---

## Current Sidebar Structure

**File:** `src/components/listing/sidebar/sidebar-wrapper.astro` (48 lines)

### Existing Cards (in order):
1. **ContactCard** - Quick contact form (static)
2. **PriceRangeFilterCard** - 13 predefined + custom ranges
3. **AreaRangeFilterCard** - Area filters
4. **DynamicSidebarFilters** - Context-aware filters (optional)
5. **LocationFilterCard** - Province/district selector + side blocks (SSR)
6. **FeaturedProjectBanner** - 5 featured projects

### Props Pattern:
```typescript
interface Props {
  filters: PropertySearchFilters;
  dynamicFilterBlocks?: SidebarFilterBlock[];
  featuredProjects?: FeaturedProject[];
  sideBlocks?: SideBlock[];
}
```

### Layout:**
```html
<div class="space-y-4">
  <!-- 6 cards stacked vertically with 4px gap -->
</div>
```

---

## Existing Price History Chart

**File:** `src/components/property/price-history-chart.astro` (182 lines)

### Current State:
- Located in `property/` component folder (implies detail page use)
- Accepts: `currentPrice` (number), `priceUnit` (string)
- **Generates MOCK data** via `generatePriceHistory()` function
- Displays 2-year & 5-year toggle views
- Uses Chart.js library (loaded via CDN)
- Features: Price change %, trend visualization, responsive

### Mock Data Generation:
```ts
function generatePriceHistory(years: number, currentPrice: number)
  // Simulates historical fluctuation around baseline
  // startPrice = currentPrice * (0.7 - 0.8)
  // Adds random ±2.5% monthly fluctuation
```

### Limitations:
- No real historical data integration
- Cannot work at listing level (needs per-property prices over time)
- No date range filtering
- Disclaimer note: "* Dữ liệu tham khảo dựa trên biến động thị trường khu vực"

---

## Data Fetching Patterns in V2

### Pattern 1: Server-Side (Astro props)
**Example:** `PriceRangeFilterCard`, `AreaRangeFilterCard`
- No data fetching - uses passed props
- Stateless, pure presentation
- Client-side URL navigation via links

### Pattern 2: Page-Level Fetch (with Promise.all)
**Example:** Main listing page (line 184)
```ts
const [searchResult, featuredProjects, sideBlocks] = await Promise.all([
  searchProperties(filters),        // Elasticsearch
  getFeaturedProjects(5),           // API/Service
  getSideBlock({ pattern })         // API/Service
]);
```
- Parallel execution in Astro component
- Results passed to sidebar via props
- No client-side fetch required

### Pattern 3: SSR with Error Handling
**Example:** `getSideBlock()` with fallback (line 187)
```ts
sideBlockPattern ? getSideBlock({ pattern }).catch(err => {
  console.error('[Page] Failed to load side blocks:', err);
  return [];
}) : Promise.resolve([])
```

---

## Integration Recommendations

### Option A: Price History Card (Recommended - YAGNI)
**Approach:** Add lightweight card to sidebar using mock data (current approach)

**Placement:** Between `AreaRangeFilterCard` and `DynamicSidebarFilters`
- Consistent with other cards
- Before dynamic filters keeps focus on core filters

**Implementation:**
1. Create `src/components/listing/sidebar/price-history-card.astro`
   - Accept single prop: `samplePrice?: number` (optional aggregate)
   - Reuse `generatePriceHistory()` logic from existing component
   - Styling matches other cards (bg-white, rounded-lg, shadow-sm)

2. Update `sidebar-wrapper.astro`:
   ```astro
   <PriceHistoryCard samplePrice={filters.maxPrice} />
   ```

3. Add to imports (4 new lines)

**Pros:**
- Minimal code changes
- Reuses existing chart logic
- Consistent UX
- No new data fetching needed

**Cons:**
- Still mock data (limitation of current chart)
- May show generic trends not specific to displayed properties

### Option B: Aggregated Real Data (Future)
If real price history needed:
1. Extend Elasticsearch query to return price stats by location/type
2. Create service: `getPriceHistoryStats(filters)`
3. Fetch at page level (line 184)
4. Pass stats to card component
5. Replace mock generation with real data

**Migration Path:** Option A → Option B when data available

---

## Key Files Reference

| File | Lines | Purpose |
|------|-------|---------|
| `[...slug].astro` | 300 | Main listing router & page data fetch |
| `sidebar-wrapper.astro` | 48 | Sidebar card orchestrator |
| `price-range-filter-card.astro` | 168 | Filter logic + URL building |
| `price-history-chart.astro` | 182 | Chart rendering + mock data |
| `listing-grid.astro` | TBD | Property card grid |

---

## Missing/Gap Analysis

1. **No per-property price history** - ES doesn't track price changes
2. **No sidebar card template** - Would benefit from reusable card wrapper component
3. **No real aggregated stats** - Could add market trend card (separate feature)
4. **No data caching strategy** - Featured projects & side blocks fetched every render

---

## Summary

**Integration Point:** `sidebar-wrapper.astro` line 43-46 (after AreaRangeFilterCard)

**Effort:** ~2 hours
- Create sidebar card component wrapper
- Extract & adapt price-history-chart for listing context
- Add import & slot in wrapper
- Style consistency pass

**Data Flow:** No changes - uses existing mock generation pattern
