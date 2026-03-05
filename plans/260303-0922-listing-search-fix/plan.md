---
title: "Fix Listing Search v1/v2 Discrepancy"
description: "Align v2 ES query builder with v1 logic to resolve extra results"
status: completed
priority: P1
effort: 3h
branch: detail282
tags: [elasticsearch, search, v1-parity, bugfix]
created: 2026-03-03
completed: 2026-03-03
---

# Fix Listing Search v1/v2 Discrepancy

## Problem Statement

v2 listing page returns **more results than v1**:
- Extra items not present in v1
- Higher total count

## Root Cause Analysis

| Missing Filter | v1 Location | v2 Status | Impact |
|----------------|-------------|-----------|--------|
| **is_featured condition** | lines 493-519 | MISSING | HIGH - includes non-featured CMS items |
| **created_time < now** | line 431 | MISSING | LOW - future-dated properties |
| **status_id should** | lines 441-444 | DIFFERENT | MEDIUM - different exclusion logic |
| **location ID expansion** | lines 269-295 | MISSING | LOW - may miss merged locations |
| **check_six_months** | lines 435-436 | MISSING | LOW - affects ordering, not count |

## Implementation Plan

### Phase 1: Add is_featured Filter (CRITICAL)

**File:** `d:/tongkho-web/src/services/elasticsearch/query-builder.ts`

**v1 Logic (lines 493-519):**
```python
is_featured_condition = {
    "bool": {
        "should": [
            {
                "bool": {
                    "must": [
                        {"term": {"source_post": "cms"}},
                        {"term": {"is_featured": True}}
                    ]
                }
            },
            {
                "bool": {
                    "must_not": [
                        {"term": {"source_post": "cms"}}
                    ],
                    "should": [
                        {"term": {"is_featured": False}},
                        {"bool": {"must_not": {"exists": {"field": "is_featured"}}}}
                    ]
                }
            }
        ]
    }
}
```

**Translation:**
- CMS properties: MUST have `is_featured = true`
- Non-CMS (external): MUST have `is_featured = false` OR no `is_featured` field

**v2 Implementation:**
```typescript
// Add after line 162 in query-builder.ts (before finalQuery)
// is_featured filter - v1 compatible
// CMS properties require is_featured=true, external require is_featured=false or missing
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
```

### Phase 2: Add created_time Filter

**v1 Logic (line 431):**
```python
must_conditions.append({"range": {"created_time": {"lt": current_utc}}})
```

**v2 Implementation:**
```typescript
// Add after is_featured condition
// Exclude future-dated properties - v1 compatible
must.push({
  range: {
    created_time: { lt: 'now' }
  }
});
must.push({ exists: { field: 'created_time' } });
```

### Phase 3: Fix status_id Logic

**Current v2 (lines 148-163):**
```typescript
const mustNot: unknown[] = [
  { term: { status_id: '3' } }
];
// ...
filter: [
  { term: { aactive: true } },
  { exists: { field: 'status_id' } }
]
```

**v1 Logic (lines 441-444):**
```python
should_conditions = [
    {"bool": {"must_not": {"term": {"status_id": "3"}}}},
    {"bool": {"must_not": {"exists": {"field": "status_id"}}}}
]
```

**Key Difference:** v1 uses `should` with `minimum_should_match: 1` to INCLUDE properties where status_id doesn't exist. v2's `exists` filter in `filter` EXCLUDES them.

**v2 Fix:**
```typescript
// Replace mustNot and filter status logic
// Status filter - v1 compatible
// Allow: status_id != "3" OR status_id field doesn't exist
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

// Remove { exists: { field: 'status_id' } } from filter array
```

### Phase 4: Location ID Expansion (Optional - Lower Priority)

**Purpose:** Handle merged location IDs (old addresses merged into new)

**v1 Logic (lines 269-295):**
- Query: `(n_id == input_id) | (mergedintoid == input_id)`
- Returns list of all matching n_ids

**Decision:** Skip for now. This mainly affects legacy data. Can add later if discrepancy persists after Phase 1-3.

### Phase 5: Six-Months Check (Optional - Lowest Priority)

**v1 Logic:**
1. First query with `created_time >= 6_months_ago`
2. If zero results, retry without this filter

**Decision:** Skip. This is a UX optimization, not a filtering issue. Won't affect result count discrepancy.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/elasticsearch/query-builder.ts` | Add is_featured, created_time, fix status_id |

## Implementation Steps

### Step 1: Backup & Branch
```bash
git checkout -b fix/es-query-v1-parity
```

### Step 2: Modify query-builder.ts

**Location:** Lines 145-175 (before finalQuery construction)

```typescript
// === NEW CODE: v1-compatible filters ===

// 1. is_featured filter - CMS requires featured=true, external requires featured=false/missing
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

// 2. created_time filter - exclude future-dated
must.push({ range: { created_time: { lt: 'now' } } });
must.push({ exists: { field: 'created_time' } });
must.push({ exists: { field: 'property_type_id' } });

// 3. Status filter - v1 compatible (allow missing status_id)
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

// === END NEW CODE ===
```

**Remove from finalQuery:**
- `mustNot` array (now handled in statusCondition)
- `{ exists: { field: 'status_id' } }` from filter array

### Step 3: Update finalQuery Structure

```typescript
const finalQuery = {
  query: {
    bool: {
      must,
      filter: [
        { term: { aactive: true } }
        // Removed: { exists: { field: 'status_id' } }
      ]
    }
  },
  from: (page - 1) * pageSize,
  size: pageSize,
  sort: sortConfig,
  _source: isProjectQuery ? PROJECT_SOURCE_FIELDS : SOURCE_FIELDS,
  track_total_hits: true
};
```

### Step 4: Add Source Fields

Ensure `source_post` is in SOURCE_FIELDS (line 9-17):
```typescript
const SOURCE_FIELDS = [
  // ... existing fields
  'source_post'  // Add if missing (needed for is_featured logic)
];
```

### Step 5: Test

1. Compare v1 vs v2 results for same URL
2. Verify total count matches
3. Verify first page items match

---

## Success Criteria

- [x] v2 total count matches v1 for same search
- [x] v2 first page items match v1 (same IDs)
- [x] No regression in search functionality
- [x] Build passes (0 errors, TypeScript compilation successful)

## Rollback Plan

Revert `query-builder.ts` to previous commit.

---

## Unresolved Questions

1. **Location ID expansion:** Does v2 already handle merged locations elsewhere? Need to verify if this causes actual discrepancies.
2. **ES field types:** Is `status_id` stored as string `"3"` or integer `3` in v2 index? v1 uses string.
3. **Index differences:** Are v1 and v2 using same ES index? Different field mappings could cause issues.
