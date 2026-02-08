# Province Filter Not Working - Root Cause Analysis

**Date:** 2026-02-08 08:01
**Issue:** Province selection shows filtered UI but returns all properties instead of filtered results
**Branch:** listing72
**Reporter:** User

---

## Executive Summary

**Root Cause:** Location service `getProvinceBySlug()` returns province with `id` field (integer primary key from database), but ElasticSearch query expects `province_id` to match the nId field (string like "VN-HN"). This ID type mismatch causes the filter to fail silently.

**Impact:** Critical - Province filtering completely non-functional. Users see no filtered results when selecting province.

**Solution Priority:** P0 - Immediate fix required

---

## Data Flow Analysis

### 1. Province Selection (WORKING)
**File:** `src/components/listing/sidebar/location-selector.astro:163-175`

```typescript
// Lines 163-175
if (nId) {
  const provinceSlug = item.dataset.provinceSlug || '';

  if (provinceSlug) {
    // Navigate to province-filtered URL
    const targetUrl = `${baseUrl}/${provinceSlug}`;
    const currentUrl = window.location.pathname;

    // Check if already on this province to avoid unnecessary reload
    if (currentUrl !== targetUrl) {
      // Navigate to province page
      window.location.href = targetUrl;
    }
  }
}
```

**Status:** ✅ Working correctly
- Extracts `provinceSlug` from data attribute
- Navigates to `/mua-ban/{provinceSlug}` (e.g., `/mua-ban/ha-noi`)
- URL change confirmed

---

### 2. URL Parsing (WORKING)
**File:** `src/pages/[...slug].astro:23-33`

```typescript
// Line 33
const filters: PropertySearchFilters = parseListingUrl(slugParts, url.searchParams);
```

**File:** `src/utils/listing-url-parser.ts:47-56`

```typescript
// Parse location (arg2)
if (slugParts.length > 1) {
  const locationSlug = slugParts[1];
  if (locationSlug !== 'toan-quoc') {
    // Store slug for later resolution
    // @ts-expect-error - temporary storage
    filters._locationSlug = locationSlug;
  }
}
```

**Status:** ✅ Working correctly
- Correctly extracts `locationSlug` from URL second segment
- Stores in `filters._locationSlug` for later resolution
- Example: `/mua-ban/ha-noi` → `_locationSlug = "ha-noi"`

---

### 3. Province ID Resolution (BROKEN - ROOT CAUSE)
**File:** `src/pages/[...slug].astro:35-45`

```typescript
// Resolve location slug to IDs if present
// @ts-expect-error - temp storage from parser
const locationSlug = filters._locationSlug;
if (locationSlug) {
  const province = await getProvinceBySlug(locationSlug);
  if (province) {
    filters.provinceIds = [province.id];  // ❌ WRONG: Using database PK instead of nId
  }
  // @ts-expect-error - cleanup
  delete filters._locationSlug;
}
```

**File:** `src/services/location/location-service.ts:153-194`

```typescript
export async function getProvinceBySlug(slug: string): Promise<Province | null> {
  const rows = await db.select({
    id: locations.id,        // ❌ Database primary key (integer)
    nId: locations.nId,      // ✅ This is what we need (string like "VN-HN")
    name: locations.nName,
    slug: locations.nSlug,
  })
  // ...
  return {
    id: rows[0].id,          // Returns wrong ID
    nId: rows[0].nId || '',  // Correct ID available but not used
    // ...
  };
}
```

**Status:** ❌ CRITICAL BUG IDENTIFIED

**Problem:**
- `province.id` = Database integer primary key (e.g., 123)
- `province.nId` = Elasticsearch-compatible string ID (e.g., "VN-HN")
- Code uses `province.id` when it should use `province.nId`

**Evidence:**
```typescript
filters.provinceIds = [province.id];  // Sets to [123]
// Should be:
filters.provinceIds = [province.nId]; // Should be ["VN-HN"]
```

---

### 4. ElasticSearch Query Building (EXPECTING WRONG DATA)
**File:** `src/services/elasticsearch/query-builder.ts:56-65`

```typescript
// Location filters - districts take priority over provinces
if (districtIds.length > 0) {
  must.push({
    terms: { district_id: districtIds }
  });
} else if (provinceIds.length > 0) {
  must.push({
    terms: { province_id: provinceIds }  // Expects string IDs like "VN-HN"
  });
}
```

**Status:** ⚠️ Working as designed, but receives wrong input

**Expected Input:** `provinceIds = ["VN-HN"]`
**Actual Input:** `provinceIds = [123]` (integer database PK)

**ElasticSearch Query Generated:**
```json
{
  "bool": {
    "must": [
      { "term": { "transaction_type": 1 } },
      { "terms": { "province_id": [123] } }  // ❌ Wrong - doesn't match ES data
    ]
  }
}
```

**ElasticSearch Document Structure:**
```json
{
  "province_id": "VN-HN",  // String nId
  "district_id": "VN-HN-HBT",
  // ...
}
```

**Result:** No match because `123 !== "VN-HN"`

---

## Type Mismatch Evidence

### Database Schema
```typescript
// Province record in database:
{
  id: 123,              // Integer primary key
  nId: "VN-HN",         // String identifier for ES
  name: "Hà Nội",
  slug: "ha-noi"
}
```

### ElasticSearch Document
```typescript
// Property document in ES:
{
  "province_id": "VN-HN",  // Expects string nId, not integer id
  "city_name": "Hà Nội",
  // ...
}
```

### Current Bug
```typescript
// Wrong:
filters.provinceIds = [province.id];     // [123]

// Correct:
filters.provinceIds = [province.nId];    // ["VN-HN"]
```

---

## Testing Strategy

### Manual Test Steps
1. Navigate to `/mua-ban`
2. Open browser DevTools → Network tab
3. Select province "Hà Nội" from dropdown
4. Verify URL changes to `/mua-ban/ha-noi`
5. Check ElasticSearch request payload in Network tab
6. Verify filter contains `{ "terms": { "province_id": ["VN-HN"] } }`
7. Verify results are filtered

### Expected Results (After Fix)
- URL: `/mua-ban/ha-noi`
- ES Query: `{ "terms": { "province_id": ["VN-HN"] } }`
- Results: Only properties in Hà Nội province

### Current Results (Broken)
- URL: `/mua-ban/ha-noi` ✅
- ES Query: `{ "terms": { "province_id": [123] } }` ❌
- Results: No matches (returns 0 or all properties) ❌

---

## Solution

### Fix Location
**File:** `src/pages/[...slug].astro:35-45`

### Current Code (BROKEN)
```typescript
const locationSlug = filters._locationSlug;
if (locationSlug) {
  const province = await getProvinceBySlug(locationSlug);
  if (province) {
    filters.provinceIds = [province.id];  // ❌ Wrong field
  }
  delete filters._locationSlug;
}
```

### Fixed Code
```typescript
const locationSlug = filters._locationSlug;
if (locationSlug) {
  const province = await getProvinceBySlug(locationSlug);
  if (province) {
    filters.provinceIds = [province.nId];  // ✅ Use nId instead of id
  }
  delete filters._locationSlug;
}
```

### Change Summary
- **Line 41:** Change `province.id` to `province.nId`
- **Reasoning:** ElasticSearch `province_id` field stores nId strings, not database integer PKs

---

## Verification Steps After Fix

1. **Code Verification**
   ```bash
   # Check the fix is applied
   grep -n "provinceIds = \[province" src/pages/[...slug].astro
   # Should show: filters.provinceIds = [province.nId];
   ```

2. **Browser Testing**
   - Navigate to `/mua-ban`
   - Select "Hà Nội" province
   - Open DevTools Network tab
   - Find ElasticSearch POST request to `/_search`
   - Verify payload contains `"province_id": ["VN-HN"]`
   - Verify results count changes to show only Hanoi properties

3. **Console Verification**
   ```javascript
   // Add temporary console.log before fix to confirm
   console.log('Province filter:', { id: province.id, nId: province.nId });
   console.log('Setting provinceIds to:', [province.nId]);
   ```

4. **Expected Behavior**
   - Selecting "Hà Nội" → Shows only Hanoi properties
   - Selecting "Hồ Chí Minh" → Shows only HCM properties
   - Selecting "Tất cả tỉnh thành" → Shows all properties

---

## Related Issues

### Similar Bug Pattern - District Filter
**Location:** Same file pattern likely exists for district filtering

**Recommendation:** Audit district ID resolution in the same file:
```typescript
// Check if similar bug exists for districts
// File: src/pages/[...slug].astro
// Look for district resolution that might use .id instead of .nId
```

### Type Safety Improvement
**Recommendation:** Update TypeScript types to make this error impossible:

```typescript
// src/services/elasticsearch/types.ts
export interface PropertySearchFilters {
  provinceIds?: string[];  // ✅ Enforce string type instead of number[]
  districtIds?: string[];  // ✅ Enforce string type instead of number[]
}
```

This type change would have caused compile error, catching bug earlier.

---

## Prevention Measures

1. **Type System Enhancement**
   - Change `provinceIds` and `districtIds` from `number[]` to `string[]` in TypeScript types
   - Add JSDoc comments explaining nId vs id difference

2. **Code Documentation**
   ```typescript
   /**
    * Get province by slug for filtering
    * @returns Province with nId (ES-compatible string ID, NOT database integer PK)
    */
   export async function getProvinceBySlug(slug: string): Promise<Province | null>
   ```

3. **Unit Tests**
   ```typescript
   test('Province filter uses nId for ES query', async () => {
     const filters = parseListingUrl(['mua-ban', 'ha-noi'], new URLSearchParams());
     const province = await getProvinceBySlug('ha-noi');
     expect(filters.provinceIds).toEqual([province.nId]); // Not province.id
     expect(typeof filters.provinceIds[0]).toBe('string'); // Must be string
   });
   ```

4. **Monitoring**
   - Add logging to track when province filters return 0 results
   - Alert when filter applied but no change in result count

---

## Impact Assessment

### Before Fix
- ❌ Province filtering completely non-functional
- ❌ Users cannot filter by location
- ❌ 100% of province filter queries return wrong results
- ❌ Silent failure - no error messages

### After Fix
- ✅ Province filtering works correctly
- ✅ ElasticSearch receives correct nId values
- ✅ Results properly filtered by selected province
- ✅ User experience restored

### Estimated Fix Time
- **Code change:** 1 minute (one line)
- **Testing:** 5 minutes
- **Deployment:** Standard deployment cycle
- **Total:** <10 minutes

---

## Unresolved Questions

1. Does district filtering have the same bug? (Need to audit district resolution code)
2. Are there other places where `province.id` is used instead of `province.nId`?
3. Should we add runtime validation to detect ID type mismatches?
4. Should ES query builder validate that provinceIds are strings, not numbers?
