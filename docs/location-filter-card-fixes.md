# Location Filter Card - Bug Fixes

## Issue: Error on Transaction-Only URLs

### Problem

Khi truy cập URLs như `/mua-ban` (transaction type only, không có property type hoặc location), component throw error:

```
Pattern: mua-ban
[LocationFilterCard] Failed to load side block: Error: Pattern missing location detail
```

### Root Cause

V1 logic không hỗ trợ pattern dạng transaction-only:
- ❌ `/mua-ban` - NOT supported
- ❌ `/cho-thue` - NOT supported
- ✅ `/can-ho-chung-cu` - Supported (property type)
- ✅ `/mua-ban/ha-noi` - Supported (transaction + location)

Component cũ vẫn cố gắng gọi `getSideBlock` với pattern "mua-ban", gây ra error.

### Solution

Thêm logic để **skip API call và hide card** khi URL là transaction-only:

```typescript
// Detect transaction-only URLs
const isTransactionUrl = VALID_TRANSACTIONS.includes(pathSegments[0]);
const shouldHideForTransactionOnly = isTransactionUrl && !locationSlug;

// Skip API call if transaction-only
if (!shouldHideForTransactionOnly) {
  sideBlocks = await getSideBlock({ pattern });
}

// Hide card for transaction-only URLs
const shouldHideCard = shouldHideForTransactionOnly || (!hasError && !block);
```

### Behavior After Fix

| URL | Behavior | Reason |
|-----|----------|--------|
| `/mua-ban` | Card hidden ✅ | Transaction-only (not supported) |
| `/cho-thue` | Card hidden ✅ | Transaction-only (not supported) |
| `/du-an` | Card hidden ✅ | Transaction-only (not supported) |
| `/mua-ban/ha-noi` | Card shown ✅ | Transaction + location (supported) |
| `/can-ho-chung-cu` | Card shown ✅ | Property type (supported) |
| `/can-ho-chung-cu/ha-noi` | Card shown ✅ | Property type + location (supported) |

### Testing

#### Before Fix
```
Navigate to: http://localhost:3000/mua-ban
Result: Console error, card might show error state
```

#### After Fix
```
Navigate to: http://localhost:3000/mua-ban
Result: Card hidden, no errors ✅
```

#### Test Cases

1. **Transaction-only URLs** (should hide card):
   ```
   /mua-ban
   /cho-thue
   /du-an
   ```

2. **Transaction + Location** (should show card):
   ```
   /mua-ban/ha-noi
   /cho-thue/ho-chi-minh
   /du-an/da-nang
   ```

3. **Property Type** (should show card):
   ```
   /can-ho-chung-cu
   /nha-dat
   /van-phong
   ```

4. **Property Type + Location** (should show card):
   ```
   /can-ho-chung-cu/ha-noi
   /nha-dat/quan-1
   /van-phong/ba-dinh
   ```

### Code Changes

**File:** `src/components/listing/sidebar/location-filter-card.astro`

**Changes:**
1. Added `isTransactionUrl` flag detection
2. Added `shouldHideForTransactionOnly` flag
3. Skip `getSideBlock` call when transaction-only
4. Update `shouldHideCard` logic

**Lines Changed:** ~10 lines
**Impact:** Low (only affects transaction-only URLs)

### Related Issues

None. This is a preventive fix to improve user experience.

### Future Considerations

If we want to support transaction-only URLs in the future, we need to:
1. Update `getSideBlock` service to handle transaction-only patterns
2. Add aggregation logic for "all property types" in Elasticsearch
3. Update title generation to handle generic "Mua bán bất động sản" cases

For now, hiding the card is the correct behavior as it matches v1 expectations.
