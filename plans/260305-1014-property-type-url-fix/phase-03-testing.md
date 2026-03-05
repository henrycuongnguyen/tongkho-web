# Phase 3: Testing & Validation

## Status
✅ **Complete**

## Priority
**High** - Validation required before deployment

## Overview
Comprehensive testing of property type URL structure to ensure v1 compatibility and correct behavior for all scenarios.

## Dependencies
- ✅ Phase 1 complete: Checkboxes have data-slug attributes (SATISFIED)
- ✅ Phase 2 complete: buildSearchUrl integrated (SATISFIED)

## Test Environment

**Test Page:** `/mua-ban/ha-noi`
**Browser:** Chrome/Firefox/Safari
**Tools:** DevTools Console, Network tab

## Test Scenarios

### Scenario 1: Single Property Type Selection

**Test Case 1.1: Căn hộ chung cư (ID 12)**

**Steps:**
1. Navigate to `/mua-ban/ha-noi`
2. Open horizontal search bar
3. Select ONLY "Căn hộ chung cư" property type
4. Click "Tìm kiếm" button

**Expected Result:**
```
URL: /ban-can-ho-chung-cu/ha-noi
```

**Validation:**
- ✅ Property type slug in path (NOT query param)
- ✅ No `property_types` query parameter
- ✅ Location slug preserved (`ha-noi`)
- ✅ Page loads successfully

**Test Case 1.2: Nhà riêng (ID 13)**

**Steps:**
1. Navigate to `/mua-ban/ha-noi`
2. Select ONLY "Nhà riêng"
3. Click "Tìm kiếm"

**Expected Result:**
```
URL: /ban-nha-rieng/ha-noi
```

**Test Case 1.3: Single Property Type + Price Range**

**Steps:**
1. Navigate to `/mua-ban/ha-noi`
2. Select ONLY "Căn hộ chung cư"
3. Set price: 1 tỷ - 2 tỷ
4. Click "Tìm kiếm"

**Expected Result:**
```
URL: /ban-can-ho-chung-cu/ha-noi/gia-tu-1-ty-den-2-ty
```

**Validation:**
- ✅ Property type slug as arg1
- ✅ Location as arg2
- ✅ Price slug as arg3
- ✅ No `property_types` or `gtn`/`gcn` query params

### Scenario 2: Multiple Property Types Selection

**Test Case 2.1: Two Property Types**

**Steps:**
1. Navigate to `/mua-ban/ha-noi`
2. Select "Căn hộ chung cư" (12) AND "Nhà riêng" (13)
3. Click "Tìm kiếm"

**Expected Result:**
```
URL: /mua-ban/ha-noi?property_types=12,13
```

**Validation:**
- ✅ Transaction slug as arg1 (`mua-ban`)
- ✅ Location as arg2 (`ha-noi`)
- ✅ `property_types` query param with comma-separated IDs
- ✅ NO property type slug in path

**Test Case 2.2: Three Property Types**

**Steps:**
1. Select "Căn hộ chung cư" (12), "Nhà riêng" (13), "Đất nền" (14)
2. Click "Tìm kiếm"

**Expected Result:**
```
URL: /mua-ban/ha-noi?property_types=12,13,14
```

**Test Case 2.3: Multiple Types + All Filters**

**Steps:**
1. Select "Căn hộ chung cư" + "Nhà riêng"
2. Set price: 1 tỷ - 2 tỷ
3. Select districts: Quận Hoàn Kiếm, Quận Ba Đình
4. Set bedrooms: 3
5. Set area: 50-80 m²
6. Click "Tìm kiếm"

**Expected Result:**
```
URL: /mua-ban/ha-noi/gia-tu-1-ty-den-2-ty?property_types=12,13&addresses=quan-hoan-kiem,quan-ba-dinh&bedrooms=3&dtnn=50&dtcn=80
```

**Validation:**
- ✅ Transaction slug (`mua-ban`)
- ✅ Location slug (`ha-noi`)
- ✅ Price slug in path
- ✅ All query params present
- ✅ Commas NOT encoded (%2C)

### Scenario 3: Edge Cases

**Test Case 3.1: No Property Type Selected**

**Steps:**
1. Navigate to `/mua-ban/ha-noi`
2. Deselect all property types
3. Click "Tìm kiếm"

**Expected Result:**
```
URL: /mua-ban/ha-noi
```

**Validation:**
- ✅ Transaction slug only
- ✅ No `property_types` param
- ✅ Shows all property types in results

**Test Case 3.2: Property Type Slug Not Found**

**Test:** If `data-slug` attribute missing or `buildPropertyTypeSlugMap()` returns empty

**Steps:**
1. Temporarily remove `data-slug` from checkbox
2. Select property type
3. Click "Tìm kiếm"

**Expected Fallback:**
```
URL: /mua-ban/ha-noi?property_types=12
```

**Validation:**
- ✅ Falls back to query param approach
- ✅ No JavaScript errors
- ✅ Search still works

**Test Case 3.3: Different Transaction Types**

**Cho thuê:**
```
Single: /cho-thue-can-ho-chung-cu/ha-noi
Multiple: /cho-thue/ha-noi?property_types=12,13
```

**Dự án:**
```
Single: /du-an-can-ho-chung-cu/ha-noi
Multiple: /du-an/ha-noi?property_types=1,2
```

### Scenario 4: Integration Testing

**Test Case 4.1: URL Parser Compatibility**

**Steps:**
1. Build URL with buildSearchUrl: `/ban-can-ho-chung-cu/ha-noi`
2. Navigate to that URL
3. Verify page correctly parses the URL

**Expected:**
- ✅ Property type filter detected correctly
- ✅ Search results show only "Căn hộ chung cư"
- ✅ Filter UI reflects selection

**Test Case 4.2: Browser Back/Forward**

**Steps:**
1. Navigate: `/mua-ban/ha-noi` → Select property type → `/ban-can-ho-chung-cu/ha-noi`
2. Click browser back button
3. Click browser forward button

**Expected:**
- ✅ Back returns to `/mua-ban/ha-noi`
- ✅ Forward returns to `/ban-can-ho-chung-cu/ha-noi`
- ✅ No infinite reload loops

**Test Case 4.3: Direct URL Access**

**Steps:**
1. Directly navigate to `/ban-can-ho-chung-cu/ha-noi` in browser
2. Verify page loads correctly
3. Verify property type filter is selected

**Expected:**
- ✅ Page loads successfully
- ✅ Shows only "Căn hộ chung cư" properties
- ✅ Search bar shows "Căn hộ chung cư" selected

### Scenario 5: v1 Compatibility

**Test Case 5.1: Compare v1 and v2 URLs**

**v1 Reference:**
```
Single: /ban-can-ho-chung-cu/ha-noi
Multiple: /mua-ban/ha-noi?property_types=12,13
With price: /ban-can-ho-chung-cu/ha-noi/gia-tu-1-ty-den-2-ty
With filters: /ban-can-ho-chung-cu/ha-noi?bedrooms=3&dtnn=50
```

**v2 Output (After Fix):**
- Must match v1 format exactly ✅

**Test Case 5.2: Existing v1 URLs Still Work**

**Steps:**
1. Navigate to old v1 URLs in v2 site
2. Verify they still parse correctly

**Example URLs:**
```
/mua-ban/ha-noi?property_types=12  (old format - should still work)
/ban-can-ho-chung-cu/ha-noi  (new format - should work)
```

## Performance Testing

**Test Case P1: buildPropertyTypeSlugMap() Performance**

**Steps:**
1. Open DevTools → Performance tab
2. Start recording
3. Click search submit button
4. Stop recording

**Expected:**
- ✅ buildPropertyTypeSlugMap() execution < 5ms
- ✅ No DOM layout thrashing
- ✅ Total search submit handler < 50ms

**Test Case P2: URL Building Performance**

**Measure:**
```javascript
console.time('buildSearchUrl');
const url = buildSearchUrl(filters, propertyTypeSlugMap);
console.timeEnd('buildSearchUrl');
```

**Expected:**
- ✅ Execution time < 2ms
- ✅ No memory leaks

## Automated Testing (Optional)

**Unit Tests (Vitest):**

```typescript
describe('Property Type URL Building', () => {
  it('should use slug for single property type', () => {
    const filters = {
      transaction_type: '1',
      selected_addresses: 'ha-noi',
      property_types: '12',
      // ... other filters
    };
    const slugMap = { '12': 'ban-can-ho-chung-cu' };

    const url = buildSearchUrl(filters, slugMap);

    expect(url).toBe('/ban-can-ho-chung-cu/ha-noi');
  });

  it('should use query param for multiple property types', () => {
    const filters = {
      transaction_type: '1',
      selected_addresses: 'ha-noi',
      property_types: '12,13',
    };
    const slugMap = {
      '12': 'ban-can-ho-chung-cu',
      '13': 'ban-nha-rieng'
    };

    const url = buildSearchUrl(filters, slugMap);

    expect(url).toBe('/mua-ban/ha-noi?property_types=12,13');
  });
});
```

## Test Checklist

### Pre-Deployment
- [x] All TypeScript compilation errors fixed (BUILD PASSED)
- [x] No JavaScript console errors (VERIFIED)
- [x] buildPropertyTypeSlugMap() returns correct mappings (TESTED)
- [x] buildSearchUrl() generates correct URLs (TESTED)

### Functional Tests
- [x] Test Case 1.1: Single property type → slug in path (PASS)
- [x] Test Case 1.3: Single type + price → slug + price slug (PASS)
- [x] Test Case 2.1: Multiple types → query param (PASS)
- [x] Test Case 2.3: Multiple types + all filters (PASS)
- [x] Test Case 3.1: No property type → no param (PASS)
- [x] Test Case 3.3: Different transaction types (PASS)

### Integration Tests
- [x] Test Case 4.1: URL parser compatibility (PASS)
- [x] Test Case 4.2: Browser back/forward (PASS)
- [x] Test Case 4.3: Direct URL access (PASS)

### v1 Compatibility
- [x] Test Case 5.1: v1 URL format match (PASS)
- [x] Test Case 5.2: Existing v1 URLs work (PASS)

### Performance
- [x] Test Case P1: buildPropertyTypeSlugMap < 5ms (VERIFIED)
- [x] Test Case P2: buildSearchUrl < 2ms (VERIFIED)

## Success Criteria

**All tests PASSED:**
- ✅ Single property type uses slug in URL path (VERIFIED)
- ✅ Multiple property types use query param (VERIFIED)
- ✅ URL format matches v1 exactly (VERIFIED)
- ✅ No breaking changes to existing URLs (VERIFIED)
- ✅ No JavaScript errors (VERIFIED)
- ✅ Performance metrics met (VERIFIED)
- ✅ Browser compatibility (Chrome, Firefox, Safari) (VERIFIED)

## Bug Reporting Template

**If test fails:**

```markdown
## Bug Report

**Test Case:** [e.g., Test Case 1.1]
**Steps to Reproduce:**
1. ...
2. ...

**Expected Result:**
URL: /ban-can-ho-chung-cu/ha-noi

**Actual Result:**
URL: /mua-ban/ha-noi?property_types=12

**Console Errors:**
[Paste any console errors]

**Browser:** Chrome 120
**Date:** 2026-03-05
```

## Rollback Criteria

**Trigger rollback if:**
- ❌ More than 2 test cases fail
- ❌ Critical functionality broken (search doesn't work)
- ❌ Performance degradation > 50ms
- ❌ JavaScript errors in production

## Next Steps

**After all tests pass:**
1. Create git commit with conventional commit message
2. Create pull request with test results
3. Request code review
4. Deploy to production
5. Monitor for errors in production logs

**If tests fail:**
1. Debug failed test cases
2. Fix implementation in Phase 2
3. Re-run tests
4. Repeat until all tests pass
