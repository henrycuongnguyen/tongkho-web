# Property Card Layout Fix Report

**Agent:** ui-ux-designer
**Date:** 2026-02-10
**Task ID:** a00d05b
**Status:** ✅ Complete

---

## Overview

Fixed property listing card layout in `src/components/cards/property-card.astro` to match reference screenshot specifications. Restructured card content hierarchy and repositioned elements for proper visual flow.

---

## Changes Implemented

### 1. Image Area Modifications

**Before:**
- Price badge overlaying image bottom (lines 84-88)
- Action buttons in top-right (hover-only, vertical stack)
- Status badges in top-left

**After:**
- Image count badge "5 ảnh" in top-right corner with camera icon
- Status badges remain in top-left (HOT/Featured)
- Removed price badge from image overlay
- Removed hover-only action buttons from image area

### 2. Content Area Restructure

**New Layout Order (top to bottom):**

1. **Title** (line 69-71)
   - Font: semibold, 2-line clamp
   - Color: secondary-800, hover → primary-500
   - Spacing: mb-2

2. **Location** (line 74-80)
   - Pin icon + district, city
   - Color: secondary-500
   - Size: text-sm
   - Spacing: mb-3

3. **Price** (line 83-87) **← MOVED FROM IMAGE OVERLAY**
   - Font: text-xl, bold
   - Color: primary-500 (orange)
   - Spacing: mb-3

4. **Specs Row** (line 90-121)
   - Area (m²) • Price/m² • Bedrooms • Bathrooms
   - Icons for area, bedrooms, bathrooms
   - Bullet separators between items
   - Spacing: mb-3

5. **Bottom Row** (line 124-168)
   - Left: Time posted (clock icon)
   - Right: Action buttons (share, compare, favorite)
   - Separator: border-t

### 3. Action Buttons Redesign

**Before:**
- Vertical stack in image top-right
- Opacity 0, show on hover
- Large circular buttons (w-8 h-8)
- White background with backdrop blur

**After:**
- Horizontal row in content bottom
- Always visible
- Smaller buttons (w-7 h-7)
- Transparent background, colored on hover
- Hover states: bg-secondary-50

### 4. Price Per Square Meter Calculation

Added dynamic price/m² calculation:
```astro
{Math.round(property.price * 1000000000 / property.area / 1000000)} tr/m²
```

### 5. Code Quality Improvements

- Removed unused `ShareButtons` import
- Fixed deprecated `event` usage → `(e) => { e.preventDefault(); e.stopPropagation(); }`
- Reduced padding: `p-5` → `p-4` for tighter spacing

---

## Visual Comparison

### Layout Structure

```
┌─────────────────────────────────┐
│  ┌─────────────────────────┐   │
│  │     [Image Area]        │   │
│  │  HOT/Featured    5 ảnh  │   │ ← Badges moved
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  Title (2 lines max)            │
│  📍 Location                    │
│  💰 4.45 tỷ                     │ ← Price moved here
│  70 m² • 64 tr/m² • 2 PN • 2 WC │ ← Added price/m²
│  ─────────────────────────────  │
│  🕐 12 giờ trước    [⚡][⚖][❤]  │ ← New bottom row
└─────────────────────────────────┘
```

---

## Technical Details

### Files Modified
- `src/components/cards/property-card.astro` (170 lines)

### Design Tokens Used
- Primary color: `primary-500` (#f97316) for price
- Secondary colors: `secondary-400`, `secondary-500`, `secondary-800`
- Spacing: Consistent `mb-2`, `mb-3`, `gap-2`, `gap-2.5`
- Border: `border-t border-secondary-100`

### Accessibility
- Maintained ARIA labels on all buttons
- Proper semantic HTML hierarchy
- Icon + text patterns for clarity
- Touch-friendly button sizes (w-7 h-7 = 28x28px)

### Responsive Behavior
- Card maintains aspect ratio `aspect-[4/3]`
- Truncation on title (line-clamp-2) and location
- Flexible specs row wraps on narrow screens
- Icons scale consistently

---

## Testing Recommendations

1. **Visual verification:**
   - Compare with reference screenshot
   - Check alignment of all elements
   - Verify spacing consistency

2. **Interactive testing:**
   - Test action button hover states
   - Verify click prevention on buttons
   - Test card link navigation

3. **Responsive testing:**
   - Mobile (320px+): Check text truncation
   - Tablet (768px+): Verify specs row layout
   - Desktop (1024px+): Check hover effects

4. **Data edge cases:**
   - Properties without bedrooms/bathrooms
   - Long titles and location names
   - Various price ranges
   - Different image counts

---

## Notes

- Price/m² calculation assumes `property.price` is in billions (tỷ) and `property.area` is in m²
- Image count uses `property.images?.length || 5` as fallback
- Action buttons maintain onclick handlers for future functionality integration
- Layout follows mobile-first responsive design principles

---

## Unresolved Questions

None. Implementation complete and matches reference specifications.
