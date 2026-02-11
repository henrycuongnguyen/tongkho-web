# Get Side Block API Documentation

## Overview

API endpoint để lấy sidebar filter blocks cho trang listing bất động sản. Tương thích với v1 API.

**Endpoint:** `GET /api/sidebar/get-side-block`

## Request Parameters

### Option 1: Using Pattern (Recommended)

```
GET /api/sidebar/get-side-block?pattern={property_type_slug}/{location_slug}
```

**Pattern formats:**
- `{property_type_slug}` - Chỉ loại BDS, trả về 63 tỉnh thành
- `{property_type_slug}/{province_slug}` - Trả về danh sách quận/huyện
- `{property_type_slug}/{district_slug}` - Trả về danh sách phường/xã
- `mua-ban/{location_slug}` - Tất cả BDS mua bán tại location
- `cho-thue/{location_slug}` - Tất cả BDS cho thuê tại location

### Option 2: Using ID (Backward Compatible)

```
GET /api/sidebar/get-side-block?id={property_id}
```

## Response Format

### Success Response (status: 200)

```json
{
  "status": 1,
  "data": [
    {
      "title": "Mua bán nhà đất tại Hà Nội",
      "filters": [
        {
          "title": "Quận Ba Đình (1,234)",
          "url": "/nha-dat/ba-dinh",
          "params": {
            "addresses": "ba-dinh",
            "property_types": 14,
            "transaction_type": 1
          }
        },
        {
          "title": "Quận Hoàn Kiếm (856)",
          "url": "/nha-dat/hoan-kiem",
          "params": {
            "addresses": "hoan-kiem",
            "property_types": 14,
            "transaction_type": 1
          }
        }
      ],
      "total_items": 2
    }
  ]
}
```

### Error Response

```json
{
  "status": 0,
  "message": "Không tìm thấy loại bất động sản"
}
```

## Usage Examples

### Example 1: Get Districts for Province

```bash
# Get all districts in Hà Nội for nhà đất
curl "http://localhost:3000/api/sidebar/get-side-block?pattern=nha-dat/ha-noi"
```

**Response:**
```json
{
  "status": 1,
  "data": [
    {
      "title": "Mua bán nhà đất tại Hà Nội",
      "filters": [
        { "title": "Quận Ba Đình (1,234)", "url": "/nha-dat/ba-dinh", ... },
        { "title": "Quận Hoàn Kiếm (856)", "url": "/nha-dat/hoan-kiem", ... },
        { "title": "Quận Đống Đa (992)", "url": "/nha-dat/dong-da", ... }
      ],
      "total_items": 30
    }
  ]
}
```

### Example 2: Get All Provinces

```bash
# Get all 63 provinces for căn hộ chung cư
curl "http://localhost:3000/api/sidebar/get-side-block?pattern=can-ho-chung-cu"
```

**Response:**
```json
{
  "status": 1,
  "data": [
    {
      "title": "Mua bán căn hộ chung cư",
      "filters": [
        { "title": "Hà Nội (12,345)", "url": "/can-ho-chung-cu/ha-noi", ... },
        { "title": "TP.HCM (23,456)", "url": "/can-ho-chung-cu/ho-chi-minh", ... },
        { "title": "Đà Nẵng (3,456)", "url": "/can-ho-chung-cu/da-nang", ... }
      ],
      "total_items": 63
    }
  ]
}
```

### Example 3: Get Wards for District

```bash
# Get all wards in Quận 1, TP.HCM for mua bán
curl "http://localhost:3000/api/sidebar/get-side-block?pattern=mua-ban/quan-1"
```

**Response:**
```json
{
  "status": 1,
  "data": [
    {
      "title": "Mua bán bất động sản tại Quận 1",
      "filters": [
        { "title": "Phường Bến Nghé (234)", "url": "/mua-ban/ben-nghe", ... },
        { "title": "Phường Bến Thành (189)", "url": "/mua-ban/ben-thanh", ... }
      ],
      "total_items": 10
    }
  ]
}
```

### Example 4: Cho Thuê Pattern

```bash
# Get districts in Hà Nội for rent properties
curl "http://localhost:3000/api/sidebar/get-side-block?pattern=cho-thue/ha-noi"
```

**Response:**
```json
{
  "status": 1,
  "data": [
    {
      "title": "Cho thuê bất động sản tại Hà Nội",
      "filters": [
        { "title": "Quận Cầu Giấy (567)", "url": "/cho-thue/cau-giay", ... }
      ],
      "total_items": 30
    }
  ]
}
```

## Implementation Details

### Caching

- Cache duration: **15 minutes**
- Cache key format: `pattern:{pattern}` or `id:{id}`
- In-memory cache with timestamp validation

### Performance

- Uses Elasticsearch aggregations for fast counting
- Database queries optimized with proper indexes
- Response time: ~100-300ms (with cache: ~1ms)

### Error Handling

| Status Code | Message | Cause |
|-------------|---------|-------|
| 400 | Missing required parameter: pattern or id | No params provided |
| 400 | Invalid property ID | ID is not a number |
| 400 | Pattern không hợp lệ | Pattern format is invalid |
| 400 | Pattern thiếu chi tiết | Using mua-ban/cho-thue without location |
| 404 | Không tìm thấy loại bất động sản | Property type slug not found |
| 404 | Không tìm thấy địa điểm | Location slug not found |
| 500 | Vui lòng thử lại sau | Internal server error |

### V1 Compatibility

This API is fully compatible with v1's `get_side_block` endpoint:

- Same response format (`status`, `data` structure)
- Same parameter names (`pattern`, `id`)
- Same error messages (Vietnamese)
- Same cache time (15 minutes)
- Same aggregation logic (Elasticsearch)

### Location Hierarchy

1. **Province Level** (`pattern=nha-dat/ha-noi`)
   - Returns list of districts
   - Aggregates by `district_id` in Elasticsearch
   - Adds "Quận" prefix for numeric district names

2. **District Level** (`pattern=nha-dat/ba-dinh`)
   - Returns list of wards
   - Aggregates by `ward_id` in Elasticsearch
   - Adds "Phường" prefix for numeric ward names

3. **National Level** (`pattern=can-ho-chung-cu`)
   - Returns list of 63 provinces
   - Aggregates by `city_id` in Elasticsearch
   - Only available for specific property types (not mua-ban/cho-thue)

## Integration with Frontend

### JavaScript Example

```javascript
async function loadSidebarFilters(pattern) {
  try {
    const response = await fetch(`/api/sidebar/get-side-block?pattern=${pattern}`);
    const json = await response.json();

    if (json.status !== 1) {
      console.error('Error:', json.message);
      return null;
    }

    return json.data;
  } catch (error) {
    console.error('Failed to load sidebar filters:', error);
    return null;
  }
}

// Usage
const blocks = await loadSidebarFilters('nha-dat/ha-noi');
blocks.forEach(block => {
  console.log(`Block: ${block.title}`);
  block.filters.forEach(filter => {
    console.log(`  - ${filter.title} -> ${filter.url}`);
  });
});
```

### Astro Component Example

```astro
---
const pattern = Astro.url.pathname.replace(/^\//, ''); // "nha-dat/ha-noi"
const response = await fetch(`${Astro.url.origin}/api/sidebar/get-side-block?pattern=${pattern}`);
const json = await response.json();
const blocks = json.status === 1 ? json.data : [];
---

{blocks.map(block => (
  <div class="sidebar-block">
    <h3>{block.title}</h3>
    <ul>
      {block.filters.map(filter => (
        <li>
          <a href={filter.url}>{filter.title}</a>
        </li>
      ))}
    </ul>
  </div>
))}
```

## Testing

### Manual Testing

```bash
# Test province list
curl "http://localhost:3000/api/sidebar/get-side-block?pattern=can-ho-chung-cu"

# Test district list
curl "http://localhost:3000/api/sidebar/get-side-block?pattern=nha-dat/ha-noi"

# Test ward list
curl "http://localhost:3000/api/sidebar/get-side-block?pattern=can-ho-chung-cu/quan-1"

# Test error handling
curl "http://localhost:3000/api/sidebar/get-side-block?pattern=invalid-slug"
```

### Expected Behavior

- Fast response (~100-300ms)
- Valid JSON format
- Proper error messages
- Counts formatted with thousands separator (e.g., "1,234")
- URLs properly formatted
- Cache headers present

## Troubleshooting

### No Results Returned

**Possible causes:**
1. Elasticsearch not configured properly
2. No properties exist for the filter combination
3. Location slug is incorrect

**Solution:**
- Check Elasticsearch connection in `.env`
- Verify location slugs in database
- Check property data in Elasticsearch

### Slow Performance

**Possible causes:**
1. Cache not working
2. Elasticsearch aggregation timeout
3. Database query slow

**Solution:**
- Check cache implementation
- Verify Elasticsearch indexes
- Add database indexes on `n_slug`, `n_level`, `n_parentid`

### Cache Not Working

**Symptoms:**
- Every request takes 100-300ms
- No "Cache hit" logs

**Solution:**
- Restart the dev server
- Clear cache manually if needed
- Check cache expiry time

## Future Enhancements

- [ ] Add support for property type filters
- [ ] Add support for price range filters
- [ ] Add support for area range filters
- [ ] Implement Redis cache for production
- [ ] Add rate limiting
- [ ] Add API analytics
- [ ] Support for multiple patterns in one request

## Related Files

- **Service:** `src/services/get-side-block-service.ts`
- **Aggregation:** `src/services/elasticsearch/property-aggregation-service.ts`
- **Location:** `src/services/location/location-service.ts`
- **Property Types:** `src/services/property-type-service.ts`
- **API Endpoint:** `src/pages/api/sidebar/get-side-block.ts`

## References

- V1 Implementation: `reference/tongkho_v1/controllers/api_customer.py` (line 8095)
- Elasticsearch Docs: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations.html
