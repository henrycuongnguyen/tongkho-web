# SSG Menu with Database Integration - Implementation Plan

**Created:** 2026-02-06 14:40
**Branch:** buildmenu62
**Status:** Phase 4 Complete - Ready for Phase 5
**Priority:** High
**Estimated Duration:** 2-3 weeks
**Last Updated:** 2026-02-06 16:35

---

## Overview

Migrate navigation menu from hardcoded inline data to database-driven SSG (Static Site Generation) approach, following patterns from ResaLand V1 Python implementation.

### Current State
- ✅ Phase 1: Database schema & service layer COMPLETE (2026-02-06 15:30)
- ✅ Phase 2: Menu generation at build time COMPLETE (2026-02-06 15:50)
- ✅ Phase 3: Component integration COMPLETE (2026-02-06 16:12)
- ✅ Phase 4: News folder hierarchy COMPLETE (2026-02-06 16:35)
- Menu now consumed from database via getMainNavItems()
- All header components updated to use dynamic menu data
- UI/UX preserved exactly as before
- Hierarchical folder structure with 27 static pages generated
- Dynamic routing for news folders working

### Target State
- Menu generated from PostgreSQL database at build time
- Dynamic property types by transaction type (buy/sell/rent/project)
- News folders with hierarchical structure
- Build-time caching with 1-hour TTL
- Type-safe TypeScript interfaces
- Follows existing Drizzle ORM patterns

### Business Logic (from V1)
```python
def build_menu():
    # Fetch property types for each transaction type
    sale_menu = fetch_property_types(1)      # Mua bán
    rent_menu = fetch_property_types(2)      # Cho thuê
    project_menu = fetch_property_types(3)   # Dự án

    # Fetch news folders with sub-folders
    news_folders = fetch_all_news_folders()

    # Build menu structure with caching (1h TTL)
    return [
        ('Trang chủ', '/', []),
        ('Mua bán', '/mua-ban', sale_menu_items),
        ('Cho thuê', '/cho-thue', rent_menu_items),
        ('Dự án', '/du-an', project_menu_items),
        ('Tin tức', '#', news_menu),
        ('Liên hệ', '/lien-he', []),
        ('Mạng lưới', '/mang-luoi', []),
        ('Tiện ích', '/tien-ich', [])
    ]
```

---

## Technical Architecture

### Database Schema (Existing)
```typescript
// property_type table
{
  id: serial
  title: varchar(512)
  parent_id: integer
  transaction_type: integer  // 1=sale, 2=rent, 3=project
  vietnamese: varchar
  slug: varchar
  aactive: boolean
}

// folder table (news folders)
{
  id: serial
  parent: integer
  name: varchar(255)
  label: varchar(512)
  publish: char(1)
  display_order: integer
}
```

### Data Flow
```
Build Time:
┌─────────────────┐
│  astro build    │
└────────┬────────┘
         │
         ├─> Fetch property_types (transaction_type=1,2,3)
         ├─> Fetch folders (parent=11) + sub_folders
         ├─> Transform to NavItem[] interface
         ├─> Cache in memory (build scope)
         └─> Generate static HTML
                    │
                    v
         ┌──────────────────┐
         │  dist/index.html │ (with menu baked in)
         └──────────────────┘
```

---

## Phase Breakdown

### Phase 1: Database Schema & Service Layer
**Duration:** 3-4 days
**Files:** `phase-01-database-schema-service.md`
**Status:** ✅ COMPLETE (2026-02-06 15:30)

- ✅ Export menu schema from existing Drizzle schema
- ✅ Create `src/services/menu-service.ts` with:
  - `fetchPropertyTypesByTransaction(type: number)`
  - `fetchNewsFolders()`
  - `buildMenuStructure()`
- ✅ Implement in-memory caching during build
- ✅ Add TypeScript interfaces for menu structure
- ✅ Create and pass all unit tests
- ✅ Database indexes applied and verified

### Phase 2: Menu Generation at Build Time
**Duration:** 2-3 days
**Files:** `phase-02-menu-generation-build.md`
**Status:** ✅ COMPLETE (2026-02-06 15:50)

- ✅ Created `src/data/menu-data.ts` with getMainNavItems()
- ✅ Fetch menu during Astro build using top-level await
- ✅ Transform DB data to NavItem[] interface
- ✅ Graceful fallback menu implemented
- ✅ Build-time logging with security sanitization
- ✅ Security fixes applied (error sanitization, timeout protection)
- ✅ Build tests passed (all scenarios)

### Phase 3: Component Integration
**Duration:** 2-3 days
**Files:** `phase-03-component-integration.md`
**Status:** ✅ COMPLETE (2026-02-06 16:12)

- ✅ Updated `header.astro` to consume dynamic menu
- ✅ Updated `header-mobile-menu.tsx` with new data structure
- ✅ Preserved existing UI/UX exactly
- ✅ Dropdown menus working correctly
- ✅ Mobile responsiveness verified
- ✅ All tests passed (7/7)
- ✅ Code review approved (8.5/10, 0 critical issues)

### Phase 4: News Folder Hierarchy
**Duration:** 2-3 days
**Files:** `phase-04-news-folder-hierarchy.md`
**Status:** ✅ COMPLETE (2026-02-06 16:35)

- ✅ Implement recursive folder structure fetching
- ✅ Handle parent-child relationships
- ✅ Sort by display_order
- ✅ Generate URLs for news folders
- ✅ Add sub-folder navigation
- ✅ 27 static folder pages generated at build time

### Phase 5: Testing & Optimization
**Duration:** 2-3 days
**Files:** `phase-05-testing-optimization.md`

- Performance testing (build time, query speed)
- Database index optimization
- Cache validation
- Cross-browser testing
- Accessibility validation (WCAG 2.1)

### Phase 6: Documentation & Cleanup
**Duration:** 1-2 days
**Files:** `phase-06-documentation-cleanup.md`

- Update codebase documentation
- Remove old hardcoded data
- Document menu management process
- Create admin guide for menu updates
- Update project roadmap

---

## Implementation Sequence

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
   ↓         ↓         ↓         ↓         ↓         ↓
Schema    Build    Header    News    Testing    Docs
Service   Menu     Update   Folders  Optimize  Cleanup
```

**Dependencies:**
- Phase 2 depends on Phase 1 (service layer)
- Phase 3 depends on Phase 2 (menu data)
- Phase 4 depends on Phase 3 (base menu structure)
- Phase 5 depends on Phase 4 (all features complete)
- Phase 6 depends on Phase 5 (testing done)

---

## Key Decisions

### 1. SSG vs SSR
**Decision:** SSG (Static Site Generation)
**Rationale:**
- Menu structure changes infrequently
- Better performance (no runtime DB queries)
- CDN-friendly static HTML
- Lower server costs
- Matches existing Astro architecture

**Trade-off:** Requires rebuild for menu updates (acceptable for menu data)

### 2. Caching Strategy
**Decision:** In-memory build-time caching only
**Rationale:**
- Build happens once, cache scope = build process
- No need for Redis/external cache
- Simplifies deployment
- Matches V1's RAM cache pattern

**Trade-off:** No runtime cache invalidation (not needed for SSG)

### 3. Data Transformation
**Decision:** Service layer transforms DB → NavItem interface
**Rationale:**
- Decouples database schema from component API
- Type-safe transformations
- Easier to test and maintain
- Follows existing project patterns

### 4. Fallback Strategy
**Decision:** Graceful degradation with default menu
**Rationale:**
- Build should never fail due to DB unavailable
- Provides minimal working menu structure
- Logs errors for debugging
- User experience preserved

---

## Success Criteria

### Functional Requirements
- ✅ Menu loads property types from database (transaction types 1, 2, 3)
- ✅ News folders display with parent-child hierarchy
- ✅ All links generate correct URLs
- ✅ Mobile menu works identically to desktop
- ✅ Build completes in <5 minutes (current menu size)

### Non-Functional Requirements
- ✅ TypeScript type safety (no `any` types)
- ✅ Build-time caching reduces duplicate queries
- ✅ Error handling with graceful fallbacks
- ✅ Database indexes for optimal query speed
- ✅ Code follows existing project conventions

### Performance Targets
- Build time increase: <30 seconds
- Menu query time: <500ms total (all queries)
- Bundle size increase: <5KB
- No runtime JavaScript added
- Lighthouse score maintained (100/100)

---

## Risk Assessment

### High Risk
**Database unavailable during build**
- **Mitigation:** Fallback to default static menu
- **Mitigation:** Comprehensive error logging
- **Mitigation:** Pre-build database health check

### Medium Risk
**Menu structure too complex (100+ items)**
- **Mitigation:** Query optimization with indexes
- **Mitigation:** Pagination for large sub-menus
- **Mitigation:** Build-time performance monitoring

### Low Risk
**Breaking existing header component**
- **Mitigation:** Interface compatibility layer
- **Mitigation:** Comprehensive testing before merge
- **Mitigation:** Git feature branch isolation

---

## Data Migration

### No migration needed
- Database already contains `property_type` and `folder` tables
- Existing data structure matches V1 schema
- No schema changes required

### Data Validation
```sql
-- Verify property types exist for each transaction type
SELECT transaction_type, COUNT(*)
FROM property_type
WHERE aactive = true
GROUP BY transaction_type;

-- Verify news folders structure
SELECT COUNT(*) as total_folders,
       COUNT(DISTINCT parent) as parent_folders
FROM folder
WHERE publish = 'T';
```

---

## Security Considerations

### Build-Time Security
- ✅ Database credentials in `.env` (not committed)
- ✅ **Read-only database user** for builds (SELECT only, no INSERT/UPDATE/DELETE)
- ✅ No sensitive data exposed in menu structure
- ✅ SQL injection protection via Drizzle ORM (parameterized queries)

### Runtime Security
- ✅ No database connection at runtime (SSG)
- ✅ No API endpoints exposed
- ✅ Static HTML = no injection vectors
- ✅ No user authentication/authorization needed

### Database Permissions (Recommended)
```sql
-- Create read-only user for Astro builds
CREATE USER astro_build WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE tongkho_web TO astro_build;
GRANT USAGE ON SCHEMA public TO astro_build;
GRANT SELECT ON property_type, folder TO astro_build;
-- NO INSERT, UPDATE, DELETE permissions
```

---

## Rollback Plan

### If Implementation Fails
1. Revert to `main` branch (current stable code)
2. Hardcoded menu remains functional
3. Zero downtime for users

### If Build Fails
1. Fallback menu activates automatically
2. Build warnings logged
3. Deploy proceeds with static menu

---

## Dependencies

### External
- ✅ PostgreSQL database (existing)
- ✅ Drizzle ORM (already installed)
- ✅ Astro 5.2 (already installed)
- ✅ TypeScript 5.7 (already installed)

### Internal
- ✅ `src/db/index.ts` (database connection)
- ✅ `src/db/migrations/schema.ts` (table schemas)
- ✅ Existing component structure

---

## Testing Strategy

### Unit Tests
- Menu service functions
- Data transformations
- URL generation logic

### Integration Tests
- Database query correctness
- Build-time data fetching
- Error handling scenarios

### E2E Tests
- Full build cycle
- Menu rendering in browser
- Navigation link functionality
- Mobile menu interaction

### Performance Tests
- Build time benchmarks
- Query execution time
- Bundle size validation

---

## Documentation Updates

### Files to Update
- `README.md` - Mention dynamic menu system
- `docs/codebase-summary.md` - Add menu service
- `docs/system-architecture.md` - Update data flow diagrams
- `docs/code-standards.md` - Menu management guidelines

### New Documentation
- `docs/menu-management.md` - How to update menu via database
- `docs/menu-architecture.md` - Technical architecture details

---

## Open Questions

1. **Cache TTL strategy:** Should we add `Cache-Control` headers for CDN?
   - **Recommendation:** Yes, set `max-age=3600` (1 hour) to match V1 pattern

2. **Menu updates frequency:** How often will menu structure change?
   - **Need answer from:** Product team
   - **Impact:** Determines rebuild automation strategy

## Out of Scope (Explicitly Excluded)

- ❌ **Admin UI:** Menu management via database tools only (psql, pgAdmin)
- ❌ **User Management:** No user authentication/authorization needed
- ❌ **CRUD Operations:** Code only reads data, updates via DB directly
- ❌ **Real-time Updates:** Requires site rebuild for menu changes
- ❌ **Multi-language Support:** Vietnamese only, no i18n needed

---

## References

### V1 Implementation
- File: `reference/resaland_v1/models/menu.py`
- Function: `build_menu()` - Main menu builder
- File: `reference/resaland_v1/models/filters.py`
- Function: `fetch_property_types()` - Property type fetcher
- Function: `fetch_all_news_folders()` - News folder fetcher

### Research Reports
- Location: `plans/reports/`
- File: `researcher-260206-1443-astro-ssg-database-integration.md`
- File: `code-templates.md` - Production-ready templates
- File: `implementation-quick-reference.md` - Practical patterns

### Existing Patterns
- Service: `src/services/postgres-news-project-service.ts`
- Schema: `src/db/schema/news.ts`, `src/db/schema/project.ts`
- Components: `src/components/header/header.astro`

---

## Phase Files

1. **phase-01-database-schema-service.md** - Database schema & service layer
2. **phase-02-menu-generation-build.md** - Menu generation at build time
3. **phase-03-component-integration.md** - Component integration
4. **phase-04-news-folder-hierarchy.md** - News folder hierarchy
5. **phase-05-testing-optimization.md** - Testing & optimization
6. **phase-06-documentation-cleanup.md** - Documentation & cleanup

**Next Step:** Review this plan → Create detailed phase files → Begin Phase 1
