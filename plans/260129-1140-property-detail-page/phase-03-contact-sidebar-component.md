# Phase 3: Contact Sidebar Component

## Context
- Work dir: `d:\BDS\tongkho-web`
- Sticky sidebar for contact info

## Overview
- **Priority:** High
- **Status:** Completed
- **Output:** `src/components/property/contact-sidebar.astro`

## Requirements
1. Agent/Owner info card
2. Phone number with "Gọi ngay" CTA button
3. Zalo contact button
4. Message/inquiry form (optional for v1)
5. Sticky positioning on scroll
6. Mobile: fixed bottom bar instead of sidebar

## Implementation Steps
1. Create `contact-sidebar.astro`
2. Props: optional contact info (use defaults for mock)
3. Create CTA buttons with icons
4. Add sticky positioning
5. Mobile-responsive: bottom bar

## Component Structure
```astro
---
interface Props {
  phone?: string;
  agentName?: string;
  agentAvatar?: string;
}
const {
  phone = "0987654321",
  agentName = "TongkhoBDS",
  agentAvatar
} = Astro.props;
---
<aside class="contact-sidebar sticky top-24">
  <div class="agent-card">...</div>
  <div class="cta-buttons">
    <a href="tel:..." class="btn-call">Gọi ngay</a>
    <a href="https://zalo.me/..." class="btn-zalo">Zalo</a>
  </div>
</aside>
```

## Styling
- Card: bg-white rounded-xl shadow-lg p-6
- Call button: bg-primary-500 text-white
- Zalo button: bg-blue-500 text-white
- Sticky: sticky top-24

## Mobile Adaptation
- Hide sidebar on mobile
- Show fixed bottom bar with call/zalo buttons

## Success Criteria
- [x] Contact card displays correctly
- [x] CTA buttons are prominent and clickable
- [x] Sticky on desktop scroll
- [x] Mobile bottom bar works
- [x] Phone link is tel: protocol
