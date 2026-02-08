# Debug Report: Infinite Loading on Category Page

**Date:** 2026-02-08
**Branch:** listing72
**Issue:** Category page continuously reloading/loading
**Severity:** High

---

## Executive Summary

**Root Cause:** Clear Filters button triggers navigation to current path, causing infinite page reload when user is already on base URL with no filters.

**Impact:**
- Users cannot use listing pages (/mua-ban, /cho-thue, /du-an)
- Page becomes unusable due to continuous reloading
- Affects all transaction types (buy/rent/project)

**Immediate Fix:** Prevent navigation when currentPath equals current URL

---

## Root Cause Analysis

### Primary Issue: Infinite Navigation Loop

**File:** `src/components/listing/listing-filter.astro`
**Lines:** 302-305

```javascript
// Clear filters button
const clearBtn = container.querySelector('[data-clear-filters]');
clearBtn?.addEventListener('click', () => {
  window.location.href = currentPath;  // LINE 304: BUG HERE
});
```

**Problem Pattern:**
1. User visits `/mua-ban` (no filters)
2. Clear filters button still shows because filters exist in UI state
3. User clicks "Clear Filters"
4. Code executes `window.location.href = currentPath` where `currentPath = "/mua-ban"`
5. Browser navigates to same URL → page reloads
6. On page load, filter state is reset but clear button may still be visible
7. If any script/event auto-clicks clear button → loop continues

**Evidence:**
- Line 184-196: Clear button renders when ANY filter values exist in currentFilters prop
- Line 204: currentPath is read from data attribute
- Line 87 in `[...slug].astro`: currentPath set to `url.pathname`
- No check prevents navigation when already on target URL

---

## Secondary Issues

### Issue 2: Clear Button Visibility Logic

**File:** `src/components/listing/listing-filter.astro`
**Lines:** 184-196

```astro
{(currentFilters.propertyTypes?.length || currentFilters.minPrice ||
  currentFilters.maxPrice || currentFilters.minArea || currentFilters.maxArea ||
  currentFilters.bedrooms || currentFilters.bathrooms) && (
  <button type="button" data-clear-filters>
    Xóa bộ lọc
  </button>
)}
```

**Problem:**
- Button shows based on server-side filter state from URL
- Client-side filter state may differ from URL state
- User may see clear button when no URL filters exist
- Clicking clear button navigates to same URL → reload loop

---

### Issue 3: HTMX District Loading Trigger

**File:** `src/components/listing/sidebar/location-selector.astro`
**Line:** 87

```astro
hx-trigger={selectedProvince ? 'load' : undefined}
```

**Problem:**
- `hx-trigger="load"` fires immediately on page load
- If district API returns HTML containing another `hx-trigger="load"` element → infinite loop
- No error handling for failed API requests
- May contribute to loading spinner continuously appearing

---

## Code Locations

### Critical Files

1. **src/components/listing/listing-filter.astro**
   - Line 304: `window.location.href = currentPath` (primary bug)
   - Lines 184-196: Clear button visibility condition
   - Lines 202-306: Client-side filter state management

2. **src/components/listing/sidebar/location-selector.astro**
   - Line 87: `hx-trigger="load"` (secondary issue)
   - Lines 142-195: Province selection handler with HTMX ajax calls
   - Lines 176-189: Manual HTMX ajax invocation

3. **src/pages/[...slug].astro**
   - Line 87: `currentPath={url.pathname}` passed to filter component
   - Lines 28-30: URL validation and 404 redirect
   - Lines 54-56: ElasticSearch query execution

4. **src/pages/api/location/districts.ts**
   - Lines 17-52: District API endpoint returning HTML
   - No recursive HTML generation detected

---

## Technical Analysis

### Navigation Flow

```
User visits /mua-ban
↓
ListingFilter component renders
↓
currentPath = "/mua-ban"
↓
Clear button visible (currentFilters has stale data)
↓
User clicks "Clear Filters"
↓
window.location.href = "/mua-ban"
↓
Browser reloads current page
↓
[LOOP CONTINUES IF AUTO-TRIGGERED]
```

### HTMX Loading Flow

```
Page loads with selectedProvince
↓
District panel renders with hx-trigger="load"
↓
HTMX fires GET /api/location/districts?province=X
↓
API returns HTML with links
↓
HTML inserted into panel
↓
[No infinite loop detected in HTML response]
```

---

## Recommended Fixes

### Fix 1: Prevent Same-URL Navigation (CRITICAL)

**File:** `src/components/listing/listing-filter.astro`
**Lines:** 302-305

**Current Code:**
```javascript
clearBtn?.addEventListener('click', () => {
  window.location.href = currentPath;
});
```

**Recommended Fix:**
```javascript
clearBtn?.addEventListener('click', () => {
  // Check if already on target URL
  const currentUrl = window.location.pathname + window.location.search;
  const targetUrl = currentPath;

  if (currentUrl !== targetUrl) {
    window.location.href = targetUrl;
  } else {
    // Already on base URL with no filters - just reset UI state
    // Reset all filter buttons to inactive state
    selectedPropertyTypes = [];
    selectedBedrooms = '';
    selectedBathrooms = '';

    // Reset UI
    propertyTypeBtns.forEach(btn => {
      btn.dataset.active = 'false';
      btn.classList.remove('bg-primary-500', 'text-white', 'border-primary-500');
      btn.classList.add('bg-white', 'text-secondary-600', 'border-secondary-200');
    });

    roomBtns.forEach(btn => {
      btn.dataset.active = 'false';
      btn.classList.remove('bg-primary-500', 'text-white', 'border-primary-500');
      btn.classList.add('bg-white', 'text-secondary-600', 'border-secondary-200');
    });

    // Reset range inputs
    const priceInput = container.querySelector('[name="price"]') as HTMLInputElement;
    const areaInput = container.querySelector('[name="area"]') as HTMLInputElement;
    if (priceInput) priceInput.value = '';
    if (areaInput) areaInput.value = '';
  }
});
```

---

### Fix 2: Improve Clear Button Visibility Logic

**File:** `src/components/listing/listing-filter.astro`
**Lines:** 184-196

**Current Condition:**
```astro
{(currentFilters.propertyTypes?.length || currentFilters.minPrice || ...)
```

**Recommended Fix:**
Add client-side toggle using `x-show` (Alpine.js) or manual JS:

```javascript
// Add to script section
function updateClearButtonVisibility() {
  const hasActiveFilters =
    selectedPropertyTypes.length > 0 ||
    selectedBedrooms !== '' ||
    selectedBathrooms !== '' ||
    (priceInput?.value || '') !== '' ||
    (areaInput?.value || '') !== '';

  if (clearBtn) {
    clearBtn.style.display = hasActiveFilters ? 'flex' : 'none';
  }
}

// Call after each filter change
propertyTypeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // ... existing code ...
    updateClearButtonVisibility();
  });
});
```

---

### Fix 3: Add Error Handling to HTMX District Loading

**File:** `src/components/listing/sidebar/location-selector.astro`
**Lines:** 86-90

**Current Code:**
```astro
<div data-district-panel
  hx-get={...}
  hx-trigger={selectedProvince ? 'load' : undefined}
  hx-swap="innerHTML">
```

**Recommended Fix:**
```astro
<div data-district-panel
  hx-get={...}
  hx-trigger={selectedProvince ? 'load once' : undefined}
  hx-swap="innerHTML"
  hx-on:htmx:after-request="this.classList.remove('htmx-loading')"
  hx-on:htmx:response-error="this.innerHTML='<span class=\'text-red-500 text-sm\'>Lỗi tải dữ liệu</span>'">
```

**Key Changes:**
- `load once` instead of `load` prevents repeated triggers
- Added error handler for failed requests
- Added cleanup after request completes

---

## Prevention Measures

### 1. Add Navigation Guards
Create utility function to prevent same-URL navigation:

```typescript
// src/utils/navigation.ts
export function safeNavigate(url: string): void {
  const current = window.location.pathname + window.location.search;
  if (current !== url) {
    window.location.href = url;
  }
}
```

### 2. Add Debugging Logs
Temporarily add console logs to track reload triggers:

```javascript
clearBtn?.addEventListener('click', () => {
  console.log('[FILTER] Clear clicked', {
    currentPath,
    currentUrl: window.location.href,
    willNavigate: window.location.pathname !== currentPath
  });
  // ... existing code
});
```

### 3. Add Monitoring
Track page reload frequency in browser console:

```javascript
// Add to base layout
if (performance.navigation.type === 1) {
  console.warn('[DEBUG] Page reloaded', {
    url: window.location.href,
    timestamp: new Date().toISOString()
  });
}
```

---

## Testing Checklist

- [ ] Visit /mua-ban with no filters
- [ ] Verify clear button is hidden or disabled
- [ ] Click clear button (if visible) - should not reload
- [ ] Apply filters via UI
- [ ] Verify clear button appears
- [ ] Click clear button - should navigate to /mua-ban once
- [ ] Select province from dropdown
- [ ] Verify districts load once (not repeatedly)
- [ ] Check browser console for errors
- [ ] Test with network throttling (slow 3G)
- [ ] Verify no console warnings about HTMX errors

---

## Related Code Files

### Supporting Services
- `src/services/elasticsearch/property-search-service.ts` - Property search logic
- `src/services/location/location-service.ts` - Province/district data fetching
- `src/utils/listing-url-parser.ts` - URL parsing and building logic

### API Endpoints
- `src/pages/api/location/search.ts` - Location autocomplete API
- `src/pages/api/location/districts.ts` - District cascade API

---

## Success Criteria

1. ✅ Page does not reload when clicking clear filters on base URL
2. ✅ Clear button only visible when active filters exist
3. ✅ District panel loads once per province selection
4. ✅ No console errors related to navigation or HTMX
5. ✅ User can navigate through filters smoothly without unexpected reloads

---

## Risk Assessment

### High Risk
- Same-URL navigation causing infinite loops
- Users unable to use listing pages at all

### Medium Risk
- HTMX trigger firing multiple times
- Clear button showing when no filters active

### Low Risk
- Performance degradation from repeated API calls
- Browser console clutter from debug logs

---

## Security Considerations

- All user input properly escaped in API responses (verified in `api/location/districts.ts`)
- No XSS vulnerabilities in HTML generation
- HTMX attributes not exposed to injection attacks
- URL parsing validates transaction types before processing

---

## Unresolved Questions

1. Is clear button being auto-clicked by any script or browser extension?
2. Are there analytics scripts tracking clicks that might trigger events?
3. Does HTMX have global event listeners causing side effects?
4. Is there caching behavior causing stale filter state?
5. Are there any A/B testing scripts interfering with navigation?
