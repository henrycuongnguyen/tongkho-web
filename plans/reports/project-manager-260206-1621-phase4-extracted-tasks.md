# Phase 4: Extracted Tasks & Dependencies

**Report Date:** 2026-02-06 16:21
**Status:** Analysis Complete
**Total Tasks:** 12 (5 implementation + 7 testing)

---

## ALL EXTRACTED TASKS

### Implementation Tasks (Step 2.X)

#### Step 2.1: Verify fetchNewsFolders() Implementation
**Duration:** 30 minutes
**Priority:** High
**File:** `src/services/menu-service.ts`
**Status:** pending

**Requirements:**
- Verify or implement fetchNewsFolders() function
- Must handle root folders (parent=11)
- Must recursively fetch sub-folders (parent=root folder id)
- Must sort by display_order
- Must filter only published folders (publish='T')
- Must return array with subFolders nested property

**Expected Output:**
```typescript
interface NewsFolder {
  id: number;
  name: string;
  label: string;
  subFolders?: NewsFolder[];
}
```

**Test Command:**
```typescript
const folders = await fetchNewsFolders();
console.log(JSON.stringify(folders, null, 2));
```

---

#### Step 2.2: Update buildMainNav() With Nested Children
**Duration:** 1 hour
**Priority:** High
**File:** `src/services/menu-service.ts`
**Status:** pending
**Dependency:** Step 2.1 complete

**Requirements:**
- Update buildMainNav() function
- News menu must include nested children structure
- Parent folder hrefs: `/tin-tuc/{folder.name}`
- Sub-folder hrefs: `/tin-tuc/{subfolder.name}`
- Preserve existing UI structure

**Expected Output:**
```typescript
{
  label: 'Tin tức',
  href: '/tin-tuc',
  children: newsFolders.map(folder => ({
    label: folder.label || '',
    href: `/tin-tuc/${folder.name}`,
    children: folder.subFolders?.map(sub => ({
      label: sub.label || '',
      href: `/tin-tuc/${sub.name}`
    }))
  }))
}
```

**Validation:**
- Compile without errors
- All URLs properly formed
- Labels properly mapped from database

---

#### Step 2.3: Test News Navigation - Desktop Dropdown
**Duration:** 2 hours
**Priority:** High
**Environment:** Desktop browser
**Status:** pending
**Dependency:** Step 2.2 complete

**Test Scenarios:**

1. **Hover Interaction**
   - Hover over "Tin tức" menu item
   - Verify dropdown shows all main folders
   - Verify folder labels match database

2. **Nested Dropdown**
   - Hover over folder with sub-folders
   - Verify nested dropdown appears
   - Verify sub-folder labels visible

3. **Navigation - Main Folder**
   - Click on main folder (e.g., "Tin thị trường")
   - Verify navigates to `/tin-tuc/tin-thi-truong`
   - Verify page loads correctly

4. **Navigation - Sub-folder**
   - Click on sub-folder (e.g., "TP.HCM")
   - Verify navigates to `/tin-tuc/tp-hcm`
   - Verify page loads correctly

**Verification Checklist:**
- [ ] All folders visible in dropdown
- [ ] Nested folders show sub-items
- [ ] All links navigate correctly
- [ ] URLs match expected pattern
- [ ] No console errors
- [ ] Styling preserved from Phase 3

---

#### Step 2.4: Test News Navigation - Mobile Menu
**Duration:** 2 hours
**Priority:** High
**Environment:** Mobile browser/emulator/device
**Status:** pending
**Dependency:** Step 2.2 complete

**Test Scenarios:**

1. **Expand Main Menu**
   - Tap "Tin tức" item in mobile menu
   - Verify folders expand smoothly
   - Verify all folders visible

2. **Expand Sub-folders**
   - Tap folder with sub-folders (e.g., "Tin thị trường")
   - Verify sub-folders expand
   - Verify smooth animation

3. **Navigate - Main Folder**
   - Tap main folder item
   - Verify navigates to folder page
   - Verify layout responsive on mobile

4. **Navigate - Sub-folder**
   - Tap sub-folder item (e.g., "TP.HCM")
   - Verify navigates to folder page
   - Verify layout responsive on mobile

**Verification Checklist:**
- [ ] Touch interactions smooth (no lag)
- [ ] Expandable items clear (chevron/arrow)
- [ ] All taps navigate correctly
- [ ] Mobile layout responsive
- [ ] No console errors
- [ ] Styling matches Phase 3 mobile design

---

#### Step 2.5: Create News Folder Dynamic Pages
**Duration:** 2-3 hours
**Priority:** High
**File:** `src/pages/tin-tuc/[folder].astro`
**Status:** pending
**Dependency:** Step 2.2 complete

**Requirements:**
- Create dynamic page template using Astro getStaticPaths()
- Generate static page for each published folder
- Proper page title and layout
- Display folder content/information

**Implementation:**

```typescript
---
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { folder } from '@/db/schema/menu';
import MainLayout from '@/layouts/main-layout.astro';

export async function getStaticPaths() {
  const folders = await db
    .select()
    .from(folder)
    .where(eq(folder.publish, 'T'));

  return folders.map(f => ({
    params: { folder: f.name },
    props: { folder: f }
  }));
}

const { folder: currentFolder } = Astro.props;
---

<MainLayout title={currentFolder.label}>
  <h1>{currentFolder.label}</h1>
  <!-- News articles for this folder -->
</MainLayout>
```

**Validation:**
- Run `astro build` without errors
- Verify all pages generated in dist/tin-tuc/
- Page count matches published folders
- Each page loads correctly
- Title/layout correct

---

### Testing Tasks (Step 3.X)

#### Step 3.1: Verify fetchNewsFolders() Returns Correct Hierarchy
**Type:** Unit Test
**Dependency:** Step 2.1 complete
**Status:** pending

**Test Objectives:**
- Verify function returns correct parent-child relationships
- Verify subFolders array properly populated
- Verify sorting by display_order
- Verify filtering of unpublished folders

**Expected Results:**
- Main folders have subFolders array
- Sub-folders in correct order
- Only published items returned
- No null/undefined values

---

#### Step 3.2: Update buildMainNav() To Include Sub-folders
**Type:** Integration Test
**Dependency:** Step 2.2 complete
**Status:** pending

**Test Objectives:**
- Verify menu structure includes nested children
- Verify all URLs properly formed
- Verify labels properly populated
- Verify no missing items

**Expected Results:**
- Menu structure has 3 levels (root > folder > subfolder)
- All href values valid
- No console errors/warnings

---

#### Step 3.3: Test News Dropdown (Desktop)
**Type:** E2E Test
**Dependency:** Step 2.3 complete
**Status:** pending

**Test Objectives:**
- Verify all hover interactions work
- Verify all navigation links functional
- Verify CSS/styling correct
- Verify performance acceptable

**Validation Checklist:**
- [ ] Dropdown appears on hover
- [ ] Nested dropdowns appear on subfolder hover
- [ ] All links clickable and navigate
- [ ] No layout shift on dropdown open/close
- [ ] No performance lag

---

#### Step 3.4: Test News Accordion (Mobile)
**Type:** E2E Test
**Dependency:** Step 2.4 complete
**Status:** pending

**Test Objectives:**
- Verify all tap/touch interactions work
- Verify expand/collapse animations smooth
- Verify mobile layout responsive
- Verify all navigation links functional

**Validation Checklist:**
- [ ] Tap expands menu item
- [ ] Sub-items appear on tap
- [ ] Smooth animation (no jank)
- [ ] Layout responsive on all mobile sizes
- [ ] All links navigate correctly

---

#### Step 3.5: Create Dynamic News Folder Pages
**Type:** Build Test
**Dependency:** Step 2.5 complete
**Status:** pending

**Test Objectives:**
- Verify astro build succeeds
- Verify all pages generated
- Verify no build warnings/errors
- Verify page structure correct

**Validation Checklist:**
- [ ] `astro build` completes successfully
- [ ] dist/tin-tuc/ contains all folder pages
- [ ] Page count = published folder count
- [ ] Each page HTML structure valid
- [ ] Build time reasonable (<5 min total)

---

#### Step 3.6: Test All News Navigation Links
**Type:** E2E Test
**Dependencies:** Step 3.3, Step 3.4, Step 3.5 complete
**Status:** pending

**Test Objectives:**
- Verify all links throughout nav work
- Verify links on generated pages work
- Verify no broken navigation paths
- Verify browser back/forward work

**Validation Checklist:**
- [ ] Click folder link → loads page
- [ ] Click sub-folder link → loads page
- [ ] All page links functional
- [ ] Back button returns to previous page
- [ ] URLs match expected structure

---

#### Step 3.7: Verify Breadcrumbs For Nested Folders
**Type:** E2E Test
**Dependency:** Step 2.5 complete
**Status:** pending

**Test Objectives:**
- Verify breadcrumbs display on folder pages
- Verify breadcrumbs show correct hierarchy
- Verify breadcrumb links work
- Verify breadcrumbs display on sub-folder pages

**Validation Checklist:**
- [ ] Breadcrumbs visible on folder page
- [ ] Breadcrumb structure: Home > News > [Folder]
- [ ] Breadcrumb links navigate correctly
- [ ] Breadcrumbs on sub-folder pages correct
- [ ] Breadcrumb styling matches design

---

## Dependencies Map (ASCII)

```
Phase 1 ✅ (DB Schema)
    ↓
Phase 2 ✅ (Build Menu)
    ↓
Phase 3 ✅ (Component Integration)
    ↓
Phase 4 (News Folder Hierarchy) ← HERE

Step 2.1 (Verify fetchNewsFolders)
    ↓
Step 2.2 (Update buildMainNav)
    ├─→ Step 2.3 (Test Desktop) → Step 3.3 (E2E)
    ├─→ Step 2.4 (Test Mobile) → Step 3.4 (E2E)
    ├─→ Step 2.5 (Dynamic Pages) → Step 3.5 (Build)
    └─────────────→ Step 3.6 (Link Verification)
            ├─→ Step 3.7 (Breadcrumbs)
```

**Critical Path:**
- 2.1 (30 min) → 2.2 (1 hr) → (2.3, 2.4, 2.5 parallel: 6 hrs) → (3.X tests: 2 hrs)

**Total:** 8.5-9.5 hours

---

## Task Status Matrix

| Task | Effort | Priority | Type | Status |
|------|--------|----------|------|--------|
| 2.1 | 30m | High | Impl | pending |
| 2.2 | 1h | High | Impl | pending |
| 2.3 | 2h | High | Test | pending |
| 2.4 | 2h | High | Test | pending |
| 2.5 | 2-3h | High | Impl | pending |
| 3.1 | 1h | High | Unit | pending |
| 3.2 | 1h | High | Integ | pending |
| 3.3 | 1h | High | E2E | pending |
| 3.4 | 1h | High | E2E | pending |
| 3.5 | 30m | High | Build | pending |
| 3.6 | 1h | High | E2E | pending |
| 3.7 | 1h | High | E2E | pending |

---

## Unique Task Names

All task names are unique and follow convention:
- Step 2.X: Implementation tasks (Verify, Update, Test, Create)
- Step 3.X: Testing tasks (Verify, Test)
- No naming conflicts
- Easily traceable in TodoWrite

---

## Required Skills & Tools Summary

**Skills:**
- code-reviewer (final review)
- tester (unit, integration, E2E tests)
- debugger (if issues arise)

**Tools:**
- TypeScript 5.7+
- Astro 5.2+
- Drizzle ORM
- PostgreSQL
- Browser dev tools (desktop)
- Mobile emulator/device

**Dependencies:**
- All satisfied (Phase 1-3 complete)
- No external blockers

---

## Notes

- All tasks have clear acceptance criteria
- Dependencies are linear with parallelization possible
- Testing integrated throughout, not separate phase
- Code review required after Step 2.5
- Phase completes when all Step 3.X tests pass
