# Phase 1: URL Builder Service

**Priority:** High
**Status:** Pending
**Depends On:** None

## Context

Create centralized service to build search URLs matching v1 format. This service will be used by all search components (hero, listing, filters).

**v1 Reference:** `reference/resaland_v1/static/js/module/search-url-builder.js`

## v1 URL Structure

```
/[arg1]/[arg2]/[arg3]?[query-params]
```

**Arg1 - Property Type Slug OR Transaction Type:**
- **Priority 1:** Single property type selected → use its slug (e.g., `ban-can-ho-chung-cu`)
- **Priority 2:** Otherwise → transaction type slug (`mua-ban`, `cho-thue`, `du-an`)
- **Multiple types:** Use transaction slug + `property_types=12,13` query param

**Arg2 - Location:**
- Single location → location slug
- Multiple locations → first location slug, rest in `addresses` param
- No location + price slug → `toan-quoc`

**Arg3 - Price Slug:**
- Predefined range → slug (e.g., `gia-tu-1-ty-den-2-ty`)
- Custom range → `gtn/gcn` query params
- Patterns:
  - `0-0` → `gia-thuong-luong`
  - `0-max` → `gia-duoi-{max}`
  - `min-∞` → `gia-tren-{min}`
  - `min-max` → `gia-tu-{min}-den-{max}`

**Query Params:**
- `addresses` - Additional locations (comma-separated)
- `property_types` - Multiple property type IDs
- `radius` - Search radius (km)
- `bathrooms`, `bedrooms` - Room counts
- `dtnn`, `dtcn` - Area range (m²)
- `gtn`, `gcn` - Custom price (slug format)
- `sort` - Sort order
- `street_name` - Street filter
- `is_verified` - Verified only

## Implementation Steps

### 1. Create Type Definitions

**File:** `src/types/search-filters.ts`

```typescript
export interface SearchFilters {
  transactionType: '1' | '2' | '3'; // 1=buy, 2=rent, 3=project
  propertyTypes?: string; // Comma-separated IDs
  selectedAddresses?: string; // Comma-separated location slugs
  minPrice?: string | number;
  maxPrice?: string | number;
  minArea?: string | number;
  maxArea?: string | number;
  radius?: string | number;
  bathrooms?: string | number;
  bedrooms?: string | number;
  sort?: string;
  streetName?: string;
  isVerified?: boolean;
}

export interface PropertyTypeSlugMap {
  [typeId: string]: string; // e.g., "12": "ban-can-ho-chung-cu"
}
```

### 2. Create Price Conversion Utilities

**File:** `src/services/url/price-slug-converter.ts`

```typescript
/**
 * Predefined price ranges by transaction type
 * Matches v1: PRICE_FILTERS constant
 */
export const PRICE_FILTERS: Record<string, string[]> = {
  '1': [ // Buy
    '800000000-1000000000', '1000000000-2000000000', '2000000000-3000000000',
    '3000000000-5000000000', '5000000000-7000000000', '7000000000-10000000000',
    '10000000000-20000000000', '20000000000-30000000000', '30000000000-40000000000',
    '40000000000-60000000000', '60000000000-1000000000000', '0-0'
  ],
  '2': [ // Rent
    '0-1000000', '1000000-3000000', '3000000-5000000', '5000000-10000000',
    '10000000-40000000', '40000000-70000000', '70000000-100000000',
    '100000000-1000000000000', '0-0'
  ],
  '3': [ // Project
    '10000000-20000000', '20000000-35000000', '35000000-50000000',
    '50000000-80000000', '80000000-1000000000000'
  ]
};

const MAX_PRICE = 1000000000000; // 1 trillion (unlimited)

/**
 * Convert price to slug format
 * Examples: 1500000000 → "1.5-ty", 500000000 → "500-trieu"
 */
export function convertPriceToSlug(price: string | number): string {
  const priceNum = parseInt(String(price)) || 0;

  if (priceNum >= 1000000000) {
    const tyValue = priceNum / 1000000000;
    const formatted = tyValue.toFixed(2).replace(/\.?0+$/, '');
    return `${formatted}-ty`;
  } else if (priceNum >= 1000000) {
    const trieuValue = priceNum / 1000000;
    const formatted = trieuValue.toFixed(2).replace(/\.?0+$/, '');
    return `${formatted}-trieu`;
  } else {
    const trieuValue = priceNum / 1000000;
    const formatted = trieuValue.toFixed(2).replace(/\.?0+$/, '');
    return `${formatted}-trieu`;
  }
}

/**
 * Check if price range matches predefined option
 */
export function isAPriceOption(
  transactionType: string,
  minPrice: string | number,
  maxPrice: string | number
): boolean {
  const typeId = String(transactionType || '1');
  const filters = PRICE_FILTERS[typeId] || PRICE_FILTERS['1'];

  const min = (minPrice === null || minPrice === '') ? 0 : parseInt(String(minPrice));
  const max = (maxPrice === null || maxPrice === '') ? MAX_PRICE : parseInt(String(maxPrice));

  const combine = `${min}-${max}`;
  return filters.includes(combine);
}

/**
 * Build price slug from min/max
 * Returns empty string if invalid range
 */
export function buildPriceSlug(
  minPrice: string | number,
  maxPrice: string | number
): string {
  const min = parseInt(String(minPrice)) || 0;
  const max = parseInt(String(maxPrice)) || 0;

  // Negotiable
  if (min === 0 && max === 0) {
    return 'gia-thuong-luong';
  }

  // Under max price
  if (min === 0 && max > 0 && max !== MAX_PRICE) {
    return `gia-duoi-${convertPriceToSlug(max)}`;
  }

  // Over min price
  if (min > 0 && max === MAX_PRICE && min < max) {
    return `gia-tren-${convertPriceToSlug(min)}`;
  }

  // Range
  if (min > 0 && max < MAX_PRICE && min < max) {
    return `gia-tu-${convertPriceToSlug(min)}-den-${convertPriceToSlug(max)}`;
  }

  return '';
}
```

### 3. Create URL Builder Service

**File:** `src/services/url/search-url-builder.ts`

```typescript
import type { SearchFilters, PropertyTypeSlugMap } from '@/types/search-filters';
import { buildPriceSlug, isAPriceOption, convertPriceToSlug } from './price-slug-converter';

/**
 * Build search URL matching v1 format
 * Reference: reference/resaland_v1/static/js/module/search-url-builder.js
 */
export function buildSearchUrl(
  filters: SearchFilters,
  propertyTypeSlugMap: PropertyTypeSlugMap = {}
): string {
  const {
    transactionType = '1',
    propertyTypes = '',
    selectedAddresses = '',
    minPrice = '',
    maxPrice = '',
    minArea = '',
    maxArea = '',
    radius = '',
    bathrooms = '',
    bedrooms = '',
    sort = '',
    streetName = '',
    isVerified = false,
  } = filters;

  const args: string[] = [];
  const params: Record<string, string> = {};

  // ARG1: Property type slug OR transaction type
  let urlArg1 = '';

  if (propertyTypes) {
    const typeIds = propertyTypes.split(',');
    if (typeIds.length === 1) {
      const slug = getPropertyTypeSlug(typeIds[0], propertyTypeSlugMap);
      if (slug) {
        urlArg1 = slug;
      }
    }
  }

  // Fallback to transaction type
  if (!urlArg1) {
    if (transactionType === '3') {
      urlArg1 = 'du-an';
    } else if (transactionType === '2') {
      urlArg1 = 'cho-thue';
    } else {
      urlArg1 = 'mua-ban';
    }

    if (propertyTypes) {
      params.property_types = propertyTypes;
    }
  }

  args.push(urlArg1);

  // ARG2: Location
  let urlArg2 = '';
  if (selectedAddresses) {
    const addressList = selectedAddresses.split(',').filter(a => a.trim());
    if (addressList.length === 1) {
      urlArg2 = addressList[0];
    } else if (addressList.length > 1) {
      urlArg2 = addressList[0];
      params.addresses = addressList.slice(1).join(',');
    }
  }

  // ARG3: Price slug
  let urlArg3 = '';
  if (isAPriceOption(transactionType, minPrice, maxPrice)) {
    urlArg3 = buildPriceSlug(minPrice, maxPrice);
  } else {
    // Custom price range - use query params
    const minNum = parseInt(String(minPrice)) || 0;
    const maxNum = parseInt(String(maxPrice)) || 0;

    if (minNum > 0) {
      params.gtn = convertPriceToSlug(minPrice);
    }
    if (maxNum > 0 && maxNum < 1000000000000) {
      params.gcn = convertPriceToSlug(maxPrice);
    }
  }

  // If price slug but no location, use 'toan-quoc'
  if (urlArg3 && !urlArg2) {
    urlArg2 = 'toan-quoc';
  }

  if (urlArg2) args.push(urlArg2);
  if (urlArg3) args.push(urlArg3);

  // Query params
  if (radius) params.radius = String(radius);
  if (bathrooms) params.bathrooms = String(bathrooms);
  if (bedrooms) params.bedrooms = String(bedrooms);
  if (sort && sort !== 'newest') params.sort = sort;
  if (streetName) params.street_name = streetName;
  if (isVerified) params.is_verified = '1';

  // Area params
  const minAreaNum = parseInt(String(minArea)) || 0;
  const maxAreaNum = parseInt(String(maxArea)) || 0;

  if (minAreaNum > 0) {
    params.dtnn = String(minAreaNum);
  }
  if (maxAreaNum > 0 && maxAreaNum < 1000000000000) {
    params.dtcn = String(maxAreaNum);
  }

  // Build URL
  let url = '/' + args.join('/');

  const paramString = Object.entries(params)
    .filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  if (paramString) {
    url += '?' + paramString;
  }

  return url.replace(/%2C/g, ',');
}

/**
 * Get property type slug from ID
 */
function getPropertyTypeSlug(
  propertyTypeId: string,
  slugMap: PropertyTypeSlugMap
): string | null {
  return slugMap[propertyTypeId] || null;
}

/**
 * Build property type slug map from DOM elements
 * Used client-side to extract slugs from checkboxes
 */
export function buildPropertyTypeSlugMap(): PropertyTypeSlugMap {
  const map: PropertyTypeSlugMap = {};

  if (typeof document === 'undefined') return map;

  const checkboxes = document.querySelectorAll<HTMLInputElement>('.widget-type input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    const typeId = checkbox.value;
    const slug = checkbox.dataset.slug;
    if (typeId && slug) {
      map[typeId] = slug;
    }
  });

  return map;
}
```

### 4. Update Existing Parser

**File:** `src/utils/listing-url-parser.ts`

Add export for the new builder:

```typescript
export { buildSearchUrl, buildPropertyTypeSlugMap } from '@/services/url/search-url-builder';
export { convertPriceToSlug, buildPriceSlug } from '@/services/url/price-slug-converter';
```

## Testing

### Test Cases

1. **Single property type + location + predefined price:**
   - Input: type=12, location=ha-noi, price=1B-2B
   - Output: `/ban-can-ho-chung-cu/ha-noi/gia-tu-1-ty-den-2-ty`

2. **Transaction type + multi-location + custom price:**
   - Input: transaction=1, locations=[ba-dinh,tay-ho], price=1.5B-3.2B
   - Output: `/mua-ban/ba-dinh?addresses=tay-ho&gtn=1.5-ty&gcn=3.2-ty`

3. **No location + price:**
   - Input: transaction=1, price=5B+
   - Output: `/mua-ban/toan-quoc/gia-tren-5-ty`

4. **Multiple property types:**
   - Input: types=[12,13,14], location=ha-noi
   - Output: `/mua-ban/ha-noi?property_types=12,13,14`

5. **All filters:**
   - Input: All filters filled
   - Output: `/ban-can-ho-chung-cu/ba-dinh/gia-tu-1-ty-den-2-ty?addresses=tay-ho,hoan-kiem&radius=10&bathrooms=2&bedrooms=3&dtnn=50&dtcn=80`

## Files to Create

- `src/types/search-filters.ts`
- `src/services/url/price-slug-converter.ts`
- `src/services/url/search-url-builder.ts`

## Files to Modify

- `src/utils/listing-url-parser.ts` - Add exports

## Success Criteria

- ✅ URL builder service created
- ✅ Price conversion matches v1 logic
- ✅ All test cases pass
- ✅ TypeScript types defined
- ✅ Exported from listing-url-parser

## Next Phase

Phase 2: Integrate URL builder into hero search component
