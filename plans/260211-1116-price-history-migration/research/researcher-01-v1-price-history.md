# V1 Price History Implementation Analysis

## Executive Summary
V1 implements price history as a tabbed section on listing pages using Web2py's LOAD mechanism. Data flows via AJAX-driven `.load` views that render pre-computed analyzed data. Component uses base64-encoded price history JSON for frontend chart rendering.

## Architecture Overview

### Component Structure
- **Location**: `views/bds/components/price_history.html` (79 lines)
- **Parent Template**: `danhmuc.html` (lines 320-378)
- **Load Scripts**: `load_price_history.load` & `load_price_history5.load` (identical structure)

### Data Flow
```
danhmuc.html (main listing page)
  ├─ LOAD with AJAX → load_price_history.load?city=X&district=Y&slug=Z&year=2
  ├─ LOAD with AJAX → load_price_history5.load?city=X&district=Y&slug=Z&year=5
  └─ Controller/view returns: price_history.html component
       ├─ Renders analyzed data (commonPriceValue, changedPercentValue, etc.)
       └─ Encodes price_history_data as base64 JSON
```

## Integration Points

### 1. Danhmuc.html (Main Page)
**Location**: Lines 320-378

- **Conditional Rendering**: Hidden section `price-history-section` only displays if `district_nomolize` variable exists
- **Tab Structure**: Bootstrap tabs switching between 2-year and 5-year views
- **AJAX Loading**: Two separate LOAD calls with query params:
  - City slug, district (normalized), category slug, year parameter
  - Spinner loading indicator shown during fetch
- **Right Sidebar**: Additional price-trend-box (lines 401-448) displays:
  - Chart icon + percentage change value
  - "Xem lịch sử giá" (View price history) button with scroll functionality

### 2. Price History Component (price_history.html)
**Lines 1-79**

**Expected Input Variables**:
```
- price_history_data: List/array of historical price entries
- analyzedData: Dict containing:
  * commonPriceValue: "X tr/m²" (common price)
  * commonPriceLabel: HTML string (description)
  * changedPercentValue: "+/-X%"
  * changedPercentStatus: int (>0 = increase, ≤0 = decrease)
  * changedPercentLabel: HTML string
  * percentDistanceFromMaxValue: (optional)
  * percentDistanceFromMaxLabel: (optional)
- chartUnit: Unit string (default "tr/m2")
- (optional) compareProductPrice: Comparative percentage
```

**Rendering Logic**:
- Checks `len(price_history_data) > 0`
- Renders 3-4 price info boxes with icons/labels
- Encodes full price_history_data as base64 JSON into `#price-history-list` data attribute
- Shows "data being updated" message if no data

### 3. Load Scripts (load_price_history.load, load_price_history5.load)
**Identical Structure**:
```web2py
{{include 'bds/components/price_history.html'}}
<script>
  document.dispatchEvent(new Event('priceHistoryLoaded'))
  const priceHistoryLoadedEvent[2|5] = new CustomEvent('priceHistoryLoaded', {
    detail: { targetId: "#price-history-[2|5]-years" }
  });
  document.dispatchEvent(priceHistoryLoadedEvent[2|5]);
</script>
```

**Functionality**:
- Includes price_history.html component (expects context variables)
- Fires custom event `priceHistoryLoaded` after render
- Event detail includes target container ID for DOM updates

## Data Structure

### Query Parameters
```
city: string (city slug, e.g., "ho-chi-minh-city")
district: string (normalized district name)
slug: string (category slug, e.g., "can-ho")
year: int (2 or 5 for time period)
```

### Backend Response Expectations
Must provide to component context:
```python
{
  "price_history_data": [
    {"date": "2024-01", "price": "3200", "unit": "tr/m²"},
    # ... more entries
  ],
  "analyzedData": {
    "commonPriceValue": "3200 tr/m²",
    "commonPriceLabel": "<strong>Giá phổ biến</strong> trong khu vực",
    "changedPercentValue": "+5.2%",
    "changedPercentStatus": 1,  # or -1
    "changedPercentLabel": "<strong>+5.2%</strong> so với 2 năm trước",
    "percentDistanceFromMaxValue": "-3.1%",
    "percentDistanceFromMaxLabel": "<strong>-3.1%</strong> so với giá cao nhất"
  },
  "chartUnit": "tr/m2"
}
```

### Sidebar Data (Check Endpoint)
Via `check_load_price_history` endpoint:
```javascript
Response structure:
{
  "status": 1,
  "data": {
    "2_years": true/false,
    "5_years": true/false,
    "2_analyzedData": {changedPercentValue: "+X%", ...},
    "5_analyzedData": {changedPercentValue: "+X%", ...}
  }
}
```

## JavaScript Integration

### 1. Price History Loading (danhmuc.html lines 685-789)
```javascript
checkLoadPriceHistory(year = 2)
  → GET check_load_price_history endpoint
  → Updates sidebar icon/percentage display
  → Toggles tab visibility based on data availability
  → Shows/hides history sections
```

### 2. Event Listeners
- **Scroll to Section**: Button (line 438) scrolls to `#price-history-section`
- **Custom Events**: Load scripts emit `priceHistoryLoaded` events (detected by frontend)

### 3. DOM Elements
- `#price-history-section`: Main history container (hidden if no district)
- `#price-history-2-years`: 2-year tab content (AJAX inserted)
- `#price-history-5-years`: 5-year tab content (AJAX inserted)
- `#price-history-list`: Base64-encoded price data attribute (data-*="...")
- `#percetion_check`: Percentage display in sidebar
- `.history_hide`: Show/hide class for conditional display

## Key Dependencies
- **Web2py LOAD** framework (AJAX component loading)
- **Bootstrap 5**: Tabs, modals, grid
- **Chart.js**: (loaded but not directly used in component HTML)
- **Custom Events**: Modern JS event system for inter-component communication

## Critical Observations
1. **Base64 Encoding**: Price history JSON stored as base64 in HTML attribute for JavaScript chart rendering
2. **Conditional Display**: Entire history section hidden without district filter
3. **Dual Time Periods**: 2-year and 5-year views loaded separately via identical LOAD mechanism
4. **Lazy Loading**: AJAX calls with spinner indicate user-triggered or tab-activated loading
5. **Sidebar Percentage**: Pre-computed via backend `check_load_price_history` endpoint, independent of main LOAD

## Dependencies & Libraries
- Web2py templating engine
- Bootstrap 5 tab components
- Chart.js (v3+ based on umd.js reference)
- Custom event system
- Base64 encoding (Python + JavaScript)
