# Phase 2: Create Price History Data Service

## Context Links

- [Phase 1: Requirements](./phase-01-analyze-requirements.md)
- [Existing Chart Component](../src/components/property/price-history-chart.astro)
- [Plan Overview](./plan.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-11 |
| Priority | P2 |
| Status | pending |
| Effort | 45m |
| Description | Extract and enhance price history data generation utilities |

## Key Insights

<!-- Updated: Validation Session 1 - Change from mock data to real v1 database integration -->

1. **Data Source Change**: Integration with v1 PostgreSQL price history table (not mock generation)
2. **V1 Schema**: Need to research `price_history` or similar table structure in v1 database
3. **Service Layer**: Create database service to fetch real price history data
4. **Fallback Strategy**: Mock data as fallback if v1 database unavailable
5. **Output Format**: `{ labels: string[], data: number[] }` for Chart.js compatibility

## Requirements

<!-- Updated: Validation Session 1 - Add database integration requirements -->

### Functional Requirements

1. **FR-01**: Fetch real price history from v1 PostgreSQL database
2. **FR-02**: Support 2-year and 5-year period queries
3. **FR-03**: Transform v1 data format to Chart.js format
4. **FR-04**: Calculate price change percentage from real data
5. **FR-05**: Determine trend direction (up/down)
6. **FR-06**: Generate mock fallback data if database unavailable

### Non-Functional Requirements

1. **NFR-01**: Pure functions, no side effects
2. **NFR-02**: TypeScript with strict types
3. **NFR-03**: Unit-testable (future)

## Architecture

### Type Definitions

```typescript
// src/types/price-history.ts (NEW)
export interface PriceHistoryData {
  labels: string[];
  data: number[];
}

export interface PriceHistoryResult {
  twoYear: PriceHistoryData;
  fiveYear: PriceHistoryData;
  changePercent: number;
  trendDirection: 'up' | 'down' | 'stable';
}
```

### Utility Functions

```typescript
// src/utils/price-history-utils.ts (NEW)

/**
 * Generate mock price history data
 * @param years - Number of years (2 or 5)
 * @param currentPrice - Current price point
 * @returns Price history with labels and data arrays
 */
export function generatePriceHistory(
  years: number,
  currentPrice: number
): PriceHistoryData;

/**
 * Calculate price change percentage
 * @param startPrice - Starting price
 * @param endPrice - Ending price
 * @returns Percentage change
 */
export function calculatePriceChange(
  startPrice: number,
  endPrice: number
): number;

/**
 * Get trend direction
 * @param changePercent - Price change percentage
 * @returns 'up' | 'down' | 'stable'
 */
export function getTrendDirection(
  changePercent: number
): 'up' | 'down' | 'stable';
```

### Data Flow

```
sidebar-wrapper.astro
  └─ filters.maxPrice (from URL params)
      └─ price-history-card.astro
          └─ generatePriceHistory(2, samplePrice)
          └─ generatePriceHistory(5, samplePrice)
          └─ calculatePriceChange()
          └─ Chart.js rendering
```

## Related Code Files

### To Create

1. **`src/utils/price-history-utils.ts`** (~40 lines)
   - Extract logic from existing component
   - Add TypeScript types
   - Export pure functions

### Reference Files

1. `src/components/property/price-history-chart.astro` (lines 14-34)
   - Source of `generatePriceHistory()` logic

## Implementation Steps

### Step 1: Create Type Definitions

Create `src/types/price-history.ts`:

```typescript
/**
 * Price History Types
 * Used for chart data generation and display
 */

export interface PriceHistoryData {
  labels: string[];  // Date labels (e.g., "1/2024", "2/2024")
  data: number[];    // Price values
}

export interface PriceHistoryResult {
  twoYear: PriceHistoryData;
  fiveYear: PriceHistoryData;
  changePercent: number;
  trendDirection: 'up' | 'down' | 'stable';
}

export interface PriceHistoryChartData {
  twoYear: PriceHistoryData;
  fiveYear: PriceHistoryData;
  unitLabel: string;
}
```

### Step 2: Create Utility Functions

Create `src/utils/price-history-utils.ts`:

```typescript
/**
 * Price History Utilities
 * Mock data generation for price trend visualization
 */
import type { PriceHistoryData } from '@/types/price-history';

/**
 * Generate mock price history based on current price
 * Algorithm: Start at 70-80% of current, add ±2.5% monthly fluctuation
 */
export function generatePriceHistory(
  years: number,
  currentPrice: number
): PriceHistoryData {
  const months = years * 12;
  const labels: string[] = [];
  const data: number[] = [];

  const now = new Date();
  const startPrice = currentPrice * (0.7 + Math.random() * 0.1);

  for (let i = months; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(`${date.getMonth() + 1}/${date.getFullYear()}`);

    const progress = (months - i) / months;
    const basePrice = startPrice + (currentPrice - startPrice) * progress;
    const fluctuation = basePrice * (Math.random() * 0.05 - 0.025);
    data.push(Math.round((basePrice + fluctuation) * 100) / 100);
  }

  // Ensure last value is exactly currentPrice
  data[data.length - 1] = currentPrice;

  return { labels, data };
}

/**
 * Calculate percentage change between two prices
 */
export function calculatePriceChange(
  startPrice: number,
  endPrice: number
): number {
  if (startPrice === 0) return 0;
  return ((endPrice - startPrice) / startPrice) * 100;
}

/**
 * Determine trend direction from change percentage
 */
export function getTrendDirection(
  changePercent: number
): 'up' | 'down' | 'stable' {
  if (changePercent > 0.5) return 'up';
  if (changePercent < -0.5) return 'down';
  return 'stable';
}

/**
 * Format price unit label for Vietnamese
 */
export function formatPriceUnitLabel(
  unit: 'billion' | 'million' | 'default'
): string {
  switch (unit) {
    case 'billion': return 'tỷ';
    case 'million': return 'triệu';
    default: return 'VND';
  }
}
```

### Step 3: Update Type Index (Optional)

If project uses barrel exports, add to `src/types/index.ts`:

```typescript
export * from './price-history';
```

## Todo List

- [ ] Create `src/types/price-history.ts`
- [ ] Create `src/utils/price-history-utils.ts`
- [ ] Export `generatePriceHistory` function
- [ ] Export `calculatePriceChange` function
- [ ] Export `getTrendDirection` function
- [ ] Export `formatPriceUnitLabel` function
- [ ] Verify TypeScript compilation

## Success Criteria

- [ ] Types compile without errors
- [ ] Functions exported correctly
- [ ] Can import in Astro component
- [ ] `npm run astro check` passes

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Type import path issues | Medium | Low | Use @/ alias |
| Random values inconsistent | Low | Low | Acceptable for mock |

## Security Considerations

- No user input
- No external calls
- Pure data transformation

## Next Steps

→ [Phase 3: Create Sidebar Card](./phase-03-create-sidebar-card.md)
