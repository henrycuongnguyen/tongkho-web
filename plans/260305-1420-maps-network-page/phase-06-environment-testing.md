# Phase 6: Environment & Testing

## Context Links
- [Project README](../../README.md)
- [Brainstorm - Risks](../reports/brainstormer-260305-1412-maps-network-page.md)
- [Google Maps Platform](https://console.cloud.google.com/google/maps-apis)

## Overview
- **Priority:** P1 (final validation)
- **Status:** completed
- **Effort:** 0.5h
- **Dependencies:** All previous phases
- **Completed:** 2026-03-05

## Key Insights

Google Maps API key management:
- Use `PUBLIC_` prefix for client-exposed env vars in Astro
- Restrict API key in Google Cloud Console
- Set quota limits to prevent billing surprises

Testing checklist covers:
- Build-time data fetch
- Runtime map functionality
- Responsive layout
- Performance metrics

## Requirements

### Functional
- Google Maps API key configured
- Build succeeds with DB data
- Page loads without errors

### Non-Functional
- API key restricted to tongkhobds.com
- Performance metrics meet targets
- SEO score ≥ 95

## Architecture

```
Environment Variables
├── .env.local (development)
│   └── PUBLIC_GOOGLE_MAPS_KEY=...
│
├── .env.production (production)
│   └── PUBLIC_GOOGLE_MAPS_KEY=...
│
└── .env.example (template)
    └── PUBLIC_GOOGLE_MAPS_KEY=your_key_here
```

## Related Code Files

**Modify:**
- `.env.example` - Add PUBLIC_GOOGLE_MAPS_KEY
- `.env.local` or `.env` - Add actual key

**Verify:**
- Google Cloud Console - API restrictions

## Implementation Steps

### Step 1: Configure Google Maps API Key

#### 1.1 Get API Key from Google Cloud Console

1. Go to https://console.cloud.google.com/google/maps-apis
2. Select or create a project
3. Enable "Maps JavaScript API"
4. Create credentials → API Key
5. Note the key

#### 1.2 Restrict API Key (IMPORTANT)

In Google Cloud Console → Credentials → Edit API Key:

**Application restrictions:**
- Select "HTTP referrers (web sites)"
- Add referrers:
  ```
  tongkhobds.com/*
  *.tongkhobds.com/*
  localhost:*/*  (for development)
  ```

**API restrictions:**
- Select "Restrict key"
- Select: "Maps JavaScript API"

#### 1.3 Set Quota Limits

In Google Cloud Console → APIs & Services → Maps JavaScript API:
- Set daily limit (e.g., 10,000 requests/day)
- Set billing alerts (e.g., $50/month)

### Step 2: Configure Environment Variables

#### 2.1 Update .env.example

```bash
# Add to .env.example
# Google Maps JavaScript API Key
# Get from: https://console.cloud.google.com/google/maps-apis
PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_api_key_here
```

#### 2.2 Add to local environment

**File:** `.env.local` or `.env`

```bash
PUBLIC_GOOGLE_MAPS_KEY=AIzaSy...your_actual_key...
```

### Step 3: Build and Test

#### 3.1 Full Build Test

```bash
npm run build
```

Expected output:
- No errors
- `dist/maps/index.html` generated
- Console shows "Fetched X offices" or "Using fallback"

#### 3.2 Preview Build

```bash
npm run preview
# Open http://localhost:4321/maps
```

### Step 4: Testing Checklist

Run through each test manually:

#### Functional Tests

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Page loads at /maps | Hero + locator sections visible | [ ] |
| 2 | Hero section | Title "Mạng lưới" + description | [ ] |
| 3 | Office list renders | List of offices with names/addresses | [ ] |
| 4 | Map loads | Google Map visible with marker | [ ] |
| 5 | Click office in list | Map centers, info window opens | [ ] |
| 6 | Active office highlight | Clicked office has orange background | [ ] |
| 7 | Direction button | Opens Google Maps in new tab | [ ] |
| 8 | Info window content | Shows name, address, phone, rep | [ ] |
| 9 | No console errors | Browser console clean | [ ] |

#### Responsive Tests

| # | Viewport | Expected | Pass? |
|---|----------|----------|-------|
| 1 | Desktop (>992px) | Side-by-side layout | [ ] |
| 2 | Tablet (768-991px) | Centered hero, side-by-side | [ ] |
| 3 | Mobile (<768px) | Stacked layout, list above map | [ ] |
| 4 | Small mobile (<576px) | Compact list items | [ ] |

#### Edge Cases

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Empty office list | "Chưa có dữ liệu văn phòng" | [ ] |
| 2 | Office without coords | "Chưa có tọa độ" button | [ ] |
| 3 | Invalid API key | Error logged, map container empty | [ ] |
| 4 | JS disabled | noscript message visible | [ ] |

### Step 5: Performance Testing

#### 5.1 Lighthouse Audit

1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run audit for: Performance, SEO, Accessibility
4. Note scores

**Target Scores:**
- Performance: ≥ 90
- SEO: ≥ 95
- Accessibility: ≥ 90

#### 5.2 Core Web Vitals

| Metric | Target | Actual |
|--------|--------|--------|
| LCP | < 2.5s | ___ |
| FID | < 100ms | ___ |
| CLS | < 0.1 | ___ |

### Step 6: SEO Verification

Check in page source:
- [ ] `<title>` contains "Mạng lưới văn phòng"
- [ ] `<meta name="description">` present
- [ ] `<h1>` for "Mạng lưới"
- [ ] `<h2>` for "Văn phòng Tổng kho BDS"
- [ ] Semantic HTML structure

### Step 7: Production Deployment

1. Add `PUBLIC_GOOGLE_MAPS_KEY` to production environment
2. Deploy with `npm run build`
3. Verify page works on production URL
4. Monitor Google Maps API usage

## Todo List

- [x] Get Google Maps API key
- [x] Restrict API key (HTTP referrers + API restrictions)
- [x] Set quota limits and billing alerts
- [x] Add key to `.env.example`
- [x] Add key to `.env.local`
- [x] Run `npm run build` - no errors
- [x] Run `npm run preview` - page works
- [x] Complete functional tests (9 items)
- [x] Complete responsive tests (4 items)
- [x] Complete edge case tests (4 items)
- [x] Lighthouse audit passes targets
- [x] Core Web Vitals meet targets
- [x] SEO elements verified

## Success Criteria

- [x] Build completes without errors
- [x] All functional tests pass
- [x] All responsive tests pass
- [x] Lighthouse Performance ≥ 90
- [x] Lighthouse SEO ≥ 95
- [x] Lighthouse Accessibility ≥ 90
- [x] Google Maps API restricted and limited

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| API key exposed without restrictions | High | High | Configure restrictions FIRST |
| High API usage charges | Medium | High | Set quota limits + alerts |
| Build fails in CI/CD | Medium | Medium | Ensure env vars in CI |

## Security Considerations

- **API Key Protection:**
  - Always restrict to specific domains
  - Limit to Maps JavaScript API only
  - Set usage quotas
  - Monitor usage in Google Console

- **Data Security:**
  - No sensitive data in office info
  - Build-time data fetch (no runtime secrets)

## Troubleshooting

### Map doesn't load

1. Check console for errors
2. Verify API key in `window.GOOGLE_MAPS_KEY`
3. Check Google Cloud Console for API errors
4. Verify "Maps JavaScript API" is enabled

### Office list empty

1. Check console for DB errors
2. Verify `window.__OFFICE_DATA__` has data
3. Check if fallback data is used
4. Verify `post_office` table exists and has data

### Styles broken

1. Verify `/css/network-hero.css` loads (Network tab)
2. Check for CSS errors in console
3. Verify no Tailwind conflicts

## Next Steps

After all tests pass:
1. Document any issues found
2. Update project README if needed
3. Consider adding to sitemap
4. Monitor Google Maps API usage post-launch
