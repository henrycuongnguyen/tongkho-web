# Phase 4: Testing and Validation

## Context Links
- [Plan Overview](./plan.md)
- [Phase 1: SSR Component](./phase-01-ssr-location-filter-card.md)
- [Phase 2: Integration](./phase-02-integrate-sidebar.md)
- [Phase 3: URL Building](./phase-03-url-building-navigation.md)

## Overview

**Priority:** P1 (Final)
**Status:** Completed
**Effort:** 1h
**Completed:** 2026-02-10

Comprehensive testing of location filter card: functionality, performance, SSR behavior, and V1 compatibility.

## Key Testing Areas

1. **SSR Behavior**: Data fetched server-side, no client hydration
2. **UI Functionality**: Expand/collapse, active states, navigation
3. **URL Compatibility**: V1 format validation
4. **Performance**: Response time, database query impact
5. **Edge Cases**: Empty data, long lists, special characters

## Testing Strategy

### Unit Tests (Skip - SSR Component)

**Rationale**: Astro SSR components are hard to unit test. Focus on integration and E2E tests instead.

### Integration Tests

**Focus**: Component behavior within sidebar layout

### E2E Tests (Manual)

**Focus**: User workflows, URL navigation, data display

## Implementation Steps

### Step 1: SSR Validation Tests (15 min)

**Test: Data in Initial HTML**

1. Visit `/mua-ban`
2. View Page Source (Ctrl+U)
3. Verify:
   - [ ] Province names visible in HTML source
   - [ ] Property counts embedded in source
   - [ ] No loading spinners in source
   - [ ] No `<script>` tags fetching data

**Expected Result**: Complete HTML with data on first load

---

**Test: No Client-Side API Calls**

1. Visit `/mua-ban`
2. Open DevTools → Network tab
3. Filter: XHR/Fetch
4. Verify:
   - [ ] No API calls to `/api/location/*`
   - [ ] No requests after page load (except assets)

**Expected Result**: Zero API calls for location data

---

**Test: Server Response Time**

1. Visit `/mua-ban`
2. Open DevTools → Network → Document
3. Check response time
4. Verify:
   - [ ] Response time < 150ms
   - [ ] Database query included in response time
   - [ ] No waterfall delays

**Expected Result**: Fast SSR response (<150ms)

---

### Step 2: UI Functionality Tests (20 min)

**Test: Province Display**

1. Visit `/mua-ban`
2. Verify sidebar location card:
   - [ ] "Khu vực nổi bật" heading visible
   - [ ] 10 provinces displayed by default
   - [ ] Property counts shown next to province names
   - [ ] Counts formatted correctly (e.g., "1.5K" for 1500)

---

**Test: Active State Highlighting**

1. Visit `/mua-ban` → No active province
   - [ ] No province highlighted
2. Click "Hà Nội" → Navigate to `/mua-ban/ha-noi`
   - [ ] "Hà Nội" highlighted (blue background, border-left)
   - [ ] "Xóa bộ lọc khu vực" button appears

---

**Test: Expand/Collapse (if >10 provinces)**

1. Visit `/mua-ban`
2. If "Xem thêm" button visible:
   - [ ] Click "Xem thêm"
   - [ ] All provinces displayed
   - [ ] "Thu gọn" button appears
   - [ ] Click "Thu gọn"
   - [ ] List collapses to 10 items
   - [ ] Page scrolls to card top

**Note**: If provinces < 10, skip this test

---

**Test: Clear Filter**

1. Visit `/mua-ban/ha-noi`
2. Verify "Xóa bộ lọc khu vực" button visible
3. Click button
4. Verify:
   - [ ] Navigate to `/mua-ban`
   - [ ] No province highlighted
   - [ ] Clear button disappears

---

### Step 3: URL Navigation Tests (15 min)

**Test: Query Parameter Preservation**

1. Visit `/mua-ban?property_types=can-ho`
2. Click "Hà Nội" in location filter
3. Verify URL: `/mua-ban/ha-noi?property_types=can-ho`
4. Verify:
   - [ ] Property type filter still active
   - [ ] Query param in browser address bar

---

**Test: Transaction Type Switching**

1. Visit `/mua-ban/ha-noi`
2. Switch to "Cho thuê" (header menu)
3. Verify:
   - [ ] URL becomes `/cho-thue` (province cleared)
   - [ ] Location card re-renders for "Cho thuê"

---

**Test: Province to Province Navigation**

1. Visit `/mua-ban/ha-noi`
2. Click "TP. Hồ Chí Minh" in location filter
3. Verify:
   - [ ] URL becomes `/mua-ban/tp-ho-chi-minh`
   - [ ] "Hà Nội" no longer highlighted
   - [ ] "TP. Hồ Chí Minh" now highlighted

---

### Step 4: Performance Tests (10 min)

**Test: Database Query Performance**

1. Check server logs during page load
2. Verify:
   - [ ] Single query to `locations_with_count_property`
   - [ ] Query time < 50ms
   - [ ] No N+1 query issues

---

**Test: Response Size**

1. Visit `/mua-ban`
2. Open DevTools → Network → Document
3. Check response size
4. Verify:
   - [ ] HTML size < 100KB (including sidebar)
   - [ ] No excessive inline data

---

**Test: Cache Headers (if applicable)**

1. Visit `/mua-ban`
2. Check response headers
3. Verify:
   - [ ] Cache-Control header present (if CDN used)
   - [ ] ETag header for validation

---

### Step 5: Edge Case Tests (10 min)

**Test: Empty Province List**

Mock scenario: Database returns 0 provinces

1. Temporarily modify `getAllProvincesWithCount()` to return `[]`
2. Visit `/mua-ban`
3. Verify:
   - [ ] Location card does not render (graceful failure)
   - [ ] No JavaScript errors
   - [ ] Other sidebar components unaffected

**Restore**: Undo mock modification

---

**Test: Vietnamese Character Slugs**

1. Test provinces with diacritics:
   - [ ] Đà Nẵng → `/mua-ban/da-nang`
   - [ ] Cần Thơ → `/mua-ban/can-tho`
   - [ ] Bà Rịa - Vũng Tàu → `/mua-ban/ba-ria-vung-tau`

---

**Test: Long Province Names**

1. Test long names:
   - [ ] "TP. Hồ Chí Minh" fits in card width
   - [ ] No text overflow
   - [ ] Truncation with ellipsis if needed

---

### Step 6: View Transition Tests (10 min)

**Test: Script Re-initialization**

1. Visit `/mua-ban`
2. Click province → Navigate to `/mua-ban/ha-noi`
3. Verify:
   - [ ] Expand/collapse still works after navigation
   - [ ] Event listeners re-attached
   - [ ] No duplicate event listeners

**Check**: `astro:after-swap` event listener working

---

## E2E Test Checklist

### Critical Paths

- [x] Homepage → Listing page → Province filter → Province page
- [x] Listing page → Change province → Province page
- [x] Province page → Clear filter → Listing page
- [x] Province page → Different transaction type → Listing page

### Browser Compatibility

Test on:
- [x] Chrome (latest)
- [x] Firefox (latest)
- [x] Safari (latest)
- [x] Edge (latest)

### Device Testing

Test on:
- [x] Desktop (1920x1080)
- [x] Tablet (iPad - 1024x768)
- [x] Mobile (iPhone - 375x667)

## Success Criteria

### SSR Validation
- [x] Data in initial HTML (no loading states)
- [x] No client-side API calls for location data
- [x] Server response time < 150ms

### UI Functionality
- [x] Provinces displayed with counts
- [x] Active state highlighting works
- [x] Expand/collapse works (if >10 items)
- [x] Clear filter works
- [x] View Transition compatible

### URL Compatibility
- [x] V1 URL format maintained
- [x] Query parameters preserved
- [x] No URL encoding issues
- [x] Vietnamese slugs work

### Performance
- [x] Database query < 50ms
- [x] HTML size < 100KB
- [x] No N+1 queries
- [x] Fast response times

### Edge Cases
- [x] Handles empty data gracefully
- [x] Long province names truncated
- [x] Special characters in slugs work

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SSR breaks on deployment | Low | High | Test on staging before production |
| Database query slow on production | Medium | Medium | Monitor query performance, add index if needed |
| View Transition script fails | Low | Low | Test on multiple browsers |

## Bug Tracking Template

If bugs found, document with:

```markdown
**Bug**: [Brief description]
**Steps to Reproduce**:
1. ...
2. ...

**Expected**: ...
**Actual**: ...
**Screenshot**: [if applicable]
**Browser**: Chrome 120, Windows 11
**Severity**: High/Medium/Low
```

## Next Steps

After all tests pass:
1. Deploy to staging
2. Run full regression test suite
3. Monitor production performance
4. Consider Phase 5 (Optional): District filter enhancement
