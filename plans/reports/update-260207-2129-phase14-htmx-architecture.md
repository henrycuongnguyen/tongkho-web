# Phase 14 Update: HTMX Architecture (No API)

**Date:** 2026-02-07 21:29
**Context:** Listing Page Implementation Plan
**Decision:** Use HTMX for server-side autocomplete (no REST API)

## Summary

Updated Phase 14 to:
1. **Reuse Phase 1 infrastructure** (elasticsearch-client.ts)
2. **Use HTMX instead of REST API** (HTML over HTTP)
3. **Same pattern as Phase 1** (service layer approach)

## Architecture Change

### Before (Original)
```
Client (React) → /api/location/search → LocationSearchService → ES → JSON
```

**Issues:**
- REST API endpoint needed
- JSON serialization overhead
- Client-side JS complexity

### After (Updated) ✅
```
Client (HTMX) → /search/locations.astro → LocationSearchService → ES → HTML
```

**Benefits:**
- No REST API endpoint
- Pure server-side rendering
- HTML over HTTP (hypermedia)
- Reuses Phase 1 infrastructure

## Implementation Summary

### 1. Service Layer (Reuse Phase 1)
```typescript
// src/services/elasticsearch/location-search-service.ts
import { getElasticSearchClient } from './elasticsearch-client'; // REUSE

export class LocationSearchService {
  static async searchLocations(options: LocationSearchOptions) {
    const client = getElasticSearchClient(); // Phase 1 client

    const response = await client.search({
      index: 'locations,project',
      body: esQuery
    });

    return results;
  }
}
```

### 2. SSR Page (No API)
```astro
<!-- src/pages/search/locations.astro -->
---
const results = await LocationSearchService.searchLocations({ query });
---
<!-- Return HTML partial -->
{results.map(r => <div>{r.name}</div>)}
```

### 3. HTMX Component
```html
<input
  hx-get="/search/locations"
  hx-trigger="keyup changed delay:300ms"
  hx-target="#results"
/>
```

## Comparison with Phase 1

| | Phase 1 (Properties) | Phase 14 (Locations) |
|---|---|---|
| **Service** | `property-search-service.ts` | `location-search-service.ts` |
| **Index** | `real_estate` | `locations,project` |
| **Client** | `elasticsearch-client.ts` | ✅ **REUSE** same client |
| **Query** | Property filters | Location text search |
| **UI** | SSR page | **HTMX autocomplete** |
| **API?** | No (direct SSR) | **No (HTMX → SSR)** |

## Key Benefits

### 1. Reuse Infrastructure ✅
- Same `elasticsearch-client.ts`
- Same connection pooling
- Same error handling
- Same caching strategy

### 2. No REST API ✅
- No `/api/location/search` endpoint
- No JSON serialization
- Direct server-side rendering
- HTML over HTTP

### 3. Better UX ✅
- Autocomplete with debounce (300ms)
- No page reload
- Loading indicators
- Keyboard navigation

### 4. Simpler Stack ✅
- No React for autocomplete
- Just HTMX (14KB gzipped)
- Less client-side JS
- Easier to maintain

## Technical Details

### ElasticSearch Query (Same as v1)
```javascript
{
  "query": {
    "bool": {
      "must": [{
        "multi_match": {
          "query": "hà nội",
          "fields": [
            "n_name^3",           // Boost 3x
            "n_normalizedname^2", // Boost 2x
            "n_name_search",
            "n_fullname"
          ],
          "fuzziness": "AUTO"
        }
      }]
    }
  }
}
```

### HTMX Flow
```
1. User types "hà n"
2. HTMX waits 300ms (debounce)
3. HTMX GET /search/locations?q=hà+n
4. Astro SSR calls LocationSearchService
5. Service queries ElasticSearch
6. Astro returns HTML partial
7. HTMX swaps into #results div
8. No page reload!
```

## Performance

| Metric | Target | Strategy |
|--------|--------|----------|
| ES Query | <100ms | Same as v1 |
| Network | <200ms | HTMX request |
| Render | <50ms | SSR HTML |
| **Total** | **~350ms** | User experience |

## File Structure

```
src/
├── services/
│   └── elasticsearch/
│       ├── elasticsearch-client.ts       # Phase 1 (reused)
│       ├── property-search-service.ts    # Phase 1
│       ├── location-search-service.ts    # Phase 14 (NEW)
│       └── types.ts                      # Both phases
├── pages/
│   └── search/
│       └── locations.astro               # Phase 14 (SSR endpoint)
└── components/
    └── listing/
        └── location-autocomplete.astro   # Phase 14 (HTMX)
```

## Compatibility with v1

| Feature | v1 | v2 (Phase 14) |
|---------|----|----- |
| ES Index | `locations,project` | ✅ Same |
| Query | multi_match + fuzzy | ✅ Same |
| Fields | n_name, n_fullname, etc. | ✅ Same |
| Logic | Python ElasticSearch | ✅ TypeScript equivalent |
| UI | jQuery AJAX | **HTMX (modern)** |

## Dependencies

**Phase 14 depends on:**
- ✅ Phase 1: ElasticSearch client
- ✅ Phase 2: Location data (for context)

**Phase 14 enables:**
- Phase 4: Filter UI (uses autocomplete)

## Security

- Input sanitization (prevent injection)
- Rate limiting (10 req/sec)
- Validate cityId parameter
- Limit results to 10
- No sensitive data exposed

## Testing Checklist

- [ ] Vietnamese text search works
- [ ] Fuzzy matching (typo tolerance)
- [ ] Debounce works (300ms)
- [ ] Loading indicator shows
- [ ] Results update without page reload
- [ ] Keyboard navigation (↑↓ Enter Esc)
- [ ] Mobile responsive
- [ ] Performance <350ms total

## Next Steps

1. Implement Phase 14 after Phase 1 completes
2. Integrate into Phase 4 (Filter UI)
3. Test with real Vietnamese location data
4. Optional: Add Redis caching

## HTMX Resources

- [HTMX Documentation](https://htmx.org/)
- [HTMX Examples](https://htmx.org/examples/)
- [Why HTMX](https://htmx.org/essays/why-htmx/)
- Size: 14KB gzipped (vs React 42KB+)

## Conclusion

✅ **Phase 14 now:**
- Reuses Phase 1 infrastructure
- No REST API needed
- Uses HTMX for autocomplete
- Same v1 logic (ElasticSearch)
- Simpler, faster, more maintainable
