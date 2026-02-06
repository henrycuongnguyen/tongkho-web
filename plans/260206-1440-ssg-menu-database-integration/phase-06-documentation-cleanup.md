# Phase 6: Documentation & Cleanup

**Duration:** 1-2 days
**Priority:** Medium
**Dependencies:** Phase 5 complete
**Status:** Pending

---

## Overview

Complete documentation, remove legacy code, and prepare for production deployment.

---

## Context Links

- **Main Plan:** [plan.md](./plan.md)
- **Phase 5:** [phase-05-testing-optimization.md](./phase-05-testing-optimization.md)
- **Docs Directory:** [docs/](../../docs/)

---

## Implementation Steps

### Step 1: Update Project Documentation (3-4 hours)

#### 1.1 Update README.md
```markdown
### Key Modules

#### Menu System (`src/services/menu-service.ts`)
- Database-driven navigation menu
- Fetches property types by transaction type (buy/sell/rent/project)
- Hierarchical news folder structure
- Build-time generation with caching (1h TTL)
- Fallback to static menu if database unavailable

**Build-time data fetching:**
- Property types: Fetched from `property_type` table
- News folders: Fetched from `folder` table (parent=11)
- Generated during `npm run build`
- Cached in static HTML (no runtime queries)
```

#### 1.2 Update docs/codebase-summary.md
```markdown
├── services/
│   ├── menu-service.ts              # Menu data fetching & caching (300 LOC)
│   └── postgres-news-project-service.ts
├── data/
│   └── menu-data.ts                 # Menu build-time integration (50 LOC)
├── db/
│   └── schema/
│       └── menu.ts                  # Menu table schemas (80 LOC)
```

#### 1.3 Update docs/system-architecture.md
Add data flow diagram:
```
Build Time Menu Generation:
┌─────────────────┐
│  astro build    │
└────────┬────────┘
         │
    [menu-service.ts]
         │
    ┌────┴────────────────┐
    │  PostgreSQL DB      │
    ├─────────────────────┤
    │ property_type       │
    │ folder (news)       │
    └─────────────────────┘
         │
    [Transform to NavItem[]]
         │
    [Cache in memory]
         │
         v
    [Static HTML]
```

---

### Step 2: Create Menu Management Guide (2-3 hours)

**File:** `docs/menu-management.md`

```markdown
# Menu Management Guide

## Overview
The navigation menu is generated from the PostgreSQL database during build time.

## Database Tables

### property_type
Controls property type menu items (Mua bán, Cho thuê, Dự án)

**Fields:**
- `transaction_type`: 1=mua bán, 2=cho thuê, 3=dự án
- `vietnamese`: Display label (e.g., "Căn hộ chung cư")
- `slug`: URL slug (e.g., "can-ho-chung-cu")
- `aactive`: Active flag (true=visible, false=hidden)
- `display_order`: Sort order (lower = appears first)

**Example:**
```sql
-- Add new property type
INSERT INTO property_type (title, vietnamese, slug, transaction_type, aactive, display_order)
VALUES ('Apartment', 'Căn hộ chung cư', 'can-ho-chung-cu', 1, true, 1);

-- Hide property type
UPDATE property_type SET aactive = false WHERE slug = 'old-type';

-- Reorder menu items
UPDATE property_type SET display_order = 10 WHERE slug = 'can-ho-chung-cu';
```

### folder
Controls news folder menu items (Tin tức)

**Fields:**
- `parent`: Parent folder ID (11=root news folder)
- `name`: URL slug (e.g., "tin-thi-truong")
- `label`: Display label (e.g., "Tin thị trường")
- `publish`: Publish flag ('T'=visible, 'F'=hidden)
- `display_order`: Sort order

**Example:**
```sql
-- Add new news category
INSERT INTO folder (parent, name, label, publish, display_order)
VALUES (11, 'xu-huong-2026', 'Xu hướng 2026', 'T', 10);

-- Add sub-category
INSERT INTO folder (parent, name, label, publish, display_order)
SELECT id, 'tp-hcm', 'TP.HCM', 'T', 1
FROM folder WHERE name = 'tin-thi-truong';
```

## Rebuilding Menu

Menu updates require rebuilding the site (no admin UI):

```bash
# 1. Update database directly (via psql, pgAdmin, or other DB tools)
psql -U postgres -d tongkho_web -f menu-updates.sql

# Or use database client:
# - pgAdmin
# - DBeaver
# - TablePlus

# 2. Rebuild site
npm run build

# 3. Deploy
# (Deploy process depends on hosting platform)
```

**Note:** Menu management is intentionally done via database tools, not through an admin UI. This keeps the codebase simple and follows SSG principles.

## Troubleshooting

**Menu not updating after database changes:**
1. Verify database changes saved
2. Rebuild site (`npm run build`)
3. Clear browser cache
4. Check build logs for errors

**Menu shows fallback instead of database data:**
1. Check `DATABASE_URL` environment variable
2. Verify database is accessible
3. Check build logs for connection errors
4. Verify tables have data (`SELECT COUNT(*) FROM property_type`)

**Menu items in wrong order:**
- Update `display_order` field (lower = first)
- Rebuild site

**Menu item not showing:**
- Check `aactive = true` (property_type)
- Check `publish = 'T'` (folder)
- Verify not deleted
- Rebuild site
```

---

### Step 3: Code Cleanup (2-3 hours)

#### 3.1 Remove Legacy Files
```bash
# Backup first
mkdir -p .legacy-backup
cp src/components/header/header-nav-data.ts .legacy-backup/

# Remove from codebase
git rm src/components/header/header-nav-data.ts

# Update any remaining references
grep -r "header-nav-data" src/
# Should return no results
```

#### 3.2 Remove Commented Code
```bash
# Review and remove any TODO comments
grep -r "TODO.*menu" src/

# Remove debug console.logs (keep error logs)
# Review files manually
```

#### 3.3 Format Code
```bash
# If prettier configured
npm run format

# Otherwise manually verify
npm run astro check
```

---

### Step 4: Update Project Roadmap (1 hour)

**File:** `docs/project-roadmap.md`

```markdown
## Phase 2: Dynamic Menu System (COMPLETE) ✅
**Status:** Complete
**Duration:** 2-3 weeks
**Completed:** 2026-02-XX

### Objectives
- ✅ Replace hardcoded menu with database-driven system
- ✅ Build-time menu generation via SSG
- ✅ Property types by transaction type (buy/sell/rent/project)
- ✅ News folder hierarchy with sub-folders
- ✅ Caching and performance optimization

### Deliverables
- ✅ Menu service layer with caching
- ✅ Database schema integration
- ✅ Build-time data fetching
- ✅ Component integration
- ✅ Comprehensive testing
- ✅ Documentation and guides

### Technical Achievements
- Build time: X.XX minutes (target: <5 min)
- Menu generation: XXXms (target: <500ms)
- Bundle size increase: X.XKB (target: <5KB)
- Lighthouse score: 100/100 maintained

### Known Issues
- None (or list any)

### Future Enhancements
- Menu analytics tracking
- Automated rebuild triggers on DB changes (webhooks)
- Menu search functionality
```

---

### Step 5: Create Changelog Entry (30 minutes)

**File:** `docs/project-changelog.md`

```markdown
## [Unreleased] - 2026-02-XX

### Added
- Database-driven navigation menu system
- Menu service layer with build-time caching
- Fallback menu for database unavailability
- Menu management documentation
- Database indexes for menu queries

### Changed
- Header component now fetches menu from database at build time
- Menu structure generated dynamically based on property types
- News folders support hierarchical structure with sub-folders

### Removed
- Hardcoded menu data in header-nav-data.ts

### Performance
- Build time: +XXs (X.XX min total)
- Menu query time: XXXms
- Bundle size: +X.XKB

### Migration Notes
- No migration required for existing deployments
- DATABASE_URL environment variable must be set for builds
- Menu updates now require site rebuild
```

---

## Todo List

### Documentation
- [ ] Update README.md with menu system overview
- [ ] Update docs/codebase-summary.md with new files
- [ ] Update docs/system-architecture.md with data flow
- [ ] Create docs/menu-management.md guide
- [ ] Update docs/project-roadmap.md with completion
- [ ] Create changelog entry in docs/project-changelog.md

### Code Cleanup
- [ ] Remove header-nav-data.ts (backup first)
- [ ] Remove any commented legacy code
- [ ] Remove debug console.logs
- [ ] Format all changed files
- [ ] Run final type check

### Git
- [ ] Commit all documentation updates
- [ ] Create pull request
- [ ] Tag release (v2.0.0 - Dynamic Menu)

---

## Success Criteria

- ✅ All documentation complete and accurate
- ✅ Legacy code removed
- ✅ No broken links in documentation
- ✅ Menu management guide tested with real database
- ✅ Changelog reflects all changes
- ✅ Roadmap updated with completion status

---

## Final Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Documentation reviewed and approved
- [ ] Performance metrics documented
- [ ] Security review complete
- [ ] Backup of production database

### Deployment
- [ ] Merge feature branch to main
- [ ] Tag release (v2.0.0)
- [ ] Deploy to staging
- [ ] Verify menu on staging
- [ ] Deploy to production
- [ ] Verify menu on production

### Post-Deployment
- [ ] Monitor build times
- [ ] Monitor error logs
- [ ] Document any issues
- [ ] Plan future enhancements (if needed)

---

## Next Steps

1. **Merge to main branch**
2. **Deploy to production**
3. **Monitor performance**
4. **Future:** Consider menu analytics or automated rebuild triggers

---

## Unresolved Questions

None - All questions from earlier phases should be resolved by now.

If any remain, document them here for future phases.
