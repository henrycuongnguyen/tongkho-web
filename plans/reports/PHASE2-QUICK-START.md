# Phase 2 Quick Start Guide
## Menu Generation at Build Time

**TL;DR:** Create `src/data/menu-data.ts` + update `astro.config.mjs` + test + verify

---

## For Implementers (backend-developer)

### What to Build (2 files)

#### File 1: src/data/menu-data.ts
```typescript
// Copy from phase-02-menu-generation-build.md lines 45-77
// Key points:
// - Import buildMenuStructure from menu-service
// - Define FALLBACK_MENU (8 items)
// - Implement getMainNavItems() → Promise<NavItem[]>
// - Try-catch with error logging
// - Return fallback if database fails

export async function getMainNavItems(): Promise<NavItem[]> {
  try {
    console.log('[Menu Data] Fetching menu from database...');
    const structure = await buildMenuStructure();
    console.log('[Menu Data] Menu fetched successfully');
    return structure.main;
  } catch (error) {
    console.error('[Menu Data] Failed to fetch menu, using fallback:', error);
    return FALLBACK_MENU;
  }
}
```

#### File 2: astro.config.mjs Update
```javascript
// Add to existing astro.config.mjs (see lines 82-99)
// Add loadEnv() import
// Add vite.define block

import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

export default defineConfig({
  // ... existing config
  vite: {
    define: {
      'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL)
    }
  }
});
```

### Validation
```bash
npm run astro check        # Must return 0 errors
npm run build              # Must complete successfully
grep "Menu Data" build.log # Check for success message
```

### Time Estimate: 2.5 hours
- 1.0h: Create menu-data.ts
- 0.5h: Update astro.config.mjs
- 0.5h: Local testing
- 0.5h: Validation

### Success Criteria
- [ ] TypeScript compiles (0 errors)
- [ ] Build succeeds
- [ ] Code follows project patterns
- [ ] Error handling in place
- [ ] Comments/docs added

---

## For Testers (tester)

### Test Scenarios (6 total)

#### Scenario 1: Database Available
```bash
# Setup
export DATABASE_URL="postgres://user:pass@localhost/tongkho_web"
npm run build

# Check
grep "Menu fetched successfully" build.log  # Should exist
grep "Căn hộ chung cư" dist/                # Should find property types
```

#### Scenario 2: Database Unavailable
```bash
# Setup
unset DATABASE_URL  # or set invalid value
npm run build

# Check
grep "Failed to fetch menu" build.log      # Should exist
grep "Trang chủ" dist/                     # Should find fallback
grep "Liên hệ" dist/                       # Fallback menu items
```

#### Scenario 3: Menu in HTML
```bash
# Check built output contains database data
grep -c "property_type" dist/              # Count property types
grep "/mua-ban/" dist/                     # Check URLs
grep "/cho-thue/" dist/                    # Check URLs
grep "/du-an/" dist/                       # Check URLs
```

#### Scenario 4: Fallback Menu
```bash
# Verify all 8 fallback items
grep "Trang chủ" dist/
grep "Mua bán" dist/
grep "Cho thuê" dist/
grep "Dự án" dist/
grep "Tin tức" dist/
grep "Liên hệ" dist/
grep "Mạng lưới" dist/
grep "Tiện ích" dist/
```

#### Scenario 5: Build Performance
```bash
# Measure build time
time npm run build > /dev/null 2>&1

# Should be < 30 seconds increase from baseline
# Menu service should log: < 500ms execution
```

#### Scenario 6: Cross-Browser
```bash
# Build success check is same for all browsers
# Verify dist/index.html loads in:
# - Chrome, Firefox, Safari, Edge (desktop)
# - Chrome Mobile, Safari iOS (mobile)
# Check: menu displays, links work, responsive
```

### Time Estimate: 3.5 hours
- 0.5h: Setup test environment
- 1.0h: Run 6 scenarios
- 1.0h: Performance benchmarks
- 1.0h: Cross-browser testing

### Pass Criteria
- [ ] Build succeeds with DB
- [ ] Build succeeds without DB (fallback)
- [ ] Menu data in HTML (database scenario)
- [ ] Fallback menu complete (no-DB scenario)
- [ ] Build time <30s increase
- [ ] Cross-browser compatible

---

## For Code Reviewers (code-reviewer)

### Files to Review
1. `src/data/menu-data.ts` (new file, ~78 lines)
2. `astro.config.mjs` (modified, vite block added)

### Review Checklist

#### TypeScript (15 min)
```bash
npm run astro check
# Verify: 0 errors, 0 warnings
# Check: All types imported correctly
# Check: No implicit any types
```

#### Security (30 min)
- [ ] No hardcoded secrets
- [ ] DATABASE_URL only in .env
- [ ] SQL injection protected (Drizzle ORM)
- [ ] Error messages safe
- [ ] Fallback menu safe
- [ ] No console.error with secrets

#### Performance (30 min)
- [ ] Build time increase < 30 seconds
- [ ] Menu fetch < 500ms
- [ ] Caching works (check logs)
- [ ] No bundle size increase
- [ ] Database indexes utilized

#### Code Quality (45 min)
- [ ] Project style followed
- [ ] Clear variable names
- [ ] JSDoc comments present
- [ ] Error handling comprehensive
- [ ] No code duplication
- [ ] Complexity acceptable

#### Documentation (30 min)
- [ ] Function comments complete
- [ ] Parameter documentation
- [ ] Return types documented
- [ ] Error cases listed
- [ ] Usage examples present

#### Integration (30 min)
- [ ] No breaking changes
- [ ] Phase 1 service used correctly
- [ ] Types match interfaces
- [ ] Astro config compatible
- [ ] Phase 3 ready (header.astro can use it)

### Approval Criteria
- [ ] 0 blocking issues
- [ ] 0 TypeScript errors
- [ ] 0 security issues
- [ ] Performance targets met
- [ ] Code standards met
- [ ] Ready to merge

---

## Files Reference

### Main Files
- **Phase File:** `plans/260206-1440-ssg-menu-database-integration/phase-02-menu-generation-build.md`
- **Task Extract:** `plans/reports/project-manager-260206-1537-phase2-task-extraction.md`
- **TodoWrite:** `plans/reports/PHASE2-TODOWRITE-INITIALIZATION.md`

### Code Templates (Copy-Paste Ready)
- **Page:** `plans/reports/code-templates.md`
- Contains: menu-data.ts complete code (lines 45-77)
- Contains: astro.config.mjs update (lines 82-99)

### Research & Context
- **V1 Reference:** `reference/resaland_v1/models/menu.py`
- **Astro Pattern:** `plans/reports/implementation-quick-reference.md`
- **Full Plan:** `plans/260206-1440-ssg-menu-database-integration/plan.md`

---

## Commands Quick Reference

### Development
```bash
# Check TypeScript
npm run astro check

# Test menu service directly
node -e "import('./src/services/menu-service.ts').then(m => m.buildMenuStructure().then(console.log))"

# Build with logging
npm run build 2>&1 | tee build.log

# Check for menu in output
grep "Căn hộ chung cư" dist/
grep "/mua-ban/" dist/
```

### Testing
```bash
# Full build test
time npm run build

# Check build logs
tail -50 build.log | grep -i menu

# Verify static HTML
head -100 dist/index.html | grep -A 5 "<nav"
```

### Validation
```bash
# Database available
npm run build && grep "fetched successfully" build.log

# Database unavailable
unset DATABASE_URL && npm run build && grep "fallback" build.log
```

---

## Decision Matrix

### If TypeScript Errors:
1. Check type imports in menu-data.ts
2. Verify astro.config.mjs syntax
3. Run `npm run astro check` for details
4. Reference Phase 1 types (menu.ts)

### If Build Fails:
1. Check DATABASE_URL in .env
2. Verify database connection
3. Check astro.config.mjs vite block
4. Review build.log for errors
5. Fallback should still create HTML

### If Menu Missing in HTML:
1. Check build logs for "fetched successfully"
2. Verify database query worked
3. Check fallback menu if DB unavailable
4. Grep for property type names

### If Build Too Slow:
1. Check menu service cache logs
2. Verify database indexes exist
3. Measure query time separately
4. Review Phase 1 performance notes

---

## Expected Output Examples

### Successful Build Logs
```
[Menu Service] Building menu structure...
[Menu Service] Cache miss, fetching: property_types_1
[Menu Service] Fetched 15 property types for transaction 1
[Menu Service] Cache miss, fetching: property_types_2
[Menu Service] Fetched 12 property types for transaction 2
[Menu Service] Cache miss, fetching: property_types_3
[Menu Service] Fetched 8 property types for transaction 3
[Menu Service] Cache miss, fetching: news_folders
[Menu Service] Fetched 6 news folders
[Menu Service] Menu structure built successfully
[Menu Data] Menu fetched successfully
```

### HTML Content Check
```bash
$ grep "Căn hộ chung cư" dist/index.html
<a href="/mua-ban/can-ho-chung-cu">Căn hộ chung cư</a>

$ grep "/tin-tuc/" dist/index.html
<a href="/tin-tuc/tin-thi-truong">Tin thị trường</a>
<a href="/tin-tuc/tin-phap-ly">Tin pháp lý</a>
```

### Performance Metrics
```
Build complete: 42.5 seconds
Menu service: 342ms
Database queries: 251ms
Cache effectiveness: Hit 2nd run (4ms)
Result: ✅ Passed (<30s increase)
```

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| `DATABASE_URL undefined` | Not in .env | Add to .env.example, check load |
| TypeScript error | Import path wrong | Check menu.ts location (Phase 1) |
| Build hangs | DB connection slow | Timeout occurs, fallback triggers |
| Menu missing | Query failed silently | Check database connection, review logs |
| Fallback shows | DB unavailable (expected) | Verify error logs show failure |
| Build slow (>1min) | Database indexes missing | Apply indexes from Phase 1 |

---

## Status Tracking

### Implementation
- [ ] Code created (Task 2.1)
- [ ] Config updated (Task 2.2)
- [ ] DB connection tested (Task 2.3)
- [ ] Build succeeds (Task 2.4)
- [ ] Menu in HTML verified (Task 2.5)
- [ ] Performance measured (Task 2.6)

### Testing
- [ ] Build with DB available (Task 3.1)
- [ ] Build with DB unavailable (Task 3.2)
- [ ] Menu structure verified (Task 3.3)
- [ ] Fallback menu verified (Task 3.4)
- [ ] Performance benchmarks (Task 3.5)
- [ ] Cross-browser testing (Task 3.6)

### Code Review
- [ ] TypeScript check (Task 4.1)
- [ ] Security review (Task 4.2)
- [ ] Performance verify (Task 4.3)
- [ ] Code quality (Task 4.4)
- [ ] Documentation (Task 4.5)
- [ ] Integration check (Task 4.6)

---

## Contact Points

**If blocked:** Check phase file for context (lines mentioned)
**If questions:** See full task extraction report
**If need code:** See code-templates.md
**If need patterns:** See implementation-quick-reference.md

---

**Ready to Start?** → Copy phase file lines → Run commands → Check results → Done!
