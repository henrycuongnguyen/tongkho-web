# Elasticsearch V1 Implementation Report

**Date:** 2026-02-06
**Analysis Scope:** tongkho_v1 folder - Real Estate & Project search implementation

---

## Executive Summary

Tongkho V1 uses Elasticsearch for high-performance real estate and project searching. Two separate indices (`real_estate`, `project`) handle different entity types. Implementation uses direct HTTP API with ApiKey auth via `requests` library. Search queries built dynamically from API filters, no traditional analyzers defined in codebase.

---

## Index Inventory

### 1. Real Estate Index
- **URL:** `https://elastic.tongkhobds.com/real_estate/_search`
- **Primary Use:** Property listings search (for-sale/rental)
- **Key Entity Fields:**
  - `id` (identifier, stored in _source)
  - `slug` (required, existence check: `{"exists": {"field": "slug"}}`)
  - `aactive` (activation flag, term: boolean)
  - `title`, `post`, `description`, `html_content` (text content)

### 2. Project Index
- **URL:** `https://elastic.tongkhobds.com/project/_search`
- **Primary Use:** Developer projects search
- **Parent-Child:** Links to `real_estate` via project filters
- **Activation:** `aactive` boolean field (filters parent_id=None for top-level projects)

---

## Field Mappings & Types

### Real Estate Core Fields
```
Basic Info:
  - title: string (required)
  - slug: string (searchable, filtered)
  - source_post: string (term filter: 'cms', etc.)
  - property_type_id: string (term/terms filter)
  - status_id: string (term filter, default exclude '3')
  - is_verified: boolean (term filter)
  - is_featured: boolean (term filter, context-aware)

Location:
  - city_id: string (terms filter)
  - district_id: string (terms filter, expanded via LocationHandler)
  - ward_id: string (terms filter, expanded)
  - street: reference/string (terms filter)
  - street_name: string (match_phrase filter)
  - latlng_parsed: geo_point (geo_distance filter)

Pricing:
  - price: bigint (range filter, sort: asc/desc)
  - min_price: bigint (range filter, existence check)
  - price_per_meter: integer

Physical:
  - area: float (range filter, existence check, sort: asc/desc)
  - bedrooms: integer (term filter)
  - bathrooms: integer (term filter)
  - house_direction: string (term filter)
  - balcony_direction: string (term filter)

Timestamps:
  - created_time: datetime (range filter, sort: desc default)
  - created_on: datetime (ISO format)
  - updated_on: datetime
  - created_time_updated: script field (UTC+7 formatted)

Transaction:
  - transaction_type: string (term filter: '1'=buy/sell, '2'=rent, '3'=project)
```

### Project Core Fields
```
Basic:
  - project_name: string
  - project_code: string (lowercase in ES, terms filter)
  - slug: string
  - aactive: boolean

Location:
  - city_id, district_id, ward_id: strings
  - latitude, longitude: strings
  - parent_id: reference (filters top-level only: parent_id==None)

Media:
  - main_image: text (URL)
  - gallery_images: text (JSON array of URLs)
```

---

## Search Query Patterns

### Query Builder: `_build_elasticsearch_query()`
- **Base Condition:** `aactive=True` + `slug exists`
- **Query Type:** Bool query with must/must_not/should/filter clauses
- **Pagination:** `from`/`size` parameters (max 1000 when geo-filtering)
- **Sort:** Default by `created_time desc`, customizable (price, area)

### Key Filter Patterns

#### Project Code Filter
```json
{
  "terms": {"project": ["lowercase_project_codes"]}
}
```
Note: Lowercasing applied at query-build time. Multi-level projects expanded via `get_list_project_child()`.

#### Geolocation Filter
```json
{
  "geo_distance": {
    "distance": "5km",
    "latlng_parsed": {"lat": lat_val, "lon": lng_val}
  }
}
```
- Field: `latlng_parsed` (geo_point type)
- Default radius: 5km (configurable via zoom-level config table)
- Radius priority: request param > zoom config > default 5km

#### Location Hierarchy (OR Logic)
```json
{
  "bool": {
    "should": [
      {"terms": {"city_id": [...]}},
      {"terms": {"district_id": [...]}},
      {"terms": {"ward_id": [...]}}
    ],
    "minimum_should_match": 1
  }
}
```
District/ward IDs expanded via `LocationHandler.locations_old_new()` (migration handling).

#### Time-Based Filters
```json
{
  "range": {"created_time": {
    "gte": "2025-08-06T...",  // 6 months ago
    "lt": "2026-02-06T..."    // now
  }}
}
```
- Check: `check_six_months=True` parameter
- Excludes future-dated listings

#### Featured Logic (Complex)
```json
{
  "bool": {
    "should": [
      {"must": [
        {"term": {"source_post": "cms"}},
        {"term": {"is_featured": true}}
      ]},
      {"bool": {
        "must_not": [{"term": {"source_post": "cms"}}],
        "should": [
          {"term": {"is_featured": false}},
          {"must_not": [{"exists": {"field": "is_featured"}}]}
        ]
      }}
    ]
  }
}
```
CMS posts must have `is_featured=true`; non-CMS default to unfeatured.

#### Status Condition
```json
{
  "bool": {
    "should": [
      {"bool": {"must_not": {"term": {"status_id": "3"}}}},
      {"bool": {"must_not": {"exists": {"field": "status_id"}}}}
    ]
  }
}
```
Excludes status "3" (deleted/inactive).

---

## Analyzers & Tokenizers

**No custom analyzers found in codebase.** Uses ES defaults:
- `match_phrase` on `street_name` (exact multi-word match)
- `terms` for exact token matching (city_id, district_id, etc.)
- String fields: likely `standard` analyzer by default

---

## Script Fields

### Computed Field: `created_time_updated`
```json
{
  "script": {
    "lang": "painless",
    "source": "ZonedDateTime t = ZonedDateTime.parse(doc['created_time'].value.toString());\nreturn t.plusHours(7).format(DateTimeFormatter.ofPattern(\"yyyy-MM-dd HH:mm:ss\"));"
  }
}
```
- Converts UTC timestamps to Vietnam time (UTC+7)
- Used for display in search results
- Format: `yyyy-MM-dd HH:mm:ss`

---

## Data Synchronization Strategy

### Real-Time Sync (Post-Create)
1. **Create real_estate record in DB**
2. **Call `process_real_estate_batch(id)`** → generates `real_estate_code`
3. ES index implicitly synced (auto-index likely configured externally)

### Batch Processing
- **Location Mapping Sync:** `map_real_estate_locations()` (api.py:1762+)
  - Batch size: 2000-20000 records
  - Parallel workers: available via ThreadPoolExecutor
  - Updates `city_id`, `district_id`, `ward_id` fields
  - Pagination via `from`/`size`

- **Real Estate Code Generation:** `_process_real_estate_batch(records)`
  - Generates: `{prefix}{province_code}{property_type}{id}`
  - Prefix: 'M'=buy/sell, 'T'=rent
  - Province code: mapped from city name (config table lookup)

### Sync Mechanism
- **No explicit ES bulk API calls found** in Python code
- **Inference:** ES likely configured to listen to DB changes or backend handles indexing separately
- **DB-ES Latency:** Likely near real-time, possible eventual consistency

---

## Query Response Format

### Result Conversion: `_convert_es_result_to_dal_format()`
- **Converts ES hits to DAL-like objects** (web2py compatibility)
- **Field Transformations:**
  - `latlng` dict → `"lat,lon"` string format
  - `created_on`, `created_time` (ISO) → naive datetime (remove timezone)
  - Fallback: preserve original if conversion fails

### Response Payload
```json
{
  "hits": {
    "total": {"value": N},
    "hits": [
      {
        "_id": "...",
        "_source": {
          "id": 123,
          "slug": "...",
          "title": "...",
          ...
        },
        "fields": {
          "created_time_updated": ["2026-02-06 17:30:00"]
        }
      }
    ]
  }
}
```

---

## Performance Considerations

### Query Optimization
1. **Geo-filtering:** Capped at 1000 results for distance queries
2. **Pagination:** Standard from/size (default 10-100)
3. **Field Exclusion:** `_source: ["id"]` for ID-only queries
4. **Track Total:** `track_total_hits=True` for accurate counts

### Scalability Notes
- **Two separate indices:** Allows independent scaling
- **Exists checks:** Prevent missing-field matches
- **Location expansion:** Handled in query-build (no ES aggregations)
- **Batch sync:** Supports parallel workers for large updates

---

## Authentication & Security

- **Auth Type:** ApiKey (Elasticsearch 7.x+)
- **Header:** `Authorization: ApiKey [BASE64_ENCODED_KEY]`
- **Transport:** HTTPS (elastic.tongkhobds.com)
- **API Keys stored in:** `real_estate_handle.py:43-46` (hardcoded - security concern)

---

## Known Issues & Gaps

1. **Hardcoded credentials** in `real_estate_handle.py` lines 43-46
2. **No explicit error recovery** for ES timeout (returns raw error dict)
3. **Location ID expansion** depends on external `LocationHandler` - potential N+1 lookups
4. **No circuit breaker** for ES failures (fallback to DB?)
5. **Date parsing fragile:** Assumes ISO format with 'T' separator
6. **String type assumption:** All location IDs stored as strings in ES (inconsistent with DB refs)

---

## Integration Points

- **Controllers:** `real_estate_handle.py`, `api.py`
- **Models:** `datatables.py` (schema definition)
- **Modules:** `location_handler.py` (ID expansion), `gh_search.py` (search UI)
- **API Endpoints:** Real estate search, project search, location mapping

---

## Unresolved Questions

1. How is data synced to ES? (Real-time indexing, ETL pipeline, or background job?)
2. Does `latlng_parsed` mapping exist in ES index definition, or is it auto-mapped?
3. What is the `aactive` field naming convention (double-'a' typo or intentional)?
4. Is there a fallback search to DB if ES is unavailable?
5. What is the current ES version and index refresh rate?
6. Are there index aliases or blue-green deployments?
