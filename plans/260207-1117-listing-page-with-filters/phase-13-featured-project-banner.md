# Phase 13: Featured Project Banner

## Context Links
- **Plan:** [plan.md](./plan.md)
- **V1 Reference:** `reference/resaland_v1/views/bds/components/project-sidebar-featured-listing.html`
- **Previous Phase:** [Phase 12: Ward/Commune List](./phase-12-ward-commune-list-by-district.md)

## Overview
**Priority:** Low
**Status:** Pending
**Dependencies:** Phase 8 (Sidebar Layout), Database schema for projects

Implement featured project banner in sidebar displaying 3-5 highlighted projects with images, titles, descriptions, and links.

## Key Insights

From v1 analysis (lines 1-24):
- Title: "Các dự án khác" (Other projects)
- Displays list of featured projects
- Each project shows:
  - Main image (lazy loaded with fallback)
  - Project title (linked to detail page)
  - Street address (meta info)
  - ~~Price description~~ (commented out in v1)
- URL format: `/bds/duan/{project_slug}`
- Data loaded via AJAX: `load_highlight_projects.load`

## Requirements

### Functional Requirements
- Query 3-5 featured projects from database
- Display project image (lazy load with WebP/AVIF)
- Show project title as clickable link
- Show street address/location
- Link to project detail page (`/du-an/{slug}`)
- Fallback image if project has no image
- Responsive: 1 column layout

### Non-functional Requirements
- Fast loading (<200ms from cache)
- Lazy load images (IntersectionObserver)
- Cache featured projects (Redis, 1 hour TTL)
- SEO: Proper alt text for images
- Accessibility: Links with descriptive text

## Architecture

```typescript
// src/components/listing/sidebar/featured-project-banner.astro
interface FeaturedProject {
  id: number;
  title: string;
  slug: string;
  mainImage: string;
  streetAddress: string;
  // priceDescription?: string; // Future enhancement
}

interface FeaturedProjectBannerProps {
  limit?: number; // Default: 5
  excludeCurrentProject?: number; // Exclude project ID
}

// Data source: PostgreSQL (projects table)
// SELECT * FROM projects WHERE is_featured = true ORDER BY created_at DESC LIMIT 5
```

## Related Code Files

### Files to Create
- `src/components/listing/sidebar/featured-project-banner.astro` - Project banner UI
- `src/services/featured-project-service.ts` - Query featured projects
- `src/utils/image-fallback.ts` - Fallback image handler

### Files to Modify
- `src/pages/[...slug].astro` - Add FeaturedProjectBanner to sidebar
- Database: Add `is_featured` boolean column to projects table

## Implementation Steps

1. **Update Database Schema**
   ```sql
   -- Migration: Add is_featured column
   ALTER TABLE projects ADD COLUMN is_featured BOOLEAN DEFAULT false;
   CREATE INDEX idx_projects_is_featured ON projects(is_featured, created_at DESC);
   ```

2. **Create Featured Project Service**
   ```typescript
   // src/services/featured-project-service.ts
   export async function getFeaturedProjects(
     limit: number = 5,
     excludeId?: number
   ): Promise<FeaturedProject[]> {
     // Query PostgreSQL with Drizzle ORM
     // Cache in Redis for 1 hour
   }
   ```

3. **Create Featured Project Banner Component**
   ```astro
   // src/components/listing/sidebar/featured-project-banner.astro
   ---
   const projects = await getFeaturedProjects(5);
   ---
   <div class="sidebar-item sidebar-featured">
     <h4>Các dự án khác</h4>
     <ul>
       {projects.map(project => (
         <li class="box-listings">
           <div class="image-wrap">
             <img
               loading="lazy"
               src={project.mainImage}
               alt={project.title}
               onerror="this.src='/images/blank.webp'"
             />
           </div>
           <div class="content">
             <h5><a href={`/du-an/${project.slug}`}>{project.title}</a></h5>
             <p>{project.streetAddress}</p>
           </div>
         </li>
       ))}
     </ul>
   </div>
   ```

4. **Create Image Fallback Utility**
   ```typescript
   // src/utils/image-fallback.ts
   export const FALLBACK_IMAGE = '/images/blank.webp';

   export const handleImageError = (e: Event) => {
     const img = e.target as HTMLImageElement;
     img.src = FALLBACK_IMAGE;
   };
   ```

5. **Integrate into Listing Page**
   ```astro
   // src/pages/[...slug].astro
   <div slot="sidebar">
     <!-- Other sidebar cards -->
     <FeaturedProjectBanner limit={5} />
   </div>
   ```

## Todo List

- [ ] Add `is_featured` column to projects table
- [ ] Create database migration script
- [ ] Create `featured-project-service.ts` with caching
- [ ] Create `featured-project-banner.astro` component
- [ ] Add lazy loading for images
- [ ] Add fallback image handler
- [ ] Style component (Tailwind CSS)
- [ ] Mark 5 projects as featured in database
- [ ] Test image lazy loading
- [ ] Test fallback image on error
- [ ] Add hover effect on project cards
- [ ] Verify links to project detail pages

## Success Criteria

- ✅ 3-5 featured projects display in sidebar
- ✅ Images lazy load (only when scrolled into view)
- ✅ Fallback image displays if main image fails
- ✅ Project titles link to detail pages
- ✅ Street address displays below title
- ✅ Responsive: 1 column layout on all screens
- ✅ Fast loading (<200ms from Redis cache)
- ✅ SEO: Alt text on all images
- ✅ Accessibility: Links keyboard navigable

## Risk Assessment

**Low Risk:**
- Simple read-only component
- Standard image lazy loading pattern
- Cached data (no real-time updates needed)

**Potential Issues:**
- Slow image loading if projects have large images
- Cache invalidation when featured projects change

**Mitigation:**
- Optimize images (WebP format, max 600px width)
- Use CDN for image delivery (future enhancement)
- Cache invalidation on project update (admin panel)

## Security Considerations

- **XSS Prevention:** Encode project titles and addresses in HTML
- **Image Validation:** Validate image URLs (prevent external image injection)
- **SQL Injection:** Use parameterized queries (Drizzle ORM)
- **No User Input:** This component has no user input fields

## Next Steps

After featured project banner is complete:
- **Integration:** All sidebar components complete
- **Testing:** E2E test for full sidebar functionality
- **Optimization:** Lazy load entire sidebar (IntersectionObserver)
- **Analytics:** Track clicks on featured projects
