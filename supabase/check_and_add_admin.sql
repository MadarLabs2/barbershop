-- ============================================================
-- בדיקה והוספת אדמין – מספר 0547267713
-- הרץ ב-Supabase SQL Editor
-- ============================================================

-- 1. בדיקה: האם המשתמש קיים?
-- הרץ את זה כדי לראות את כל המשתמשים עם המספר:
SELECT id, phone, first_name, last_name, is_admin, created_at
FROM app_users
WHERE phone LIKE '%547267713%' OR phone LIKE '%0547267713%';

-- 2. הוספת המשתמש כאדמין (אם אינו קיים)
-- טלפון: 0547267713
INSERT INTO app_users (phone, first_name, last_name, is_admin)
VALUES ('0547267713', 'מנהל', 'מערכת', true)
ON CONFLICT (phone) DO UPDATE SET is_admin = true;

-- 3. עדכון למשתמש קיים – הפיכה לאדמין
UPDATE app_users SET is_admin = true
WHERE phone IN ('0547267713', '547267713', '972547267713');
