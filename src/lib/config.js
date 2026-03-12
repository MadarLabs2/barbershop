// מספר המספרה ליצירת קשר
export const BARBERSHOP_PHONE = '0547267713';
export const BARBERSHOP_PHONE_INTL = '+972547267713';

// דשבורד מנהל – URL לפתיחה מהאפליקציה (להגדיר אחרי שאירוח)
export const DASHBOARD_URL = null; // לדוגמה: 'https://yoursite.com/admin/dashboard.html'

// המרת מספר ישראלי לפורמט בינלאומי
export const toE164 = (phone) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return `+972${digits.slice(1)}`;
  }
  if (digits.startsWith('972')) {
    return `+${digits}`;
  }
  return `+972${digits}`;
};
