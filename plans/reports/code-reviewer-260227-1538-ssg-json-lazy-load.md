# Code Review: SSG JSON + Client Lazy Load Implementation

**Date:** 2026-02-27 | **Reviewer:** code-reviewer | **Score: 7.5/10**

## Scope

- `scripts/generate-locations.ts` (~300 LOC)
- `src/lib/location-fetcher.ts` (~153 LOC)
- `src/lib/location-types.ts` (~23 LOC)
- `src/components/listing/horizontal-search-bar.astro` (changed sections)

---

## Overall Assessment

Solid implementation with clean architecture. Types are well-defined, caching logic is appropriate, and error handling is consistent. A few security and resource management issues need attention.

---

## Critical Issues

### 1. XSS Vulnerability in `renderDistrictsHtml` (HIGH)

**File:** `horizontal-search-bar.astro` (lines 592-608)

```javascript
data-slug="${d.slug}"
data-nid="${d.nId}"
data-name="${d.name}"
<span class="${textClass}">${d.name}</span>
```

**Problem:** Data from JSON is inserted directly into HTML without escaping. If malicious data enters the JSON (e.g., `name: '<script>alert(1)</script>'`), XSS attack is possible.

**Recommendation:** Escape HTML entities before insertion:
```javascript
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
// Then: data-name="${escapeHtml(d.name)}"
```

### 2. Database Connection Not Closed (MEDIUM)

**File:** `generate-locations.ts` (lines 295-300)

```javascript
generateLocations()
  .then(() => process.exit(0))
  .catch(...);
```

**Problem:** `postgres` client is never explicitly closed. While `process.exit()` terminates, this is not clean resource management and can cause issues with connection pools.

**Recommendation:**
```javascript
generateLocations()
  .then(async () => {
    await client.end();
    process.exit(0);
  })
  .catch(async (error) => {
    await client.end();
    console.error('[FATAL]', error);
    process.exit(1);
  });
```

---

## High Priority

### 3. No Input Validation on `provinceNId` / `districtNId` (MEDIUM)

**File:** `location-fetcher.ts` (lines 70-91, 97-118)

**Problem:** IDs are passed directly to fetch URLs without validation. Malicious input could craft unexpected paths:
```javascript
getDistricts('../../../etc/passwd') // path traversal attempt
```

**Recommendation:** Validate IDs are alphanumeric only:
```javascript
const isValidId = (id: string) => /^[a-zA-Z0-9_-]+$/.test(id);
if (!isValidId(provinceNId)) return [];
```

### 4. Silent Failures Return Empty Arrays

**Files:** `location-fetcher.ts`, `generate-locations.ts`

**Problem:** All errors return `[]` silently. While this prevents crashes, it makes debugging difficult when data is missing.

**Recommendation:** Consider adding optional error callback or event emitter for monitoring:
```javascript
export async function getDistricts(
  provinceNId: string,
  options?: { onError?: (e: Error) => void }
): Promise<DistrictItem[]> {
```

---

## Medium Priority

### 5. Duplicate Type Definitions

**Files:** `generate-locations.ts` (lines 60-76) vs `location-types.ts`

**Problem:** `LocationItem`, `DistrictItem`, `WardItem`, `AddressVersion` are defined twice - once in the script and once in the types file.

**Recommendation:** Move shared types to a common location or import from `location-types.ts` in the script:
```javascript
import type { LocationItem, DistrictItem, WardItem, AddressVersion } from '../src/lib/location-types';
```

### 6. `loadEnv()` Reinvents dotenv

**File:** `generate-locations.ts` (lines 32-54)

**Problem:** Custom env parser that handles basic cases but misses edge cases (multiline values, escaped quotes, variable expansion).

**Recommendation:** Use `dotenv` package or document limitations clearly. If avoiding dependencies, at least add comment explaining why.

### 7. Cache Never Expires

**File:** `location-fetcher.ts` (line 18)

```javascript
const cache = new Map<string, ...>();
```

**Problem:** Cache persists for entire session. If JSON files are updated (e.g., after regeneration), old data remains until page refresh.

**Recommendation:** Consider TTL-based cache or cache-busting mechanism:
```javascript
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

---

## Low Priority

### 8. Console Logging in Production

**Files:** Both files have `console.log`/`console.warn` statements.

**Recommendation:** Consider conditional logging or remove for production builds.

### 9. Magic Numbers

**File:** `generate-locations.ts` (line 84)

```javascript
{ max: 5, connect_timeout: 10, idle_timeout: 30 }
```

**Recommendation:** Extract to named constants.

---

## Positive Observations

1. **Clean separation of concerns** - Generator, fetcher, and types in separate files
2. **Consistent error handling pattern** - try/catch with fallback to empty arrays
3. **Good use of TypeScript** - Proper type annotations throughout
4. **Efficient caching** - In-memory Map cache prevents redundant fetches
5. **Version toggle feature** - Clean implementation for new/old address switching
6. **Preload function** - `preloadProvinces()` for performance optimization
7. **Well-documented** - JSDoc comments explain purpose of each module/function

---

## Metrics

| Metric | Value |
|--------|-------|
| Type Coverage | ~95% (good) |
| Error Handling | All functions have try/catch |
| Documentation | Good JSDoc coverage |
| File Size | All under 200 LOC guideline |

---

## Recommended Actions

1. **[CRITICAL]** Add HTML escaping in `renderDistrictsHtml` to prevent XSS
2. **[HIGH]** Close database connection in `generate-locations.ts`
3. **[HIGH]** Add input validation for IDs in `location-fetcher.ts`
4. **[MEDIUM]** Consolidate duplicate type definitions
5. **[LOW]** Consider cache TTL for long-running sessions

---

## Unresolved Questions

1. Should `location-fetcher.ts` expose an error callback for monitoring?
2. Is cache invalidation needed for this use case, or is page refresh acceptable?
3. Should the generator script handle partial failures differently (continue vs abort)?
