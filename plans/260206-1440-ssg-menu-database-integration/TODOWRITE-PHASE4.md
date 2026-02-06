# Phase 4: News Folder Hierarchy - TodoWrite Workflow

**Started:** 2026-02-06 16:21
**Phase:** Phase 4: News Folder Hierarchy
**Branch:** buildmenu62
**Plan:** SSG Menu with Database Integration

---

## Workflow Status

- [x] **Step 0:** SSG Menu with Database Integration - Phase 4: News Folder Hierarchy (completed)
- [x] **Step 1:** Analysis & Task Extraction (in_progress)
- [ ] **Step 2:** Implementation (pending)
- [ ] **Step 3:** Testing (pending)
- [ ] **Step 4:** Code Review (pending)
- [ ] **Step 5:** Finalize (pending)

---

## Dependencies

**Phase 4 Dependencies:**
- ✅ Phase 1: Database schema & service layer (COMPLETE)
- ✅ Phase 2: Menu generation at build time (COMPLETE)
- ✅ Phase 3: Component integration (COMPLETE)
- Ready to start Phase 4

---

## Extracted Tasks

### Step 2: Implementation Tasks

**Step 2.1 - Verify fetchNewsFolders() Implementation (30 min)**
- File: `src/services/menu-service.ts`
- Status: pending
- Priority: High
- Description: Ensure fetchNewsFolders() already handles root folders (parent=11), sub-folders, sorting by display_order, and only published folders (publish='T')
- Success Criteria: Function returns correct hierarchy with subFolders array

**Step 2.2 - Update buildMainNav() With Nested Children (1 hour)**
- File: `src/services/menu-service.ts`
- Status: pending
- Priority: High
- Description: Ensure news menu includes nested children with proper href URLs for both parent folders and sub-folders
- Success Criteria: News menu includes 2-level hierarchy structure

**Step 2.3 - Test News Navigation - Desktop Dropdown (2 hours)**
- Location: Desktop browser testing
- Status: pending
- Priority: High
- Description: Verify hover interaction shows folders, nested folders on sub-hover, and all links navigate correctly
- Test Scenarios:
  - Hover over "Tin tức" → shows folders
  - Hover over folder with sub-folders → shows nested dropdown
  - Click folder → navigates to folder page
  - Click sub-folder → navigates to sub-folder page

**Step 2.4 - Test News Navigation - Mobile Menu (2 hours)**
- Location: Mobile browser/device testing
- Status: pending
- Priority: High
- Description: Verify tap interactions expand folders and sub-folders correctly
- Test Scenarios:
  - Tap "Tin tức" → expands folders
  - Tap folder with sub-folders → expands sub-folders
  - Tap any item → navigates correctly

**Step 2.5 - Create News Folder Dynamic Pages (2-3 hours)**
- File: `src/pages/tin-tuc/[folder].astro`
- Status: pending
- Priority: High
- Description: Create dynamic page template that generates static pages for all published folders
- Components: getStaticPaths(), page layout with folder content
- Success Criteria: Dynamic pages generated for all folders and sub-folders

---

### Step 3: Testing Tasks (Todo List Items)

**Step 3.1 - Verify fetchNewsFolders() Returns Correct Hierarchy**
- Status: pending
- Dependency: Step 2.1
- Test Type: Unit test
- Expected: Correct parent-child relationships with subFolders array

**Step 3.2 - Update buildMainNav() To Include Sub-folders**
- Status: pending
- Dependency: Step 2.2
- Test Type: Integration test
- Expected: Menu structure includes nested children

**Step 3.3 - Test News Dropdown (Desktop)**
- Status: pending
- Dependency: Step 2.3
- Test Type: E2E test
- Expected: All hover interactions work as expected

**Step 3.4 - Test News Accordion (Mobile)**
- Status: pending
- Dependency: Step 2.4
- Test Type: E2E test
- Expected: All tap interactions work as expected

**Step 3.5 - Create Dynamic News Folder Pages**
- Status: pending
- Dependency: Step 2.5
- Test Type: Build test
- Expected: Static pages generated successfully

**Step 3.6 - Test All News Navigation Links**
- Status: pending
- Dependencies: Step 3.3, Step 3.4, Step 3.5
- Test Type: E2E test
- Expected: All links navigate to correct pages

**Step 3.7 - Verify Breadcrumbs For Nested Folders**
- Status: pending
- Dependency: Step 2.5
- Test Type: E2E test
- Expected: Breadcrumbs display correctly for nested folder pages

---

## Success Criteria Checklist

- [ ] News folders display in menu
- [ ] Sub-folders display as nested dropdowns
- [ ] All folder links navigate correctly
- [ ] Dynamic pages generated for all folders
- [ ] Mobile accordion works for nested folders

---

## Dependencies Map

```
Step 2.1 (Verify fetchNewsFolders) → Step 2.2 (Update buildMainNav)
                                            ├→ Step 2.3 (Test Desktop)
                                            ├→ Step 2.4 (Test Mobile)
                                            └→ Step 2.5 (Dynamic Pages)
                                                    ↓
                                               Step 3.X (Testing)
```

---

## Ambiguities & Blockers

### Ambiguities
1. **fetchNewsFolders() Implementation Status**: Phase file states "Verify" but unclear if function already exists in menu-service.ts
   - Recommendation: Check menu-service.ts line count and structure before starting Step 2.1

2. **Dynamic Pages Scope**: Step 2.5 mentions "all folders and sub-folders" but unclear if sub-folders need their own pages
   - Recommendation: Check if `/tin-tuc/[folder]/[subfolder].astro` needed or just parent folders

3. **Breadcrumb Component**: Breadcrumbs mentioned in success criteria but no component mentioned in implementation steps
   - Recommendation: Verify if breadcrumb component exists or needs creation

### Blockers
- **None identified** - All dependencies from Phase 1-3 are complete

---

## Required Skills/Tools

### Skills to Activate
- `code-reviewer` - For code quality after implementation
- `tester` - For comprehensive testing (unit, integration, E2E)
- `debugger` - For troubleshooting navigation issues if needed

### Tools Required
- TypeScript compiler (astro build)
- Browser dev tools (desktop testing)
- Mobile device/emulator (mobile testing)
- Drizzle ORM (database queries)
- Postgres database (data validation)

---

## Time Estimate

**Implementation:** 7.5-8.5 hours
- Step 2.1: 30 min
- Step 2.2: 1 hour
- Step 2.3: 2 hours
- Step 2.4: 2 hours
- Step 2.5: 2-3 hours

**Testing:** Included in implementation steps

**Code Review:** ~1 hour

**Total:** 8.5-9.5 hours (1-1.5 days)

---

## Notes

- Follow V1 news folder logic patterns from reference implementation
- Ensure database structure uses parent-child relationships (parent=11 for news root)
- Maintain type safety with TypeScript interfaces
- Preserve existing UI/UX exactly (learned from Phase 3)
- Database already contains proper data structure - no migration needed
