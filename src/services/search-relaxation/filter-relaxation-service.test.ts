import { describe, it, expect } from 'vitest';
import { FilterRelaxationService } from './filter-relaxation-service';
import type { PropertySearchFilters } from '@/services/elasticsearch/types';
import type { LocationContext } from './types';

describe('FilterRelaxationService', () => {
  const service = new FilterRelaxationService();

  describe('relaxLevel1', () => {
    it('should remove price, area, and room filters but keep location', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        provinceIds: ['VN-HN'],
        districtIds: ['VN-HN-HBT'],
        minPrice: 1000000000,
        maxPrice: 2000000000,
        minArea: 50,
        maxArea: 100,
        bedrooms: 3,
        bathrooms: 2,
        propertyTypes: [12, 13],
      };

      const result = service.relaxLevel1(filters);

      expect(result.level).toBe(1);
      expect(result.relaxedParams.transactionType).toBe(1);
      expect(result.relaxedParams.provinceIds).toEqual(['VN-HN']);
      expect(result.relaxedParams.districtIds).toEqual(['VN-HN-HBT']);
      expect(result.relaxedParams.minPrice).toBeUndefined();
      expect(result.relaxedParams.maxPrice).toBeUndefined();
      expect(result.relaxedParams.minArea).toBeUndefined();
      expect(result.relaxedParams.maxArea).toBeUndefined();
      expect(result.relaxedParams.bedrooms).toBeUndefined();
      expect(result.relaxedParams.bathrooms).toBeUndefined();
      expect(result.relaxedParams.propertyTypes).toBeUndefined();
      expect(result.removedFilters).toContain('price');
      expect(result.removedFilters).toContain('area');
      expect(result.removedFilters).toContain('bedrooms');
      expect(result.removedFilters).toContain('bathrooms');
      expect(result.removedFilters).toContain('property_types');
    });

    it('should handle filters with no removable criteria', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        provinceIds: ['VN-HN'],
      };

      const result = service.relaxLevel1(filters);

      expect(result.level).toBe(1);
      expect(result.removedFilters).toHaveLength(0);
      expect(result.relaxedParams.transactionType).toBe(1);
      expect(result.relaxedParams.provinceIds).toEqual(['VN-HN']);
    });

    it('should handle filters with only price', () => {
      const filters: PropertySearchFilters = {
        transactionType: 2,
        provinceIds: ['VN-SG'],
        minPrice: 500000000,
      };

      const result = service.relaxLevel1(filters);

      expect(result.level).toBe(1);
      expect(result.removedFilters).toEqual(['price']);
      expect(result.relaxedParams.minPrice).toBeUndefined();
      expect(result.relaxedParams.provinceIds).toEqual(['VN-SG']);
    });

    it('should keep ward filters in Level 1', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        provinceIds: ['VN-HN'],
        districtIds: ['VN-HN-HBT'],
        wardIds: ['VN-HN-HBT-PBD'],
        minPrice: 1000000000,
      };

      const result = service.relaxLevel1(filters);

      expect(result.relaxedParams.wardIds).toEqual(['VN-HN-HBT-PBD']);
      expect(result.relaxedParams.minPrice).toBeUndefined();
    });
  });

  describe('relaxLevel2', () => {
    it('should expand district to city and remove all filters', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        provinceIds: ['VN-HN'],
        districtIds: ['VN-HN-HBT'],
        minPrice: 1000000000,
        bedrooms: 3,
      };

      const locationContext: LocationContext = {
        currentProvince: {
          nId: 'VN-HN',
          slug: 'ha-noi',
          name: 'Hà Nội',
        },
        currentDistrict: {
          nId: 'VN-HN-HBT',
          slug: 'ba-dinh',
          name: 'Ba Đình',
          provinceNId: 'VN-HN',
        },
      };

      const result = service.relaxLevel2(filters, locationContext);

      expect(result.level).toBe(2);
      expect(result.relaxedParams.provinceIds).toEqual(['VN-HN']);
      expect(result.relaxedParams.districtIds).toBeUndefined();
      expect(result.relaxedParams.wardIds).toBeUndefined();
      expect(result.relaxedParams.minPrice).toBeUndefined();
      expect(result.relaxedParams.bedrooms).toBeUndefined();
      expect(result.expandedLocation).toEqual({
        from: 'Ba Đình',
        to: 'Hà Nội',
      });
    });

    it('should expand ward to city', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        wardIds: ['VN-HN-HBT-PBD'],
      };

      const locationContext: LocationContext = {
        currentProvince: {
          nId: 'VN-HN',
          slug: 'ha-noi',
          name: 'Hà Nội',
        },
        currentWard: {
          nId: 'VN-HN-HBT-PBD',
          slug: 'phuong-ba-dinh',
          name: 'Phường Ba Đình',
          districtNId: 'VN-HN-HBT',
        },
      };

      const result = service.relaxLevel2(filters, locationContext);

      expect(result.level).toBe(2);
      expect(result.expandedLocation).toEqual({
        from: 'Phường Ba Đình',
        to: 'Hà Nội',
      });
    });

    it('should handle missing location context', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        provinceIds: ['VN-HN'],
      };

      const locationContext: LocationContext = {};

      const result = service.relaxLevel2(filters, locationContext);

      expect(result.level).toBe(2);
      expect(result.relaxedParams.provinceIds).toEqual(['VN-HN']);
      expect(result.expandedLocation).toBeUndefined();
    });
  });

  describe('relaxLevel3', () => {
    it('should remove all location filters', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        provinceIds: ['VN-HN'],
        districtIds: ['VN-HN-HBT'],
        minPrice: 1000000000,
        bedrooms: 3,
      };

      const result = service.relaxLevel3(filters);

      expect(result.level).toBe(3);
      expect(result.relaxedParams.transactionType).toBe(1);
      expect(result.relaxedParams.provinceIds).toBeUndefined();
      expect(result.relaxedParams.districtIds).toBeUndefined();
      expect(result.relaxedParams.wardIds).toBeUndefined();
      expect(result.relaxedParams.minPrice).toBeUndefined();
      expect(result.relaxedParams.bedrooms).toBeUndefined();
      expect(result.expandedLocation).toEqual({
        from: 'Khu vực đã chọn',
        to: 'Toàn quốc',
      });
    });

    it('should keep only transaction type', () => {
      const filters: PropertySearchFilters = {
        transactionType: 2,
        provinceIds: ['VN-SG'],
        minPrice: 5000000000,
        maxPrice: 10000000000,
        propertyTypes: [12, 13, 14],
      };

      const result = service.relaxLevel3(filters);

      expect(result.relaxedParams.transactionType).toBe(2);
      expect(result.relaxedParams.provinceIds).toBeUndefined();
      expect(result.relaxedParams.minPrice).toBeUndefined();
      expect(result.relaxedParams.propertyTypes).toBeUndefined();
    });
  });

  describe('canRelax', () => {
    it('should return true if has removable filters', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        provinceIds: ['VN-HN'],
        minPrice: 1000000000,
      };

      expect(service.canRelax(filters, 1)).toBe(true);
    });

    it('should return true if has area filters', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        minArea: 50,
        maxArea: 100,
      };

      expect(service.canRelax(filters, 1)).toBe(true);
    });

    it('should return true if has room filters', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        bedrooms: 3,
      };

      expect(service.canRelax(filters, 1)).toBe(true);
    });

    it('should return true if has property types', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        propertyTypes: [12, 13],
      };

      expect(service.canRelax(filters, 1)).toBe(true);
    });

    it('should return false if no removable filters', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        provinceIds: ['VN-HN'],
      };

      expect(service.canRelax(filters, 1)).toBe(false);
    });

    it('should return false for level 2 and 3 (use specific methods)', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        minPrice: 1000000000,
      };

      expect(service.canRelax(filters, 2)).toBe(false);
      expect(service.canRelax(filters, 3)).toBe(false);
    });
  });

  describe('canRelaxLevel2', () => {
    it('should return true if has district in context', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
      };

      const locationContext: LocationContext = {
        currentDistrict: {
          nId: 'VN-HN-HBT',
          slug: 'ba-dinh',
          name: 'Ba Đình',
          provinceNId: 'VN-HN',
        },
      };

      expect(service.canRelaxLevel2(filters, locationContext)).toBe(true);
    });

    it('should return true if has ward in context', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
      };

      const locationContext: LocationContext = {
        currentWard: {
          nId: 'VN-HN-HBT-PBD',
          slug: 'phuong-ba-dinh',
          name: 'Phường Ba Đình',
          districtNId: 'VN-HN-HBT',
        },
      };

      expect(service.canRelaxLevel2(filters, locationContext)).toBe(true);
    });

    it('should return false if only province in context', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
      };

      const locationContext: LocationContext = {
        currentProvince: {
          nId: 'VN-HN',
          slug: 'ha-noi',
          name: 'Hà Nội',
        },
      };

      expect(service.canRelaxLevel2(filters, locationContext)).toBe(false);
    });

    it('should return false if empty context', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
      };

      const locationContext: LocationContext = {};

      expect(service.canRelaxLevel2(filters, locationContext)).toBe(false);
    });
  });

  describe('canRelaxLevel3', () => {
    it('should return true if has province filter', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        provinceIds: ['VN-HN'],
      };

      expect(service.canRelaxLevel3(filters)).toBe(true);
    });

    it('should return true if has district filter', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        districtIds: ['VN-HN-HBT'],
      };

      expect(service.canRelaxLevel3(filters)).toBe(true);
    });

    it('should return true if has ward filter', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        wardIds: ['VN-HN-HBT-PBD'],
      };

      expect(service.canRelaxLevel3(filters)).toBe(true);
    });

    it('should return false if no location filters', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        minPrice: 1000000000,
      };

      expect(service.canRelaxLevel3(filters)).toBe(false);
    });
  });
});
