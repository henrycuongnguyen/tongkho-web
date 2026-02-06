import { pgTable, serial, varchar, integer, boolean, char } from 'drizzle-orm/pg-core';

/**
 * Property Type table schema for menu generation
 * Used to fetch property types by transaction type (buy/rent/project)
 */
export const propertyType = pgTable('property_type', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 512 }),
  parentId: integer('parent_id'),
  transactionType: integer('transaction_type'),
  vietnamese: varchar('vietnamese'),
  slug: varchar('slug'),
  aactive: boolean('aactive').default(true),
});

/**
 * Folder table schema for news menu generation
 * Used to fetch news folders with parent-child hierarchy
 */
export const folder = pgTable('folder', {
  id: serial('id').primaryKey(),
  parent: integer('parent'),
  name: varchar('name', { length: 255 }),
  label: varchar('label', { length: 512 }),
  publish: char('publish', { length: 1 }),
  displayOrder: integer('display_order'),
});

// Type inference for TypeScript
export type PropertyTypeRow = typeof propertyType.$inferSelect;
export type FolderRow = typeof folder.$inferSelect;
