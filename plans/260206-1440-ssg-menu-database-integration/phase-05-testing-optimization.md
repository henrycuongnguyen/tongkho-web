# Phase 5: Testing & Optimization

**Duration:** 2-3 days
**Priority:** High
**Dependencies:** Phase 4 complete
**Status:** Pending

---

## Overview

Comprehensive testing and performance optimization to ensure production-ready quality.

---

## Context Links

- **Main Plan:** [plan.md](./plan.md)
- **Phase 4:** [phase-04-news-folder-hierarchy.md](./phase-04-news-folder-hierarchy.md)
- **Research:** [plans/reports/researcher-260206-1443-astro-ssg-database-integration.md](../../plans/reports/researcher-260206-1443-astro-ssg-database-integration.md)

---

## Testing Strategy

### 1. Unit Tests (1 day)
**Already completed in Phase 1**
- Menu service functions
- Data transformations
- Cache behavior

### 2. Build Testing (3-4 hours)

```bash
# Test 1: Normal build
npm run build
# Expected: Success, menu fetched, <5 min build time

# Test 2: Build without database
DATABASE_URL="" npm run build
# Expected: Success with fallback menu

# Test 3: Build with slow database
# Simulate by adding delay in service
# Expected: Completes with warnings

# Test 4: Parallel builds
npm run build & npm run build
# Expected: Both succeed, caching works correctly
```

**Validation:**
- Build completes successfully
- Menu data in dist/index.html
- Fallback activates on DB failure
- Build time <5 minutes

---

### 3. Integration Testing (4-5 hours)

#### Desktop Navigation
- [ ] Header renders with database menu
- [ ] All main menu items display correctly
- [ ] Property type dropdowns work (Mua bán, Cho thuê, Dự án)
- [ ] News folders dropdown works with sub-folders
- [ ] Hover states work correctly
- [ ] All links navigate correctly
- [ ] Active page highlighting works

#### Mobile Navigation
- [ ] Mobile menu button works
- [ ] Menu slides in/out correctly
- [ ] All sections expand/collapse
- [ ] Sub-folders expand correctly
- [ ] All links work on mobile
- [ ] Touch interactions smooth

#### Cross-Browser
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

### 4. Performance Testing (3-4 hours)

#### Build Performance
```bash
# Measure build time
time npm run build

# Target: <5 minutes total
# Menu fetching: <500ms
```

#### Database Query Performance
```sql
-- Run with EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT * FROM property_type
WHERE transaction_type = 1 AND aactive = true
ORDER BY display_order;

-- Target: <100ms per query
```

#### Bundle Size
```bash
# Check bundle size
du -sh dist/

# Target: Increase <5KB from baseline
```

#### Lighthouse Audit
```bash
npm run build
npm run preview
# Run Lighthouse in Chrome DevTools

# Targets:
# - Performance: 100
# - Accessibility: 100
# - Best Practices: 100
# - SEO: 100
```

---

### 5. Database Optimization (2-3 hours)

#### Add Missing Indexes
```sql
-- Property type queries
CREATE INDEX IF NOT EXISTS idx_property_type_trans_active
ON property_type(transaction_type, aactive, display_order)
WHERE aactive = true;

-- Folder queries
CREATE INDEX IF NOT EXISTS idx_folder_parent_publish_order
ON folder(parent, publish, display_order)
WHERE publish = 'T';

-- Verify index usage
EXPLAIN ANALYZE
SELECT * FROM property_type
WHERE transaction_type = 1 AND aactive = true
ORDER BY display_order;

-- Should show "Index Scan" not "Seq Scan"
```

#### Connection Pooling
```typescript
// src/db/index.ts
const client = postgres(connectionString, {
  max: 10,              // Max connections
  idle_timeout: 20,     // Close idle connections
  connect_timeout: 10   // Connection timeout
});
```

---

### 6. Error Handling Testing (2 hours)

#### Test Scenarios
1. **Database unavailable**
   ```bash
   DATABASE_URL="postgresql://invalid" npm run build
   # Expected: Fallback menu, build succeeds
   ```

2. **Slow database (timeout)**
   ```typescript
   // Add delay in service for testing
   await new Promise(resolve => setTimeout(resolve, 10000));
   // Expected: Build completes with timeout warning
   ```

3. **Empty result sets**
   ```sql
   -- Temporarily set all property_types inactive
   UPDATE property_type SET aactive = false;
   npm run build
   # Expected: Empty dropdowns, no crashes
   ```

4. **Malformed data**
   ```sql
   -- Test with NULL values
   UPDATE property_type SET vietnamese = NULL WHERE id = 1;
   npm run build
   # Expected: Graceful handling, item skipped or default label
   ```

---

## Todo List

### Testing
- [ ] Run all unit tests (npm test)
- [ ] Test normal build cycle
- [ ] Test build without database
- [ ] Test desktop navigation (all browsers)
- [ ] Test mobile navigation (all devices)
- [ ] Run Lighthouse audit
- [ ] Test error scenarios
- [ ] Verify fallback menu works

### Optimization
- [ ] Add database indexes
- [ ] Optimize connection pooling
- [ ] Measure and document build time
- [ ] Measure and document query times
- [ ] Verify bundle size increase <5KB
- [ ] Profile memory usage during build

### Documentation
- [ ] Document test results
- [ ] Document performance metrics
- [ ] Update performance targets in docs
- [ ] Create troubleshooting guide

---

## Success Criteria

### Functional
- ✅ All tests pass
- ✅ All browsers work correctly
- ✅ Error handling works as expected
- ✅ Fallback menu works when DB unavailable

### Performance
- ✅ Build time <5 minutes
- ✅ Menu queries <500ms total
- ✅ Each query <100ms
- ✅ Bundle size increase <5KB
- ✅ Lighthouse score 100/100

### Quality
- ✅ No TypeScript errors
- ✅ No console errors
- ✅ No accessibility issues
- ✅ Code coverage >80%

---

## Performance Benchmarks

### Baseline (Before)
- Build time: ~2 minutes
- Bundle size: ~3MB
- Menu generation: 0ms (static)

### Target (After)
- Build time: <5 minutes (+3 min acceptable)
- Bundle size: ~3.005MB (+5KB max)
- Menu generation: <500ms

### Actual (To be measured)
- Build time: ___ minutes
- Bundle size: ___ MB
- Menu generation: ___ ms
- Property type queries: ___ ms each
- News folder query: ___ ms

---

## Next Steps

**Phase 6:** Documentation and cleanup
