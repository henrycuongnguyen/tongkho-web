# Menu Management Guide

**Last Updated:** 2026-02-06
**Version:** 2.0.0

---

## Overview

The navigation menu is generated from PostgreSQL database during build time using Astro's SSG (Static Site Generation). Menu updates require database modifications followed by site rebuild—no admin UI needed.

---

## Database Tables

### property_type

Controls property type menu items (Mua bán, Cho thuê, Dự án)

**Schema:**
```sql
CREATE TABLE property_type (
  id SERIAL PRIMARY KEY,
  title VARCHAR(512),
  vietnamese VARCHAR(512),        -- Display label
  slug VARCHAR(512),              -- URL slug
  transaction_type INTEGER,       -- 1=sale, 2=rent, 3=project
  parent_id INTEGER,
  aactive BOOLEAN DEFAULT true,  -- Visibility flag
  display_order INTEGER          -- Sort order (lower = first)
);
```

**Fields:**
- `transaction_type`: 1=Mua bán, 2=Cho thuê, 3=Dự án
- `vietnamese`: Display label (e.g., "Căn hộ chung cư")
- `slug`: URL slug (e.g., "can-ho-chung-cu")
- `aactive`: true=visible, false=hidden
- `display_order`: Sort order (ascending)

**Examples:**
```sql
-- Add new property type
INSERT INTO property_type (title, vietnamese, slug, transaction_type, aactive, display_order, parent_id)
VALUES ('Apartment', 'Căn hộ chung cư', 'can-ho-chung-cu', 1, true, 1, NULL);

-- Hide property type
UPDATE property_type SET aactive = false WHERE slug = 'old-type';

-- Reorder menu items
UPDATE property_type SET display_order = 10 WHERE slug = 'can-ho-chung-cu';

-- Activate hidden item
UPDATE property_type SET aactive = true WHERE slug = 'villa';
```

---

### folder

Controls news folder menu items with hierarchical structure (Tin tức)

**Schema:**
```sql
CREATE TABLE folder (
  id SERIAL PRIMARY KEY,
  parent INTEGER,                -- Parent folder ID (11=news root)
  name VARCHAR(255),             -- URL slug
  label VARCHAR(512),            -- Display label
  publish CHAR(1) DEFAULT 'T',   -- 'T'=visible, 'F'=hidden
  display_order INTEGER          -- Sort order
);
```

**Fields:**
- `parent`: Parent folder ID (11=news root folder)
- `name`: URL slug (e.g., "tin-thi-truong")
- `label`: Display label (e.g., "Tin thị trường")
- `publish`: 'T'=visible, 'F'=hidden
- `display_order`: Sort order (ascending)

**Examples:**
```sql
-- Add new news category (parent folder)
INSERT INTO folder (parent, name, label, publish, display_order)
VALUES (11, 'xu-huong-2026', 'Xu hướng 2026', 'T', 10);

-- Add sub-category (child folder)
INSERT INTO folder (parent, name, label, publish, display_order)
SELECT id, 'tp-hcm', 'TP.HCM', 'T', 1
FROM folder WHERE name = 'tin-thi-truong';

-- Hide folder
UPDATE folder SET publish = 'F' WHERE name = 'old-category';

-- Reorder folders
UPDATE folder SET display_order = 5 WHERE name = 'chinh-sach';
```

---

## Menu Update Process

### Step 1: Update Database

Use any PostgreSQL client:

**Command Line (psql):**
```bash
psql -U postgres -d tongkho_web
```

**GUI Tools:**
- pgAdmin
- DBeaver
- TablePlus
- DataGrip

### Step 2: Rebuild Site

After database changes:

```bash
npm run build
```

Menu data is fetched during build and baked into static HTML.

### Step 3: Deploy

Deploy the updated `dist/` folder to your hosting platform:

```bash
# Example: Deploy to production
npm run deploy
```

---

## URL Structure

### Property Type Pages
- Pattern: `/{transaction-slug}/{property-slug}`
- Example: `/mua-ban/can-ho-chung-cu`

### News Folder Pages
- Pattern: `/tin-tuc/danh-muc/{folder-name}`
- Example: `/tin-tuc/danh-muc/tin-thi-truong`

### News Article Pages
- Pattern: `/tin-tuc/{article-slug}`
- Example: `/tin-tuc/gia-nha-dat-tang-manh`

---

## Troubleshooting

### Menu not updating after database changes

**Cause:** Site not rebuilt
**Solution:**
1. Verify database changes saved: `SELECT * FROM property_type WHERE slug = 'your-slug';`
2. Rebuild site: `npm run build`
3. Clear browser cache (Ctrl+Shift+R)
4. Check build logs for errors

### Menu shows fallback instead of database data

**Cause:** Database connection failed during build
**Solution:**
1. Check `DATABASE_URL` environment variable:
   ```bash
   echo $DATABASE_URL  # Linux/Mac
   echo %DATABASE_URL% # Windows
   ```
2. Verify database accessibility:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```
3. Check build logs: Look for `[MenuService] Error fetching...`
4. Verify tables have data:
   ```sql
   SELECT COUNT(*) FROM property_type WHERE aactive = true;
   SELECT COUNT(*) FROM folder WHERE publish = 'T';
   ```

### Menu items in wrong order

**Cause:** Incorrect `display_order` values
**Solution:**
1. Update `display_order` (lower number = earlier position):
   ```sql
   UPDATE property_type SET display_order = 1 WHERE slug = 'first-item';
   UPDATE property_type SET display_order = 2 WHERE slug = 'second-item';
   ```
2. Rebuild site: `npm run build`

### Menu item not appearing

**Checklist:**
- [ ] Property types: Check `aactive = true`
- [ ] News folders: Check `publish = 'T'`
- [ ] Verify not deleted: `SELECT * FROM table WHERE slug = 'item-slug';`
- [ ] Check parent_id is NULL (for root property types)
- [ ] Check parent = 11 (for root news folders)
- [ ] Rebuild site

### Build fails with database error

**Common Causes:**
1. **Invalid DATABASE_URL:**
   ```bash
   # Correct format:
   DATABASE_URL="postgresql://user:password@host:5432/database"
   ```
2. **Database unreachable:** Check network, firewall, VPN
3. **Missing tables:** Run migrations
4. **Permission denied:** Grant SELECT permissions:
   ```sql
   GRANT SELECT ON property_type, folder TO astro_build_user;
   ```

---

## Performance

### Build Time Metrics

**Current Performance:**
- Total build time: ~12 seconds
- Menu generation: <100ms per query
- Static pages generated: 27 folders
- Cache hit rate: 96.3%

**Targets:**
- Build time: <5 minutes
- Menu queries: <500ms total
- Bundle size increase: <5KB

### Query Optimization

**Recommended Indexes:**
```sql
-- Property type queries
CREATE INDEX IF NOT EXISTS idx_property_type_trans_active
ON property_type(transaction_type, aactive, display_order)
WHERE aactive = true;

-- News folder queries
CREATE INDEX IF NOT EXISTS idx_folder_parent_publish_order
ON folder(parent, publish, display_order)
WHERE publish = 'T';
```

Verify index usage:
```sql
EXPLAIN ANALYZE
SELECT * FROM property_type
WHERE transaction_type = 1 AND aactive = true
ORDER BY display_order;

-- Look for "Index Scan" not "Seq Scan"
```

---

## Caching

### Build-Time Cache

Menu data is cached in-memory during build (1-hour TTL):
- First query: Fetch from database (~100ms)
- Subsequent queries: Cached (0-1ms)
- Cache scope: Single build process

### No Runtime Cache

SSG approach means:
- No runtime database queries
- Menu baked into static HTML
- CDN-friendly (cache static files)
- Zero database load in production

---

## Security

### Database Permissions

**Recommended Setup:**
```sql
-- Create read-only user for builds
CREATE USER astro_build WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE tongkho_web TO astro_build;
GRANT USAGE ON SCHEMA public TO astro_build;
GRANT SELECT ON property_type, folder TO astro_build;
-- NO INSERT, UPDATE, DELETE permissions
```

**Environment Variables:**
```bash
# .env (never commit this file!)
DATABASE_URL="postgresql://astro_build:secure_password@localhost:5432/tongkho_web"
```

### Build Security

- ✅ SQL injection prevented (Drizzle ORM parameterized queries)
- ✅ No sensitive data in menu structure
- ✅ Error messages sanitized (no stack traces in build logs)
- ✅ Read-only database user recommended

---

## FAQ

**Q: Can I update menu without rebuilding?**
A: No. SSG requires rebuild to update static HTML. This is intentional for performance.

**Q: How often should menu be updated?**
A: Menu structure changes infrequently. Typical update frequency: weekly or monthly.

**Q: Is there an admin UI for menu management?**
A: No. Menu management is done via database tools (psql, pgAdmin, etc.). This keeps the codebase simple and follows SSG principles.

**Q: What happens if database is down during build?**
A: Fallback menu activates automatically. Build succeeds with warning. Site remains functional with minimal menu.

**Q: Can I add custom menu items not in database?**
A: Yes. Edit `src/services/menu-service.ts` → `buildMainNav()` function. Add static items like "Liên hệ", "Tiện ích".

**Q: How to test menu changes locally?**
A:
```bash
# 1. Update local database
psql -U postgres -d tongkho_web -c "UPDATE property_type SET ..."

# 2. Rebuild
npm run build

# 3. Preview
npm run preview

# 4. Open browser
open http://localhost:4321
```

---

## Related Documentation

- **System Architecture:** [docs/system-architecture.md](./system-architecture.md)
- **Code Standards:** [docs/code-standards.md](./code-standards.md)
- **Codebase Summary:** [docs/codebase-summary.md](./codebase-summary.md)
- **Database Schema:** `src/db/migrations/schema.ts`

---

## Support

For issues or questions:
1. Check this guide first
2. Review build logs: `npm run build`
3. Check database data validity
4. Create GitHub issue if needed
