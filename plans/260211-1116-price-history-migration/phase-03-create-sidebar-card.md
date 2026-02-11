# Phase 3: Create Listing Page Section Component

<!-- Updated: Validation Session 1 - Changed from sidebar card to listing page section -->

## Context Links

- [Phase 2: Data Service](./phase-02-create-data-service.md)
- [Existing Chart Component](../src/components/property/price-history-chart.astro)
- [Card Pattern Reference](../src/components/listing/sidebar/price-range-filter-card.astro)
- [Plan Overview](./plan.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-11 |
| Priority | P2 |
| Status | pending |
| Effort | 1.5h |
| Description | Create PriceHistorySection listing page component |

## Key Insights

<!-- Updated: Validation Session 1 - Component location changed to listing page section -->

1. **Section Pattern**: Full-width section in listing page main content area (not sidebar)
2. **Existing Chart**: price-history-chart.astro (182 lines) exists for detail pages
3. **New Component**: Create separate listing-specific section component
4. **Height**: Can use taller chart (h-64 or h-80) since not constrained by sidebar
5. **Script Pattern**: Use `<script is:inline>` for Chart.js initialization

## Requirements

### Functional Requirements

1. **FR-01**: Display Chart.js line chart with price history
2. **FR-02**: Toggle between 2-year and 5-year views
3. **FR-03**: Show current price reference
4. **FR-04**: Show price change percentage with trend indicator
5. **FR-05**: Include disclaimer text

### Non-Functional Requirements

1. **NFR-01**: Match sidebar card styling pattern
2. **NFR-02**: Chart height max 192px (h-48)
3. **NFR-03**: Responsive to container width
4. **NFR-04**: TypeScript Props interface
5. **NFR-05**: Use existing Chart.js CDN

## Architecture

### Component Structure

```
price-history-card.astro
├── Frontmatter (Props, imports, data prep)
├── Card container (.bg-white.rounded-lg...)
│   ├── Header (title + period toggle)
│   ├── Price info row (current price + change %)
│   ├── Chart container (h-48)
│   └── Disclaimer text
├── Chart.js CDN script
└── Inline script (chart init + toggle logic)
```

### Props Interface

```typescript
interface Props {
  samplePrice?: number;      // Default: 3 (billion = 3 tỷ)
  priceUnit?: 'billion' | 'million';  // Default: 'billion'
}
```

### Data Flow

```
Props (samplePrice)
  └─ generatePriceHistory(2, samplePrice) → twoYearData
  └─ generatePriceHistory(5, samplePrice) → fiveYearData
  └─ JSON.stringify → data-chart attribute
  └─ Client-side Chart.js reads data-chart
```

## Related Code Files

### To Create

1. **`src/components/listing/sidebar/price-history-card.astro`** (~150 lines)
   - New sidebar card for price history

### Reference Files

1. `src/components/property/price-history-chart.astro` - Chart logic source
2. `src/components/listing/sidebar/price-range-filter-card.astro` - Card styling

## Implementation Steps

### Step 1: Create Component File

Create `src/components/listing/sidebar/price-history-card.astro`:

```astro
---
/**
 * Price History Card
 * Sidebar widget showing price trend chart with 2yr/5yr toggle
 */
import {
  generatePriceHistory,
  calculatePriceChange,
  formatPriceUnitLabel,
} from '@/utils/price-history-utils';

interface Props {
  samplePrice?: number;
  priceUnit?: 'billion' | 'million';
}

const { samplePrice = 3, priceUnit = 'billion' } = Astro.props;

// Generate chart data
const twoYearData = generatePriceHistory(2, samplePrice);
const fiveYearData = generatePriceHistory(5, samplePrice);
const unitLabel = formatPriceUnitLabel(priceUnit);

// Calculate change percentage (2-year)
const changePercent = calculatePriceChange(
  twoYearData.data[0],
  twoYearData.data[twoYearData.data.length - 1]
);
const isUp = changePercent >= 0;

// Prepare chart data for client
const chartData = JSON.stringify({
  twoYear: twoYearData,
  fiveYear: fiveYearData,
  unitLabel,
});
---

<div
  class="bg-white rounded-lg shadow-sm border border-secondary-100 p-4"
  id="sidebar-price-chart-container"
  data-chart={chartData}
>
  <!-- Header with toggle -->
  <div class="flex items-center justify-between mb-3">
    <h3 class="font-semibold text-secondary-900 text-base">Biến động giá</h3>
    <div class="flex gap-1" id="sidebar-chart-period-selector">
      <button
        data-period="2year"
        class="period-btn px-2 py-1 text-xs font-medium rounded-md transition-colors bg-primary-500 text-white"
      >
        2 Năm
      </button>
      <button
        data-period="5year"
        class="period-btn px-2 py-1 text-xs font-medium rounded-md transition-colors bg-secondary-100 text-secondary-600 hover:bg-secondary-200"
      >
        5 Năm
      </button>
    </div>
  </div>

  <!-- Price info -->
  <div class="flex items-center justify-between mb-3 text-sm">
    <div class="flex items-center gap-1">
      <span class="text-secondary-500">Giá tham khảo:</span>
      <span class="font-semibold text-primary-500">
        {samplePrice} {unitLabel}
      </span>
    </div>
    <div class="flex items-center gap-1" id="sidebar-price-change">
      <span class="text-secondary-500">Thay đổi:</span>
      <span class:list={['font-semibold', isUp ? 'text-green-500' : 'text-red-500']}>
        {isUp ? '+' : ''}{changePercent.toFixed(1)}% {isUp ? '↑' : '↓'}
      </span>
    </div>
  </div>

  <!-- Chart -->
  <div class="relative h-48">
    <canvas id="sidebar-price-history-chart"></canvas>
  </div>

  <!-- Disclaimer -->
  <p class="text-xs text-secondary-400 mt-2 italic">
    * Dữ liệu tham khảo dựa trên biến động thị trường khu vực
  </p>
</div>

<script is:inline src="/js/chart.umd.min.js"></script>

<script is:inline>
(function() {
  var container = document.getElementById('sidebar-price-chart-container');
  if (!container) return;

  var data = JSON.parse(container.getAttribute('data-chart'));
  var ctx = document.getElementById('sidebar-price-history-chart');
  var priceChangeEl = document.getElementById('sidebar-price-change');
  var periodSelector = document.getElementById('sidebar-chart-period-selector');
  var unitLabel = data.unitLabel;

  if (!ctx) return;

  var chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.twoYear.labels,
      datasets: [{
        label: 'Giá (' + unitLabel + ')',
        data: data.twoYear.data,
        borderColor: '#F97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#F97316',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 8,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return context.parsed.y.toFixed(2) + ' ' + unitLabel;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxTicksLimit: 4, color: '#9CA3AF', font: { size: 10 } }
        },
        y: {
          grid: { color: 'rgba(156, 163, 175, 0.2)' },
          ticks: {
            callback: function(value) { return value + ' ' + unitLabel; },
            color: '#9CA3AF',
            font: { size: 10 }
          }
        }
      }
    }
  });

  function updatePriceChange(chartData) {
    if (!priceChangeEl) return;
    var startPrice = chartData.data[0];
    var endPrice = chartData.data[chartData.data.length - 1];
    var change = endPrice - startPrice;
    var changePercent = ((change / startPrice) * 100).toFixed(1);
    var isUp = change >= 0;
    priceChangeEl.innerHTML =
      '<span class="text-secondary-500">Thay đổi:</span>' +
      '<span class="font-semibold ' + (isUp ? 'text-green-500' : 'text-red-500') + '">' +
      (isUp ? '+' : '') + changePercent + '% ' + (isUp ? '↑' : '↓') + '</span>';
  }

  if (!periodSelector) return;

  var buttons = periodSelector.querySelectorAll('.period-btn');
  buttons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var period = btn.getAttribute('data-period');
      var chartData = period === '2year' ? data.twoYear : data.fiveYear;

      buttons.forEach(function(b) {
        b.classList.remove('bg-primary-500', 'text-white');
        b.classList.add('bg-secondary-100', 'text-secondary-600', 'hover:bg-secondary-200');
      });
      btn.classList.remove('bg-secondary-100', 'text-secondary-600', 'hover:bg-secondary-200');
      btn.classList.add('bg-primary-500', 'text-white');

      chart.data.labels = chartData.labels;
      chart.data.datasets[0].data = chartData.data;
      chart.update('active');
      updatePriceChange(chartData);
    });
  });
})();
</script>
```

### Step 2: Verify Chart.js CDN

Confirm `/js/chart.umd.min.js` exists in `public/js/` directory.

### Step 3: Test Standalone

Temporarily add to sidebar-wrapper.astro for quick test:

```astro
import PriceHistoryCard from './price-history-card.astro';
// ... in template
<PriceHistoryCard samplePrice={3} priceUnit="billion" />
```

## Todo List

- [ ] Create `src/components/listing/sidebar/price-history-card.astro`
- [ ] Import utility functions from phase-02
- [ ] Set up Props interface
- [ ] Implement header with period toggle
- [ ] Implement price info row
- [ ] Implement Chart.js canvas
- [ ] Add disclaimer text
- [ ] Add Chart.js script import
- [ ] Implement inline script for chart init
- [ ] Implement period toggle logic
- [ ] Test chart rendering
- [ ] Verify responsive behavior

## Success Criteria

- [ ] Component renders without errors
- [ ] Chart displays correctly
- [ ] 2yr/5yr toggle switches data
- [ ] Price change updates on toggle
- [ ] Styling matches sidebar pattern
- [ ] TypeScript passes

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Chart.js ID conflict | Medium | Medium | Use unique ID prefix "sidebar-" |
| Script execution order | Low | High | Use IIFE wrapper |
| Mobile chart touch | Low | Low | Chart.js handles |

## Security Considerations

- No user input
- No external API calls
- Static mock data only
- CDN script already trusted

## Next Steps

→ [Phase 4: Integrate Listing Page](./phase-04-integrate-listing-page.md)
