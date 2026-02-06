# Phase 2 Task Extraction & TodoWrite Initialization
**Date:** 2026-02-06 15:37
**Plan:** SSG Menu with Database Integration
**Phase:** Phase 2 - Menu Generation at Build Time
**Status:** Analysis Complete → Ready for Implementation

---

## Executive Summary

Analyzed Phase 2 (Menu Generation at Build Time) from comprehensive implementation plan. Phase 1 (Database Schema & Service Layer) is 100% COMPLETE with all tests passing and code reviewed.

**Phase 2 Overview:**
- Integrate menu service with Astro build process
- Replace hardcoded menu data with database-driven generation
- Build-time execution (no runtime DB queries)
- Fallback menu for error scenarios
- Duration: 2-3 days

---

## TodoWrite Initialization Structure

```
Step 0: Phase 2 Foundation [completed]
├─ Phase 1 (Database Schema & Service) ✅ COMPLETE
├─ Understanding: Astro SSG pattern & top-level await
├─ Dependencies satisfied: menu-service.ts ready
└─ Context loaded: Phase 2 overview understood

Step 1: Analysis & Task Extraction [in_progress]
├─ 1.1: Read phase file completely ✅
├─ 1.2: Map dependencies and blockers ✅
├─ 1.3: Identify required skills ✅
├─ 1.4: Extract implementation tasks ✅
├─ 1.5: Extract testing tasks ✅
└─ 1.6: Extract code review tasks ✅

Step 2: Implementation [pending]
├─ 2.1: Create src/data/menu-data.ts (1 hour)
├─ 2.2: Update astro.config.mjs (30 min)
├─ 2.3: Test database connection (15 min)
├─ 2.4: Run full build cycle (30 min)
├─ 2.5: Verify menu in static HTML (15 min)
└─ 2.6: Measure build time impact (15 min)

Step 3: Testing [pending]
├─ 3.1: Test build with database available
├─ 3.2: Test build with database unavailable
├─ 3.3: Verify menu data in built HTML
├─ 3.4: Verify fallback menu activation
├─ 3.5: Performance benchmarks (<30s increase)
└─ 3.6: Cross-browser rendering verification

Step 4: Code Review [pending]
├─ 4.1: TypeScript compilation check
├─ 4.2: Security review (no SQL injection, sensitive data)
├─ 4.3: Performance verification
├─ 4.4: Code quality & readability
├─ 4.5: Documentation completeness
└─ 4.6: Integration point validation

Step 5: Finalize [pending]
├─ 5.1: Fix any code review issues
├─ 5.2: Update project roadmap
├─ 5.3: Create Phase 3 prep documentation
└─ 5.4: Mark Phase 2 complete
```

---

## Task Extraction

### Step 2: Implementation Tasks

**Task 2.1: Create src/data/menu-data.ts**
- **Content:** Create menu data module that fetches menu from database at build time
- **Active Form:** Creating menu data module with database fetch and fallback
- **Acceptance Criteria:**
  - File created at `src/data/menu-data.ts`
  - Implements `getMainNavItems()` function
  - Includes fallback menu (8 main items)
  - Uses `buildMenuStructure()` from Phase 1
  - Error handling with console logging
  - Returns `Promise<NavItem[]>`
- **Estimated Time:** 1 hour
- **Dependencies:** Phase 1 complete ✅
- **Files Involved:**
  - CREATE: `src/data/menu-data.ts` (~78 lines)
  - REFERENCE: `src/services/menu-service.ts` (Phase 1)
  - REFERENCE: `src/types/menu.ts` (Phase 1)

**Task 2.2: Update astro.config.mjs**
- **Content:** Configure Astro to support DATABASE_URL during build process
- **Active Form:** Updating Astro config for build-time database access
- **Acceptance Criteria:**
  - astro.config.mjs modified
  - loadEnv() called with correct NODE_ENV
  - DATABASE_URL defined in vite.define
  - TypeScript types correct
  - Config compiles without errors
- **Estimated Time:** 30 minutes
- **Dependencies:** Phase 1 complete ✅
- **Files Involved:**
  - MODIFY: `astro.config.mjs` (~20 lines added)
  - REFERENCE: `.env.example` (check DATABASE_URL format)

**Task 2.3: Test Database Connection**
- **Content:** Verify database is accessible during build process
- **Active Form:** Testing database connectivity for Astro build
- **Acceptance Criteria:**
  - `npm run astro check` completes successfully
  - Menu service functions directly callable
  - No TypeScript compilation errors
  - Console logs show "[Menu Service] Cache hit/miss" messages
- **Estimated Time:** 15 minutes
- **Dependencies:** Tasks 2.1 & 2.2 complete
- **Commands:**
  ```bash
  npm run astro check
  node -e "import('./src/services/menu-service.ts').then(m => m.buildMenuStructure().then(console.log))"
  ```

**Task 2.4: Run Full Build Cycle**
- **Content:** Execute complete build to verify menu integration
- **Active Form:** Running full Astro build with menu generation
- **Acceptance Criteria:**
  - `npm run build` completes successfully
  - Build logs show menu service execution
  - dist/ folder generated without errors
  - Build time tracked (baseline for Step 3.5)
  - No TypeScript errors in build output
- **Estimated Time:** 30 minutes
- **Dependencies:** Tasks 2.1, 2.2, 2.3 complete
- **Commands:**
  ```bash
  npm run build 2>&1 | tee build.log
  # Review build.log for [Menu Service] and [Menu Data] logs
  ```

**Task 2.5: Verify Menu Data in Static HTML**
- **Content:** Confirm dynamic menu items are baked into static HTML
- **Active Form:** Verifying menu data presence in generated HTML
- **Acceptance Criteria:**
  - Menu items from database appear in dist/index.html
  - Specific Vietnamese property types found (e.g., "Căn hộ chung cư")
  - News folder items present
  - HTML structure matches expected NavItem format
  - No runtime JavaScript needed for menu
- **Estimated Time:** 15 minutes
- **Dependencies:** Task 2.4 complete
- **Commands:**
  ```bash
  grep -r "Căn hộ chung cư" dist/
  grep -r "Mua bán" dist/index.html
  grep -r "/tin-tuc/" dist/
  ```

**Task 2.6: Measure Build Time Impact**
- **Content:** Compare build time with and without menu integration
- **Active Form:** Measuring build performance impact
- **Acceptance Criteria:**
  - Build time increase documented
  - Success if <30 seconds increase
  - Database query time < 500ms
  - Performance acceptable for SSG pattern
  - Metrics recorded in task notes
- **Estimated Time:** 15 minutes
- **Dependencies:** Task 2.4 complete (baseline already captured)
- **Measurement Method:**
  ```bash
  # Baseline already in build.log
  # Compare with: time npm run build
  ```

---

### Step 3: Testing Tasks

**Task 3.1: Test Build with Database Available**
- **Content:** Verify build succeeds when database is accessible
- **Active Form:** Testing build success with active database connection
- **Acceptance Criteria:**
  - Build completes successfully
  - Menu data fetched from database
  - All property types populated
  - News folders included
  - No fallback menu used
  - Console shows "[Menu Data] Menu fetched successfully"
- **Estimated Time:** 30 minutes
- **Dependencies:** Task 2.4 complete
- **Test Scenario:**
  - Ensure .env has valid DATABASE_URL
  - Database server running
  - Execute `npm run build`
  - Check build logs for success messages

**Task 3.2: Test Build with Database Unavailable**
- **Content:** Verify graceful degradation when database unavailable
- **Active Form:** Testing fallback menu activation with database down
- **Acceptance Criteria:**
  - Build still completes successfully (does NOT fail)
  - Fallback menu used automatically
  - Error logged to console: "[Menu Data] Failed to fetch menu"
  - Fallback menu contains 8 main items
  - dist/index.html generated with fallback menu
  - User experience preserved
- **Estimated Time:** 30 minutes
- **Dependencies:** Task 2.4 complete
- **Test Scenario:**
  - Comment out or set invalid DATABASE_URL
  - Execute `npm run build`
  - Verify fallback menu in output
  - Restore DATABASE_URL

**Task 3.3: Verify Menu Data in Built HTML**
- **Content:** Comprehensive validation of menu structure in generated HTML
- **Active Form:** Validating menu structure and content in static HTML
- **Acceptance Criteria:**
  - Property type items visible (Mua bán, Cho thuê, Dự án)
  - News folder structure correct
  - All href attributes properly formatted
  - No undefined or null values
  - HTML structure valid and semantic
- **Estimated Time:** 30 minutes
- **Dependencies:** Task 2.4 complete
- **Validation Checklist:**
  - [ ] <nav> contains all menu items
  - [ ] Property type links formatted: `/mua-ban/{slug}`
  - [ ] News folder links formatted: `/tin-tuc/{name}`
  - [ ] No JavaScript errors in console
  - [ ] Mobile menu renders correctly

**Task 3.4: Verify Fallback Menu Activation**
- **Content:** Confirm fallback menu displays correctly when database fails
- **Active Form:** Validating fallback menu rendering and functionality
- **Acceptance Criteria:**
  - Fallback menu has all 8 items
  - Menu structure matches expected format
  - Links to all pages work
  - No TypeScript errors
  - Fallback content identical when database unavailable
- **Estimated Time:** 30 minutes
- **Dependencies:** Tasks 2.1, 3.2 complete
- **Fallback Menu Items:**
  - Trang chủ (/)
  - Mua bán (/mua-ban)
  - Cho thuê (/cho-thue)
  - Dự án (/du-an)
  - Tin tức (/tin-tuc)
  - Liên hệ (/lien-he)
  - Mạng lưới (/mang-luoi)
  - Tiện ích (/tien-ich)

**Task 3.5: Performance Benchmarks (<30s increase)**
- **Content:** Validate build time performance meets success criteria
- **Active Form:** Benchmarking build time performance
- **Acceptance Criteria:**
  - Build time increase < 30 seconds
  - Menu generation < 500ms
  - Database queries optimized
  - Caching effective (cache hits faster)
  - Performance acceptable for CI/CD pipeline
- **Estimated Time:** 30 minutes
- **Dependencies:** Task 2.4 complete
- **Success Criteria:**
  - Previous baseline: [to be captured in Task 2.4]
  - New build time: [measurement needed]
  - Increase: < 30 seconds
  - Menu service logs: < 500ms total

**Task 3.6: Cross-Browser Rendering Verification**
- **Content:** Verify menu displays correctly across different browsers
- **Active Form:** Testing menu rendering across browsers
- **Acceptance Criteria:**
  - Desktop browsers work (Chrome, Firefox, Safari, Edge)
  - Mobile browsers work (iOS Safari, Chrome Mobile)
  - Responsive design intact
  - Dropdown menus function
  - No layout shifts or visual issues
  - Accessibility maintained
- **Estimated Time:** 45 minutes
- **Dependencies:** Task 2.4 complete
- **Test Browsers:**
  - Chrome/Edge (latest)
  - Firefox (latest)
  - Safari (if available)
  - Mobile (iOS/Android)

---

### Step 4: Code Review Tasks

**Task 4.1: TypeScript Compilation Check**
- **Content:** Verify all TypeScript code compiles without errors
- **Active Form:** Checking TypeScript compilation
- **Acceptance Criteria:**
  - `npm run astro check` returns 0 errors
  - No TypeScript warnings
  - All type annotations correct
  - No implicit `any` types
  - Interfaces properly exported/imported
- **Estimated Time:** 15 minutes
- **Dependencies:** Task 2.1, 2.2 complete
- **Commands:**
  ```bash
  npm run astro check
  npm run build 2>&1 | grep -i "typescript\|error\|warn"
  ```

**Task 4.2: Security Review**
- **Content:** Verify no security vulnerabilities introduced
- **Active Form:** Reviewing security aspects of implementation
- **Acceptance Criteria:**
  - No SQL injection vulnerabilities (Drizzle ORM used)
  - No sensitive data in menu structure
  - Database credentials not exposed
  - Error messages don't leak sensitive info
  - Fallback safe when database fails
  - No hardcoded secrets in code
- **Estimated Time:** 30 minutes
- **Dependencies:** Task 2.1, 2.2 complete
- **Security Checklist:**
  - [ ] DATABASE_URL only in .env (not committed)
  - [ ] Drizzle ORM parameterized queries (verified)
  - [ ] Error messages safe for production
  - [ ] No console.error with sensitive data
  - [ ] Fallback menu safe for all scenarios

**Task 4.3: Performance Verification**
- **Content:** Confirm performance meets requirements
- **Active Form:** Verifying build performance requirements
- **Acceptance Criteria:**
  - Build time increase < 30 seconds
  - Menu generation < 500ms
  - Caching effective (2nd run faster)
  - Database queries optimized with indexes
  - No bundle size increase (SSG only)
- **Estimated Time:** 30 minutes
- **Dependencies:** Task 3.5 complete
- **Metrics to Check:**
  - Build time: baseline vs new
  - Menu service logs: cache hits/misses
  - Query execution time
  - Caching effectiveness

**Task 4.4: Code Quality & Readability**
- **Content:** Ensure code meets project quality standards
- **Active Form:** Reviewing code quality and readability
- **Acceptance Criteria:**
  - Code follows project conventions
  - Clear, descriptive variable names
  - Functions have JSDoc comments
  - Error handling comprehensive
  - No code smells or anti-patterns
  - Logic is clear and maintainable
- **Estimated Time:** 45 minutes
- **Dependencies:** Task 2.1, 2.2 complete
- **Review Points:**
  - [ ] Code style consistent with project
  - [ ] Comments explain "why" not "what"
  - [ ] Error handling covers edge cases
  - [ ] Function names describe purpose
  - [ ] No duplicate code (DRY principle)
  - [ ] Complexity acceptable

**Task 4.5: Documentation Completeness**
- **Content:** Verify code is properly documented
- **Active Form:** Checking documentation completeness
- **Acceptance Criteria:**
  - JSDoc comments on all public functions
  - README updated if needed
  - Inline comments for complex logic
  - Error cases documented
  - Type definitions clear
  - Build process documented
- **Estimated Time:** 30 minutes
- **Dependencies:** Task 2.1, 2.2 complete
- **Documentation Checklist:**
  - [ ] Function purpose documented
  - [ ] Parameters explained
  - [ ] Return types documented
  - [ ] Error cases listed
  - [ ] Usage examples provided

**Task 4.6: Integration Point Validation**
- **Content:** Verify seamless integration with existing codebase
- **Active Form:** Validating integration points
- **Acceptance Criteria:**
  - No breaking changes to existing APIs
  - Header component still works
  - Mobile menu still works
  - Fallback menu doesn't break components
  - All dependencies properly imported
  - No circular dependencies
- **Estimated Time:** 30 minutes
- **Dependencies:** Tasks 2.1, 3.1, 3.2 complete
- **Integration Checklist:**
  - [ ] menu-service.ts interface matches Phase 1
  - [ ] menu-data.ts exports match expected types
  - [ ] header.astro can consume new data (Phase 3 prep)
  - [ ] No import errors
  - [ ] Build process integration clean

---

## Dependency Map

```
Step 0 (Phase 1 Complete)
    ↓
Step 1 (Analysis)
    ↓
Step 2.1, 2.2 (Parallel creation)
    ↓
Step 2.3 (Validation)
    ↓
Step 2.4 (Full build)
    ├─→ Step 2.5 (HTML verification)
    ├─→ Step 2.6 (Performance measurement)
    ├─→ Step 3.1, 3.2, 3.3 (Parallel testing)
    │       ↓
    │   Step 3.4, 3.5, 3.6 (Parallel testing)
    │       ↓
    │   Step 4 (Code review)
    │
    └─→ Step 5 (Finalization)
```

---

## Skills Required

### Primary Skills (Activate Now)
1. **backend-developer**: Implement menu-data.ts, update config files
2. **tester**: Execute test scenarios, verify database behavior
3. **code-reviewer**: Review Phase 2 code quality and security

### Secondary Skills (On-Demand)
1. **debugger**: If build fails or database issues arise
2. **docs-manager**: Update documentation after Phase 2 complete

### Optional Skills
1. **performance-analyst**: For detailed performance benchmarking
2. **security-auditor**: For comprehensive security review

---

## Identified Ambiguities & Blockers

### No Critical Blockers Identified ✅
Phase 1 is complete, all dependencies satisfied.

### Minor Ambiguities

1. **Astro Config Environment Variables**
   - **Question:** Does loadEnv() correctly load DATABASE_URL in build context?
   - **Risk:** Low
   - **Mitigation:** Test in Task 2.3; fall back if needed
   - **Resolution:** Verify in `npm run astro check`

2. **Fallback Menu Content**
   - **Question:** Are the 8 default menu items correct/complete?
   - **Risk:** Very Low (easily changeable)
   - **Mitigation:** Based on current hardcoded menu in header-nav-data.ts
   - **Resolution:** Compare with existing implementation before Task 2.1

3. **Build Logging Output**
   - **Question:** Will console.log() appear in build output or be suppressed?
   - **Risk:** Low
   - **Mitigation:** Test in Task 2.4; adjust logging if needed
   - **Resolution:** Capture build.log and review

---

## Success Metrics

**Phase 2 Complete When:**
- ✅ All Step 2 implementation tasks done
- ✅ All Step 3 testing tasks pass
- ✅ All Step 4 code review tasks pass
- ✅ No blocking issues in Step 4
- ✅ Build time < 5 minutes total
- ✅ Menu data from database verified in HTML
- ✅ Fallback menu works

**Not Complete Until:**
- ❌ Any Step 2-4 task incomplete
- ❌ Build fails in any scenario
- ❌ TypeScript compilation errors
- ❌ Performance > 30s increase
- ❌ Menu data missing from HTML

---

## Next Phase Preparation

**Phase 3 (Component Integration)** will:
- Update `header.astro` to consume dynamic menu from menu-data.ts
- Update `header-mobile-menu.tsx` with new data structure
- Ensure UI/UX identical to current implementation
- Test dropdown menus and mobile responsiveness

**Phase 2 Must Deliver:**
- `src/data/menu-data.ts` (getMainNavItems() function)
- `astro.config.mjs` (DATABASE_URL configuration)
- Verified menu data in static HTML
- Verified fallback menu functionality

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 23 |
| **Implementation Tasks** | 6 |
| **Testing Tasks** | 6 |
| **Code Review Tasks** | 6 |
| **Estimated Duration** | 2-3 days |
| **Blockers** | 0 |
| **Ambiguities** | 3 (all low-risk) |
| **Dependencies Met** | ✅ 100% |

---

## Unresolved Questions

1. **Astro loadEnv() behavior in build context**: Will DATABASE_URL be properly available during build process? (Resolved in Task 2.3)

2. **Default fallback menu items**: Should we validate against current header-nav-data.ts to ensure 100% compatibility?

3. **Build output logging**: Will console.log() from menu service appear in CI/CD logs for debugging?

---

## Report Status

**Status:** Complete & Ready for Implementation
**Reviewed By:** Project Manager
**Approval:** Ready to delegate to backend-developer, tester, code-reviewer
**Next Action:** Initiate Step 2 implementation tasks
