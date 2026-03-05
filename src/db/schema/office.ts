import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  timestamp,
  bigserial,
  text,
} from 'drizzle-orm/pg-core';

/**
 * Post Office table schema for network/maps page
 * Stores TongKhoBDS office locations with coordinates for map display
 *
 * office_level: 1=Vùng, 2=Tỉnh, 3=Huyện, 4=Xã, 5=Tổ
 * status: 1=Active, 2=Pending, 3=Suspended, 4=Closed, 9=Deleted
 */
export const postOffice = pgTable('post_office', {
  id: serial('id').primaryKey(),
  parentId: integer('parent_id'),
  officeLevel: integer('office_level').default(2),
  name: varchar('name', { length: 200 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 100 }),
  address: varchar('address', { length: 200 }),
  city: varchar('city', { length: 20 }),
  district: varchar('district', { length: 20 }),
  ward: varchar('ward', { length: 20 }),
  cityName: varchar('city_name', { length: 255 }),
  districtName: varchar('district_name', { length: 255 }),
  wardName: varchar('ward_name', { length: 255 }),
  addressLatitude: varchar('address_latitude', { length: 20 }),
  addressLongitude: varchar('address_longitude', { length: 20 }),
  timeWork: varchar('time_work', { length: 250 }),
  status: integer('status').default(1),
  aactive: boolean('aactive').default(true),
  createdOn: timestamp('created_on'),
  updatedOn: timestamp('updated_on'),
});

/**
 * Info Office table schema
 * Stores company information for each office (Bên A trong hợp đồng)
 */
export const infoOffice = pgTable('info_office', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  postOfficeId: integer('post_office_id'),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  businessCode: varchar('business_code', { length: 255 }),
  companyAddress: text('company_address'),
  bank: integer('bank'),
  bankName: varchar('bank_name', { length: 255 }),
  bankAccountNumber: varchar('bank_account_number', { length: 255 }),
  bankBranch: varchar('bank_branch', { length: 255 }),
  companyRepresentative: varchar('company_representative', { length: 255 }),
  positionRepresentative: varchar('position_representative', { length: 255 }),
  office: varchar('office', { length: 255 }),
  officeCode: varchar('office_code'),
  signatureImage: text('signature_image'),
  authorizationNumber: varchar('authorization_number'),
  createdBy: integer('created_by'),
  createdOn: timestamp('created_on'),
});

// Type inference for TypeScript
export type PostOfficeRow = typeof postOffice.$inferSelect;
export type InfoOfficeRow = typeof infoOffice.$inferSelect;
