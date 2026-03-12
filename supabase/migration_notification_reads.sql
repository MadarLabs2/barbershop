-- מעקב אחר התראות שנקראו לפי משתמש
CREATE TABLE IF NOT EXISTS notification_reads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_phone TEXT NOT NULL,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(notification_id, user_phone)
);

CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON notification_reads(user_phone);
CREATE INDEX IF NOT EXISTS idx_notification_reads_notification ON notification_reads(notification_id);

ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all notification_reads" ON notification_reads;
CREATE POLICY "Allow all notification_reads" ON notification_reads FOR ALL USING (true) WITH CHECK (true);
