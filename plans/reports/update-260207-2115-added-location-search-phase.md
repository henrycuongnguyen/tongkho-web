# Plan Update: Added Phase 14 - Location Search & Autocomplete

**Date:** 2026-02-07 21:15
**Reporter:** Main Assistant
**Context:** Listing Page Implementation Plan

## Summary

User identified missing feature: **location search/autocomplete API** (`/api_customer/location_searching.json` in v1). Created Phase 14 to implement this.

## What Was Added

### New Phase: Phase 14
**File:** `phase-14-location-search-autocomplete.md`
**Priority:** High
**Rendering:** SSR (ElasticSearch API)

**Key Features:**
- Search locations (provinces, districts, wards) by name
- Search real estate projects by name
- ElasticSearch query with fuzzy matching
- Autocomplete component with 300ms debounce
- Vietnamese text normalization
- API endpoint: `/api/location/search`

## V1 Reference Analysis

### API Endpoint (V1)
```
GET /api_customer/location_searching.json

Params:
- text: Search query (e.g., "phường tân kiểng quận 7")
- city_id: Province ID filter (optional)
- page: Page number (default: 1)
- limit: Items per page (default: 20)

ElasticSearch Indexes:
- locations: Provinces, districts, wards
- project: Real estate projects
```

### Query Structure
```javascript
{
  "query": {
    "bool": {
      "must": [{
        "multi_match": {
          "query": "search text",
          "fields": [
            "n_name^3",           // Location name (boost 3x)
            "n_normalizedname^2", // Normalized name (boost 2x)
            "n_name_search",      // Search field
            "n_fullname"          // Full hierarchical name
          ],
          "type": "best_fields",
          "fuzziness": "AUTO"
        }
      }]
    }
  }
}
```

## Implementation Components

### 1. Location Search Service
**File:** `src/services/location/location-search-service.ts`
- ElasticSearch query builder
- PostgreSQL fallback
- Vietnamese text handling
- Result parsing

### 2. API Route
**File:** `src/pages/api/location/search.ts`
- Astro API endpoint
- Query validation
- Response formatting

### 3. Autocomplete Component
**File:** `src/components/listing/location-autocomplete.tsx`
- React component with debounce
- Dropdown with results
- Keyboard navigation
- Loading states

## Updated Files

### 1. plan.md
- Added Phase 14 description
- Updated dependency graph (P2 → P14 → P4)
- Updated file structure
- Added success criteria for location search

### 2. ARCHITECTURE-DECISIONS.md
- Added Phase 14 to SSR components list
- Updated ElasticSearch index documentation (added `locations`, `project`)

### 3. RENDERING-STRATEGY.md
- Already includes Phase 14 in SSR category (auto-documented)

## Dependency Changes

### Before
```
P2 (Location Data) → P4 (Filter UI)
```

### After
```
P2 (Location Data) → P14 (Location Search API) → P4 (Filter UI)
                                                     ↓
                                              (uses autocomplete)
```

**Rationale:** Phase 4 (Filter UI) needs autocomplete component from Phase 14.

## Technical Details

### Performance Targets
- ElasticSearch query: <100ms
- API response time: <150ms
- Autocomplete debounce: 300ms
- Min query length: 2 characters

### ElasticSearch Optimization
- Use `_source` filtering (only needed fields)
- Add timeout: 5s
- Fuzzy matching: AUTO (1-2 char tolerance)
- Result limit: 100 per page max

### Caching Strategy
```typescript
// Redis cache for popular queries
const cacheKey = `location_search:${query}:${cityId}:${page}`;
// TTL: 1 hour (location data stable)
```

## Integration Points

### Phase 4: Filter Section UI
```typescript
// Use autocomplete in location filter
import { LocationAutocomplete } from '@/components/listing/location-autocomplete';

<LocationAutocomplete
  placeholder="Tìm kiếm địa điểm..."
  cityId={selectedCityId}
  onSelect={(result) => {
    // Add to selected locations
    addLocationFilter(result);
  }}
/>
```

### Phase 2: Location Data Service
- Phase 14 uses Phase 2's location types
- Shares database queries
- Complementary features:
  - Phase 2: Static province/district lists (SSG)
  - Phase 14: Dynamic location search (SSR)

## Security Considerations

- Input sanitization (prevent ES injection)
- Rate limiting: 100 requests/min per IP
- Query length validation (2-100 chars)
- Result limit enforcement (max 100/page)

## Testing Checklist

- [ ] Vietnamese text search works correctly
- [ ] Fuzzy matching handles typos (1-2 chars)
- [ ] Autocomplete dropdown appears <300ms
- [ ] ElasticSearch query <100ms
- [ ] PostgreSQL fallback works
- [ ] Special characters handled properly
- [ ] Province filter works
- [ ] Pagination works
- [ ] Mobile responsive
- [ ] Keyboard navigation (↑↓, Enter, Esc)

## Next Steps

1. Implement Phase 14 after Phase 2 completes
2. Integrate autocomplete into Phase 4 (Filter UI)
3. Test with real Vietnamese location data
4. Add Redis caching layer for popular queries
5. Monitor query performance and optimize if needed

## Open Questions

1. Should we cache autocomplete results client-side (localStorage)?
   - **Suggestion:** Yes, for recent searches (last 10)

2. How to handle >100 results?
   - **Current:** Show first 100, add "Xem thêm" button
   - **Alternative:** Improve search specificity prompts

3. Should projects be ranked higher than locations?
   - **Current:** Equal ranking, sorted by relevance
   - **Alternative:** Boost projects by 1.5x

## References

- V1 API: `tongkho_v1/controllers/api_customer.py` (lines 3249-3450)
- ElasticSearch docs: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html
- Fuzzy matching: https://www.elastic.co/guide/en/elasticsearch/reference/current/common-options.html#fuzziness
