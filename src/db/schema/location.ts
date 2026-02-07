/**
 * Location schema for provinces/districts/wards
 * Re-export from migrations schema with alias
 */

import { pgTable, serial, varchar, boolean, timestamp, integer, numeric, bigint, index } from 'drizzle-orm/pg-core';

export const locations = pgTable("locations", {
  id: serial().primaryKey().notNull(),
  nId: varchar("n_id"),
  nParentid: varchar("n_parentid"),
  nName: varchar("n_name"),
  nLatlng: varchar("n_latlng"),
  nNormalizedname: varchar("n_normalizedname"),
  nAddress: varchar("n_address"),
  nType: varchar("n_type"),
  nLevel: varchar("n_level"),             // '0'=Province, '1'=District, '2'=Ward
  nCountry: varchar("n_country"),
  nCreateddate: varchar("n_createddate"),
  nModifieddate: varchar("n_modifieddate"),
  nStatus: varchar("n_status"),           // != '6' means active
  isPartition: varchar("is_partition"),
  cityId: varchar("city_id"),
  districtId: varchar("district_id"),
  wardId: varchar("ward_id"),
  cityName: varchar("city_name"),
  districtName: varchar("district_name"),
  wardName: varchar("ward_name"),
  totalRate: numeric("total_rate", { precision: 5, scale: 2 }).default('0.0'),
  totalAmount: bigint("total_amount", { mode: "number" }).default(0),
  rateSeller: numeric("rate_seller", { precision: 5, scale: 2 }).default('0.0'),
  amountSeller: bigint("amount_seller", { mode: "number" }).default(0),
  rateBuyer: numeric("rate_buyer", { precision: 5, scale: 2 }).default('0.0'),
  amountBuyer: bigint("amount_buyer", { mode: "number" }).default(0),
  rateProject: numeric("rate_project", { precision: 5, scale: 2 }).default('0.0'),
  amountProject: bigint("amount_project", { mode: "number" }).default(0),
  aactive: boolean().default(true),
  updateOn: timestamp("update_on", { mode: 'string' }),
  createdOn: timestamp("created_on", { mode: 'string' }),
  createdBy: integer("created_by"),
  decodeAddress: varchar("decode_address"),
  displayOrder: integer("display_order").default(100),
  nSlug: varchar("n_slug"),
  searchCount: bigint("search_count", { mode: "number" }).default(8386),
  mergedintoid: varchar(),
  nSlugV1: varchar("n_slug_v1"),
}, (table) => [
  index("idx_locations_nid").using("btree", table.nId.asc().nullsLast()),
  index("locations_n_id_idx").using("btree", table.nId.asc().nullsLast(), table.nParentid.asc().nullsLast(), table.nName.asc().nullsLast(), table.nLevel.asc().nullsLast()),
]);

export type LocationRow = typeof locations.$inferSelect;
