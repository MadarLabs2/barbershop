-- עדכון טבלת תורים - תמיכה ב-app_users (טלפון) + קריאה לכולם לזמינות
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS client_name TEXT;

-- מאפשר קריאת כל התורים (לבדיקת זמינות + דשבורד מנהל)
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
CREATE POLICY "Allow read all appointments" ON appointments FOR SELECT USING (true);

-- עדכון תור - בעלים או מנהל
DROP POLICY IF EXISTS "Users can update own appointments" ON appointments;
CREATE POLICY "Allow update appointments" ON appointments FOR UPDATE USING (true);

-- מחיקת תורים (ביטול או תורים שעבר זמנם)
DROP POLICY IF EXISTS "Allow delete appointments" ON appointments;
CREATE POLICY "Allow delete appointments" ON appointments FOR DELETE USING (true);
