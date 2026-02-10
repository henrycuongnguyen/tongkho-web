# Manual Testing Checklist - Phase 5

**Date:** 2026-02-10
**Phase:** 5 of 5 - Testing & Validation
**Test Environment:** Windows 10, Chrome/Firefox/Edge

## Test Status Overview

- [ ] Hero Search Bar (Home Page)
- [ ] Listing Search Bar (Listing Page)
- [ ] Multi-Location Selection
- [ ] Transaction Type Switching
- [ ] Cross-Browser Compatibility
- [ ] Edge Cases & Error Handling

---

## 1. Hero Search Bar (Home Page)

**Test Location:** `/` (Home page)
**Component:** `src/components/home/hero-search.astro`

### 1.1 Basic Search

| Test Case | Input | Expected URL | Status |
|-----------|-------|--------------|--------|
| No filters | Transaction: Mua bán | `/mua-ban` | [ ] |
| Rent transaction | Transaction: Cho thuê | `/cho-thue` | [ ] |
| Project transaction | Transaction: Dự án | `/du-an` | [ ] |

### 1.2 Location Selection

| Test Case | Input | Expected URL | Status |
|-----------|-------|--------------|--------|
| Single province | Hà Nội | `/mua-ban/ha-noi` | [ ] |
| Single district | Quận Ba Đình | `/mua-ban/ba-dinh` | [ ] |
| Province with name format | TP. Hồ Chí Minh | `/mua-ban/thanh-pho-ho-chi-minh` | [ ] |

### 1.3 Property Type Selection

| Test Case | Input | Expected URL | Status |
|-----------|-------|--------------|--------|
| Single type | Căn hộ chung cư | `/ban-can-ho-chung-cu` | [ ] |
| Single type + location | Căn hộ + Hà Nội | `/ban-can-ho-chung-cu/ha-noi` | [ ] |
| Multiple types | Căn hộ + Nhà riêng | `/mua-ban?property_types=12,14` | [ ] |
| Multiple types + location | Multiple + Hà Nội | `/mua-ban/ha-noi?property_types=12,14` | [ ] |

### 1.4 Price Filters (Predefined Ranges)

| Test Case | Input | Expected URL | Status |
|-----------|-------|--------------|--------|
| Price only | 1-2 tỷ | `/mua-ban/toan-quoc/gia-tu-1-ty-den-2-ty` | [ ] |
| Price + location | 1-2 tỷ + Hà Nội | `/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty` | [ ] |
| Price + property type | 1-2 tỷ + Căn hộ | `/ban-can-ho-chung-cu/toan-quoc/gia-tu-1-ty-den-2-ty` | [ ] |
| Full combination | Căn hộ + Hà Nội + 1-2 tỷ | `/ban-can-ho-chung-cu/ha-noi/gia-tu-1-ty-den-2-ty` | [ ] |
| Negotiable price | 0-0 tỷ | `/mua-ban/toan-quoc/gia-thuong-luong` | [ ] |
| Under 500M (rent) | Cho thuê: < 500 triệu | `/cho-thue/toan-quoc/gia-duoi-500-trieu` | [ ] |
| Over 60B | > 60 tỷ | `/mua-ban/toan-quoc/gia-tren-60-ty` | [ ] |

### 1.5 Custom Price Ranges

| Test Case | Input | Expected URL | Status |
|-----------|-------|--------------|--------|
| Custom price + location | Min: 1.5B, Max: 3.2B, Hà Nội | `/mua-ban/ha-noi?gtn=1.5-ty&gcn=3.2-ty` | [ ] |
| Custom price only | Min: 750M, Max: 1.8B | `/mua-ban/toan-quoc?gtn=750-trieu&gcn=1.8-ty` | [ ] |
| Min price only | Min: 2B | `/mua-ban/toan-quoc?gtn=2-ty` | [ ] |
| Max price only | Max: 5B | `/mua-ban/toan-quoc?gcn=5-ty` | [ ] |

### 1.6 Area Filters

| Test Case | Input | Expected URL | Status |
|-----------|-------|--------------|--------|
| Area range | 50-100 m² | `/mua-ban?dtnn=50&dtcn=100` | [ ] |
| Area + location | 50-100 m² + Hà Nội | `/mua-ban/ha-noi?dtnn=50&dtcn=100` | [ ] |
| Area + price | 50-100 m² + 1-2 tỷ | `/mua-ban/toan-quoc/gia-tu-1-ty-den-2-ty?dtnn=50&dtcn=100` | [ ] |
| Min area only | Min: 50 m² | `/mua-ban?dtnn=50` | [ ] |
| Max area only | Max: 100 m² | `/mua-ban?dtcn=100` | [ ] |

### 1.7 Room Filters

| Test Case | Input | Expected URL | Status |
|-----------|-------|--------------|--------|
| Bedrooms only | 3 phòng ngủ | `/mua-ban?bedrooms=3` | [ ] |
| Bathrooms only | 2 phòng tắm | `/mua-ban?bathrooms=2` | [ ] |
| Both rooms | 3PN + 2PT | `/mua-ban?bedrooms=3&bathrooms=2` | [ ] |
| Rooms + location + price | Full filters | `/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty?bedrooms=3&bathrooms=2` | [ ] |

### 1.8 Transaction Type Switching

| Test Case | Action | Expected Behavior | Status |
|-----------|--------|-------------------|--------|
| Switch to Cho thuê | Click "Cho thuê" tab | All filters preserved, URL changes to `/cho-thue/...` | [ ] |
| Switch to Dự án | Click "Dự án" tab | Property types cleared (not applicable), URL changes to `/du-an/...` | [ ] |
| Switch back to Mua bán | Click "Mua bán" tab | Filters restored, URL changes to `/mua-ban/...` | [ ] |

---

## 2. Listing Search Bar (Listing Page)

**Test Location:** `/mua-ban` (or any listing page)
**Component:** `src/components/listing/horizontal-search-bar.astro`

### 2.1 Location Update

| Test Case | Current URL | Action | Expected URL | Status |
|-----------|-------------|--------|--------------|--------|
| Change province | `/mua-ban` | Select Hà Nội | `/mua-ban/ha-noi` | [ ] |
| Change district | `/mua-ban/ha-noi` | Select Ba Đình | `/mua-ban/ba-dinh` | [ ] |
| Reset location | `/mua-ban/ha-noi` | Select "Toàn quốc" | `/mua-ban` | [ ] |

### 2.2 Price Filter Update

| Test Case | Current URL | Action | Expected URL | Status |
|-----------|-------------|--------|--------------|--------|
| Add predefined price | `/mua-ban/ha-noi` | Select 1-2 tỷ | `/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty` | [ ] |
| Change price range | `/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty` | Select 2-3 tỷ | `/mua-ban/ha-noi/gia-tu-2-ty-den-3-ty` | [ ] |
| Custom price range | `/mua-ban/ha-noi` | Min: 1.5B, Max: 3.2B | `/mua-ban/ha-noi?gtn=1.5-ty&gcn=3.2-ty` | [ ] |
| Clear price | `/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty` | Clear filter | `/mua-ban/ha-noi` | [ ] |

### 2.3 Area Filter Update

| Test Case | Current URL | Action | Expected URL | Status |
|-----------|-------------|--------|--------------|--------|
| Add area range | `/mua-ban/ha-noi` | 50-100 m² | `/mua-ban/ha-noi?dtnn=50&dtcn=100` | [ ] |
| Update area | `/mua-ban/ha-noi?dtnn=50&dtcn=100` | 80-120 m² | `/mua-ban/ha-noi?dtnn=80&dtcn=120` | [ ] |
| Clear area | `/mua-ban/ha-noi?dtnn=50&dtcn=100` | Clear filter | `/mua-ban/ha-noi` | [ ] |

### 2.4 Property Type Update

| Test Case | Current URL | Action | Expected URL | Status |
|-----------|-------------|--------|--------------|--------|
| Add single type | `/mua-ban/ha-noi` | Select Căn hộ | `/ban-can-ho-chung-cu/ha-noi` | [ ] |
| Change type | `/ban-can-ho-chung-cu/ha-noi` | Select Nhà riêng | `/ban-nha-rieng/ha-noi` | [ ] |
| Add second type | `/ban-can-ho-chung-cu/ha-noi` | Add Nhà riêng | `/mua-ban/ha-noi?property_types=12,14` | [ ] |
| Clear types | `/ban-can-ho-chung-cu/ha-noi` | Deselect all | `/mua-ban/ha-noi` | [ ] |

### 2.5 Keyword Search

| Test Case | Current URL | Action | Expected URL | Status |
|-----------|-------------|--------|--------------|--------|
| Add keyword | `/mua-ban/ha-noi` | "Nguyễn Huệ" | `/mua-ban/ha-noi?street_name=nguyen-hue` | [ ] |
| Clear keyword | `/mua-ban/ha-noi?street_name=nguyen-hue` | Clear input | `/mua-ban/ha-noi` | [ ] |

### 2.6 Filter Preservation

| Test Case | Current URL | Action | Expected Behavior | Status |
|-----------|-------------|--------|-------------------|--------|
| Preserve area when changing price | `/mua-ban/ha-noi?dtnn=50&dtcn=100` | Select price 1-2 tỷ | `/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty?dtnn=50&dtcn=100` | [ ] |
| Preserve rooms when changing location | `/mua-ban/ha-noi?bedrooms=3&bathrooms=2` | Select Ba Đình | `/mua-ban/ba-dinh?bedrooms=3&bathrooms=2` | [ ] |
| Preserve all filters | Full URL with all params | Change property type | All query params maintained | [ ] |

---

## 3. Multi-Location Selection

**Test Location:** Listing page with modal
**Component:** `src/components/listing/sidebar/province-selector-modal.astro`

### 3.1 Single Location

| Test Case | Action | Expected URL | Status |
|-----------|--------|--------------|--------|
| Select province | Hà Nội → Apply | `/mua-ban/ha-noi` | [ ] |
| Select district | Hà Nội → Ba Đình → Apply | `/mua-ban/ba-dinh` | [ ] |
| Change province | TP. HCM → Apply | `/mua-ban/thanh-pho-ho-chi-minh` | [ ] |

### 3.2 Multiple Districts

| Test Case | Action | Expected URL | Display | Status |
|-----------|--------|--------------|---------|--------|
| Select 2 districts | Ba Đình + Tây Hồ → Apply | `/mua-ban/ba-dinh?addresses=tay-ho` | "Đã chọn 2 địa điểm" | [ ] |
| Select 3 districts | Ba Đình + Tây Hồ + Hoàn Kiếm | `/mua-ban/ba-dinh?addresses=tay-ho,hoan-kiem` | "Đã chọn 3 địa điểm" | [ ] |
| Select all districts | Click "Chọn tất cả" | First district in path, rest in addresses | "Đã chọn X địa điểm" | [ ] |

### 3.3 Multi-Select Controls

| Test Case | Action | Expected Behavior | Status |
|-----------|--------|-------------------|--------|
| Select all | Click "Chọn tất cả" | All checkboxes checked, count updates | [ ] |
| Clear all | Click "Bỏ chọn" | All checkboxes unchecked, count = 0, Apply disabled | [ ] |
| Individual select | Check 1 district | Count = 1, Apply enabled | [ ] |
| Individual deselect | Uncheck 1 district | Count decreases, Apply state updates | [ ] |

### 3.4 Province Switching

| Test Case | Action | Expected Behavior | Status |
|-----------|--------|-------------------|--------|
| Switch province | Select districts in Hà Nội, then click TP. HCM | District section reloads with TP. HCM districts, previous selections cleared | [ ] |
| Return to province | Switch back to Hà Nội | Districts reload, selections NOT preserved | [ ] |

---

## 4. Edge Cases & Error Handling

### 4.1 Empty States

| Test Case | Input | Expected URL | Status |
|-----------|-------|--------------|--------|
| No filters at all | Empty search | `/mua-ban` | [ ] |
| Empty location | No location selected | `/mua-ban` or `/mua-ban/toan-quoc` (if price exists) | [ ] |
| Zero prices | Min: 0, Max: 0 | `/mua-ban/toan-quoc/gia-thuong-luong` | [ ] |

### 4.2 Invalid Inputs

| Test Case | Input | Expected Behavior | Status |
|-----------|-------|-------------------|--------|
| Min > Max price | Min: 5B, Max: 2B | Validation error or swap values | [ ] |
| Min > Max area | Min: 200, Max: 50 | Validation error or swap values | [ ] |
| Negative values | Min: -1 | Validation error or ignore | [ ] |
| Very large numbers | Price: 999999999999 | Treated as max value (1000000000000) | [ ] |

### 4.3 Special Characters

| Test Case | Input | Expected Behavior | Status |
|-----------|-------|-------------------|--------|
| Street name with spaces | "Nguyễn Văn Cừ" | URL encoded properly | [ ] |
| Vietnamese characters | Location names with diacritics | Slugified correctly | [ ] |
| Comma in addresses | Multiple locations | Commas NOT encoded (%2C) | [ ] |

### 4.4 URL Manipulation

| Test Case | Action | Expected Behavior | Status |
|-----------|--------|-------------------|--------|
| Manual URL edit | Change price slug in URL manually | Page loads with correct filters | [ ] |
| Invalid URL segment | `/mua-ban/invalid-location` | 404 or fallback behavior | [ ] |
| Missing required segment | `/` (no transaction type) | Redirect to `/mua-ban` | [ ] |

---

## 5. Cross-Browser Compatibility

### 5.1 Desktop Browsers

| Browser | Version | Test Status | Issues Found |
|---------|---------|-------------|--------------|
| Chrome | Latest | [ ] | |
| Firefox | Latest | [ ] | |
| Edge | Latest | [ ] | |
| Safari (macOS) | Latest | [ ] | |

**Test Cases for Each Browser:**
- [ ] URL building works correctly
- [ ] Location autocomplete functions
- [ ] Multi-location modal works
- [ ] Price sliders function properly
- [ ] All filter updates preserve state
- [ ] Transaction type switching works

### 5.2 Mobile Browsers

| Browser | OS | Test Status | Issues Found |
|---------|---------|-------------|--------------|
| Chrome | Android | [ ] | |
| Safari | iOS | [ ] | |
| Firefox | Android | [ ] | |

**Mobile-Specific Tests:**
- [ ] Touch interactions work (tap, swipe)
- [ ] Dropdowns open/close correctly
- [ ] Modal is responsive
- [ ] Keyboard inputs work (location search)
- [ ] URL updates on mobile navigation

---

## 6. Performance Testing

### 6.1 URL Building Speed

| Test Case | Iterations | Max Acceptable Time | Actual Time | Status |
|-----------|-----------|---------------------|-------------|--------|
| Simple URL | 1000x | < 10ms avg | | [ ] |
| Complex URL (all filters) | 1000x | < 10ms avg | | [ ] |
| Multi-location URL | 1000x | < 10ms avg | | [ ] |

**How to Test:**
```javascript
// Browser console
const start = performance.now();
for (let i = 0; i < 1000; i++) {
  window.buildSearchUrl({
    transaction_type: '1',
    property_types: '12',
    selected_addresses: 'ha-noi',
    min_price: '1000000000',
    max_price: '2000000000',
  });
}
const end = performance.now();
console.log('Average time:', (end - start) / 1000, 'ms');
```

### 6.2 Page Load Performance

| Test Case | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Initial page load | < 2s | | [ ] |
| Location dropdown load | < 500ms | | [ ] |
| District API call | < 300ms | | [ ] |
| Search submit navigation | < 1s | | [ ] |

---

## 7. Accessibility Testing

### 7.1 Keyboard Navigation

| Test Case | Expected Behavior | Status |
|-----------|-------------------|--------|
| Tab through filters | All interactive elements focusable | [ ] |
| Enter to submit | Search submits on Enter key | [ ] |
| Escape to close | Modals close on Escape | [ ] |
| Arrow keys in dropdowns | Navigate options with arrows | [ ] |

### 7.2 Screen Reader

| Test Case | Expected Behavior | Status |
|-----------|-------------------|--------|
| Filter labels | All inputs have proper labels | [ ] |
| Button descriptions | Buttons announce their purpose | [ ] |
| Dynamic updates | URL changes announced | [ ] |
| Error messages | Validation errors read aloud | [ ] |

---

## 8. Backward Compatibility

### 8.1 Old v2 URLs

| Old URL | Expected Behavior | New URL | Status |
|---------|-------------------|---------|--------|
| `/mua-ban?gtn=1000000000&gcn=2000000000` | Redirect or normalize | `/mua-ban/toan-quoc/gia-tu-1-ty-den-2-ty` | [ ] |
| `/cho-thue?city=ha-noi` | Redirect or normalize | `/cho-thue/ha-noi` | [ ] |
| `/mua-ban?property_types=12,13` | Still works | `/mua-ban?property_types=12,13` | [ ] |

---

## Test Summary

**Total Test Cases:** ~150
**Passed:** ___
**Failed:** ___
**Blocked:** ___
**Completion:** ___%

**Critical Issues:**
1.
2.
3.

**Non-Critical Issues:**
1.
2.
3.

**Recommendations:**
1.
2.
3.

---

**Tested By:** _________________
**Date:** _________________
**Sign-off:** _________________
