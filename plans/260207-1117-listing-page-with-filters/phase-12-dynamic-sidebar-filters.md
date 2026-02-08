# Phase 12: Dynamic Sidebar Filters (SSR)

## Context Links
- **Plan:** [plan.md](./plan.md)
- **V1 Reference:** `reference/resaland_v1/controllers/bds.py` (line 1749-1782)
- **V1 Template:** `reference/resaland_v1/views/bds/load_side_block_filters_pattern.load`
- **Previous Phase:** [Phase 11: Area Filter Card](./phase-11-area-filter-card.md)

## Overview
**Priority:** High
**Status:** Pending
**Dependencies:** Phase 2 (Location Data), Phase 3 (URL Parsing), Phase 8 (Sidebar Layout)

Implement dynamic sidebar filter blocks that change based on current URL pattern, matching v1 logic but using Astro SSR instead of API calls.

## Key Insights

From v1 analysis (`bds.py` line 1749-1782):
```python
def load_side_block_filters_pattern():
    # Get current page URL pattern
    pattern = request.env.http_referer  # e.g., "/mua-ban/ha-noi/gia-..."

    # Call API with pattern
    api_url = "/api_customer/get_side_block.json"
    params = {'pattern': pattern}

    # Returns dynamic filter blocks based on current page
    side_block_filters = [
        {
            'title': 'Khu vực khác',  # Other locations
            'filters': [
                {'title': 'Quận Ba Đình', 'url': '/mua-ban/ha-noi/ba-dinh/...'},
                {'title': 'Quận Hoàn Kiếm', 'url': '/mua-ban/ha-noi/hoan-kiem/...'}
            ]
        },
        {
            'title': 'Loại hình khác',  # Other property types
            'filters': [
                {'title': 'Căn hộ chung cư', 'url': '/mua-ban/ha-noi/can-ho-chung-cu/...'},
                {'title': 'Nhà riêng', 'url': '/mua-ban/ha-noi/nha-rieng/...'}
            ]
        }
    ]
```

**V1 Logic:**
- ✅ **URL-aware:** Filter blocks change based on current URL
- ✅ **Multiple blocks:** Location, property type, price range, etc.
- ✅ **Context-sensitive:** Show relevant filters for current page
- ✅ **"Xem thêm/Thu gọn":** Collapse/expand when >20 items

**V2 Approach (SSR):**
- ❌ **No API calls** - Query database directly in Astro
- ✅ **Server-side generation** - Build filters during SSR
- ✅ **Same logic** - Match v1 behavior exactly

## Requirements

### Functional Requirements
- Generate dynamic filter blocks based on current URL pattern
- Show relevant filters for current context:
  - **Location page** (e.g., `/mua-ban/ha-noi`): Show other districts, property types
  - **Property type page** (e.g., `/mua-ban/can-ho-chung-cu`): Show locations, price ranges
  - **Combined page** (e.g., `/mua-ban/ha-noi/can-ho-chung-cu`): Show districts, other types
- Collapse/expand for lists >20 items
- Generate SEO-friendly URLs for each filter

### Non-functional Requirements
- Fast SSR rendering (<100ms query time)
- Cache filter blocks (Redis, 5 min TTL)
- Responsive: Stack blocks vertically
- Accessibility: Keyboard navigation

## Architecture

```typescript
// src/services/sidebar-filter-service.ts
interface SidebarFilterBlock {
  title: string;
  filters: SidebarFilter[];
}

interface SidebarFilter {
  title: string;
  url: string;
  count?: number; // Optional property count
}

interface SidebarFilterParams {
  currentUrl: string;
  transactionType?: number;
  citySlug?: string;
  districtSlugs?: string[];
  propertyTypeIds?: number[];
}

// Generate filter blocks based on URL context
export async function generateSidebarFilters(
  params: SidebarFilterParams
): Promise<SidebarFilterBlock[]> {
  // Query DB for relevant filters
  // Build filter blocks based on current page context
}
```

## Related Code Files

### Files to Create
- `src/services/sidebar-filter-service.ts` - Generate dynamic filter blocks
- `src/components/listing/sidebar/dynamic-sidebar-filters.astro` - Render filter blocks
- `src/utils/sidebar-filter-builder.ts` - Build filter URLs

### Files to Modify
- `src/pages/[...slug].astro` - Add DynamicSidebarFilters to sidebar
- Database: Ensure `locations` table has necessary data

## Implementation Steps

1. **Create Sidebar Filter Service**
   ```typescript
   // src/services/sidebar-filter-service.ts
   export async function generateSidebarFilters(
     params: SidebarFilterParams
   ): Promise<SidebarFilterBlock[]> {
     const blocks: SidebarFilterBlock[] = [];

     // Block 1: Other districts (if on city page)
     if (params.citySlug && !params.districtSlugs?.length) {
       const districts = await getDistrictsByCity(params.citySlug);
       blocks.push({
         title: 'Khu vực khác',
         filters: districts.map(d => ({
           title: d.name,
           url: buildDistrictUrl(params, d.slug)
         }))
       });
     }

     // Block 2: Other property types
     const propertyTypes = await getPropertyTypes();
     blocks.push({
       title: 'Loại hình khác',
       filters: propertyTypes.map(pt => ({
         title: pt.name,
         url: buildPropertyTypeUrl(params, pt.id)
       }))
     });

     // Block 3: Price ranges (if applicable)
     // ... more blocks

     return blocks;
   }
   ```

2. **Create Filter URL Builder**
   ```typescript
   // src/utils/sidebar-filter-builder.ts
   export function buildDistrictUrl(
     params: SidebarFilterParams,
     districtSlug: string
   ): string {
     // Build URL: /mua-ban/ha-noi/ba-dinh/...
     const segments = [
       getTransactionTypePath(params.transactionType),
       params.citySlug,
       districtSlug
     ];
     return '/' + segments.filter(Boolean).join('/');
   }

   export function buildPropertyTypeUrl(
     params: SidebarFilterParams,
     propertyTypeId: number
   ): string {
     // Build URL with property_types query param
     // ... implementation
   }
   ```

3. **Create Dynamic Sidebar Filters Component**
   ```astro
   ---
   // src/components/listing/sidebar/dynamic-sidebar-filters.astro
   import type { SidebarFilterBlock } from '@/services/sidebar-filter-service';

   interface Props {
     blocks: SidebarFilterBlock[];
   }

   const { blocks } = Astro.props;
   ---

   {blocks.map((block, blockIndex) => (
     <div class="wg-property filter mb-20" id={`filter-block-${blockIndex}`}>
       <div class="wg-title text-10 fw-6 text-color-heading">
         {block.title}
       </div>
       <div class="wg-content">
         <ul class="wg-sidebar-filter-list">
           {block.filters.map((filter, idx) => (
             <li
               class="wg-sidebar-filter-item"
               style={idx >= 20 ? 'display:none;' : ''}
             >
               <a href={filter.url}>{filter.title}</a>
             </li>
           ))}
         </ul>
         {block.filters.length > 20 && (
           <div class="filter-toggle-controls mt-10">
             <a href="#" class="btn-show-more">Xem thêm</a>
             <a href="#" class="btn-show-less" style="display:none;">Thu gọn</a>
           </div>
         )}
       </div>
     </div>
   ))}

   <script>
     // Collapse/expand logic (same as v1)
     // ... JavaScript implementation
   </script>
   ```

4. **Integrate into Listing Page**
   ```astro
   ---
   // src/pages/[...slug].astro
   import { generateSidebarFilters } from '@/services/sidebar-filter-service';

   const urlParams = parseListingUrl(Astro.url);

   const sidebarFilters = await generateSidebarFilters({
     currentUrl: Astro.url.pathname,
     transactionType: urlParams.transactionType,
     citySlug: urlParams.citySlug,
     districtSlugs: urlParams.districtSlugs,
     propertyTypeIds: urlParams.propertyTypeIds
   });
   ---

   <ListingWithSidebarLayout>
     <div slot="sidebar">
       <DynamicSidebarFilters blocks={sidebarFilters} />
     </div>
   </ListingWithSidebarLayout>
   ```

5. **Database Queries**
   ```typescript
   // src/services/sidebar-filter-service.ts (continued)
   async function getDistrictsByCity(citySlug: string): Promise<Location[]> {
     // Query PostgreSQL via Drizzle ORM
     const city = await db
       .select()
       .from(locations)
       .where(eq(locations.slug, citySlug))
       .limit(1);

     if (!city[0]) return [];

     return await db
       .select()
       .from(locations)
       .where(eq(locations.parentId, city[0].id))
       .orderBy(desc(locations.searchCount))
       .limit(50);
   }

   async function getPropertyTypes(): Promise<PropertyType[]> {
     // Query property types from DB
     return await db
       .select()
       .from(propertyTypes)
       .where(eq(propertyTypes.isActive, true))
       .orderBy(propertyTypes.displayOrder);
   }
   ```

## Todo List

- [ ] Create `sidebar-filter-service.ts` with filter generation logic
- [ ] Create `sidebar-filter-builder.ts` for URL building
- [ ] Create `dynamic-sidebar-filters.astro` component
- [ ] Implement district filter block (if on city page)
- [ ] Implement property type filter block
- [ ] Implement price range filter block (optional)
- [ ] Add collapse/expand for lists >20 items
- [ ] Add JavaScript for "Xem thêm/Thu gọn" buttons
- [ ] Test filter generation for different URL patterns
- [ ] Cache filter blocks in Redis (5 min TTL)
- [ ] Handle empty states (no filters available)
- [ ] Verify SEO-friendly URLs

## Success Criteria

- ✅ Filter blocks display based on current URL context
- ✅ **City page** (`/mua-ban/ha-noi`): Shows other districts + property types
- ✅ **Property type page** (`/mua-ban/can-ho-chung-cu`): Shows locations + other types
- ✅ **Combined page** (`/mua-ban/ha-noi/can-ho-chung-cu`): Shows districts + related filters
- ✅ Lists >20 items show "Xem thêm" button
- ✅ Clicking "Xem thêm" expands full list
- ✅ Clicking "Thu gọn" collapses to first 20 items
- ✅ All filter URLs are SEO-friendly and valid
- ✅ Fast SSR rendering (<100ms)
- ✅ Responsive layout on mobile

## Risk Assessment

**Medium Risk:**
- Complex logic to determine which filters to show
- URL building must match v1 pattern exactly
- Performance: Multiple DB queries per page load

**Mitigation:**
- Cache entire filter blocks in Redis (5 min TTL)
- Use prepared statements for fast queries
- Limit filters to top 50 per block
- Test extensively with different URL patterns

## Security Considerations

- **XSS Prevention:** Encode filter titles and URLs in HTML
- **SQL Injection:** Use parameterized queries (Drizzle ORM)
- **No User Input:** Filters are server-generated only

## Next Steps

After dynamic sidebar filters are complete:
- **Phase 13:** Implement Featured Project Banner
- **Integration:** Test full sidebar with all components
- **Performance:** Optimize Redis caching strategy
