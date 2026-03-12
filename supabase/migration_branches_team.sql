-- סניפים ↔ ספרים: איזה צוות עובד בכל סניף
CREATE TABLE IF NOT EXISTS branch_barbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(branch_id, barber_id)
);

-- ימי מנוחה לכל ספר (0=ראשון .. 6=שבת)
CREATE TABLE IF NOT EXISTS barber_rest_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(barber_id, day_of_week)
);

-- אדמין – משתמשים שמופיעים ברשימת האדמינים
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- RLS
ALTER TABLE branch_barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_rest_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view branch_barbers" ON branch_barbers FOR SELECT USING (true);
CREATE POLICY "Anyone can view barber_rest_days" ON barber_rest_days FOR SELECT USING (true);

-- עדכון ויצירה מהדשבורד (anon key – להגדיר לפי הצורך)
CREATE POLICY "Allow all branch_barbers" ON branch_barbers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all barber_rest_days" ON barber_rest_days FOR ALL USING (true) WITH CHECK (true);

-- אינדקסים
CREATE INDEX IF NOT EXISTS idx_branch_barbers_branch ON branch_barbers(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_barbers_barber ON branch_barbers(barber_id);
CREATE INDEX IF NOT EXISTS idx_barber_rest_days_barber ON barber_rest_days(barber_id);

-- הזנת אדמין ראשון (החלף במספר הטלפון של האדמין)
-- UPDATE app_users SET is_admin = true WHERE phone = '0547267713';
