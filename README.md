# Barbershop Appointment App

אפליקציית זימון תורים לספרים בנויה עם React Native, Expo, React Navigation, Context API ו-Hooks.

## תכונות

- 🏠 מסך בית עם סקירה כללית
- 📅 מערכת זימון תורים מלאה
- 📋 ניהול תורים (קרובים וקודמים)
- 👤 מסך פרופיל עם סטטיסטיקות
- 🎨 עיצוב מודרני עם תמיכה בעברית (RTL)

## התקנה

1. התקן את התלויות:
```bash
npm install
```

2. הפעל את האפליקציה:
```bash
npm start
```

3. סרוק את ה-QR code עם Expo Go או הפעל באמולטור:
- iOS: `npm run ios`
- Android: `npm run android`

## מבנה הפרויקט

```
barbershop/
├── App.js                 # נקודת הכניסה עם Navigation
├── src/
│   ├── context/
│   │   └── AppointmentsContext.js  # ניהול state עם Context API
│   └── screens/
│       ├── HomeScreen.js           # מסך בית
│       ├── BookingScreen.js        # מסך זימון תור
│       ├── AppointmentsScreen.js   # רשימת תורים
│       ├── AppointmentDetailsScreen.js  # פרטי תור
│       └── ProfileScreen.js        # מסך פרופיל
└── package.json
```

## טכנולוגיות

- **React Native** - Framework לבניית אפליקציות מובייל
- **Expo** - פלטפורמת פיתוח
- **React Navigation** - ניווט בין מסכים
- **Context API** - ניהול state גלובלי
- **React Hooks** - useState, useContext, ועוד

## שימוש

1. **זימון תור**: לחץ על "זימון תור" ובחר שירות, ספר, תאריך ושעה
2. **צפייה בתורים**: עבור ל"התורים שלי" כדי לראות את כל התורים
3. **ביטול תור**: פתח פרטי תור ולחץ על "בטל תור"

## פתרון בעיות

### שגיאת "EMFILE: too many open files"

אם אתה מקבל שגיאה זו ב-macOS, יש כמה פתרונות:

**פתרון זמני (כבר מוגדר בסקריפטים):**
הסקריפטים ב-`package.json` כבר מגדילים את המגבלה אוטומטית.

**פתרון קבוע:**
1. התקן watchman (מומלץ):
```bash
brew install watchman
```

2. או הגדר את המגבלה באופן קבוע ב-`~/.zshrc`:
```bash
echo "ulimit -n 10240" >> ~/.zshrc
source ~/.zshrc
```

## הערות

- האפליקציה משתמשת ב-Context API לניהול state
- כל המסכים משתמשים ב-Hooks
- העיצוב מותאם לעברית (RTL)
- צבעי הנושא: רקע כהה (#0a0a0a) וצבע אקסנט (#FF6B35)
