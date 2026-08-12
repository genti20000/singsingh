ALTER TABLE submissions ADD COLUMN venue_id TEXT NOT NULL DEFAULT 'lkc';
--> statement-breakpoint
ALTER TABLE submissions ADD COLUMN event_id TEXT NOT NULL DEFAULT 'tonight';
--> statement-breakpoint
ALTER TABLE submissions ADD COLUMN first_name TEXT;
--> statement-breakpoint
ALTER TABLE submissions ADD COLUMN occasion_type TEXT NOT NULL DEFAULT 'star';
--> statement-breakpoint
ALTER TABLE submissions ADD COLUMN occasion_label TEXT;
--> statement-breakpoint
ALTER TABLE submissions ADD COLUMN occasion_detail TEXT;
--> statement-breakpoint
ALTER TABLE submissions ADD COLUMN featured INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE submissions ADD COLUMN featured_at TEXT;
--> statement-breakpoint
ALTER TABLE submissions ADD COLUMN reward_id TEXT;
--> statement-breakpoint
ALTER TABLE submissions ADD COLUMN reward_title TEXT;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_submissions_event_status ON submissions(event_id,status,created_at DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS venues (id TEXT PRIMARY KEY, name TEXT NOT NULL, logo TEXT, branding TEXT, settings TEXT);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, venue_id TEXT NOT NULL, title TEXT NOT NULL, event_type TEXT, start_time TEXT, end_time TEXT, active INTEGER NOT NULL DEFAULT 1, branding TEXT);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS rewards (id TEXT PRIMARY KEY, venue_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT, active INTEGER NOT NULL DEFAULT 1);
--> statement-breakpoint
INSERT OR IGNORE INTO venues (id,name,logo,branding,settings) VALUES ('lkc','London Karaoke Club','/london-karaoke-club-badge-v2.webp','{"accent":"#ffe23b","background":"#10091c"}','{"qr":"/","wallMode":"live"}');
--> statement-breakpoint
INSERT OR IGNORE INTO events (id,venue_id,title,event_type,active) VALUES ('tonight','lkc','Tonight at London Karaoke Club','open',1);
--> statement-breakpoint
INSERT OR IGNORE INTO rewards (id,venue_id,title,description,active) VALUES ('free-shot','lkc','FREE SHOT','Show this screen to the bar',1),('two-for-one','lkc','2-FOR-1 COCKTAIL','Available tonight only',1),('birthday-prosecco','lkc','FREE BIRTHDAY PROSECCO','For birthday SingShots',1),('cloakroom','lkc','FREE CLOAKROOM','Tonight only',1);
