# Brainstorming Report: Maps/Network Page Implementation (v1 → v2)

**Date:** 2026-03-05
**Context:** Migrate v1's `/maps` page (network of offices) to v2 Astro SSG architecture
**Status:** Brainstorming Complete - Ready for Planning

---

## Problem Statement

Implement `/maps` page in v2 mirroring v1's office network locator with:
- Hero section describing TongKhoBDS ecosystem
- Interactive split-panel UI (office list + Google Maps)
- Build-time data fetch from PostgreSQL `post_office` table
- SSG caching for static generation
- Google Maps JavaScript API integration
- Full UX parity with v1 (clickable list, map markers, info windows, directions)

---

## Requirements Analysis

### Functional Requirements
1. **Hero Section:** Static content explaining network ecosystem
2. **Office List Panel:** Scrollable list of offices with address, phone, hours
3. **Map Panel:** Google Maps showing office markers with info popups
4. **Interactivity:** Click office → center map + show info window
5. **Directions:** "Chỉ đường" button opens Google Maps navigation
6. **Data Source:** PostgreSQL `post_office` table via Drizzle ORM
7. **Build Strategy:** SSG at build time, data cached for performance

### Non-Functional Requirements
- **Performance:** Fast page load (static HTML + lazy-load maps JS)
- **SEO:** Static content crawlable by search engines
- **Caching:** Build-time data fetch, no runtime DB queries
- **Maintainability:** Clean separation (schema, service, component, client script)
- **Responsive:** Mobile-friendly layout (list above map on small screens)

---

## v1 Implementation Analysis

### Data Flow
```
Controller (home.py)
  └─> API Call: quanly.tongkhobds.com/tongkho/api_customer/get_offices.json
      └─> Returns: {status, result: {items: [{id, full_name, address, lat, lng, ...}]}}
          └─> Maps to: {id, name, address, city_name, district_name, ward_name, lat, lng, ...}
```

### Database Schema (v1)
```sql
post_office (
  id, parent_id, office_level (1-5),
  name, phone, email, address,
  city, district, ward,
  city_name, district_name, ward_name,
  address_latitude, address_longitude,
  manager_user_id, status, aactive,
  created_on, updated_on
)
```

### UI Components (v1)
1. **Hero:** `.network-hero-section` - Title + description + visual element
2. **List:** `#office-list` - Scrollable `<ul>` with office cards
3. **Map:** `#office-map` - Google Maps container (min-height: 400px)
4. **Script:** `office-locator.js` - Fetches data, renders list, initializes map

### Key Features (v1)
- **Active State:** Clicked office highlighted in list
- **Map Markers:** Orange pin with drop animation
- **Info Windows:** Office details with "Chỉ đường" button
- **Fallback Data:** Demo offices if API fails
- **Loading State:** Spinner during initialization

---

## Proposed v2 Solution

### Architecture Decision: **Hybrid SSG + Client JS**

**Trade-off Analysis:**
- **Pure SSG (zero-JS):** Fast, SEO-friendly, but NO interactive maps → Poor UX
- **Pure Client-Side:** Fresh data, full interactivity, but slow initial load, poor SEO
- **Hybrid SSG + JS (RECOMMENDED):** Static base + progressive enhancement
  - ✅ Fast initial load (static HTML)
  - ✅ SEO-friendly (office list crawlable)
  - ✅ Interactive maps (Google Maps API loaded async)
  - ✅ Build-time data (no runtime DB queries)
  - ⚠️ Trade-off: Violates "zero-JS" principle → **Acceptable for this feature**

**Rationale:**
Office network map is a **utility page**, not content page. UX value of interactive maps > strict zero-JS adherence. Data rarely changes → build-time caching valid.

---

### Implementation Plan

#### Phase 1: Database Schema (Drizzle ORM)

**File:** `src/db/schema/office.ts`

```typescript
export const postOffice = pgTable('post_office', {
  id: serial('id').primaryKey(),
  parentId: integer('parent_id').references(() => postOffice.id),
  officeLevel: integer('office_level').default(2), // 1=Vùng, 2=Tỉnh, 3=Huyện, 4=Xã, 5=Tổ
  managerUserId: integer('manager_user_id'),
  name: varchar('name', { length: 200 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 100 }),
  address: varchar('address', { length: 200 }),
  city: varchar('city', { length: 20 }),
  district: varchar('district', { length: 20 }),
  ward: varchar('ward', { length: 20 }),
  cityName: varchar('city_name', { length: 255 }),
  districtName: varchar('district_name', { length: 255 }),
  wardName: varchar('ward_name', { length: 255 }),
  addressLatitude: varchar('address_latitude', { length: 20 }),
  addressLongitude: varchar('address_longitude', { length: 20 }),
  status: integer('status').default(1), // 1=Active, 2=Pending, 3=Suspended, 4=Closed, 9=Deleted
  aactive: boolean('aactive').default(true),
  createdOn: timestamp('created_on').defaultNow(),
  updatedOn: timestamp('updated_on').defaultNow(),
});

export type Office = typeof postOffice.$inferSelect;
```

**Notes:**
- Matches v1 schema structure
- `officeLevel` for hierarchical filtering (if needed)
- `aactive` + `status` for soft-delete pattern
- Lat/lon stored as `varchar` (v1 format) → convert to `float` in service

---

#### Phase 2: Office Service (Data Fetching)

**File:** `src/services/office-service.ts`

```typescript
import { db } from '@/db';
import { postOffice } from '@/db/schema/office';
import { eq, and } from 'drizzle-orm';

export interface OfficeLocation {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  cityName: string | null;
  districtName: string | null;
  wardName: string | null;
  lat: number | null;
  lng: number | null;
  companyRepresentative?: string;
  positionRepresentative?: string;
  timeWork?: string;
}

export async function getActiveOffices(): Promise<OfficeLocation[]> {
  try {
    const offices = await db
      .select({
        id: postOffice.id,
        name: postOffice.name,
        address: postOffice.address,
        phone: postOffice.phone,
        cityName: postOffice.cityName,
        districtName: postOffice.districtName,
        wardName: postOffice.wardName,
        addressLatitude: postOffice.addressLatitude,
        addressLongitude: postOffice.addressLongitude,
      })
      .from(postOffice)
      .where(
        and(
          eq(postOffice.aactive, true),
          eq(postOffice.status, 1) // Active only
        )
      )
      .orderBy(postOffice.name);

    return offices.map(office => ({
      id: office.id,
      name: office.name,
      address: office.address || '',
      phone: office.phone,
      cityName: office.cityName,
      districtName: office.districtName,
      wardName: office.wardName,
      lat: parseCoordinate(office.addressLatitude),
      lng: parseCoordinate(office.addressLongitude),
    }));
  } catch (error) {
    console.error('Failed to fetch offices:', error);
    // Fallback demo data (optional)
    return getFallbackOffices();
  }
}

function parseCoordinate(coord: string | null): number | null {
  if (!coord) return null;
  const parsed = parseFloat(coord);
  return isNaN(parsed) ? null : parsed;
}

function getFallbackOffices(): OfficeLocation[] {
  return [
    {
      id: 1,
      name: 'Văn phòng Hà Nội',
      address: 'Quận Cầu Giấy',
      phone: null,
      cityName: 'Hà Nội',
      districtName: 'Cầu Giấy',
      wardName: null,
      lat: 21.028511,
      lng: 105.804817,
    },
    {
      id: 2,
      name: 'Văn phòng TP.HCM',
      address: 'Quận 1',
      phone: null,
      cityName: 'TP. Hồ Chí Minh',
      districtName: 'Quận 1',
      wardName: null,
      lat: 10.776889,
      lng: 106.700806,
    },
  ];
}
```

**Notes:**
- Build-time execution only (no client bundle)
- Drizzle ORM with type-safe queries
- Coordinate conversion: `varchar` → `float`
- Fallback data for build resilience
- Filter active offices only (`aactive=true`, `status=1`)

---

#### Phase 3: Astro Page Component

**File:** `src/pages/maps.astro`

```astro
---
import Layout from '@/layouts/Layout.astro';
import { getActiveOffices } from '@/services/office-service';

// Build-time data fetch
const offices = await getActiveOffices();
const hasValidOffices = offices.some(o => o.lat && o.lng);

// Serialize for client-side JS
const officesJSON = JSON.stringify(offices);

// Google Maps API key (from env)
const GOOGLE_MAPS_KEY = import.meta.env.PUBLIC_GOOGLE_MAPS_KEY || 'YOUR_API_KEY';
---

<Layout
  title="Mạng lưới văn phòng - TongkhoBDS.com"
  description="Danh sách và bản đồ vị trí các văn phòng của TongkhoBDS.com"
>
  <!-- Network Hero Section -->
  <section class="network-hero-section">
    <div class="tf-container">
      <div class="row align-items-center">
        <div class="col-lg-5">
          <div class="network-content">
            <h2 class="network-title">Mạng lưới</h2>
            <p class="network-description">
              TongKhoBDS xây dựng hệ sinh thái kết nối bất động sản dựa trên công nghệ và dữ liệu,
              liên kết đội ngũ môi giới, cộng tác viên và đối tác trên nhiều khu vực.
              Mọi hoạt động được chuẩn hóa quy trình, đồng bộ thông tin nguồn hàng,
              giúp khách hàng và nhà đầu tư tiếp cận – đánh giá – giao dịch bất động sản minh bạch, hiệu quả.
            </p>
          </div>
        </div>
        <div class="col-lg-7">
          <div class="network-visual">
            <div class="world-map-bg"></div>
            <img src="/images/section/element.png" alt="Network" class="phone-mockup">
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Office Locator Section -->
  <section id="officeLocatorSection" class="office-locator-section py-4">
    <div class="tf-container">
      <div class="row">
        <div class="col-12">
          <h3 class="mb-3">Văn phòng Tổng kho BDS</h3>
        </div>
      </div>
      <div class="row office-locator-row">
        <!-- Office List Panel -->
        <div class="col-md-4 office-list-col">
          <ul id="office-list" class="list-group">
            {!hasValidOffices && (
              <li class="list-group-item text-muted">
                Chưa có dữ liệu văn phòng
              </li>
            )}
          </ul>
        </div>

        <!-- Map Panel -->
        <div class="col-md-8 office-map-col">
          <div id="office-map">
            <div class="d-flex align-items-center justify-content-center h-100">
              <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Đang tải...</span>
                </div>
                <div class="mt-2">Đang tải bản đồ...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Inline Office Data -->
  <script is:inline define:vars={{ officesJSON }}>
    window.__OFFICE_DATA__ = JSON.parse(officesJSON);
  </script>

  <!-- Google Maps API -->
  <script is:inline define:vars={{ GOOGLE_MAPS_KEY }}>
    window.GOOGLE_MAPS_KEY = GOOGLE_MAPS_KEY;
  </script>

  <!-- Office Locator Script -->
  <script src="/js/office-locator.js"></script>
  <script is:inline>
    document.addEventListener('DOMContentLoaded', function() {
      if (window.OfficeLocator) {
        window.OfficeLocator.init(window.__OFFICE_DATA__);
      }
    });
  </script>

  <style>
    /* Import from v1 network-hero.css */
    @import '/css/network-hero.css';
  </style>
</Layout>
```

**Notes:**
- Build-time data fetch via `getActiveOffices()`
- Serialize offices to inline `<script>` for client access
- Loading spinner replaced when map initializes
- Google Maps API key from env variable
- Reuse v1 CSS structure

---

#### Phase 4: Client-Side JavaScript

**File:** `public/js/office-locator.js`

Port v1's `office-locator.js` with modifications:
- Remove `fetchOffices()` → use `window.__OFFICE_DATA__`
- Keep `initGoogleMap()`, `setMapLocation()`, `renderList()` logic
- Keep active office highlighting, marker animations, info windows
- Keep "Chỉ đường" button functionality

**Key Changes from v1:**
```javascript
// OLD (v1)
const offices = await fetchOffices();

// NEW (v2)
function init(offices) {
  if (!offices || offices.length === 0) {
    showNoDataMessage();
    return;
  }
  renderList(offices);
  initMap(offices);
}

window.OfficeLocator = { init };
```

---

#### Phase 5: Styling

**File:** `public/css/network-hero.css`

Port v1's CSS with Tailwind compatibility:
- Keep hero section styles (`.network-hero-section`, `.network-title`)
- Keep office locator styles (`.office-locator-section`, `#office-list`, `#office-map`)
- Keep responsive breakpoints (`@media` queries)
- Remove conflicts with Tailwind utilities

**Optional Tailwind Migration:**
- Convert static CSS to Tailwind classes in `.astro` component
- Keep only custom animations/transitions in CSS file

---

#### Phase 6: Environment Configuration

**File:** `.env.example`

```bash
# Google Maps JavaScript API Key
PUBLIC_GOOGLE_MAPS_KEY=AIzaSyA...

# PostgreSQL Database
DATABASE_URL=postgresql://user:password@localhost:5432/tongkho
```

**Security Notes:**
- Use `PUBLIC_` prefix for client-exposed keys
- Add API key restrictions in Google Cloud Console:
  - **HTTP referrers:** `tongkhobds.com/*`
  - **API restrictions:** Maps JavaScript API only
- Never commit `.env` to version control

---

## Implementation Checklist

### Database Layer
- [ ] Create `src/db/schema/office.ts` (Drizzle schema)
- [ ] Verify `post_office` table exists in DB
- [ ] Test query with sample data

### Service Layer
- [ ] Create `src/services/office-service.ts`
- [ ] Implement `getActiveOffices()` with error handling
- [ ] Add fallback data for build resilience
- [ ] Test coordinate parsing logic

### Page Component
- [ ] Create `src/pages/maps.astro`
- [ ] Implement hero section HTML
- [ ] Implement office locator section
- [ ] Pass serialized data to client script
- [ ] Add Google Maps API script tag

### Client JavaScript
- [ ] Port `office-locator.js` from v1 to `public/js/`
- [ ] Remove API fetch logic (use inline data)
- [ ] Test map initialization
- [ ] Test office list rendering
- [ ] Test marker clicks + info windows
- [ ] Test "Chỉ đường" button

### Styling
- [ ] Port `network-hero.css` from v1 to `public/css/`
- [ ] Verify responsive layout (mobile/tablet/desktop)
- [ ] Fix Tailwind conflicts if any
- [ ] Test hero section visual elements
- [ ] Test office list scrolling

### Configuration
- [ ] Add `PUBLIC_GOOGLE_MAPS_KEY` to `.env`
- [ ] Update `.env.example` with placeholder
- [ ] Configure Google Maps API restrictions
- [ ] Test build with missing env vars (fallback behavior)

### Testing & QA
- [ ] Build-time: Verify data fetched from DB
- [ ] Runtime: Verify map loads without errors
- [ ] Click office in list → map centers + shows info
- [ ] Click "Chỉ đường" → opens Google Maps navigation
- [ ] Test with empty DB (fallback data)
- [ ] Test responsive layout on mobile
- [ ] Lighthouse: Performance, SEO, Accessibility scores

---

## Technical Risks & Mitigations

### Risk 1: Google Maps API Cost
**Impact:** High traffic → unexpected API charges
**Mitigation:**
- Set daily quota limits in Google Cloud Console
- Add billing alerts for cost monitoring
- Consider static map fallback for low-priority pages

### Risk 2: Build-Time DB Connection Failure
**Impact:** Build fails if DB unreachable
**Mitigation:**
- Graceful error handling in `office-service.ts`
- Fallback to demo data if query fails
- Log errors for debugging without blocking build

### Risk 3: Stale Office Data
**Impact:** Offices list outdated until rebuild
**Mitigation:**
- Document rebuild frequency (daily, weekly, on-demand)
- Add admin note: "Data updated at build time, run `npm run build` to refresh"
- Consider incremental static regeneration (ISR) if Astro supports in future

### Risk 4: Client-Side JS Fails to Load
**Impact:** Users see empty map + empty list
**Mitigation:**
- Render static office list in HTML (SSR fallback)
- Progressive enhancement: list visible without JS, map enhances UX
- Add `<noscript>` message if JS disabled

### Risk 5: Lat/Lon Data Quality
**Impact:** Invalid coordinates → map errors
**Mitigation:**
- Validate coordinates in `office-service.ts` (skip invalid)
- Default to Hanoi center (21.028511, 105.804817) if missing
- Log offices with invalid coords for data cleanup

---

## Performance Considerations

### Build Time
- **Database Query:** ~100ms for 50 offices (acceptable)
- **Data Serialization:** Minimal overhead (JSON.stringify)
- **Total Impact:** <200ms added to build time

### Runtime Performance
- **Initial Load:** Static HTML (fast)
- **Google Maps JS:** ~500KB (loaded async, no blocking)
- **Office Data:** <5KB inline JSON (negligible)
- **Target LCP:** <2.5s (achievable with CDN)

### Optimization Opportunities
- Lazy-load map: Only initialize when user scrolls to section
- Preconnect to `maps.googleapis.com` for faster API load
- Compress office data (remove nulls, minify JSON)
- Use Google Maps lite mode for slower devices

---

## SEO & Accessibility

### SEO Benefits (SSG)
- ✅ Static HTML office list crawlable by search engines
- ✅ `<title>` + `<meta description>` optimized
- ✅ Semantic HTML (`<section>`, `<h2>`, `<ul>`)
- ✅ Fast page load (LCP, FID, CLS metrics)

### Accessibility (a11y)
- [ ] Add ARIA labels to map controls
- [ ] Keyboard navigation for office list
- [ ] Focus management when clicking list items
- [ ] Screen reader announcements for map updates
- [ ] High-contrast mode support (check focus outlines)

### Structured Data (Optional)
Consider adding JSON-LD for `LocalBusiness` schema:
```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "TongkhoBDS",
  "address": {...},
  "geo": { "latitude": 21.028511, "longitude": 105.804817 }
}
```

---

## Success Criteria

### Functional
- ✅ `/maps` page loads successfully
- ✅ Hero section displays correctly
- ✅ Office list shows all active offices
- ✅ Map loads with office markers
- ✅ Clicking office in list → map centers + info window
- ✅ "Chỉ đường" button opens Google Maps navigation
- ✅ Responsive layout works on mobile/tablet/desktop

### Technical
- ✅ Build-time data fetch from PostgreSQL
- ✅ Zero runtime DB queries
- ✅ Google Maps API loads async (no blocking)
- ✅ Error handling graceful (fallback data)
- ✅ No console errors in production

### Performance
- ✅ Lighthouse Performance score ≥ 90
- ✅ LCP < 2.5s
- ✅ FID < 100ms
- ✅ CLS < 0.1

### SEO & Accessibility
- ✅ Lighthouse SEO score ≥ 95
- ✅ Lighthouse Accessibility score ≥ 90
- ✅ Office list crawlable by search engines
- ✅ Keyboard navigation functional

---

## Unresolved Questions

1. **Google Maps API Key Management:**
   - Should we use separate keys for dev vs production?
   - How to rotate keys without downtime?

2. **Office Data Update Frequency:**
   - How often does office data change in DB?
   - Should we add "Last updated: [date]" to UI?

3. **Hierarchical Office Display:**
   - Should we group offices by `office_level` (Vùng, Tỉnh, Huyện)?
   - Filter UI to show offices by region?

4. **Additional Office Info:**
   - Display `time_work`, `company_representative` in list panel or only in map popup?
   - Show office photos/images?

5. **Future Enhancements:**
   - Search/filter offices by city/district?
   - Show driving distance/time from user location?
   - Integrate with CRM for contact forms?

---

## Next Steps

**Ready for Planning Phase:**
User confirmed implementation approach. Recommend creating detailed plan with:
- File structure breakdown
- Line-by-line implementation steps
- Testing checklist
- Deployment verification

**Command to Proceed:**
`/plan` with this brainstorm context to generate phased implementation plan.

---

**End of Brainstorming Report**
