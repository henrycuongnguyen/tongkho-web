# Phase 7: Interactive Features

## Context
[← Back to Plan](./plan.md)

Add client-side interactive features: favorites, compare, and share.

## Priority
**LOW** - Enhancement (requires user auth)

## Status
**Pending**

## Features

### 1. Favorite Button
- Heart icon on property card
- Click to save to favorites
- Check if user logged in → show login modal if not
- Store favorites in database
- Visual indicator for saved properties

### 2. Compare Button
- Checkbox to add property to comparison list
- Show "Compare (3)" floating button when properties selected
- Navigate to comparison page
- Store comparison list in localStorage

### 3. Share Button
- Modal with sharing options:
  - Facebook
  - Zalo
  - Copy link
- Social share URLs
- Copy to clipboard functionality

## Implementation Outline

```typescript
// src/components/listing/property-actions.tsx
import { useState } from 'react';

interface Props {
  propertyId: number;
  propertySlug: string;
  propertyTitle: string;
}

export function PropertyActions({ propertyId, propertySlug, propertyTitle }: Props) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isComparing, setIsComparing] = useState(false);

  const handleFavoriteClick = async () => {
    // Check if logged in
    if (!isLoggedIn()) {
      showLoginModal();
      return;
    }

    // Toggle favorite
    const success = await toggleFavorite(propertyId);
    if (success) {
      setIsFavorite(!isFavorite);
    }
  };

  const handleCompareClick = () => {
    const compareList = getCompareList();
    if (isComparing) {
      removeFromCompare(propertyId);
    } else {
      if (compareList.length >= 4) {
        alert('Tối đa 4 BĐS để so sánh');
        return;
      }
      addToCompare({ id: propertyId, slug: propertySlug, title: propertyTitle });
    }
    setIsComparing(!isComparing);
  };

  const handleShareClick = () => {
    showShareModal(propertySlug, propertyTitle);
  };

  return (
    <div className="property-actions">
      <button onClick={handleFavoriteClick} className={isFavorite ? 'active' : ''}>
        ❤️ Yêu thích
      </button>

      <button onClick={handleCompareClick} className={isComparing ? 'active' : ''}>
        ☑️ So sánh
      </button>

      <button onClick={handleShareClick}>
        📤 Chia sẻ
      </button>
    </div>
  );
}
```

## Todo List

- [ ] Create property-actions component
- [ ] Implement favorite button with auth check
- [ ] Implement compare button with localStorage
- [ ] Implement share modal
- [ ] Add social share URLs
- [ ] Add copy link functionality
- [ ] Create compare page
- [ ] Test all interactions
- [ ] Style buttons

## Success Criteria

- [ ] Favorite saves to DB (if logged in)
- [ ] Login modal shows if not authenticated
- [ ] Compare list persists in localStorage
- [ ] Max 4 properties in compare
- [ ] Share modal with social + copy link
- [ ] All interactions work on mobile

## Next Steps

After Phase 7, the listing page is complete!
