# Rendering Strategy Summary

## Hybrid SSG/SSR Architecture

### SSR Components (Server-Side Rendering)
Components that render on each request with dynamic data:

| Phase | Component | Reason for SSR |
|-------|-----------|----------------|
| Phase 1 | ElasticSearch Service | Dynamic queries based on filters |
| Phase 3 | Dynamic Route & URL Parsing | Parse user filter params |
| Phase 6 | Listing Section & Pagination | Real-time property data |
| Phase 12 | Dynamic Sidebar Filters | Context-aware filter blocks |

**Why SSR:**
- Listing data changes frequently (new properties, price updates)
- Infinite filter combinations (cannot pre-generate)
- Real-time search results from Elasticsearch
- Redis cache provides fast response (<50ms)

---

### SSG Components (Static Site Generation)
Components that generate at build time:

| Phase | Component | Reason for SSG |
|-------|-----------|----------------|
| Phase 2 | Location Data Service | Province/district data rarely changes |
| Phase 4 | Filter Section UI | Static UI structure |
| Phase 5 | Breadcrumb Section | Static component structure |
| Phase 7 | Interactive Features | Client-side interactions |
| Phase 8 | Sidebar Structure & Layout | Static layout/CSS |
| Phase 9 | Quick Contact Banner | Static contact info from env |
| Phase 10 | Price Range Filter Card | 13 static predefined ranges |
| Phase 11 | Area Filter Card | 10 static predefined ranges |
| Phase 13 | Featured Project Banner | Build-time featured projects |

**Why SSG:**
- No runtime dependencies
- Static data (price ranges, area ranges, layout)
- Fast loading (no server processing)
- Reduces server load significantly

---

## Implementation Strategy

### 1. Page Structure
```astro
---
// src/pages/[...slug].astro (SSR)
export const prerender = false; // Enable SSR

// SSR: Query Elasticsearch
const searchResult = await PropertySearchService.searchProperties(filters);

// SSG: Static location data
import { LocationService } from '@/services/location-service';
const locations = LocationService.getStaticLocations();
---

<Layout>
  <!-- SSR: Dynamic listing -->
  <ListingGrid properties={searchResult.hits} />

  <!-- SSG: Static sidebar -->
  <Sidebar>
    <QuickContactBanner /> <!-- Phase 9: SSG -->
    <PriceRangeFilter /> <!-- Phase 10: SSG -->
    <AreaRangeFilter /> <!-- Phase 11: SSG -->

    <!-- SSR: Context-aware filters -->
    <DynamicSidebarFilters filters={filters} /> <!-- Phase 12: SSR -->

    <FeaturedProjectBanner /> <!-- Phase 13: SSG -->
  </Sidebar>
</Layout>
```

### 2. Astro Config
```typescript
// astro.config.mjs
export default defineConfig({
  output: 'hybrid', // Enable hybrid rendering
  // SSG by default, opt-in to SSR per page
});
```

### 3. Component Rendering

**SSG Component Example:**
```astro
// src/components/sidebar/price-range-filter.astro
// No export const prerender needed (SSG is default in hybrid mode)

const PRICE_RANGES = [
  { label: 'Dưới 1 tỷ', min: 0, max: 1000000000 },
  { label: '1 - 2 tỷ', min: 1000000000, max: 2000000000 },
  // ... 13 ranges
];
---
<div class="price-filter">
  {PRICE_RANGES.map(range => (
    <a href={buildFilterUrl(range)}>{range.label}</a>
  ))}
</div>
```

**SSR Component Example:**
```astro
// src/components/listing/dynamic-sidebar-filters.astro
---
// This component is rendered within SSR page
// Has access to dynamic data from parent
const { filters, currentLocation } = Astro.props;

// Generate context-aware filters
const districts = await getDistrictsForProvince(currentLocation.provinceId);
---
<div class="dynamic-filters">
  {districts.map(district => (
    <a href={buildDistrictFilterUrl(district)}>{district.name}</a>
  ))}
</div>
```

---

## Performance Benefits

### SSR + Redis Cache
- **First request:** Query Elasticsearch (~200-500ms)
- **Cached requests:** Redis lookup (~20-50ms)
- **Cache TTL:** 5 minutes (balance freshness vs performance)

### SSG Benefits
- **Build time:** Generate once
- **Runtime:** Zero server processing
- **Loading:** Instant (served as static HTML/JS)
- **Cost:** No server resources used

### Combined Performance
```
Page Load Time Breakdown:
- SSG Sidebar: ~50ms (static HTML)
- SSR Listing (cached): ~50ms (Redis)
- SSR Listing (uncached): ~300ms (Elasticsearch)
- Total (cached): ~100ms ⚡
- Total (uncached): ~350ms ✅
```

---

## Cache Strategy

### Redis Cache Keys
```typescript
// Cache key format
const cacheKey = `listing:${transactionType}:${provinceId}:${hash(filters)}:page${page}`;

// Example
listing:1:1:a3f5e2:page1
listing:1:2:b4c6d3:page2
```

### Cache Invalidation
- **TTL:** 5 minutes (auto-expire)
- **Manual:** When property data changes (webhook/cron)
- **Strategy:** Cache-aside pattern

---

## Deployment Considerations

### Build Time
- **SSG components:** Generated at build time
- **Build triggers:** Code changes, data schema changes
- **Build time:** ~2-5 minutes (for all static assets)

### Runtime
- **SSR pages:** Rendered on each request (with Redis cache)
- **Server requirements:** Node.js server (Vercel, Netlify, self-hosted)
- **Scaling:** Horizontal scaling for SSR, CDN for SSG assets

---

## Migration Path

### Phase 1-7: Core Functionality
1. Setup Elasticsearch service (SSR)
2. Build location service (SSG build-time)
3. Create dynamic route (SSR)
4. Implement filters (SSG UI)
5. Add breadcrumb (SSG)
6. Build listing grid (SSR data)
7. Add interactive features (client-side)

### Phase 8-13: Sidebar
8. Create sidebar layout (SSG structure)
9. Add contact banner (SSG)
10. Add price filter (SSG)
11. Add area filter (SSG)
12. Add dynamic filters (SSR - context-aware)
13. Add featured projects (SSG)

---

## Testing Strategy

### SSR Testing
- Test with different filter combinations
- Verify Redis cache hit/miss
- Test Elasticsearch fallback to PostgreSQL
- Load testing (500-1000 concurrent users)

### SSG Testing
- Verify build-time generation
- Check static asset deployment
- Test client-side interactions
- Verify no runtime API calls

### Integration Testing
- SSR + SSG components work together
- No layout shifts during page load
- Progressive enhancement works
- Fallback behavior correct

---

## References

- [Astro SSR Documentation](https://docs.astro.build/en/guides/server-side-rendering/)
- [Astro Hybrid Rendering](https://docs.astro.build/en/guides/server-side-rendering/#hybrid-rendering)
- [Redis Caching Best Practices](https://redis.io/docs/manual/client-side-caching/)
- [Elasticsearch Performance Tuning](https://www.elastic.co/guide/en/elasticsearch/reference/current/tune-for-search-speed.html)
