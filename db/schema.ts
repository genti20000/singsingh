import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const submissions = sqliteTable('submissions', {
  id: text('id').primaryKey(), mediaKey: text('media_key').notNull().unique(),
  mediaType: text('media_type',{enum:['image','video']}).notNull(), caption: text('caption'),
  shareConsent: integer('share_consent').notNull().default(0),
  status: text('status',{enum:['pending','approved','rejected']}).notNull().default('pending'),
  createdAt: text('created_at').notNull(), approvedAt: text('approved_at'), isShared: integer('is_shared').notNull().default(0),
});
