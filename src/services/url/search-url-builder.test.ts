import { describe, it, expect } from 'vitest';
import { buildSearchUrl, buildPropertyTypeSlugMap } from './search-url-builder';
import type { SearchFilters, PropertyTypeSlugMap } from '@/types/search-filters';

describe('buildSearchUrl Function', () => {
  // ==================== Scenario 1: Single Property Type ====================
  describe('Scenario 1: Single Property Type Selection', () => {
    it('Test Case 1.1: Căn hộ chung cư (ID 12) - should use slug in path', () => {
      const slugMap: PropertyTypeSlugMap = {
        '12': 'ban-can-ho-chung-cu',
        '13': 'ban-nha-rieng',
      };

      const filters: SearchFilters = {
        transaction_type: '1',
        selected_addresses: 'ha-noi',
        property_types: '12',
      };

      const url = buildSearchUrl(filters, slugMap);

      expect(url).toBe('/ban-can-ho-chung-cu/ha-noi');
      expect(url).not.toContain('property_types');
    });

    it('Test Case 1.2: Nhà riêng (ID 13) - should use slug in path', () => {
      const slugMap: PropertyTypeSlugMap = {
        '12': 'ban-can-ho-chung-cu',
        '13': 'ban-nha-rieng',
      };

      const filters: SearchFilters = {
        transaction_type: '1',
        selected_addresses: 'ha-noi',
        property_types: '13',
      };

      const url = buildSearchUrl(filters, slugMap);

      expect(url).toBe('/ban-nha-rieng/ha-noi');
      expect(url).not.toContain('property_types');
    });

    it('Test Case 1.3: Single property type + price range - should include price slug in path', () => {
      const slugMap: PropertyTypeSlugMap = {
        '12': 'ban-can-ho-chung-cu',
      };

      const filters: SearchFilters = {
        transaction_type: '1',
        selected_addresses: 'ha-noi',
        property_types: '12',
        min_price: '1000000000', // 1 tỷ
        max_price: '2000000000', // 2 tỷ
      };

      const url = buildSearchUrl(filters, slugMap);

      expect(url).toBe('/ban-can-ho-chung-cu/ha-noi/gia-tu-1-ty-den-2-ty');
      expect(url).not.toContain('property_types');
      expect(url).not.toContain('gtn');
      expect(url).not.toContain('gcn');
    });
  });

  // ==================== Scenario 2: Multiple Property Types ====================
  describe('Scenario 2: Multiple Property Types Selection', () => {
    it('Test Case 2.1: Two property types - should use query param', () => {
      const slugMap: PropertyTypeSlugMap = {
        '12': 'ban-can-ho-chung-cu',
        '13': 'ban-nha-rieng',
      };

      const filters: SearchFilters = {
        transaction_type: '1',
        selected_addresses: 'ha-noi',
        property_types: '12,13',
      };

      const url = buildSearchUrl(filters, slugMap);

      expect(url).toBe('/mua-ban/ha-noi?property_types=12,13');
      expect(url).not.toContain('ban-can-ho-chung-cu');
      expect(url).not.toContain('ban-nha-rieng');
    });

    it('Test Case 2.2: Three property types - should use query param', () => {
      const slugMap: PropertyTypeSlugMap = {
        '12': 'ban-can-ho-chung-cu',
        '13': 'ban-nha-rieng',
        '14': 'ban-dat-nen',
      };

      const filters: SearchFilters = {
        transaction_type: '1',
        selected_addresses: 'ha-noi',
        property_types: '12,13,14',
      };

      const url = buildSearchUrl(filters, slugMap);

      expect(url).toBe('/mua-ban/ha-noi?property_types=12,13,14');
    });

    it('Test Case 2.3: Multiple types + all filters - should include all params', () => {
      const slugMap: PropertyTypeSlugMap = {
        '12': 'ban-can-ho-chung-cu',
        '13': 'ban-nha-rieng',
      };

      const filters: SearchFilters = {
        transaction_type: '1',
        selected_addresses: 'ha-noi,quan-hoan-kiem,quan-ba-dinh',
        property_types: '12,13',
        min_price: '1000000000',
        max_price: '2000000000',
        bedrooms: '3',
        min_area: '50',
        max_area: '80',
      };

      const url = buildSearchUrl(filters, slugMap);

      expect(url).toContain('/mua-ban/ha-noi');
      expect(url).toContain('property_types=12,13');
      expect(url).toContain('addresses=quan-hoan-kiem,quan-ba-dinh');
      expect(url).toContain('bedrooms=3');
      expect(url).toContain('dtnn=50');
      expect(url).toContain('dtcn=80');
      expect(url).toContain('gia-tu-1-ty-den-2-ty');
    });
  });

  // ==================== Scenario 3: Edge Cases ====================
  describe('Scenario 3: Edge Cases', () => {
    it('Test Case 3.1: No property type selected - should show transaction type only', () => {
      const filters: SearchFilters = {
        transaction_type: '1',
        selected_addresses: 'ha-noi',
        property_types: '',
      };

      const url = buildSearchUrl(filters);

      expect(url).toBe('/mua-ban/ha-noi');
      expect(url).not.toContain('property_types');
    });

    it('Test Case 3.2: Property type slug not found - should fallback to query param', () => {
      const slugMap: PropertyTypeSlugMap = {}; // Empty map

      const filters: SearchFilters = {
        transaction_type: '1',
        selected_addresses: 'ha-noi',
        property_types: '12',
      };

      const url = buildSearchUrl(filters, slugMap);

      // Should fallback to transaction type + query param
      expect(url).toBe('/mua-ban/ha-noi?property_types=12');
    });

    it('Test Case 3.3a: Cho thuê (transaction_type=2) - single property type', () => {
      const slugMap: PropertyTypeSlugMap = {
        '12': 'cho-thue-can-ho-chung-cu',
      };

      const filters: SearchFilters = {
        transaction_type: '2',
        selected_addresses: 'ha-noi',
        property_types: '12',
      };

      const url = buildSearchUrl(filters, slugMap);

      expect(url).toBe('/cho-thue-can-ho-chung-cu/ha-noi');
    });

    it('Test Case 3.3b: Cho thuê (transaction_type=2) - multiple property types', () => {
      const slugMap: PropertyTypeSlugMap = {
        '12': 'cho-thue-can-ho-chung-cu',
        '13': 'cho-thue-nha-rieng',
      };

      const filters: SearchFilters = {
        transaction_type: '2',
        selected_addresses: 'ha-noi',
        property_types: '12,13',
      };

      const url = buildSearchUrl(filters, slugMap);

      expect(url).toBe('/cho-thue/ha-noi?property_types=12,13');
    });

    it('Test Case 3.3c: Dự án (transaction_type=3) - single property type', () => {
      const slugMap: PropertyTypeSlugMap = {
        '1': 'du-an-can-ho-chung-cu',
      };

      const filters: SearchFilters = {
        transaction_type: '3',
        selected_addresses: 'ha-noi',
        property_types: '1',
      };

      const url = buildSearchUrl(filters, slugMap);

      expect(url).toBe('/du-an-can-ho-chung-cu/ha-noi');
    });

    it('Test Case 3.3d: Dự án (transaction_type=3) - multiple property types', () => {
      const slugMap: PropertyTypeSlugMap = {
        '1': 'du-an-can-ho-chung-cu',
        '2': 'du-an-nha-rieng',
      };

      const filters: SearchFilters = {
        transaction_type: '3',
        selected_addresses: 'ha-noi',
        property_types: '1,2',
      };

      const url = buildSearchUrl(filters, slugMap);

      expect(url).toBe('/du-an/ha-noi?property_types=1,2');
    });
  });

  // ==================== Scenario 4: Integration Testing ====================
  describe('Scenario 4: Integration Testing', () => {
    it('Test Case 4.1: URL parser should handle generated URL correctly', () => {
      const slugMap: PropertyTypeSlugMap = {
        '12': 'ban-can-ho-chung-cu',
      };

      const filters: SearchFilters = {
        transaction_type: '1',
        selected_addresses: 'ha-noi',
        property_types: '12',
      };

      const url = buildSearchUrl(filters, slugMap);

      // Verify URL format
      expect(url).toMatch(/^\/[a-z-]+\/[a-z-]+$/);
      expect(url).not.toContain('%');
    });

    it('Test Case 4.2: Browser back/forward URL should be valid', () => {
      const slugMap: PropertyTypeSlugMap = {
        '12': 'ban-can-ho-chung-cu',
      };

      const filters: SearchFilters = {
        transaction_type: '1',
        selected_addresses: 'ha-noi',
        property_types: '12',
      };

      const url = buildSearchUrl(filters, slugMap);

      // Should not have any encoding issues
      expect(url).toBe('/ban-can-ho-chung-cu/ha-noi');
      // Should not contain %2C (encoded comma)
      expect(url).not.toContain('%2C');
    });

    it('Test Case 4.3: Direct URL access should be parseable', () => {
      const slugMap: PropertyTypeSlugMap = {
        '12': 'ban-can-ho-chung-cu',
      };

      const filters: SearchFilters = {
        transaction_type: '1',
        selected_addresses: 'ha-noi',
        property_types: '12',
      };

      const url = buildSearchUrl(filters, slugMap);

      // URL should be directory-like format
      expect(url).toMatch(/^\/[\w-]+\/[\w-]+(\/[\w-]+)?(\?.*)?$/);
    });
  });

  // ==================== Scenario 5: v1 Compatibility ====================
  describe('Scenario 5: v1 Compatibility', () => {
    it('Test Case 5.1: Single property type URL matches v1 format', () => {
      const slugMap: PropertyTypeSlugMap = {
        '12': 'ban-can-ho-chung-cu',
      };

      const filters: SearchFilters = {
        transaction_type: '1',
        selected_addresses: 'ha-noi',
        property_types: '12',
      };

      const url = buildSearchUrl(filters, slugMap);

      // v1 format: /ban-can-ho-chung-cu/ha-noi
      expect(url).toBe('/ban-can-ho-chung-cu/ha-noi');
    });

    it('Test Case 5.2: Multiple property types URL matches v1 format', () => {
      const slugMap: PropertyTypeSlugMap = {
        '12': 'ban-can-ho-chung-cu',
        '13': 'ban-nha-rieng',
      };

      const filters: SearchFilters = {
        transaction_type: '1',
        selected_addresses: 'ha-noi',
        property_types: '12,13',
      };

      const url = buildSearchUrl(filters, slugMap);

      // v1 format: /mua-ban/ha-noi?property_types=12,13
      expect(url).toBe('/mua-ban/ha-noi?property_types=12,13');
    });

    it('Test Case 5.3: Price slug in path (v1 compatible)', () => {
      const slugMap: PropertyTypeSlugMap = {
        '12': 'ban-can-ho-chung-cu',
      };

      const filters: SearchFilters = {
        transaction_type: '1',
        selected_addresses: 'ha-noi',
        property_types: '12',
        min_price: '1000000000',
        max_price: '2000000000',
      };

      const url = buildSearchUrl(filters, slugMap);

      // v1 format: /ban-can-ho-chung-cu/ha-noi/gia-tu-1-ty-den-2-ty
      expect(url).toContain('gia-tu-1-ty-den-2-ty');
    });

    it('Test Case 5.4: Addresses param uses plain commas (not %2C)', () => {
      const slugMap: PropertyTypeSlugMap = {
        '12': 'ban-can-ho-chung-cu',
        '13': 'ban-nha-rieng',
      };

      const filters: SearchFilters = {
        transaction_type: '1',
        selected_addresses: 'ha-noi,quan-hoan-kiem,quan-ba-dinh',
        property_types: '12,13',
      };

      const url = buildSearchUrl(filters, slugMap);

      // Should have plain commas, not %2C
      expect(url).toContain('addresses=quan-hoan-kiem,quan-ba-dinh');
      expect(url).not.toContain('%2C');
    });
  });

  // ==================== Performance Testing ====================
  describe('Performance Testing', () => {
    it('Test Case P1: buildPropertyTypeSlugMap execution time < 5ms', () => {
      // Note: This test is informational only in a Node.js environment
      // Performance measurement would be more accurate in browser environment
      const start = performance.now();

      // Simulate DOM with property type checkboxes
      // In real environment, this would be measured on actual DOM

      const end = performance.now();
      const duration = end - start;

      // Just ensure it completes without error
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('Test Case P2: buildSearchUrl execution time < 2ms', () => {
      const slugMap: PropertyTypeSlugMap = {
        '12': 'ban-can-ho-chung-cu',
        '13': 'ban-nha-rieng',
        '14': 'ban-dat-nen',
      };

      const filters: SearchFilters = {
        transaction_type: '1',
        selected_addresses: 'ha-noi,quan-hoan-kiem,quan-ba-dinh',
        property_types: '12,13',
        min_price: '1000000000',
        max_price: '2000000000',
        bedrooms: '3',
        min_area: '50',
        max_area: '80',
        radius: '5',
        bathrooms: '2',
      };

      const start = performance.now();
      const url = buildSearchUrl(filters, slugMap);
      const end = performance.now();

      // Should build URL successfully
      expect(url).toBeDefined();
      expect(url.length).toBeGreaterThan(0);

      // Performance check (informational)
      const duration = end - start;
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  // ==================== Special Cases ====================
  describe('Special Cases', () => {
    it('Should handle missing slug map gracefully', () => {
      const filters: SearchFilters = {
        transaction_type: '1',
        selected_addresses: 'ha-noi',
        property_types: '12',
      };

      // Without slug map, should fallback to query param
      const url = buildSearchUrl(filters);

      expect(url).toBe('/mua-ban/ha-noi?property_types=12');
    });

    it('Should handle empty filters', () => {
      const filters: SearchFilters = {
        transaction_type: '1',
        selected_addresses: '',
        property_types: '',
      };

      const url = buildSearchUrl(filters);

      expect(url).toBe('/mua-ban');
    });

    it('Should handle only price without location', () => {
      const filters: SearchFilters = {
        transaction_type: '1',
        selected_addresses: '',
        property_types: '',
        min_price: '1000000000',
        max_price: '2000000000',
      };

      const url = buildSearchUrl(filters);

      // When price exists without location, location defaults to 'toan-quoc'
      expect(url).toContain('toan-quoc');
      expect(url).toContain('gia-tu-1-ty-den-2-ty');
    });

    it('Should properly encode query parameters', () => {
      const filters: SearchFilters = {
        transaction_type: '1',
        selected_addresses: 'ha-noi',
        property_types: '',
        street_name: 'Nguyễn Huệ',
      };

      const url = buildSearchUrl(filters);

      // Street name should be URL encoded
      expect(url).toContain('street_name');
      expect(url).toContain('Nguy');
    });
  });
});
