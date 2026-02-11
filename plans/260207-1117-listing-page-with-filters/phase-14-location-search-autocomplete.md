# Phase 14: Location Search & Autocomplete (SSR with HTMX)

## Context Links
- **Plan:** [plan.md](./plan.md)
- **V1 Reference:** `tongkho_v1/controllers/api_customer.py` (lines 3249-3450)
- **Dependencies:** Phase 1 (ElasticSearch Infrastructure), Phase 2 (Location Data)
- **Reuses:** Phase 1's `elasticsearch-client.ts`, `query-builder.ts`

## Overview
**Priority:** High
**Status:** Pending
**Rendering:** SSR (Server-side HTML with HTMX)
**Dependencies:** Phase 1 (ES Client), Phase 2 (Location Data)

Implement location search/autocomplete using **same pattern as Phase 1** but for locations instead of properties. Use HTMX for server-side autocomplete (no REST API, pure HTML over HTTP).

## Key Architecture Decision

### Same Pattern as Phase 1 ✅

| | Phase 1 | Phase 14 |
|---|---|---|
| Service | `property-search-service.ts` | `location-search-service.ts` |
| Index | `real_estate` | `locations,project` |
| Client | Reuse `elasticsearch-client.ts` | ✅ Reuse same client |
| Query | Property filters | Location text search |
| UI | SSR page | HTMX autocomplete |

### No API Endpoint - Use HTMX

```
User types → HTMX → Astro SSR page → LocationSearchService → ES → HTML
```

**Benefits:**
- No JSON API (HTML over HTTP)
- Pure server-side (no client-side JS)
- Reuse Phase 1 infrastructure
- Same v1 logic (ES query)

## V1 Analysis

### ElasticSearch Query (v1)
```python
# v1: tongkho_v1/controllers/api_customer.py
es_url = 'https://elastic.tongkhobds.com/locations,project/_search'
es_query = {
    "query": {
        "bool": {
            "must": [{
                "multi_match": {
                    "query": "hà nội",
                    "fields": [
                        "n_name^3",           # Boost 3x
                        "n_normalizedname^2", # Boost 2x
                        "n_name_search",
                        "n_fullname"
                    ],
                    "type": "best_fields",
                    "fuzziness": "AUTO"
                }
            }]
        }
    }
}
```

## Implementation Steps

### 1. Create Location Search Service (1-2 hours)

**File:** `src/services/elasticsearch/location-search-service.ts`

```typescript
import { getElasticSearchClient } from './elasticsearch-client'; // REUSE Phase 1
import type { LocationSearchResult } from './types';

export interface LocationSearchOptions {
  query: string;
  cityId?: number;
  limit?: number;
}

export class LocationSearchService {

  /**
   * Search locations and projects via ElasticSearch
   * Same pattern as PropertySearchService (Phase 1)
   */
  static async searchLocations(
    options: LocationSearchOptions
  ): Promise<LocationSearchResult[]> {
    const { query, cityId, limit = 10 } = options;

    if (!query || query.length < 2) {
      return [];
    }

    try {
      const client = getElasticSearchClient(); // REUSE Phase 1

      // Build ES query (similar to v1)
      const esQuery = this.buildLocationQuery(query, cityId);

      // Execute search
      const response = await client.search({
        index: 'locations,project', // Multiple indexes
        body: {
          query: esQuery,
          size: limit,
          _source: [
            'n_id', 'n_name', 'n_level', 'n_fullname',
            'n_slug', 'n_normalizedname', 'city_id',
            'district_id', 'ward_id', 'boundaries',
            'project_name', 'project_address'
          ],
          timeout: '3s'
        }
      });

      // Parse results
      const hits = response.hits.hits;
      return hits.map(hit => this.parseLocationHit(hit));

    } catch (error) {
      console.error('[LocationSearchService] Search failed:', error);
      return [];
    }
  }

  /**
   * Build ElasticSearch query (same as v1)
   */
  private static buildLocationQuery(query: string, cityId?: number) {
    const must: any[] = [
      {
        multi_match: {
          query: query,
          fields: [
            'n_name^3',           // Location name (boost 3x)
            'n_normalizedname^2', // Normalized name (boost 2x)
            'n_name_search',      // Search field
            'n_fullname',         // Full hierarchical name
            'project_name^3',     // Project name (boost 3x)
            'project_address'     // Project address
          ],
          type: 'best_fields',
          fuzziness: 'AUTO',      // Typo tolerance
          operator: 'and'
        }
      }
    ];

    const filter: any[] = [
      // Only active locations
      { term: { n_status: { $ne: '6' } } }
    ];

    // Filter by city if provided
    if (cityId) {
      filter.push({
        term: { n_parentcity: cityId.toString() }
      });
    }

    return {
      bool: {
        must,
        filter
      }
    };
  }

  /**
   * Parse ES hit to result
   */
  private static parseLocationHit(hit: any): LocationSearchResult {
    const source = hit._source;

    // Determine if location or project
    const isProject = !!source.project_name;

    return {
      id: source.n_id,
      type: isProject ? 'project' : 'location',
      name: isProject ? source.project_name : source.n_name,
      fullName: isProject
        ? this.buildProjectFullName(source)
        : (source.n_fullname || source.n_name),
      slug: source.n_slug,
      level: parseInt(source.n_level || '0'),
      cityId: source.city_id || source.n_parentcity,
      districtId: source.district_id || source.n_parentdistrict,
      wardId: source.ward_id,
      boundaries: source.boundaries
    };
  }

  /**
   * Build full project name (Project Name, District, City)
   */
  private static buildProjectFullName(source: any): string {
    const parts: string[] = [];
    if (source.project_name) parts.push(source.project_name);
    if (source.project_address) parts.push(source.project_address);
    return parts.join(', ');
  }
}
```

### 2. Update Types (15 mins)

**File:** `src/services/elasticsearch/types.ts` (add to existing)

```typescript
// Location search result
export interface LocationSearchResult {
  id: string;
  type: 'location' | 'project';
  name: string;           // "Hà Nội" or "Vinhomes Central Park"
  fullName: string;       // "Phường Tân Kiểng, Quận 7, TP. HCM"
  slug: string;
  level: number;          // 0=Province, 1=District, 2=Ward
  cityId?: string;
  districtId?: string;
  wardId?: string;
  boundaries?: any;       // GeoJSON
}
```

### 3. Create SSR Autocomplete Page (1 hour)

**File:** `src/pages/search/locations.astro`

```astro
---
import { LocationSearchService } from '@/services/elasticsearch/location-search-service';

// Get query params
const query = Astro.url.searchParams.get('q') || '';
const cityId = Astro.url.searchParams.get('city_id');

// Search via ElasticSearch (server-side)
const results = await LocationSearchService.searchLocations({
  query: query.trim(),
  cityId: cityId ? parseInt(cityId) : undefined,
  limit: 10
});
---

<!-- Return HTML partial for HTMX -->
{results.length > 0 ? (
  <div class="search-results">
    {results.map(result => (
      <button
        type="button"
        class="result-item"
        data-id={result.id}
        data-name={result.name}
        data-type={result.type}
      >
        <span class="result-icon">
          {result.type === 'location' ? '📍' : '🏢'}
        </span>
        <div class="result-content">
          <div class="result-name">{result.name}</div>
          <div class="result-full-name">{result.fullName}</div>
        </div>
      </button>
    ))}
  </div>
) : (
  <div class="no-results">
    <p>Không tìm thấy kết quả</p>
  </div>
)}

<style>
  .search-results {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .result-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    width: 100%;
    text-align: left;
    background: white;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .result-item:hover {
    background: #f3f4f6;
  }

  .result-icon {
    font-size: 1.25rem;
  }

  .result-content {
    flex: 1;
  }

  .result-name {
    font-weight: 500;
    color: #111827;
  }

  .result-full-name {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .no-results {
    padding: 1rem;
    text-align: center;
    color: #6b7280;
  }
</style>
```

### 4. Create HTMX Autocomplete Component (1 hour)

**File:** `src/components/listing/location-autocomplete.astro`

```astro
---
interface Props {
  placeholder?: string;
  name?: string;
  cityId?: number;
}

const { placeholder = 'Tìm kiếm địa điểm...', name = 'location', cityId } = Astro.props;
---

<!-- Include HTMX -->
<script src="https://unpkg.com/htmx.org@1.9.10"></script>

<div class="location-autocomplete">
  <div class="search-input-wrapper">
    <input
      type="text"
      name={name}
      placeholder={placeholder}
      class="search-input"
      hx-get="/search/locations"
      hx-trigger="keyup changed delay:300ms"
      hx-target="#location-results"
      hx-indicator="#search-loading"
      hx-include="[name='city_id']"
      autocomplete="off"
    />
    {cityId && (
      <input type="hidden" name="city_id" value={cityId} />
    )}
    <div id="search-loading" class="htmx-indicator">
      <span class="loading-spinner">⌛</span>
    </div>
  </div>

  <div id="location-results" class="results-dropdown"></div>
</div>

<style>
  .location-autocomplete {
    position: relative;
    width: 100%;
  }

  .search-input-wrapper {
    position: relative;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 2.5rem 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 1rem;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .htmx-indicator {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0;
    transition: opacity 0.2s;
  }

  .htmx-indicator.htmx-request {
    opacity: 1;
  }

  .loading-spinner {
    font-size: 1.25rem;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .results-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 0.25rem;
    max-height: 20rem;
    overflow-y: auto;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 50;
  }

  .results-dropdown:empty {
    display: none;
  }
</style>

<script>
  // Handle result selection
  document.addEventListener('htmx:afterSwap', function(event) {
    const target = event.detail.target;
    if (target.id === 'location-results') {
      // Add click handlers to result items
      const items = target.querySelectorAll('.result-item');
      items.forEach(item => {
        item.addEventListener('click', function() {
          const name = this.dataset.name;
          const id = this.dataset.id;

          // Update input value
          const input = document.querySelector('.location-autocomplete input[type="text"]');
          if (input) {
            input.value = name;
          }

          // Clear results
          target.innerHTML = '';

          // Dispatch custom event
          document.dispatchEvent(new CustomEvent('location-selected', {
            detail: {
              id: id,
              name: name,
              type: this.dataset.type
            }
          }));
        });
      });
    }
  });

  // Clear results when clicking outside
  document.addEventListener('click', function(event) {
    const autocomplete = document.querySelector('.location-autocomplete');
    if (autocomplete && !autocomplete.contains(event.target)) {
      const results = document.getElementById('location-results');
      if (results) {
        results.innerHTML = '';
      }
    }
  });
</script>
```

### 5. Usage Example (15 mins)

**In Filter Component:**

```astro
---
// src/components/listing/listing-filter.astro
import LocationAutocomplete from './location-autocomplete.astro';
---

<form class="listing-filters">
  <div class="filter-group">
    <label>Địa điểm</label>
    <LocationAutocomplete placeholder="Tìm tỉnh, quận, phường..." />
  </div>

  <!-- Other filters... -->
</form>

<script>
  // Listen for location selection
  document.addEventListener('location-selected', (event) => {
    console.log('Selected:', event.detail);
    // Update filter state, URL, etc.
  });
</script>
```

## Related Code Files

**V1 Reference:**
- `tongkho_v1/controllers/api_customer.py` (lines 3249-3450)

**Reuses from Phase 1:**
- `src/services/elasticsearch/elasticsearch-client.ts` ✅
- `src/services/elasticsearch/types.ts` (extend)

**To Create:**
- `src/services/elasticsearch/location-search-service.ts`
- `src/pages/search/locations.astro` (SSR endpoint)
- `src/components/listing/location-autocomplete.astro` (HTMX component)

## Todo List

- [ ] Create `location-search-service.ts` (reuse Phase 1 client)
- [ ] Update `types.ts` with LocationSearchResult
- [ ] Create SSR page `/search/locations.astro`
- [ ] Create HTMX autocomplete component
- [ ] Test with Vietnamese queries
- [ ] Add debounce (300ms) via HTMX
- [ ] Test fuzzy matching (typo tolerance)
- [ ] Add loading indicator
- [ ] Handle keyboard navigation (↑↓, Enter, Esc)
- [ ] Test on mobile
- [ ] Performance test (<100ms query time)
- [ ] Add Redis caching for popular queries

## Success Criteria

- [ ] Autocomplete shows results within 300ms
- [ ] ElasticSearch query time <100ms
- [ ] Fuzzy matching works (typos tolerance)
- [ ] Shows provinces, districts, wards, projects
- [ ] Vietnamese text search works correctly
- [ ] HTMX updates DOM without page reload
- [ ] Mobile responsive
- [ ] Keyboard navigation works
- [ ] No REST API endpoint needed
- [ ] Reuses Phase 1 infrastructure

## Architecture Comparison

### Before (Original Plan)
```
Client → /api/location/search → LocationSearchService → ES → JSON → Client
```

### After (Updated with HTMX) ✅
```
Client (HTMX) → /search/locations.astro → LocationSearchService → ES → HTML → DOM
```

**Benefits:**
- No JSON API endpoint
- No client-side JS (except HTMX)
- Pure server-side rendering
- HTML over HTTP (hypermedia)
- Reuses Phase 1 infrastructure

## Performance

### ElasticSearch Query
- **Target:** <100ms
- **Strategy:** Same as v1 (proven)
- **Optimization:** Redis cache for popular queries (Phase 1 pattern)

### HTMX Network
- **Debounce:** 300ms
- **Request size:** ~200 bytes (URL params)
- **Response size:** ~2-5 KB HTML (10 results)
- **Total:** ~300-400ms user experience

## Risk Assessment

**Low Risk:**
- Reuses Phase 1 infrastructure (proven)
- HTMX is mature library
- Same ES query as v1

**Mitigation:**
- Test HTMX on mobile browsers
- Add timeout handling
- Fallback to static dropdown if HTMX fails

## Security Considerations

- Sanitize query input (prevent injection)
- Rate limiting on page (max 10 requests/sec)
- Validate cityId parameter
- Limit results to 10 per query
- No sensitive data in results

## Next Steps

After Phase 14 completion:
→ Integrate autocomplete into **Phase 4:** Filter Section UI
→ Add to mobile search interface
→ Optional: Add Redis caching for popular queries

## HTMX Resources

- [HTMX Documentation](https://htmx.org/docs/)
- [HTMX Attributes](https://htmx.org/attributes/)
- [hx-trigger](https://htmx.org/attributes/hx-trigger/) - debounce config
- [hx-target](https://htmx.org/attributes/hx-target/) - result container
