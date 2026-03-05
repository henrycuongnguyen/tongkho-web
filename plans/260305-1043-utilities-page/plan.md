---
title: "Utilities Page (Trang Tiện Ích) Implementation"
description: "Build feng shui calculators and utilities page - database-first approach"
status: pending
priority: P2
effort: 8h
branch: detail53
tags: [utilities, feng-shui, calculators, forms, react, database]
created: 2026-03-05
updated: 2026-03-05
---

# Utilities Page Implementation Plan

## Overview

Build `/tienich` page with dynamic feng shui calculators using **database-first approach** (NOT v1 API calls).

**URLs:**
- `/tienich` - Index page (first utility or list)
- `/tienich/{slug}` - Dynamic utility pages
- `/tienich/so-sanh` - Property comparison (ALREADY EXISTS)

## Architecture (REVISED - Database-First)

```
┌─────────────────────────────────────────────────────────────┐
│                    /tienich/[slug].astro                     │
│  (SSG/SSR - queries PostgreSQL directly at build/request)   │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Sidebar Menu    │  │ UtilityForm.tsx │  │ UtilityResult   │
│ (Static)        │  │ (React Island)  │  │ (React Island)  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ PostgreSQL      │  │ Hardcoded       │  │ External AI API │
│ (folder, news)  │  │ form-configs.ts │  │ (resan8n.ecrm)  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Data Sources

| Data | V1 Approach | V2 Approach (NEW) |
|------|-------------|-------------------|
| Utilities list | API: `/api_customer/news_by_folder.json` | DB: `news` table via Drizzle |
| Form config | API: `/api/get_form_config.json` | Hardcoded: `form-configs.ts` |
| Calculate result | External: `resan8n.ecrm.vn/webhook/tkbds-app/ai` | Same (no change) |

## Phase Summary

| Phase | Description | Effort |
|-------|-------------|--------|
| 1 | Service layer + types (DB queries) | 1.5h |
| 2 | Sidebar component | 0.5h |
| 3 | Dynamic form component | 2h |
| 4 | Result display component | 1h |
| 5 | Page routes | 1.5h |
| 6 | Testing + polish | 1.5h |

**Total: ~8h**

## Success Criteria

- [ ] Query `news` table directly for utilities list
- [ ] Hardcode form configs in TypeScript
- [ ] Still call external AI API for calculations
- [ ] All 4 feng shui calculators working
- [ ] Form validation (required, min/max)
- [ ] Loading + error states
- [ ] Sidebar with active state
- [ ] Breadcrumb navigation
- [ ] Mobile responsive
- [ ] v1 URL compatibility

## Dependencies

- Existing comparison page: `src/pages/tienich/so-sanh.astro`
- Database: PostgreSQL via Drizzle ORM
- External AI API: `https://resan8n.ecrm.vn/webhook/tkbds-app/ai`
- React 19 for interactive forms
- Tailwind CSS for styling

## Database Schema (Existing)

```typescript
// src/db/schema/menu.ts
export const folder = pgTable('folder', {
  id: serial('id').primaryKey(),
  parent: integer('parent'),
  name: varchar('name', { length: 255 }),   // e.g., "tien-ich-tong-kho"
  label: varchar('label', { length: 512 }),
  publish: char('publish', { length: 1 }),
  displayOrder: integer('display_order'),
});

// src/db/schema/news.ts
export const news = pgTable('news', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 500 }),       // Utility title
  description: text('description'),              // Utility type (e.g., "HouseConstructionAgeCheck")
  avatar: varchar('avatar', { length: 500 }),    // Utility icon
  folder: integer('folder'),                     // FK to folder table
  displayOrder: integer('display_order'),
  aactive: boolean('aactive').default(true),
});
```

## File Structure (Planned)

```
src/
├── pages/
│   └── tienich/
│       ├── index.astro          # Redirect to first utility
│       ├── [slug].astro         # Dynamic utility page
│       └── so-sanh.astro        # EXISTS - Property comparison
├── components/
│   └── utility/
│       ├── utility-sidebar.astro
│       ├── utility-form.tsx
│       └── utility-result.tsx
└── services/
    └── utility/
        ├── types.ts             # TypeScript interfaces
        ├── form-configs.ts      # HARDCODED form configurations
        ├── utility-service.ts   # Database queries + AI API call
        └── index.ts
```

## 4 Utility Types (Hardcoded Forms)

| Type | Title | Fields |
|------|-------|--------|
| `HouseConstructionAgeCheck` | Tư vấn tuổi xây nhà | ownerBirthYear, expectedStartYear, gender |
| `FengShuiDirectionAdvisor` | Tư vấn hướng nhà | ownerBirthYear, houseFacing, gender, lengthOption |
| `ColorAdvisor` | Tư vấn màu sắc phong thủy | ownerBirthYear, gender, lengthOption |
| `OfficeFengShui` | Tư vấn phong thủy văn phòng | ownerBirthYear, gender, lengthOption |

## AI API Endpoint

```
POST https://resan8n.ecrm.vn/webhook/tkbds-app/ai
Headers:
  x-api-key: C2fvbErrov102oUer0
  Content-Type: application/json

Body: {
  type: string,           // HouseConstructionAgeCheck, etc.
  ownerBirthYear: number,
  expectedStartYear?: number,
  houseFacing?: string,
  gender?: string,
  lengthOption?: string,
  userId: number
}

Response: {
  status: 1,
  data: { html: string }
}
```

## Risks

1. **DB unavailable**: Add fallback to hardcoded utility list
2. **AI API down**: Show error with retry button
3. **Form config mismatch**: Keep form configs in sync with AI requirements

## Next Steps

Proceed to phase-01-service-layer.md for implementation details.
