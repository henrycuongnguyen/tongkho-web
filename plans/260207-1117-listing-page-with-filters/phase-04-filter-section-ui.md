# Phase 4: Filter Section UI

## Context
[← Back to Plan](./plan.md)

Build filter UI with property types, price, area, locations, and advanced filters. Replicate v1 functionality with React components.

## Priority
**MEDIUM** - UI Layer (depends on Phase 2 location data)

## Status
**Pending**

## Overview
Create interactive filter components that update URL and trigger server-side re-render. Match v1 design and UX.

## Filter Components

### 1. Main Filters
- **Loại hình** (Property Types) - Multi-select checkboxes
- **Mức giá** (Price Range) - Slider + predefined ranges
- **Diện tích** (Area Range) - Input fields
- **Địa điểm** (Location) - Multi-select provinces/districts

### 2. Advanced Filters (Collapsible)
- **Số phòng ngủ** (Bedrooms) - 1-5+
- **Số phòng tắm** (Bathrooms) - 1-5+
- **Bán kính** (Radius) - 5, 10, 50, 100 km

### 3. Action Buttons
- **Áp dụng** - Apply filters (navigate to new URL)
- **Xóa bộ lọc** - Clear all filters

## Implementation

See detailed implementation in plan file for:
- React components structure
- Filter state management
- URL synchronization
- Mobile responsive design
- Price/area range data by transaction type

## Todo List

- [ ] Create base filter layout component
- [ ] Implement property type filter (checkboxes)
- [ ] Implement price range filter (slider + radio)
- [ ] Implement area range filter (inputs)
- [ ] Implement location multi-select
- [ ] Implement advanced filters panel
- [ ] Add "Áp dụng" / "Xóa bộ lọc" buttons
- [ ] Sync filters with URL
- [ ] Mobile responsive styling
- [ ] Test all filter combinations

## Success Criteria

- [ ] All filters functional
- [ ] URL updates on apply
- [ ] Clear filters resets URL
- [ ] Mobile responsive
- [ ] Matches v1 design

## Next Steps

→ **Phase 6:** Listing Section & Pagination
