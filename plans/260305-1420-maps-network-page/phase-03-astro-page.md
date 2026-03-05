# Phase 3: Astro Page Component

## Context Links
- [v1 Template](../../reference/resaland_v1/views/home/maps.html)
- [Existing Page Pattern](../../src/pages/gioi-thieu.astro)
- [Main Layout](../../src/layouts/main-layout.astro)

## Overview
- **Priority:** P1 (blocking)
- **Status:** completed
- **Effort:** 1.5h
- **Dependencies:** Phase 2 (Office Service)
- **Completed:** 2026-03-05

## Key Insights

v1 Structure (maps.html):
1. Hero section: `.network-hero-section` with title, description, visual
2. Office locator: `.office-locator-section` with split-panel (list + map)
3. Data passed via inline `<script>` to client JS
4. Google Maps API loaded dynamically

## Requirements

### Functional
- Hero section with network ecosystem description
- Split-panel layout: office list (left) + map (right)
- Build-time data fetch from service
- Serialize office data to inline JSON for client
- Google Maps API key from environment variable
- Loading spinner while map initializes

### Non-Functional
- SEO: Static HTML office list crawlable
- Responsive: Mobile-friendly layout
- Progressive enhancement: List visible without JS

## Architecture

```
maps.astro
├── Frontmatter (build-time)
│   ├── Import layout, service
│   ├── Fetch offices via getActiveOffices()
│   ├── Serialize to JSON
│   └── Get Google Maps API key from env
│
├── HTML Structure
│   ├── <section.network-hero-section>
│   │   └── Hero content (title, description, visual)
│   ├── <section.office-locator-section>
│   │   ├── Office list container (#office-list)
│   │   └── Map container (#office-map)
│   └── Inline scripts
│       ├── Office data (window.__OFFICE_DATA__)
│       ├── API key (window.GOOGLE_MAPS_KEY)
│       └── Script loader + init
│
└── External Resources
    ├── /js/office-locator.js (client script)
    └── /css/network-hero.css (styling)
```

## Related Code Files

**Create:**
- `src/pages/maps.astro`

**Dependencies:**
- `src/layouts/main-layout.astro`
- `src/services/office-service.ts`
- `public/js/office-locator.js` (Phase 4)
- `public/css/network-hero.css` (Phase 5)

## Implementation Steps

### Step 1: Create maps.astro

**File:** `src/pages/maps.astro`

```astro
---
/**
 * Maps/Network Page
 * Office network locator with Google Maps integration
 * URL: /maps
 *
 * Architecture: Hybrid SSG + Client JS
 * - Build-time: Fetch offices from DB, generate static HTML
 * - Client-side: Google Maps API for interactive map
 */
import MainLayout from '@/layouts/main-layout.astro';
import { getActiveOffices } from '@/services/office-service';

// Build-time data fetch
const offices = await getActiveOffices();
const hasValidOffices = offices.some((o) => o.lat && o.lng);

// Serialize for client-side JS (camelCase → snake_case for v1 compat)
const officesForClient = offices.map((o) => ({
  id: o.id,
  name: o.name,
  address: o.address,
  phone: o.phone,
  city_name: o.cityName,
  district_name: o.districtName,
  ward_name: o.wardName,
  lat: o.lat,
  lng: o.lng,
  company_representative: o.companyRepresentative,
  position_representative: o.positionRepresentative,
  time_work: o.timeWork,
}));
const officesJSON = JSON.stringify(officesForClient);

// Google Maps API key (PUBLIC_ prefix for client exposure)
const GOOGLE_MAPS_KEY = import.meta.env.PUBLIC_GOOGLE_MAPS_KEY || '';

const pageTitle = 'Mạng lưới văn phòng - TongkhoBDS.com';
const pageDescription = 'Danh sách và bản đồ vị trí các văn phòng của TongkhoBDS.com trên toàn quốc';
---

<MainLayout title={pageTitle} description={pageDescription}>
  <!-- Network Hero Section -->
  <section class="network-hero-section">
    <div class="tf-container">
      <div class="row align-items-center">
        <div class="col-lg-5">
          <div class="network-content">
            <h1 class="network-title">Mạng lưới</h1>
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
            <img
              src="/images/section/element.png"
              alt="TongKhoBDS Network"
              class="phone-mockup"
              loading="lazy"
            />
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
          <h2 class="mb-3 text-xl font-semibold">Văn phòng Tổng kho BDS</h2>
        </div>
      </div>
      <div class="row office-locator-row">
        <!-- Office List Panel -->
        <div class="col-md-4 office-list-col">
          <ul id="office-list" class="list-group">
            {!hasValidOffices && (
              <li class="list-group-item text-muted">
                <span class="text-secondary-500">Đang tải danh sách văn phòng...</span>
              </li>
            )}
          </ul>
          <noscript>
            <div class="p-4 bg-yellow-50 text-yellow-800 rounded">
              Vui lòng bật JavaScript để xem bản đồ và danh sách văn phòng.
            </div>
          </noscript>
        </div>

        <!-- Map Panel -->
        <div class="col-md-8 office-map-col">
          <div id="office-map">
            <div class="d-flex align-items-center justify-content-center h-100">
              <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Đang tải...</span>
                </div>
                <div class="mt-2 text-secondary-600">Đang tải bản đồ...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Inline Office Data for Client JS -->
  <script is:inline define:vars={{ officesJSON }}>
    window.__OFFICE_DATA__ = JSON.parse(officesJSON);
  </script>

  <!-- Google Maps API Key -->
  <script is:inline define:vars={{ GOOGLE_MAPS_KEY }}>
    window.GOOGLE_MAPS_KEY = GOOGLE_MAPS_KEY;
  </script>

  <!-- Office Locator Client Script -->
  <script src="/js/office-locator.js" defer></script>
  <script is:inline>
    document.addEventListener('DOMContentLoaded', function() {
      if (window.OfficeLocator && window.__OFFICE_DATA__) {
        window.OfficeLocator.init(window.__OFFICE_DATA__);
      }
    });
  </script>
</MainLayout>

<style>
  /* Import v1 network-hero.css styles */
  @import '/css/network-hero.css';
</style>
```

### Step 2: Verify hero image exists

Check if `/public/images/section/element.png` exists. If not, either:
1. Copy from v1 reference: `reference/resaland_v1/static/images/section/element.png`
2. Or use placeholder image and note for design team

```bash
# Check if image exists
ls public/images/section/element.png
```

### Step 3: Test page loads

```bash
npm run dev
# Open http://localhost:3000/maps
```

Expected:
- Hero section visible
- Loading spinner in map area
- Console: errors about missing `/js/office-locator.js` (expected, Phase 4)

## Todo List

- [x] Create `src/pages/maps.astro`
- [x] Verify `element.png` exists or add placeholder
- [x] Run `npm run dev` - page loads without crash
- [x] Hero section renders correctly
- [x] Loading spinner visible in map area
- [x] Console shows office data in `window.__OFFICE_DATA__`

## Success Criteria

- [x] `/maps` route accessible
- [x] Hero section displays title + description
- [x] Office locator section has list + map containers
- [x] Office data serialized to `window.__OFFICE_DATA__`
- [x] Google Maps key available in `window.GOOGLE_MAPS_KEY`
- [x] No build errors

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Hero image missing | Medium | Low | Use placeholder, note for design |
| CSS conflicts with Tailwind | Medium | Medium | Test responsive, fix in Phase 5 |
| SSR data serialization fails | Low | High | JSON.stringify handles most types |

## Security Considerations

- Office data is public (no sensitive info)
- API key exposed but restricted in Google Console (Phase 6)
- No user input processed

## Next Steps

After completion: Proceed to [Phase 4: Client Script](./phase-04-client-script.md)
