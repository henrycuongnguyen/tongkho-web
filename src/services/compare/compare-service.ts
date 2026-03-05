/**
 * Compare Service - Query property comparison data from PostgreSQL v2
 * Replaces v1 API call to compare_real_estate.json
 */

import { db } from '@/db';
import { realEstate } from '@/db/schema/real-estate';
import { propertyType } from '@/db/schema/menu';
import { inArray, eq } from 'drizzle-orm';

interface CompareProperty {
  id: string;
  title: string;
  main_image?: string;
  price?: string;
  area?: number;
  legal_docs?: string;
  house_direction?: string;
  property_type?: string;
  address?: string;
  district?: string;
  city?: string;
  bedrooms?: number;
  bathrooms?: number;
  [key: string]: any;
}

interface CompareField {
  key: string;
  label: string;
}

interface CompareData {
  real_estates: CompareProperty[];
  compare_fields: CompareField[];
}

/**
 * Standard compare fields
 */
const COMPARE_FIELDS: CompareField[] = [
  { key: 'price', label: 'Mức giá' },
  { key: 'area', label: 'Diện tích (m²)' },
  { key: 'legal_docs', label: 'Giấy tờ pháp lý' },
  { key: 'house_direction', label: 'Hướng nhà' },
  { key: 'property_type', label: 'Loại BĐS' },
  { key: 'bedrooms', label: 'Phòng ngủ' },
  { key: 'bathrooms', label: 'Phòng tắm' },
  { key: 'address', label: 'Địa chỉ' },
];

/**
 * Fetch properties from DB and format for comparison
 */
export async function getCompareData(ids: string[]): Promise<CompareData> {
  // Query properties from DB with property type join
  const properties = await db
    .select({
      id: realEstate.id,
      title: realEstate.title,
      mainImage: realEstate.mainImage,
      price: realEstate.price,
      area: realEstate.area,
      houseDirection: realEstate.houseDirection,
      propertyTypeName: propertyType.vietnamese,
      district: realEstate.district,
      city: realEstate.city,
      streetAddress: realEstate.streetAddress,
      bedrooms: realEstate.bedrooms,
      bathrooms: realEstate.bathrooms,
      dataJson: realEstate.dataJson,
    })
    .from(realEstate)
    .leftJoin(propertyType, eq(realEstate.propertyTypeId, propertyType.id))
    .where(inArray(realEstate.id, ids.map(id => parseInt(id, 10))));

  // Map to compare format
  const compareProperties: CompareProperty[] = properties.map(p => {
    // Extract legal docs from dataJson if available
    const legalDocs = (p.dataJson as any)?.legal_document_name ||
                     (p.dataJson as any)?.legalDocumentName ||
                     'Chưa có thông tin';

    // Build full address
    const addressParts = [
      p.streetAddress,
      p.district,
      p.city
    ].filter(Boolean);

    return {
      id: String(p.id),
      title: p.title || 'Không có tiêu đề',
      main_image: p.mainImage || undefined,
      price: p.price || '0 triệu',
      area: p.area ? Number(p.area) : 0,
      legal_docs: legalDocs,
      house_direction: p.houseDirection || 'Không xác định',
      property_type: p.propertyTypeName || 'Không xác định',
      address: addressParts.join(', '),
      district: p.district || '',
      city: p.city || '',
      bedrooms: p.bedrooms || 0,
      bathrooms: p.bathrooms || 0,
    };
  });

  return {
    real_estates: compareProperties,
    compare_fields: COMPARE_FIELDS,
  };
}
