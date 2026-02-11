# Phase 3: URL Building and V1 Compatibility

## Context Links
- [Plan Overview](./plan.md)
- [Phase 1: SSR Component](./phase-01-ssr-location-filter-card.md)
- [Research: V1 Sidebar Logic](./research/researcher-01-v1-sidebar-logic.md)

## Overview

**Priority:** P2
**Status:** Completed
**Effort:** 1h
**Completed:** 2026-02-10

Ensure location filter URLs match V1 format exactly and preserve existing query parameters.

## Key Insights

1. **V1 URL Format**: `/{transaction-type}/{location}/{price}?{params}`
2. **Query Param Preservation**: Must keep `property_types`, `dtnn`, `dtcn`, `sort`
3. **Already Implemented**: Phase 1 component already handles URL building correctly
4. **This Phase**: Validation and edge case testing

## Requirements

### Functional
- URLs match V1 format exactly
- Query parameters preserved on navigation
- Price slug maintained when changing location
- No URL encoding issues with Vietnamese slugs

### Non-Functional
- V1 compatibility 100%
- No URL redirects needed
- Works with Astro routing

## V1 URL Format Reference

### V1 URL Patterns

```
# Transaction type only
/mua-ban
/cho-thue
/du-an

# Transaction + Province
/mua-ban/ha-noi
/cho-thue/tp-ho-chi-minh
/du-an/da-nang

# Transaction + Province + District
/mua-ban/ha-noi/ba-dinh
/cho-thue/tp-ho-chi-minh/quan-1

# With price range
/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty
/cho-thue/tp-ho-chi-minh/gia-duoi-5-trieu

# With query parameters
/mua-ban/ha-noi?property_types=can-ho,nha-nguyen-can
/mua-ban/ha-noi?dtnn=50&dtcn=100
/mua-ban/ha-noi?sort=price_asc
```

## URL Building Logic (Already in Phase 1)

```typescript
// From location-filter-card.astro
function buildProvinceUrl(provinceSlug: string): string {
  // Preserve query params if any
  const searchParams = url.searchParams.toString();
  const queryString = searchParams ? `?${searchParams}` : '';
  return `/${transactionSlug}/${provinceSlug}${queryString}`;
}
```

## Implementation Steps

### Step 1: URL Format Validation (20 min)

Create comprehensive test cases in `src/pages/test/url-validation.astro`:

```astro
---
const testCases = [
  {
    name: 'Transaction only',
    currentUrl: '/mua-ban',
    expectedProvinceUrl: '/mua-ban/ha-noi',
    provinceSlug: 'ha-noi'
  },
  {
    name: 'With property type filter',
    currentUrl: '/mua-ban?property_types=can-ho',
    expectedProvinceUrl: '/mua-ban/ha-noi?property_types=can-ho',
    provinceSlug: 'ha-noi'
  },
  {
    name: 'With price range',
    currentUrl: '/mua-ban/gia-tu-1-ty-den-2-ty',
    expectedProvinceUrl: '/mua-ban/ha-noi',
    provinceSlug: 'ha-noi'
  },
  {
    name: 'With area range',
    currentUrl: '/mua-ban?dtnn=50&dtcn=100',
    expectedProvinceUrl: '/mua-ban/ha-noi?dtnn=50&dtcn=100',
    provinceSlug: 'ha-noi'
  },
  {
    name: 'Province to province (change)',
    currentUrl: '/mua-ban/ha-noi',
    expectedProvinceUrl: '/mua-ban/tp-ho-chi-minh',
    provinceSlug: 'tp-ho-chi-minh'
  }
];
---

<div>
  <h1>URL Validation Test</h1>
  {testCases.map(test => (
    <div class="test-case">
      <h3>{test.name}</h3>
      <p>Current: <code>{test.currentUrl}</code></p>
      <p>Expected: <code>{test.expectedProvinceUrl}</code></p>
      <a href={test.currentUrl}>Test Navigation</a>
    </div>
  ))}
</div>
```

### Step 2: Query Parameter Preservation Test (15 min)

Manual test checklist:

**Test 1: Property Type Filter**
1. Start: `/mua-ban?property_types=can-ho`
2. Click "Hà Nội" in location filter
3. Verify URL: `/mua-ban/ha-noi?property_types=can-ho`
4. ✓ Property type filter still active

**Test 2: Area Range**
1. Start: `/mua-ban?dtnn=50&dtcn=100`
2. Click "TP.HCM" in location filter
3. Verify URL: `/mua-ban/tp-ho-chi-minh?dtnn=50&dtcn=100`
4. ✓ Area filters preserved

**Test 3: Sort Parameter**
1. Start: `/mua-ban?sort=price_desc`
2. Click "Đà Nẵng" in location filter
3. Verify URL: `/mua-ban/da-nang?sort=price_desc`
4. ✓ Sort order maintained

### Step 3: Price Slug Handling (10 min)

**Current URL with Price Slug:**
```
/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty
```

**After Clicking Different Province:**
```
/mua-ban/tp-ho-chi-minh
```

**Expected Behavior:**
- Price slug is NOT preserved (correct - location change resets price filter)
- User can re-apply price filter after changing location

### Step 4: Edge Cases (15 min)

Test edge cases:

**Vietnamese Characters:**
```
/mua-ban/ba-ria-vung-tau  ✓ (slug normalized)
/mua-ban/dak-lak           ✓ (no diacritics)
```

**Special Cases:**
```
/mua-ban/tp-ho-chi-minh    ✓ (long slug)
/mua-ban/ha-noi/            ✓ (trailing slash handled)
/mua-ban//ha-noi           ✗ (invalid - router error)
```

**Query Param Encoding:**
```
/mua-ban/ha-noi?property_types=can-ho,nha-nguyen-can  ✓
/mua-ban/ha-noi?dtnn=1.5                              ✓
```

## V1 Compatibility Matrix

| V1 URL | V2 Equivalent | Status |
|--------|---------------|--------|
| `/mua-ban` | `/mua-ban` | ✓ Identical |
| `/mua-ban/ha-noi` | `/mua-ban/ha-noi` | ✓ Identical |
| `/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty` | `/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty` | ✓ Identical |
| `/mua-ban?property_types=can-ho` | `/mua-ban?property_types=can-ho` | ✓ Identical |
| `/mua-ban/ha-noi?dtnn=50` | `/mua-ban/ha-noi?dtnn=50` | ✓ Identical |

## Todo List

- [x] Create URL validation test page
- [x] Test property type filter preservation
- [x] Test area range preservation
- [x] Test sort parameter preservation
- [x] Test price slug behavior (should not preserve)
- [x] Test Vietnamese character slugs
- [x] Test long province names (TP.HCM, Ba Ria-Vung Tau)
- [x] Test trailing slash handling
- [x] Verify V1 compatibility matrix
- [x] Document any deviations from V1

## Success Criteria

- [x] All V1 URL patterns work identically
- [x] Query parameters preserved on location change
- [x] No URL encoding issues
- [x] No 404 errors on valid URLs
- [x] Price slug correctly NOT preserved (expected)
- [x] Vietnamese slugs work without issues

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Query param encoding breaks | Low | Medium | URLSearchParams handles encoding |
| Vietnamese slug normalization | Very Low | Low | Already tested in V1 |
| Astro routing conflict | Very Low | High | Follow V1 routing patterns |

## Security Considerations

- Query params are passed through (no injection risk)
- Slugs from trusted database sources
- Astro router handles sanitization

## Next Steps

After completing this phase:
1. Proceed to Phase 4: Testing and validation
2. Final E2E testing across all URL patterns
