# Planner Report: Utilities Page Implementation (REVISED)

**Date:** 2026-03-05
**Plan:** plans/260305-1043-utilities-page/
**Status:** Plan Complete (Revised for Database-First)

## Summary

Created comprehensive implementation plan for `/tienich` (utilities) page with feng shui calculators using **database-first architecture** (NOT v1 API calls).

## Key Decisions

1. **Data Source**: PostgreSQL via Drizzle ORM (NOT v1 API)
2. **Form Configs**: Hardcoded in TypeScript (NOT fetched from API)
3. **AI Calculation**: External API at `resan8n.ecrm.vn` (unchanged)
4. **Architecture**: Astro Islands pattern - static shell with React islands
5. **Comparison page**: Left unchanged (already exists at `/tienich/so-sanh`)

## Data Sources (REVISED)

| Data | V1 Approach | V2 Approach |
|------|-------------|-------------|
| Utilities list | API call | PostgreSQL `news` table |
| Form configs | API call | Hardcoded `form-configs.ts` |
| AI calculation | External API | External API (same) |

## Files to Create

```
src/
├── pages/tienich/
│   ├── index.astro           # Redirect to first utility
│   └── [slug].astro          # Dynamic utility page
├── components/utility/
│   ├── utility-sidebar.astro # Navigation menu
│   ├── utility-form.tsx      # React form component
│   └── utility-result.tsx    # Result display
└── services/utility/
    ├── types.ts              # TypeScript interfaces
    ├── form-configs.ts       # HARDCODED form configurations (NEW)
    ├── utility-service.ts    # Database queries + AI API
    └── index.ts              # Barrel export
```

## Phase Breakdown

| Phase | Description | Effort |
|-------|-------------|--------|
| 1 | Service layer (DB + hardcoded configs) | 1.5h |
| 2 | Sidebar component | 0.5h |
| 3 | Dynamic form (React) | 2h |
| 4 | Result component | 1h |
| 5 | Page routes | 1.5h |
| 6 | Testing + polish | 1.5h |
| **Total** | | **8h** |

## Database Schema (Used)

```sql
-- Query utilities from news table
SELECT n.id, n.name, n.description, n.avatar
FROM news n
JOIN folder f ON n.folder = f.id
WHERE f.name = 'tien-ich-tong-kho'
  AND n.aactive = true
ORDER BY n.display_order;
```

## 4 Utility Types (Hardcoded Forms)

| Type | Title | Key Fields |
|------|-------|------------|
| `HouseConstructionAgeCheck` | Tư vấn tuổi xây nhà | ownerBirthYear, expectedStartYear, gender |
| `FengShuiDirectionAdvisor` | Tư vấn hướng nhà | ownerBirthYear, houseFacing, gender |
| `ColorAdvisor` | Tư vấn màu sắc phong thủy | ownerBirthYear, gender |
| `OfficeFengShui` | Tư vấn phong thủy văn phòng | ownerBirthYear, gender |

## AI API Endpoint

```
POST https://resan8n.ecrm.vn/webhook/tkbds-app/ai
Headers:
  x-api-key: C2fvbErrov102oUer0
  Content-Type: application/json
```

## Risks Identified

| Risk | Mitigation |
|------|------------|
| DB unavailable | Fallback to hardcoded comparison utility |
| AI API down | Show error with retry button |
| Form/AI mismatch | Keep form-configs.ts in sync with API requirements |

## Success Criteria

- [ ] Query `news` table for utilities list
- [ ] Hardcode form configs in TypeScript
- [ ] Call external AI API for calculations
- [ ] All 4 feng shui calculators working
- [ ] Form validation (required, min/max)
- [ ] Loading + error states
- [ ] Sidebar with active state
- [ ] Mobile responsive
- [ ] v1 URL compatibility

## Unresolved Questions

None - all requirements clear from v1 analysis and user clarification.

## Next Steps

1. Implementer should start with Phase 1 (service layer)
2. Verify database has `tien-ich-tong-kho` folder with utility records
3. Test AI API connectivity before building components
4. Use existing comparison page as styling reference
