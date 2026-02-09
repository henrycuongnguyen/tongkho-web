/**
 * Location with property count schema
 * Materialized aggregate table for fast province/city queries with property counts
 * Mirrors V1 locations_with_count_property table
 */

import { pgTable, serial, varchar, integer, timestamp, char, index } from 'drizzle-orm/pg-core';

export const locationsWithCountProperty = pgTable("locations_with_count_property", {
  id: serial().primaryKey().notNull(),
  title: varchar({ length: 512 }),
  city: varchar({ length: 512 }),
  slug: varchar(),
  cityId: varchar("city_id", { length: 512 }),
  cityImage: varchar("city_image", { length: 512 }),
  cityImageWeb: varchar("city_image_web"),
  filename: varchar(),
  cityLatlng: varchar("city_latlng", { length: 512 }),
  cityRefId: varchar("city_ref_id", { length: 512 }),
  district: varchar({ length: 512 }),
  districtId: varchar("district_id", { length: 512 }),
  ward: varchar({ length: 512 }),
  wardId: varchar("ward_id", { length: 512 }),
  propertyCount: integer("property_count"),
  aactive: char({ length: 1 }),  // '1' = active, '0' = inactive
  displayOrder: integer("display_order"),
  createdOn: timestamp("created_on", { mode: 'string' }),
  updatedOn: timestamp("updated_on", { mode: 'string' }),
  mergedintoid: varchar(),  // Links to new location address if merged
}, (table) => [
  index("idx_locations_with_count_property_display_order").using("btree", table.displayOrder.asc().nullsLast()),
  index("idx_locations_with_count_property_mergedintoid").using("btree", table.mergedintoid.asc().nullsLast()),
]);

export type LocationWithCountRow = typeof locationsWithCountProperty.$inferSelect;
