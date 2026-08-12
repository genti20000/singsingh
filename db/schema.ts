import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const submissions = sqliteTable('submissions', {
  id: text('id').primaryKey(), venueId: text('venue_id').notNull().default('lkc'), eventId: text('event_id').notNull().default('tonight'),
  mediaKey: text('media_key').notNull().unique(), mediaType: text('media_type',{enum:['image','video']}).notNull(),
  firstName: text('first_name'), caption: text('caption'), occasionType: text('occasion_type').notNull().default('star'),
  occasionLabel: text('occasion_label'), occasionDetail: text('occasion_detail'), shareConsent: integer('share_consent').notNull().default(0),
  status: text('status',{enum:['pending','approved','rejected']}).notNull().default('pending'),
  createdAt: text('created_at').notNull(), approvedAt: text('approved_at'), featured: integer('featured').notNull().default(0),
  featuredAt: text('featured_at'), rewardId: text('reward_id'), rewardTitle: text('reward_title'), isShared: integer('is_shared').notNull().default(0),
});
export const venues = sqliteTable('venues', { id: text('id').primaryKey(), name: text('name').notNull(), logo: text('logo'), branding: text('branding'), settings: text('settings') });
export const events = sqliteTable('events', { id: text('id').primaryKey(), venueId: text('venue_id').notNull(), title: text('title').notNull(), eventType: text('event_type'), startTime: text('start_time'), endTime: text('end_time'), active: integer('active').notNull().default(1), branding: text('branding') });
export const rewards = sqliteTable('rewards', { id: text('id').primaryKey(), venueId: text('venue_id').notNull(), title: text('title').notNull(), description: text('description'), active: integer('active').notNull().default(1) });
export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
});
