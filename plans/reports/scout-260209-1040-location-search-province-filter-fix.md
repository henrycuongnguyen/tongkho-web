# Scout Report: Location Search Province Filter Fix

**Date:** 2026-02-09
**Scope:** Edge case analysis for province filtering in location search autocomplete
**Changed Files:** `src/components/listing/horizontal-search-bar.astro`

## Relevant Files

### Primary Component (Fixed)
- `src/components/listing/horizontal-search-bar.astro` - Main search bar with province filtering fix

### Event Publishers
- `src/components/listing/sidebar/province-selector-modal.astro` - Dispatches `province-selected` event (lines 223-226)

### Event Subscribers
- `src/components/listing/horizontal-search-bar.astro` - Subscribes to `province-selected` event (line 400)
- `src/components/listing/sidebar/location-selector.astro` - Also subscribes to `province-selected` event (line 256)

### Backend Services
- `src/pages/api/location/search.ts` - Search API endpoint (receives `city_id` and `city_slug` params)
- `src/services/elasticsearch/location-search-service.ts` - ElasticSearch integration (uses `cityId` for filtering)

### Related Components (Different Use Cases)
- `src/components/listing/location-autocomplete.astro` - Sidebar multi-select autocomplete (uses HTMX, no province context)
- `src/components/listing/sidebar/location-selector.astro` - Sidebar location selector (has similar province tracking)

## Data Flow Analysis

### Event Flow
1. **User Action:** User clicks province button in `province-selector-modal.astro`
2. **Event Dispatch:** Modal dispatches `province-selected` with `{ slug, name, nId }` (line 223-226)
3. **Event Receive:** `horizontal-search-bar.astro` receives event (line 400)
4. **State Update:**
   - Updates JS variables: `currentProvinceNId`, `currentProvinceName` (lines 411-412)
   - **FIX:** Updates DOM attributes: `data-current-province-nid`, `data-current-province-slug` (lines 417-418)
5. **Search Trigger:** User types in district search input
6. **API Call:** JS reads attributes and builds URL with `city_id` and `city_slug` params (lines 729-736)
7. **Backend Filter:** ElasticSearch service filters by `n_parentid = cityId` (line 92)

### State Management
- **Server-side:** `selectedProvince` from URL parsing (line 73-75)
- **Client-side JS:** `currentProvinceNId`, `currentProvinceName` variables (lines 395-396)
- **DOM attributes:** `data-current-province-nid`, `data-current-province-slug` on `[data-search-bar]` element (line 96)

## Edge Cases Found

### 1. **Race Condition: Event Timing** (MEDIUM RISK)
**Scenario:** Multiple rapid province selections before district loading completes
**Impact:** Last event wins, but district dropdown might show results from previous province
**Mitigation:** Already handled - `districtsLoaded = false` on each event (line 413)

### 2. **Stale Attribute Data** (HIGH RISK - FIXED)
**Scenario:** Province selected via modal, but search reads stale `data-current-province-nid`
**Impact:** Location search doesn't filter by province (search all locations)
**Status:** **FIXED** by lines 416-419 (updates attributes on event)

### 3. **Missing Slug in Event** (MEDIUM RISK - FIXED)
**Scenario:** Event detail missing `slug` property
**Impact:** `data-current-province-slug` gets empty string
**Status:** **FIXED** by line 402 (added `slug` to destructure)

### 4. **Duplicate Event Listeners** (LOW RISK)
**Scenario:** Astro View Transitions re-run init without cleanup
**Impact:** Multiple event listeners registered for `province-selected`
**Mitigation:** Event listener not removed, but multiple handlers won't conflict (all update same DOM)

### 5. **Initial Page Load State Mismatch** (POTENTIAL ISSUE)
**Scenario:** User navigates to `/mua-ban/ha-noi` directly (province in URL)
**State:** Server-side sets `data-current-province-nid` correctly (line 96)
**Risk:** If event fires after page load, does it override correct initial state?
**Analysis:** Event only fires on user interaction (modal selection), so no conflict

### 6. **Province Change Without Page Reload** (POTENTIAL ISSUE)
**Scenario:** User selects province from modal, searches locations, then changes province again
**Risk:** District dropdown might show mixed results from both provinces
**Mitigation:** `districtsLoaded = false` clears state, and district container is cleared (line 440)

### 7. **Empty Province Selection** (LOW RISK)
**Scenario:** User clears province selection (clear button in modal)
**Impact:** `nId` and `slug` become empty strings
**Behavior:** Search API receives empty params, searches all locations (correct fallback)
**Code:** Lines 735-739 handle this correctly (only add params if non-empty)

### 8. **Cross-Component State Sync** (POTENTIAL ISSUE)
**Scenario:** Both `horizontal-search-bar.astro` and `location-selector.astro` listen to same event
**Risk:** State drift if one component updates but other doesn't
**Analysis:** Both update independently, no shared state → OK
**Note:** `location-selector.astro` also updates similar attributes (lines 263-265)

## Boundary Conditions

### Empty/Null Values
- ✅ Empty `nId`: Search falls back to all locations (line 735-739)
- ✅ Null province: `selectedProvince?.nId || ''` handles gracefully (line 96)
- ✅ Missing slug: Event now includes slug (line 402)

### Async Operations
- ✅ District fetch: Loading states handled (lines 438-440, 448)
- ✅ Search fetch: Debounced 300ms (line 705)
- ⚠️ Multiple overlapping searches: Last response wins (no cancellation)

### User Interactions
- ✅ Rapid typing: Debounced 300ms (line 645-708)
- ✅ Province change during search: State cleared (line 413)
- ✅ Close dropdown during fetch: No error (HTML updates hidden element)

## Similar Patterns in Codebase

### Component Comparison

| Component | Province Context | Event Listener | Attribute Update |
|-----------|------------------|----------------|------------------|
| `horizontal-search-bar.astro` | ✅ Yes | ✅ Yes | ✅ **FIXED** |
| `location-selector.astro` | ✅ Yes | ✅ Yes | ✅ Yes (already working) |
| `location-autocomplete.astro` | ❌ No | ❌ No | N/A (multi-select, no province filter) |

**Note:** `location-selector.astro` already has correct implementation (updates attributes on lines 263-265), which matches the pattern now applied to `horizontal-search-bar.astro`.

## Recommendations

### Immediate Actions
1. ✅ **DONE:** Add `slug` to event destructure (line 402)
2. ✅ **DONE:** Update `data-current-province-nid` attribute (line 417)
3. ✅ **DONE:** Update `data-current-province-slug` attribute (line 418)

### Future Improvements
1. **Add event listener cleanup:** Prevent accumulation on View Transitions
   ```javascript
   document.addEventListener('astro:before-swap', () => {
     document.removeEventListener('province-selected', provinceSelectedHandler);
   }, { once: true });
   ```

2. **Abort in-flight searches:** Use `AbortController` to cancel overlapping requests
   ```javascript
   let searchAbortController = null;
   if (searchAbortController) searchAbortController.abort();
   searchAbortController = new AbortController();
   fetch(url, { signal: searchAbortController.signal });
   ```

3. **Validate event data:** Add safety checks
   ```javascript
   if (!nId || !slug || !name) {
     console.error('[HorizontalSearchBar] Invalid province-selected event:', e.detail);
     return;
   }
   ```

4. **Unified state management:** Consider single source of truth for province selection across components

## Unresolved Questions

1. **Multi-tab state sync:** If user has multiple tabs open, does province selection in one tab affect others? (Likely no - each tab has separate JS context)

2. **Browser back/forward:** If user uses browser navigation, do the data attributes stay in sync with URL? (Likely yes - page re-renders with correct server-side props)

3. **Performance:** Are there any memory leaks from event listeners accumulating? (Low risk but should test with profiler)

4. **sessionStorage usage:** `province-selector-modal.astro` saves to sessionStorage (line 215-219), but is this data used anywhere? (Appears unused)
