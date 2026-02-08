---
title: "Phase 5: Integration and Testing"
status: pending
priority: P1
effort: 1h
---

# Phase 5: Integration and Testing

## Context Links

- [pages/[...slug].astro](d:\tongkho-web\src\pages\[...slug].astro)
- [property-search-service.ts](d:\tongkho-web\src\services\elasticsearch\property-search-service.ts)

## Overview

Wire all components together and verify end-to-end flow from multi-location selection to ES query results.

## Requirements

### Functional
- User selects multiple locations -> URL updates correctly
- Page load parses URL -> resolves slugs -> ES filters by nIds
- Property results match selected locations
- Chips restore from URL on page load

### Non-Functional
- No infinite reload loops
- < 500ms additional latency for multi-location
- Works with existing filters (price, area, property types)

## Architecture: Full Flow

```
User selects locations in autocomplete
                |
                v
Clicks "Tim kiem" button
                |
                v
Navigate: /mua-ban/ha-noi?addresses=da-nang,ho-chi-minh
                |
                v
[...slug].astro receives request
                |
                v
parseListingUrl() extracts _locationSlugs: ['ha-noi', 'da-nang', 'ho-chi-minh']
                |
                v
getLocationsBySlug() batch resolves to nIds
                |
                v
filters.provinceIds = ['VN-HN', 'VN-DN', 'VN-SG']
                |
                v
searchProperties(filters) with ES terms query
                |
                v
Property results from Ha Noi, Da Nang, Ho Chi Minh
```

## Related Code Files

### Modify
- `src/pages/[...slug].astro`
  - Use batch getLocationsBySlug()
  - Pass resolved nIds to searchProperties
  - Pass location data to sidebar for chip restoration

- `src/services/elasticsearch/property-search-service.ts`
  - Verify terms query for multiple provinceIds/districtIds

### Verify (no changes)
- ElasticSearch query builder handles arrays correctly

## Implementation Steps

### Step 1: Update [...slug].astro location resolution

```typescript
// Replace existing single-location resolution with batch

import { getLocationsBySlug } from '@/services/location/location-service';

// ... after parseListingUrl ...

// Resolve multiple location slugs to nIds
// @ts-expect-error - temp storage
const locationSlugs = filters._locationSlugs as string[] | undefined;
let resolvedLocations: Array<{slug: string, name: string, nId: string, level: number}> = [];

if (locationSlugs && locationSlugs.length > 0) {
  const locationMap = await getLocationsBySlug(locationSlugs);

  // Collect nIds by level
  const provinceNIds: string[] = [];
  const districtNIds: string[] = [];

  for (const slug of locationSlugs) {
    const loc = locationMap.get(slug);
    if (!loc) continue;

    resolvedLocations.push({
      slug: loc.slug,
      name: loc.name,
      nId: loc.nId,
      level: loc.level
    });

    if (loc.level === 0) provinceNIds.push(loc.nId);
    else if (loc.level === 1) districtNIds.push(loc.nId);
    // Note: wards (level 2) may need ES schema update
  }

  if (provinceNIds.length > 0) filters.provinceIds = provinceNIds;
  if (districtNIds.length > 0) filters.districtIds = districtNIds;

  // @ts-expect-error - cleanup
  delete filters._locationSlugs;
}
```

### Step 2: Pass resolved locations to sidebar

```astro
<!-- In [...slug].astro template -->
<Fragment slot="sidebar">
  <SidebarWrapper
    filters={filters}
    resolvedLocations={resolvedLocations}
  />
</Fragment>
```

### Step 3: Verify ES query handles multiple IDs

```typescript
// In property-search-service.ts buildQuery()
// Should already handle arrays via terms query:

if (filters.provinceIds?.length) {
  boolQuery.filter.push({
    terms: { province_id: filters.provinceIds }
  });
}

if (filters.districtIds?.length) {
  boolQuery.filter.push({
    terms: { district_id: filters.districtIds }
  });
}
```

### Step 4: Initialize chips from resolved locations

```javascript
// In location-autocomplete.astro
// Receive resolvedLocations from server

// Option 1: Inline script with server data
<script define:vars={{ resolvedLocations }}>
  if (resolvedLocations && resolvedLocations.length > 0) {
    // Initialize chips from server-resolved data
    window.__initialLocations = resolvedLocations;
  }
</script>

// Option 2: Data attribute
<div
  data-initial-locations={JSON.stringify(resolvedLocations)}
  class="location-autocomplete"
>
```

### Step 5: Test scenarios

| Scenario | Input URL | Expected |
|----------|-----------|----------|
| Single province | `/mua-ban/ha-noi` | Properties in Ha Noi |
| Multi province | `/mua-ban/ha-noi?addresses=da-nang` | Ha Noi + Da Nang properties |
| Mixed levels | `/mua-ban/quan-cau-giay?addresses=ha-noi` | Cau Giay district + Ha Noi province |
| Invalid slug | `/mua-ban/invalid-slug` | No filter applied (graceful) |
| Too many | `?addresses=a,b,c,d,e,f,g,h,i,j,k` | Only first 10 used |

## Todo List

- [ ] Update [...slug].astro with batch location resolution
- [ ] Pass resolvedLocations to sidebar components
- [ ] Verify ES terms query for multiple IDs
- [ ] Initialize chips from server data
- [ ] Test single location backward compat
- [ ] Test multi-province selection
- [ ] Test mixed province + district
- [ ] Test invalid slug handling
- [ ] Test max 10 limit
- [ ] Verify no infinite reload loops
- [ ] Performance test (< 500ms added latency)
- [ ] Test with existing filters (price, area, etc.)

## Success Criteria

- [ ] Multi-location search returns correct properties
- [ ] Chips display on page load from URL
- [ ] No regressions in single-location flow
- [ ] Works with all existing filters
- [ ] No infinite reload loops
- [ ] Performance acceptable

## Test Commands

```bash
# Development server
npm run dev

# Navigate to test URLs
# Single: http://localhost:3000/mua-ban/ha-noi
# Multi: http://localhost:3000/mua-ban/ha-noi?addresses=da-nang,ho-chi-minh

# Check console for errors
# Verify property count matches location filter
```

## Security Considerations

- Validate all slugs before ES query
- Rate limit API calls
- Log suspicious patterns (many invalid slugs)

## Next Steps

After Phase 5, feature is complete. Document in codebase-summary.md and update project-roadmap.md.
