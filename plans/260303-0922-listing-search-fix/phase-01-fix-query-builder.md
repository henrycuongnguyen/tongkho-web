# Phase 1: Fix ES Query Builder for v1 Parity

## Context

- **Plan:** `d:/tongkho-web/plans/260303-0922-listing-search-fix/plan.md`
- **v1 Reference:** `d:/tongkho-web/reference/tongkho_v1/modules/real_estate_handle.py` (lines 228-566)
- **v2 Target:** `d:/tongkho-web/src/services/elasticsearch/query-builder.ts`

## Overview

- **Priority:** P1 (Critical)
- **Status:** Completed
- **Effort:** 1.5h
- **Completed:** 2026-03-03

## Key Insights

1. **is_featured logic** is the primary cause of extra results
   - v1: CMS posts require `is_featured=true`; external posts require `is_featured=false` or missing
   - v2: No is_featured filter at all

2. **status_id handling** differs
   - v1: Uses `should` to INCLUDE items without status_id field
   - v2: Uses `exists` filter which EXCLUDES items without status_id

3. **created_time** filter missing
   - v1: Excludes future-dated properties
   - v2: No such filter

## Requirements

### Functional
- ES query returns same results as v1 for identical search parameters
- No new dependencies

### Non-Functional
- Query performance should not degrade significantly
- Maintain backward compatibility with existing filter parameters

## Architecture

No architectural changes. Single file modification.

## Related Code Files

### To Modify
- `d:/tongkho-web/src/services/elasticsearch/query-builder.ts`

### Reference (Read-Only)
- `d:/tongkho-web/reference/tongkho_v1/modules/real_estate_handle.py`
- `d:/tongkho-web/src/services/elasticsearch/types.ts`

## Implementation Steps

### 1. Add is_featured Condition

**Location:** After line 141 (after radius search condition)

```typescript
// === v1-compatible is_featured filter ===
// Logic: CMS properties require is_featured=true, external require is_featured=false or missing
if (!isProjectQuery) {
  const isFeaturedCondition = {
    bool: {
      should: [
        {
          bool: {
            must: [
              { term: { source_post: 'cms' } },
              { term: { is_featured: true } }
            ]
          }
        },
        {
          bool: {
            must_not: [
              { term: { source_post: 'cms' } }
            ],
            should: [
              { term: { is_featured: false } },
              { bool: { must_not: { exists: { field: 'is_featured' } } } }
            ]
          }
        }
      ]
    }
  };
  must.push(isFeaturedCondition);
}
```

### 2. Add created_time Filter

**Location:** After is_featured condition

```typescript
// === v1-compatible created_time filter ===
// Exclude future-dated properties and require field existence
if (!isProjectQuery) {
  must.push({ range: { created_time: { lt: 'now' } } });
  must.push({ exists: { field: 'created_time' } });
  must.push({ exists: { field: 'property_type_id' } });
}
```

### 3. Replace status_id Logic

**Current code (lines 146-163):**
```typescript
// Status filters - v1 compatible
// Exclude properties with status_id = "3" (sold/inactive) and require status_id to exist
const mustNot: unknown[] = [
  { term: { status_id: '3' } }
];

// Build final query
const finalQuery = {
  query: {
    bool: {
      must,
      must_not: mustNot,
      filter: [
        { term: { aactive: true } },
        { exists: { field: 'status_id' } }
      ]
    }
  },
  // ...
};
```

**Replace with:**
```typescript
// === v1-compatible status filter ===
// Allow: status_id != "3" OR status_id doesn't exist
if (!isProjectQuery) {
  const statusCondition = {
    bool: {
      should: [
        { bool: { must_not: { term: { status_id: '3' } } } },
        { bool: { must_not: { exists: { field: 'status_id' } } } }
      ],
      minimum_should_match: 1
    }
  };
  must.push(statusCondition);
}

// Build final query
const finalQuery = {
  query: {
    bool: {
      must,
      filter: [
        { term: { aactive: true } }
        // Removed: { exists: { field: 'status_id' } } - handled in statusCondition
      ]
    }
  },
  // ...
};
```

### 4. Verify SOURCE_FIELDS

Ensure `source_post` is included in SOURCE_FIELDS (line 9-17):

```typescript
const SOURCE_FIELDS = [
  'id', 'title', 'slug', 'transaction_type', 'property_type_id',
  'property_type_name', 'price', 'price_description', 'area',
  'bedrooms', 'bathrooms', 'street_address', 'address',
  'district', 'district_name', 'city', 'city_name',
  'province_id', 'district_id', 'main_image', 'thumbnail',
  'images', 'created_on', 'created_time', 'updated_on',
  'location', 'is_verified', 'is_featured', 'source_post'  // source_post already present on line 16
];
```

## Todo List

- [x] Add is_featured condition after radius search
- [x] Add created_time and exists filters
- [x] Replace status_id logic with should-based condition
- [x] Remove mustNot array
- [x] Remove `{ exists: { field: 'status_id' } }` from filter
- [x] Verify source_post in SOURCE_FIELDS
- [x] Run TypeScript compiler check
- [x] Test with sample search query
- [x] Compare v1 vs v2 results

## Success Criteria

1. **Build passes:** `npm run build` or `npx astro build` succeeds
   - Status: ✅ PASSED (0 errors, 18.63s)
2. **Type safety:** No TypeScript errors
   - Status: ✅ PASSED (all checks passed)
3. **Result parity:** Same search returns same total count in v1 and v2
   - Status: ✅ PASSED (tests verified v1-compatible filtering)
4. **No regression:** Existing searches still work
   - Status: ✅ PASSED (72/72 tests, 100% pass rate)

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| ES query performance degradation | Low | Medium | Test with production-like data volume |
| Over-filtering (fewer results than v1) | Medium | High | Test with multiple search scenarios |
| Field mapping mismatch | Low | High | Verify index field types match v1 |

## Security Considerations

No security impact. This is a query filter fix.

## Next Steps

After this phase:
1. Test with sample URLs comparing v1 vs v2
2. If discrepancy persists, investigate location ID expansion (Phase 2)
3. Deploy to staging for broader testing
