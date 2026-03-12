-- סכמת Supabase למספרה
-- הרץ את הקובץ הזה ב-Supabase Dashboard: SQL Editor

-- טבלת משתמשים (פרופילים - מחוברת ל-auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  phone TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  birth_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת סניפים
CREATE TABLE IF NOT EXISTS branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  waze_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת שירותים
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת ספרים
CREATE TABLE IF NOT EXISTS barbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת תורים
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  barber_id UUID REFERENCES barbers(id),
  service_id UUID REFERENCES services(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- שמירת פרטים גם כטקסט (למקרה של מחיקה)
  service_name TEXT,
  barber_name TEXT,
  branch_name TEXT,
  price INTEGER
);

-- אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- RLS - Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;

-- פרופילים: משתמש רואה רק את עצמו
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- תורים: משתמש רואה ויוצר רק את שלו (user_id יכול להיות NULL לאורחים)
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
CREATE POLICY "Users can view own appointments" ON appointments
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert appointments" ON appointments;
CREATE POLICY "Users can insert appointments" ON appointments
  FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own appointments" ON appointments;
CREATE POLICY "Users can update own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = user_id);

-- סניפים, שירותים, ספרים - קריאה לכולם
DROP POLICY IF EXISTS "Anyone can view branches" ON branches;
CREATE POLICY "Anyone can view branches" ON branches FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view services" ON services;
CREATE POLICY "Anyone can view services" ON services FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view barbers" ON barbers;
CREATE POLICY "Anyone can view barbers" ON barbers FOR SELECT USING (true);

-- הזנת נתונים – רק מה שנדרש
-- סניף: דיר אל אסד
INSERT INTO branches (id, name, address) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'דיר אל אסד', NULL)
ON CONFLICT (id) DO NOTHING;

-- ספר: מוחמד מוסא
INSERT INTO barbers (id, name) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'מוחמד מוסא')
ON CONFLICT (id) DO NOTHING;

-- טיפולים: תספורת, תספורת וזקן (משך = דקות, לא שעה)
INSERT INTO services (id, name, price, duration) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'תספורת', 60, 40),
  ('c0000002-0000-0000-0000-000000000002', 'תספורת וזקן', 70, 40)
ON CONFLICT (id) DO NOTHING;
