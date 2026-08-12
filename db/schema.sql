CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  venue_id TEXT NOT NULL DEFAULT 'lkc',
  event_id TEXT NOT NULL DEFAULT 'tonight',
  media_key TEXT NOT NULL UNIQUE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image','video')),
  first_name TEXT,
  caption TEXT,
  occasion_type TEXT NOT NULL DEFAULT 'star',
  occasion_label TEXT,
  occasion_detail TEXT,
  share_consent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  featured_at TEXT,
  reward_id TEXT,
  reward_title TEXT,
  is_shared INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_submissions_status_created ON submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_event_status ON submissions(event_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS venues (id TEXT PRIMARY KEY, name TEXT NOT NULL, logo TEXT, branding TEXT, settings TEXT);
CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, venue_id TEXT NOT NULL, title TEXT NOT NULL, event_type TEXT, start_time TEXT, end_time TEXT, active INTEGER NOT NULL DEFAULT 1, branding TEXT);
CREATE TABLE IF NOT EXISTS rewards (id TEXT PRIMARY KEY, venue_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT, active INTEGER NOT NULL DEFAULT 1);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
