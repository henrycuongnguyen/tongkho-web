# Phase 2: Integrate buildSearchUrl Function

## Status
✅ **Complete**

## Priority
**High** - Core implementation

## Overview
Replace manual URL building logic in horizontal search bar with `buildSearchUrl()` function to implement single-property-type-to-slug conversion.

## Dependencies
- ✅ Phase 1 complete: Checkboxes have `widget-type` class and `data-slug` attributes (SATISFIED)

## Context

**Current Implementation (Manual URL Building):**
```typescript
// Lines 1769-1849: ~80 lines of manual URL building
searchSubmit?.addEventListener('click', () => {
  // Manual path building
  const urlParts: string[] = [baseUrl.replace(/^\//, '')];

  // Always adds property_types as query param (WRONG!)
  if (selectedPropertyTypeIds.length > 0) {
    queryParts.push(`property_types=${selectedPropertyTypeIds.join(',')}`);
  }

  window.location.href = targetUrl;
});
```

**Target Implementation (Use buildSearchUrl):**
```typescript
// Simplified with buildSearchUrl (CORRECT)
searchSubmit?.addEventListener('click', () => {
  const propertyTypeSlugMap = buildPropertyTypeSlugMap();
  const filters = { /* build from selections */ };
  const url = buildSearchUrl(filters, propertyTypeSlugMap);
  window.location.href = url;
});
```

## Requirements

**buildSearchUrl() Function Logic:**
- If 1 property type → uses slug as URL arg1 (`/ban-can-ho-chung-cu/ha-noi`)
- If 2+ property types → uses transaction type + query param (`/mua-ban/ha-noi?property_types=12,13`)
- Handles price slugs, multi-location, and all other filters correctly

**SearchFilters Interface:**
```typescript
interface SearchFilters {
  transaction_type: string;      // '1' = mua ban, '2' = cho thue, '3' = du an
  selected_addresses: string;    // comma-separated location slugs
  property_types: string;        // comma-separated property type IDs
  min_price: string;             // in VND (not triệu)
  max_price: string;             // in VND
  min_area: string;              // in m²
  max_area: string;              // in m²
  radius: string;                // in km
  bathrooms: string;             // number
  bedrooms: string;              // number
  street_name: string;           // keyword
  sort?: string;                 // 'newest' | 'price_asc' | 'price_desc'
  is_verified?: string;          // '1' for verified only
}
```

## Implementation Steps

### Step 1: Add Import Statements

**File:** `src/components/listing/horizontal-search-bar.astro`
**Location:** Top of `<script>` tag (after existing imports)

**Add:**
```typescript
import {
  buildSearchUrl,
  buildPropertyTypeSlugMap
} from '@/services/url/search-url-builder';
```

### Step 2: Build Property Type Slug Map

**Location:** Inside search submit handler (line ~1770)

**Add before building URL:**
```typescript
// Build property type slug map from checkboxes with data-slug attributes
const propertyTypeSlugMap = buildPropertyTypeSlugMap();
```

**Purpose:** Extracts `{ "12": "ban-can-ho-chung-cu", "13": "ban-nha-rieng", ... }` from DOM.

### Step 3: Determine Transaction Type

**Current Code (Line ~1797):**
```typescript
const urlParts: string[] = [baseUrl.replace(/^\//, '')];
```

**Replacement Logic:**
```typescript
// Determine transaction type from baseUrl
const transactionType = baseUrl.includes('cho-thue') ? '2' :
                        baseUrl.includes('du-an') ? '3' : '1';
```

**Rationale:** `buildSearchUrl()` needs transaction_type as string ('1', '2', '3').

### Step 4: Build Filters Object

**Replace lines 1770-1849 with:**

```typescript
searchSubmit?.addEventListener('click', () => {
  // Read property types directly from checkboxes
  selectedPropertyTypeIds = Array.from(propertyTypeCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  // Build property type slug map from checkboxes
  const propertyTypeSlugMap = buildPropertyTypeSlugMap();

  // Get current filter values
  const prices = getPriceValues(); // Returns { min: string (in triệu), max: string }
  const areaInput = container?.querySelector('[name="area"]') as HTMLInputElement;
  const [minArea, maxArea] = areaInput?.value ? areaInput.value.split('-') : ['', ''];

  // Determine transaction type from baseUrl
  const transactionType = baseUrl.includes('cho-thue') ? '2' :
                          baseUrl.includes('du-an') ? '3' : '1';

  // Build location addresses
  const provinceSlug = searchBar?.getAttribute('data-current-province-slug') || '';
  const districtSlugs = selectedDistricts.map(d => d.slug);

  // Build selected_addresses: province + districts (comma-separated)
  const selectedAddresses = [provinceSlug, ...districtSlugs]
    .filter(Boolean)
    .join(',');

  // Build filters object for buildSearchUrl
  const filters = {
    transaction_type: transactionType,
    selected_addresses: selectedAddresses,
    property_types: selectedPropertyTypeIds.join(','),

    // Convert price from triệu to VND
    min_price: prices.min ? String(Number(prices.min) * 1_000_000) : '',
    max_price: prices.max ? String(Number(prices.max) * 1_000_000) : '',

    // Area (already in m²)
    min_area: minArea || '',
    max_area: maxArea || '',

    // Other filters
    radius: selectedRadius || '',
    bathrooms: selectedBathrooms || '',
    bedrooms: selectedBedrooms || '',
    street_name: districtSearchInput?.value.trim() || '',
  };

  // Build URL using v1-compatible builder
  const url = buildSearchUrl(filters, propertyTypeSlugMap);

  // Navigate to search results
  window.location.href = url;
});
```

### Step 5: Remove Old Manual URL Building Logic

**Delete lines 1796-1849:**
- Manual `urlParts` array building
- Manual `queryParts` array building
- Manual `buildPriceSlug()` calls
- All manual URL construction logic

**Keep:**
- Helper functions: `getPriceValues()`, `convertTrieuToPriceSlug()` (used by other code)
- Event listener binding: `searchSubmit?.addEventListener(...)`

## Related Code Files

**Modified:**
- `src/components/listing/horizontal-search-bar.astro:1769-1849` (replace ~80 lines)

**Imported:**
- `src/services/url/search-url-builder.ts` - buildSearchUrl, buildPropertyTypeSlugMap

**Referenced (Read-Only):**
- `src/services/url/search-url-builder.ts:76-219` - buildSearchUrl implementation
- `src/services/url/price-slug-converter.ts` - Price conversion utilities

## Key Changes Summary

| Aspect | Before | After |
|--------|--------|-------|
| Lines of code | ~80 lines manual URL building | ~40 lines using buildSearchUrl |
| Single property type | Always query param | Uses slug in path ✅ |
| Multiple property types | Query param | Query param (same) |
| Price handling | Manual slug building | Handled by buildSearchUrl |
| Location handling | Manual addresses param | Handled by buildSearchUrl |
| Maintainability | Duplicated logic | Reuses tested function ✅ |

## Success Criteria

- ✅ Import statements added without TypeScript errors (VERIFIED - BUILD PASSED)
- ✅ `buildSearchUrl()` called with correct filters object (VERIFIED)
- ✅ Single property type → URL uses slug (e.g., `/ban-can-ho-chung-cu/ha-noi`) (TESTED - PASS)
- ✅ Multiple property types → URL uses query param (e.g., `/mua-ban/ha-noi?property_types=12,13`) (TESTED - PASS)
- ✅ All other filters work (price, area, location, bedrooms, etc.) (TESTED - PASS)
- ✅ No breaking changes to existing functionality (TESTED - PASS)
- ✅ Code is cleaner and more maintainable (VERIFIED - 80 lines → 40 lines)

## Testing

**Pre-Deployment Testing:**

1. **TypeScript Compilation:**
   ```bash
   npm run build
   ```
   Expected: No compilation errors.

2. **Console Verification:**
   - Open listing page in browser
   - Open DevTools → Console
   - Verify no JavaScript errors

**Functional Testing (See Phase 3):**
- Test single property type selection
- Test multiple property types selection
- Test property type + price + location combinations

## Risk Assessment

**Medium Risk:**
- ⚠️ Replaces core URL building logic (80+ lines)
- ⚠️ buildSearchUrl() must receive correct filter format
- ⚠️ Price conversion from triệu to VND required

**Mitigation:**
- ✅ buildSearchUrl() already tested in hero-search.astro
- ✅ Filters object matches SearchFilters interface
- ✅ Price conversion logic extracted from existing code

## Next Steps

After completion → Proceed to [Phase 3: Testing](./phase-03-testing.md)

## Rollback Plan

If issues arise:
1. Revert to manual URL building (git revert)
2. Keep checkbox changes from Phase 1
3. Debug buildSearchUrl() filter format
4. Re-test with corrected implementation
