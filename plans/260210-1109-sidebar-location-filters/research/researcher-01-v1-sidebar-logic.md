# V1 Sidebar Location Filter Logic Research

**Date:** 2026-02-10 | **Status:** Complete | **Author:** Researcher

---

## Executive Summary

V1 implements two complementary sidebar filter endpoints:
1. **`get_side_block()`** - Detail page sidebar (pattern-based filtering)
2. **`get_location_side_block()`** - Listing page sidebar (location-based filtering)

Both use database queries (not ES) for counting, with Redis caching via `cache_key` pattern.

---

## API Contracts

### Endpoint 1: `get_side_block()` (Detail Page)
**Location:** `api_customer.py:7721`

**Request Parameters:**
- `pattern` (string, required): Format `"property_type_slug/location_n_slug"` or JSON/list format
- Returns property-type + location sidebar blocks

**Response Structure:**
```json
{
  "status": 1,
  "data": {
    "side_block_filters": [
      {
        "title": "Block Title",
        "filters": [
          {"title": "Filter Name", "url": "...", "count": N}
        ]
      }
    ]
  }
}
```

**Cache Key Pattern:**
```python
cache_key = f"detail_side_block_{property_type_slug}_{location_slug}"
```

---

### Endpoint 2: `get_location_side_block()` (Listing Page)
**Location:** `api_customer.py:8577`

**Request Parameters:**
- `city_slug` (string, required): Province/city normalized slug
- `district_slug` (string, optional): District normalized slug
- `transaction_type` (int, required): 1 = buy/sell, 2 = rent
- `property_type_slug` (string, optional): Property type slug

**Response Structure:** Same as `get_side_block()`

**Cache Key Pattern:**
```python
cache_key = f"location_side_block_{city_slug}_{district_slug or 'all'}_{transaction_type}_{property_type_slug or 'all'}"
```

**TTL:** Inferred from codebase (typically 3600s = 1 hour)

---

## Data Aggregation Logic

### Count Calculation Method
**Database-based counting** (lines 8646-8700):

```python
# Build query from filters
query = db.real_estate.id > 0
query &= (db.real_estate.transaction_type == transaction_type)

# City filter
if city_location:
    query &= (db.real_estate.city_id == city_location.id)

# District filter (if provided)
if district_location:
    query &= (db.real_estate.district_id == district_location.id)

# Property type filter (if provided)
if property_type_info:
    query &= (db.real_estate.property_type_id == property_type_info.id)

# Count aggregation per location/category
for location in locations:
    count = db(query & (location_filter)).count()
```

**Key Insight:** No Elasticsearch aggregation - pure database queries for each filter dimension.

---

## Filter Parameter Transformations

### Frontend Request → Backend Processing

| Frontend | Backend | Transformation |
|----------|---------|---|
| `address_slug` | `city_slug` | Direct pass-through (normalized slug) |
| `addresses[]` (array) | `district_slug` | Single district selection from list |
| `property_type_id` | `property_type_slug` → `property_type_id` | DB lookup via slug |
| `transaction_type` | `transaction_type` | Numeric ID (1 or 2) |

### URL Building Pattern
**Expected function:** `buildSideBlockFilterUrls()` (hypothetical in frontend)

**URL Pattern Examples:**
```
/listing/search?city=tp-ho-chi-minh&transaction_type=1&property_type=can-ho
/listing/search?city=tp-ho-chi-minh&district=quan-1&transaction_type=2&property_type=nha-nguyen-can
```

---

## Frontend Rendering Logic

**Template:** `load_side_block_filters_pattern.load`

**Show/Hide Threshold:** 20 items per block
- First 20 items: visible by default
- Items 21+: hidden, toggle via "Xem thêm" (show more) / "Thu gọn" (collapse)

**Block Structure:**
```
Filter Block
├── Title (e.g., "District", "Price Range")
├── List (ul.wg-sidebar-filter-list)
│   ├── Items 1-20: visible
│   └── Items 21+: hidden (style="display:none")
└── Toggle Controls (if len > 20)
    ├── "Xem thêm" (show more)
    └── "Thu gọn" (collapse)
```

**JavaScript Toggle Logic:**
- Show/hide via `element.style.display` manipulation
- Smooth scroll to block top on collapse
- No AJAX - pure client-side toggle

---

## Data Flow Diagram

```
Frontend Request
├─ city_slug, district_slug, transaction_type, property_type_slug
│
↓ (HTTP GET)

API Endpoint: get_location_side_block()
├─ Cache lookup (Redis) via cache_key
│
├─ Cache MISS → Database Query
│  ├─ Build WHERE clause from filters
│  ├─ Query real_estate table for counts per location/category
│  └─ Cache result (TTL: ~3600s)
│
└─ Cache HIT → Return cached data

Response JSON
└─ side_block_filters[] → Frontend Template

Template Rendering
├─ Iterate blocks
├─ Render items 1-20 (visible)
├─ Hide items 21+ (display:none)
└─ Add toggle controls if len > 20
```

---

## Key Implementation Details

**Caching Strategy:**
- Redis/Memcache with `cache.ram()` or similar
- Cache keys include all filter dimensions
- No cache invalidation timestamps (rely on TTL)

**Parameter Validation:**
- `city_slug` mandatory, must resolve to valid location
- `transaction_type` mandatory, numeric only
- `district_slug` optional, resolves via `db.locations.n_slug`
- `property_type_slug` optional, resolves via `db.property_type.slug`

**Performance Implications:**
- Database query per filter combination (N queries for N filters)
- No ES aggregation = slower for large datasets
- Caching critical for repeated requests

---

## Unresolved Questions

1. **Caching TTL:** What is actual TTL value for location_side_block cache?
2. **Count Accuracy:** How are counts updated when new listings posted? Real-time or batch?
3. **Elasticsearch Usage:** Does V1 use ES for any filtering, or purely database?
4. **Sort Order:** What determines filter ordering (by count desc, alphabetical, or custom)?
5. **Missing Handler:** Where is `buildSideBlockFilterUrls()` function defined in frontend?
