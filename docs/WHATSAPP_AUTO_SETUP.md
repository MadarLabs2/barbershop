# שליחת קודים אוטומטית ב-WhatsApp

כדי שהקוד ישלח אוטומטית ללקוח ב-WhatsApp מהמספר שלך (0547267713), צריך להגדיר Whapi.Cloud.

## שלב 1: הרשמה ל-Whapi.Cloud

1. היכנס ל-[Whapi.Cloud](https://whapi.cloud/) והירשם
2. צור Channel (ערוץ) וצמד את מספר ה-WhatsApp שלך דרך סריקת QR
3. העתק את ה-**API Token** מהדשבורד

## שלב 2: הפעלת Supabase Edge Function

התקן את Supabase CLI (אם עדיין לא):

```bash
npm install -g supabase
supabase login
```

חבר את הפרויקט:

```bash
cd /path/to/barbershop
supabase link
```

הגדר את ה-Token כ-Secret:

```bash
supabase secrets set WHAPI_TOKEN=YOUR_WHAPI_TOKEN_HERE
```

פרוס את ה-Function:

```bash
supabase functions deploy send-whatsapp-otp
```

## שלב 3: בדיקה

לאחר ההגדרה:
1. לקוח לוחץ "בקש קוד" באפליקציה
2. הקוד נשלח אוטומטית ללקוח ב-WhatsApp
3. הלקוח מזין את הקוד ומתחבר

## גיבוי ידני

אם ה-Function לא פרוס או ש-Whapi לא מוגדר – הבקשה תישמר ב-DB ותופיע בדף `admin/otp-panel.html`. אפשר לשלוח את הקוד ידנית.

## פתרון בעיות

**ההודעה לא נשלחת?** בדוק:

1. **Edge Function פרוס?** הרץ שוב:
   ```bash
   npx supabase functions deploy send-whatsapp-otp
   ```

2. **ה-Token נשמר?** הרץ:
   ```bash
   npx supabase secrets set WHAPI_TOKEN=הטוקן_שלך
   ```

3. **לוגים ב-Supabase:** Dashboard → Edge Functions → send-whatsapp-otp → Logs. חפש `Whapi error` או `WHAPI_TOKEN not set`.

4. **מגבלות Trial ב-Whapi:** בחשבון ניסיון יש 5 צ'אטים ו-150 הודעות ליום. ייתכן שצריך שהלקוח ישלח הודעה ראשונה למספר 0547267713 – אחרי זה תוכל לשלוח אליו.
