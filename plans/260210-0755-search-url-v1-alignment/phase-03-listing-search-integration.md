# Phase 3: Listing Search Integration

**Priority:** High
**Status:** Pending
**Depends On:** Phase 1

## Context

Update listing page horizontal search bar to use new URL builder and preserve filters correctly.

**Current Implementation:** `src/components/listing/horizontal-search-bar.astro` (1,327 lines)
- Search submit (lines 1268-1307) builds: `/mua-ban?keyword=...&property_types=...&gtn=...&gcn=...`
- Uses query params for price instead of slugs
- Doesn't extract location from current URL
- Partial v1 alignment

**Key Difference from Hero Search:**
- Listing search bar starts with existing filters from URL
- Must preserve current context (location, price range, etc.)
- Should update URL instead of completely rebuilding

## Current Issues

1. **Lines 1268-1307:** Search submit handler
   - Uses `gtn/gcn` query params instead of price slugs
   - Doesn't extract location slug from current URL
   - Base URL is just transaction type

2. **Missing context extraction:**
   - Current location not parsed from URL path
   - Current price range not extracted
   - Filter updates don't maintain URL structure

## Implementation Steps

### 1. Extract Current Context from URL

Add utility to parse current page URL and extract filters:

```typescript
/**
 * Extract current search context from URL
 */
function getCurrentSearchContext(): Partial<SearchFilters> {
  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);

  // Parse URL path
  const parts = pathname.split('/').filter(p => p);

  // Default context
  const context: Partial<SearchFilters> = {
    transactionType: '1',
    propertyTypes: '',
    selectedAddresses: '',
    minPrice: '',
    maxPrice: '',
    minArea: '',
    maxArea: '',
  };

  // Parse arg0 (transaction or property type)
  if (parts.length > 0) {
    const arg0 = parts[0];

    // Check if it's a property type slug
    const propertyTypeMap = buildPropertyTypeSlugMap();
    const reverseMap = Object.fromEntries(
      Object.entries(propertyTypeMap).map(([id, slug]) => [slug, id])
    );

    if (reverseMap[arg0]) {
      // It's a property type slug
      context.propertyTypes = reverseMap[arg0];
      // Infer transaction type from slug prefix
      if (arg0.startsWith('ban-')) {
        context.transactionType = '1';
      } else if (arg0.startsWith('cho-thue-')) {
        context.transactionType = '2';
      } else {
        context.transactionType = '3';
      }
    } else {
      // It's a transaction type slug
      if (arg0 === 'cho-thue') {
        context.transactionType = '2';
      } else if (arg0 === 'du-an') {
        context.transactionType = '3';
      } else {
        context.transactionType = '1';
      }
    }
  }

  // Parse arg1 (location)
  if (parts.length > 1 && parts[1] !== 'toan-quoc') {
    context.selectedAddresses = parts[1];
  }

  // Parse arg2 (price slug)
  if (parts.length > 2) {
    // TODO: Parse price slug back to min/max values
    // This is complex, may need reverse lookup
  }

  // Parse query params
  if (searchParams.has('addresses')) {
    const addresses = searchParams.get('addresses') || '';
    if (context.selectedAddresses) {
      context.selectedAddresses += ',' + addresses;
    } else {
      context.selectedAddresses = addresses;
    }
  }

  if (searchParams.has('property_types')) {
    context.propertyTypes = searchParams.get('property_types') || '';
  }

  if (searchParams.has('dtnn')) {
    context.minArea = searchParams.get('dtnn') || '';
  }

  if (searchParams.has('dtcn')) {
    context.maxArea = searchParams.get('dtcn') || '';
  }

  if (searchParams.has('gtn')) {
    // Parse price slug to number
    context.minPrice = parsePriceSlugToNumber(searchParams.get('gtn') || '');
  }

  if (searchParams.has('gcn')) {
    context.maxPrice = parsePriceSlugToNumber(searchParams.get('gcn') || '');
  }

  return context;
}

/**
 * Parse price slug to number
 * Examples: "1.5-ty" → 1500000000, "500-trieu" → 500000000
 */
function parsePriceSlugToNumber(slug: string): number {
  if (!slug) return 0;

  if (slug.endsWith('-ty')) {
    const value = parseFloat(slug.replace('-ty', ''));
    return value * 1000000000;
  } else if (slug.endsWith('-trieu')) {
    const value = parseFloat(slug.replace('-trieu', ''));
    return value * 1000000;
  }

  return 0;
}
```

### 2. Update Search Submit Handler

**Replace lines 1268-1307:**

```typescript
document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.querySelector('.horizontal-search-form');
  if (!searchForm) return;

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get current context from URL
    const currentContext = getCurrentSearchContext();

    // Get form values
    const keywordInput = searchForm.querySelector<HTMLInputElement>('input[name="keyword"]');
    const propertyTypeSelect = searchForm.querySelector<HTMLSelectElement>('select[name="property_types"]');
    const minPriceInput = searchForm.querySelector<HTMLInputElement>('input[name="min_price"]');
    const maxPriceInput = searchForm.querySelector<HTMLInputElement>('input[name="max_price"]');
    const minAreaInput = searchForm.querySelector<HTMLInputElement>('input[name="min_area"]');
    const maxAreaInput = searchForm.querySelector<HTMLInputElement>('input[name="max_area"]');

    // Build search filters
    const filters: SearchFilters = {
      transactionType: currentContext.transactionType || '1',
      propertyTypes: propertyTypeSelect?.value || currentContext.propertyTypes || '',
      selectedAddresses: currentContext.selectedAddresses || '', // Keep current location
      minPrice: minPriceInput?.value || currentContext.minPrice || '',
      maxPrice: maxPriceInput?.value || currentContext.maxPrice || '',
      minArea: minAreaInput?.value || currentContext.minArea || '',
      maxArea: maxAreaInput?.value || currentContext.maxArea || '',
    };

    // Add keyword as street_name if provided
    if (keywordInput?.value) {
      filters.streetName = keywordInput.value;
    }

    // Build URL
    const propertyTypeSlugMap = buildPropertyTypeSlugMap();
    const url = buildSearchUrl(filters, propertyTypeSlugMap);

    // Navigate
    window.location.href = url;
  });
});
```

### 3. Update Filter Change Handlers

When filters change (price, area, property type), should rebuild URL:

```typescript
// Price filter change
document.querySelectorAll('.price-filter').forEach(filter => {
  filter.addEventListener('change', () => {
    const currentContext = getCurrentSearchContext();
    const newMinPrice = /* get from filter */;
    const newMaxPrice = /* get from filter */;

    const filters: SearchFilters = {
      ...currentContext,
      minPrice: newMinPrice,
      maxPrice: newMaxPrice,
    };

    const url = buildSearchUrl(filters, buildPropertyTypeSlugMap());
    window.location.href = url;
  });
});

// Similar for area, property type, etc.
```

### 4. Preserve Other Query Params

Ensure `sort`, `radius`, `bathrooms`, `bedrooms` are preserved:

```typescript
function getCurrentSearchContext(): Partial<SearchFilters> {
  // ... existing code ...

  // Add other params
  if (searchParams.has('radius')) {
    context.radius = searchParams.get('radius') || '';
  }

  if (searchParams.has('bathrooms')) {
    context.bathrooms = searchParams.get('bathrooms') || '';
  }

  if (searchParams.has('bedrooms')) {
    context.bedrooms = searchParams.get('bedrooms') || '';
  }

  if (searchParams.has('sort')) {
    context.sort = searchParams.get('sort') || '';
  }

  return context;
}
```

## Testing

### Manual Test Cases

1. **Update price on listing page:**
   - Start: `/mua-ban/ha-noi`
   - Change price to 1-2 tỷ
   - Expected: `/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty`

2. **Update area:**
   - Start: `/ban-can-ho-chung-cu/ba-dinh/gia-tu-1-ty-den-2-ty`
   - Set area 50-100m²
   - Expected: `/ban-can-ho-chung-cu/ba-dinh/gia-tu-1-ty-den-2-ty?dtnn=50&dtcn=100`

3. **Change property type:**
   - Start: `/mua-ban/ha-noi`
   - Select "Bán căn hộ chung cư"
   - Expected: `/ban-can-ho-chung-cu/ha-noi`

4. **Add keyword:**
   - Start: `/mua-ban/ha-noi`
   - Enter "Nguyễn Huệ"
   - Expected: `/mua-ban/ha-noi?street_name=Nguyễn Huệ`

5. **Preserve filters:**
   - Start: `/ban-can-ho-chung-cu/ba-dinh/gia-tu-1-ty-den-2-ty?dtnn=50&bathrooms=2`
   - Change area to 60-120m²
   - Expected: `/ban-can-ho-chung-cu/ba-dinh/gia-tu-1-ty-den-2-ty?dtnn=60&dtcn=120&bathrooms=2`

## Files to Modify

- `src/components/listing/horizontal-search-bar.astro` - Search submit handler
- `src/components/listing/sidebar/price-range-filter-card.astro` - Price filter
- `src/components/listing/sidebar/area-range-filter-card.astro` - Area filter

## Success Criteria

- ✅ Search maintains current URL structure
- ✅ Filter updates rebuild URL correctly
- ✅ Location context preserved
- ✅ Price slugs used for predefined ranges
- ✅ All query params preserved
- ✅ No breaking changes to existing filters

## Next Phase

Phase 4: Add multi-location selection UI
