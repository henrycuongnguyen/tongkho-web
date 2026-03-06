# Documentation Impact Assessment: Phase 0 News URL Migration

**Date:** 2026-03-06 13:53
**Phase:** Phase 0 - News URL v1 Alignment
**Scope:** `/tin-tuc/{slug}` → `/tin/{slug}` migration
**Assessment:** **MINOR IMPACT**

---

## Summary

Phase 0 migrates news article URLs from `/tin-tuc/{slug}` to `/tin/{slug}` with full backward compatibility (301 redirects). This is a **MINOR documentation update** involving 3 files: project-overview-pdr.md, project-roadmap.md, and codebase-summary.md.

**Key Finding:** News folder pages (`/tin-tuc/danh-muc/*`) remain unchanged - only article detail routes migrated.

---

## Documentation Review Results

### Files with News URL References

| File | Location | Current URL | Status | Action |
|------|----------|-------------|--------|--------|
| **project-overview-pdr.md** | Line 230 | `/tin-tuc/[slug]` | OUTDATED | UPDATE |
| **project-roadmap.md** | Lines 409, 415-416 | `/tin-tuc/[slug]`, related text | OUTDATED | UPDATE |
| **codebase-summary.md** | Line 122 | `/tin-tuc/[slug].astro` | OUTDATED | UPDATE |
| **code-standards-database.md** | Line 394 | `/tin-tuc/danh-muc/` | NO CHANGE | ✅ Keep as-is |
| **system-architecture.md** | Lines 135-138, 208, 213, 218, 249 | `/tin-tuc/*` routes | MIXED | UPDATE (article), KEEP (folder) |
| **menu-management.md** | Lines 147-152 | `/tin-tuc/danh-muc/`, `/tin-tuc/[slug]` | MIXED | UPDATE (article), KEEP (folder) |

### Key Distinction

**Unchanged URLs (News Folders):**
- Pattern: `/tin-tuc/danh-muc/{folder-name}` (27 dynamic pages)
- These remain on the original URL
- Folder page routes: `pages/tin-tuc/danh-muc/[folder].astro` (file location unchanged)

**Changed URLs (News Articles):**
- **Old:** `/tin-tuc/{article-slug}`
- **New:** `/tin/{article-slug}`
- Route file moved: `pages/tin-tuc/[slug].astro` → `pages/tin/[slug].astro`

---

## Recommended Changes

### 1. project-overview-pdr.md

**Line 230 (Phase 3 section):**

```markdown
- Dynamic routes for articles (`/tin-tuc/[slug]`)
```

Change to:

```markdown
- Dynamic routes for articles (`/tin/{slug}`)
```

**Reason:** Reflects current URL structure; maintains v1 alignment clarity.

---

### 2. project-roadmap.md

**Line 409 (Page Routes section):**

```markdown
- `pages/tin-tuc/[slug].astro` - News article detail (SSR) ✅
```

Change to:

```markdown
- `pages/tin/[slug].astro` - News article detail (SSR) ✅
```

**Line 415 (Remaining SEO Tasks section):**

Keep unchanged - this section refers to both old and new URLs generically.

---

### 3. codebase-summary.md

**Line 122 (Page Routes structure):**

```markdown
│   │   ├── tin-tuc/[slug].astro             # News article detail (SSR)
```

Change to:

```markdown
│   │   ├── tin/[slug].astro                 # News article detail (SSR)
```

---

### 4. system-architecture.md

**Line 135 (Page Routes Tree - OLD):**

```markdown
│   ├── tin-tuc/[slug].astro # News article detail (SSR)
```

Change to:

```markdown
│   ├── tin/[slug].astro # News article detail (SSR)
```

**Lines 213, 1795 (Section Headers - OLD):**

```markdown
pages/tin-tuc/[slug].astro (News Article, SSR)
```

Change to:

```markdown
pages/tin/[slug].astro (News Article, SSR)
```

**Keep unchanged:**
- Lines 136-138, 218, 249: References to `/tin-tuc/danh-muc/` (folder pages) - these remain correct

---

### 5. menu-management.md

**Lines 150-152 (News Article Pages section):**

```markdown
### News Article Pages
- Pattern: `/tin-tuc/{article-slug}`
- Example: `/tin-tuc/gia-nha-dat-tang-manh`
```

Change to:

```markdown
### News Article Pages
- Pattern: `/tin/{article-slug}`
- Example: `/tin/gia-nha-dat-tang-manh`
```

**Keep unchanged:**
- Lines 146-148: `/tin-tuc/danh-muc/` references (folder pages)

---

## Files NOT Requiring Changes

1. **design-guidelines.md** - No URL references
2. **code-standards.md** - No URL references
3. **code-standards-typescript.md** - No URL references
4. **code-standards-components.md** - No URL references
5. **v1-migration-strategy.md** - Generic patterns
6. **Other domain-specific docs** - No news URL references

---

## Migration Checklist

- [ ] Update project-overview-pdr.md (line 230)
- [ ] Update project-roadmap.md (line 409)
- [ ] Update codebase-summary.md (line 122)
- [ ] Update system-architecture.md (lines 135, 213, 1795)
- [ ] Update menu-management.md (lines 151-152)
- [ ] Verify 301 redirects configured in astro.config.mjs
- [ ] Test old `/tin-tuc/{slug}` URLs redirect to `/tin/{slug}`

---

## Impact Summary

**Documentation Impact:** MINOR
**Files to Update:** 5
**Total Change Lines:** ~8 lines across all files
**Risk Level:** LOW (straightforward URL replacements)
**Complexity:** TRIVIAL (regex replacements possible)

**Notes:**
- No architectural changes
- No API changes
- No code standard changes
- Backward compatibility maintained (301 redirects)
- News folder pages remain on `/tin-tuc/danh-muc/*` (NO CHANGE)

---

## Backward Compatibility

**301 Redirects:** Configured in `astro.config.mjs` redirect rules
- Old URLs: `/tin-tuc/{slug}` → `/tin/{slug}` (HTTP 301 Moved Permanently)
- SEO impact: Minimal (301s preserve link equity)
- User experience: Transparent (browser handles redirect)

---

## Next Steps

1. Execute documentation updates (straightforward find/replace)
2. Verify all URLs render correctly in HTML output
3. Test redirect behavior (optional manual check)
4. Update document history in each file with version bump
5. Commit documentation changes together with Phase 0 completion

---

## Approval

- **Docs Impact Confirmed:** MINOR
- **Ready for Implementation:** YES
- **Estimated Update Time:** <5 minutes
- **Risk Assessment:** LOW
