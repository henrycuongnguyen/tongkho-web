# Price/Area Filter URL v1 Format Fix

**Date:** 2026-02-08 09:09
**Status:** ✅ Completed

## Issue

Filter URLs were using query parameter format instead of v1 SEO-friendly slug format:
- ❌ Current: `/mua-ban?gtn=1&gcn=2` (query params only)
- ✅ Expected: `/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty` (location + price slug)

## Root Cause

The "Apply filters" button in [listing-filter.astro](d:\tongkho-web\src\components\listing\listing-filter.astro) was building URLs manually with query parameters, losing:
1. Location context from current URL path
2. v1-compatible price slug format (gia-tu-X-den-Y)

## Solution

### File Modified
[src/components/listing/listing-filter.astro](d:\tongkho-web\src\components\listing\listing-filter.astro#L275-L360)

### Changes Made

1. **Extract Location from Current Path**
   ```javascript
   const pathParts = currentPath.split('/').filter(Boolean);
   const locationSlug = pathParts.length > 1 ? pathParts[1] : null;
   ```

2. **Build URL with v1 Structure**
   ```javascript
   const urlParts: string[] = [baseUrl.replace(/^\//, '')];

   // Calculate price slug first
   let priceSlug = '';
   if (selectedPrice) {
     priceSlug = buildPriceSlug(minPriceTrieu, maxPriceTrieu);
   }

   // Add location (required if price slug exists)
   // If no specific location but has price filter, use "toan-quoc"
   if (locationSlug && locationSlug !== 'toan-quoc') {
     urlParts.push(locationSlug);
   } else if (priceSlug) {
     urlParts.push('toan-quoc');
   }

   // Add price slug (arg3 position)
   if (priceSlug) {
     urlParts.push(priceSlug);
   }

   let targetUrl = '/' + urlParts.join('/');
   ```

3. **Convert Price Values to Slugs**
   - Input from slider: "1000-2000" (in triệu units)
   - Conversion logic:
     - `1000 triệu` → `1-ty` (1 billion)
     - `500 triệu` → `500-trieu` (500 million)
   - Slug patterns:
     - Range: `gia-tu-1-ty-den-2-ty`
     - Below: `gia-duoi-500-trieu`
     - Above: `gia-tren-5-ty`

4. **Keep Other Filters as Query Params**
   - Area (dtnn, dtcn)
   - Property types (property_types)
   - Bedrooms/bathrooms

## URL Structure

```
/[transaction]/[location?]/[price-slug?]?[other-filters]
```

### Examples

| Scenario | Input | Output URL |
|----------|-------|------------|
| No location + Price | `/mua-ban` + 1-2 tỷ | `/mua-ban/toan-quoc/gia-tu-1-ty-den-2-ty` |
| Toan quoc + Price | `/mua-ban/toan-quoc` + 800tr-1tỷ | `/mua-ban/toan-quoc/gia-tu-800-trieu-den-1-ty` |
| Location + Price | `/mua-ban/ha-noi` + 1-2 tỷ | `/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty` |
| Location + Price + Area | `/mua-ban/ha-noi` + 500tr-1tỷ + 50-100m² | `/mua-ban/ha-noi/gia-tu-500-trieu-den-1-ty?dtnn=50&dtcn=100` |
| Below X | `/mua-ban` + < 500 triệu | `/mua-ban/toan-quoc/gia-duoi-500-trieu` |
| Above X | `/mua-ban` + > 5 tỷ | `/mua-ban/toan-quoc/gia-tren-5-ty` |
| With Property Types | `/cho-thue/ha-noi` + 1-2 tỷ + types | `/cho-thue/ha-noi/gia-tu-1-ty-den-2-ty?property_types=12,13` |

## Compatibility

- ✅ Matches v1 URL format from `listing-url-parser.ts`
- ✅ Compatible with ElasticSearch ID system (uses nId strings)
- ✅ Preserves location context during filter application
- ✅ Works with multi-location selection (first location in path, others in `addresses` param)
- ✅ SEO-friendly slugs for price ranges

## Test Cases Verified

1. ✅ Base URL + price filter generates correct slug
2. ✅ Location URL + price filter preserves location
3. ✅ Price slug formats correctly for all ranges (below/above/between)
4. ✅ Other filters (area, types, rooms) remain in query params
5. ✅ Triệu unit conversion works (1000 → 1-ty, 500 → 500-trieu)

## Related Files

- [listing-url-parser.ts](d:\tongkho-web\src\utils\listing-url-parser.ts) - URL parsing logic (unchanged, already supports v1)
- [range-slider-dropdown.astro](d:\tongkho-web\src\components\ui\range-slider-dropdown.astro) - Outputs values in triệu units
- [location-selector.astro](d:\tongkho-web\src\components\listing\sidebar\location-selector.astro) - Location navigation (unchanged)

## Notes

- Area filters intentionally kept in query params (not URL slugs) per v1 design
- Price slug only generated when values differ from defaults (not full range)
- Helper functions duplicated in client script (cannot import TypeScript utils in Astro inline script)
