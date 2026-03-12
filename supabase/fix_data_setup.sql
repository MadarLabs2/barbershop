-- ============================================================
-- תיקון נתונים – סניף דיר אל אסד, ספר מוחמד מוסא, טיפולים
-- הרץ ב-Supabase SQL Editor
-- ============================================================

-- 1. סניף דיר אל אסד (אם לא קיים)
INSERT INTO branches (id, name, address)
SELECT 'a0000001-0000-0000-0000-000000000001', 'דיר אל אסד', NULL
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'דיר אל אסד');

-- 2. ספר מוחמד מוסא (אם לא קיים)
INSERT INTO barbers (id, name)
SELECT 'b0000001-0000-0000-0000-000000000001', 'מוחמד מוסא'
WHERE NOT EXISTS (SELECT 1 FROM barbers WHERE name = 'מוחמד מוסא');

-- 3. טיפולים: תספורת, תספורת וזקן (אם לא קיימים)
INSERT INTO services (id, name, price, duration)
SELECT 'c0000001-0000-0000-0000-000000000001', 'תספורת', 60, 40
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'תספורת');

INSERT INTO services (id, name, price, duration)
SELECT 'c0000002-0000-0000-0000-000000000002', 'תספורת וזקן', 70, 40
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'תספורת וזקן');

-- עדכון מחיר ומשך לטיפולים הקיימים
UPDATE services SET price = 60, duration = 40 WHERE name = 'תספורת';
UPDATE services SET price = 70, duration = 40 WHERE name = 'תספורת וזקן';

-- 4. שיוך הספר לסניף – מוחמד מוסא עובד בדיר אל אסד
INSERT INTO branch_barbers (branch_id, barber_id)
SELECT b.id, br.id
FROM (SELECT id FROM branches WHERE name = 'דיר אל אסד' LIMIT 1) b,
     (SELECT id FROM barbers WHERE name = 'מוחמד מוסא' LIMIT 1) br
WHERE b.id IS NOT NULL AND br.id IS NOT NULL
ON CONFLICT (branch_id, barber_id) DO NOTHING;
