# Sidebar Filter Cards v1 Format Fix

**Date:** 2026-02-08 09:17
**Status:** ✅ Completed

## Issue

Sidebar filter cards (price and area) were using query parameter format instead of v1 SEO-friendly URL structure:
- ❌ Price filter: `/mua-ban/ha-noi?gtn=1&gcn=2` (query params only)
- ❌ Clear buttons removed ALL query params, not just their own filters

## Root Cause

1. **Price Range Filter Card:** Built URLs with query params only (`gtn`, `gcn`), not using price slugs
2. **Area Range Filter Card:** Correctly used query params, but clear button removed all params
3. Both lost location context and didn't follow v1 URL structure

## Solution

### Files Modified

1. [src/components/listing/sidebar/price-range-filter-card.astro](d:\tongkho-web\src\components\listing\sidebar\price-range-filter-card.astro)
2. [src/components/listing/sidebar/area-range-filter-card.astro](d:\tongkho-web\src\components\listing\sidebar\area-range-filter-card.astro)

### Changes Made

#### 1. Price Range Filter Card

**Build URL with v1 Format:**
```javascript
function getRangeUrl(range: typeof PRICE_RANGES[0]): string {
  // Extract path parts
  const pathParts = Astro.url.pathname.split('/').filter(Boolean);
  const transactionType = pathParts[0] || 'mua-ban';
  let locationSlug = pathParts.length > 1 ? pathParts[1] : null;

  // Build price slug
  const priceSlug = buildPriceSlug(range.min, range.max);

  // Build URL: /[transaction]/[location or toan-quoc]/[price-slug]
  const urlParts = [transactionType];

  if (locationSlug && locationSlug !== 'toan-quoc' && !locationSlug.startsWith('gia-')) {
    urlParts.push(locationSlug);
  } else {
    urlParts.push('toan-quoc');
  }

  urlParts.push(priceSlug);

  // Preserve other query params
  const params = new URLSearchParams(Astro.url.search);
  params.delete('gtn');
  params.delete('gcn');
  params.delete('page');

  const query = params.toString();
  const basePath = '/' + urlParts.join('/');
  return query ? `${basePath}?${query}` : basePath;
}
```

**Clear Price Filter:**
```javascript
function getClearPriceUrl(): string {
  const pathParts = Astro.url.pathname.split('/').filter(Boolean);
  const urlParts: string[] = [];

  // Keep transaction and location, remove price slug
  if (pathParts[0]) {
    urlParts.push(pathParts[0]);
  }

  if (pathParts.length > 1 && !pathParts[1].startsWith('gia-')) {
    urlParts.push(pathParts[1]);
  }

  // Preserve other query params
  const params = new URLSearchParams(Astro.url.search);
  params.delete('gtn');
  params.delete('gcn');
  params.delete('page');

  const query = params.toString();
  const basePath = urlParts.length > 0 ? '/' + urlParts.join('/') : '/';
  return query ? `${basePath}?${query}` : basePath;
}
```

#### 2. Area Range Filter Card

**Clear Area Filter (Fixed):**
```javascript
function getClearAreaUrl(): string {
  const params = new URLSearchParams(Astro.url.search);
  params.delete('dtnn');
  params.delete('dtcn');
  params.delete('page');
  const query = params.toString();
  return query ? `${Astro.url.pathname}?${query}` : Astro.url.pathname;
}
```

## URL Examples

### Price Range Filter

| Scenario | Input | Output URL |
|----------|-------|------------|
| No location + price | Select "1 - 2 tỷ" on `/mua-ban` | `/mua-ban/toan-quoc/gia-tu-1-ty-den-2-ty` |
| Location + price | Select "500 - 800 triệu" on `/mua-ban/ha-noi` | `/mua-ban/ha-noi/gia-tu-500-trieu-den-800-trieu` |
| Clear price | Click "Xóa bộ lọc giá" on above | `/mua-ban/ha-noi` |
| Price + area | Select "1 - 2 tỷ" on `/mua-ban/ha-noi?dtnn=50&dtcn=100` | `/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty?dtnn=50&dtcn=100` |

### Area Range Filter

| Scenario | Input | Output URL |
|----------|-------|------------|
| Location + area | Select "50 - 80 m²" on `/mua-ban/ha-noi` | `/mua-ban/ha-noi?dtnn=50&dtcn=80` |
| Price + area | Select "100 - 150 m²" on `/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty` | `/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty?dtnn=100&dtcn=150` |
| Clear area | Click "Xóa bộ lọc diện tích" on above | `/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty` (keeps price) |
| Area + types | Select "30 - 50 m²" on `/mua-ban?property_types=12` | `/mua-ban?dtnn=30&dtcn=50&property_types=12` (keeps types) |

## Key Behaviors

### Price Filter
- ✅ Uses v1 URL slug format in path (arg3 position)
- ✅ Adds "toan-quoc" when no location selected
- ✅ Preserves location context from URL
- ✅ Keeps other query params (area, property types, etc.)
- ✅ Clear button removes only price slug, keeps location and other params

### Area Filter
- ✅ Uses query params (dtnn, dtcn) per v1 design
- ✅ Preserves URL path (location, price slug)
- ✅ Keeps other query params (property types, etc.)
- ✅ Clear button removes only area params, keeps everything else

## Compatibility

- ✅ Matches v1 URL format from `listing-url-parser.ts`
- ✅ Compatible with main filter component (listing-filter.astro)
- ✅ Works with ElasticSearch ID system (uses nId strings)
- ✅ SEO-friendly price slugs in URL path
- ✅ Independent filter clearing (doesn't affect other filters)

## Related Fixes

- [update-260208-0909-price-area-filter-url-v1-format.md](d:\tongkho-web\plans\reports\update-260208-0909-price-area-filter-url-v1-format.md) - Main filter component fix
- Both main filter and sidebar filters now use consistent v1 URL structure
