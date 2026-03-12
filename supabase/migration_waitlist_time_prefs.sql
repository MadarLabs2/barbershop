-- הוספת העדפות שעות לרשימת המתנה
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS prefer_morning BOOLEAN DEFAULT false;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS prefer_afternoon BOOLEAN DEFAULT false;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS prefer_evening BOOLEAN DEFAULT false;
