# Phase 2 TodoWrite Initialization
## SSG Menu with Database Integration - Menu Generation at Build Time

**Created:** 2026-02-06 15:37
**Status:** Ready for Implementation
**Plan Location:** `d:\worktrees\tongkho-web-feature-menu\plans\260206-1440-ssg-menu-database-integration\`

---

## Quick Reference

### TodoWrite Structure (Copy-Paste Ready)

```
📋 PHASE 2: Menu Generation at Build Time

Step 0: Phase 2 Foundation [completed]
- Phase 1 (Database Schema & Service) ✅ COMPLETE
- Understanding: Astro SSG pattern & top-level await ✅
- Dependencies satisfied: menu-service.ts ready ✅

Step 1: Analysis & Task Extraction [in_progress]
- Read phase file completely ✅
- Map dependencies and blockers ✅
- Identify required skills ✅
- Extract implementation tasks ✅

Step 2: Implementation [pending]
[ ] 2.1: Create src/data/menu-data.ts (1 hour)
[ ] 2.2: Update astro.config.mjs (30 min)
[ ] 2.3: Test database connection (15 min)
[ ] 2.4: Run full build cycle (30 min)
[ ] 2.5: Verify menu in static HTML (15 min)
[ ] 2.6: Measure build time impact (15 min)

Step 3: Testing [pending]
[ ] 3.1: Test build with database available (30 min)
[ ] 3.2: Test build with database unavailable (30 min)
[ ] 3.3: Verify menu data in built HTML (30 min)
[ ] 3.4: Verify fallback menu activation (30 min)
[ ] 3.5: Performance benchmarks <30s (30 min)
[ ] 3.6: Cross-browser rendering (45 min)

Step 4: Code Review [pending]
[ ] 4.1: TypeScript compilation check (15 min)
[ ] 4.2: Security review (30 min)
[ ] 4.3: Performance verification (30 min)
[ ] 4.4: Code quality & readability (45 min)
[ ] 4.5: Documentation completeness (30 min)
[ ] 4.6: Integration point validation (30 min)

Step 5: Finalize [pending]
[ ] 5.1: Fix code review issues
[ ] 5.2: Update project roadmap
[ ] 5.3: Create Phase 3 prep docs
[ ] 5.4: Mark Phase 2 complete
```

---

## Phase Overview

### What Phase 2 Does
Integrates menu service (from Phase 1) with Astro's build process, replacing hardcoded menu data with database-driven generation. Fetches menu data once at build time, bakes it into static HTML.

### Key Characteristics
- **Build Time:** Runs during `npm run build`
- **Runtime:** Zero runtime database queries (static HTML)
- **Fallback:** Graceful degradation if database unavailable
- **Duration:** 2-3 days
- **Blocker Count:** 0

### Success Definition
- Build completes successfully ✅
- Menu data fetched from database ✅
- Fallback menu used if database fails ✅
- Build time increase <30 seconds ✅
- Static HTML contains dynamic menu items ✅

---

## Implementation Tasks (Step 2)

### Task 2.1: Create src/data/menu-data.ts
**Time:** 1 hour | **Status:** Pending | **Blocker:** None

Creates a new module that serves as the interface between Astro build and the menu service. Fetches menu at build time using top-level await and includes fallback for error scenarios.

**What to Create:**
```
File: src/data/menu-data.ts
Lines: ~78
Function: getMainNavItems() → Promise<NavItem[]>
Imports: menu-service.ts, types/menu.ts
Fallback: 8 default menu items
Error Handling: Try-catch with console logging
```

**Acceptance Criteria:**
- [ ] Imports buildMenuStructure from Phase 1
- [ ] Has FALLBACK_MENU constant with 8 items
- [ ] getMainNavItems() returns Promise<NavItem[]>
- [ ] Error handling logs to console
- [ ] Returns fallback if database fails
- [ ] Type-safe (no `any` types)

**Reference:**
- Phase file lines 44-77 contain complete code template
- Fallback menu: Trang chủ, Mua bán, Cho thuê, Dự án, Tin tức, Liên hệ, Mạng lưới, Tiện ích

---

### Task 2.2: Update astro.config.mjs
**Time:** 30 min | **Status:** Pending | **Blocker:** None

Updates Astro configuration to ensure DATABASE_URL environment variable is available during the build process.

**What to Modify:**
```
File: astro.config.mjs
Changes: Add loadEnv() and vite.define block
Template: Lines 81-100 in phase file
Environment: NODE_ENV-aware loading
```

**Acceptance Criteria:**
- [ ] loadEnv() imported from vite
- [ ] Loads environment variables for current NODE_ENV
- [ ] DATABASE_URL defined in vite.define
- [ ] JSON.stringify() applied to string value
- [ ] Config compiles without errors

**Reference:**
- astro.config.mjs already exists, only add vite configuration block
- Must load .env file before build starts

---

### Task 2.3: Test Database Connection
**Time:** 15 min | **Status:** Pending | **Blocker:** Task 2.1, 2.2

Validates that database connection works in build context before running full build.

**What to Do:**
```bash
# Command 1: Check TypeScript
npm run astro check

# Command 2: Test service directly
node -e "import('./src/services/menu-service.ts').then(m => m.buildMenuStructure().then(console.log))"

# Command 3: Validate config
cat astro.config.mjs | grep -A 5 "vite:"
```

**Acceptance Criteria:**
- [ ] `npm run astro check` returns 0 errors
- [ ] Menu service executes without error
- [ ] Database connection successful
- [ ] Console shows cache hits/misses
- [ ] No TypeScript compilation errors

---

### Task 2.4: Run Full Build Cycle
**Time:** 30 min | **Status:** Pending | **Blocker:** Task 2.3

Executes the complete Astro build to verify menu integration works end-to-end.

**What to Do:**
```bash
npm run build 2>&1 | tee build.log

# Monitor output for:
# [Menu Service] Building menu structure...
# [Menu Service] Cache hit/miss messages
# [Menu Data] Menu fetched successfully
```

**Acceptance Criteria:**
- [ ] Build completes with exit code 0
- [ ] No TypeScript errors in output
- [ ] [Menu Service] logs appear
- [ ] dist/ folder created
- [ ] Build time recorded (baseline for Task 3.5)
- [ ] No build warnings or critical issues

---

### Task 2.5: Verify Menu Data in Static HTML
**Time:** 15 min | **Status:** Pending | **Blocker:** Task 2.4

Confirms that dynamic menu items from the database are actually baked into the static HTML output.

**What to Verify:**
```bash
# Check for specific menu items
grep -r "Căn hộ chung cư" dist/
grep -r "Mua bán" dist/index.html
grep -r "/tin-tuc/" dist/
grep -r "property_type" dist/

# Spot-check HTML structure
head -100 dist/index.html | grep -A 5 "<nav"
```

**Acceptance Criteria:**
- [ ] Property type items visible in HTML
- [ ] Vietnamese labels present (Căn hộ chung cư, etc.)
- [ ] URLs correctly formatted (/mua-ban/{slug})
- [ ] News folder items present
- [ ] No undefined or null values in output
- [ ] HTML is valid and semantic

---

### Task 2.6: Measure Build Time Impact
**Time:** 15 min | **Status:** Pending | **Blocker:** Task 2.4

Compares build time before and after menu integration to ensure performance target met (<30 seconds increase).

**What to Measure:**
```bash
# Parse build.log for timing info
grep -i "build complete" build.log
grep -i "total time" build.log

# Or re-run with timing
time npm run build > build2.log 2>&1
```

**Acceptance Criteria:**
- [ ] Build time increase < 30 seconds
- [ ] Menu service execution < 500ms
- [ ] Database queries optimized
- [ ] Cache effective (cache hits work)
- [ ] Metrics recorded in task notes

---

## Testing Tasks (Step 3)

### Task 3.1: Test Build with Database Available
**Time:** 30 min | **Status:** Pending | **Blocker:** Task 2.4

Verifies that when database is accessible, menu data loads correctly from database.

**Scenario:**
- DATABASE_URL points to valid database
- Database server is running
- Connection can be established

**Acceptance Criteria:**
- [ ] Build succeeds (exit 0)
- [ ] Menu data fetched from database
- [ ] All property types populated
- [ ] News folders included
- [ ] No fallback menu used
- [ ] Logs: "[Menu Data] Menu fetched successfully"

---

### Task 3.2: Test Build with Database Unavailable
**Time:** 30 min | **Status:** Pending | **Blocker:** Task 2.4

Confirms graceful degradation: build succeeds with fallback menu when database unreachable.

**Scenario:**
- DATABASE_URL invalid or commented out
- Database server offline or unreachable
- Connection attempt fails

**Acceptance Criteria:**
- [ ] Build still succeeds (exit 0) - critical
- [ ] Fallback menu used automatically
- [ ] Error logged: "[Menu Data] Failed to fetch menu"
- [ ] No build failure or crash
- [ ] dist/index.html generated with fallback
- [ ] User experience preserved

---

### Task 3.3: Verify Menu Data in Built HTML
**Time:** 30 min | **Status:** Pending | **Blocker:** Task 2.4

Comprehensive validation of menu structure and content in generated static HTML.

**Validation Checklist:**
- [ ] <nav> element contains all menu sections
- [ ] Property type items (Mua bán, Cho thuê, Dự án)
- [ ] Links formatted correctly (/mua-ban/{slug})
- [ ] News folder structure present
- [ ] No undefined/null values
- [ ] HTML structure valid
- [ ] Semantic markup preserved

---

### Task 3.4: Verify Fallback Menu Activation
**Time:** 30 min | **Status:** Pending | **Blocker:** Task 3.2

Confirms fallback menu displays correctly and completely when database fails.

**Fallback Menu Items (Must All Be Present):**
1. Trang chủ (/)
2. Mua bán (/mua-ban)
3. Cho thuê (/cho-thue)
4. Dự án (/du-an)
5. Tin tức (/tin-tuc)
6. Liên hệ (/lien-he)
7. Mạng lưới (/mang-luoi)
8. Tiện ích (/tien-ich)

**Acceptance Criteria:**
- [ ] All 8 items present
- [ ] Links functional
- [ ] Structure matches format
- [ ] No TypeScript errors
- [ ] Rendering correct

---

### Task 3.5: Performance Benchmarks (<30s increase)
**Time:** 30 min | **Status:** Pending | **Blocker:** Task 2.4

Validates that build time performance meets success criteria.

**Targets:**
- Build time increase: < 30 seconds
- Menu generation: < 500ms
- Database queries: optimized
- Caching: effective
- CI/CD impact: minimal

**Measurement Points:**
- [ ] Baseline time (before integration)
- [ ] New time (with integration)
- [ ] Delta (increase amount)
- [ ] Menu service logs (timing)
- [ ] Database query times
- [ ] Cache effectiveness

---

### Task 3.6: Cross-Browser Rendering Verification
**Time:** 45 min | **Status:** Pending | **Blocker:** Task 2.4

Tests menu rendering across different browsers to ensure compatibility.

**Browser Coverage:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (if available)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

**Test Points:**
- [ ] Menu displays correctly
- [ ] Dropdowns function properly
- [ ] Responsive design works
- [ ] No layout shifts
- [ ] Accessibility maintained
- [ ] Navigation functional

---

## Code Review Tasks (Step 4)

### Task 4.1: TypeScript Compilation Check
**Time:** 15 min | **Status:** Pending | **Blocker:** Task 2.1, 2.2

Ensures all TypeScript code compiles without errors or warnings.

**Checks:**
```bash
npm run astro check
npm run build 2>&1 | grep -i "typescript\|error"
```

**Acceptance Criteria:**
- [ ] 0 TypeScript errors
- [ ] 0 TypeScript warnings
- [ ] All types properly annotated
- [ ] No implicit `any`
- [ ] Interfaces correctly exported/imported

---

### Task 4.2: Security Review
**Time:** 30 min | **Status:** Pending | **Blocker:** Task 2.1, 2.2

Verifies no security vulnerabilities in implementation.

**Security Checklist:**
- [ ] No SQL injection risk (Drizzle ORM used)
- [ ] DATABASE_URL only in .env
- [ ] No secrets hardcoded
- [ ] Error messages safe
- [ ] No sensitive data in menu
- [ ] Fallback menu safe
- [ ] No console.error with secrets

**Key Focus:**
- Database credentials protection
- SQL injection prevention
- Error message content
- Data exposure risks
- Fallback safety

---

### Task 4.3: Performance Verification
**Time:** 30 min | **Status:** Pending | **Blocker:** Task 3.5

Confirms build performance meets requirements.

**Metrics:**
- [ ] Build increase < 30 seconds
- [ ] Menu generation < 500ms
- [ ] Queries < 100ms each
- [ ] Cache effective
- [ ] No bundle size increase
- [ ] Database indexes used

---

### Task 4.4: Code Quality & Readability
**Time:** 45 min | **Status:** Pending | **Blocker:** Task 2.1, 2.2

Ensures code quality meets project standards.

**Review Points:**
- [ ] Consistent with project style
- [ ] Clear variable names
- [ ] JSDoc comments
- [ ] Error handling comprehensive
- [ ] No code smells
- [ ] DRY principle followed
- [ ] Complexity acceptable

---

### Task 4.5: Documentation Completeness
**Time:** 30 min | **Status:** Pending | **Blocker:** Task 2.1, 2.2

Verifies proper code and process documentation.

**Documentation:**
- [ ] JSDoc on public functions
- [ ] Parameter documentation
- [ ] Return type documentation
- [ ] Error cases documented
- [ ] Usage examples provided
- [ ] Complex logic commented
- [ ] Build process documented

---

### Task 4.6: Integration Point Validation
**Time:** 30 min | **Status:** Pending | **Blocker:** Task 2.1, 3.1, 3.2

Ensures seamless integration with existing codebase.

**Integration Checklist:**
- [ ] No breaking API changes
- [ ] Header component compatible
- [ ] Mobile menu compatible
- [ ] Fallback doesn't break anything
- [ ] Dependencies properly imported
- [ ] No circular dependencies
- [ ] Phase 3 ready (header.astro can use menu-data.ts)

---

## Key Dates & Milestones

| Date | Milestone | Status |
|------|-----------|--------|
| 2026-02-06 | Phase 1 Complete | ✅ Done |
| 2026-02-06 | Phase 2 Analysis | ✅ Done |
| 2026-02-07 | Phase 2 Implementation | 📅 Pending |
| 2026-02-08 | Phase 2 Testing | 📅 Pending |
| 2026-02-09 | Phase 2 Code Review | 📅 Pending |
| 2026-02-09 | Phase 2 Complete | 📅 Target |

---

## Delegation Instructions

### For backend-developer agent:
- **Focus:** Tasks 2.1 & 2.2
- **Files to Create/Modify:**
  - CREATE: `src/data/menu-data.ts`
  - MODIFY: `astro.config.mjs`
- **Template Code:** Phase file lines 44-100
- **Success:** TypeScript compiles, build succeeds

### For tester agent:
- **Focus:** Tasks 3.1-3.6
- **Test Scenarios:**
  - With database available
  - With database unavailable
  - Cross-browser verification
  - Performance benchmarks
- **Success:** All test scenarios pass

### For code-reviewer agent:
- **Focus:** Tasks 4.1-4.6
- **Code Quality:** Security, performance, standards
- **Review:** menu-data.ts & astro.config.mjs changes
- **Success:** Code passes all review criteria

---

## Files Involved

### To Create
- `src/data/menu-data.ts` - Main menu data module (78 lines)

### To Modify
- `astro.config.mjs` - Astro configuration (add vite block)

### To Reference (Read-Only)
- `src/services/menu-service.ts` - Menu service from Phase 1
- `src/types/menu.ts` - Type definitions from Phase 1
- `src/db/schema/menu.ts` - Schema exports from Phase 1
- `src/components/header/header-nav-data.ts` - Current hardcoded menu
- `astro.config.mjs` - Existing Astro config

### To Verify
- `dist/index.html` - Built output
- `build.log` - Build process log

---

## Unresolved Questions

1. **Does loadEnv() work correctly in Astro build context?**
   - Resolution: Test in Task 2.3
   - Impact: Critical
   - Fallback: Adjust configuration if needed

2. **Should fallback menu match current header-nav-data.ts exactly?**
   - Resolution: Verify before Task 2.1
   - Impact: Low
   - Change: Easily adjustable in FALLBACK_MENU constant

3. **Will console.log appear in CI/CD build logs?**
   - Resolution: Capture in Task 2.4
   - Impact: Low
   - Change: Adjust logging if needed

---

## Phase Success Criteria

✅ **PHASE 2 COMPLETE WHEN:**
1. All Step 2 tasks (2.1-2.6) done
2. All Step 3 tests (3.1-3.6) pass
3. All Step 4 reviews (4.1-4.6) pass
4. Build time < 5 minutes
5. Menu data from database in HTML
6. Fallback menu functional
7. TypeScript compilation succeeds
8. No security vulnerabilities
9. Performance <30s increase
10. All documentation current

---

## Report Metadata

| Field | Value |
|-------|-------|
| **Report Created** | 2026-02-06 15:37 |
| **Report Type** | TodoWrite Initialization |
| **Analysis Status** | Complete |
| **Ready for Implementation** | ✅ Yes |
| **Total Tasks Extracted** | 23 |
| **Estimated Total Time** | 2-3 days (12-16 hours) |
| **Critical Blockers** | 0 |
| **Risk Level** | Low |
| **Dependencies Met** | 100% |

---

**Next Action:** Delegate Step 2 implementation to backend-developer agent
