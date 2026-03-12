-- טבלת חסימת תורים
CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  duration INTEGER DEFAULT 40,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocked_slots_barber_date ON blocked_slots(barber_id, date);

ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all blocked_slots" ON blocked_slots;
CREATE POLICY "Allow all blocked_slots" ON blocked_slots FOR ALL USING (true) WITH CHECK (true);
