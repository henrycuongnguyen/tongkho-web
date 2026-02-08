---
title: "Phase 1: URL Parser - addresses Query Param"
status: pending
priority: P1
effort: 1h
---

# Phase 1: URL Parser - addresses Query Param

## Context Links

- [listing-url-parser.ts](d:\tongkho-web\src\utils\listing-url-parser.ts)
- [V1 search-url-builder.js](d:\tongkho-web\reference\resaland_v1\static\js\module\search-url-builder.js)
- [V1 filters.py build_url()](d:\tongkho-web\reference\resaland_v1\models\filters.py) - lines 922-1070

## Overview

Extend URL parser to read `addresses` query param and merge with path location (arg2). The combined slugs will be resolved to nIds for ES filtering.

## Key Insights

V1 Pattern (from `search-url-builder.js:160-167`):
```javascript
if (selectedAddresses) {
    const addressList = selectedAddresses.split(',');
    if (addressList.length === 1) {
        urlArg2 = addressList[0];
    } else if (addressList.length > 1) {
        urlArg2 = addressList[0];
        params.addresses = addressList.slice(1).join(',');
    }
}
```

## Requirements

### Functional
- Parse `addresses` query param as comma-separated slugs
- Merge with path location slug (arg2)
- Store combined slugs in `_locationSlugs: string[]` temp field
- Handle empty, single, and multiple addresses

### Non-Functional
- Maintain backward compatibility with single location
- No breaking changes to existing filter structure

## Architecture

```
URL: /mua-ban/quan-ba-dinh?addresses=quan-cau-giay,quan-hoan-kiem
                 |                        |
                 v                        v
         pathLocationSlug         addressesSlugs[]
                 |                        |
                 +------------------------+
                           |
                           v
                  _locationSlugs: ['quan-ba-dinh', 'quan-cau-giay', 'quan-hoan-kiem']
```

## Related Code Files

### Modify
- `src/utils/listing-url-parser.ts`
  - Add `_locationSlugs?: string[]` temp field to filters
  - Parse `addresses` query param
  - Merge path slug + addresses into array

### No Changes Needed
- `src/services/elasticsearch/types.ts` - Already has `provinceIds?: string[]`, `districtIds?: string[]`

## Implementation Steps

### Step 1: Update parseListingUrl() to handle addresses param

```typescript
// In parseListingUrl() after existing _locationSlug handling:

// Parse addresses query param (multiple locations)
const addressesParam = searchParams.get('addresses');
const locationSlugs: string[] = [];

// First: path location (arg2)
if (slugParts.length > 1) {
  const pathLocationSlug = slugParts[1];
  if (pathLocationSlug !== 'toan-quoc') {
    locationSlugs.push(pathLocationSlug);
  }
}

// Then: addresses param
if (addressesParam) {
  const additionalSlugs = addressesParam.split(',').filter(s => s.trim().length > 0);
  locationSlugs.push(...additionalSlugs);
}

// Store for later resolution
if (locationSlugs.length > 0) {
  // @ts-expect-error - temp storage for slug resolution
  filters._locationSlugs = locationSlugs;
}
```

### Step 2: Update buildListingUrl() to output addresses param

```typescript
// In buildListingUrl() - new logic for multi-location:

// If multiple location slugs provided, handle specially
// @ts-expect-error - temp storage
const locationSlugs = filters._locationSlugs as string[] | undefined;

if (locationSlugs && locationSlugs.length > 0) {
  // First slug goes in URL path
  parts[1] = locationSlugs[0];

  // Rest go in addresses param
  if (locationSlugs.length > 1) {
    params.set('addresses', locationSlugs.slice(1).join(','));
  }
}
```

### Step 3: Remove old _locationSlug handling

Replace single `_locationSlug` with `_locationSlugs` array throughout.

## Todo List

- [ ] Add `_locationSlugs?: string[]` temp field handling in parseListingUrl
- [ ] Parse `addresses` query param
- [ ] Merge path slug + addresses into array
- [ ] Update buildListingUrl() for multi-location output
- [ ] Remove/deprecate old `_locationSlug` single-value handling
- [ ] Add unit tests for URL parsing
- [ ] Verify backward compatibility with single location URLs

## Success Criteria

- [x] `/mua-ban/ha-noi` works (single location, backward compat)
- [x] `/mua-ban/ha-noi?addresses=da-nang,ho-chi-minh` parses to 3 slugs
- [x] `buildListingUrl()` produces correct URL with addresses param
- [x] No TypeScript errors

## Security Considerations

- Limit addresses to max 10 to prevent DoS via long query strings
- Sanitize slug inputs (alphanumeric + hyphens only)

## Next Steps

Phase 2 will resolve these slugs to nIds via batch location service.
