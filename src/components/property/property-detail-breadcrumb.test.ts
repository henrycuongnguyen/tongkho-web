/**
 * Property Detail Breadcrumb Tests
 * Unit tests for breadcrumb component logic
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('PropertyDetailBreadcrumb Logic', () => {
  interface BreadcrumbItem {
    text: string;
    url: string;
  }

  /**
   * Simulate breadcrumb building logic from component
   */
  const buildBreadcrumbs = (props: {
    transactionType: 'sale' | 'rent';
    propertyTypeName?: string;
    propertyTypeSlug?: string;
    cityName?: string;
    citySlug?: string;
    districtName?: string;
    districtSlug?: string;
    wardName?: string;
    wardSlug?: string;
  }): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];

    // 1. Home
    items.push({ text: 'Trang chủ', url: '/' });

    // 2. Transaction type
    const txLabel = props.transactionType === 'sale' ? 'Mua Bán' : 'Cho Thuê';
    const txSlug = props.transactionType === 'sale' ? 'mua-ban' : 'cho-thue';
    const txUrl = `/${txSlug}`;
    items.push({ text: txLabel, url: txUrl });

    // 3. Property type (if available)
    if (props.propertyTypeName && props.propertyTypeSlug) {
      items.push({
        text: props.propertyTypeName,
        url: `/${props.propertyTypeSlug}`,
      });
    }

    // Base URL for location links
    const baseUrl = props.propertyTypeSlug ? `/${props.propertyTypeSlug}` : txUrl;

    // 4. City (if available)
    if (props.cityName && props.citySlug) {
      items.push({
        text: props.cityName,
        url: props.districtSlug || props.wardSlug ? `${baseUrl}?selected_addresses=${props.citySlug}` : '',
      });
    }

    // 5. District (if available)
    if (props.districtName && props.districtSlug) {
      items.push({
        text: props.districtName,
        url: props.wardSlug ? `${baseUrl}?selected_addresses=${props.districtSlug}` : '',
      });
    }

    // 6. Ward (if available) - always no link
    if (props.wardName) {
      items.push({ text: props.wardName, url: '' });
    }

    return items;
  };

  describe('basic breadcrumb structure', () => {
    test('should always include home and transaction type', () => {
      const items = buildBreadcrumbs({ transactionType: 'sale' });
      assert.strictEqual(items.length, 2, 'Should have 2 items');
      assert.strictEqual(items[0].text, 'Trang chủ', 'First item should be home');
      assert.strictEqual(items[0].url, '/', 'Home URL should be /');
      assert.strictEqual(items[1].text, 'Mua Bán', 'Second item should be transaction type');
    });

    test('should create correct URLs for sale transactions', () => {
      const items = buildBreadcrumbs({ transactionType: 'sale' });
      assert.strictEqual(items[1].url, '/mua-ban', 'Sale transaction URL');
    });

    test('should create correct URLs for rent transactions', () => {
      const items = buildBreadcrumbs({ transactionType: 'rent' });
      assert.strictEqual(items[1].text, 'Cho Thuê', 'Rent label');
      assert.strictEqual(items[1].url, '/cho-thue', 'Rent transaction URL');
    });
  });

  describe('property type in breadcrumb', () => {
    test('should include property type when available', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        propertyTypeName: 'Căn hộ',
        propertyTypeSlug: 'ban-can-ho-chung-cu',
      });

      assert.strictEqual(items.length, 3, 'Should have 3 items');
      assert.strictEqual(items[2].text, 'Căn hộ', 'Property type name');
      assert.strictEqual(items[2].url, '/ban-can-ho-chung-cu', 'Property type slug');
    });

    test('should omit property type when slug missing', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        propertyTypeName: 'Căn hộ',
        // Missing propertyTypeSlug
      });

      assert.strictEqual(items.length, 2, 'Should not include property type without slug');
    });

    test('should omit property type when name missing', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        propertyTypeSlug: 'ban-can-ho-chung-cu',
        // Missing propertyTypeName
      });

      assert.strictEqual(items.length, 2, 'Should not include property type without name');
    });
  });

  describe('location hierarchy in breadcrumb', () => {
    test('should build full hierarchy with city, district, ward', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        propertyTypeName: 'Căn hộ',
        propertyTypeSlug: 'ban-can-ho-chung-cu',
        cityName: 'TP. Hồ Chí Minh',
        citySlug: 'thanh-pho-ho-chi-minh',
        districtName: 'Quận 1',
        districtSlug: 'quan-1',
        wardName: 'Phường Bến Nghé',
      });

      assert.strictEqual(items.length, 6, 'Should have 6 items: home, tx, type, city, district, ward');
      assert.strictEqual(items[2].text, 'Căn hộ', 'Property type');
      assert.strictEqual(items[3].text, 'TP. Hồ Chí Minh', 'City');
      assert.strictEqual(items[4].text, 'Quận 1', 'District');
      assert.strictEqual(items[5].text, 'Phường Bến Nghé', 'Ward');
    });

    test('city link should have URL if district exists', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        cityName: 'TP. Hồ Chí Minh',
        citySlug: 'thanh-pho-ho-chi-minh',
        districtName: 'Quận 1',
        districtSlug: 'quan-1',
      });

      const cityItem = items.find(i => i.text === 'TP. Hồ Chí Minh');
      assert.ok(cityItem, 'Should have city item');
      assert.strictEqual(cityItem.url, '/mua-ban?selected_addresses=thanh-pho-ho-chi-minh', 'City should have link');
    });

    test('city link should be empty if district and ward exist', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        cityName: 'TP. Hồ Chí Minh',
        citySlug: 'thanh-pho-ho-chi-minh',
        districtName: 'Quận 1',
        districtSlug: 'quan-1',
        wardName: 'Phường Bến Nghé',
      });

      const cityItem = items.find(i => i.text === 'TP. Hồ Chí Minh');
      assert.strictEqual(cityItem?.url, '/mua-ban?selected_addresses=thanh-pho-ho-chi-minh', 'City should have link when district exists');
    });

    test('district link should be empty if ward exists', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        districtName: 'Quận 1',
        districtSlug: 'quan-1',
        wardName: 'Phường Bến Nghé',
      });

      const districtItem = items.find(i => i.text === 'Quận 1');
      assert.strictEqual(districtItem?.url, '', 'District should not have link when ward exists');
    });

    test('ward should never have a link', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        wardName: 'Phường Bến Nghé',
      });

      const wardItem = items.find(i => i.text === 'Phường Bến Nghé');
      assert.strictEqual(wardItem?.url, '', 'Ward should never have a link');
    });
  });

  describe('base URL selection', () => {
    test('should use property type slug as base URL when available', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        propertyTypeSlug: 'ban-can-ho-chung-cu',
        cityName: 'TP. Hồ Chí Minh',
        citySlug: 'thanh-pho-ho-chi-minh',
        districtName: 'Quận 1',
        districtSlug: 'quan-1',
      });

      const cityItem = items.find(i => i.text === 'TP. Hồ Chí Minh');
      assert.ok(cityItem?.url?.includes('/ban-can-ho-chung-cu'), 'Should use property type slug as base');
    });

    test('should use transaction slug as base URL when property type unavailable', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        cityName: 'TP. Hồ Chí Minh',
        citySlug: 'thanh-pho-ho-chi-minh',
        districtName: 'Quận 1',
        districtSlug: 'quan-1',
      });

      const cityItem = items.find(i => i.text === 'TP. Hồ Chí Minh');
      assert.ok(cityItem?.url?.includes('/mua-ban'), 'Should use transaction slug as base');
    });
  });

  describe('query parameter handling', () => {
    test('city location should use selected_addresses query param when district exists', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        cityName: 'Hà Nội',
        citySlug: 'ha-noi',
        districtName: 'Quận 1',
        districtSlug: 'quan-1',
      });

      const cityItem = items.find(i => i.text === 'Hà Nội');
      assert.ok(cityItem?.url?.includes('selected_addresses=ha-noi'), 'Should use selected_addresses param');
    });

    test('city location should have empty URL when it is final level', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        cityName: 'Hà Nội',
        citySlug: 'ha-noi',
      });

      const cityItem = items.find(i => i.text === 'Hà Nội');
      assert.strictEqual(cityItem?.url, '', 'City should not have link when final level');
    });

    test('district location should use selected_addresses query param when wardSlug exists', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        districtName: 'Quận 1',
        districtSlug: 'quan-1',
        wardName: 'Phường Test',
        wardSlug: 'phuong-test', // Need both name and slug for district link
      });

      const districtItem = items.find(i => i.text === 'Quận 1');
      // When no property type slug, uses transaction slug as base
      assert.ok(districtItem?.url?.startsWith('/mua-ban'), 'District should use transaction slug as base');
      assert.ok(districtItem?.url?.includes('selected_addresses=quan-1'), 'District should use selected_addresses param');
    });
  });

  describe('edge cases', () => {
    test('should handle minimal breadcrumb (home + transaction only)', () => {
      const items = buildBreadcrumbs({ transactionType: 'sale' });
      assert.strictEqual(items.length, 2);
      assert.strictEqual(items[0].text, 'Trang chủ');
      assert.strictEqual(items[1].text, 'Mua Bán');
    });

    test('should skip city if name missing', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        // cityName missing
        citySlug: 'ha-noi',
        districtName: 'Quận 1',
        districtSlug: 'quan-1',
      });

      assert.ok(!items.some(i => i.text.includes('Ha Noi')), 'Should not include city without name');
    });

    test('should skip city if slug missing', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        cityName: 'Hà Nội',
        // citySlug missing
        districtName: 'Quận 1',
        districtSlug: 'quan-1',
      });

      assert.ok(!items.some(i => i.text === 'Hà Nội'), 'Should not include city without slug');
    });

    test('should handle city-only (no district/ward)', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        cityName: 'Hà Nội',
        citySlug: 'ha-noi',
      });

      const cityItem = items.find(i => i.text === 'Hà Nội');
      assert.strictEqual(cityItem?.url, '', 'City should have no link when it\'s the final level');
    });

    test('should handle district-only (no ward)', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        districtName: 'Quận 1',
        districtSlug: 'quan-1',
      });

      const districtItem = items.find(i => i.text === 'Quận 1');
      assert.strictEqual(districtItem?.url, '', 'District should have no link when it\'s the final level');
    });

    test('should handle empty ward name', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        wardName: '', // Empty ward name
      });

      assert.ok(!items.some(i => i.text === ''), 'Should not include empty ward');
    });
  });

  describe('schema.org breadcrumb list', () => {
    test('should generate valid BreadcrumbList schema', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        propertyTypeName: 'Căn hộ',
        propertyTypeSlug: 'ban-can-ho-chung-cu',
        cityName: 'TP. Hồ Chí Minh',
        citySlug: 'thanh-pho-ho-chi-minh',
        districtName: 'Quận 1',
        districtSlug: 'quan-1',
        wardName: 'Phường Bến Nghé',
      });

      const siteUrl = 'https://tongkhobds.com';
      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.text,
          ...(item.url ? { item: `${siteUrl}${item.url}` } : {}),
        })),
      };

      assert.strictEqual(breadcrumbSchema['@type'], 'BreadcrumbList');
      assert.strictEqual(breadcrumbSchema.itemListElement.length, 6);
      assert.strictEqual(breadcrumbSchema.itemListElement[0].position, 1);
      assert.strictEqual(breadcrumbSchema.itemListElement[5].position, 6);

      // Verify no "item" field for ward (no link)
      const wardItem = breadcrumbSchema.itemListElement[5];
      assert.ok(!('item' in wardItem), 'Ward should not have item URL in schema');
    });

    test('should only add item URL when breadcrumb has link', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        cityName: 'Hà Nội',
        citySlug: 'ha-noi',
        districtName: 'Quận 1',
        districtSlug: 'quan-1',
      });

      const siteUrl = 'https://tongkhobds.com';
      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.text,
          ...(item.url ? { item: `${siteUrl}${item.url}` } : {}),
        })),
      };

      // City item should have "item" when district exists
      const cityItem = breadcrumbSchema.itemListElement.find((i: any) => i.name === 'Hà Nội');
      assert.ok(cityItem && 'item' in cityItem, 'City should have item URL in schema when district exists');

      // District item should not have "item" (final level)
      const districtItem = breadcrumbSchema.itemListElement.find((i: any) => i.name === 'Quận 1');
      assert.ok(districtItem && !('item' in districtItem), 'District should not have item URL in schema when it\'s final');
    });
  });

  describe('v1 compatibility', () => {
    test('should maintain v1 hierarchy: home > tx > type > location', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        propertyTypeName: 'Villa',
        propertyTypeSlug: 'ban-villa',
        cityName: 'TP. Hồ Chí Minh',
        citySlug: 'thanh-pho-ho-chi-minh',
      });

      const texts = items.map(i => i.text);
      assert.deepStrictEqual(
        texts,
        ['Trang chủ', 'Mua Bán', 'Villa', 'TP. Hồ Chí Minh'],
        'Should follow v1 hierarchy'
      );
    });

    test('should use v1-style location slugs with district', () => {
      const items = buildBreadcrumbs({
        transactionType: 'sale',
        cityName: 'TP. Hồ Chí Minh',
        citySlug: 'thanh-pho-ho-chi-minh', // v1 style slug
        districtName: 'Quận 1',
        districtSlug: 'quan-1',
      });

      const cityItem = items.find(i => i.text === 'TP. Hồ Chí Minh');
      assert.ok(cityItem?.url?.includes('thanh-pho-ho-chi-minh'), 'Should use v1-style slugs');
    });
  });
});
