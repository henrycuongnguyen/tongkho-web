# V1 Elasticsearch Schema Reference

**Elasticsearch Cluster:** https://elastic.tongkhobds.com
**Authentication:** ApiKey (header-based)
**Total Indexes:** 3 (real_estate, project, locations)
**Document Date:** 2026-02-06

---

## Quick Navigation

1. [Index Overview](#index-overview)
2. [Real Estate Index](#real-estate-index)
3. [Project Index](#project-index)
4. [Locations Index](#locations-index)
5. [Search Query Patterns](#search-query-patterns)
6. [Script Fields](#script-fields)
7. [Data Synchronization](#data-synchronization)
8. [Performance & Security](#performance--security)

---

## Index Overview

| Index Name | URL | Primary Use | Total Fields |
|------------|-----|------------|--------------|
| `real_estate` | `/real_estate/_search` | Property listings (buy/rent) | 40+ |
| `project` | `/project/_search` | Developer projects | 15+ |
| `locations` | `/locations/_search` | Geographic areas (autocomplete) | 8+ |

**Multi-Index Queries:** Often queried together:
```
GET /locations,project/_search
GET /real_estate/_search
```

---

## Real Estate Index

### Core Purpose
High-performance property search with complex filters: geo-distance, price ranges, property types, location hierarchies, and featured logic.

### Base Condition
All queries must include:
```json
{
  "bool": {
    "must": [
      {"term": {"aactive": true}},
      {"exists": {"field": "slug"}}
    ]
  }
}
```

**Rationale:** Ensure only active, complete listings are returned.

---

### Field Mapping

#### Basic Property Information
| Field | Type | Example | Filters |
|-------|------|---------|---------|
| `id` | integer | 12345 | term (ID lookup) |
| `slug` | keyword | "can-ho-cao-cap-ha-noi" | term, exists check |
| `title` | text | "Căn hộ cao cấp tại Hà Nội" | match (search) |
| `aactive` | boolean | true/false | term (status) |
| `source_post` | keyword | "cms", "internal", "api" | term (origin filter) |
| `is_verified` | boolean | true/false | term (badge) |
| `is_featured` | boolean | true/false | term (conditional logic) |

---

#### Property Classification
| Field | Type | Example | Filters |
|-------|------|---------|---------|
| `property_type_id` | keyword | "1", "2", "3" | terms (multi-select) |
| `status_id` | keyword | "1", "2", "3" | term (exclude "3"=inactive) |
| `transaction_type` | keyword | "1", "2", "3" | term ("1"=buy/sell, "2"=rent, "3"=project) |

---

#### Location Hierarchy
| Field | Type | Example | Filters |
|-------|------|---------|---------|
| `city_id` | keyword | "1" | terms (multi-city) |
| `district_id` | keyword | "101" | terms (expanded via LocationHandler) |
| `ward_id` | keyword | "10101" | terms (expanded via LocationHandler) |
| `street` | keyword | "Phạm Văn Đồng" | term (exact match) |
| `street_name` | text | "Phạm Văn Đồng" | match_phrase (multi-word) |
| `latlng_parsed` | geo_point | {"lat": 21.05, "lon": 105.81} | geo_distance |

**Location Expansion:** District/ward IDs expanded at query-build time via `LocationHandler.locations_old_new()`.

---

#### Pricing & Area
| Field | Type | Example | Filters |
|-------|------|---------|---------|
| `price` | long | 5500000000 | range (min/max) |
| `min_price` | long | 5000000000 | range, exists check |
| `price_per_meter` | integer | 45700000 | range (optional) |
| `area` | float | 120.5 | range (min/max), exists check |

**Price Precision:** Stored in smallest unit (VND). Display logic: billions (tỷ), millions (triệu).

---

#### Physical Attributes
| Field | Type | Example | Filters |
|-------|------|---------|---------|
| `bedrooms` | integer | 3 | term, range |
| `bathrooms` | integer | 2 | term, range |
| `house_direction` | keyword | "east", "north" | term |
| `balcony_direction` | keyword | "south" | term |
| `floor_number` | integer | 15 | range |
| `basement` | boolean | true | term |

---

#### Temporal Fields
| Field | Type | Example | Filters |
|-------|------|---------|---------|
| `created_time` | date | "2026-01-15T08:30:00Z" | range, sort (default: desc) |
| `created_on` | date | "2026-01-15T08:30:00Z" | range (ISO format) |
| `updated_on` | date | "2026-02-05T14:20:00Z" | range (last modification) |
| `created_time_updated` | text | "2026-01-15 15:30:00" | script field (Vietnam time) |

**Script Field:** Converts UTC to UTC+7 format for display.

---

#### Content
| Field | Type | Max Size | Usage |
|-------|------|----------|-------|
| `post` | text | - | Short description |
| `description` | text | - | Medium content |
| `html_content` | text | - | Full HTML (if available) |

---

#### Media
| Field | Type | Example |
|-------|------|---------|
| `thumbnail_image` | keyword | URL to primary image |
| `images` | array (keyword) | [url1, url2, url3, ...] |

---

### Search Query Patterns

#### 1. Full-Text Search (Keyword)
```json
{
  "bool": {
    "must": [
      {
        "multi_match": {
          "query": "căn hộ Cầu Giấy",
          "fields": ["title", "description", "address"]
        }
      }
    ]
  }
}
```

---

#### 2. Location Hierarchy Filter
```json
{
  "bool": {
    "should": [
      {"terms": {"city_id": ["1", "2"]}},
      {"terms": {"district_id": ["101", "102"]}},
      {"terms": {"ward_id": ["10101", "10102"]}}
    ],
    "minimum_should_match": 1
  }
}
```

**Logic:** City OR District OR Ward (OR clause for flexible location search).

---

#### 3. Geo-Distance Filter
```json
{
  "geo_distance": {
    "distance": "5km",
    "latlng_parsed": {
      "lat": 21.0285,
      "lon": 105.8542
    }
  }
}
```

**Configuration:** Default 5km, customizable via zoom-level config table or request parameter.
**Result Cap:** Geo queries limited to 1000 results for performance.

---

#### 4. Price Range Filter
```json
{
  "range": {
    "price": {
      "gte": 5000000000,
      "lte": 10000000000
    }
  }
}
```

**Alternative:** Range on `min_price` when max price unavailable.

---

#### 5. Area Range Filter
```json
{
  "range": {
    "area": {
      "gte": 50,
      "lte": 150
    }
  }
}
```

---

#### 6. Property Type Filter
```json
{
  "terms": {
    "property_type_id": ["1", "2", "3"]
  }
}
```

**Common Types:** apartment (1), house (2), villa (3), land (4), office (5), shop (6).

---

#### 7. Featured Logic (Complex)
```json
{
  "bool": {
    "should": [
      {
        "bool": {
          "must": [
            {"term": {"source_post": "cms"}},
            {"term": {"is_featured": true}}
          ]
        }
      },
      {
        "bool": {
          "must_not": [
            {"term": {"source_post": "cms"}}
          ],
          "should": [
            {"term": {"is_featured": false}},
            {"bool": {"must_not": [{"exists": {"field": "is_featured"}}]}}
          ]
        }
      }
    ]
  }
}
```

**Logic:**
- CMS posts: Must have `is_featured=true`
- Non-CMS posts: Default to unfeatured; featured only if explicitly set

---

#### 8. Status Filter
```json
{
  "bool": {
    "should": [
      {
        "bool": {
          "must_not": [
            {"term": {"status_id": "3"}}
          ]
        }
      },
      {
        "bool": {
          "must_not": [
            {"exists": {"field": "status_id"}}
          ]
        }
      }
    ]
  }
}
```

**Rationale:** Exclude status "3" (inactive) OR missing status field.

---

#### 9. Time-Based Filter (Recent Only)
```json
{
  "range": {
    "created_time": {
      "gte": "2025-08-06T00:00:00Z",
      "lt": "2026-02-06T00:00:00Z"
    }
  }
}
```

**Parameter:** `check_six_months=True` (6-month lookback).

---

#### 10. Project Code Filter (Parent-Child)
```json
{
  "terms": {
    "project": ["prj001", "prj002_phase1", "prj002_phase2"]
  }
}
```

**Multi-Level Expansion:** `get_list_project_child()` flattens hierarchy before query.
**Case Handling:** Project codes lowercased at query-build time.

---

### Result Pagination
```json
{
  "from": 0,
  "size": 20,
  "track_total_hits": true
}
```

**Constraints:**
- Default size: 10-100 per request
- Geo-distance: Max 1000 results per query
- Offset: Unlimited (can paginate deep results)

---

### Sort Options
| Sort Field | Direction | Default | Use Case |
|-----------|-----------|---------|----------|
| `created_time` | desc | YES | Newest first (default) |
| `price` | asc/desc | NO | Price range search |
| `area` | asc/desc | NO | Size filtering |
| `bedrooms` | asc | NO | Room count |

---

## Project Index

### Core Purpose
Search and filter developer projects (residential, commercial developments). Parent-child relationships for multi-phase projects.

### Key Fields

| Field | Type | Example | Filters |
|-------|------|---------|---------|
| `id` | integer | 567 | term (ID) |
| `project_name` | text | "The Grand Manhattan" | match (search) |
| `project_code` | keyword | "GRM-HN-2025" | terms (lowercase) |
| `slug` | keyword | "the-grand-manhattan" | term |
| `aactive` | boolean | true | term |
| `city_id`, `district_id`, `ward_id` | keyword | "1", "101", "10101" | terms |
| `latitude`, `longitude` | keyword (text) | "21.0285", "105.8542" | (for display, not filtering) |
| `parent_id` | keyword | "567" | null for top-level projects |
| `main_image` | text | "https://..." | (display) |
| `gallery_images` | array (text) | [url1, url2, ...] | (display) |

---

### Project Query Pattern
```json
{
  "bool": {
    "must": [
      {"term": {"aactive": true}},
      {"term": {"parent_id": null}}
    ]
  }
}
```

**Filter:** Top-level projects only (`parent_id=null`); exclude child phases.

---

## Locations Index

### Core Purpose
Geographic autocomplete and area lookup. Used for:
1. City/district/ward autocomplete in search UI
2. Combined queries: `GET /locations,project/_search`
3. Address prediction

### Key Fields

| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| `id` | integer | 1, 101, 10101 | Location identifier |
| `n_name` | text | "Hà Nội", "Cầu Giấy" | Display name |
| `n_slug` | keyword | "ha-noi", "cau-giay" | URL-friendly identifier |
| `n_level` | integer | 1, 2, 3, 4 | Hierarchy level (1=city, 2=district, 3=ward, 4=street) |
| `n_parentid` | integer | null, 1, 101 | Parent location (null for level 1) |
| `n_normalizedname` | text | "hanoi", "caugiay" | Case/accent normalized (search) |

---

### Locations Query Pattern
```json
{
  "bool": {
    "must": [
      {
        "multi_match": {
          "query": "hà",
          "fields": ["n_name", "n_normalizedname"],
          "type": "match_phrase_prefix"
        }
      }
    ]
  }
}
```

**Use Case:** Autocomplete as user types city/district/ward name.

---

### Hierarchy Query
```json
{
  "bool": {
    "must": [
      {"term": {"n_parentid": 1}},
      {"term": {"n_level": 2}}
    ]
  }
}
```

**Result:** All districts in city ID=1.

---

## Script Fields

### computed: `created_time_updated`

**Purpose:** Convert UTC timestamp to Vietnam time (UTC+7) for display.

**Implementation (Painless):**
```painless
ZonedDateTime t = ZonedDateTime.parse(doc['created_time'].value.toString());
return t.plusHours(7).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
```

**Output Format:** `"2026-02-06 15:30:00"` (readable display time)

**Query Usage:**
```json
{
  "script_fields": {
    "created_time_updated": {
      "script": {
        "lang": "painless",
        "source": "..."
      }
    }
  }
}
```

---

## Data Synchronization

### Real-Time Sync (Post-Create)

**Flow:**
1. Application inserts `real_estate` record in PostgreSQL
2. Calls `process_real_estate_batch(id)` function
3. Function generates `real_estate_code` and updates DB
4. ES index **implicitly synced** (likely external configuration)

**No direct ES API calls** found in Python codebase → suggests:
- Logstash pipeline listening to DB changes
- OR external bulk indexing job
- OR ES configured for automatic index from source tables

---

### Batch Processing

#### Location Mapping Sync
**Function:** `map_real_estate_locations()` (api.py:1762+)

```
FOR each batch of 2000-20000 records:
  1. Fetch properties from ES
  2. Map old location IDs to new location IDs
  3. Update city_id, district_id, ward_id
  4. Commit changes to ES
```

**Parallelization:** ThreadPoolExecutor available for concurrent workers.

---

#### Real Estate Code Generation
**Function:** `_process_real_estate_batch(records)`

**Format:** `{prefix}{province_code}{property_type}{id}`

**Components:**
- `prefix`: 'M' (buy/sell) or 'T' (rent)
- `province_code`: 2-3 char mapped from city name (config table)
- `property_type`: 1-2 char enum code
- `id`: Database primary key

**Example:** `M6M123` (buy/sell, province 6, type M, ID 123)

---

### Sync Mechanism

| Pattern | Frequency | Scope | Latency |
|---------|-----------|-------|---------|
| Real-time (post-create) | Per insert | Single record | Near-instant |
| Batch (location mapping) | Periodic job | 2000-20000 records | Minutes |
| Fallback (if ES down) | Unknown | Unknown | TBD |

**Missing:** No explicit fallback strategy documented → queries fail if ES unavailable.

---

## Result Conversion

### ES Response → DAL Format
**Function:** `_convert_es_result_to_dal_format()`

**Transformations:**
1. `latlng` dict `{"lat": 21.05, "lon": 105.81}` → `"21.05,105.81"` (string)
2. `created_on`, `created_time` (ISO) → Remove timezone info (naive datetime)
3. Field mismatch → Preserve original value (fallback)

**Response Structure:**
```json
{
  "hits": {
    "total": {"value": 250},
    "hits": [
      {
        "_id": "12345",
        "_source": {
          "id": 12345,
          "slug": "property-slug",
          "title": "Property Title",
          "price": 5500000000,
          ...
        },
        "fields": {
          "created_time_updated": ["2026-02-06 15:30:00"]
        }
      }
    ]
  }
}
```

---

## Performance & Security

### Query Optimization
| Technique | Benefit | Example |
|-----------|---------|---------|
| Geo-distance cap (1000 results) | Prevent large distance scans | Radius queries limited to nearest 1000 |
| Pagination (from/size) | Memory efficient | from=0, size=20 |
| Exists checks | Skip incomplete records | `{"exists": {"field": "slug"}}` |
| Source filtering | Reduce network | `"_source": ["id", "title"]` for ID-only |

---

### Scalability Notes
- **Separate indexes:** real_estate, project, locations → independent scaling
- **Multi-index queries:** Allowed (e.g., `/locations,project/_search`)
- **Location expansion:** Client-side (before query), no ES aggregations
- **Batch sync:** Parallel workers support large update jobs

---

### Authentication & Security

| Aspect | Implementation | Risk |
|--------|-----------------|------|
| **Auth Type** | ApiKey (header-based) | ✓ Secure transport |
| **Header** | `Authorization: ApiKey [BASE64_KEY]` | ✓ Standard ES auth |
| **Transport** | HTTPS (elastic.tongkhobds.com) | ✓ Encrypted |
| **Credential Storage** | Hardcoded in `real_estate_handle.py:43-46` | ⚠️ **SECURITY CONCERN** |

**Recommendation:** Move API keys to environment variables or secrets management system.

---

### Known Issues

| Issue | Severity | Impact | Mitigation |
|-------|----------|--------|-----------|
| Hardcoded credentials | High | Key exposure if code leaked | Use env vars / secrets |
| No error recovery | Medium | Queries fail on ES timeout | Add circuit breaker + fallback |
| Location ID expansion N+1 | Medium | Performance degradation | Cache location mappings |
| No circuit breaker | Medium | Cascading failures | Implement retry logic |
| Fragile date parsing | Low | Edge case failures | Standardize ISO format |
| String location IDs (ES) vs int (DB) | Low | Type inconsistency | Standardize as strings everywhere |

---

## Integration Points

| Component | Purpose | File |
|-----------|---------|------|
| **Controllers** | Search API endpoints | `real_estate_handle.py`, `api.py` |
| **Models** | Field definitions | `datatables.py` |
| **Utilities** | Location ID expansion | `location_handler.py` |
| **UI** | Search interface | `gh_search.py` |

---

## Unresolved Questions

1. How is DB-ES sync triggered? (Logstash, scheduled job, application-level?)
2. Does `latlng_parsed` auto-map to geo_point in ES, or pre-configured?
3. What's the `aactive` field naming convention (double-'a' typo or intentional)?
4. Is there fallback search to DB if ES unavailable?
5. Current ES version and index refresh rate?
6. Are there blue-green deployment strategies for index updates?
7. What's the total storage size and replication factor?
8. How are large result sets (>1000 items) handled in geo queries?

---

**Last Updated:** 2026-02-06
**Status:** Complete
**Total Lines:** ~520
