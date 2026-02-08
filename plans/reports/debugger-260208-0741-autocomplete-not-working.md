# Debug Report: Search Autocomplete Not Working

**Date:** 2026-02-08
**Branch:** listing72
**Issue:** Location search autocomplete feature not working
**Severity:** High
**Reporter:** User

---

## Executive Summary

**Root Cause:** Multiple potential issues preventing HTMX autocomplete from functioning:

1. **Missing Environment Variables** - ES_URL and ES_API_KEY not configured
2. **HTMX Event Listener Conflicts** - Multiple instances registering same global events
3. **Empty Response Handling** - API returns empty string for queries <2 chars without visible feedback
4. **Global Event Pollution** - `htmx:configRequest` listeners stack on every page navigation

**Impact:**
- Users cannot use location autocomplete feature
- Search functionality appears broken (no results, no loading state)
- Silent failures due to missing ES credentials
- Potential memory leaks from accumulating event listeners

**Priority Fix:** Configure ElasticSearch credentials and fix event listener cleanup

---

## Root Cause Analysis

### Issue 1: Missing ElasticSearch Configuration (CRITICAL)

**File:** `src/services/elasticsearch/location-search-service.ts`
**Lines:** 9-11, 30-33

```typescript
const ES_URL = import.meta.env.ES_URL || process.env.ES_URL || '';
const ES_API_KEY = import.meta.env.ES_API_KEY || process.env.ES_API_KEY || '';

if (!ES_URL || !ES_API_KEY) {
  console.error('[LocationSearch] Missing ES_URL or ES_API_KEY');
  return [];
}
```

**Evidence:**
- No `.env` file found in project root
- Only `.env.example` exists with placeholder values
- Service returns empty array silently when credentials missing
- User sees no results, no error message

**Detection:**
```bash
# Check for .env file
dir d:\tongkho-web\.env* /b
# Result: File not found

# Check .env.example
ES_URL=https://elastic.tongkhobds.com
ES_INDEX=real_estate
ES_API_KEY=your_api_key_here  # ← PLACEHOLDER
```

**User Impact:**
- Typing in autocomplete input → no results shown
- No loading spinner appears
- No error message displayed
- Feature appears completely broken

---

### Issue 2: HTMX Global Event Listener Accumulation

**File:** `src/components/listing/location-autocomplete.astro`
**Lines:** 55-78

```javascript
<script is:inline>
  // ⚠️ PROBLEM: Global event listeners never cleaned up
  document.addEventListener('htmx:configRequest', function(evt) {
    const input = evt.detail.elt;
    if (input.closest('.location-autocomplete') && input.tagName === 'INPUT') {
      evt.detail.parameters.q = input.value;
    }
  });

  document.addEventListener('click', function(evt) {
    const container = evt.target.closest('.location-autocomplete');
    if (!container) {
      document.querySelectorAll('#location-results').forEach(el => el.innerHTML = '');
    }
  });

  document.addEventListener('keydown', function(evt) {
    if (evt.key === 'Escape') {
      document.querySelectorAll('#location-results').forEach(el => el.innerHTML = '');
    }
  });
</script>
```

**Problem Pattern:**
1. Component renders in sidebar on `/mua-ban` page
2. Three global event listeners attached to `document`
3. User navigates to `/cho-thue` (Astro View Transitions)
4. Component re-renders → THREE MORE listeners attached
5. Now 6 listeners exist (3 old + 3 new)
6. After 5 page views → 15 duplicate listeners
7. Each keystroke triggers 15 handlers

**Symptoms:**
- Autocomplete gets progressively slower
- Multiple `htmx:configRequest` handlers stack `q` parameter
- Click-outside handler runs multiple times
- Memory leak from accumulating closures

**Evidence:**
- `<script is:inline>` runs every component render
- No cleanup on component unmount
- Astro View Transitions keep DOM alive between navigations
- Base layout uses `<ClientRouter />` (line 76)

---

### Issue 3: Silent Empty Response Handling

**File:** `src/pages/api/location/search.ts`
**Lines:** 30-35

```typescript
// Minimum 2 characters
if (query.length < 2) {
  return new Response('', {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
```

**Problem:**
- User types 1 character → empty response
- HTMX swaps `innerHTML` with empty string
- Dropdown div has `empty:hidden` class → disappears
- No visual feedback to user
- User doesn't know minimum character requirement

**Better UX:**
```typescript
if (query.length < 2) {
  return new Response(
    `<div class="p-4 text-center text-slate-500 text-sm">
      Nhập ít nhất 2 ký tự để tìm kiếm
    </div>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
```

---

### Issue 4: Multiple Autocomplete IDs Cause Conflicts

**File:** `src/components/listing/location-autocomplete.astro`
**Lines:** 34, 41, 50

```html
hx-target="#location-results"
<div id="location-spinner" ...>
<div id="location-results" ...>
```

**Problem:**
- IDs are global and must be unique
- If multiple `LocationAutocomplete` components render on same page:
  - Both use same `#location-results` ID
  - HTMX targets first element only
  - Second autocomplete never receives results
- Currently used in `location-selector.astro` (line 105-108)

**Current Usage:**
```astro
<!-- location-selector.astro -->
<LocationAutocomplete
  placeholder="Hoặc tìm kiếm địa điểm..."
  baseUrl={baseUrl}
/>
```

**Appears once per page** so not currently broken, but fragile design.

---

### Issue 5: HTMX Script Loading Timing

**File:** `src/layouts/base-layout.astro`
**Line:** 70

```html
<script src="https://unpkg.com/htmx.org@2.0.4" ...></script>
```

**Potential Issue:**
- Script loads from CDN in `<head>`
- Component script runs immediately after component renders
- Race condition: component script may run before HTMX loaded
- Fallback code exists (lines 183-189) but manual fetch doesn't inject `q` param

**Evidence from location-selector.astro:**
```javascript
// Line 176-181
if (window.htmx) {
  window.htmx.ajax('GET', `/api/location/districts?...`, {...});
} else {
  // Fallback: fetch manually - BUT MISSING q PARAMETER LOGIC
  fetch(`/api/location/districts?province=${nId}&base=${baseUrl}`)
    .then(res => res.text())
    .then(html => { districtPanel.innerHTML = html; });
}
```

---

## Technical Analysis

### HTMX Autocomplete Flow (Expected)

```
User types "hà nội"
↓
HTMX detects keyup event (delay: 300ms)
↓
htmx:configRequest event fires
↓
Custom handler injects q=hà nội parameter
↓
GET /api/location/search?base=/mua-ban&q=h%C3%A0%20n%E1%BB%99i
↓
location-search-service.ts calls ElasticSearch
↓
ES returns matching locations
↓
API formats results as HTML
↓
HTMX swaps into #location-results
↓
User sees dropdown with results
```

### Actual Flow (Broken State)

```
User types "hà nội"
↓
HTMX detects keyup event (delay: 300ms)
↓
htmx:configRequest event fires
↓
Custom handler injects q=hà nội parameter
↓
GET /api/location/search?base=/mua-ban&q=h%C3%A0%20n%E1%BB%99i
↓
location-search-service.ts checks ES credentials
↓
❌ ES_URL or ES_API_KEY missing
↓
console.error() logged (not visible to user)
↓
Return empty array []
↓
API returns: <div>Không tìm thấy "hà nội"</div>
↓
HTMX swaps into #location-results
↓
User sees "No results" instead of actual results
```

---

## Recommended Fixes

### Fix 1: Create .env File with Real Credentials (CRITICAL)

**Action:** Copy `.env.example` to `.env` and fill in real values

```bash
# Create .env file
cp .env.example .env

# Edit with real credentials (user must provide)
# Example:
ES_URL=https://elastic.tongkhobds.com
ES_API_KEY=ABC123_real_api_key_here
DATABASE_URL=postgresql://user:pass@host:5432/db
```

**Test:**
```bash
# Verify env vars loaded
npm run dev
# Open browser console, test autocomplete
# Should see actual ElasticSearch results
```

---

### Fix 2: Add Event Listener Cleanup (HIGH PRIORITY)

**File:** `src/components/listing/location-autocomplete.astro`
**Current Lines:** 55-78

**Recommended Fix:**
```javascript
<script>
  // Use named functions for cleanup
  function handleHtmxConfig(evt) {
    const input = evt.detail.elt;
    if (input.closest('.location-autocomplete') && input.tagName === 'INPUT') {
      evt.detail.parameters.q = input.value;
    }
  }

  function handleClickOutside(evt) {
    const container = evt.target.closest('.location-autocomplete');
    if (!container) {
      document.querySelectorAll('#location-results').forEach(el => el.innerHTML = '');
    }
  }

  function handleEscape(evt) {
    if (evt.key === 'Escape') {
      document.querySelectorAll('#location-results').forEach(el => el.innerHTML = '');
    }
  }

  // Attach listeners
  document.addEventListener('htmx:configRequest', handleHtmxConfig);
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleEscape);

  // Cleanup on page navigation (Astro View Transitions)
  document.addEventListener('astro:before-preparation', () => {
    document.removeEventListener('htmx:configRequest', handleHtmxConfig);
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleEscape);
  });
</script>
```

**Key Changes:**
- Named functions instead of anonymous (enables cleanup)
- Listen for `astro:before-preparation` event
- Remove listeners before navigation
- Prevents accumulation across page views

---

### Fix 3: Improve Empty Query Feedback (UX)

**File:** `src/pages/api/location/search.ts`
**Lines:** 30-35

**Current Code:**
```typescript
if (query.length < 2) {
  return new Response('', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
```

**Recommended Fix:**
```typescript
if (query.length < 2) {
  return new Response(
    `<div class="p-3 text-center text-slate-500 text-xs">
      <svg class="w-4 h-4 mx-auto mb-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      Nhập ít nhất 2 ký tự
    </div>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
```

**Benefits:**
- Clear feedback on minimum requirement
- Prevents confusion (user knows feature is working)
- Small icon reinforces search context

---

### Fix 4: Make IDs Dynamic for Multiple Instances (MEDIUM)

**File:** `src/components/listing/location-autocomplete.astro`

**Add unique ID generator:**
```astro
---
const uid = `loc-${Math.random().toString(36).substr(2, 9)}`;
const resultId = `location-results-${uid}`;
const spinnerId = `location-spinner-${uid}`;
---

<div class="location-autocomplete relative" data-autocomplete-id={uid}>
  <input
    ...
    hx-target={`#${resultId}`}
    hx-indicator={`#${spinnerId}`}
  />

  <div id={spinnerId} class="htmx-indicator ...">
    ...
  </div>

  <div id={resultId} class="absolute ...">
  </div>
</div>

<script>
  document.addEventListener('htmx:configRequest', function(evt) {
    const input = evt.detail.elt;
    const container = input.closest('.location-autocomplete');
    if (container && input.tagName === 'INPUT') {
      evt.detail.parameters.q = input.value;
    }
  });
  // ... rest of script
</script>
```

**Benefits:**
- Supports multiple autocomplete instances per page
- No ID conflicts
- Future-proof for feature expansion

---

### Fix 5: Add Error State Handling (LOW)

**File:** `src/components/listing/location-autocomplete.astro`

**Add after existing script:**
```javascript
// Show error state on failed requests
document.body.addEventListener('htmx:responseError', function(evt) {
  const input = evt.detail.elt;
  const container = input.closest('.location-autocomplete');
  if (container) {
    const resultsDiv = container.querySelector('#location-results');
    if (resultsDiv) {
      resultsDiv.innerHTML = `
        <div class="p-3 text-center text-red-500 text-sm">
          <svg class="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Không thể tải kết quả
        </div>
      `;
    }
  }
});
```

---

## Prevention Measures

### 1. Add Environment Variable Validation

**File:** `src/services/elasticsearch/location-search-service.ts`

**Add startup check:**
```typescript
// At module level
if (!ES_URL || !ES_API_KEY) {
  console.warn(`
    ⚠️  LOCATION SEARCH DISABLED
    Missing environment variables:
    ${!ES_URL ? '- ES_URL' : ''}
    ${!ES_API_KEY ? '- ES_API_KEY' : ''}

    Copy .env.example to .env and configure credentials.
  `);
}
```

### 2. Add Browser Console Debugging

**File:** `src/components/listing/location-autocomplete.astro`

**Add debug mode:**
```javascript
const DEBUG = false; // Toggle for debugging

if (DEBUG) {
  document.body.addEventListener('htmx:configRequest', (evt) => {
    console.log('[Autocomplete] Request:', {
      url: evt.detail.path,
      params: evt.detail.parameters,
      element: evt.detail.elt
    });
  });

  document.body.addEventListener('htmx:afterSwap', (evt) => {
    console.log('[Autocomplete] Response received:', {
      target: evt.detail.target.id,
      contentLength: evt.detail.target.innerHTML.length
    });
  });
}
```

### 3. Add Monitoring for Event Listener Leaks

**File:** `src/layouts/base-layout.astro`

**Add after HTMX script:**
```javascript
<script is:inline>
  // Monitor event listener count (dev only)
  if (import.meta.env.DEV) {
    let navCount = 0;
    document.addEventListener('astro:page-load', () => {
      navCount++;
      console.log(`[Debug] Page loads: ${navCount}. Check for listener accumulation.`);
    });
  }
</script>
```

---

## Testing Checklist

**Environment Setup:**
- [ ] Create `.env` file with real credentials
- [ ] Verify `ES_URL` points to working ElasticSearch instance
- [ ] Verify `ES_API_KEY` has read permissions on `locations` index
- [ ] Restart dev server after creating `.env`

**Autocomplete Functionality:**
- [ ] Visit `/mua-ban` page
- [ ] Type single character → see "Nhập ít nhất 2 ký tự" message
- [ ] Type "hà" → see loading spinner
- [ ] See results dropdown appear with Hà Nội, Hải Phòng, etc.
- [ ] Click result → navigate to location page
- [ ] Press Escape → dropdown closes
- [ ] Click outside → dropdown closes

**Memory Leak Prevention:**
- [ ] Visit `/mua-ban`, type in autocomplete
- [ ] Navigate to `/cho-thue` (View Transition)
- [ ] Type in autocomplete again
- [ ] Open browser DevTools → Console
- [ ] Check for duplicate console logs
- [ ] Navigate 5 times, verify no accumulation

**Error Handling:**
- [ ] Disconnect internet
- [ ] Type in autocomplete
- [ ] Verify error message appears
- [ ] Reconnect internet
- [ ] Verify autocomplete recovers

---

## Related Code Files

### Core Implementation
- `src/components/listing/location-autocomplete.astro` - Autocomplete component
- `src/pages/api/location/search.ts` - Search API endpoint
- `src/services/elasticsearch/location-search-service.ts` - ES query logic

### Integration Points
- `src/components/listing/sidebar/location-selector.astro` - Uses autocomplete
- `src/layouts/base-layout.astro` - Loads HTMX script
- `.env.example` - Environment variable template

### Related Features
- `src/services/elasticsearch/property-search-service.ts` - Similar ES pattern
- `src/pages/api/location/districts.ts` - District API (HTMX)
- `src/components/listing/listing-filter.astro` - Other filters

---

## Success Criteria

1. ✅ `.env` file created with valid ElasticSearch credentials
2. ✅ Typing 2+ characters shows autocomplete results
3. ✅ Loading spinner appears during search
4. ✅ Results dropdown shows province/district/ward/project matches
5. ✅ Clicking result navigates to correct URL
6. ✅ No duplicate event listeners after page navigation
7. ✅ No console errors related to HTMX or autocomplete
8. ✅ Proper error message when network fails
9. ✅ Minimum character feedback message shown

---

## Risk Assessment

### Critical Risk
- **Missing ES credentials** - Feature completely broken, no workaround
- **Silent failures** - Users unaware feature exists

### High Risk
- **Event listener accumulation** - Performance degrades over time
- **Memory leaks** - Browser may freeze after many navigations

### Medium Risk
- **ID conflicts** - If multiple autocomplete components added
- **HTMX race condition** - Rare, fallback exists

### Low Risk
- **CDN availability** - HTMX loaded from unpkg.com
- **Empty query UX** - Minor confusion, not blocking

---

## Security Considerations

- ✅ All user input escaped via `escapeHtml()` function (line 16-22, search.ts)
- ✅ No XSS vulnerabilities in HTML generation
- ✅ ElasticSearch credentials stored in `.env` (not committed)
- ✅ HTMX attributes not exposed to injection
- ✅ API endpoint validates query length before processing
- ⚠️ Consider rate limiting on `/api/location/search` endpoint
- ⚠️ Consider caching frequent searches (Redis/memory)

---

## Unresolved Questions

1. **Are ES credentials available?** User must provide real `ES_URL` and `ES_API_KEY`
2. **Does ElasticSearch have `locations` index?** Must verify index exists and has data
3. **What's the expected response time?** Current timeout is 3s (line 118, location-search-service.ts)
4. **Should autocomplete cache results?** IndexedDB caching researched but not implemented
5. **Are there any A/B testing scripts?** Could interfere with event listeners
6. **Should autocomplete support keyboard navigation?** Currently only mouse/click
7. **What about mobile keyboard behavior?** Virtual keyboards may affect `keyup` timing
