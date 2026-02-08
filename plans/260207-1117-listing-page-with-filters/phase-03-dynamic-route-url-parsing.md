# Phase 3: Dynamic Route & URL Parsing

## Context
[← Back to Plan](./plan.md)

Implement Astro dynamic route to handle v1 URL pattern: `/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty?property_types=12,13&...`

## Priority
**HIGH** - Core routing functionality

## Status
**Pending**

## Overview
Create `[...slug].astro` to parse complex URL structure and extract filters for ElasticSearch queries.

## URL Pattern Analysis

From v1 `search-url-builder.js`:
```
Pattern: /{transaction}/{location}/{price}?queryParams

Examples:
/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty?property_types=12,13&radius=50&bedrooms=2
/cho-thue/toan-quoc?property_types=14&dtnn=50&dtcn=100
/du-an/ho-chi-minh
/nha-dat/ba-dinh?gtn=2-ty&gcn=5-ty
```

**URL Segments:**
1. **Arg1:** Transaction type OR property type slug
   - `mua-ban` → transaction_type=1
   - `cho-thue` → transaction_type=2
   - `du-an` → transaction_type=3
   - `nha-dat` → property_type slug (lookup ID)

2. **Arg2:** Location slug (province or district)
   - `ha-noi` → province
   - `ba-dinh` → district (need province context)
   - `toan-quoc` → all Vietnam

3. **Arg3:** Price slug (optional)
   - `gia-tu-1-ty-den-2-ty` → minPrice=1000000000, maxPrice=2000000000
   - `gia-thuong-luong` → minPrice=0, maxPrice=0

**Query Params:**
- `property_types=12,13` → multiple property types
- `gtn=2-ty` → minPrice (giá tối thiểu)
- `gcn=5-ty` → maxPrice (giá tối cao)
- `dtnn=50` → minArea
- `dtcn=100` → maxArea
- `bedrooms=2` → số phòng ngủ
- `bathrooms=2` → số phòng tắm
- `radius=50` → bán kính (km)
- `sort=price_asc` → sắp xếp
- `page=2` → trang

## Implementation

### File: `src/pages/[...slug].astro`

```typescript
---
import MainLayout from '@/layouts/main-layout.astro';
import { PropertySearchService } from '@/services/elasticsearch/property-search-service';
import { parseListingUrl } from '@/utils/listing-url-parser';
import type { PropertySearchFilters } from '@/services/elasticsearch/types';

// Get URL params
const { slug } = Astro.params;
const url = new URL(Astro.request.url);
const slugParts = slug?.split('/').filter(Boolean) || [];

// Parse URL to filters
const filters: PropertySearchFilters = parseListingUrl(slugParts, url.searchParams);

// Query ElasticSearch
const searchResult = await PropertySearchService.searchProperties(filters);
const { hits: properties, total, took } = searchResult;

// Build metadata for SEO
const title = buildPageTitle(filters);
const description = buildPageDescription(filters, total);
---

<MainLayout title={title} description={description}>
  <div class="listing-page">
    <!-- Breadcrumb -->
    <Breadcrumb filters={filters} />

    <!-- Filter Section -->
    <FilterSection filters={filters} />

    <!-- Listing Grid -->
    <ListingGrid
      properties={properties}
      total={total}
      filters={filters}
    />

    <!-- Pagination -->
    <Pagination
      currentPage={filters.page || 1}
      totalItems={total}
      itemsPerPage={filters.pageSize || 20}
    />
  </div>
</MainLayout>
```

### File: `src/utils/listing-url-parser.ts`

```typescript
import type { PropertySearchFilters } from '@/services/elasticsearch/types';

// Transaction type mapping
const TRANSACTION_SLUGS: Record<string, number> = {
  'mua-ban': 1,
  'cho-thue': 2,
  'du-an': 3
};

/**
 * Parse listing URL to filters
 */
export function parseListingUrl(
  slugParts: string[],
  searchParams: URLSearchParams
): PropertySearchFilters {

  const filters: PropertySearchFilters = {
    transactionType: 1,  // default
    page: Number(searchParams.get('page')) || 1,
    pageSize: 20,
    sort: (searchParams.get('sort') as any) || 'newest'
  };

  // Parse slug parts
  if (slugParts.length > 0) {
    const arg1 = slugParts[0];

    // Check if transaction type
    if (TRANSACTION_SLUGS[arg1]) {
      filters.transactionType = TRANSACTION_SLUGS[arg1];
    } else {
      // Property type slug - lookup ID from DB/static data
      // TODO: Implement property type lookup
      filters.transactionType = 1; // fallback
    }
  }

  // Parse location (arg2)
  if (slugParts.length > 1) {
    const locationSlug = slugParts[1];
    if (locationSlug !== 'toan-quoc') {
      // TODO: Lookup province/district by slug
      // For now, mock
      filters.provinceIds = [1]; // example
    }
  }

  // Parse price slug (arg3)
  if (slugParts.length > 2) {
    const priceSlug = slugParts[2];
    const priceRange = parsePriceSlug(priceSlug);
    if (priceRange) {
      filters.minPrice = priceRange.min;
      filters.maxPrice = priceRange.max;
    }
  }

  // Parse query params
  const propertyTypes = searchParams.get('property_types');
  if (propertyTypes) {
    filters.propertyTypes = propertyTypes.split(',').map(Number);
  }

  const gtn = searchParams.get('gtn');
  if (gtn) {
    filters.minPrice = convertPriceSlugToNumber(gtn);
  }

  const gcn = searchParams.get('gcn');
  if (gcn) {
    filters.maxPrice = convertPriceSlugToNumber(gcn);
  }

  const dtnn = searchParams.get('dtnn');
  if (dtnn) {
    filters.minArea = Number(dtnn);
  }

  const dtcn = searchParams.get('dtcn');
  if (dtcn) {
    filters.maxArea = Number(dtcn);
  }

  const bedrooms = searchParams.get('bedrooms');
  if (bedrooms) {
    filters.bedrooms = Number(bedrooms);
  }

  const bathrooms = searchParams.get('bathrooms');
  if (bathrooms) {
    filters.bathrooms = Number(bathrooms);
  }

  const radius = searchParams.get('radius');
  if (radius) {
    filters.radius = Number(radius);
  }

  return filters;
}

/**
 * Parse price slug like "gia-tu-1-ty-den-2-ty"
 */
function parsePriceSlug(slug: string): { min: number; max: number } | null {
  // "gia-thuong-luong" → negotiable
  if (slug === 'gia-thuong-luong') {
    return { min: 0, max: 0 };
  }

  // "gia-duoi-1-ty" → below 1 billion
  const belowMatch = slug.match(/^gia-duoi-(.+)$/);
  if (belowMatch) {
    return { min: 0, max: convertPriceSlugToNumber(belowMatch[1]) };
  }

  // "gia-tren-5-ty" → above 5 billion
  const aboveMatch = slug.match(/^gia-tren-(.+)$/);
  if (aboveMatch) {
    return { min: convertPriceSlugToNumber(aboveMatch[1]), max: 1000000000000 };
  }

  // "gia-tu-1-ty-den-2-ty" → range
  const rangeMatch = slug.match(/^gia-tu-(.+)-den-(.+)$/);
  if (rangeMatch) {
    return {
      min: convertPriceSlugToNumber(rangeMatch[1]),
      max: convertPriceSlugToNumber(rangeMatch[2])
    };
  }

  return null;
}

/**
 * Convert price slug to number
 * "1.5-ty" → 1500000000
 * "500-trieu" → 500000000
 */
function convertPriceSlugToNumber(slug: string): number {
  if (slug.endsWith('-ty')) {
    const value = parseFloat(slug.replace('-ty', ''));
    return value * 1000000000; // billion
  }
  if (slug.endsWith('-trieu')) {
    const value = parseFloat(slug.replace('-trieu', ''));
    return value * 1000000; // million
  }
  return 0;
}
```

### File: `src/utils/listing-url-builder.ts`

```typescript
import type { PropertySearchFilters } from '@/services/elasticsearch/types';

/**
 * Build listing URL from filters (reverse of parser)
 */
export function buildListingUrl(filters: PropertySearchFilters): string {
  const parts: string[] = [];

  // Arg1: Transaction type
  const transactionSlug = getTransactionSlug(filters.transactionType);
  parts.push(transactionSlug);

  // Arg2: Location (TODO: lookup slug)
  if (filters.provinceIds?.length) {
    parts.push('ha-noi'); // example
  } else {
    parts.push('toan-quoc');
  }

  // Arg3: Price slug (optional)
  if (filters.minPrice || filters.maxPrice) {
    const priceSlug = buildPriceSlug(filters.minPrice, filters.maxPrice);
    if (priceSlug) {
      parts.push(priceSlug);
    }
  }

  // Build base URL
  let url = '/' + parts.join('/');

  // Add query params
  const params = new URLSearchParams();

  if (filters.propertyTypes?.length) {
    params.set('property_types', filters.propertyTypes.join(','));
  }

  if (filters.minArea) {
    params.set('dtnn', String(filters.minArea));
  }

  if (filters.maxArea) {
    params.set('dtcn', String(filters.maxArea));
  }

  if (filters.bedrooms) {
    params.set('bedrooms', String(filters.bedrooms));
  }

  if (filters.bathrooms) {
    params.set('bathrooms', String(filters.bathrooms));
  }

  if (filters.radius) {
    params.set('radius', String(filters.radius));
  }

  if (filters.sort && filters.sort !== 'newest') {
    params.set('sort', filters.sort);
  }

  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page));
  }

  const queryString = params.toString();
  if (queryString) {
    url += '?' + queryString;
  }

  return url;
}

function getTransactionSlug(type: number): string {
  switch (type) {
    case 2: return 'cho-thue';
    case 3: return 'du-an';
    default: return 'mua-ban';
  }
}

function buildPriceSlug(min?: number, max?: number): string {
  if (min === 0 && max === 0) {
    return 'gia-thuong-luong';
  }

  if (!min && max) {
    return `gia-duoi-${convertNumberToPriceSlug(max)}`;
  }

  if (min && !max) {
    return `gia-tren-${convertNumberToPriceSlug(min)}`;
  }

  if (min && max && min < max) {
    return `gia-tu-${convertNumberToPriceSlug(min)}-den-${convertNumberToPriceSlug(max)}`;
  }

  return '';
}

function convertNumberToPriceSlug(amount: number): string {
  if (amount >= 1000000000) {
    const ty = amount / 1000000000;
    return `${ty.toFixed(1).replace(/\.0$/, '')}-ty`;
  }
  const trieu = amount / 1000000;
  return `${trieu.toFixed(0)}-trieu`;
}
```

## Related Code Files

**To Create:**
- `src/pages/[...slug].astro`
- `src/utils/listing-url-parser.ts`
- `src/utils/listing-url-builder.ts`

**Reference:**
- `resaland_v1/static/js/module/search-url-builder.js` (v1 logic)

## Todo List

- [ ] Create `[...slug].astro` dynamic route
- [ ] Implement `parseListingUrl()` function
- [ ] Implement `buildListingUrl()` function
- [ ] Add property type slug lookup
- [ ] Add location slug lookup
- [ ] Test URL parsing with all combinations
- [ ] Test URL building (reverse)
- [ ] Handle edge cases (invalid URLs)
- [ ] Add URL validation
- [ ] Create URL builder React hook

## Success Criteria

- [ ] All v1 URL patterns parse correctly
- [ ] Query params extracted properly
- [ ] URL builder generates correct URLs
- [ ] 404 for invalid URLs
- [ ] SEO-friendly URLs maintained

## Next Steps

After Phase 3:
→ **Phase 4:** Filter Section UI
→ **Phase 6:** Listing Section & Pagination
