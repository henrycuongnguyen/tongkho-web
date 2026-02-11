---
title: "Fix Listing Share & Compare"
description: "Restore share and compare functionality on listing page to match v1 behavior"
status: in-progress
priority: P2
effort: 6h
branch: listing72ui
tags: [listing, share, compare, v2-migration]
created: 2026-02-11
completed_phases: 2
---

# Fix Listing Share & Compare - Implementation Plan

## Overview

V2 listing page has non-functional share/compare buttons in property cards. Need to implement v1-style functionality:
- **Share**: Copy link, Facebook, Zalo, Twitter share popup
- **Compare**: localStorage-based multi-property comparison with floating bar
- **Floating Compare Bar**: Shows selected items, links to /tienich/so-sanh

## Current State (V2)

- `property-card.astro` has share/compare/favorite buttons (lines 131-165)
- Buttons have `onclick="(e) => { e.preventDefault(); e.stopPropagation(); }"` - do nothing
- `share-buttons.astro` exists but not integrated with listing cards
- `listing-property-card.astro` has no action buttons at all

## Target State (V1 Behavior)

1. **Share Button**: Opens popup with Facebook/Zalo/Twitter/Copy links
2. **Compare Button**: Toggles property in localStorage `compare_items`; max 2 items; same transaction type
3. **Floating Compare Bar**: Shows when items added; displays thumbnails; link to compare page

## Phases

| Phase | File | Status | Description |
|-------|------|--------|-------------|
| 1 | [phase-01-share-functionality.md](phase-01-share-functionality.md) | completed | Integrate share popup with listing cards |
| 2 | [phase-02-compare-service.md](phase-02-compare-service.md) | completed | Create client-side compare manager |
| 3 | [phase-03-floating-compare-bar.md](phase-03-floating-compare-bar.md) | pending | Build sticky compare bar component |
| 4 | [phase-04-compare-page.md](phase-04-compare-page.md) | pending | Create /tienich/so-sanh comparison page |

## Key Files

**Modify:**
- `src/components/cards/property-card.astro` - Add share/compare functionality
- `src/components/listing/listing-property-card.astro` - Add action buttons
- `src/layouts/listing-with-sidebar-layout.astro` - Add floating bar

**Create:**
- `src/components/shared/compare-manager.ts` - LocalStorage compare service
- `src/components/shared/floating-compare-bar.astro` - Sticky bar UI
- `src/pages/tienich/so-sanh.astro` - Comparison page

## Dependencies

- V1 API: `GET /api_customer/compare_real_estate.json?id_1=X&id_2=Y`
- localStorage key: `compare_items`
- Max 2 properties; same transaction type required

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Link navigation from card | Use event.stopPropagation on buttons |
| localStorage not available | Graceful fallback; disable compare |
| Different transaction types | Show toast error; reject item |

## Success Criteria

- [ ] Share popup shows on share button click
- [ ] Compare button toggles active state
- [ ] Floating bar appears when properties added
- [ ] Compare page displays side-by-side comparison
- [ ] Same transaction type enforcement works
- [ ] Max 2 properties limit enforced
