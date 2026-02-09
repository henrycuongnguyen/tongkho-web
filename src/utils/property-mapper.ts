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
 * Determine price unit based on price value and transaction type
 */
function determinePriceUnit(price: number, transactionType?: number): PriceUnit {
  if (transactionType === 2) {
    return 'per_month';
  }

  if (price >= 1_000_000_000) {
    return 'billion';
  }

  return 'million';
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
  const priceUnit = determinePriceUnit(doc.price, doc.transaction_type);

  return {
    id: doc.id.toString(),
    title: doc.title || '',
    slug: doc.slug || '',
    type: mapPropertyType(doc.property_type_name, doc.property_type_id),
    transactionType,
    price: doc.price || 0,
    priceUnit,
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
