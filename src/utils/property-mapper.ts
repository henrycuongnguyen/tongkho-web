/**
 * Property Mapper - Convert ElasticSearch PropertyDocument to Property type
 */
import type { PropertyDocument } from '@/services/elasticsearch/types';
import type { Property, PropertyType, TransactionType, PriceUnit } from '@/types/property';

const UPLOADS_BASE_URL = 'https://quanly.tongkhobds.com';

/**
 * Get full image URL
 */
function getImageUrl(path?: string): string {
  if (!path) return '/images/placeholder-property.jpg';
  if (path.startsWith('http')) return path;
  return `${UPLOADS_BASE_URL}${path}`;
}

/**
 * Map transaction type from number to TransactionType
 */
function mapTransactionType(transactionType?: number): TransactionType {
  // 1 = sale, 2 = rent (based on v1 logic)
  if (transactionType === 2) return 'rent';
  return 'sale';
}

/**
 * Map property type from name or ID
 */
function mapPropertyType(propertyTypeName?: string, propertyTypeId?: number): PropertyType {
  // Map by name first if available
  if (propertyTypeName) {
    const lowerName = propertyTypeName.toLowerCase();
    if (lowerName.includes('căn hộ') || lowerName.includes('apartment')) return 'apartment';
    if (lowerName.includes('nhà') || lowerName.includes('house')) return 'house';
    if (lowerName.includes('biệt thự') || lowerName.includes('villa')) return 'villa';
    if (lowerName.includes('đất') || lowerName.includes('land')) return 'land';
    if (lowerName.includes('văn phòng') || lowerName.includes('office')) return 'office';
    if (lowerName.includes('shophouse')) return 'shophouse';
    if (lowerName.includes('kho') || lowerName.includes('warehouse')) return 'warehouse';
  }

  // Default fallback
  return 'apartment';
}

/**
 * Parse price from price_description or raw price value
 * Returns { displayPrice: number, unit: PriceUnit }
 *
 * Examples:
 * - "7.3 tỷ" -> { displayPrice: 7.3, unit: 'billion' }
 * - "300 triệu" -> { displayPrice: 300, unit: 'million' }
 * - "5 triệu/tháng" -> { displayPrice: 5, unit: 'per_month' }
 */
function parsePrice(
  rawPrice: number,
  priceDescription?: string,
  transactionType?: number
): { displayPrice: number; unit: PriceUnit } {
  // If price_description exists, parse it
  if (priceDescription) {
    const lowerDesc = priceDescription.toLowerCase();

    // Check for negotiable/contact
    if (lowerDesc.includes('thỏa thuận') || lowerDesc.includes('liên hệ')) {
      return { displayPrice: -1, unit: 'VND' };
    }

    // Extract number from description
    const numberMatch = priceDescription.match(/[\d,.]+/);
    if (numberMatch) {
      const numStr = numberMatch[0].replace(/,/g, '.');
      const num = parseFloat(numStr);

      // Determine unit from description
      if (lowerDesc.includes('tỷ')) {
        return { displayPrice: num, unit: 'billion' };
      }
      if (lowerDesc.includes('triệu/tháng') || lowerDesc.includes('tr/th')) {
        return { displayPrice: num, unit: 'per_month' };
      }
      if (lowerDesc.includes('triệu') || lowerDesc.includes('tr')) {
        return { displayPrice: num, unit: 'million' };
      }
    }
  }

  // Fallback: calculate from raw price (in VND)
  if (rawPrice <= 0) {
    return { displayPrice: -1, unit: 'VND' };
  }

  // For rent (transaction type 2), use per_month
  if (transactionType === 2) {
    if (rawPrice >= 1_000_000_000) {
      return { displayPrice: rawPrice / 1_000_000_000, unit: 'billion' };
    }
    return { displayPrice: Math.round(rawPrice / 1_000_000), unit: 'per_month' };
  }

  // For sale, use billion or million
  if (rawPrice >= 1_000_000_000) {
    const billions = rawPrice / 1_000_000_000;
    // Round to 1 decimal place
    return { displayPrice: Math.round(billions * 10) / 10, unit: 'billion' };
  }

  return { displayPrice: Math.round(rawPrice / 1_000_000), unit: 'million' };
}

/**
 * Parse images from string or return empty array
 */
function parseImages(images?: string): string[] {
  if (!images) return [];
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Convert PropertyDocument to Property
 */
export function mapPropertyDocumentToProperty(doc: PropertyDocument): Property {
  const transactionType = mapTransactionType(doc.transaction_type);
  const { displayPrice, unit } = parsePrice(doc.price, doc.price_description, doc.transaction_type);

  return {
    id: doc.id.toString(),
    title: doc.title || '',
    slug: doc.slug || '',
    type: mapPropertyType(doc.property_type_name, doc.property_type_id),
    transactionType,
    price: displayPrice,
    priceUnit: unit,
    area: doc.area || 0,
    bedrooms: doc.bedrooms || undefined,
    bathrooms: doc.bathrooms || undefined,
    address: doc.address || doc.street_address || '',
    district: doc.district || doc.district_name || '',
    city: doc.city || doc.city_name || '',
    description: '', // PropertyDocument doesn't have description field
    images: parseImages(doc.images),
    thumbnail: getImageUrl(doc.main_image || doc.thumbnail),
    features: [],
    createdAt: doc.created_on || new Date().toISOString(),
    isFeatured: doc.is_featured || false,
    isHot: doc.is_verified || false, // Map is_verified to isHot
  };
}

/**
 * Convert array of PropertyDocuments to Properties
 */
export function mapPropertyDocumentsToProperties(docs: PropertyDocument[]): Property[] {
  return docs.map(mapPropertyDocumentToProperty);
}
