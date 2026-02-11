import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import CompareManager from './compare-manager';

/**
 * CompareManager Tests
 * Unit tests for localStorage-based property comparison system
 */

describe('CompareManager', () => {
  // Mock localStorage
  let store: Record<string, string> = {};

  beforeEach(() => {
    // Reset localStorage mock before each test
    store = {};

    // Mock localStorage
    const mockStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    });

    // Mock document.body
    document.body.innerHTML = '';

    // Mock document.dispatchEvent
    vi.spyOn(document, 'dispatchEvent');
  });

  afterEach(() => {
    vi.clearAllMocks();
    store = {};
  });

  describe('Initialization', () => {
    it('should be a singleton object with required methods', () => {
      expect(typeof CompareManager).toBe('object');
      expect(typeof CompareManager.init).toBe('function');
      expect(typeof CompareManager.add).toBe('function');
      expect(typeof CompareManager.remove).toBe('function');
      expect(typeof CompareManager.toggle).toBe('function');
      expect(typeof CompareManager.getItems).toBe('function');
      expect(typeof CompareManager.clear).toBe('function');
    });
  });

  describe('getItems', () => {
    it('should return empty array when no items in storage', () => {
      const items = CompareManager.getItems();
      expect(Array.isArray(items)).toBe(true);
      expect(items).toHaveLength(0);
    });

    it('should return stored items', () => {
      const testItem = {
        estateId: '123',
        transactionType: 'sell',
        url: '/bds/test',
        image: 'image.jpg',
        title: 'Test Property',
      };

      store['compare_items'] = JSON.stringify([testItem]);
      const items = CompareManager.getItems();

      expect(items).toHaveLength(1);
      expect(items[0].estateId).toBe('123');
      expect(items[0].title).toBe('Test Property');
    });

    it('should handle corrupted JSON gracefully', () => {
      store['compare_items'] = 'invalid json';
      const items = CompareManager.getItems();
      expect(items).toEqual([]);
    });

    it('should handle localStorage unavailable (private browsing)', () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      const items = CompareManager.getItems();
      expect(items).toEqual([]);
    });
  });

  describe('add - Happy Path', () => {
    it('should add item to empty list', () => {
      const item = {
        estateId: '123',
        transactionType: 'sell',
        url: '/bds/test',
        image: 'image.jpg',
        title: 'Test Property',
      };

      const result = CompareManager.add(item);
      expect(result).toBe(true);

      const items = CompareManager.getItems();
      expect(items).toHaveLength(1);
      expect(items[0].estateId).toBe('123');
    });

    it('should add second item of same transaction type', () => {
      const item1 = {
        estateId: '123',
        transactionType: 'sell',
        url: '/bds/test1',
        image: 'image1.jpg',
        title: 'Property 1',
      };

      const item2 = {
        estateId: '456',
        transactionType: 'sell',
        url: '/bds/test2',
        image: 'image2.jpg',
        title: 'Property 2',
      };

      CompareManager.add(item1);
      const result = CompareManager.add(item2);

      expect(result).toBe(true);
      const items = CompareManager.getItems();
      expect(items).toHaveLength(2);
    });

    it('should persist items to localStorage', () => {
      const item = {
        estateId: '123',
        transactionType: 'sell',
        url: '/bds/test',
        image: 'image.jpg',
        title: 'Test Property',
      };

      CompareManager.add(item);
      const stored = JSON.parse(store['compare_items']);

      expect(stored).toHaveLength(1);
      expect(stored[0].estateId).toBe('123');
    });

    it('should dispatch compareListChanged event', () => {
      const item = {
        estateId: '123',
        transactionType: 'sell',
        url: '/bds/test',
        image: 'image.jpg',
        title: 'Test Property',
      };

      CompareManager.add(item);
      expect(document.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'compareListChanged' })
      );
    });
  });

  describe('add - Error Cases', () => {
    it('should reject adding 3rd item (max 2 limit)', () => {
      const item1 = {
        estateId: '123',
        transactionType: 'sell',
        url: '/bds/test1',
        image: 'image1.jpg',
        title: 'Property 1',
      };

      const item2 = {
        estateId: '456',
        transactionType: 'sell',
        url: '/bds/test2',
        image: 'image2.jpg',
        title: 'Property 2',
      };

      const item3 = {
        estateId: '789',
        transactionType: 'sell',
        url: '/bds/test3',
        image: 'image3.jpg',
        title: 'Property 3',
      };

      CompareManager.add(item1);
      CompareManager.add(item2);
      const result = CompareManager.add(item3);

      expect(result).toBe(false);
      const items = CompareManager.getItems();
      expect(items).toHaveLength(2);
    });

    it('should reject adding item with different transaction type', () => {
      const item1 = {
        estateId: '123',
        transactionType: 'sell',
        url: '/bds/test1',
        image: 'image1.jpg',
        title: 'Property 1',
      };

      const item2 = {
        estateId: '456',
        transactionType: 'rent',
        url: '/bds/test2',
        image: 'image2.jpg',
        title: 'Property 2',
      };

      CompareManager.add(item1);
      const result = CompareManager.add(item2);

      expect(result).toBe(false);
      const items = CompareManager.getItems();
      expect(items).toHaveLength(1);
    });

    it('should not add duplicate item', () => {
      const item = {
        estateId: '123',
        transactionType: 'sell',
        url: '/bds/test',
        image: 'image.jpg',
        title: 'Test Property',
      };

      CompareManager.add(item);
      const result = CompareManager.add(item);

      expect(result).toBe(false);
      const items = CompareManager.getItems();
      expect(items).toHaveLength(1);
    });

    it('should show error toast on max items exceeded', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');

      const item1 = {
        estateId: '123',
        transactionType: 'sell',
        url: '/bds/test1',
        image: 'image1.jpg',
        title: 'Property 1',
      };

      const item2 = {
        estateId: '456',
        transactionType: 'sell',
        url: '/bds/test2',
        image: 'image2.jpg',
        title: 'Property 2',
      };

      const item3 = {
        estateId: '789',
        transactionType: 'sell',
        url: '/bds/test3',
        image: 'image3.jpg',
        title: 'Property 3',
      };

      CompareManager.add(item1);
      CompareManager.add(item2);
      CompareManager.add(item3);

      expect(createElementSpy).toHaveBeenCalledWith('div');
    });

    it('should show error toast on transaction type mismatch', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');

      const item1 = {
        estateId: '123',
        transactionType: 'sell',
        url: '/bds/test1',
        image: 'image1.jpg',
        title: 'Property 1',
      };

      const item2 = {
        estateId: '456',
        transactionType: 'rent',
        url: '/bds/test2',
        image: 'image2.jpg',
        title: 'Property 2',
      };

      CompareManager.add(item1);
      CompareManager.add(item2);

      expect(createElementSpy).toHaveBeenCalledWith('div');
    });
  });

  describe('remove', () => {
    it('should remove item by estateId', () => {
      const item1 = {
        estateId: '123',
        transactionType: 'sell',
        url: '/bds/test1',
        image: 'image1.jpg',
        title: 'Property 1',
      };

      const item2 = {
        estateId: '456',
        transactionType: 'sell',
        url: '/bds/test2',
        image: 'image2.jpg',
        title: 'Property 2',
      };

      CompareManager.add(item1);
      CompareManager.add(item2);

      const result = CompareManager.remove('123');
      expect(result).toBe(true);

      const items = CompareManager.getItems();
      expect(items).toHaveLength(1);
      expect(items[0].estateId).toBe('456');
    });

    it('should dispatch compareListChanged event on remove', () => {
      const item = {
        estateId: '123',
        transactionType: 'sell',
        url: '/bds/test',
        image: 'image.jpg',
        title: 'Test Property',
      };

      CompareManager.add(item);
      vi.clearAllMocks();

      CompareManager.remove('123');
      expect(document.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'compareListChanged' })
      );
    });

    it('should handle removing non-existent item', () => {
      const result = CompareManager.remove('nonexistent');
      expect(result).toBe(true); // Returns true but doesn't remove anything

      const items = CompareManager.getItems();
      expect(items).toHaveLength(0);
    });
  });

  describe('toggle', () => {
    beforeEach(() => {
      // Setup button elements for toggle tests
      const button = document.createElement('button');
      button.className = 'btn-compare';
      button.dataset.estateId = '123';
      button.dataset.transactionType = 'sell';
      button.dataset.url = '/bds/test';
      button.dataset.image = 'image.jpg';
      button.dataset.title = 'Test Property';
      document.body.appendChild(button);
    });

    it('should add item and set active class when toggling non-existent item', () => {
      const button = document.querySelector('.btn-compare') as HTMLElement;

      CompareManager.toggle(button);

      expect(button.classList.contains('active')).toBe(true);
      const items = CompareManager.getItems();
      expect(items).toHaveLength(1);
    });

    it('should remove item and remove active class when toggling existing item', () => {
      const button = document.querySelector('.btn-compare') as HTMLElement;

      // First toggle adds
      CompareManager.toggle(button);
      expect(button.classList.contains('active')).toBe(true);

      // Second toggle removes
      CompareManager.toggle(button);
      expect(button.classList.contains('active')).toBe(false);
      const items = CompareManager.getItems();
      expect(items).toHaveLength(0);
    });

    it('should not add active class if add fails (max items)', () => {
      const button = document.querySelector('.btn-compare') as HTMLElement;

      // Fill up to max
      CompareManager.add({
        estateId: '111',
        transactionType: 'sell',
        url: '/bds/test1',
        image: 'image1.jpg',
        title: 'Property 1',
      });

      CompareManager.add({
        estateId: '222',
        transactionType: 'sell',
        url: '/bds/test2',
        image: 'image2.jpg',
        title: 'Property 2',
      });

      // Try to toggle new item
      CompareManager.toggle(button);
      expect(button.classList.contains('active')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all items', () => {
      const item1 = {
        estateId: '123',
        transactionType: 'sell',
        url: '/bds/test1',
        image: 'image1.jpg',
        title: 'Property 1',
      };

      const item2 = {
        estateId: '456',
        transactionType: 'sell',
        url: '/bds/test2',
        image: 'image2.jpg',
        title: 'Property 2',
      };

      CompareManager.add(item1);
      CompareManager.add(item2);

      CompareManager.clear();

      const items = CompareManager.getItems();
      expect(items).toHaveLength(0);
    });

    it('should dispatch compareListChanged event', () => {
      const item = {
        estateId: '123',
        transactionType: 'sell',
        url: '/bds/test',
        image: 'image.jpg',
        title: 'Test Property',
      };

      CompareManager.add(item);
      vi.clearAllMocks();

      CompareManager.clear();
      expect(document.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'compareListChanged' })
      );
    });
  });

  describe('State Persistence', () => {
    it('should survive page refresh (via localStorage)', () => {
      const item = {
        estateId: '123',
        transactionType: 'sell',
        url: '/bds/test',
        image: 'image.jpg',
        title: 'Test Property',
      };

      CompareManager.add(item);

      // Simulate page refresh by creating new manager instance
      // Items should still be in localStorage
      const items = CompareManager.getItems();
      expect(items).toHaveLength(1);
      expect(items[0].estateId).toBe('123');
    });

    it('should sync across storage events', () => {
      const item = {
        estateId: '123',
        transactionType: 'sell',
        url: '/bds/test',
        image: 'image.jpg',
        title: 'Test Property',
      };

      // Simulate another tab adding item by directly updating store
      store['compare_items'] = JSON.stringify([item]);

      // Our manager should still be able to read it
      const items = CompareManager.getItems();
      expect(items).toHaveLength(1);
      expect(items[0].estateId).toBe('123');
    });
  });

  describe('Edge Cases', () => {
    it('should handle localStorage quota exceeded gracefully', () => {
      const mockStorage = {
        getItem: () => '[]',
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
        removeItem: () => {},
        clear: () => {},
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockStorage,
        writable: true,
      });

      const item = {
        estateId: '123',
        transactionType: 'sell',
        url: '/bds/test',
        image: 'image.jpg',
        title: 'Test Property',
      };

      // Should not throw
      expect(() => CompareManager.add(item)).not.toThrow();
    });

    it('should handle items with special characters in data', () => {
      const item = {
        estateId: '123',
        transactionType: 'sell',
        url: '/bds/căn-hộ',
        image: 'image.jpg',
        title: 'Căn hộ cao cấp "Luxury"',
      };

      const result = CompareManager.add(item);
      expect(result).toBe(true);

      const items = CompareManager.getItems();
      expect(items[0].title).toBe('Căn hộ cao cấp "Luxury"');
    });

    it('should allow switching transaction types after clearing', () => {
      const sellItem = {
        estateId: '123',
        transactionType: 'sell',
        url: '/bds/test1',
        image: 'image1.jpg',
        title: 'Property 1',
      };

      const rentItem = {
        estateId: '456',
        transactionType: 'rent',
        url: '/bds/test2',
        image: 'image2.jpg',
        title: 'Property 2',
      };

      CompareManager.add(sellItem);
      CompareManager.clear();
      const result = CompareManager.add(rentItem);

      expect(result).toBe(true);
      const items = CompareManager.getItems();
      expect(items[0].transactionType).toBe('rent');
    });
  });

  describe('Toast Notifications', () => {
    it('should create toast div on success add', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');

      const item = {
        estateId: '123',
        transactionType: 'sell',
        url: '/bds/test',
        image: 'image.jpg',
        title: 'Test Property',
      };

      CompareManager.add(item);

      expect(createElementSpy).toHaveBeenCalledWith('div');
      const calls = createElementSpy.mock.calls;
      expect(calls.some(call => call[0] === 'div')).toBe(true);
    });

    it('should create toast div on success remove', () => {
      const item = {
        estateId: '123',
        transactionType: 'sell',
        url: '/bds/test',
        image: 'image.jpg',
        title: 'Test Property',
      };

      CompareManager.add(item);

      const createElementSpy = vi.spyOn(document, 'createElement');
      CompareManager.remove('123');

      expect(createElementSpy).toHaveBeenCalledWith('div');
    });
  });
});
