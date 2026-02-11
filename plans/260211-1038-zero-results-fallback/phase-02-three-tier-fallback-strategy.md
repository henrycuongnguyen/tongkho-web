# Phase 2: Three-Tier Fallback Strategy (v1 Logic)

**Priority:** High | **Status:** 📋 Planned | **Complexity:** High

## Context Links

- [Plan Overview](./plan.md)
- [Phase 1: Filter Relaxation Service](./phase-01-filter-relaxation-service.md)
- [v1 Analysis](./research/researcher-260211-1038-v1-zero-results-fallback.md)

## Overview

Implement full v1-style 3-tier location expansion fallback. When Level 1 relaxation (Phase 1) still yields zero results, progressively expand location scope: district → city → nationwide.

## Key Insights

**v1 Three-Tier Strategy:**
1. **Level 1**: Keep location (district/city), remove filters → DONE in Phase 1 ✅
2. **Level 2**: Expand to city level, remove filters → THIS PHASE
3. **Level 3**: Go nationwide, remove all location filters → THIS PHASE

**Example Flow:**
```
Original: Mua ban + Ba Dinh + 1-2 ty + 3 PN → 0 results
  ↓ Level 1: Mua ban + Ba Dinh (no filters) → 0 results
  ↓ Level 2: Mua ban + Ha Noi (city) → 15 results ✅
```

## Requirements

### Functional Requirements

1. **Implement Level 2 relaxation** (expand district → city)
2. **Implement Level 3 relaxation** (expand city → nationwide)
3. **Location resolution logic** (district → parent city lookup)
4. **Cascading fallback** (try L1 → L2 → L3 until results found)
5. **Smart messaging** (tell users where results are from)

### Non-Functional Requirements

- Maximum 3 ES queries per request (L1 + L2 + L3)
- Total fallback time < 300ms
- Cache location hierarchy lookups
- Type-safe location expansion

## Architecture

### Cascading Fallback Flow

```
1. Execute original search
   → 0 results? → Continue
   → Has results? → Return

2. Try Level 1 (Phase 2 implementation)
   → Can relax filters? → Execute
   → Has results? → Return as Level 1 fallback
   → Still 0 results? → Continue

3. Try Level 2 (NEW: Expand to city)
   → Is district search? → Expand to parent city
   → Execute search with city ID
   → Has results? → Return as Level 2 fallback
   → Still 0 results? → Continue

4. Try Level 3 (NEW: Go nationwide)
   → Remove all location filters
   → Execute search with transaction only
   → Return results as Level 3 fallback
```

### Service Enhancement

```typescript
// Extend filter-relaxation-service.ts

class FilterRelaxationService {
  relaxLevel2(
    filters: PropertySearchFilters,
    locationContext: LocationContext
  ): RelaxationLevel;

  relaxLevel3(
    filters: PropertySearchFilters
  ): RelaxationLevel;

  // NEW: Helper to expand location scope
  async expandLocationScope(
    location: SelectedLocation
  ): Promise<SelectedLocation | null>;
}
```

## Related Code Files

### Files to Modify

1. **`src/services/search-relaxation/filter-relaxation-service.ts`**
   - Implement Level 2: `relaxLevel2()`
   - Implement Level 3: `relaxLevel3()`
   - Add location expansion logic

2. **`src/services/search-relaxation/types.ts`**
   - Add `LocationContext` interface
   - Add Level 2/3 to RelaxationLevel

3. **`src/pages/[...slug].astro`**
   - Implement cascading fallback logic
   - Try L1 → L2 → L3 until results found

4. **`src/components/listing/listing-grid.astro`**
   - Update messaging for L2/L3 fallback
   - Display location expansion info

### Files to Reference

5. **`src/services/location/location-service.ts`**
   - Use `getDistrictsByProvinceNId()` for hierarchy
   - Resolve parent city from district

## Implementation Steps

### Step 1: Add Location Context Type

**File:** `src/services/search-relaxation/types.ts`

```typescript
export interface LocationContext {
  currentProvince?: {
    nId: string;
    slug: string;
    name: string;
  };
  currentDistrict?: {
    nId: string;
    slug: string;
    name: string;
    provinceNId: string;
  };
  currentWard?: {
    nId: string;
    slug: string;
    name: string;
    districtNId: string;
  };
}

export interface RelaxationLevel {
  level: 1 | 2 | 3;
  description: string;
  removedFilters: string[];
  expandedLocation?: {
    from: string;  // "Ba Dinh"
    to: string;    // "Ha Noi"
  };
  relaxedParams: PropertySearchFilters;
}
```

### Step 2: Implement Level 2 (Expand to City)

**File:** `src/services/search-relaxation/filter-relaxation-service.ts`

```typescript
/**
 * Level 2: Expand district/ward to city level, remove all filters
 * Example: "Ba Dinh" → "Ha Noi"
 */
relaxLevel2(
  filters: PropertySearchFilters,
  locationContext: LocationContext
): RelaxationLevel {
  const relaxedParams: PropertySearchFilters = {
    transactionType: filters.transactionType,
    // Expand to city level
    provinceIds: locationContext.currentProvince
      ? [locationContext.currentProvince.nId]
      : filters.provinceIds,
    districtIds: undefined,  // Remove district specificity
    wardIds: undefined,      // Remove ward specificity
    // Remove all filters
    minPrice: undefined,
    maxPrice: undefined,
    minArea: undefined,
    maxArea: undefined,
    bedrooms: undefined,
    bathrooms: undefined,
    propertyTypes: undefined,
  };

  const expandedLocation = locationContext.currentDistrict
    ? {
        from: locationContext.currentDistrict.name,
        to: locationContext.currentProvince?.name || 'Thành phố',
      }
    : locationContext.currentWard
    ? {
        from: locationContext.currentWard.name,
        to: locationContext.currentProvince?.name || 'Thành phố',
      }
    : undefined;

  return {
    level: 2,
    description: `Đã mở rộng tìm kiếm sang ${expandedLocation?.to || 'khu vực lân cận'}`,
    removedFilters: ['price', 'area', 'rooms', 'property_types', 'district', 'ward'],
    expandedLocation,
    relaxedParams,
  };
}
```

### Step 3: Implement Level 3 (Go Nationwide)

**File:** `src/services/search-relaxation/filter-relaxation-service.ts`

```typescript
/**
 * Level 3: Remove all location filters, keep only transaction type
 * Example: "Ha Noi" → "Toàn quốc"
 */
relaxLevel3(filters: PropertySearchFilters): RelaxationLevel {
  const relaxedParams: PropertySearchFilters = {
    transactionType: filters.transactionType,
    // Remove all location filters
    provinceIds: undefined,
    districtIds: undefined,
    wardIds: undefined,
    // Remove all specific filters
    minPrice: undefined,
    maxPrice: undefined,
    minArea: undefined,
    maxArea: undefined,
    bedrooms: undefined,
    bathrooms: undefined,
    propertyTypes: undefined,
  };

  return {
    level: 3,
    description: 'Đã mở rộng tìm kiếm ra toàn quốc',
    removedFilters: ['location', 'price', 'area', 'rooms', 'property_types'],
    expandedLocation: {
      from: 'Khu vực đã chọn',
      to: 'Toàn quốc',
    },
    relaxedParams,
  };
}

/**
 * Check if Level 2 relaxation is possible
 */
canRelaxLevel2(
  filters: PropertySearchFilters,
  locationContext: LocationContext
): boolean {
  // Can only expand if currently at district/ward level
  return !!(
    locationContext.currentDistrict ||
    locationContext.currentWard
  );
}

/**
 * Check if Level 3 relaxation is possible
 */
canRelaxLevel3(filters: PropertySearchFilters): boolean {
  // Can expand to nationwide if has any location filter
  return !!(
    filters.provinceIds?.length ||
    filters.districtIds?.length ||
    filters.wardIds?.length
  );
}
```

### Step 4: Implement Cascading Fallback Logic

**File:** `src/pages/[...slug].astro` (replace existing fallback from Phase 2)

```typescript
import { filterRelaxationService } from '@/services/search-relaxation/filter-relaxation-service';
import type { LocationContext } from '@/services/search-relaxation/types';

// ... after parallel loading
const [searchResult, featuredProjects, sideBlocks] = await Promise.all([...]);

// Build location context for expansion
const locationContext: LocationContext = {
  currentProvince: resolvedLocation.type === 'province' || resolvedLocation.type === 'district' || resolvedLocation.type === 'ward'
    ? {
        nId: resolvedLocation.provinceId || resolvedLocation.nId,
        slug: resolvedLocation.slug,
        name: resolvedLocation.name,
      }
    : undefined,
  currentDistrict: resolvedLocation.type === 'district' || resolvedLocation.type === 'ward'
    ? {
        nId: resolvedLocation.nId,
        slug: resolvedLocation.slug,
        name: resolvedLocation.name,
        provinceNId: resolvedLocation.provinceId!,
      }
    : undefined,
  currentWard: resolvedLocation.type === 'ward'
    ? {
        nId: resolvedLocation.nId,
        slug: resolvedLocation.slug,
        name: resolvedLocation.name,
        districtNId: resolvedLocation.districtId!,
      }
    : undefined,
};

// Cascading fallback: L1 → L2 → L3
let fallbackResult = null;
let isFallback = false;
let relaxationMetadata = null;

if (searchResult.hits.length === 0) {
  console.log('[Fallback] Original search returned 0 results, attempting fallback...');

  // Try Level 1: Remove filters, keep location
  if (filterRelaxationService.canRelax(searchFilters, 1)) {
    console.log('[Fallback] Attempting Level 1 relaxation...');
    const relaxation = filterRelaxationService.relaxLevel1(searchFilters);
    fallbackResult = await searchProperties(relaxation.relaxedParams);

    if (fallbackResult.hits.length > 0) {
      isFallback = true;
      relaxationMetadata = relaxation;
      console.log(`[Fallback] Level 1 found ${fallbackResult.hits.length} results`);
    }
  }

  // Try Level 2: Expand to city if Level 1 failed
  if (!isFallback && filterRelaxationService.canRelaxLevel2(searchFilters, locationContext)) {
    console.log('[Fallback] Level 1 failed, attempting Level 2 (expand to city)...');
    const relaxation = filterRelaxationService.relaxLevel2(searchFilters, locationContext);
    fallbackResult = await searchProperties(relaxation.relaxedParams);

    if (fallbackResult.hits.length > 0) {
      isFallback = true;
      relaxationMetadata = relaxation;
      console.log(`[Fallback] Level 2 found ${fallbackResult.hits.length} results`);
    }
  }

  // Try Level 3: Go nationwide if Level 2 failed
  if (!isFallback && filterRelaxationService.canRelaxLevel3(searchFilters)) {
    console.log('[Fallback] Level 2 failed, attempting Level 3 (nationwide)...');
    const relaxation = filterRelaxationService.relaxLevel3(searchFilters);
    fallbackResult = await searchProperties(relaxation.relaxedParams);

    if (fallbackResult.hits.length > 0) {
      isFallback = true;
      relaxationMetadata = relaxation;
      console.log(`[Fallback] Level 3 found ${fallbackResult.hits.length} results`);
    }
  }

  // Fallback to featured projects if all else fails
  if (!isFallback) {
    console.log('[Fallback] All relaxation levels failed, using featured projects');
    fallbackResult = { hits: featuredProjects, total: featuredProjects.length };
    isFallback = true;
    relaxationMetadata = {
      level: 1,
      description: 'Hiển thị các dự án nổi bật',
      removedFilters: [],
      relaxedParams: searchFilters,
    };
  }
}

// Determine which results to show
const displayResults = isFallback ? fallbackResult : searchResult;
const displayProperties = displayResults?.hits || [];
```

### Step 5: Update UI Messaging for L2/L3

**File:** `src/components/listing/listing-grid.astro`

```astro
{isFallback && relaxationMetadata && (
  <div class={`border rounded-lg p-4 mb-6 ${
    relaxationMetadata.level === 1 ? 'bg-blue-50 border-blue-200' :
    relaxationMetadata.level === 2 ? 'bg-yellow-50 border-yellow-200' :
    'bg-orange-50 border-orange-200'
  }`}>
    <div class="flex items-start gap-3">
      <svg class="w-5 h-5 mt-0.5 flex-shrink-0" /* info icon */ />
      <div class="flex-1">
        <p class="text-sm font-medium mb-1">
          {relaxationMetadata.level === 1 && 'Kết quả gợi ý'}
          {relaxationMetadata.level === 2 && 'Mở rộng tìm kiếm'}
          {relaxationMetadata.level === 3 && 'Kết quả từ toàn quốc'}
        </p>
        <p class="text-sm">
          {relaxationMetadata.description}.
          {relaxationMetadata.expandedLocation && (
            <span>
              {' '}
              Tìm thấy <strong>{properties.length}</strong> BĐS tại{' '}
              <strong>{relaxationMetadata.expandedLocation.to}</strong>.
            </span>
          )}
        </p>
        {relaxationMetadata.level >= 2 && (
          <a
            href="#"
            class="text-sm underline mt-2 inline-block"
            onclick="history.back(); return false;"
          >
            ← Quay lại tìm kiếm ban đầu
          </a>
        )}
      </div>
    </div>
  </div>
)}
```

## Todo List

- [ ] Add `LocationContext` interface to types
- [ ] Implement `relaxLevel2()` with city expansion
- [ ] Implement `relaxLevel3()` with nationwide expansion
- [ ] Add `canRelaxLevel2()` and `canRelaxLevel3()` helpers
- [ ] Implement cascading fallback in `[...slug].astro`
- [ ] Build location context from resolved location
- [ ] Update UI messaging for L2/L3 in listing-grid
- [ ] Add unit tests for Level 2 and 3
- [ ] Test cascading fallback flow
- [ ] Verify performance (< 300ms total)

## Success Criteria

- ✅ Level 2 correctly expands district → city
- ✅ Level 3 correctly goes nationwide
- ✅ Cascading tries L1 → L2 → L3 in order
- ✅ Stops at first level that returns results
- ✅ Clear messaging for each fallback level
- ✅ Performance < 300ms for all 3 attempts
- ✅ Graceful fallback to featured projects

## Testing Checklist

**Unit Tests:**
- [ ] Level 2 expands district to parent city
- [ ] Level 2 expands ward to parent city
- [ ] Level 3 removes all location filters
- [ ] canRelaxLevel2 returns correct boolean
- [ ] canRelaxLevel3 returns correct boolean

**Integration Tests:**
- [ ] Navigate to `/mua-ban/ba-dinh?bedrooms=50` (impossible in district)
  - Level 1: Tries Ba Dinh without filters → 0 results
  - Level 2: Expands to Ha Noi → finds results ✅
- [ ] Navigate to `/mua-ban/ha-noi?bedrooms=50` (impossible in city)
  - Level 1: Tries Ha Noi without filters → 0 results
  - Level 3: Goes nationwide → finds results ✅
- [ ] Navigate to `/mua-ban?property_types=999` (invalid type)
  - All levels fail → shows featured projects ✅

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| 3 ES queries impact performance | Medium | Cache, parallel if possible, < 300ms SLA |
| User confusion with expanded location | Medium | Clear messaging, visual distinction |
| Level 3 returns too many irrelevant results | Low | Limit to 24, sort by relevance |
| Location hierarchy lookup fails | Low | Fallback to featured projects |

## Performance Optimization

1. **Short-circuit on success:** Stop at first level that returns results
2. **Parallel L2/L3:** If L1 fails, execute L2 and L3 in parallel (future)
3. **Cache location hierarchy:** Cache district → city mappings in memory
4. **Limit result size:** Cap at 24 results per fallback level

## Security Considerations

- Validate location context before expansion
- No user input manipulation (read-only)
- ES query validation (prevent injection)

## Next Steps

After Phase 2 completion:
1. Monitor fallback level distribution (L1 vs L2 vs L3 usage)
2. Analyze user engagement with expanded results
3. Validate all 3 tiers work correctly
4. Proceed to Phase 3: Polish UI/UX, analytics, and production optimization
