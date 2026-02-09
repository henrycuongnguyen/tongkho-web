import { pgTable, serial, varchar, text, boolean, timestamp, integer, bigint } from 'drizzle-orm/pg-core';

export const news = pgTable('news', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 500 }),
  description: text('description'),
  htmlcontent: text('htmlcontent'),
  avatar: varchar('avatar', { length: 500 }),
  folder: integer('folder'),
  publishOn: timestamp('publish_on'),
  createdOn: timestamp('created_on'),
  displayOrder: integer('display_order'),
  aactive: boolean('aactive').default(true),
  locations: bigint('locations', { mode: 'number' }),
  versionDocs: text('version_docs'),  // Project slug for linking to project detail page
});

export type NewsRow = typeof news.$inferSelect;
