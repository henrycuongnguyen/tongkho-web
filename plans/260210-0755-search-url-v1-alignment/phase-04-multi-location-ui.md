# Phase 4: Multi-Location Selection UI

**Priority:** Medium
**Status:** Pending
**Depends On:** Phase 1, Phase 2

## Context

Add UI to support multi-location selection, matching v1 behavior where users can select multiple districts/provinces.

**v1 Behavior:**
- Click location dropdown → shows districts list
- Select multiple districts (checkboxes)
- First selected → URL path
- Rest → `addresses` query param
- Display: "Đã chọn X địa điểm" when multiple

**Current v2:**
- Single location only via dropdown
- No multi-selection support

## UI Requirements

### Location Dropdown Enhancement

1. **Multi-select mode:**
   - Change from radio buttons to checkboxes
   - Allow selecting multiple districts
   - Show count when multiple selected
   - Clear all button

2. **Display format:**
   - Single selection: Show location name
   - Multiple selections: "Đã chọn {count} địa điểm"

3. **Selection state:**
   - Checkboxes for each district
   - Visual feedback for selected items
   - "Select All" / "Clear All" buttons

## Implementation Steps

### 1. Update Location Dropdown Component

**File:** `src/components/ui/location-dropdown.astro` (or similar)

Add multi-select support:

```html
<div class="location-dropdown">
  <button class="dropdown-trigger" id="location-trigger">
    <span class="selected-text">Toàn quốc</span>
    <i class="icon-chevron-down"></i>
  </button>

  <div class="dropdown-panel" id="location-panel">
    <!-- Province selector -->
    <div class="province-section">
      <label for="province-select">Tỉnh/Thành phố:</label>
      <select id="province-select">
        <option value="">Chọn tỉnh/thành phố</option>
        <!-- Provinces from API -->
      </select>
    </div>

    <!-- District checkboxes -->
    <div class="district-section">
      <div class="section-header">
        <span>Quận/Huyện:</span>
        <div class="actions">
          <button class="btn-select-all">Chọn tất cả</button>
          <button class="btn-clear-all">Bỏ chọn</button>
        </div>
      </div>

      <div class="district-list" id="district-list">
        <!-- Loaded via HTMX or fetch when province selected -->
        <label class="district-item">
          <input
            type="checkbox"
            name="districts[]"
            value="ba-dinh"
            data-slug="quan-ba-dinh-thanh-pho-ha-noi"
            data-name="Quận Ba Đình"
          >
          <span>Quận Ba Đình</span>
        </label>
        <!-- More districts... -->
      </div>
    </div>

    <!-- Selected count -->
    <div class="selected-count">
      <span id="selected-count-text">0 địa điểm</span>
    </div>

    <!-- Action buttons -->
    <div class="dropdown-actions">
      <button class="btn btn-primary" id="apply-location">Áp dụng</button>
      <button class="btn btn-secondary" id="cancel-location">Hủy</button>
    </div>
  </div>
</div>
```

### 2. Add Multi-Select Logic

```typescript
class LocationMultiSelector {
  private selectedSlugs: Set<string> = new Set();
  private districtData: Map<string, { slug: string; name: string }> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    // Province change handler
    const provinceSelect = document.getElementById('province-select') as HTMLSelectElement;
    provinceSelect?.addEventListener('change', () => {
      this.loadDistricts(provinceSelect.value);
    });

    // District checkbox change
    document.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.name === 'districts[]') {
        this.updateSelection();
      }
    });

    // Select all / Clear all
    document.querySelector('.btn-select-all')?.addEventListener('click', () => {
      this.selectAll();
    });

    document.querySelector('.btn-clear-all')?.addEventListener('click', () => {
      this.clearAll();
    });

    // Apply button
    document.getElementById('apply-location')?.addEventListener('click', () => {
      this.applySelection();
    });
  }

  private async loadDistricts(provinceSlug: string) {
    if (!provinceSlug) {
      this.clearDistrictList();
      return;
    }

    // Fetch districts via API
    const response = await fetch(`/api/location/districts?province=${provinceSlug}`);
    const html = await response.text();

    const districtList = document.getElementById('district-list');
    if (districtList) {
      districtList.innerHTML = html;
    }

    // Update district data map
    this.updateDistrictDataMap();
  }

  private updateDistrictDataMap() {
    const checkboxes = document.querySelectorAll<HTMLInputElement>('input[name="districts[]"]');
    this.districtData.clear();

    checkboxes.forEach(cb => {
      const slug = cb.dataset.slug || cb.value;
      const name = cb.dataset.name || '';
      this.districtData.set(slug, { slug, name });
    });
  }

  private updateSelection() {
    const checkboxes = document.querySelectorAll<HTMLInputElement>('input[name="districts[]"]:checked');
    this.selectedSlugs.clear();

    checkboxes.forEach(cb => {
      const slug = cb.dataset.slug || cb.value;
      this.selectedSlugs.add(slug);
    });

    this.updateDisplay();
  }

  private updateDisplay() {
    const count = this.selectedSlugs.size;
    const countText = document.getElementById('selected-count-text');
    const triggerText = document.querySelector('.selected-text');

    if (count === 0) {
      if (countText) countText.textContent = '0 địa điểm';
      if (triggerText) triggerText.textContent = 'Toàn quốc';
    } else if (count === 1) {
      const slug = Array.from(this.selectedSlugs)[0];
      const data = this.districtData.get(slug);
      if (countText) countText.textContent = '1 địa điểm';
      if (triggerText) triggerText.textContent = data?.name || slug;
    } else {
      if (countText) countText.textContent = `${count} địa điểm`;
      if (triggerText) triggerText.textContent = `Đã chọn ${count} địa điểm`;
    }
  }

  private selectAll() {
    const checkboxes = document.querySelectorAll<HTMLInputElement>('input[name="districts[]"]');
    checkboxes.forEach(cb => {
      cb.checked = true;
    });
    this.updateSelection();
  }

  private clearAll() {
    const checkboxes = document.querySelectorAll<HTMLInputElement>('input[name="districts[]"]');
    checkboxes.forEach(cb => {
      cb.checked = false;
    });
    this.updateSelection();
  }

  private clearDistrictList() {
    const districtList = document.getElementById('district-list');
    if (districtList) {
      districtList.innerHTML = '<p class="text-muted">Chọn tỉnh/thành phố để xem quận/huyện</p>';
    }
    this.selectedSlugs.clear();
    this.districtData.clear();
    this.updateDisplay();
  }

  private applySelection() {
    // Update hidden input with selected slugs
    const selectedAddresses = Array.from(this.selectedSlugs).join(',');
    const hiddenInput = document.querySelector('.location-slug-input') as HTMLInputElement;
    if (hiddenInput) {
      hiddenInput.value = selectedAddresses;
    }

    // Close dropdown
    this.closeDropdown();

    // Trigger search if on listing page
    // Or wait for user to click search button
  }

  private closeDropdown() {
    const panel = document.getElementById('location-panel');
    if (panel) {
      panel.classList.remove('show');
    }
  }

  public getSelectedSlugs(): string[] {
    return Array.from(this.selectedSlugs);
  }
}

// Initialize
const locationSelector = new LocationMultiSelector();
```

### 3. Update District API Response

**File:** `src/pages/api/location/districts.ts`

Add checkbox structure instead of links:

```typescript
// Current: Returns district links
// Change to: Return district checkboxes

const html = districts.map(district => `
  <label class="district-item">
    <input
      type="checkbox"
      name="districts[]"
      value="${district.nSlug}"
      data-slug="${district.nSlugV1 || district.nSlug}"
      data-name="${district.nName}"
      ${isSelected(district.nSlug) ? 'checked' : ''}
    >
    <span>${district.nName}</span>
  </label>
`).join('');
```

### 4. Integrate with Search Forms

Update hero search and listing search to use multi-location:

```typescript
// In search submit handler
const locationSelector = new LocationMultiSelector();
const selectedSlugs = locationSelector.getSelectedSlugs();

const filters: SearchFilters = {
  // ... other filters
  selectedAddresses: selectedSlugs.join(','),
};
```

## Styling

```css
.location-dropdown {
  position: relative;
}

.dropdown-panel {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  width: 400px;
  max-height: 500px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 1000;
}

.dropdown-panel.show {
  display: block;
}

.district-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
}

.district-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
}

.district-item:hover {
  background-color: #f5f5f5;
}

.district-item input[type="checkbox"] {
  margin: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.selected-count {
  padding: 10px;
  border-top: 1px solid #eee;
  text-align: center;
  font-weight: 600;
}

.dropdown-actions {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-top: 1px solid #eee;
}

.dropdown-actions button {
  flex: 1;
}
```

## Testing

### Manual Test Cases

1. **Single district selection:**
   - Select "Hà Nội" province
   - Check "Ba Đình" district
   - Click "Áp dụng"
   - Expected: Trigger shows "Quận Ba Đình"
   - Search URL: `/mua-ban/quan-ba-dinh-thanh-pho-ha-noi`

2. **Multiple districts:**
   - Select "Hà Nội"
   - Check "Ba Đình", "Tây Hồ", "Hoàn Kiếm"
   - Click "Áp dụng"
   - Expected: Trigger shows "Đã chọn 3 địa điểm"
   - Search URL: `/mua-ban/quan-ba-dinh-thanh-pho-ha-noi?addresses=quan-tay-ho,quan-hoan-kiem`

3. **Select All:**
   - Select "Hà Nội"
   - Click "Chọn tất cả"
   - Expected: All districts checked

4. **Clear All:**
   - Have selections
   - Click "Bỏ chọn"
   - Expected: All unchecked

5. **Province change:**
   - Select districts in "Hà Nội"
   - Change to "TP. HCM"
   - Expected: District list reloads, previous selections cleared

## Files to Create

- `src/components/ui/location-multi-selector.astro` - New component

## Files to Modify

- `src/components/ui/location-dropdown.astro` - Add multi-select mode
- `src/pages/api/location/districts.ts` - Return checkboxes

## Success Criteria

- ✅ Users can select multiple locations
- ✅ First location → URL path
- ✅ Additional locations → addresses param
- ✅ Visual feedback for selections
- ✅ "Đã chọn X địa điểm" display
- ✅ Select All / Clear All works

## Next Phase

Phase 5: Testing & validation
