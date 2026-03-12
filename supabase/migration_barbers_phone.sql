-- הוספת טלפון לספרים + קישור להתחברות כעובד
-- הרץ ב-Supabase SQL Editor
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS phone TEXT;
CREATE INDEX IF NOT EXISTS idx_barbers_phone ON barbers(phone);

-- עדכון ספר קיים עם טלפון (אופציונלי - החלף במספר הרלוונטי):
-- UPDATE barbers SET phone = '0547267713' WHERE name = 'מוחמד מוסא';
