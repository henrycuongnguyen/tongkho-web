# Code Review: Location Search Service Fix

**Date:** 2026-02-09
**Reviewer:** code-reviewer
**Score:** 8/10

## Scope
- Files: `src/services/elasticsearch/location-search-service.ts`
- LOC changed: ~80 lines
- Focus: ES query structure, field names, province filtering

## Overall Assessment

Solid implementation matching v1 reference. Query structure correctly migrated from `must/best_fields` to `should/cross_fields + phrase_prefix`. Province filter now uses `city_id` instead of `n_parentid`.

## Critical Issues

None.

## High Priority

### 1. Missing `aactive` field verification (MEDIUM-HIGH)
**Line 97:** `{ term: { aactive: true } }`

Query assumes `aactive` field exists in ES index. If field doesn't exist or has different name, all results filtered out silently.

**Recommendation:** Verify field name in ES index mapping. v1 code may use different field name.

### 2. Missing project search fields (MEDIUM)
**Lines 114-128:** Only uses `n_name.folded` and `n_name.phrase`

v1 reference (api_customer.py:3312-3326) also includes:
- `project_name.folded`
- `project_name.phrase`

**Current code:** Only searches location names, not project names.

**Impact:** Project search won't work correctly in autocomplete.

**Recommendation:**
```typescript
fields: [
  'n_name.folded',
  'n_name.phrase',
  'project_name.folded',
  'project_name.phrase'
]
```

## Medium Priority

### 3. `citySlug` parameter unused (LOW-MEDIUM)
**Lines 16, 25, 36:** `citySlug` defined in interface and extracted but never used in `buildLocationQuery`.

**Recommendation:** Remove if not needed, or implement slug-to-id resolution.

### 4. No error logging for ES field details
**Lines 59-61:** Only logs status code on failure.

**Recommendation:** Log full response body for debugging field mapping issues.

## Low Priority

### 5. Magic number for minimum query length
**Line 28:** Hardcoded `2` for minimum query length.

**Recommendation:** Extract to constant for clarity.

## Edge Cases Found by Scout

From scout report (already addressed):
- Event timing race conditions: Handled
- Stale attribute data: Fixed
- Initial page load state: Correct
- Province change without reload: Handled

## Positive Observations

1. **Correct v1 structure:** `should` with `minimum_should_match: 1` matches v1 exactly
2. **Dual multi_match:** `cross_fields` + `phrase_prefix` for better matching
3. **Level format compatibility:** Supports both string ('TinhThanh') and legacy integer ('0', '1', '2')
4. **Graceful slug fallback:** `n_slug_v1 || n_slug` for v1 URL compatibility
5. **Full name building:** Proper hierarchy with district/city context
6. **provinceId/districtId populated:** Now correctly set from `city_id`/`district_id` fields

## Recommended Actions

1. **Verify:** Check ES index has `aactive` field (or correct alternative)
2. **Add:** `project_name.folded` and `project_name.phrase` to search fields if project search needed
3. **Remove:** Unused `citySlug` parameter or implement slug resolution
4. **Test:** Verify search works for all three levels (province, district, ward)

## Metrics

- Type Coverage: 100% (all types defined)
- Test Coverage: N/A (no tests yet)
- Linting Issues: 0 (clean compile)

## Unresolved Questions

1. Is `aactive` the correct field name in ES index?
2. Should project search be included in location autocomplete?
3. Is there ES index schema documentation available?
4. What happens if cityId doesn't exist in ES index (404 or empty results)?
