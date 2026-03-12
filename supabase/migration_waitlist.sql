-- טבלת רשימת המתנה
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID REFERENCES barbers(id),
  client_name TEXT,
  client_phone TEXT,
  service_name TEXT,
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all waitlist" ON waitlist;
CREATE POLICY "Allow all waitlist" ON waitlist FOR ALL USING (true) WITH CHECK (true);
