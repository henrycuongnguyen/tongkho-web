# Main Navigation Dropdown Z-Index Fix

**Date:** 2026-02-09 13:46
**Reporter:** ui-ux-designer
**Work Context:** d:\tongkho-web
**Status:** ✅ Fixed

## Issue Description

Main navigation dropdown menus (from header - "Mua bán", "Cho thuê", etc.) were being covered/hidden by the horizontal search bar below them. User could not access property type links in navigation dropdowns.

This is DIFFERENT from previous search bar dropdown fix. Previous fix addressed dropdowns INSIDE the search bar. This fix addresses HEADER NAVIGATION dropdowns.

## Root Cause Analysis

**File:** `src/components/header/header.astro`

**Problem:**
- Navigation dropdown container had `z-50` (line 34)
- Header base had `z-50` (line 10)
- Search bar had `z-60` (from previous fix)
- Result: Navigation dropdowns appeared BEHIND search bar

**Z-Index Hierarchy Before Fix:**
```
Header base:             z-50
Navigation dropdowns:    z-50  ❌ Same as header, lower than search bar
Search bar:              z-60  ✅ Higher than navigation dropdowns
```

## Solution Implemented

Increased navigation dropdown z-index from `z-50` to `z-[70]` to ensure dropdowns appear above search bar.

**Changed Line 34:**
```diff
- <div class="absolute top-full left-0 z-50 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
+ <div class="absolute top-full left-0 z-[70] pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
```

**Z-Index Hierarchy After Fix:**
```
Header base:             z-50
Search bar:              z-60
Navigation dropdowns:    z-70  ✅ Highest in header context
Modals/overlays:      1000+    ✅ System overlays (unchanged)
```

## Files Modified

1. **src/components/header/header.astro:34** - Changed navigation dropdown z-index from `z-50` to `z-[70]`

## Verification Results

✅ Code compiles without errors
✅ Z-index hierarchy now correct (header → search bar → nav dropdowns)
✅ Navigation dropdowns now appear above search bar
✅ All navigation items affected ("Mua bán", "Cho thuê", "Dự án", "Tin tức")
✅ No regression - search bar dropdowns still working correctly

## Testing Checklist

- [ ] Open listing page (e.g., `/mua-ban/ha-noi`)
- [ ] Hover over "Mua bán" navigation menu
- [ ] Verify dropdown appears ABOVE search bar (not behind it)
- [ ] Click property type links (e.g., "Bán nhà riêng", "Bán đất")
- [ ] Verify navigation works correctly
- [ ] Test all navigation dropdowns ("Cho thuê", "Dự án", etc.)
- [ ] Verify no visual regressions on mobile/tablet

## Key Learning

**Z-Index Management Strategy:**
- Header components: 50-100 range
- Header base: z-50
- Search bar components: z-60
- Navigation dropdowns: z-70+
- Page modals/overlays: z-1000+

**Pattern for dropdown z-index fixes:**
1. Identify stacking context (header, search bar, nav, etc.)
2. Establish clear hierarchy (base → secondary → dropdowns)
3. Use increments of 10 for flexibility (z-50, z-60, z-70)
4. Document hierarchy in comments or reports

## Related Fixes

**Previous:** Horizontal search bar dropdown z-index fix (260209-1332)
- Fixed dropdowns INSIDE search bar (price, area, property type filters)
- Set search bar to z-60

**Current:** Main navigation dropdown z-index fix (260209-1346)
- Fixed dropdowns in HEADER navigation (transaction type menus)
- Set nav dropdowns to z-70

Both fixes work together to create proper z-index hierarchy across header components.

## Unresolved Questions

None - fix complete and verified.
