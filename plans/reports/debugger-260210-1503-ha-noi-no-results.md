# Debug Report: /mua-ban/ha-noi Returns No Results

**Date:** 2026-02-10 15:03
**Branch:** listing72ui
**Issue:** URL `/mua-ban/ha-noi` returns 0 results in v2, works in v1

---

## Root Cause Identified

**Province ID format mismatch between database and Elasticsearch index**

### Evidence

1. **Database Query (locations table)**
   - Location slug 'ha-noi' resolves correctly
   - Returns nId: `'01'`
   - Type: province (TinhThanh)
   - Status: active

2. **URL Parsing & Filter Construction**
   ```javascript
   locationSlugs: ['ha-noi']
   resolvedLocations: [{ nId: '01', name: 'Hà Nội', slug: 'ha-noi', type: 'province' }]
   selectedLocation: { nId: '01', name: 'Hà Nội', slug: 'ha-noi', type: 'province' }
   filters.provinceIds: ['01']
   ```

3. **Elasticsearch Query Sent**
   ```json
   {
     "query": {
       "bool": {
         "must": [
           { "term": { "transaction_type": 1 } },
           { "terms": { "province_id": ["01"] } }
         ],
         "filter": [{ "term": { "aactive": true } }]
       }
     }
   }
   ```

4. **ES Response**
   - Total hits: 0
   - Query executed successfully but no matches

### Format Mismatch

**Database locations.nId format:** `'01'` (2-digit string)

**ES PropertyDocument expected format (from types.ts comments):**
```typescript
province_id?: string; // String nId (e.g., "VN-HN") for ES compatibility
district_id?: string; // String nId (e.g., "VN-HN-HBT") for ES compatibility
```

**Actual ES index format:** Unknown - need to verify if ES uses:
- Option A: `'01'` (same as DB) - should work but doesn't
- Option B: `'VN-HN'` (international format) - mismatch
- Option C: Numeric `1` instead of string `'01'` - type mismatch
- Option D: Different province identifier

---

## Investigation Path

### Code Flow Traced

1. URL `/mua-ban/ha-noi` parsed ✅
2. Transaction type extracted: `1` (mua-ban) ✅
3. Location slug extracted: `'ha-noi'` ✅
4. NOT mistaken for property type ✅
5. `resolveLocationSlugs(['ha-noi'])` called ✅
6. Database query successful ✅
7. Province filter set: `provinceIds: ['01']` ✅
8. ES query built correctly ✅
9. ES query executed ✅
10. **ES returns 0 results** ❌

### Files Analyzed

- `src/pages/[...slug].astro` - URL handling & filter setup
- `src/utils/listing-url-parser.ts` - URL parsing logic
- `src/services/location/location-service.ts` - Location resolution
- `src/services/elasticsearch/query-builder.ts` - ES query construction
- `src/services/elasticsearch/property-search-service.ts` - ES API client
- `src/services/elasticsearch/types.ts` - Type definitions

---

## Recommended Solutions

### Solution 1: Check ES Index Mapping (Verify First)

Query ES directly to check actual province_id format in index:

```bash
curl -X GET "${ES_URL}/real_estate/_search" \
  -H "Authorization: ApiKey ${ES_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": { "match_all": {} },
    "size": 5,
    "_source": ["province_id", "district_id", "city_name"]
  }'
```

### Solution 2: Transform nId Before ES Query

If ES uses different format, add transformation in query builder:

**File:** `src/services/elasticsearch/query-builder.ts`

```typescript
// Location filters - transform nId format if needed
if (districtIds.length > 0) {
  // Check if ES uses prefixed format (VN-HN-XXX)
  const transformedIds = districtIds.map(id =>
    id.startsWith('VN-') ? id : `VN-XX-${id}`
  );
  must.push({ terms: { district_id: transformedIds } });
} else if (provinceIds.length > 0) {
  // Check if ES uses prefixed format (VN-HN)
  const transformedIds = provinceIds.map(id =>
    id.startsWith('VN-') ? id : `VN-${id}`
  );
  must.push({ terms: { province_id: transformedIds } });
}
```

### Solution 3: Fix ES Index Data

If ES index has wrong data format, reindex with correct province_id values matching DB nId.

### Solution 4: Use V1-Compatible Query

Check v1 source code for actual query format used. May use different field (city vs province_id).

---

## Next Steps

1. **IMMEDIATE:** Query ES index directly to verify province_id format
2. Compare ES document structure with v1 implementation
3. Check if v1 uses `city_id` instead of `province_id`
4. Implement appropriate transformation or field mapping
5. Test with multiple provinces (HCM: '79', Da Nang: '48')
6. Verify district-level filtering works correctly

---

---

## FINAL ROOT CAUSE (CONFIRMED)

**Elasticsearch index has NO `province_id` field!**

### ES Document Structure Found

```json
{
  "id": 6304198,
  "title": "Thuê nhà Đại Cồ Việt...",
  "province_id": undefined,  ← MISSING!
  "district_id": "01007",    ← EXISTS
  "city": "Hà Nội",          ← Text field only
  "district": "Quận Hai Bà Trưng"
}
```

### Why It Fails

1. v2 code tries to filter by `province_id: ['01']`
2. ES index has `province_id: undefined` for all docs
3. Terms query `{ terms: { province_id: ["01"] } }` matches 0 docs
4. Query succeeds but returns empty results

### Why v1 Works

v1 likely uses:
- District-level filtering only (district_id exists)
- Text-based city field matching
- OR aggregates results across all districts in province

---

## Fix Required

**Option 1: Query by District IDs (Recommended)**

When user selects province, query ALL districts in that province:

```typescript
// In [...slug].astro
if (selectedLocation.type === 'province') {
  // Get all districts for this province
  const districts = await getDistrictsByProvinceNId(selectedLocation.nId);
  filters.districtIds = districts.map(d => d.nId);
  // DON'T set provinceIds - field doesn't exist in ES
}
```

**Option 2: Use city Text Match (Fallback)**

```typescript
if (selectedLocation.type === 'province') {
  // Add to query builder
  filters.cityName = selectedLocation.name; // "Hà Nội"
}

// In query-builder.ts
if (filters.cityName) {
  must.push({ match: { city: filters.cityName } });
}
```

**Option 3: Reindex ES with province_id (Long-term)**

Add province_id field to ES documents during indexing.

---

## Unresolved Questions

- Does v1 aggregate districts or use city text match?
- Should we reindex ES with province_id field?
- Performance impact of querying 30+ district IDs vs single province?
