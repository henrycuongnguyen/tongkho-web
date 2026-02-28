import { pgTable, serial, varchar, text, boolean, timestamp, integer, numeric, bigint, doublePrecision } from 'drizzle-orm/pg-core';

export const project = pgTable('project', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 512 }),
  projectName: varchar('project_name', { length: 512 }),
  projectCode: varchar('project_code', { length: 512 }),
  description: text('description'),
  projectStatus: varchar('project_status', { length: 512 }),
  legalStatus: varchar('legal_status', { length: 512 }),
  projectType: integer('project_type'),
  projectArea: doublePrecision('project_area'),
  areaUnit: varchar('area_unit', { length: 512 }),
  totalUnits: integer('total_units'),
  totalTowers: integer('total_towers'),
  utilities: text('utilities'),

  // Developer
  developer: integer('developer'),
  developerName: varchar('developer_name', { length: 512 }),
  developerLogo: text('developer_logo'),

  // Location
  city: varchar('city', { length: 512 }),
  cityId: varchar('city_id', { length: 512 }),
  district: varchar('district', { length: 512 }),
  districtId: varchar('district_id', { length: 512 }),
  ward: varchar('ward', { length: 512 }),
  wardId: varchar('ward_id', { length: 512 }),
  streetAddress: varchar('street_address', { length: 512 }),
  latitude: varchar('latitude', { length: 512 }),
  longitude: varchar('longitude', { length: 512 }),

  // Images
  mainImage: text('main_image'),
  galleryImages: text('gallery_images'),
  masterPlanImages: text('master_plan_images'),

  // Pricing
  price: integer('price'),
  priceDescription: varchar('price_description', { length: 512 }),
  pricePerMeter: integer('price_per_meter'),

  // Rates (commission)
  rateSeller: doublePrecision('rate_seller'),
  amountSeller: doublePrecision('amount_seller'),
  rateBuyer: doublePrecision('rate_buyer'),
  amountBuyer: bigint('amount_buyer', { mode: 'number' }),
  rateProject: doublePrecision('rate_project'),
  amountProject: bigint('amount_project', { mode: 'number' }),
  totalRate: numeric('total_rate', { precision: 5, scale: 2 }),
  totalAmount: bigint('total_amount', { mode: 'number' }),

  // Metadata
  isFeatured: boolean('is_featured').default(false),
  aactive: boolean('aactive').default(true),
  parentId: integer('parent_id'),
  note: varchar('note', { length: 512 }),
  sourceGet: varchar('source_get', { length: 512 }),
  createdBy: integer('created_by'),
  createdOn: timestamp('created_on'),
  updatedOn: timestamp('updated_on'),
});

export type ProjectRow = typeof project.$inferSelect;
