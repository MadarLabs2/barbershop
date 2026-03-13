# שליחת קודים אוטומטית ב-WhatsApp (whatsapp-web.js)

שירות WhatsApp מבוסס **whatsapp-web.js** – סריקת QR לחיבור למספר ה-WhatsApp שלך, ללא Whapi או שירותי צד שלישי.

## ארכיטקטורה

```
┌──────────────────┐         ┌──────────────────────────┐         ┌─────────────────┐
│  אפליקציה        │         │  WhatsApp Service         │         │  Supabase        │
│  BarberShop      │  ───►   │  Node.js (port 3001)      │  ───►   │  otp_requests    │
│  (React Native)  │  /send-otp   whatsapp-web.js         │  insert │  (DB)            │
└──────────────────┘         └──────────────────────────┘         └─────────────────┘
```

## שלב 1: התקנה

```bash
cd barbershop/whatsapp
npm install
```

## שלב 2: הגדרת משתני סביבה

צור קובץ `.env` בשורש הפרויקט (או בתיקיית whatsapp):

```env
# Supabase – לשמירת קודי OTP
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# אופציונלי – אם יש בפרויקט כבר
WHATSAPP_PORT=3001
BARBERSHOP_PHONE=0547267713
```

## שלב 3: הפעלה

```bash
cd whatsapp
node service.js
```

בפעם הראשונה תופיע **QR Code** במסוף. סרוק אותו ב-WhatsApp:
- WhatsApp → הגדרות → מכשירים מקושרים → קשר מכשיר חדש

אחרי סריקה – השירות יישמר את הפעלה וכל בקשה תישלח אוטומטית.

## שלב 4: חיבור האפליקציה לשירות

האפליקציה צריכה להגיע לכתובת השירות.

**בפיתוח מקומי (הטלפון והמחשב ברשת אחת):**
1. מצא את ה-IP של המחשב: `ipconfig` (Windows) או `ifconfig` (Mac/Linux)
2. בקובץ `.env` (שורש הפרויקט):
   ```
   EXPO_PUBLIC_WHATSAPP_SERVICE_URL=http://192.168.1.X:3001
   ```
3. הפעל מחדש את האפליקציה

**בפרודקשן:**
1. פרוס את השירות על שרת (VPS, Railway, Render וכו')
2. הגדר:
   ```
   EXPO_PUBLIC_WHATSAPP_SERVICE_URL=https://whatsapp.yoursite.com
   ```

## API

| Endpoint | תיאור |
|----------|------|
| `POST /send-otp` | Body: `{ "phone": "0501234567" }` – שולח קוד OTP |
| `POST /send-reminder` | Body: `{ "phone_number": "...", "message_text": "..." }` – תזכורת |
| `GET /health` | בדיקת סטטוס – האם WhatsApp מחובר |

## גיבוי ידני

אם השירות לא פועל – הבקשה תישמר ב-Supabase ותופיע ב-`admin/otp-panel.html`. אפשר לשלוח את הקוד ידנית ב-WhatsApp.

## פתרון בעיות

**QR לא מופיע?** ודא ש-Puppeteer מותקן. ב-Linux עשוי להזדקק:
```bash
sudo apt-get install -y chromium-browser
```

**"WhatsApp not ready"?** סרוק שוב את ה-QR. אם כבר סרקת – בדוק שתיקיית `.wwebjs_auth` קיימת ולא פגומה.

**האפליקציה לא מגיעה לשירות?** בודקים:
1. `EXPO_PUBLIC_WHATSAPP_SERVICE_URL` מוגדר
2. המחשב והטלפון באותה רשת (בפיתוח)
3. Firewall מאפשר פורט 3001
