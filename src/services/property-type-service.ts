/**
 * Property Type Service
 * Provides property type data with ID-to-slug mapping for URL building
 */

import { db } from "@/db";
import { propertyType } from "@/db/schema/menu";
import { eq, and, asc } from "drizzle-orm";

export interface PropertyTypeWithSlug {
  id: number;
  title: string;
  slug: string;
  transactionType: number;
  vietnamese: string | null;
  value: string; // For form inputs (stringified ID)
  label: string; // For display (Vietnamese name)
  dataSlug: string; // Full slug with transaction prefix (e.g., "ban-can-ho-chung-cu")
}

/**
 * Fetch all active property types by transaction type
 * @param transactionType - 1 = Mua bán, 2 = Cho thuê, 3 = Dự án
 */
export async function getPropertyTypesByTransaction(
  transactionType: number
): Promise<PropertyTypeWithSlug[]> {
  try {
    const results = await db
      .select({
        id: propertyType.id,
        title: propertyType.title,
        slug: propertyType.slug,
        transactionType: propertyType.transactionType,
        vietnamese: propertyType.vietnamese,
        aactive: propertyType.aactive,
      })
      .from(propertyType)
      .where(
        and(
          eq(propertyType.aactive, true),
          eq(propertyType.transactionType, transactionType)
        )
      )
      .orderBy(asc(propertyType.id));

    return results.map((row) => ({
      id: row.id,
      title: row.title || "",
      slug: row.slug || "",
      transactionType: row.transactionType || transactionType,
      vietnamese: row.vietnamese,
      value: String(row.id), // Stringified for form inputs
      label: row.vietnamese || row.title || "",
      dataSlug: row.slug || "", // Full slug from database
    }));
  } catch (error) {
    console.error(
      `[PropertyTypeService] Error fetching property types for transaction ${transactionType}:`,
      error
    );
    return [];
  }
}

/**
 * Get all property types for all transaction types
 * Useful for building a complete ID-to-slug map
 */
export async function getAllPropertyTypes(): Promise<PropertyTypeWithSlug[]> {
  try {
    const results = await db
      .select({
        id: propertyType.id,
        title: propertyType.title,
        slug: propertyType.slug,
        transactionType: propertyType.transactionType,
        vietnamese: propertyType.vietnamese,
        aactive: propertyType.aactive,
      })
      .from(propertyType)
      .where(eq(propertyType.aactive, true))
      .orderBy(asc(propertyType.id));

    return results.map((row) => ({
      id: row.id,
      title: row.title || "",
      slug: row.slug || "",
      transactionType: row.transactionType || 1,
      vietnamese: row.vietnamese,
      value: String(row.id),
      label: row.vietnamese || row.title || "",
      dataSlug: row.slug || "",
    }));
  } catch (error) {
    console.error("[PropertyTypeService] Error fetching all property types:", error);
    return [];
  }
}

/**
 * Build property type slug map (ID -> slug) for client-side use
 */
export function buildPropertyTypeSlugMap(
  propertyTypes: PropertyTypeWithSlug[]
): Record<string, string> {
  const map: Record<string, string> = {};
  propertyTypes.forEach((pt) => {
    map[pt.value] = pt.dataSlug;
  });
  return map;
}
