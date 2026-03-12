-- טבלת משתמשים להרשמה/התחברות (ללא Supabase Auth)
-- הרץ ב-SQL Editor אם עדיין לא הרצת
CREATE TABLE IF NOT EXISTS app_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- אינדקס לחיפוש לפי טלפון
CREATE INDEX IF NOT EXISTS idx_app_users_phone ON app_users(phone);

-- RLS - כולם יכולים לראות/להוסיף (לאומת ניהול משתמשים)
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read app_users" ON app_users FOR SELECT USING (true);
CREATE POLICY "Allow insert app_users" ON app_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update own" ON app_users FOR UPDATE USING (true);
