# Phase 9: Quick Contact Banner

## Context Links
- **Plan:** [plan.md](./plan.md)
- **V1 Reference:** `reference/resaland_v1/views/bds/components/seller_contact.html`
- **Previous Phase:** [Phase 8: Sidebar Structure](./phase-08-sidebar-structure-layout.md)

## Overview
**Priority:** Medium
**Status:** Pending
**Dependencies:** Phase 8 (Sidebar Layout)

Implement quick contact banner in sidebar with email, phone, Zalo button, and call now button.

## Key Insights

From v1 analysis:
- Contact info loaded via AJAX (`load_seller_contact.load`)
- Shows phone number with `tel:` link
- Shows email with `mailto:` link
- "Gọi ngay" (Call now) button with phone icon
- "Nhắn tin" (Zalo) button with Zalo icon and deep link
- Auth check: Show "Đăng nhập" if user not authenticated
- Avatar/logo display for brand identity

## Requirements

### Functional Requirements
- Display contact email and phone number
- "Gọi ngay" button with `tel:` protocol
- "Nhắn tin qua Zalo" button with Zalo deep link format: `https://zalo.me/{phone_number}`
- Show auth prompt if user not logged in (optional for v2)
- Load contact data from site settings/config

### Non-functional Requirements
- Click-to-call functionality on mobile
- Zalo deep link opens Zalo app (mobile) or web (desktop)
- Fast loading (<100ms)
- Responsive design (mobile + desktop)

## Architecture

```typescript
// src/components/listing/sidebar/quick-contact-banner.tsx (React island)
interface ContactBannerProps {
  email: string;
  phone: string;
  zaloPhone?: string; // Optional Zalo number (if different)
  companyName: string;
  logoUrl?: string;
}

// Data source: Site settings or environment variables
// - SITE_CONTACT_EMAIL
// - SITE_CONTACT_PHONE
// - SITE_CONTACT_ZALO
```

## Related Code Files

### Files to Create
- `src/components/listing/sidebar/quick-contact-banner.tsx` - Contact banner UI
- `src/utils/contact-helper.ts` - Contact link formatters (tel:, mailto:, zalo.me)

### Files to Modify
- `src/pages/[...slug].astro` - Add QuickContactBanner to sidebar slot
- `.env` - Add contact info environment variables

## Implementation Steps

1. **Create Contact Helper Utilities**
   ```typescript
   // src/utils/contact-helper.ts
   export const formatPhoneLink = (phone: string) => `tel:${phone}`;
   export const formatEmailLink = (email: string) => `mailto:${email}`;
   export const formatZaloLink = (phone: string) => `https://zalo.me/${phone.replace(/[^0-9]/g, '')}`;
   ```

2. **Create Quick Contact Banner Component**
   ```tsx
   // src/components/listing/sidebar/quick-contact-banner.tsx
   - Display company name/logo
   - Show phone with icon + link
   - Show email with icon + link
   - Add "Gọi ngay" button (primary CTA)
   - Add "Nhắn tin" button with Zalo icon
   - Responsive layout (stack on mobile)
   ```

3. **Add Contact Data to Environment**
   ```env
   # .env
   SITE_CONTACT_EMAIL=contact@tongkhobds.com
   SITE_CONTACT_PHONE=0123456789
   SITE_CONTACT_ZALO=0123456789
   SITE_COMPANY_NAME=TongkhoBDS.com
   ```

4. **Integrate into Listing Page**
   ```astro
   // src/pages/[...slug].astro
   <ListingWithSidebarLayout>
     <div slot="sidebar">
       <QuickContactBanner
         email={import.meta.env.SITE_CONTACT_EMAIL}
         phone={import.meta.env.SITE_CONTACT_PHONE}
         zaloPhone={import.meta.env.SITE_CONTACT_ZALO}
         companyName={import.meta.env.SITE_COMPANY_NAME}
       />
     </div>
   </ListingWithSidebarLayout>
   ```

## Todo List

- [ ] Create `contact-helper.ts` with link formatters
- [ ] Create `quick-contact-banner.tsx` component
- [ ] Add contact info to `.env` file
- [ ] Add SVG icons for phone, email, Zalo
- [ ] Style component (Tailwind CSS)
- [ ] Test `tel:` link on mobile
- [ ] Test `mailto:` link opens email client
- [ ] Test Zalo deep link (mobile + desktop)
- [ ] Add hover/active states for buttons
- [ ] Verify responsive layout

## Success Criteria

- ✅ Contact banner displays at top of sidebar
- ✅ Email link opens default email client
- ✅ Phone link initiates call on mobile
- ✅ "Gọi ngay" button triggers phone call
- ✅ "Nhắn tin" button opens Zalo app (mobile) or web (desktop)
- ✅ Responsive: Buttons stack vertically on mobile
- ✅ Icons display correctly (phone, email, Zalo)
- ✅ No CLS (Cumulative Layout Shift)

## Risk Assessment

**Low Risk:**
- Simple UI component
- Standard web protocols (`tel:`, `mailto:`)
- Zalo deep link well-documented

**Potential Issues:**
- Zalo deep link may not work on all browsers (fallback to phone call)
- Some email clients may block `mailto:` links (user can copy email)

**Mitigation:**
- Test Zalo link on iOS Safari, Android Chrome, Desktop browsers
- Add fallback: Copy phone number button
- Add tooltip: "Nhấn để sao chép" on long-press

## Security Considerations

- **Email Harvesting:** Email visible in DOM (acceptable for contact info)
- **Phone Spam:** Phone visible in DOM (acceptable for business contact)
- **No User Input:** No XSS risk in this component

**Mitigation:**
- Consider obfuscating email/phone with JS (optional)
- Add honeypot field if adding contact form later

## Next Steps

After contact banner is complete:
- **Phase 10:** Implement Price Range Filter Card
- **Phase 11:** Implement Area Filter Card
- **Phase 12:** Implement Ward/Commune List by District
