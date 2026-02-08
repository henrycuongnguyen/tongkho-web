# Code Review Report: Infinite Loading Fixes

**Date**: 2026-02-08 06:49
**Branch**: listing72
**Reviewer**: code-reviewer agent
**Scope**: Same-URL checks to prevent infinite reload loops

---

## Code Review Summary

### Scope
- **Files Changed**: 3 core components
  - `src/components/listing/listing-filter.astro` (lines 303-337)
  - `src/components/listing/sidebar/location-selector.astro` (lines 191-198)
  - `src/pages/[...slug].astro` (line 109)
- **LOC**: ~35 lines modified
- **Focus**: Navigation edge cases, URL comparison logic
- **Scout Findings**: 9 related files with URL/state dependencies

### Overall Assessment

**Confidence Score: 7/10**

The fixes correctly implement same-URL checks to prevent infinite reload loops. Logic is sound for common cases, but several edge cases and potential race conditions exist that could cause issues in production.

**Severity Distribution:**
- Critical: 0
- High: 2
- Medium: 4
- Low: 2

---

## Critical Issues

**None identified** - No security vulnerabilities or breaking changes.

---

## High Priority

### 1. Query Parameter Order Sensitivity

**Location**: All 3 files
**Impact**: Same-URL check can fail when query parameters are in different order

**Problem**:
```javascript
// listing-filter.astro:305
const currentUrl = window.location.pathname + window.location.search;
const targetUrl = currentPath;

if (currentUrl !== targetUrl) { ... }
```

URLs like `?sort=newest&page=2` and `?page=2&sort=newest` are functionally identical but would fail string equality check, causing unnecessary navigation.

**Example Edge Case**:
- User filters: `/mua-ban?property_types=1,2&gtn=1000000`
- Server renders: `/mua-ban?gtn=1000000&property_types=1,2`
- Check fails → navigates unnecessarily

**Fix Recommendation**:
```javascript
function urlsAreEqual(url1: string, url2: string): boolean {
  const parse = (url: string) => {
    const [path, query] = url.split('?');
    const params = new URLSearchParams(query || '');
    params.sort(); // Normalize order
    return `${path}?${params.toString()}`;
  };
  return parse(url1) === parse(url2);
}

if (!urlsAreEqual(currentUrl, targetUrl)) {
  window.location.href = targetUrl;
}
```

---

### 2. HTMX Race Condition with Province Selection

**Location**: `location-selector.astro:193-197`
**Impact**: User can click province reset while district HTMX request is in-flight

**Problem**:
```javascript
// User clicks province → triggers HTMX district fetch
window.htmx.ajax('GET', `/api/location/districts?province=${nId}&base=${baseUrl}`, {
  target: districtPanel,
  swap: 'innerHTML'
});

// User quickly clicks "All Provinces" before districts load
// Same-URL check passes, navigation happens
// But district HTMX request may still complete and update DOM
```

**Edge Case Flow**:
1. User selects "Hanoi" → HTMX fetches districts (200ms latency)
2. User immediately clicks "All Provinces" before districts load
3. Same-URL check passes → navigates to `/mua-ban`
4. HTMX request completes and tries to update already-navigated page

**Fix Recommendation**:
```javascript
// Abort pending HTMX requests before navigation
if (nId) {
  // ... existing code
} else {
  // Cancel pending district fetch
  if (window.htmx) {
    window.htmx.findAll('[data-district-panel][hx-get]').forEach(el => {
      window.htmx.trigger(el, 'htmx:abort');
    });
  }

  districtPanel.innerHTML = '...';
  const currentUrl = window.location.pathname + window.location.search;
  if (currentUrl !== baseUrl) {
    window.location.href = baseUrl;
  }
}
```

---

## Medium Priority

### 3. URL Encoding Inconsistencies

**Location**: All navigation points
**Impact**: Special characters in filters could break same-URL checks

**Problem**:
Query params with special characters may be encoded differently:
- `window.location.search` returns browser-encoded version
- `currentPath` prop is server-rendered and may use different encoding

**Example**:
- User searches: `q=căn hộ cao cấp`
- Browser encodes: `?q=c%C4%83n%20h%E1%BB%99%20cao%20c%E1%BA%A5p`
- Server might render: `?q=c%C4%83n+h%E1%BB%99+cao+c%E1%BA%A5p` (space as `+`)
- String comparison fails

**Fix Recommendation**:
```javascript
function normalizeUrl(url: string): string {
  const [path, query] = url.split('?');
  if (!query) return path;

  const params = new URLSearchParams(query);
  const normalized = new URLSearchParams();

  // Re-encode all params consistently
  params.forEach((value, key) => {
    normalized.set(key, value);
  });

  return `${path}?${normalized.toString()}`;
}

const currentUrl = normalizeUrl(window.location.pathname + window.location.search);
const targetUrl = normalizeUrl(currentPath);
```

---

### 4. Hash Fragment Ignored

**Location**: All same-URL checks
**Impact**: URL hash changes won't trigger navigation when they should

**Problem**:
```javascript
const currentUrl = window.location.pathname + window.location.search;
```

Doesn't include `window.location.hash`. If server wants to scroll to anchor, same-URL check would block it.

**Example**:
- Current: `/mua-ban?sort=newest`
- Target: `/mua-ban?sort=newest#results`
- Check blocks navigation → user doesn't scroll to results

**Fix Recommendation**:
```javascript
const currentUrl = window.location.pathname + window.location.search + window.location.hash;
const targetUrl = currentPath; // Ensure server includes hash if needed
```

---

### 5. Browser Back Button Behavior

**Location**: All navigation points
**Impact**: Back button may not work as expected after same-URL prevention

**Problem**:
When navigation is prevented, browser history isn't updated. User clicks browser back expecting to go to previous filter state, but URL hasn't changed.

**Example Flow**:
1. User on `/mua-ban?sort=newest`
2. Changes sort to `price_asc` → navigates to `/mua-ban?sort=price_asc`
3. Clicks clear filters → same-URL check prevents navigation (already on `/mua-ban?sort=price_asc`)
4. User hits back button → goes to initial page, not intermediate filtered state

**Recommendation**:
Consider using `history.replaceState()` for UI-only updates:
```javascript
if (currentUrl === targetUrl) {
  // Update UI without navigation
  history.replaceState(null, '', targetUrl);
  // Trigger UI reset events
} else {
  window.location.href = targetUrl;
}
```

---

### 6. Sort Dropdown: Missing `baseUrl` Context

**Location**: `[...slug].astro:109`
**Impact**: Sort dropdown hardcodes query params, loses current filters

**Problem**:
```html
<select onchange="if (window.location.pathname + window.location.search !== this.value) window.location.href = this.value">
  <option value={`?sort=newest`} selected={filters.sort === 'newest'}>Mới nhất</option>
```

Sort URLs are `?sort=newest` without preserving other filters. When user changes sort, all property_types, price, area filters are lost.

**Example**:
- Current: `/mua-ban?property_types=1,2&gtn=1000000&sort=newest`
- User changes sort → navigates to `/mua-ban?sort=price_asc`
- Filters lost!

**Fix Recommendation**:
```typescript
// In server-side Astro component
function buildSortUrl(sortOption: string): string {
  const params = new URLSearchParams(url.searchParams);
  params.set('sort', sortOption);
  return `${url.pathname}?${params.toString()}`;
}
```

```html
<option value={buildSortUrl('newest')} selected={filters.sort === 'newest'}>Mới nhất</option>
<option value={buildSortUrl('oldest')} selected={filters.sort === 'oldest'}>Cũ nhất</option>
```

---

## Low Priority

### 7. TypeScript Type Safety

**Location**: All client-side scripts
**Impact**: Runtime errors if DOM elements missing

**Issue**:
```javascript
const currentUrl = window.location.pathname + window.location.search;
```

No null checks. If script runs before DOM ready, could throw errors.

**Recommendation**:
```javascript
if (!container) return; // Already exists
const currentUrl = window.location?.pathname + window.location?.search || '';
```

---

### 8. Console Logging for Debugging

**Location**: All changed files
**Impact**: No visibility into same-URL check behavior in production

**Recommendation**:
Add development-only logging:
```javascript
if (import.meta.env.DEV) {
  console.log('[URL Check]', { currentUrl, targetUrl, willNavigate: currentUrl !== targetUrl });
}
```

---

## Edge Cases Found by Scout

### Dependencies and Callers

**Files with similar URL navigation logic** (potential consistency issues):
1. `listing-pagination.astro` - Uses `getPageUrl()` helper, preserves query params ✅
2. `hero-search.astro` - Uses `window.location.href` without same-URL check ⚠️
3. `location-autocomplete.astro` - Relies on HTMX navigation ✅
4. `listing-url-parser.ts` - Parses URL to filters, no navigation ✅

**Recommendation**: Apply same-URL checks to `hero-search.astro:157` form submission.

---

### State Mutation Edge Cases

**HTMX Swap Timing**:
- `location-selector.astro:87` uses `hx-trigger="load once"`
- Prevents re-fetching districts on back button navigation
- Good for performance, but districts won't refresh if user navigates back after data changes

**Client State Desync**:
- `listing-filter.astro` tracks state in JS variables:
  ```javascript
  let selectedPropertyTypes: string[] = [];
  let selectedPrice = '';
  ```
- If page loads with filters in URL, state must be initialized from `data-active` attributes
- Current implementation does this ✅ (lines 216-217, 244-246)

---

### Boundary Conditions

**Empty Query Params**:
- `/mua-ban?` vs `/mua-ban` - String comparison would fail
- **Tested**: `window.location.search` returns `""` for no params ✅

**Trailing Slashes**:
- `/mua-ban/` vs `/mua-ban` - Different strings
- **Risk**: Medium - Astro might normalize, but check implementation

**Case Sensitivity**:
- `/Mua-Ban` vs `/mua-ban` - Would fail string check
- **Risk**: Low - Astro routing is case-insensitive, unlikely to occur

---

## Positive Observations

1. **Consistent Pattern**: All three fixes use same approach (string equality check)
2. **UI State Management**: Filter component correctly initializes from `data-active` attributes
3. **HTMX Integration**: "load once" trigger prevents unnecessary district refetches
4. **User Experience**: Prevents jarring page reloads when already on target URL
5. **Clear Intent**: Code comments would help, but logic is readable
6. **No Mutation**: Same-URL checks don't mutate global state

---

## Recommended Actions

**Priority Order**:

1. **[HIGH]** Fix sort dropdown filter preservation (`[...slug].astro:109-117`)
   - Severity: High - Breaks filtering UX
   - Effort: 15 minutes
   - Build `buildSortUrl()` helper to preserve query params

2. **[HIGH]** Normalize query parameter order in URL comparisons
   - Severity: High - Causes unnecessary navigations
   - Effort: 30 minutes
   - Create `urlsAreEqual()` utility function

3. **[MEDIUM]** Handle HTMX race condition on province reset
   - Severity: Medium - Rare but causes DOM errors
   - Effort: 20 minutes
   - Abort pending HTMX requests before navigation

4. **[MEDIUM]** Add URL encoding normalization
   - Severity: Medium - Affects search with special chars
   - Effort: 15 minutes
   - Use `URLSearchParams` for consistent encoding

5. **[MEDIUM]** Include hash fragment in URL comparisons
   - Severity: Low-Medium - Blocks anchor navigation
   - Effort: 5 minutes
   - Append `window.location.hash`

6. **[LOW]** Add development logging
   - Severity: Low - QoL improvement
   - Effort: 10 minutes
   - Log URL comparisons in dev mode

7. **[LOW]** Apply same-URL check to hero search form
   - Severity: Low - Consistency improvement
   - Effort: 5 minutes
   - Mirror listing-filter pattern

---

## Metrics

- **Type Coverage**: N/A (Client-side JS in Astro components)
- **Test Coverage**: Unknown - No test files found
- **Linting Issues**: Unknown - Did not run linter
- **Compile Status**: Not verified

---

## Unresolved Questions

1. **Server-side `currentPath` generation**: How does Astro construct this prop? Does it normalize query param order or encoding?

2. **Trailing slash handling**: Does Astro router normalize `/mua-ban/` to `/mua-ban`? Need to verify routing config.

3. **HTMX version**: Which version is loaded? Abort API availability depends on version (v1.9+ has `htmx:abort`).

4. **Testing approach**: How to write E2E tests for infinite loop prevention? Consider Playwright with network throttling to trigger race conditions.

5. **Analytics impact**: Should we track prevented navigations for monitoring? Could indicate UX issues if frequency is high.

6. **Browser compatibility**: Does `URLSearchParams.sort()` work in all target browsers? Check MDN compatibility table.

---

## Next Steps

1. Prioritize sort dropdown fix (breaks filtering)
2. Implement URL normalization utility
3. Add E2E tests for navigation edge cases
4. Consider refactoring URL comparison logic into shared utility module
5. Update plan TODO list with findings

---

**Review Status**: ✅ Complete
**Approval**: ⚠️ Conditional - Fix HIGH priority issues before merge
