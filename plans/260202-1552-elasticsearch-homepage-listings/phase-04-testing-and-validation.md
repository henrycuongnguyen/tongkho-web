# Phase 4: Testing & Validation

## Context

- **Parent Plan:** [plan.md](./plan.md)
- **Depends on:** [Phase 3](./phase-03-integrate-elasticsearch-with-homepage.md)

## Overview

| Field | Value |
|-------|-------|
| Priority | P1 |
| Status | pending |
| Review | pending |

Validate the Elasticsearch integration works correctly in development and prepare for production.

## Key Insights

- Need to verify ES connection with real credentials
- Test both success and failure scenarios
- Ensure no regressions in UI
- Verify SSR mode works for deployment

## Requirements

### Functional
- Homepage loads real ES data
- Fallback works when ES unavailable
- All property card fields display correctly

### Non-functional
- No console errors
- Page performance acceptable
- Build succeeds

## Test Cases

### 1. ES Connection Test
```bash
# Test direct ES access
curl -X GET "https://elastic.tongkhobds.com/real_estate/_search?size=1" \
  -H "Authorization: ApiKey OTFsazRaa0JXOHN1MG5HMGxGbU06Z2xBVDFnLWlSZC1VY2NNSVItcGtZQQ==" \
  -H "Content-Type: application/json"
```

### 2. Development Server Test
```bash
npm run dev
# Visit http://localhost:4321
# Verify:
# - Properties load from ES
# - Sale section shows 4 listings
# - Rent section shows 4 listings
# - Property cards display correctly
```

### 3. Fallback Test
```bash
# Temporarily invalid API key in .env
ES_API_KEY=invalid_key
npm run dev
# Verify: Mock data appears instead
```

### 4. Build Test
```bash
npm run build
# Should complete without errors
```

### 5. Preview Test
```bash
npm run preview
# Visit http://localhost:4321
# Verify SSR works in production mode
```

## Validation Checklist

### Data Validation
- [ ] ES returns valid JSON response
- [ ] Response contains expected fields
- [ ] Property count matches limit (4)
- [ ] Both sale and rent queries work

### UI Validation
- [ ] Property cards render correctly
- [ ] Images load (thumbnails)
- [ ] Prices formatted correctly
- [ ] Location/address displayed
- [ ] "Hot" and "Featured" badges appear where applicable

### Error Handling
- [ ] Invalid API key → fallback to mock
- [ ] ES timeout → fallback to mock
- [ ] Network error → fallback to mock
- [ ] Console shows error message (for debugging)

### Performance
- [ ] Homepage loads < 3 seconds
- [ ] No waterfall requests blocking render
- [ ] ES query executes in parallel

## Todo List

- [ ] Run ES connection test via curl
- [ ] Start dev server and verify homepage
- [ ] Check browser console for errors
- [ ] Test fallback by breaking API key
- [ ] Run production build
- [ ] Test preview mode
- [ ] Document any field mapping issues

## Success Criteria

- [ ] All test cases pass
- [ ] No console errors in browser
- [ ] Build completes successfully
- [ ] Performance acceptable

## Debugging Commands

```bash
# Check ES index mapping
curl -X GET "https://elastic.tongkhobds.com/real_estate/_mapping" \
  -H "Authorization: ApiKey OTFsazRaa0JXOHN1MG5HMGxGbU06Z2xBVDFnLWlSZC1VY2NNSVItcGtZQQ=="

# Search with verbose output
curl -X POST "https://elastic.tongkhobds.com/real_estate/_search?pretty" \
  -H "Authorization: ApiKey OTFsazRaa0JXOHN1MG5HMGxGbU06Z2xBVDFnLWlSZC1VY2NNSVItcGtZQQ==" \
  -H "Content-Type: application/json" \
  -d '{"query":{"match_all":{}},"size":2}'
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| ES fields don't match expected | High | Update mapping in Phase 2 |
| Performance issues | Medium | Add caching layer |
| Build fails | High | Check SSR config |

## Next Steps

After all tests pass:
1. Commit changes with descriptive message
2. Deploy to staging environment
3. Monitor for production issues
