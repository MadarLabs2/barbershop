# חיבור Supabase למספרה

## התקנת חבילות

```bash
npm install
```

(החבילות `@supabase/supabase-js`, `react-native-url-polyfill`, `@react-native-async-storage/async-storage`, `dotenv` כבר רשומות ב-package.json)

---

## שלב 1: יצירת פרויקט ב-Supabase

1. היכנס ל-[supabase.com](https://supabase.com) והתחבר
2. לחץ **New Project**
3. מלא שם פרויקט, סיסמה ל-Database (שמור אותה!)
4. בחר Region (למשל Frankfurt לאירופה)
5. חכה כמה דקות עד שהפרויקט יהיה מוכן

## שלב 2: הרצת הסכמה

1. ב-Supabase Dashboard: **SQL Editor** → **New Query**
2. העתק את כל התוכן מקובץ `supabase/schema.sql` → **Run**
3. הרץ גם את `supabase/migration_users.sql` (טבלת משתמשים להרשמה/התחברות)

## שלב 3: קבלת מפתחות

1. ב-Dashboard: **Project Settings** (איקון גלגל) → **API**
2. העתק:
   - **Project URL**
   - **anon public** (מפתח ה-API הציבורי)

## שלב 4: הגדרת משתני סביבה

צור קובץ `.env` בשורש הפרויקט והדבק:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

החלף בכתובת ובמפתח האמיתיים מ-Supabase Dashboard.

**חשוב:** הקובץ `.env` כבר ב-.gitignore – אל תשתף אותו עם אחרים.

## שלב 5: הפעלה

הפעל מחדש את Expo (`npx expo start`) כדי שהקובץ `.env` ייטען.

---

## טבלאות שנוצרו

| טבלה | תיאור |
|------|--------|
| profiles | פרופיל משתמש (טלפון, שם, תאריך לידה) |
| branches | סניפים |
| services | שירותים ומחירים |
| barbers | ספרים |
| appointments | תורים |

## אבטחה (RLS)

הופעל Row Level Security – כל משתמש רואה רק את התורים והפרופיל שלו.
