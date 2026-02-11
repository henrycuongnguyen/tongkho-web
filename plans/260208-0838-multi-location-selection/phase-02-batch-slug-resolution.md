---
title: "Phase 2: Batch Slug Resolution to nIds"
status: pending
priority: P1
effort: 1h
---

# Phase 2: Batch Slug Resolution to nIds

## Context Links

- [location-service.ts](d:\tongkho-web\src\services\location\location-service.ts)
- [location-search-service.ts](d:\tongkho-web\src\services\elasticsearch\location-search-service.ts)
- [MEMORY.md](d:\tongkho-web\.claude\MEMORY.md) - ID type mismatch fix

## Overview

Add batch slug resolution service to convert multiple location slugs to their nIds (ES-compatible string IDs) in a single query.

## Key Insights

**CRITICAL from Memory:**
- ElasticSearch IDs are strings (`nId` like "VN-HN")
- Database IDs are integers (`id` like 123)
- **ALWAYS use `nId` for ES queries, NEVER use `id`**

## Requirements

### Functional
- Resolve multiple slugs to nIds in single DB query
- Return map: `{ slug: { nId, name, type, level } }`
- Handle mixed province/district/ward slugs
- Return empty for non-existent slugs (graceful)

### Non-Functional
- Single DB query (batch, not N+1)
- Cache results for build-time optimization
- Type-safe return structure

## Architecture

```
Input: ['ha-noi', 'quan-cau-giay', 'phuong-trung-hoa']
             |
             v
    +-------------------+
    | getLocationsBySlug |
    | (single SQL query) |
    +-------------------+
             |
             v
Output: {
  'ha-noi': { nId: 'VN-HN', name: 'Ha Noi', level: 0 },
  'quan-cau-giay': { nId: 'VN-HN-CG', name: 'Cau Giay', level: 1 },
  'phuong-trung-hoa': { nId: 'VN-HN-CG-TH', name: 'Trung Hoa', level: 2 }
}
```

## Related Code Files

### Modify
- `src/services/location/location-service.ts`
  - Add `getLocationsBySlug(slugs: string[])` function

### Reference
- `src/services/location/types.ts` - Location type definitions

## Implementation Steps

### Step 1: Add LocationInfo type

```typescript
// In types.ts or inline in location-service.ts
export interface LocationInfo {
  nId: string;
  name: string;
  slug: string;
  level: number; // 0=province, 1=district, 2=ward
  type: 'province' | 'district' | 'ward';
}
```

### Step 2: Implement getLocationsBySlug()

```typescript
/**
 * Batch resolve location slugs to nIds
 * Returns map of slug -> LocationInfo for ES filtering
 */
export async function getLocationsBySlug(
  slugs: string[]
): Promise<Map<string, LocationInfo>> {
  if (slugs.length === 0) return new Map();

  // Limit to prevent DoS
  const limitedSlugs = slugs.slice(0, 10);

  try {
    const rows = await db
      .select({
        nId: locations.nId,
        name: locations.nName,
        slug: locations.nSlug,
        level: locations.nLevel,
      })
      .from(locations)
      .where(
        and(
          sql`${locations.nSlug} IN ${limitedSlugs}`,
          ne(locations.nStatus, '6'),
          eq(locations.aactive, true)
        )
      );

    const result = new Map<string, LocationInfo>();

    for (const row of rows) {
      const level = parseInt(row.level || '0', 10);
      result.set(row.slug || '', {
        nId: row.nId || '',
        name: row.name || '',
        slug: row.slug || '',
        level,
        type: level === 0 ? 'province' : level === 1 ? 'district' : 'ward'
      });
    }

    return result;

  } catch (error) {
    console.error('[LocationService] Batch slug resolution failed:', error);
    return new Map();
  }
}
```

### Step 3: Update [...slug].astro to use batch resolution

```typescript
// Replace single getProvinceBySlug with batch resolution
// @ts-expect-error - temp storage
const locationSlugs = filters._locationSlugs as string[] | undefined;

if (locationSlugs && locationSlugs.length > 0) {
  const locationMap = await getLocationsBySlug(locationSlugs);

  // Collect nIds by level for ES filtering
  const provinceNIds: string[] = [];
  const districtNIds: string[] = [];
  const wardNIds: string[] = [];

  for (const slug of locationSlugs) {
    const loc = locationMap.get(slug);
    if (!loc) continue;

    if (loc.level === 0) provinceNIds.push(loc.nId);
    else if (loc.level === 1) districtNIds.push(loc.nId);
    else if (loc.level === 2) wardNIds.push(loc.nId);
  }

  if (provinceNIds.length > 0) filters.provinceIds = provinceNIds;
  if (districtNIds.length > 0) filters.districtIds = districtNIds;
  // Note: wardIds not in current ES types, may need Phase 2.5 to add

  // Cleanup temp field
  // @ts-expect-error
  delete filters._locationSlugs;
}
```

## Todo List

- [ ] Add LocationInfo interface to types
- [ ] Implement getLocationsBySlug() with batch SQL
- [ ] Add 10-slug limit for security
- [ ] Update [...slug].astro to use batch resolution
- [ ] Group nIds by level (province, district, ward)
- [ ] Pass grouped nIds to ES filters
- [ ] Test with mixed province + district slugs
- [ ] Verify ES query produces correct results

## Success Criteria

- [ ] Single DB query for multiple slugs
- [ ] Correct nId resolution (strings, not integers!)
- [ ] Mixed province/district/ward handling
- [ ] ES query filters by all resolved nIds
- [ ] Property results filtered correctly

## Security Considerations

- Limit to 10 slugs max
- Slugs validated (alphanumeric + hyphens)
- SQL injection prevented via parameterized query

## Next Steps

Phase 3 will implement the autocomplete multi-select UI with chips.
