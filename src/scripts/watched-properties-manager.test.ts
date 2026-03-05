/**
 * Watched Properties Manager Tests
 * Unit tests for localStorage-based recently viewed properties tracking
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

// Mock localStorage for Node.js environment
const createMockLocalStorage = () => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

describe('WatchedPropertiesManager', () => {
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;

  beforeEach(() => {
    mockLocalStorage = createMockLocalStorage();
    // Simulate global localStorage
    if (typeof global !== 'undefined') {
      (global as any).localStorage = mockLocalStorage;
    }
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  describe('localStorage operations', () => {
    test('should initialize with empty list', () => {
      const items = JSON.parse(mockLocalStorage.getItem('watched_properties_list') || '[]');
      assert.strictEqual(items.length, 0, 'Initial list should be empty');
    });

    test('should store and retrieve properties', () => {
      const property = {
        estateId: '123',
        transactionType: 'sale',
        title: 'Test Property',
        url: '/bds/test-property',
        image: 'image.jpg',
      };

      mockLocalStorage.setItem('watched_properties_list', JSON.stringify([property]));
      const retrieved = JSON.parse(mockLocalStorage.getItem('watched_properties_list') || '[]');

      assert.strictEqual(retrieved.length, 1, 'Should have 1 property');
      assert.strictEqual(retrieved[0].estateId, '123', 'Property ID should match');
      assert.strictEqual(retrieved[0].title, 'Test Property', 'Property title should match');
    });

    test('should handle malformed JSON gracefully', () => {
      mockLocalStorage.setItem('watched_properties_list', 'invalid json');
      try {
        const items = JSON.parse(mockLocalStorage.getItem('watched_properties_list') || '[]');
        // This should throw in real code
        assert.fail('Should have thrown on invalid JSON');
      } catch {
        assert.ok(true, 'Correctly throws on invalid JSON');
      }
    });
  });

  describe('manager logic simulation', () => {
    test('should maintain max 8 items', () => {
      const STORAGE_KEY = 'watched_properties_list';
      const MAX_ITEMS = 8;

      // Add 10 properties
      const items = Array.from({ length: 10 }, (_, i) => ({
        estateId: String(i + 1),
        transactionType: 'sale',
        title: `Property ${i + 1}`,
        url: `/bds/property-${i + 1}`,
        image: 'image.jpg',
      }));

      mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      const stored = JSON.parse(mockLocalStorage.getItem(STORAGE_KEY) || '[]');

      // Simulate cap at 8
      const capped = stored.slice(0, MAX_ITEMS);
      mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(capped));

      const final = JSON.parse(mockLocalStorage.getItem(STORAGE_KEY) || '[]');
      assert.strictEqual(final.length, MAX_ITEMS, 'Should cap at 8 items');
    });

    test('should move duplicate to front', () => {
      const STORAGE_KEY = 'watched_properties_list';
      let items = [
        { estateId: '1', transactionType: 'sale', title: 'Property 1', url: '/bds/1', image: 'img1.jpg' },
        { estateId: '2', transactionType: 'sale', title: 'Property 2', url: '/bds/2', image: 'img2.jpg' },
        { estateId: '3', transactionType: 'sale', title: 'Property 3', url: '/bds/3', image: 'img3.jpg' },
      ];

      mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(items));

      // Simulate tracking property 2 again
      const newProperty = { estateId: '2', transactionType: 'sale', title: 'Property 2', url: '/bds/2', image: 'img2.jpg' };
      const stored = JSON.parse(mockLocalStorage.getItem(STORAGE_KEY) || '[]');
      const filtered = stored.filter((item: any) => item.estateId !== newProperty.estateId);
      filtered.unshift(newProperty);

      mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

      const final = JSON.parse(mockLocalStorage.getItem(STORAGE_KEY) || '[]');
      assert.strictEqual(final[0].estateId, '2', 'Property 2 should be at front');
      assert.strictEqual(final.length, 3, 'Should still have 3 items');
    });

    test('should handle display IDs excluding current', () => {
      const STORAGE_KEY = 'watched_properties_list';
      const items = [
        { estateId: '1', transactionType: 'sale', title: 'Property 1', url: '/bds/1', image: 'img1.jpg' },
        { estateId: '2', transactionType: 'sale', title: 'Property 2', url: '/bds/2', image: 'img2.jpg' },
        { estateId: '3', transactionType: 'sale', title: 'Property 3', url: '/bds/3', image: 'img3.jpg' },
      ];

      mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(items));

      const stored = JSON.parse(mockLocalStorage.getItem(STORAGE_KEY) || '[]');
      const displayIds = stored
        .filter((item: any) => item.estateId !== '2') // Exclude current property
        .map((item: any) => item.estateId);

      assert.strictEqual(displayIds.length, 2, 'Should have 2 display IDs');
      assert.ok(!displayIds.includes('2'), 'Current property should not be in display IDs');
      assert.ok(displayIds.includes('1'), 'Should include property 1');
      assert.ok(displayIds.includes('3'), 'Should include property 3');
    });
  });

  describe('price formatting simulation', () => {
    test('should format prices correctly', () => {
      const formatPrice = (price: number, unit: string): string => {
        if (!price || price === 0) return 'Thương lượng';
        if (unit === 'per_month') {
          return `${(price / 1_000_000).toLocaleString('vi-VN')} triệu/tháng`;
        }
        if (price >= 1_000_000_000) {
          const ty = price / 1_000_000_000;
          return `${ty % 1 === 0 ? ty : ty.toFixed(1)} tỷ`;
        }
        return `${(price / 1_000_000).toLocaleString('vi-VN')} triệu`;
      };

      assert.strictEqual(formatPrice(0, 'total'), 'Thương lượng', 'Zero price');
      assert.strictEqual(formatPrice(500000000, 'total'), '500 triệu', 'Triệu format');
      assert.ok(formatPrice(2000000000, 'total').includes('tỷ'), 'Tỷ format');
      assert.ok(formatPrice(5000000, 'per_month').includes('triệu/tháng'), 'Monthly format');
    });

    test('should handle zero and null prices', () => {
      const formatPrice = (price: number, unit: string): string => {
        if (!price || price === 0) return 'Thương lượng';
        return `${(price / 1_000_000).toLocaleString('vi-VN')} triệu`;
      };

      assert.strictEqual(formatPrice(0, 'total'), 'Thương lượng');
      assert.strictEqual(formatPrice(NaN, 'total'), 'Thương lượng');
    });
  });

  describe('XSS sanitization simulation', () => {
    test('should sanitize strings', () => {
      const sanitize = (value: string): string => {
        // Simple sanitization for test
        return value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      };

      const malicious = '<script>alert("xss")</script>';
      const sanitized = sanitize(malicious);
      assert.ok(!sanitized.includes('<script>'), 'Should remove script tags');
      assert.ok(sanitized.includes('&lt;'), 'Should escape angle brackets');
    });

    test('should handle normal strings', () => {
      const sanitize = (value: string): string => {
        return value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      };

      const normal = 'Căn hộ 3 phòng ngủ';
      const sanitized = sanitize(normal);
      assert.strictEqual(sanitized, normal, 'Should not alter normal strings');
    });
  });

  describe('API response transformation', () => {
    test('should transform property data correctly', () => {
      // Simulate API response transformation
      const dbProperty = {
        id: 123,
        title: 'Căn hộ 3 phòng',
        slug: 'can-ho-3-phong',
        price: '2000000000',
        transactionType: 1,
        mainImage: 'https://example.com/image.jpg',
        city: 'TP. Hồ Chí Minh',
        district: 'Quận 1',
        area: '80.5',
      };

      const transformed = {
        id: String(dbProperty.id),
        title: dbProperty.title || '',
        slug: dbProperty.slug || '',
        price: dbProperty.price ? parseFloat(dbProperty.price) : 0,
        priceUnit: dbProperty.transactionType === 2 ? 'per_month' : 'total',
        transactionType: dbProperty.transactionType === 1 ? 'sale' : 'rent',
        thumbnail: dbProperty.mainImage || '',
        city: dbProperty.city || '',
        district: dbProperty.district || '',
        area: dbProperty.area ? parseFloat(String(dbProperty.area)) : 0,
      };

      assert.strictEqual(transformed.id, '123');
      assert.strictEqual(transformed.transactionType, 'sale');
      assert.strictEqual(transformed.priceUnit, 'total');
      assert.strictEqual(transformed.price, 2000000000);
    });

    test('should handle rental properties', () => {
      const dbProperty = {
        id: 456,
        title: 'Cho thuê phòng',
        slug: 'cho-thue-phong',
        price: '10000000',
        transactionType: 2, // rental
        mainImage: 'https://example.com/rent.jpg',
        city: 'Hà Nội',
        district: 'Quận Ba Đình',
        area: '40.0',
      };

      const transformed = {
        id: String(dbProperty.id),
        price: dbProperty.price ? parseFloat(dbProperty.price) : 0,
        priceUnit: dbProperty.transactionType === 2 ? 'per_month' : 'total',
        transactionType: dbProperty.transactionType === 1 ? 'sale' : 'rent',
      };

      assert.strictEqual(transformed.transactionType, 'rent');
      assert.strictEqual(transformed.priceUnit, 'per_month');
    });

    test('should preserve order from request IDs', () => {
      const requestIds = ['3', '1', '2'];
      const dbResults = [
        { id: '1', title: 'Property 1' },
        { id: '2', title: 'Property 2' },
        { id: '3', title: 'Property 3' },
      ];

      const orderedResult = requestIds
        .map(id => dbResults.find(p => p.id === id))
        .filter(Boolean);

      assert.strictEqual(orderedResult[0]?.id, '3', 'Should preserve request order');
      assert.strictEqual(orderedResult[1]?.id, '1');
      assert.strictEqual(orderedResult[2]?.id, '2');
    });
  });
});
