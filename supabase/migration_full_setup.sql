-- ============================================================
-- מיגרציה מלאה – סנכרון Database עם האפליקציה והדשבורד
-- הרץ ב-Supabase SQL Editor (אחרי schema + migration_appointments + migration_users + migration_branches_team)
-- ============================================================

-- 1. הרשאות לעדכון מהדשבורד (branches, services, barbers) – קריאה + כתיבה
DROP POLICY IF EXISTS "Anyone can view branches" ON branches;
DROP POLICY IF EXISTS "Allow all branches" ON branches;
CREATE POLICY "Allow all branches" ON branches FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view services" ON services;
DROP POLICY IF EXISTS "Allow all services" ON services;
CREATE POLICY "Allow all services" ON services FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view barbers" ON barbers;
DROP POLICY IF EXISTS "Allow all barbers" ON barbers;
CREATE POLICY "Allow all barbers" ON barbers FOR ALL USING (true) WITH CHECK (true);

-- 2. תורים – אישור INSERT לכולם (להזמנה דרך האפליקציה)
DROP POLICY IF EXISTS "Users can insert appointments" ON appointments;
CREATE POLICY "Allow insert appointments" ON appointments FOR INSERT WITH CHECK (true);

-- 3. הזנת נתוני התחלה (סניף, ספר, שירותים)
-- סניף דיר אל אסד
INSERT INTO branches (id, name, address) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'דיר אל אסד', NULL)
ON CONFLICT (id) DO NOTHING;

-- ספר – מוחמד מוסא (המנהל)
INSERT INTO barbers (id, name) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'מוחמד מוסא')
ON CONFLICT (id) DO NOTHING;

-- שירותים – תספורת ותספורת וזקן (duration = משך בדקות, לא שעה)
INSERT INTO services (id, name, price, duration)
SELECT 'c0000001-0000-0000-0000-000000000001', 'תספורת', 60, 40
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'תספורת');
INSERT INTO services (id, name, price, duration)
SELECT 'c0000002-0000-0000-0000-000000000002', 'תספורת וזקן', 70, 40
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'תספורת וזקן');

-- שיוך הספר לסניף
INSERT INTO branch_barbers (branch_id, barber_id) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001')
ON CONFLICT (branch_id, barber_id) DO NOTHING;
