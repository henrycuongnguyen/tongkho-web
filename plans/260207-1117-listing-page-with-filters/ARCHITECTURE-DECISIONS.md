# Architecture Decisions - Listing Page

## Decision Log

### 1. Rendering Strategy ✅
**Decision:** Hybrid SSG/SSR Architecture
**Date:** 2026-02-07 (Updated)
**Rationale:**

**SSR Components (Server-Side Rendering):**
- Listing page with Elasticsearch queries (dynamic filters)
- Search results (real-time data, price/status changes)
- Pagination (depends on filter results)
- Dynamic sidebar filters (Phase 12 - context-aware)
- Location search/autocomplete API (Phase 14 - ElasticSearch)
- Redis cache provides <50ms response time
- Can handle infinite filter combinations

**SSG Components (Static Site Generation):**
- Sidebar structure and layout (Phase 8)
- Quick contact banner (Phase 9 - from env)
- Price range filter card (Phase 10 - 13 predefined ranges)
- Area filter card (Phase 11 - 10 predefined ranges)
- Featured project banner (Phase 13 - build time data)

**Benefits:**
- SSR: Real-time listing data, dynamic filters
- SSG: Fast sidebar loading, no runtime overhead
- Best of both worlds: dynamic content + static UI
- Reduced server load for static components

**Alternative Considered:** Full SSR for everything
**Rejected Because:** Sidebar components are mostly static, no need for SSR overhead

---

### 2. Cache Strategy ✅
**Decision:** 3-tier fallback (Redis → ElasticSearch → PostgreSQL)
**Date:** 2026-02-07
**Rationale:**
- Redis: Fast cache layer (5 min TTL)
- ElasticSearch: Primary search engine
- PostgreSQL: Fallback for basic queries if ES down
- Resilient system with graceful degradation

**Fallback Flow:**
```
1. Check Redis cache (fastest)
   ↓ Miss
2. Query ElasticSearch (primary)
   ↓ Fail/Timeout
3. Query PostgreSQL (limited features)
   ↓ Fail
4. Return empty result with error message
```

---

### 3. ElasticSearch Index ✅
**Decision:** Use same indexes as v1 (`real_estate`, `locations`, `project`)
**Date:** 2026-02-07
**Rationale:**
- Same database as v1
- Same field mapping
- No data migration needed
- Proven query patterns
- **Multiple indexes:**
  - `real_estate` → Property listings (Phase 1)
  - `locations` → Provinces, districts, wards (Phase 14)
  - `project` → Real estate projects (Phase 14)

---

### 4. Location Hierarchy ✅
**Decision:** 2 levels (Province + District) with grant support
**Date:** 2026-02-07
**Rationale:**
- Simpler UI for MVP
- Faster data loading
- Can extend to 3 levels (+ Ward) later
- **Grant parameter for address version:**
  - `grant='2'` → New addresses (modern, default for v2)
  - `grant!='2'` → Old addresses (legacy, via mergedintoid)

**Database Fields:**
```sql
mergedintoid  -- Map old address to new address ID
n_status      -- Status (!= "6" is active)
n_level       -- 0=Province, 1=District, 2=Ward
```

**Migration Path:** Old addresses have `mergedintoid` pointing to new address

**Alternative Considered:** 3 levels (Province + District + Ward)
**Deferred Because:** More complex UI, larger dataset (~10k wards), can add later

---

### 5. URL Pattern ✅
**Decision:** Same as v1 pattern
**Date:** 2026-02-07
**Pattern:** `/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty?property_types=12,13&...`

**Structure:**
```
/{transaction_or_property_type}/{location}/{price}?queryParams

Segments:
- Arg1: mua-ban | cho-thue | du-an | {property_type_slug}
- Arg2: {province_slug} | {district_slug} | toan-quoc
- Arg3: gia-tu-X-den-Y | gia-duoi-X | gia-tren-X | gia-thuong-luong

Query Params:
- property_types=12,13  (multiple IDs)
- gtn=2-ty              (min price)
- gcn=5-ty              (max price)
- dtnn=50               (min area)
- dtcn=100              (max area)
- bedrooms=2
- bathrooms=2
- radius=50             (km)
- sort=price_asc
- page=2
```

**Rationale:**
- SEO-friendly URLs
- Human-readable
- Compatible with v1 links
- Clear filter representation

---

### 6. Grant Default for V2 ✅
**Decision:** Default to `grant='2'` (new addresses)
**Date:** 2026-02-07
**Rationale:**
- V2 is modern system → use modern addresses
- Better data quality
- Cleaner structure
- Can fallback to old addresses if needed via URL param

**Usage:**
```typescript
// Default: New addresses
const provinces = await LocationService.getAllProvinces('2');

// Optional: Old addresses (if needed for compatibility)
const oldProvinces = await LocationService.getAllProvinces('1');
```

---

## Implementation Phases Priority

### Critical Path (Must Complete First)
1. Phase 1: ElasticSearch Service
2. Phase 3: Dynamic Route & URL Parsing
3. Phase 6: Listing Section & Pagination

### Parallel Development
- Phase 2: Location Data Service (can start early)
- Phase 4: Filter Section UI (depends on Phase 2)
- Phase 5: Breadcrumb (low priority)

### Enhancement Phase
- Phase 7: Interactive Features (favorites, compare, share)

---

## Technical Stack Decisions

### Why Astro SSR?
- Static site generator with server-side rendering
- Minimal JavaScript shipped to client
- Fast page loads
- SEO-friendly
- TypeScript support

### Why Redis?
- In-memory caching for sub-50ms response
- TTL support (5 min is good balance)
- Reduces ES load
- Simple key-value for query results

### Why ElasticSearch?
- Full-text search (Vietnamese)
- Complex filtering (price, area, location, radius)
- Fast aggregations
- Geo-distance queries for radius search
- Proven at scale

### Why PostgreSQL Fallback?
- Same data source as ES
- Can handle basic queries (transaction type, location, price)
- Resilience when ES down
- No new infrastructure

---

## Open Questions & Future Decisions

### 1. Pre-generation Strategy
**Question:** Should we pre-generate any pages?
**Options:**
- A: None (pure SSR)
- B: Top 10 cities × 3 transaction types = 30 pages
- C: Sitemap-based pre-generation

**Current:** Pure SSR (decided), can revisit after performance testing

---

### 2. Ward Level Support
**Question:** When to add 3rd level (wards)?
**Trigger:** User demand or better filtering needs
**Effort:** ~4-6 hours to extend Phase 2
**UI Impact:** Nested dropdown (more complex)

---

### 3. Search Performance
**Question:** If Redis + ES still slow, what next?
**Options:**
- Increase Redis TTL to 15 min
- Add ES result caching layer
- Optimize ES index mapping
- Add database materialized views

**Monitor:** Query times, cache hit rates

---

## Change Log

| Date | Decision | Changed By | Reason |
|------|----------|------------|--------|
| 2026-02-07 | Initial decisions | Planner | Project kickoff |
| 2026-02-07 | Grant parameter added | Planner | V1 analysis revealed address versioning |

---

## References

- v1 codebase: `tongkho_v1/modules/real_estate_handle.py`
- v1 URL builder: `resaland_v1/static/js/module/search-url-builder.js`
- v1 API logic: `tongkho_v1/controllers/api_agent.py` (line 2770-2820)
