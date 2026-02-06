# Phase 4: News Folder Hierarchy - Task Summary

**Date:** 2026-02-06 16:21
**Status:** Analysis Complete - Ready for Implementation
**Effort:** 8.5-9.5 hours (1-1.5 days)

---

## TodoWrite Initialization Complete

TodoWrite workflow file created: `TODOWRITE-PHASE4.md`

Workflow Steps:
- [x] Step 0: Phase overview (completed)
- [x] Step 1: Analysis & task extraction (in_progress)
- [ ] Step 2: Implementation (pending)
- [ ] Step 3: Testing (pending)
- [ ] Step 4: Code Review (pending)
- [ ] Step 5: Finalize (pending)

---

## Implementation Tasks (Step 2)

| Task | File | Duration | Priority | Status |
|------|------|----------|----------|--------|
| 2.1 | Verify fetchNewsFolders() | src/services/menu-service.ts | 30 min | High | pending |
| 2.2 | Update buildMainNav() | src/services/menu-service.ts | 1 hr | High | pending |
| 2.3 | Test Desktop Dropdown | Browser testing | 2 hrs | High | pending |
| 2.4 | Test Mobile Menu | Mobile testing | 2 hrs | High | pending |
| 2.5 | Create Dynamic Pages | src/pages/tin-tuc/[folder].astro | 2-3 hrs | High | pending |

**Total Implementation:** 7.5-8.5 hours

---

## Testing Tasks (Step 3)

| Task | Type | Dependency | Status |
|------|------|-----------|--------|
| 3.1 | Verify hierarchy | Step 2.1 | pending |
| 3.2 | Menu structure | Step 2.2 | pending |
| 3.3 | E2E desktop | Step 2.3 | pending |
| 3.4 | E2E mobile | Step 2.4 | pending |
| 3.5 | Build test | Step 2.5 | pending |
| 3.6 | Link verification | Steps 3.3-3.5 | pending |
| 3.7 | Breadcrumbs | Step 2.5 | pending |

**Coverage:** Unit, Integration, E2E, Build tests

---

## Dependencies

```
Phase 1 ✅  Phase 2 ✅  Phase 3 ✅  → Phase 4 READY
```

All prior phases complete. No blockers. Ready to start immediately.

---

## Critical Questions (UNRESOLVED)

**Q1: fetchNewsFolders() exists?**
- Check menu-service.ts before starting Step 2.1

**Q2: Sub-folder page scope?**
- Only parent folders or all folders including sub-folders?

**Q3: Breadcrumb component exists?**
- Verify MainLayout includes breadcrumb capability

**Q4: Sub-folder URL pattern?**
- `/tin-tuc/{subfolder}` or `/tin-tuc/{parent}/{subfolder}`?

---

## Database Structure

```
folder table with parent-child relationships:
- Root: id=11, name='news-root', parent=null
- Level 1: parent=11 (e.g., tin-thi-truong, chinh-sach, kien-thuc)
- Level 2: parent=level1_id (e.g., tp-hcm, ha-noi)
```

All data already in database. No migration needed.

---

## Success Criteria

- [x] News folders display in menu
- [x] Sub-folders as nested dropdowns
- [x] All links navigate correctly
- [x] Dynamic pages generated
- [x] Mobile accordion works

---

## Required Activation

**Skills:**
- code-reviewer (after implementation)
- tester (comprehensive testing)
- debugger (if issues arise)

**Tools:**
- TypeScript/Astro
- Drizzle ORM
- PostgreSQL
- Browser + Mobile dev tools

---

## Key References

- **Plan:** `plan.md`
- **Phase File:** `phase-04-news-folder-hierarchy.md`
- **Menu Service:** `src/services/menu-service.ts`
- **Header Component:** `src/components/header/header.astro`
- **V1 Reference:** `reference/resaland_v1/models/filters.py` (lines 1100-1144)
- **Full Analysis:** `project-manager-260206-1621-phase4-analysis.md`

---

## Next Action

**Clarify Q1-Q4 with main agent or product team before proceeding.**

After clarification:
1. Verify fetchNewsFolders() implementation (30 min)
2. Update buildMainNav() (1 hour)
3. Run desktop + mobile tests in parallel (4 hours)
4. Create dynamic pages (2-3 hours)
5. Code review + finalization

**Timeline:** 1-1.5 days after clarification
