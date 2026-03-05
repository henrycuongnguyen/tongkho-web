# Brainstorm Report: Property Type URL Structure Fix

**Date:** 2026-03-05 10:14
**Type:** URL Structure Inconsistency
**Status:** Solution Agreed
**Work Context:** d:\worktrees\tongkho-web-feature-menu

---

## PROBLEM STATEMENT

**User Report:**
When selecting property types in listing page horizontal search bar, URLs are inconsistent with v1 logic:

- **Current v2 (WRONG):** `/mua-ban/ha-noi?property_types=12` (always uses query param)
- **Expected v1 (CORRECT):**
  - Single type: `/ban-can-ho-chung-cu/ha-noi` (use property type slug)
  - Multiple types: `/mua-ban/ha-noi?property_types=12,13` (use query param)

---

## ROOT CAUSE ANALYSIS

### Technical Investigation

**Scout Report Findings:**
- Found 23 files handling property type URLs
- 2 different URL building patterns in codebase
- Inconsistent checkbox attributes across components

### Root Causes Identified

1. **horizontal-search-bar.astro doesn't use buildSearchUrl()**
   - Lines 1769-1849: Manual URL building
   - Always adds `property_types` as query param
   - Bypasses slug mapping logic from search-url-builder.ts

2. **Missing data-slug attributes on checkboxes**
   - Line 268: Checkboxes only have `value={type.id}`
   - Missing `data-slug={type.slug}` attribute
   - Compare with sidebar dropdown (has `data-type-slug` attribute)

3. **Manual URL building duplicates logic**
   - Lines 1797-1821: Path building
   - Lines 1824-1849: Query param building
   - Violates DRY principle
   - Doesn't implement single-type-to-slug conversion

### Comparison: Working vs Broken

**✓ WORKING - Hero Search (hero-search.astro:106,205)**
```typescript
// Imports buildSearchUrl
import { buildSearchUrl, buildPropertyTypeSlugMap } from '@/utils/listing-url-parser';

// Builds property type slug map from checkboxes with data-slug
const propertyTypeSlugMap = buildPropertyTypeSlugMap();

// Uses buildSearchUrl with slug map
const url = buildSearchUrl(filters, propertyTypeSlugMap);
```

**✗ BROKEN - Horizontal Search Bar (horizontal-search-bar.astro:1769-1849)**
```typescript
// Manual URL building - no slug conversion
const urlParts: string[] = [baseUrl.replace(/^\//, '')];

// Always adds property_types as query param
if (selectedPropertyTypeIds.length > 0) {
  queryParts.push(`property_types=${selectedPropertyTypeIds.join(',')}`);
}
```

**✓ WORKING - Search URL Builder (search-url-builder.ts:101-125)**
```typescript
// Check if single property type selected - use its slug
if (propertyTypes) {
  const propertyTypeIds = propertyTypes.split(',');
  if (propertyTypeIds.length === 1) {
    const slug = getPropertyTypeSlug(propertyTypeIds[0], propertyTypeSlugMap);
    if (slug) {
      urlArg1 = slug; // ← Uses property type slug
    }
  }
}

// Fallback to transaction type
if (!urlArg1) {
  urlArg1 = transactionType === '3' ? 'du-an' :
            transactionType === '2' ? 'cho-thue' : 'mua-ban';

  if (propertyTypes) {
    params.property_types = propertyTypes; // ← Only adds query param for multiple types
  }
}
```

---

## EVALUATED APPROACHES

### Approach 1: Reuse buildSearchUrl() ✅ RECOMMENDED

**Description:**
- Import and use existing `buildSearchUrl()` from search-url-builder.ts
- Add `data-slug` attributes to checkboxes
- Build propertyTypeSlugMap from DOM
- Replace manual URL building logic

**Pros:**
- ✅ Follows DRY principle - reuses existing v1-compatible logic
- ✅ Consistent with hero-search implementation
- ✅ Already tested and working in hero-search.astro
- ✅ Easier to maintain - single source of truth
- ✅ Handles edge cases (price slugs, multi-location, etc.)
- ✅ Future-proof - updates to buildSearchUrl benefit all components

**Cons:**
- Requires modifying checkbox rendering
- Needs to add slug data to property types
- Must import and call additional functions

**Implementation Effort:** Medium (2-3 hours)

**Files to Modify:**
1. `horizontal-search-bar.astro` (add data-slug, import buildSearchUrl, replace URL logic)
2. Property type service (ensure slugs are provided)

### Approach 2: Implement Logic Inline ❌ NOT RECOMMENDED

**Description:**
- Add conditional logic in horizontal-search-bar.astro
- Check if single property type selected
- Get slug and build URL inline

**Pros:**
- Self-contained solution
- No external dependencies

**Cons:**
- ❌ Violates DRY principle - duplicates existing logic
- ❌ Harder to maintain - two places to update
- ❌ Inconsistent with hero-search implementation
- ❌ More complex - need to handle all edge cases
- ❌ Missing v1 reference logic (price slug conversion, etc.)
- ❌ Risk of divergence between components

**Implementation Effort:** High (4-5 hours)

**Files to Modify:**
1. `horizontal-search-bar.astro` (add data-slug, implement full URL logic)
2. Property type service (ensure slugs are provided)

---

## RECOMMENDED SOLUTION

**Approach 1: Reuse buildSearchUrl()**

### Implementation Plan

#### Phase 1: Prepare Property Type Data
**File:** Check property type service returns slugs

```typescript
// Verify property types have slug field
interface PropertyType {
  id: number;
  title: string;
  slug: string; // ← Required for slug mapping
  transactionType: number;
}
```

#### Phase 2: Update Horizontal Search Bar Checkboxes
**File:** `horizontal-search-bar.astro:254-272`

**Before:**
```astro
<input
  type="checkbox"
  class="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
  value={type.id}
  checked={isChecked}
  data-property-type-checkbox
/>
```

**After:**
```astro
<input
  type="checkbox"
  class="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500 widget-type"
  value={type.id}
  checked={isChecked}
  data-property-type-checkbox
  data-slug={type.slug}
/>
```

**Changes:**
1. Add `widget-type` class (required by buildPropertyTypeSlugMap selector)
2. Add `data-slug={type.slug}` attribute

#### Phase 3: Import Required Functions
**File:** `horizontal-search-bar.astro` (top of script section)

```typescript
import {
  buildSearchUrl,
  buildPropertyTypeSlugMap
} from '@/services/url/search-url-builder';
```

#### Phase 4: Replace URL Building Logic
**File:** `horizontal-search-bar.astro:1769-1849`

**Before (Manual URL Building):**
```typescript
searchSubmit?.addEventListener('click', () => {
  // Read property types
  selectedPropertyTypeIds = Array.from(propertyTypeCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  // Manual URL building (100+ lines)
  const urlParts: string[] = [baseUrl.replace(/^\//, '')];
  // ... complex manual logic ...
  window.location.href = targetUrl;
});
```

**After (Using buildSearchUrl):**
```typescript
searchSubmit?.addEventListener('click', () => {
  // Read property types
  selectedPropertyTypeIds = Array.from(propertyTypeCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  // Build property type slug map from checkboxes
  const propertyTypeSlugMap = buildPropertyTypeSlugMap();

  // Get current filter values
  const prices = getPriceValues();
  const areaInput = container?.querySelector('[name="area"]') as HTMLInputElement;
  const [minArea, maxArea] = areaInput?.value ? areaInput.value.split('-') : ['', ''];

  // Build location addresses
  const provinceSlug = searchBar?.getAttribute('data-current-province-slug') || '';
  const selectedAddresses = [
    provinceSlug,
    ...selectedDistricts.map(d => d.slug)
  ].filter(Boolean).join(',');

  // Build filters object
  const filters = {
    transaction_type: baseUrl.includes('cho-thue') ? '2' :
                     baseUrl.includes('du-an') ? '3' : '1',
    selected_addresses: selectedAddresses,
    property_types: selectedPropertyTypeIds.join(','),
    min_price: prices.min ? String(Number(prices.min) * 1000000) : '',
    max_price: prices.max ? String(Number(prices.max) * 1000000) : '',
    min_area: minArea || '',
    max_area: maxArea || '',
    radius: selectedRadius || '',
    bathrooms: selectedBathrooms || '',
    bedrooms: selectedBedrooms || '',
    street_name: districtSearchInput?.value.trim() || '',
  };

  // Build URL using v1-compatible builder
  const url = buildSearchUrl(filters, propertyTypeSlugMap);

  // Navigate
  window.location.href = url;
});
```

**Key Changes:**
1. Call `buildPropertyTypeSlugMap()` to extract slugs from checkboxes
2. Build filters object matching SearchFilters type
3. Call `buildSearchUrl(filters, propertyTypeSlugMap)`
4. Remove 80+ lines of manual URL building logic

---

## IMPLEMENTATION CHECKLIST

- [ ] **Step 1:** Verify property type service returns slugs
  - Check `getPropertyTypesByTransaction()` includes slug field
  - Update SQL query if needed

- [ ] **Step 2:** Update horizontal-search-bar.astro checkboxes
  - Add `widget-type` class to line 265
  - Add `data-slug={type.slug}` attribute to line 268
  - Verify type.slug is available in template

- [ ] **Step 3:** Import functions in horizontal-search-bar.astro
  - Add import statement at top of script section
  - Import buildSearchUrl and buildPropertyTypeSlugMap

- [ ] **Step 4:** Replace URL building logic
  - Replace lines 1770-1849 with buildSearchUrl call
  - Build filters object from current selections
  - Convert price from triệu to actual numbers
  - Pass propertyTypeSlugMap to buildSearchUrl

- [ ] **Step 5:** Test single property type selection
  - Select 1 property type → URL should use slug (e.g., `/ban-can-ho-chung-cu/ha-noi`)
  - Verify no `property_types` query param

- [ ] **Step 6:** Test multiple property types selection
  - Select 2+ property types → URL should use transaction slug + query param
  - Example: `/mua-ban/ha-noi?property_types=12,13`

- [ ] **Step 7:** Test edge cases
  - No property type selected → transaction slug only
  - Property type + price → slug + price-slug + no query param
  - Property type + multiple districts → addresses param
  - Property type + radius + bedrooms → all params preserved

- [ ] **Step 8:** Review other components
  - Check if sidebar-filter-service.ts needs update
  - Verify hero-search.astro still works
  - Test property-type-dropdown.astro compatibility

---

## SUCCESS CRITERIA

**Functional Requirements:**
1. ✅ Single property type → Uses property type slug in URL path
2. ✅ Multiple property types → Uses transaction slug + property_types query param
3. ✅ All other filters (price, area, location, etc.) work correctly
4. ✅ URL format matches v1 exactly
5. ✅ Backward compatible with existing URLs

**Technical Requirements:**
1. ✅ Reuses buildSearchUrl() - no code duplication
2. ✅ Checkboxes have data-slug attributes
3. ✅ Property type slug map built from DOM
4. ✅ Consistent with hero-search implementation
5. ✅ No breaking changes to URL parser

**Test Cases:**

| Selection | Expected URL |
|-----------|--------------|
| 1 property type (ID=12) | `/ban-can-ho-chung-cu/ha-noi` |
| 2 property types (12,13) | `/mua-ban/ha-noi?property_types=12,13` |
| 1 type + price 1-2 tỷ | `/ban-can-ho-chung-cu/ha-noi/gia-tu-1-ty-den-2-ty` |
| 1 type + districts | `/ban-can-ho-chung-cu/ha-noi?addresses=quan-hoan-kiem,quan-ba-dinh` |
| 1 type + bedrooms | `/ban-can-ho-chung-cu/ha-noi?bedrooms=3` |
| 2 types + all filters | `/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty?property_types=12,13&addresses=quan-hoan-kiem&bedrooms=3&dtnn=50&dtcn=80` |

---

## RISK ASSESSMENT

### Low Risk
- ✅ buildSearchUrl() already tested in hero-search
- ✅ No changes to URL parser or router
- ✅ Only affects URL building in horizontal search bar

### Medium Risk
- ⚠️ Property type data must include slug field
- ⚠️ Checkbox rendering depends on type.slug availability
- ⚠️ buildPropertyTypeSlugMap() uses `.widget-type` class selector

### Mitigation Strategies
1. **Verify property type data structure** before implementation
2. **Add fallback** if slug missing: `data-slug={type.slug || type.title.toLowerCase()}`
3. **Test thoroughly** with different property type combinations
4. **Monitor** for console errors about missing slugs

---

## SECURITY CONSIDERATIONS

- ✅ No XSS risk - uses existing URL building logic
- ✅ No SQL injection - property type IDs validated
- ✅ No auth issues - client-side URL building only
- ✅ Slug validation - handled by buildSearchUrl()

---

## NEXT STEPS

**Decision Point:**
Do you want to proceed with implementation using Approach 1 (Reuse buildSearchUrl)?

**If YES:**
- I will create a detailed implementation plan
- Break down into phases with specific file changes
- Execute implementation with testing

**If NO:**
- Discuss alternative approaches
- Clarify concerns or requirements
- Refine solution based on feedback

---

## UNRESOLVED QUESTIONS

1. **Should sidebar property type filter links also use single-type slug URLs?**
   - Current: `/mua-ban/ha-noi?property_types=12`
   - Proposed: `/ban-can-ho-chung-cu/ha-noi`
   - Impact: sidebar-filter-service.ts would need update

2. **Are there any performance concerns with building slug map on every search?**
   - buildPropertyTypeSlugMap() queries DOM for all checkboxes
   - Could cache the map in window object for reuse

3. **Should we update all components to use buildSearchUrl() consistently?**
   - Currently only hero-search uses it
   - Sidebar dropdown uses custom event handlers
   - Listing filter uses PropertyTypeDropdown component

---

## CONCLUSION

**Recommended Solution:** Approach 1 - Reuse buildSearchUrl()

**Rationale:**
- Follows DRY principle
- Reuses tested v1-compatible logic
- Consistent with existing hero-search implementation
- Easier to maintain long-term
- Handles all edge cases correctly

**Implementation Effort:** Medium (2-3 hours)

**Risk Level:** Low-Medium

**Impact:** High - fixes critical URL inconsistency with v1

**Ready to proceed with implementation?**
