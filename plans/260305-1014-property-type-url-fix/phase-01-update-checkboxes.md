# Phase 1: Update Property Type Checkboxes

## Status
✅ **Complete**

## Priority
**High** - Foundational change required for Phase 2

## Overview
Add `data-slug` attributes to property type checkboxes in horizontal search bar so `buildPropertyTypeSlugMap()` can extract slug mappings from DOM.

## Context

**Current State:**
```astro
<!-- horizontal-search-bar.astro:263-269 -->
<input
  type="checkbox"
  class="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
  value={type.id}
  checked={isChecked}
  data-property-type-checkbox
/>
```

**Missing:**
- `widget-type` class (required by `buildPropertyTypeSlugMap()` selector)
- `data-slug` attribute (stores property type slug for URL building)

**Reference Implementation (Works Correctly):**
```astro
<!-- property-type-dropdown.astro:84-89 -->
<input
  type="checkbox"
  class="peer sr-only widget-type"
  value={type.value}
  data-slug={type.dataSlug}
/>
```

## Requirements

**Property Type Data Structure:**
- Property type service already provides `dataSlug` field (verified in property-type-service.ts:18)
- Example: `type.dataSlug = "ban-can-ho-chung-cu"` for ID 12

**DOM Selector Requirement:**
- `buildPropertyTypeSlugMap()` uses `.widget-type input` selector (search-url-builder.ts:30)
- Checkboxes MUST have `widget-type` class to be discovered

## Implementation Steps

### Step 1: Locate Checkbox Rendering

**File:** `src/components/listing/horizontal-search-bar.astro`
**Lines:** 254-272

### Step 2: Add `widget-type` Class

**Before (Line 265):**
```astro
class="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
```

**After:**
```astro
class="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500 widget-type"
```

**Rationale:** Required for `buildPropertyTypeSlugMap()` to find checkboxes via `.widget-type input` selector.

### Step 3: Add `data-slug` Attribute

**Before (Line 268):**
```astro
<input
  type="checkbox"
  class="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500 widget-type"
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

**Note:** Use `type.slug` (NOT `type.dataSlug`) because horizontal-search-bar uses different property type interface.

### Step 4: Verify Property Type Data

**Check where property types are fetched:**
```astro
<!-- Find property type fetch in horizontal-search-bar.astro -->
const propertyTypes = await getPropertyTypesByTransaction(currentFilters.transactionType);
```

**Verify `slug` field is available:**
- Check property-type-service.ts interface (line 10-19)
- Confirm `slug` is returned in query results (line 49-50)
- Already verified: ✅ `slug: row.slug || ""` exists

## Related Code Files

**Modified:**
- `src/components/listing/horizontal-search-bar.astro:265,268`

**Referenced (Read-Only):**
- `src/services/property-type-service.ts` - Provides slug data
- `src/services/url/search-url-builder.ts:30` - Uses `.widget-type` selector

## Success Criteria

- ✅ Checkboxes have `widget-type` class (VERIFIED)
- ✅ Checkboxes have `data-slug` attribute with property type slug (VERIFIED)
- ✅ `buildPropertyTypeSlugMap()` can extract slug mappings from DOM (VERIFIED)
- ✅ No TypeScript compilation errors (BUILD PASSED)
- ✅ No visual changes to UI (VERIFIED)

## Testing

**Manual Verification:**
1. Open listing page (e.g., `/mua-ban/ha-noi`)
2. Open browser DevTools → Elements tab
3. Inspect property type checkbox
4. Verify attributes:
   ```html
   <input
     type="checkbox"
     class="... widget-type"
     value="12"
     data-slug="ban-can-ho-chung-cu"
     data-property-type-checkbox
   />
   ```

**Console Test:**
```javascript
// Run in browser console
const slugMap = buildPropertyTypeSlugMap();
console.log(slugMap); // Should show: { "12": "ban-can-ho-chung-cu", "13": "ban-nha-rieng", ... }
```

## Risk Assessment

**Low Risk:**
- ✅ Additive changes only (no removals)
- ✅ No changes to JavaScript logic
- ✅ No impact on existing functionality
- ✅ Property type data already includes slug field

## Next Steps

After completion → Proceed to [Phase 2: Integrate buildSearchUrl](./phase-02-integrate-buildSearchUrl.md)
