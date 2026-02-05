# Plan: Fetch Property Detail from PostgreSQL by Slug

## Overview
- **Priority:** High
- **Status:** Planning
- **Branch:** main

Replace mock data in property detail page (`/bat-dong-san/[slug]`) with real data from PostgreSQL database using SSR.

## Context Links
- Property detail page: `src/pages/bat-dong-san/[slug].astro`
- Property interface: `src/types/property.ts`
- Existing ES service pattern: `src/services/elasticsearch-property-service.ts`

## Key Insights
- Project uses Astro SSR with Node.js adapter (`output: "server"`)
- Database: `postgres://tongkhobds:***@db.tongkhobds.com:5432/tongkhobds`
- Need to add `pg` package for PostgreSQL client
- Follow existing service pattern from `elasticsearch-property-service.ts`

## Architecture

```
[slug].astro (SSR)
    ↓
PostgresPropertyService.getPropertyBySlug(slug)
    ↓
PostgreSQL Database (db.tongkhobds.com)
    ↓
Map DB fields → Property interface
    ↓
Render with real data
```

## Database Schema (Discovered)

**Main Table:** `real_estate`

| DB Field | Type | Maps To |
|----------|------|---------|
| `id` | integer | `Property.id` |
| `title` | varchar | `Property.title` |
| `slug` | varchar | `Property.slug` (lookup key) |
| `property_type_id` | integer | `Property.type` (14=house, 46=land, 1=apartment) |
| `transaction_type` | integer | `Property.transactionType` (1=sale, 2=rent) |
| `price` | bigint | raw price in VND |
| `price_description` | varchar | `Property.price` + `Property.priceUnit` (parse "5.2 tỷ") |
| `area` | double | `Property.area` |
| `bedrooms` | integer | `Property.bedrooms` |
| `bathrooms` | integer | `Property.bathrooms` |
| `city` | varchar | `Property.city` |
| `district` | varchar | `Property.district` |
| `street_address` | varchar | `Property.address` |
| `description` | text | `Property.description` |
| `html_content` | text | Extended description (HTML) |
| `images` | text | JSON array → `Property.images` |
| `main_image` | text | `Property.thumbnail` |
| `is_featured` | boolean | `Property.isFeatured` |
| `is_verified` | boolean | `Property.isHot` |
| `created_on` | timestamp | `Property.createdAt` |
| `data_json` | text | JSON with features (tiện ích) |
| `contact_name/phone/email` | varchar | Contact info |

**Image Base URL:** `https://quanly.tongkhobds.com`

## Implementation Phases

### Phase 1: Setup ✅
- [x] Install `pg` package
- [x] Discover DB schema

### Phase 2: Create PostgreSQL Service
- [ ] Create `src/services/postgres-property-service.ts`
- [ ] Implement `getPropertyBySlug(slug)` method
- [ ] Implement `getRelatedProperties(propertyId, propertyType, limit)` method
- [ ] Map DB fields to `Property` interface
- [ ] Add fallback to mock data if connection fails

### Phase 3: Integrate with Property Detail Page
- [ ] Update `src/pages/bat-dong-san/[slug].astro`
- [ ] Import and use `PostgresPropertyService`
- [ ] Test with real slugs

### Phase 4: Environment Configuration
- [ ] Add DB env vars to `.env.example`
- [ ] Add TypeScript env declarations

## Related Files
- **Modify:** `src/pages/bat-dong-san/[slug].astro`
- **Create:** `src/services/postgres-property-service.ts`
- **Modify:** `.env.example` (add DB vars)
- **Modify:** `src/env.d.ts` (add type declarations)

## Success Criteria
- [ ] Property detail page fetches data from PostgreSQL by slug
- [ ] Fallback to mock data if DB unavailable
- [ ] No breaking changes to existing functionality
- [ ] SSR works correctly

## Risk Assessment
- **DB Schema Unknown:** Need to query schema first → mitigate by running discovery script
- **Connection Pooling:** Use connection pool to prevent connection exhaustion
- **Error Handling:** Graceful fallback to mock data

## Next Steps
After approval:
1. Run DB schema discovery
2. Implement service
3. Test locally
