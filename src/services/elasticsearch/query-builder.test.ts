import { describe, it, expect } from 'vitest';
import { buildPropertyQuery } from './query-builder';
import type { PropertySearchFilters } from './types';

describe('Query Builder - v1 Parity Tests', () => {
  describe('Basic Filters', () => {
    it('should build query with transaction type only', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1, // mua bán
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.query.bool.must).toContainEqual({ term: { transaction_type: 1 } });
      expect(query._source).toContain('id');
      expect(query._source).toContain('title');
      expect(query.query.bool.filter).toContainEqual({ term: { aactive: true } });
    });

    it('should include v1-compatible filters for real estate', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
      };

      const query = buildPropertyQuery(filters) as any;

      // Check for is_featured condition
      expect(JSON.stringify(query.query.bool.must)).toContain('is_featured');

      // Check for created_time filter
      expect(JSON.stringify(query.query.bool.must)).toContain('created_time');

      // Check for status_id condition
      expect(JSON.stringify(query.query.bool.must)).toContain('status_id');
    });

    it('should NOT include v1-compatible filters for project index (transaction_type=3)', () => {
      const filters: PropertySearchFilters = {
        transactionType: 3,
      };

      const query = buildPropertyQuery(filters) as any;

      // Should use PROJECT_SOURCE_FIELDS
      expect(query._source).toContain('project_name');
      expect(query._source).toContain('project_code');

      // Should NOT include is_featured condition (projects have different logic)
      const mustString = JSON.stringify(query.query.bool.must);
      expect(mustString).not.toContain('source_post');
    });
  });

  describe('Property Type Filters', () => {
    it('should filter by single property type', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        propertyTypes: [12],
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.query.bool.must).toContainEqual({
        terms: { property_type_id: [12] }
      });
    });

    it('should filter by multiple property types', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        propertyTypes: [12, 13, 14],
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.query.bool.must).toContainEqual({
        terms: { property_type_id: [12, 13, 14] }
      });
    });

    it('should not add property type filter when empty array', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        propertyTypes: [],
      };

      const query = buildPropertyQuery(filters) as any;

      const hasPropertyTypeFilter = query.query.bool.must.some(
        (clause: any) => clause.terms?.property_type_id !== undefined
      );
      expect(hasPropertyTypeFilter).toBe(false);
    });
  });

  describe('Location Filters', () => {
    it('should prioritize districts over provinces', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        provinceIds: ['VN-HN', 'VN-SG'],
        districtIds: ['VN-HN-HBT', 'VN-HN-HKM'],
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.query.bool.must).toContainEqual({
        terms: { district_id: ['VN-HN-HBT', 'VN-HN-HKM'] }
      });

      const hasProvinceFilter = query.query.bool.must.some(
        (clause: any) => clause.terms?.province_id !== undefined
      );
      expect(hasProvinceFilter).toBe(false);
    });

    it('should use province filter when no districts specified', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        provinceIds: ['VN-HN', 'VN-SG'],
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.query.bool.must).toContainEqual({
        terms: { province_id: ['VN-HN', 'VN-SG'] }
      });
    });

    it('should not add location filter when both are empty', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
      };

      const query = buildPropertyQuery(filters) as any;

      const hasLocationFilter = query.query.bool.must.some(
        (clause: any) =>
          clause.terms?.province_id !== undefined ||
          clause.terms?.district_id !== undefined
      );
      expect(hasLocationFilter).toBe(false);
    });
  });

  describe('Price Filters - v1 Compatible', () => {
    it('should use min_price field with gte for min price', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        minPrice: 1_000_000_000, // 1 billion VND
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.query.bool.must).toContainEqual({
        range: { min_price: { gte: 1_000_000_000 } }
      });
    });

    it('should use min_price field with lt (not lte) for max price', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        maxPrice: 2_000_000_000,
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.query.bool.must).toContainEqual({
        range: { min_price: { lt: 2_000_000_000 } }
      });
    });

    it('should combine min and max price filters', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        minPrice: 1_000_000_000,
        maxPrice: 2_000_000_000,
      };

      const query = buildPropertyQuery(filters) as any;

      const hasBothFilters = query.query.bool.must.some(
        (clause: any) => clause.range?.min_price?.gte === 1_000_000_000
      ) && query.query.bool.must.some(
        (clause: any) => clause.range?.min_price?.lt === 2_000_000_000
      );

      expect(hasBothFilters).toBe(true);
    });

    it('should check min_price field exists', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        minPrice: 500_000_000,
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.query.bool.must).toContainEqual({
        exists: { field: 'min_price' }
      });
    });

    it('should ignore zero or negative prices', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        minPrice: 0,
        maxPrice: -100,
      };

      const query = buildPropertyQuery(filters) as any;

      const hasPriceFilter = query.query.bool.must.some(
        (clause: any) => clause.range?.min_price !== undefined
      );
      expect(hasPriceFilter).toBe(false);
    });

    it('should ignore unrealistic max price', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        maxPrice: 1_000_000_000_000,
      };

      const query = buildPropertyQuery(filters) as any;

      const hasPriceFilter = query.query.bool.must.some(
        (clause: any) => clause.range?.min_price?.lt !== undefined
      );
      expect(hasPriceFilter).toBe(false);
    });
  });

  describe('Area Filters', () => {
    it('should filter by min area', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        minArea: 50,
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.query.bool.must).toContainEqual({
        range: { area: { gte: 50 } }
      });
    });

    it('should filter by max area', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        maxArea: 200,
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.query.bool.must).toContainEqual({
        range: { area: { lte: 200 } }
      });
    });

    it('should combine min and max area', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        minArea: 50,
        maxArea: 200,
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.query.bool.must).toContainEqual({
        range: { area: { gte: 50, lte: 200 } }
      });
    });

    it('should ignore zero or negative areas', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        minArea: 0,
        maxArea: -50,
      };

      const query = buildPropertyQuery(filters) as any;

      const hasAreaFilter = query.query.bool.must.some(
        (clause: any) => clause.range?.area !== undefined
      );
      expect(hasAreaFilter).toBe(false);
    });

    it('should ignore unrealistic max area', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        maxArea: 1_000_000,
      };

      const query = buildPropertyQuery(filters) as any;

      const hasAreaFilter = query.query.bool.must.some(
        (clause: any) => clause.range?.area !== undefined
      );
      expect(hasAreaFilter).toBe(false);
    });
  });

  describe('Room Filters', () => {
    it('should filter by bedrooms', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        bedrooms: 3,
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.query.bool.must).toContainEqual({
        term: { bedrooms: 3 }
      });
    });

    it('should filter by bathrooms', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        bathrooms: 2,
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.query.bool.must).toContainEqual({
        term: { bathrooms: 2 }
      });
    });

    it('should ignore zero or negative rooms', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        bedrooms: 0,
        bathrooms: -1,
      };

      const query = buildPropertyQuery(filters) as any;

      const hasRoomFilter = query.query.bool.must.some(
        (clause: any) =>
          clause.term?.bedrooms !== undefined ||
          clause.term?.bathrooms !== undefined
      );
      expect(hasRoomFilter).toBe(false);
    });
  });

  describe('Keyword Search', () => {
    it('should build multi_match query for keyword', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        keyword: 'nhà đẹp',
      };

      const query = buildPropertyQuery(filters) as any;

      const multiMatchClause = query.query.bool.must.find(
        (clause: any) => clause.multi_match !== undefined
      );

      expect(multiMatchClause).toBeDefined();
      expect(multiMatchClause?.multi_match?.query).toBe('nhà đẹp');
      expect(multiMatchClause?.multi_match?.type).toBe('best_fields');
      expect(multiMatchClause?.multi_match?.fuzziness).toBe('AUTO');
    });

    it('should search correct fields', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        keyword: 'test',
      };

      const query = buildPropertyQuery(filters) as any;

      const multiMatchClause = query.query.bool.must.find(
        (clause: any) => clause.multi_match !== undefined
      );

      expect(multiMatchClause?.multi_match?.fields).toContain('title^2');
      expect(multiMatchClause?.multi_match?.fields).toContain('address');
      expect(multiMatchClause?.multi_match?.fields).toContain('street_address');
      expect(multiMatchClause?.multi_match?.fields).toContain('description');
    });

    it('should trim whitespace from keyword', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        keyword: '  nhà đẹp  ',
      };

      const query = buildPropertyQuery(filters) as any;

      const multiMatchClause = query.query.bool.must.find(
        (clause: any) => clause.multi_match !== undefined
      );

      expect(multiMatchClause?.multi_match?.query).toBe('nhà đẹp');
    });

    it('should ignore empty keyword', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        keyword: '   ',
      };

      const query = buildPropertyQuery(filters) as any;

      const hasKeywordFilter = query.query.bool.must.some(
        (clause: any) => clause.multi_match !== undefined
      );
      expect(hasKeywordFilter).toBe(false);
    });
  });

  describe('Radius Search', () => {
    it('should build geo_distance query', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        radius: 5,
        centerLat: 21.0285,
        centerLon: 105.8542,
      };

      const query = buildPropertyQuery(filters) as any;

      const geoDistanceClause = query.query.bool.must.find(
        (clause: any) => clause.geo_distance !== undefined
      );

      expect(geoDistanceClause).toBeDefined();
      expect(geoDistanceClause?.geo_distance?.distance).toBe('5km');
      expect(geoDistanceClause?.geo_distance?.location?.lat).toBe(21.0285);
      expect(geoDistanceClause?.geo_distance?.location?.lon).toBe(105.8542);
    });

    it('should ignore radius without center coordinates', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        radius: 5,
      };

      const query = buildPropertyQuery(filters) as any;

      const hasGeoDistance = query.query.bool.must.some(
        (clause: any) => clause.geo_distance !== undefined
      );
      expect(hasGeoDistance).toBe(false);
    });
  });

  describe('Sorting', () => {
    it('should sort by newest (created_on desc)', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        sort: 'newest',
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.sort).toContainEqual({ created_on: 'desc' });
    });

    it('should sort by oldest (created_on asc)', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        sort: 'oldest',
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.sort).toContainEqual({ created_on: 'asc' });
    });

    it('should sort by price ascending', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        sort: 'price_asc',
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.sort[0]).toEqual({ price: 'asc' });
      expect(query.sort[1]).toEqual({ created_on: 'desc' });
    });

    it('should sort by price descending', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        sort: 'price_desc',
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.sort[0]).toEqual({ price: 'desc' });
      expect(query.sort[1]).toEqual({ created_on: 'desc' });
    });

    it('should sort by area ascending', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        sort: 'area_asc',
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.sort[0]).toEqual({ area: 'asc' });
      expect(query.sort[1]).toEqual({ created_on: 'desc' });
    });

    it('should sort by area descending', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        sort: 'area_desc',
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.sort[0]).toEqual({ area: 'desc' });
      expect(query.sort[1]).toEqual({ created_on: 'desc' });
    });

    it('should default to newest sort', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.sort).toContainEqual({ created_on: 'desc' });
    });
  });

  describe('Pagination', () => {
    it('should calculate correct offset for page 1', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        page: 1,
        pageSize: 24,
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.from).toBe(0);
      expect(query.size).toBe(24);
    });

    it('should calculate correct offset for page 2', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        page: 2,
        pageSize: 24,
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.from).toBe(24);
      expect(query.size).toBe(24);
    });

    it('should use default pagination values', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.from).toBe(0);
      expect(query.size).toBe(24);
    });

    it('should respect custom page size', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        pageSize: 50,
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.size).toBe(50);
    });
  });

  describe('Source Fields', () => {
    it('should return correct source fields for real_estate', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query._source).toContain('id');
      expect(query._source).toContain('title');
      expect(query._source).toContain('is_featured');
      expect(query._source).toContain('created_time');
      expect(query._source).not.toContain('project_name');
    });

    it('should return correct source fields for project index', () => {
      const filters: PropertySearchFilters = {
        transactionType: 3,
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query._source).toContain('project_name');
      expect(query._source).toContain('project_code');
      expect(query._source).toContain('project_area');
      expect(query._source).not.toContain('description');
    });
  });

  describe('v1 Compatible Filters (Real Estate Only)', () => {
    describe('is_featured Logic', () => {
      it('should require is_featured=true for CMS posts', () => {
        const filters: PropertySearchFilters = {
          transactionType: 1,
        };

        const query = buildPropertyQuery(filters) as any;

        const isFeaturedClause = query.query.bool.must.find(
          (clause: any) => clause.bool?.should !== undefined
        );

        expect(isFeaturedClause).toBeDefined();

        // Should have condition for CMS posts with is_featured=true
        const cmsCondition = isFeaturedClause?.bool?.should?.find((s: any) =>
          s.bool?.must?.some((m: any) => m.term?.source_post === 'cms')
        );

        expect(cmsCondition).toBeDefined();
        expect(cmsCondition?.bool?.must).toContainEqual({ term: { is_featured: true } });
      });

      it('should allow is_featured=false or missing for external posts', () => {
        const filters: PropertySearchFilters = {
          transactionType: 1,
        };

        const query = buildPropertyQuery(filters) as any;

        const isFeaturedClause = query.query.bool.must.find(
          (clause: any) => clause.bool?.should !== undefined
        );

        const externalCondition = isFeaturedClause?.bool?.should?.find((s: any) =>
          s.bool?.must_not?.some((mn: any) => mn.term?.source_post === 'cms')
        );

        expect(externalCondition).toBeDefined();
      });
    });

    describe('created_time Filter', () => {
      it('should exclude future-dated properties', () => {
        const filters: PropertySearchFilters = {
          transactionType: 1,
        };

        const query = buildPropertyQuery(filters) as any;

        expect(query.query.bool.must).toContainEqual({
          range: { created_time: { lt: 'now' } }
        });
      });

      it('should check created_time field exists', () => {
        const filters: PropertySearchFilters = {
          transactionType: 1,
        };

        const query = buildPropertyQuery(filters) as any;

        expect(query.query.bool.must).toContainEqual({
          exists: { field: 'created_time' }
        });
      });
    });

    describe('status_id Filter', () => {
      it('should exclude status_id=3 or allow missing status', () => {
        const filters: PropertySearchFilters = {
          transactionType: 1,
        };

        const query = buildPropertyQuery(filters) as any;

        const statusClause = query.query.bool.must.find(
          (clause: any) =>
            clause.bool?.should !== undefined &&
            JSON.stringify(clause).includes('status_id')
        );

        expect(statusClause).toBeDefined();

        // Should have condition to exclude status_id=3
        const excludeStatus3 = statusClause?.bool?.should?.find((s: any) =>
          s.bool?.must_not?.some((mn: any) => mn.term?.status_id === 3)
        );

        expect(excludeStatus3).toBeDefined();
      });
    });

    describe('property_type_id exists Filter', () => {
      it('should check property_type_id field exists', () => {
        const filters: PropertySearchFilters = {
          transactionType: 1,
        };

        const query = buildPropertyQuery(filters) as any;

        expect(query.query.bool.must).toContainEqual({
          exists: { field: 'property_type_id' }
        });
      });
    });
  });

  describe('Active Filter', () => {
    it('should always filter by aactive=true', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.query.bool.filter).toContainEqual({
        term: { aactive: true }
      });
    });
  });

  describe('Complex Scenarios', () => {
    it('should combine all filters correctly', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
        propertyTypes: [12, 13],
        provinceIds: ['VN-HN'],
        minPrice: 1_000_000_000,
        maxPrice: 2_000_000_000,
        minArea: 50,
        maxArea: 100,
        bedrooms: 3,
        bathrooms: 2,
        keyword: 'nhà đẹp',
        sort: 'price_asc',
        page: 2,
        pageSize: 20,
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.query.bool.must.length).toBeGreaterThan(0);
      expect(query.from).toBe(20);
      expect(query.size).toBe(20);
      expect(query.sort[0]).toEqual({ price: 'asc' });
    });

    it('should handle rental properties (transaction_type=2)', () => {
      const filters: PropertySearchFilters = {
        transactionType: 2,
        propertyTypes: [12],
        minPrice: 5_000_000,
        maxPrice: 20_000_000,
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.query.bool.must).toContainEqual({
        term: { transaction_type: 2 }
      });
    });

    it('should handle project properties (transaction_type=3)', () => {
      const filters: PropertySearchFilters = {
        transactionType: 3,
        minPrice: 1_000_000_000,
      };

      const query = buildPropertyQuery(filters) as any;

      // Should NOT have transaction_type filter for projects
      const hasTransactionTypeFilter = query.query.bool.must.some(
        (clause: any) => clause.term?.transaction_type !== undefined
      );
      expect(hasTransactionTypeFilter).toBe(false);

      // Should use project source fields
      expect(query._source).toContain('project_name');
    });
  });

  describe('Track Total Hits', () => {
    it('should enable track_total_hits for accurate counting', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
      };

      const query = buildPropertyQuery(filters) as any;

      expect(query.track_total_hits).toBe(true);
    });
  });

  describe('Query Structure Validation', () => {
    it('should have valid ES query structure', () => {
      const filters: PropertySearchFilters = {
        transactionType: 1,
      };

      const query = buildPropertyQuery(filters) as any;

      // Check top-level structure
      expect(query).toHaveProperty('query');
      expect(query).toHaveProperty('from');
      expect(query).toHaveProperty('size');
      expect(query).toHaveProperty('sort');
      expect(query).toHaveProperty('_source');
      expect(query).toHaveProperty('track_total_hits');

      // Check query structure
      expect(query.query).toHaveProperty('bool');
      expect(query.query.bool).toHaveProperty('must');
      expect(Array.isArray(query.query.bool.must)).toBe(true);

      // Check filter structure
      expect(Array.isArray(query.query.bool.filter)).toBe(true);

      // Check sort structure
      expect(Array.isArray(query.sort)).toBe(true);

      // Check _source structure
      expect(Array.isArray(query._source)).toBe(true);
    });
  });
});
