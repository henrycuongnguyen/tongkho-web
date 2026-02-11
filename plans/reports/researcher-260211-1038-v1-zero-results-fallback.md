# v1 Zero Search Results & Fallback Suggestions - Research Report

**Date:** 2026-02-11 10:38 AM
**Research Focus:** How v1 (resaland) handles zero search results and generates fallback suggestions
**Reference Files:**
- `/reference/resaland_v1/views/bds/danhmuc.html` - UI template
- `/reference/resaland_v1/controllers/bds.py` - Backend logic

---

## Executive Summary

v1 implements a **three-tier fallback search strategy** that gracefully degrades search restrictions when zero results are found. Instead of showing empty results, it relaxes filters progressively and displays "Gợi ý cho bạn" (Suggestions for you) with properties matching broader criteria.

**Key Insight:** Fallback strategy prioritizes **location specificity over filter restrictions**. It keeps location constant while dropping restrictive filters.

---

## 1. Zero Results Detection

### Mechanism: `_danhmuc_logic()` Function (lines 475-729)

**Detection Point:**
```python
# Line 573-607: Main search API call
response = requests.get(api_url, params=api_params)
data = response.json()

if data.get("status") == 1:
    properties = data.get("data", {}).get("properties", [])
    # ... pagination setup ...
else:
    properties = []
    pagination = {...}  # Total = 0

# Line 613: Check if zero results
if not properties or len(properties) == 0:
    # Trigger fallback search
```

**Detection Logic:**
- Checks if API returns `status == 1` with `properties` array
- If API fails or returns no properties, `properties = []`
- Explicitly checks `if not properties or len(properties) == 0`
- **Pagination total is 0** when no results found

### Result Count Display (Template: lines 223-227)

```html
{{if pagination['total']:}}
{{count_text = ('hiện có ' if filter_text else 'Hiện có ') +
str('{:,.0f}'.format(pagination['total'])).replace(',', '.') + ' kết quả'}}
{{else:}}
{{count_text = 'Không có kết quả phù hợp'}}
{{pass}}
```

- Shows "Hiện có X kết quả" when results exist
- Shows "Không có kết quả phù hợp" (No matching results) when `pagination['total'] == 0`

---

## 2. Fallback Search Strategy: Three-Tier Relaxation

### Function: `_apply_fallback_search()` (lines 348-432)

**Three-Step Fallback Logic:**

```python
def _apply_fallback_search(api_url, api_params, limit, city_slug, fallback_page=1):
    """
    Step 1: Keep original locations, drop restrictive filters
    Step 2: If still empty, broaden to city level
    Step 3: If still empty, remove location filter (nationwide)
    """
```

#### **Step 1: Location-Specific Search (No Filter Restrictions)**
```python
# Line 413-418
if normalized_orig_locations:
    params1 = base_params.copy()
    params1['locations_slug'] = normalized_orig_locations
    props, pagi = _fetch_with_cache(params1)
    if props:
        return (props, pagi)
```

**What this does:**
- Keep user-selected location(s) from `locations_slug`
- **Remove all restrictive filters:** price range, area, bedrooms, bathrooms, property type
- Keeps only: `transaction_type`, `sort`, `page`, `limit`, `user_id`
- If this returns results → **Use these results**

**Example:**
- Original: `locations_slug=ba-dinh&minPrice=1000000000&maxPrice=2000000000&bedrooms=3&minArea=50`
- Step 1 Retry: `locations_slug=ba-dinh` (only)

#### **Step 2: City-Level Search**
```python
# Line 420-425
if city_slug:
    params2 = base_params.copy()
    params2['locations_slug'] = str(city_slug)
    props, pagi = _fetch_with_cache(params2)
    if props:
        return (props, pagi)
```

**What this does:**
- Extract city from original search (e.g., `ba-dinh` → `ha-noi`)
- Search entire city with NO filters
- If this returns results → **Use these results**

**Example:**
- Original: `locations_slug=ba-dinh`
- Step 2 Retry: `locations_slug=ha-noi` (parent city)

#### **Step 3: Nationwide Search**
```python
# Line 427-430
params3 = base_params.copy()
props, pagi = _fetch_with_cache(params3)
if props:
    return (props, pagi)
```

**What this does:**
- Remove location filter entirely
- Search **nationwide** with NO location restriction
- Keep only: `transaction_type`, `sort`, `page`, `limit`, `user_id`
- If this returns results → **Use these results**

**Fallback: Return Empty**
```python
# Line 432
return ([], {})
```
- If all three steps return no results, return empty fallback

---

## 3. Fallback Criteria Relaxation Priority

### Order of Removal (from most restrictive to least):

| Priority | Step | Criteria Removed | Kept |
|----------|------|-----------------|------|
| 1️⃣ **Most Restrictive** | Step 1 | Price, Area, Bedrooms, Bathrooms, Property Type | Location (specific), Transaction Type |
| 2️⃣ **Medium** | Step 2 | Location specificity (district → city) | Transaction Type |
| 3️⃣ **Least Restrictive** | Step 3 | Location entirely | Transaction Type only |

**Key Pattern:**
- **Never removes:** `transaction_type`, `sort`, `page`, `limit`, `user_id`
- **Always keeps as long as possible:** Location (starting specific, broadening to city, then removing)
- **Removes first:** Fine-grained filters (price, area, rooms)

### Base Parameters (Always Kept)
```python
base_params = {
    'user_id': api_params.get('user_id'),
    'page': int(fallback_page) if str(fallback_page).isdigit() else 1,
    'limit': limit,
    'transaction_type': api_params.get('transaction_type'),
    'sort': api_params.get('sort', 'new')
}
```

---

## 4. API Endpoints & Parameters

### Main Search API
**Endpoint:** `/api_customer/real_estate_v2.json`
**HTTP Method:** GET

**Query Parameters (from lines 498-567):**
```python
api_params = {
    'user_id': user_id,
    'page': page or 1,
    'limit': 24,  # limit = 24
    'transaction_type': transaction_type_id,  # 1=buy, 2=rent, 3=project
}

# Optional filters (removed in fallback steps):
api_params['minPrice']         # Removed in Step 1
api_params['maxPrice']         # Removed in Step 1
api_params['minArea']          # Removed in Step 1
api_params['maxArea']          # Removed in Step 1
api_params['locations_slug']   # Removed in Step 3
api_params['property_types']   # Removed in Step 1
api_params['radius']           # Removed in Step 1
api_params['bathrooms']        # Removed in Step 1
api_params['bedrooms']         # Removed in Step 1
api_params['sort']             # Kept through all steps
```

**Response Structure:**
```python
{
    "status": 1,  # or 0 for error
    "data": {
        "properties": [...],          # Array of property objects
        "page": 1,
        "total": 24,                  # Total matching count
        "total_pages": 1,
        "count": 24,                  # Count on current page
        "city": city_id,
        "searching_location": [...]   # Resolved location data
    }
}
```

---

## 5. Caching Strategy for Fallback Searches

### Cache Mechanism: `_fetch_with_cache()` (lines 375-400)

**Cache Key Structure:**
```python
key_struct = {
    't': params_obj.get('transaction_type'),
    'loc': _normalize_locations(params_obj.get('locations_slug') or 'all'),
    'p': params_obj.get('page', 1),
    's': params_obj.get('sort', 'new')
}
key_json = json.dumps(key_struct, sort_keys=True, ensure_ascii=False)
cache_key = f"fallback_search_{hashlib.md5(key_json.encode('utf-8')).hexdigest()}"
```

**Caching Details:**
- Cache key excludes price, area, rooms, property_types filters
- MD5 hash of transaction type + location + page + sort
- **Cache TTL:** 3600 seconds (1 hour)
- Separate cache entries for each step (different locations)

**Impact:** Step 1 results cached separately from Step 2/3, avoiding API redundancy

---

## 6. UI/UX Presentation

### Zero Results Message (Template: lines 257-258)

```html
{{if(int(pagination['total']) == 0):}}
<p class="text-1 text-center line-clamp-2 notfound_img">{{=XML(count_text)}}</p>
{{pass}}
```

**Display:**
- Centered message with CSS class `notfound_img`
- Message: "Không có kết quả phù hợp."
- Shown **above** property listing area
- **Only shows if main search has zero results**

### Suggestions Section (Template: lines 289-318)

**Only Displayed When:**
- Main search returns 0 results AND
- Fallback search returns results (`len(fallback_properties) > 0`)

**HTML Structure:**
```html
<!-- Fallback Search Results Section -->
{{if fallback_properties and len(fallback_properties) > 0:}}
<div class="fallback-results-section mt-48">
  <div class="col-12 d-md-flex d-flex justify-content-between align-items-center mb-20 p-0">
    <h2 class="title text-11 fw-6 text-color-heading">Gợi ý cho bạn</h2>
  </div>

  <div class="flat-animate-tab">
    <div class="tab-content">
      <div class="tab-pane active show" id="fallbackGridLayout" role="tabpanel">
        <div class="row">
          <div class="col-lg-12 md-col-11">
            <div class="tf-grid-layout lg-col-3 md-col-2">
              {{for item in fallback_properties:}}
              {{include 'bds/property_card.html'}}
              {{pass}}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Fallback Pagination -->
  {{pagination_temp = pagination}}
  {{pagination = fallback_pagination}}
  {{include 'components/pagination.html'}}
  {{pagination = pagination_temp}}
</div>
{{pass}}
```

**Key Features:**
- **Heading:** "Gợi ý cho bạn" (Suggestions for you) - implies relaxed criteria
- **Grid Layout:** Same `property_card.html` component as main results
- **Separate Pagination:** Uses `fallback_pagination` (not main pagination)
- **Visual Separation:** `mt-48` margin adds space between main (empty) and suggestions

### Filter Display with Zero Results (Template: lines 223-242)

```html
{{if pagination['total']:}}
  {{count_text = ('hiện có ' if filter_text else 'Hiện có ') +
  str('{:,.0f}'.format(pagination['total'])).replace(',', '.') + ' kết quả'}}
{{else:}}
  {{count_text = 'Không có kết quả phù hợp'}}
{{pass}}

{{count_text += '.'}}
{{if(int(pagination['total']) == 0):}}
  <!-- Show nothing (filters hidden) -->
{{else:}}
  <!-- Show filter text -->
  {{if filter_text:}}
    <p class="text-1 text-left line-clamp-2">{{if full_filter_text:}}<span
        title="{{=full_filter_text}}">{{=filter_text}}</span>{{else:}}{{=filter_text}}{{pass}}
      {{=XML(count_text)}}</p>
  {{else:}}
    <p class="text-1 text-left line-clamp-2">{{=XML(count_text)}}</p>
  {{pass}}
{{pass}}
```

**Behavior:**
- When zero results: Shows only "Không có kết quả phù hợp." message
- Applied filters **not displayed** when zero results
- When fallback has results: Shows suggestions **without** mentioning relaxed criteria
- Users see suggestions naturally without explicit "we changed your filters" message

---

## 7. Backend Integration Flow

### Complete Flow (from lines 434-729)

```
danhmuc() → validate_and_redirect_url()
         → _danhmuc_logic(user_id)
           → requests.get(api_url, api_params) [MAIN SEARCH]
           → if len(properties) == 0:
               → _apply_fallback_search(api_url, api_params, limit, city_slug)
                 → Step 1: Same location, no filters
                 → Step 2: City level, no filters
                 → Step 3: Nationwide, no filters
               → Set fallback_properties, fallback_pagination
           → Render with properties (main) + fallback_properties (suggestions)
```

**Key Points:**
- Fallback triggered **immediately** when main search has 0 results
- No user action needed (automatic)
- Both main and fallback rendered to template
- Template conditionally shows suggestions section

### Data Passed to Template (lines 710-729)

```python
return dict(
    property_type_slug=property_type_slug.lower() or title.lower() or '',
    district_nomolize=district_nomolize,
    slug_cate = slug,
    city_slug=city_slug,
    city_title = city_title,
    current_filter=current_filter,
    properties=properties,                    # Main search results
    pagination=pagination,                    # Main pagination
    fallback_properties=fallback_properties,  # Fallback results
    fallback_pagination=fallback_pagination,  # Fallback pagination
    title=title,
    transaction_type_id=transaction_type_id,
    # ... other data ...
)
```

---

## 8. Edge Cases & Special Handling

### Page Numbering in Fallback (lines 616)
```python
fallback_page = request.vars.fallback_page or request.vars.page or 1
```
- Uses `page` param from main search for fallback pagination
- If user is on page 2 of main search (0 results), fallback also starts at page 2
- Maintains pagination position across fallback results

### Empty Fallback Results (line 432)
```python
return ([], {})
```
- If all three steps return no results, fallback_properties = empty array
- Template **does not display** suggestions section (line 290 condition fails)
- User sees only "Không có kết quả phù hợp." message

### City Lookup Failure (line 621)
```python
get_city_slug_by_id(city_id)  # Returns empty string if not found
```
- If city_id not found or invalid, Step 2 skipped
- Fallback jumps to Step 3 (nationwide)

---

## 9. Key Implementation Insights for v2

### 1. **No Filter Messaging**
- v1 does NOT tell user "we removed filters"
- Suggestions presented as helpful alternatives
- User discovers themselves that filters were relaxed (by finding more results)

### 2. **Automatic Fallback**
- No "search again without filters" button
- No checkbox to relax criteria
- Happens silently and automatically

### 3. **Location-First Strategy**
- Respects user's location intent first
- Only removes location as last resort
- Property type (transaction_type) never removed

### 4. **Single Pagination UI**
- Main pagination hidden when 0 results
- Fallback pagination shown (reuses same component)
- No confusing dual-pagination setup

### 5. **Caching Optimization**
- Fallback searches cached separately
- Step 1 uses same cache key structure (location only)
- Prevents API spam if user retries same search

### 6. **Visual Separation**
- "Gợi ý cho bạn" heading clearly signals suggestions
- No mixing of main + fallback results
- Fallback always appears below zero-results message

---

## 10. Code Snippets with Explanations

### Snippet 1: Fallback Trigger (bds.py:613-623)
```python
# Apply fallback search if main search returns no results
fallback_properties = []
fallback_pagination = {}

if not properties or len(properties) == 0:
    fallback_page = request.vars.fallback_page or request.vars.page or 1
    fallback_properties, fallback_pagination = _apply_fallback_search(
        api_url,
        api_params,
        limit,
        get_city_slug_by_id(city_id),
        fallback_page
    )
```
**Explanation:** Checks if main search empty, triggers fallback with same page number.

### Snippet 2: Step 1 Fallback (bds.py:413-418)
```python
if normalized_orig_locations:
    params1 = base_params.copy()
    params1['locations_slug'] = normalized_orig_locations
    props, pagi = _fetch_with_cache(params1)
    if props:
        return (props, pagi)
```
**Explanation:** Retries with original location but without price/area/bedrooms filters.

### Snippet 3: Step 2 Fallback (bds.py:420-425)
```python
if city_slug:
    params2 = base_params.copy()
    params2['locations_slug'] = str(city_slug)
    props, pagi = _fetch_with_cache(params2)
    if props:
        return (props, pagi)
```
**Explanation:** Expands to full city if district-level search still empty.

### Snippet 4: Template Conditional (danhmuc.html:290-293)
```html
{{if fallback_properties and len(fallback_properties) > 0:}}
<div class="fallback-results-section mt-48">
  <h2 class="title text-11 fw-6 text-color-heading">Gợi ý cho bạn</h2>
```
**Explanation:** Only shows suggestions section if fallback found results.

### Snippet 5: Zero Results Message (danhmuc.html:257-258)
```html
{{if(int(pagination['total']) == 0):}}
<p class="text-1 text-center line-clamp-2 notfound_img">{{=XML(count_text)}}</p>
{{pass}}
```
**Explanation:** Displays centered "Không có kết quả phù hợp." when main pagination total = 0.

---

## 11. v1 vs v2 Comparison Table

| Aspect | v1 | v2 (To Implement) |
|--------|-----|---|
| **Zero Detection** | `if len(properties) == 0` | Similar check needed |
| **Fallback Trigger** | Automatic in controller | Need to implement |
| **Relaxation Strategy** | 3-step (location first) | Should mirror v1 |
| **UI Message** | "Không có kết quả phù hợp." | Needs implementation |
| **Suggestions Section** | "Gợi ý cho bạn" heading | Needs design |
| **Filtering Priority** | Specs > Location | Should match v1 |
| **Pagination** | Separate for fallback | Needs implementation |
| **Cache Strategy** | MD5 hash on location | Consider similar approach |

---

## Summary: v1 Zero Results Strategy

✅ **Detects:** Checks `pagination['total'] == 0` after API call
✅ **Alerts User:** "Không có kết quả phù hợp." message
✅ **Relaxes Criteria:** 3-step fallback (location → city → nationwide)
✅ **Priority:** Keeps location intent, removes specs (price, area, rooms)
✅ **Presents:** "Gợi ý cho bạn" section with relaxed results
✅ **No Explanation:** Suggestions shown without mentioning removed filters
✅ **Automatic:** No user action required, happens transparently

---

## Unresolved Questions

1. **How does v1 API determine "city" from location slug?**
   - Function `get_city_slug_by_id(city_id)` called but source not fully visible
   - Need to check `helpers/location.py` or similar

2. **What's the search_count field used for in get_districts_list?**
   - Line 36 in search.py sorts districts by `search_count`
   - Not directly related to fallback but indicates popularity-based ranking

3. **Does v1 apply fallback to AJAX danhmuc_ajax endpoint?**
   - danhmuc_ajax function (lines 732-875) doesn't show fallback logic
   - Map filtering may have different strategy

4. **How are old/new location addresses handled in fallback?**
   - load_address_oldnew endpoint (lines 928-960) separate from fallback
   - Unclear if fallback respects address aliases

5. **What's the cost of Step 2 city lookup when fallback triggered?**
   - `get_city_slug_by_id(city_id)` called every time
   - City must already be determined from main search
   - Could be optimized by passing through instead of recalculating
