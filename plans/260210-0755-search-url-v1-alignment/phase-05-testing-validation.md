# Phase 5: Testing & Validation

**Priority:** High
**Status:** Pending
**Depends On:** All previous phases

## Context

Comprehensive testing to ensure v2 search URL building matches v1 behavior exactly.

## Test Strategy

### 1. URL Format Validation

**Automated Tests:**

Create test suite `src/tests/search-url-builder.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildSearchUrl } from '@/services/url/search-url-builder';
import { convertPriceToSlug, buildPriceSlug } from '@/services/url/price-slug-converter';
import type { SearchFilters } from '@/types/search-filters';

describe('Price Slug Conversion', () => {
  it('converts billions to ty format', () => {
    expect(convertPriceToSlug(1000000000)).toBe('1-ty');
    expect(convertPriceToSlug(1500000000)).toBe('1.5-ty');
    expect(convertPriceToSlug(2000000000)).toBe('2-ty');
  });

  it('converts millions to trieu format', () => {
    expect(convertPriceToSlug(500000000)).toBe('500-trieu');
    expect(convertPriceToSlug(800000000)).toBe('800-trieu');
  });

  it('builds correct price slugs', () => {
    expect(buildPriceSlug(0, 0)).toBe('gia-thuong-luong');
    expect(buildPriceSlug(0, 500000000)).toBe('gia-duoi-500-trieu');
    expect(buildPriceSlug(5000000000, 1000000000000)).toBe('gia-tren-5-ty');
    expect(buildPriceSlug(1000000000, 2000000000)).toBe('gia-tu-1-ty-den-2-ty');
  });
});

describe('Search URL Builder', () => {
  const mockPropertyTypeSlugMap = {
    '12': 'ban-can-ho-chung-cu',
    '13': 'ban-chung-cu-mini-can-ho-dich-vu',
    '14': 'ban-nha-rieng',
  };

  it('builds basic transaction URL', () => {
    const filters: SearchFilters = {
      transactionType: '1',
    };
    expect(buildSearchUrl(filters)).toBe('/mua-ban');
  });

  it('builds single property type URL', () => {
    const filters: SearchFilters = {
      transactionType: '1',
      propertyTypes: '12',
    };
    const url = buildSearchUrl(filters, mockPropertyTypeSlugMap);
    expect(url).toBe('/ban-can-ho-chung-cu');
  });

  it('builds property type + location URL', () => {
    const filters: SearchFilters = {
      transactionType: '1',
      propertyTypes: '12',
      selectedAddresses: 'ha-noi',
    };
    const url = buildSearchUrl(filters, mockPropertyTypeSlugMap);
    expect(url).toBe('/ban-can-ho-chung-cu/ha-noi');
  });

  it('builds predefined price range URL', () => {
    const filters: SearchFilters = {
      transactionType: '1',
      minPrice: '1000000000',
      maxPrice: '2000000000',
    };
    const url = buildSearchUrl(filters);
    expect(url).toBe('/mua-ban/toan-quoc/gia-tu-1-ty-den-2-ty');
  });

  it('builds custom price range with query params', () => {
    const filters: SearchFilters = {
      transactionType: '1',
      selectedAddresses: 'ha-noi',
      minPrice: '1500000000',
      maxPrice: '3200000000',
    };
    const url = buildSearchUrl(filters);
    expect(url).toBe('/mua-ban/ha-noi?gtn=1.5-ty&gcn=3.2-ty');
  });

  it('builds multi-location URL', () => {
    const filters: SearchFilters = {
      transactionType: '1',
      propertyTypes: '12',
      selectedAddresses: 'quan-ba-dinh-thanh-pho-ha-noi,quan-tay-ho,quan-hoan-kiem',
      minPrice: '1000000000',
      maxPrice: '2000000000',
    };
    const url = buildSearchUrl(filters, mockPropertyTypeSlugMap);
    expect(url).toBe('/ban-can-ho-chung-cu/quan-ba-dinh-thanh-pho-ha-noi/gia-tu-1-ty-den-2-ty?addresses=quan-tay-ho,quan-hoan-kiem');
  });

  it('builds full filter URL', () => {
    const filters: SearchFilters = {
      transactionType: '1',
      propertyTypes: '12',
      selectedAddresses: 'quan-ba-dinh-thanh-pho-ha-noi,quan-tay-ho,quan-hoan-kiem',
      minPrice: '1000000000',
      maxPrice: '2000000000',
      minArea: '50',
      maxArea: '80',
      radius: '10',
      bathrooms: '2',
      bedrooms: '3',
    };
    const url = buildSearchUrl(filters, mockPropertyTypeSlugMap);
    expect(url).toContain('/ban-can-ho-chung-cu/quan-ba-dinh-thanh-pho-ha-noi/gia-tu-1-ty-den-2-ty');
    expect(url).toContain('addresses=quan-tay-ho,quan-hoan-kiem');
    expect(url).toContain('radius=10');
    expect(url).toContain('bathrooms=2');
    expect(url).toContain('bedrooms=3');
    expect(url).toContain('dtnn=50');
    expect(url).toContain('dtcn=80');
  });

  it('builds multiple property types URL', () => {
    const filters: SearchFilters = {
      transactionType: '1',
      propertyTypes: '12,13,14',
      selectedAddresses: 'ha-noi',
    };
    const url = buildSearchUrl(filters);
    expect(url).toBe('/mua-ban/ha-noi?property_types=12,13,14');
  });

  it('handles negotiable price', () => {
    const filters: SearchFilters = {
      transactionType: '1',
      minPrice: '0',
      maxPrice: '0',
    };
    const url = buildSearchUrl(filters);
    expect(url).toBe('/mua-ban/toan-quoc/gia-thuong-luong');
  });

  it('handles under price', () => {
    const filters: SearchFilters = {
      transactionType: '2',
      minPrice: '0',
      maxPrice: '5000000',
    };
    const url = buildSearchUrl(filters);
    expect(url).toBe('/cho-thue/toan-quoc/gia-duoi-5-trieu');
  });

  it('handles over price', () => {
    const filters: SearchFilters = {
      transactionType: '1',
      minPrice: '60000000000',
      maxPrice: '1000000000000',
    };
    const url = buildSearchUrl(filters);
    expect(url).toBe('/mua-ban/toan-quoc/gia-tren-60-ty');
  });
});
```

### 2. Manual Testing Checklist

**Hero Search Bar:**

- [ ] Basic search (no filters) → `/mua-ban`
- [ ] With location → `/mua-ban/ha-noi`
- [ ] Single property type → `/ban-can-ho-chung-cu`
- [ ] Property type + location → `/ban-can-ho-chung-cu/ha-noi`
- [ ] Predefined price → `/mua-ban/toan-quoc/gia-tu-1-ty-den-2-ty`
- [ ] Custom price → `/mua-ban?gtn=1.5-ty&gcn=3.2-ty`
- [ ] With area → `/mua-ban?dtnn=50&dtcn=100`
- [ ] All filters → Complete URL with all params

**Listing Page Search:**

- [ ] Update price → URL path changes
- [ ] Update area → Query param added
- [ ] Change property type → URL path changes
- [ ] Add keyword → `street_name` param added
- [ ] Preserve existing filters → All params maintained

**Multi-Location:**

- [ ] Single location → URL path only
- [ ] Multiple locations → First in path, rest in `addresses`
- [ ] Display "Đã chọn X địa điểm"
- [ ] Select All / Clear All works

**Transaction Type:**

- [ ] Mua bán (1) → `/mua-ban` or property type slug
- [ ] Cho thuê (2) → `/cho-thue` or property type slug
- [ ] Dự án (3) → `/du-an`

### 3. URL Backward Compatibility

Test that existing v2 URLs still work:

**Current v2 URLs:**

- `/mua-ban?gtn=1000000000&gcn=2000000000`
- `/cho-thue?city=ha-noi`
- `/mua-ban?property_types=12,13`

**Should redirect/normalize to:**

- `/mua-ban/toan-quoc/gia-tu-1-ty-den-2-ty`
- `/cho-thue/ha-noi`
- `/mua-ban?property_types=12,13`

### 4. Cross-Browser Testing

Test on:

- [ ] Chrome (Windows)
- [ ] Firefox (Windows)
- [ ] Edge (Windows)
- [ ] Safari (macOS)
- [ ] Mobile browsers (iOS Safari, Chrome Android)

### 5. v1 URL Comparison

Compare v2 generated URLs with v1 for same filters:

**Test Matrix:**

| Filters | v1 URL | v2 URL | Match? |
|---------|--------|--------|--------|
| Basic search | `/mua-ban` | `/mua-ban` | ✅ |
| + Location | `/mua-ban/ha-noi` | `/mua-ban/ha-noi` | ✅ |
| + Single property type | `/ban-can-ho-chung-cu/ha-noi` | ? | ? |
| + Price range | `/ban-can-ho-chung-cu/ha-noi/gia-tu-1-ty-den-2-ty` | ? | ? |
| + Area | `/ban-can-ho-chung-cu/ha-noi/gia-tu-1-ty-den-2-ty?dtnn=50&dtcn=80` | ? | ? |
| + Multi-location | `/ban-can-ho-chung-cu/quan-ba-dinh?addresses=quan-tay-ho,quan-hoan-kiem` | ? | ? |
| + All filters | Full URL | ? | ? |

### 6. Performance Testing

**URL Building Speed:**

```typescript
describe('Performance', () => {
  it('builds URL in < 10ms', () => {
    const start = performance.now();

    for (let i = 0; i < 1000; i++) {
      buildSearchUrl({
        transactionType: '1',
        propertyTypes: '12',
        selectedAddresses: 'ha-noi',
        minPrice: '1000000000',
        maxPrice: '2000000000',
      });
    }

    const end = performance.now();
    const avgTime = (end - start) / 1000;

    expect(avgTime).toBeLessThan(10); // Less than 10ms per URL
  });
});
```

### 7. Edge Cases

- [ ] Empty filters → `/mua-ban`
- [ ] Invalid price range (min > max) → Fallback behavior
- [ ] Location "toan-quoc" → Not in URL path if no price
- [ ] Price 0-0 (negotiable) → `/gia-thuong-luong`
- [ ] Very large area (>1000m²) → Correct param
- [ ] Special characters in keyword → URL encoded
- [ ] Comma in addresses param → Not encoded

## Bug Tracking

**Create GitHub Issues for:**

1. URL mismatch between v1 and v2
2. Missing query params
3. Incorrect price slug format
4. Multi-location not working
5. Filter state not preserved

## Documentation

**Update:**

- `docs/url-structure.md` - Document URL format
- `README.md` - Note search URL changes
- API documentation - Update search endpoint

## Success Criteria

- ✅ All automated tests pass
- ✅ Manual test checklist 100% complete
- ✅ v1/v2 URL comparison 100% match
- ✅ No regressions in existing functionality
- ✅ Performance benchmarks met
- ✅ Cross-browser compatibility verified

## Rollback Plan

If critical issues found:

1. Revert URL builder integration
2. Use feature flag to toggle old/new behavior
3. Fix issues in separate branch
4. Re-test before merge

## Acceptance Criteria

**User can:**

- Search with single/multiple locations
- Use predefined or custom price ranges
- Select single or multiple property types
- Apply area, room, radius filters
- Get SEO-friendly URLs matching v1

**System generates:**

- v1-compatible URL format
- Correct price slugs
- Proper multi-location URLs
- All query params preserved
- No broken deep links
