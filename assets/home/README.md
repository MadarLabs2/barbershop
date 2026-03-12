# תמונות דף ראשי

שימו את התמונות שלכם בתיקייה הזו והחליפו את המקורות ב-`src/screens/HomeScreen.js`.

## מקומות מומלצים:

| קובץ | שימוש בדף |
|------|-----------|
| `video-thumb.jpg` | תמונת רקע לסרטון (לפני שהווידאו נטען) |
| `salon.jpg` | תמונת פנים המספרה (כרטיס מתהפך) |
| `hero.jpg` | תמונה גדולה עם כפתורי Waze ויצירת קשר |
| `gallery-1.jpg`, `gallery-2.jpg`... | גלריית "העבודה שלנו" |
| `product-1.jpg`, `product-2.jpg`... | תמונות מוצרים |

## דוגמה לשימוש ב-HomeScreen.js:

```javascript
// סרטון
const VIDEO_SOURCE = require('../../assets/home/salon-video.mp4');

// גלריה
const GALLERY_IMAGES = [
  require('../../assets/home/gallery-1.jpg'),
  require('../../assets/home/gallery-2.jpg'),
  require('../../assets/home/gallery-3.jpg'),
];

// מוצרים
const PRODUCTS = [
  { id: '1', name: 'BRILLIANT', price: 89.9, image: require('../../assets/home/product-1.jpg') },
  ...
];
```
