# Phase 2: Hero Search Integration

**Priority:** High
**Status:** ✅ Complete
**Depends On:** Phase 1

## Context

Update home page hero search bar to use new URL builder service and generate v1-compatible URLs.

**Current Implementation:** `src/components/home/hero-search.astro` (161 lines)
- Form submission builds: `/mua-ban?q=...&city=...&type=...&price=...&area=...`
- Location selection ignored in URL
- Price values not converted to slugs
- No property type slug support

**Target:** Match v1 behavior from `reference/resaland_v1/views/home/home-search-bar.html`

## Current Issues

1. **Line 142-158:** Search button handler builds incorrect URL
   - Uses only query params
   - Doesn't extract location slug
   - Doesn't build price slug
   - Doesn't use property type slug

2. **Missing client-side script:** No `buildSearchUrl()` function loaded

3. **Property type data:** Checkboxes need `data-slug` attributes

## Implementation Steps

### 1. Add Property Type Slugs to Advanced Filters

**File:** `src/components/home/hero-search.astro` or advanced filters component

Find property type checkboxes and add `data-slug` attributes:

```html
<!-- Example: Apartment checkbox -->
<input
  type="checkbox"
  value="12"
  id="type-12"
  data-slug="ban-can-ho-chung-cu"
>

<!-- Full mapping from v1 -->
<!-- type_id=12 → ban-can-ho-chung-cu -->
<!-- type_id=13 → ban-chung-cu-mini-can-ho-dich-vu -->
<!-- type_id=14 → ban-nha-rieng -->
<!-- type_id=15 → ban-nha-biet-thu-lien-ke -->
<!-- type_id=16 → ban-nha-mat-pho -->
<!-- type_id=17 → ban-shophouse-nha-pho-thuong-mai -->
<!-- type_id=18 → ban-dat-nen-du-an -->
<!-- type_id=19 → ban-trang-trai-khu-nghi-duong -->
<!-- type_id=20 → ban-condotel -->
<!-- type_id=21 → ban-kho-nha-xuong -->
<!-- type_id=22 → ban-loai-bat-dong-san-khac -->
<!-- type_id=46 → ban-dat -->
```

### 2. Load URL Builder Script

Add client-side script imports before search button handler:

```html
<script>
  import { buildSearchUrl, buildPropertyTypeSlugMap } from '@/utils/listing-url-parser';
  import type { SearchFilters } from '@/types/search-filters';

  // Build property type slug map from DOM
  const propertyTypeSlugMap = buildPropertyTypeSlugMap();
</script>
```

### 3. Update Search Button Handler

**Replace lines 142-158** with:

```html
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.querySelector('.action-filter');
    if (!searchButton) return;

    searchButton.addEventListener('click', () => {
      // Get current transaction type
      const activeTab = document.querySelector('.widget-menu-tab .item-title.active');
      const transactionType = activeTab?.dataset.propertyType || '1';

      // Get selected location slug
      const locationSlugInput = document.querySelector('.location-slug-input') as HTMLInputElement;
      const selectedAddresses = locationSlugInput?.value || '';

      // Get selected property types
      const propertyTypeCheckboxes = document.querySelectorAll<HTMLInputElement>(
        '.widget-type input[type="checkbox"]:checked'
      );
      const propertyTypes = Array.from(propertyTypeCheckboxes)
        .map(cb => cb.value)
        .join(',');

      // Get price range
      // TODO: Extract from price slider/dropdown
      // For now, check if predefined option selected
      const priceRadio = document.querySelector<HTMLInputElement>(
        'input[name="price-range"]:checked'
      );
      let minPrice = '';
      let maxPrice = '';

      if (priceRadio) {
        const [min, max] = priceRadio.value.split('-');
        minPrice = min;
        maxPrice = max;
      } else {
        // Get from slider inputs
        const minInput = document.querySelector<HTMLInputElement>('.widget-price input[name="min-value"]');
        const maxInput = document.querySelector<HTMLInputElement>('.widget-price input[name="max-value"]');
        minPrice = minInput?.value || '';
        maxPrice = maxInput?.value || '';
      }

      // Get area range
      const areaRadio = document.querySelector<HTMLInputElement>(
        'input[name="area-range"]:checked'
      );
      let minArea = '';
      let maxArea = '';

      if (areaRadio) {
        const [min, max] = areaRadio.value.split('-');
        minArea = min;
        maxArea = max;
      } else {
        // Get from slider inputs
        const minAreaInput = document.querySelector<HTMLInputElement>('.widget-price input[name="min-value2"]');
        const maxAreaInput = document.querySelector<HTMLInputElement>('.widget-price input[name="max-value2"]');
        minArea = minAreaInput?.value || '';
        maxArea = maxAreaInput?.value || '';
      }

      // Build search filters
      const filters: SearchFilters = {
        transactionType: transactionType as '1' | '2' | '3',
        propertyTypes,
        selectedAddresses,
        minPrice,
        maxPrice,
        minArea,
        maxArea,
      };

      // Build URL using service
      const url = buildSearchUrl(filters, propertyTypeSlugMap);

      // Navigate
      window.location.href = url;
    });
  });
</script>
```

### 4. Handle Transaction Type Tabs

Ensure transaction type tabs update correctly:

```html
<script>
  // Update transaction type on tab click
  document.querySelectorAll('.widget-menu-tab .item-title').forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active from all
      document.querySelectorAll('.widget-menu-tab .item-title').forEach(t => {
        t.classList.remove('active');
      });

      // Add active to clicked
      tab.classList.add('active');

      // Update advanced filters based on transaction type
      // (e.g., change property type options, price ranges)
      const transactionType = tab.dataset.propertyType;
      updateAdvancedFilters(transactionType);
    });
  });

  function updateAdvancedFilters(transactionType: string) {
    // TODO: Load correct property type options for transaction type
    // For buy (1): ban-can-ho-chung-cu, ban-nha-rieng, etc.
    // For rent (2): cho-thue-can-ho-chung-cu, cho-thue-nha-rieng, etc.
    // For project (3): project-specific types
  }
</script>
```

### 5. Update Location Dropdown Integration

Ensure location dropdown sets the slug correctly:

```html
<!-- Location dropdown should update this hidden input -->
<input
  type="hidden"
  class="location-slug-input"
  value=""
  id="location-slug-input"
>
```

When location is selected, update the slug:

```javascript
function onLocationSelected(locationData) {
  const slugInput = document.getElementById('location-slug-input');
  if (slugInput) {
    slugInput.value = locationData.slug;
  }
}
```

## Testing

### Manual Test Cases

1. **Basic search (no filters):**
   - Select "Mua bán" tab
   - Click "Tìm kiếm"
   - Expected: `/mua-ban`

2. **With location:**
   - Select "Mua bán" + "Hà Nội"
   - Expected: `/mua-ban/ha-noi`

3. **With single property type:**
   - Select "Bán căn hộ chung cư"
   - Expected: `/ban-can-ho-chung-cu`

4. **With property type + location:**
   - Select "Bán căn hộ chung cư" + "Hà Nội"
   - Expected: `/ban-can-ho-chung-cu/ha-noi`

5. **With predefined price:**
   - Select price "1 tỷ - 2 tỷ"
   - Expected: `/mua-ban/toan-quoc/gia-tu-1-ty-den-2-ty`

6. **With custom price:**
   - Set slider to 1.5B - 3.2B
   - Expected: `/mua-ban?gtn=1.5-ty&gcn=3.2-ty`

7. **All filters:**
   - Property type + location + price + area
   - Expected: `/ban-can-ho-chung-cu/ha-noi/gia-tu-1-ty-den-2-ty?dtnn=50&dtcn=100`

## Files to Modify

- `src/components/home/hero-search.astro` - Main search bar
- Property type filter component - Add data-slug attributes

## Success Criteria

- ✅ Search button generates v1-compatible URLs
- ✅ Single property type → slug in URL path
- ✅ Multiple property types → query param
- ✅ Location slug extracted correctly
- ✅ Price slugs for predefined ranges
- ✅ Area in query params (dtnn/dtcn)
- ✅ No regression in existing functionality

## Next Phase

Phase 3: Update listing page horizontal search bar
